"""Add the dashboard link to the five UBI markets (d695, Max 'yes go' 2026-09-30). Usage: python link_update.py [--go]"""
import json, subprocess, sys, time, urllib.request
import specs

GO = "--go" in sys.argv
import os
KEY = os.environ.get("MANIFOLD_API_KEY") or subprocess.run(["agent-secret", "get", "agent/manifold-api-key", "maxghenis"], capture_output=True, text=True).stdout.strip()
API = "https://api.manifold.markets/v0"
done = json.load(open("created.json"))
links = {"m1": done["m1_when_ubi"]["url"], "m2": done["m2_amount_ladder"]["url"], "m3": done["m3_guaranteed_floor"]["url"]}
LINE = {
    "m1_when_ubi": "The model and a 10-country dashboard built on it: [maxghenis.com/ubi-forecast](https://maxghenis.com/ubi-forecast/). Code, research and tests: [github.com/MaxGhenis/ubi-forecast](https://github.com/MaxGhenis/ubi-forecast).",
    "m2_amount_ladder": "The model and a 10-country dashboard built on it: [maxghenis.com/ubi-forecast](https://maxghenis.com/ubi-forecast/). Code, research and tests: [github.com/MaxGhenis/ubi-forecast](https://github.com/MaxGhenis/ubi-forecast).",
    "m3_guaranteed_floor": "The model and a 10-country dashboard built on it: [maxghenis.com/ubi-forecast](https://maxghenis.com/ubi-forecast/). Code, research and tests: [github.com/MaxGhenis/ubi-forecast](https://github.com/MaxGhenis/ubi-forecast).",
    "m4_ctc_no_earnings": "The model's code: [github.com/MaxGhenis/ubi-forecast](https://github.com/MaxGhenis/ubi-forecast) (model/ubi_model.py). Related: a 10-country UBI dashboard at [maxghenis.com/ubi-forecast](https://maxghenis.com/ubi-forecast/).",
    "m5_2028_primary_ubi": "Related: a 10-country UBI forecast dashboard at [maxghenis.com/ubi-forecast](https://maxghenis.com/ubi-forecast/).",
}
EDIT = "_Edited 30 Sep 2026: added links to the model and dashboard; resolution criteria unchanged._"

def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Key {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

for p in specs.build(links):
    key, mid = p["key"], done[p["key"]]["id"]
    live = call("GET", f"/market/{mid}?cb={int(time.time())}")
    text = live.get("textDescription") or ""
    # Guard: the live text must still start with what we published and still carry our note.
    import re
    first = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", p["descriptionMarkdown"].split("\n\n")[0]).replace("**", "").replace("_", "")
    ok = first[:80] in text and ("opening odds" in text.lower())
    new_md = p["descriptionMarkdown"] + "\n\n" + LINE[key] + "\n\n" + EDIT
    print(f"{key}: live-matches={ok} traders={live.get('uniqueBettorCount')} len {len(text)} -> {len(new_md)}")
    if not ok:
        print("   SKIP: live description differs from what we published; not overwriting"); continue
    if GO:
        call("POST", f"/market/{mid}/update", {"descriptionMarkdown": new_md})
        check = call("GET", f"/market/{mid}?cb={int(time.time())}")
        print("   updated; link present:", "maxghenis.com/ubi-forecast" in (check.get("textDescription") or ""))
        time.sleep(1)

"""Create the UBI slate on Manifold under MaxGhenis. Usage: python create.py [--go]  (default: dry run)."""
import json, subprocess, sys, time, urllib.request
from pathlib import Path
import specs

HERE = Path(__file__).parent
API = "https://api.manifold.markets/v0"
GO = "--go" in sys.argv
import os
KEY = os.environ.get("MANIFOLD_API_KEY") or subprocess.run(["agent-secret", "get", "agent/manifold-api-key", "maxghenis"], capture_output=True, text=True).stdout.strip()
assert KEY, "no Manifold API key"
CREATED = HERE / "created.json"
done = json.loads(CREATED.read_text()) if CREATED.exists() else {}

def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Key {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def create(key, links):
    if key in done:
        print("exists", key, done[key]["url"]); return done[key]
    p = next(x for x in specs.build(links) if x["key"] == key)
    body = {k: v for k, v in p.items() if k != "key"}
    if not GO:
        print("DRY", key, body["question"]); return {"id": f"dry-{key}", "url": f"https://manifold.markets/MaxGhenis/dry-{key}"}
    r = call("POST", "/market", body)
    done[key] = {"id": r["id"], "url": r["url"], "question": body["question"]}
    CREATED.write_text(json.dumps(done, indent=1))
    print("CREATED", key, r["url"]); time.sleep(1)
    return done[key]

m1 = create("m1_when_ubi", {})
m2 = create("m2_amount_ladder", {"m1": m1["url"]})
m3 = create("m3_guaranteed_floor", {"m1": m1["url"], "m2": m2["url"]})
create("m4_ctc_no_earnings", {})
create("m5_2028_primary_ubi", {})
links = {"m1": m1["url"], "m2": m2["url"], "m3": m3["url"]}
m1_full = next(x for x in specs.build(links) if x["key"] == "m1_when_ubi")["descriptionMarkdown"]
if GO:
    call("POST", f"/market/{m1['id']}/update", {"descriptionMarkdown": m1_full})
    print("UPDATED m1 companions")
    for k, v in done.items():
        m = call("GET", f"/market/{v['id']}?cb={int(time.time())}")
        probs = [(a["text"], round(a.get("probability", 0), 3)) for a in m.get("answers", [])] or round(m.get("probability", 0), 3)
        print("CHECK", k, m["outcomeType"], probs, "close", m.get("closeTime"), "groups", len(m.get("groupSlugs") or []))

"""Note revision 2 on the three markets whose opening odds came from the model (d729, Max 'Review, then ship').

Appends one edit line to m1-m3; the rest of each description is re-sent exactly as published on 30 Sep.
Usage: python revision_update.py [--go]
"""
import json, re, subprocess, sys, time, urllib.request, os
GO = "--go" in sys.argv
sys.argv = [a for a in sys.argv if a != "--go"]   # link_update runs its own loop on import; keep it a dry run
import specs
from link_update import LINE, EDIT, call, done, links
NEW = ("_Edited 1 Oct 2026: the opening odds came from revision 1 of the model. Revision 2, now at the dashboard link, "
       "gives a US UBI worth $6,000 a year 4.0% by 2040 (revision 1: 9.6%). Resolution criteria unchanged._")
for p in specs.build(links):
    key = p["key"]
    if key not in ("m1_when_ubi", "m2_amount_ladder", "m3_guaranteed_floor"):
        continue
    mid = done[key]["id"]
    live = call("GET", f"/market/{mid}?cb={int(time.time())}")
    text = live.get("textDescription") or ""
    ok = EDIT.strip("_") in text and "maxghenis.com/ubi-forecast" in text and "Edited 1 Oct 2026" not in text
    new_md = p["descriptionMarkdown"] + "\n\n" + LINE[key] + "\n\n" + EDIT + "\n\n" + NEW
    print(f"{key}: live-matches={ok} traders={live.get('uniqueBettorCount')}")
    if ok and GO:
        call("POST", f"/market/{mid}/update", {"descriptionMarkdown": new_md})
        check = call("GET", f"/market/{mid}?cb={int(time.time())}").get("textDescription") or ""
        print("   updated; note present:", "Edited 1 Oct 2026" in check, "| earlier edit kept:", EDIT.strip("_") in check)
        time.sleep(1)

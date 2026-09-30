"""Snapshot Manifold markets that ask something close to the dashboard's question -> src/markets.json.

Each entry maps the market to the nearest question the model can express:
countries (ISO3 list or "all"), threshold index t (0: 1.1% of GDP per head,
the smallest qualifying program; 2: 6.7%; 3: 15%), and a horizon year.
"""
import datetime, json, urllib.request
from pathlib import Path

G7 = ["USA", "GBR", "CAN", "DEU", "FRA", "JPN", "ITA"]
OECD_HERE = ["USA", "GBR", "CAN", "DEU", "FRA", "ESP", "JPN", "KOR", "AUS"]
SPECS = [
  ("NoAnswer/when-will-usa-have-ubi", "sum:2025-2029,2030-2035,2036-2040", "by 2040", "Any nationwide UBI; no minimum amount.", ["USA"], 0, 2040, "US, smallest qualifying program, by 2040."),
  ("vicli/will-an-ubi-universal-basic-income-5acc5bf6c22d", "prob", "before 2040", "A 'full UBI' that covers basic living costs.", ["USA"], 3, 2039, "US, 15% of GDP per head (about $13,500), by 2039."),
  ("JaundicedBaboon/will-the-united-states-government-i", "prob", "before 2040", "Unconditional fixed payments to every adult citizen; no minimum amount.", ["USA"], 0, 2039, "US, smallest qualifying program, by 2039."),
  ("YakshBirla/will-universal-basic-income-be-intr", "prob", "by 2030", "Loosely defined 'introduced'.", ["USA"], 0, 2030, "US, smallest qualifying program, by 2030."),
  ("vicli/will-an-ubi-universal-basic-income", "prob", "before 2030", "Partial UBI counts; its text says 2040 in one place.", ["USA"], 0, 2029, "US, smallest qualifying program, by 2029."),
  ("MaxGhenis/when-will-the-us-enact-a-universal", "sum:2026–2028,2029–2032,2033–2036,2037–2040", "by 2040", "Max's market: at least $500 a month per adult, same definition as this dashboard. Opened at this model's odds.", ["USA"], 2, 2040, "US, 6.7% of GDP per head ($6,000), by 2040."),
  ("MaxGhenis/by-the-end-of-2036-will-the-us-enac", "answer:$1,000/year", "$1,000+ by 2036", "Max's ladder market, $1,000 rung. Opened at this model's odds.", ["USA"], 0, 2036, "US, smallest qualifying program (about $1,000), by 2036."),
  ("Nostr0m/will-universal-basic-income-be-impl", "prob", "by the end of 2028", "Any G7 member (or the EU) pays at least 90% of adults a regular unconditional amount above its poverty line.", G7, 3, 2028, "G7 members in this dashboard, 15% of GDP per head (the closest threshold to a poverty-line income), by 2028."),
  ("alby/will-any-oecd-country-effectively-i", "prob", "before 2033", "Any OECD country, 'a form of UBI'.", OECD_HERE, 0, 2032, "The 9 OECD members in this dashboard (of 38), smallest qualifying program, by 2032."),
  ("vicli/will-any-country-implement-a-ubi-un", "prob", "before 2040", "Any country, 'full UBI' covering basic living costs.", "all", 3, 2039, "The 10 countries here (not every country), 15% of GDP per head, by 2039."),
  ("vicli/will-any-eu-country-implement-a-ubi", "prob", "before 2040", "Any EU member, 'full UBI'.", ["DEU", "FRA", "ESP", "ITA"], 3, 2039, "EU members in this dashboard, 15% of GDP per head, by 2039."),
]

def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "ubi-dashboard"}), timeout=30))

out = []
for path, how, horizon, definition, countries, t, year, note in SPECS:
    m = get(f"https://api.manifold.markets/v0/slug/{path.split('/', 1)[1]}")
    if how == "prob":
        p = m["probability"]
    elif how.startswith("sum:"):
        want = set(how[4:].split(","))
        p = sum(a["probability"] for a in m["answers"] if a["text"].replace("–", "-") in {w.replace("–", "-") for w in want})
    else:
        p = next(a["probability"] for a in m["answers"] if a["text"] == how.split(":", 1)[1])
    out.append({"question": m["question"], "url": m["url"], "platform": "Manifold", "traders": str(m.get("uniqueBettorCount", "?")),
                "price": f"{round(100 * p)}% {horizon}", "definition": definition,
                "model": {"countries": countries, "t": t, "year": year, "note": note}})
    print(f"{round(100*p):>3}%  {m.get('uniqueBettorCount'):>4}  {m['question'][:80]}")
dest = Path(__file__).resolve().parent.parent / "src" / "markets.json"
dest.write_text(json.dumps({"asOf": datetime.date.today().isoformat(), "markets": out}, indent=1, ensure_ascii=False))

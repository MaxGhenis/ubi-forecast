"""Trigger levels, current GDP status and historical episodes, from FRED and IBGE (fetched 2026-09-30).

Episode test: the 12-month average unemployment rate rises at least 3.0 points above its value
24 months earlier. For each episode's first month, real GDP (latest quarter at or before that
month) is compared with its previous peak: below = recession; at or above = jobless growth.
"""
import csv, json
from pathlib import Path

C = {"USA": ("UNRATE", "GDPC1"), "GBR": ("LRHUTTTTGBM156S", "NGDPRSAXDCGBQ"), "CAN": ("LRHUTTTTCAM156S", "NGDPRSAXDCCAQ"),
     "DEU": ("LRHUTTTTDEM156S", "CLVMNACSCAB1GQDE"), "FRA": ("LRHUTTTTFRM156S", "CLVMNACSCAB1GQFR"), "ESP": ("LRHUTTTTESM156S", "CLVMNACSCAB1GQES"),
     "JPN": ("LRHUTTTTJPM156S", "JPNRGDPEXP"), "KOR": ("LRHUTTTTKRM156S", "NGDPRSAXDCKRQ"), "AUS": ("LRHUTTTTAUM156S", "NGDPRSAXDCAUQ"),
     "BRA": ("IBGE PNAD 6381", "NGDPRSAXDCBRQ")}

def fred(sid):
    rows = list(csv.reader(open(f"{sid}.csv")))[1:]
    return [(d[:7], float(v)) for d, v in rows if v not in ("", ".")]

def ibge():
    d = json.load(open("br_unemp.json"))[1:]
    return [(f"{r['D3C'][:4]}-{r['D3C'][4:]}", float(r["V"])) for r in d]

out = {}
for iso, (u_id, g_id) in C.items():
    u = ibge() if iso == "BRA" else fred(u_id)
    g = fred(g_id)
    y25 = [v for d, v in u if d.startswith("2025")]
    base = sum(y25) / len(y25)
    last12 = [v for _, v in u[-12:]]
    gdp_peak_prior = max(v for d, v in g[:-1])
    rec = {"series": u_id, "gdp_series": g_id, "months_2025": len(y25), "avg_2025": round(base, 2), "trigger_level": round(base + 3, 1),
           "latest": u[-1], "latest_12m_avg": round(sum(last12) / 12, 2), "gdp_latest": g[-1], "gdp_at_or_above_prior_peak": g[-1][1] >= gdp_peak_prior,
           "u_start": u[0][0]}
    # Historical episodes.
    ma = []
    for i in range(11, len(u)):
        ma.append((u[i][0], sum(v for _, v in u[i - 11:i + 1]) / 12))
    gq = {d: v for d, v in g}
    def gdp_at(month):
        cands = [(d, v) for d, v in g if d <= month]
        return cands[-1] if cands else None
    episodes, in_ep = [], False
    for i in range(24, len(ma)):
        d, v = ma[i]
        hit = v >= ma[i - 24][1] + 3.0
        if hit and not in_ep:
            cur = gdp_at(d)
            if cur:
                prior_peak = max(val for dd, val in g if dd < cur[0]) if any(dd < cur[0] for dd, _ in g) else cur[1]
                episodes.append({"first_month": d, "ma12": round(v, 2), "ma12_24m_earlier": round(ma[i - 24][1], 2),
                                 "gdp_vs_prior_peak_pct": round(100 * (cur[1] / prior_peak - 1), 2), "jobless_growth": cur[1] >= prior_peak})
            in_ep = True
        elif not hit:
            in_ep = False
    rec["episodes"] = episodes
    out[iso] = rec
Path("triggers.json").write_text(json.dumps(out, indent=1))
for iso, r in out.items():
    eps = r["episodes"]
    print(f"{iso}: 2025 avg {r['avg_2025']} ({r['months_2025']} mo) -> trigger {r['trigger_level']}; latest {r['latest']}; GDP at peak: {r['gdp_at_or_above_prior_peak']}; "
          f"history from {r['u_start']}: {len(eps)} episodes, jobless-growth {sum(e['jobless_growth'] for e in eps)} "
          + "; ".join(f"{e['first_month']}({'JG' if e['jobless_growth'] else 'rec'} {e['gdp_vs_prior_peak_pct']}%)" for e in eps))

"""Fit no-shock endorsement rates from the verified 2000-2026 record (record.json).

Method (empirical Bayes, gamma-Poisson, by government type):
- A period is at risk of a NEW endorsement unless an endorsement was already standing when it began.
  Exposure is the period's length in years; a period in which a new endorsement began counts half
  its length (the date within the period is not modeled). Every period since 2000 was a no-shock one.
- For each type t, country c has a yearly hazard lambda_ct ~ Gamma(a_t, b_t); new endorsements in c
  are Poisson(lambda_ct * exposure_ct). a_t, b_t maximise the negative-binomial marginal likelihood
  across the ten countries. With no events of a type anywhere, the prior mean is not identified, so
  that type uses Gamma(0.5, 0) (Jeffreys) pooled across countries.
- Each country's posterior Gamma(a + events, b + exposure) gives the per-term chance
  1 - exp(-lambda * termYears); its 5th percentile, mode and 95th percentile become the PERT range.

Writes fit.json (ranges and the case counts) and prints a summary. Deterministic.
"""
import json
import math
from pathlib import Path

import numpy as np
from scipy import optimize, special, stats

HERE = Path(__file__).resolve().parent
REC = json.loads((HERE / "record.json").read_text())
TERM = {"USA": 4, "GBR": 5, "CAN": 4, "DEU": 4, "FRA": 5, "ESP": 4, "BRA": 4, "KOR": 4, "JPN": 4, "AUS": 3}


def years(start, end):
    def ym(x):
        if x in (None, "", "ongoing"):
            return 2026 + 9 / 12
        y, m = x.split("-")[:2]
        return int(y) + (int(m) - 1) / 12
    return max(0.0, ym(end) - ym(start))


counts = {t: {} for t in "LRO"}
for c in REC:
    iso = c["iso"]
    for t in "LRO":
        counts[t].setdefault(iso, [0, 0.0])
    for p in c["periods"]:
        t, v = p["type"], p["endorsement"]
        if v == "yes-standing":
            continue
        yrs = years(p["start"], p["end"])
        if v == "yes-new":
            counts[t][iso][0] += 1
            counts[t][iso][1] += yrs / 2
        else:
            counts[t][iso][1] += yrs


def fit_type(rows):
    k = np.array([r[0] for r in rows], float)
    e = np.array([r[1] for r in rows], float)
    if k.sum() == 0:
        return 0.5, 0.0, "Jeffreys Gamma(0.5, 0); no events of this type"
    def nll(theta):
        a, b = np.exp(theta)
        ll = special.gammaln(a + k) - special.gammaln(a) - special.gammaln(k + 1) + a * np.log(b / (b + e)) + k * np.log(e / (b + e) + 1e-300)
        return -ll.sum()
    best = min((optimize.minimize(nll, x0, method="Nelder-Mead") for x0 in ([0, 3], [-1, 2], [1, 4], [-2, 1])), key=lambda r: r.fun)
    a, b = np.exp(best.x)
    return float(a), float(b), "negative-binomial marginal likelihood"


out = {"method": __doc__.strip().splitlines()[0], "types": {}, "countries": {}}
for t in "LRO":
    rows = [counts[t][iso] for iso in TERM]
    a, b, how = fit_type(rows)
    out["types"][t] = {"a": a, "b": b, "how": how, "events": int(sum(r[0] for r in rows)), "exposure_years": round(sum(r[1] for r in rows), 1)}
    for iso, term in TERM.items():
        k, e = counts[t][iso]
        post = stats.gamma(a + k, scale=1 / (b + e)) if (b + e) > 0 else None
        if post is None:
            continue
        per_term = lambda lam: 1 - math.exp(-lam * term)
        lam_mode = max((a + k - 1) / (b + e), 0.0)
        lo, hi = per_term(post.ppf(0.05)), per_term(post.ppf(0.95))
        mode = min(max(per_term(lam_mode), lo), hi)
        out["countries"].setdefault(iso, {})[f"{t}_normal"] = {
            "lo": round(lo, 4), "mode": round(mode, 4), "hi": round(hi, 4), "events": k, "exposure_years": round(e, 1)}
(HERE / "fit.json").write_text(json.dumps(out, indent=1))
for t, v in out["types"].items():
    print(t, v)
for iso, v in out["countries"].items():
    print(iso, {k: (x["lo"], x["mode"], x["hi"], x["events"], x["exposure_years"]) for k, x in v.items()})

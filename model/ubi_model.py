"""Decomposed forecast of US universal basic income adoption, 2026-2050.

A Radiant-style map run as a Monte Carlo simulation. Every uncertain input is a
range (low, mode, high): a prior, drawn from a PERT distribution. Each simulated
history carries its own draw of the inputs, so averaging over histories
integrates the input uncertainty out and gives one probability per question.
The model's uncertainty about its inputs is reported as conditional probabilities
(signposts; low vs. high third of each input), never as intervals on a probability.

Structure (cause -> effect):
  AI labor shock onset year --(political lag)--> demand state each year
  Party control each Congress (2027-28 and 2029-30 from real-money markets,
      later Congresses from recent base rates, midterm retention)
  demand state x party control --> yearly hazard that a universal recurring
      cash payment is enacted, plus its amount; later ratchets can raise it
  --> outputs for the five Manifold markets (see OUTPUTS at the bottom)

Every input carries an evidence note. Inputs with no market or data anchor are
labeled JUDGMENT. Snapshot date: 2026-09-29.
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
YEARS = np.arange(2026, 2051)          # calendar years simulated (2026 = rest of this year)
CONGRESS_START = np.arange(2027, 2051, 2)


@dataclass
class Rng3:
    """A Radiant-style range: 'between lo and hi, probably around mode'."""
    lo: float
    mode: float
    hi: float
    note: str
    anchor: str = "JUDGMENT"

    def sample(self, rng: np.random.Generator, n: int) -> np.ndarray:
        # PERT: beta distribution with mean (lo + 4*mode + hi) / 6.
        if self.hi == self.lo:
            return np.full(n, self.lo)
        a = 1 + 4 * (self.mode - self.lo) / (self.hi - self.lo)
        b = 1 + 4 * (self.hi - self.mode) / (self.hi - self.lo)
        return self.lo + (self.hi - self.lo) * rng.beta(a, b, n)


INPUTS: dict[str, Rng3] = {
    # --- AI labor shock: cumulative probability of onset by the end of each year ---
    # "Shock" = sustained, economist-attributed AI displacement worth >= ~3 pp of
    # unemployment (or an equal employment-rate drop). UNRATE was 4.1% in Aug 2026 (FRED).
    "shock_by_2028": Rng3(0.04, 0.08, 0.15,
        "Onset by end-2028.",
        "Manifold ACX 'visible break in US macro trend attributed to AI by 2028' 30% (643 traders), "
        "but that also counts positive GDP or productivity breaks, so the unemployment part is well below it."),
    "shock_by_2030": Rng3(0.10, 0.18, 0.28,
        "Onset by end-2030.",
        "Manifold 'AI causes US unemployment > 10% before 2030' 23% (175 traders; needs >= 3 pp "
        "attributable to AI), discounted for Manifold's pro-AI skew."),
    "shock_by_2035": Rng3(0.20, 0.33, 0.48,
        "Onset by end-2035.",
        "Manifold AGI series (RemNi): 58% before 2032, 63% before 2035; times P(shock | AGI) about 0.5-0.6."),
    "shock_by_2040": Rng3(0.28, 0.43, 0.60,
        "Onset by end-2040.",
        "Manifold 'AGI before 2040' 72% (98 traders) times P(shock | AGI) about 0.6."),
    "shock_by_2050": Rng3(0.35, 0.55, 0.75,
        "Onset by end-2050.",
        "Manifold 'AGI before 2048' 87%; '>97% of jobs automated before 2075' 63%."),
    "politics_lag_years": Rng3(0.0, 1.0, 2.0,
        "Years between shock onset and it driving legislation (rounded).",
        "JUDGMENT; the 2020 CARES Act passed within weeks, but a permanent program needs a sustained shock."),

    # --- Party control (probability of a trifecta for each Congress) ---
    "p_R_trifecta_2027": Rng3(0.03, 0.05, 0.08,
        "R trifecta in 2027-28 (a D trifecta is impossible with an R president).",
        "Polymarket 2026: House D 92.5%, Senate D 62.5% (fetched 2026-09-29); correlated."),
    "p_D_trifecta_2029": Rng3(0.22, 0.32, 0.42,
        "D trifecta in 2029-30.",
        "Polymarket 2028 presidency D 64.5% x P(House and Senate | D president) about 0.5."),
    "p_R_trifecta_2029": Rng3(0.10, 0.16, 0.24,
        "R trifecta in 2029-30.",
        "Polymarket 2028 presidency R 34.5% x P(House and Senate | R president) about 0.45-0.5."),
    "p_D_trifecta_later": Rng3(0.22, 0.32, 0.42,
        "D trifecta after each presidential election from 2032 on.",
        "Recent base rate: a trifecta started 6 of the 7 presidential terms from 2001 to 2025 (D twice, R four times)."),
    "p_R_trifecta_later": Rng3(0.22, 0.32, 0.42,
        "R trifecta after each presidential election from 2032 on.",
        "Same base rate as the D input."),
    "p_keep_trifecta_midterm": Rng3(0.10, 0.25, 0.45,
        "A trifecta survives the midterm.",
        "Of the six trifectas that started a presidential term from 1993 to 2021, only the 2001 one survived its midterm (2002); 1994, 2006, 2010, 2018 and 2022 each flipped a chamber."),

    # --- Endorsement: P(the President or the governing party's platform endorses a qualifying UBI within a
    #     4-year term), by control and whether the shock is under way. Observable: statements, platforms. ---
    "e_D_normal": Rng3(0.002, 0.01, 0.03, "D trifecta endorses, no shock.", "DATA: no strict-UBI endorsement by any of the ten governments in about 75 terms since 2000."),
    "e_R_normal": Rng3(0.001, 0.004, 0.012, "R trifecta endorses, no shock.", "DATA: same record."),
    "e_div_normal": Rng3(0.001, 0.004, 0.012, "The President endorses under divided government, no shock.", "DATA: same record."),
    "e_D_shock": Rng3(0.35, 0.6, 0.85, "D trifecta endorses during a shock.", "JUDGMENT: no trigger-type shock in the record."),
    "e_R_shock": Rng3(0.1, 0.35, 0.65, "R trifecta endorses during a shock.", "JUDGMENT."),
    "e_div_shock": Rng3(0.15, 0.4, 0.7, "The President endorses under divided government during a shock.", "JUDGMENT."),
    # --- Passage: P(an endorsed UBI becomes law within the term), by control. Observable: public law. ---
    "pass_D": Rng3(0.35, 0.55, 0.75, "An endorsed UBI passes under a D trifecta.", "DATA: about half of US trifectas' flagship priorities since 1993 passed."),
    "pass_R": Rng3(0.35, 0.55, 0.75, "An endorsed UBI passes under an R trifecta.", "DATA: same record."),
    "pass_div": Rng3(0.03, 0.10, 0.20, "An endorsed UBI passes under divided government.", "JUDGMENT."),

    # --- Amount at enactment, per adult per year in 2026 dollars (lognormal median) ---
    "amount_median_normal": Rng3(1000, 2000, 3500,
        "Median amount if enacted without a shock.",
        "JUDGMENT; dividend-scale programs (the Alaska PFD is about $1,000)."),
    "amount_median_shock": Rng3(4000, 8000, 14000,
        "Median amount if enacted during a shock.",
        "JUDGMENT; Yang's Freedom Dividend was $12,000 (2020 dollars)."),
    "ratchet_per_year": Rng3(0.05, 0.12, 0.25,
        "Yearly chance a trifecta raises an existing program during a shock.", "JUDGMENT."),

    # --- Guaranteed floor (NIT allowed) beyond a UBI, per 4-year term ---
    "q_floor_D_normal": Rng3(0.003, 0.01, 0.03, "Means-tested floor >= $6k for childless adults, D, normal.", "JUDGMENT."),
    "q_floor_R_normal": Rng3(0.0, 0.002, 0.008, "Same, R, normal.", "JUDGMENT."),
    "q_floor_D_shock": Rng3(0.05, 0.12, 0.25, "Same, D, shock.", "JUDGMENT."),
    "q_floor_R_shock": Rng3(0.02, 0.05, 0.12, "Same, R, shock.", "JUDGMENT."),
    "q_floor_div_shock": Rng3(0.005, 0.02, 0.05, "Same, divided, shock.", "JUDGMENT."),

    # --- Fully refundable CTC with no earnings requirement, per 2-year Congress ---
    "q_ctc_D": Rng3(0.25, 0.45, 0.65,
        "A D trifecta Congress enacts it.",
        "JUDGMENT; ARPA did it for TY2021, and extending it failed in 2021-22 with 50 Senate seats."),
    "q_ctc_R": Rng3(0.005, 0.015, 0.04, "An R trifecta Congress enacts it.", "JUDGMENT; the 2025 law kept the earnings phase-in."),
    "q_ctc_div": Rng3(0.002, 0.005, 0.015,
        "A divided Congress enacts it.",
        "JUDGMENT; the 2024 Wyden-Smith deal used a lookback, which wouldn't count."),
    "p_ctc_same_tax_year": Rng3(0.4, 0.6, 0.8,
        "Share of enactments that apply to the enactment year (as ARPA did).", "JUDGMENT."),

    # --- Standalone node for market 5 ---
    "p_2028_primary_winner_backs_ubi": Rng3(0.04, 0.10, 0.20,
        "Some 2028 D or R primary or caucus winner backed a UBI since 2025.",
        "JUDGMENT; Yang has floated a 2028 run (unverified), and most frontrunners haven't endorsed a UBI."),
}


def per_year(q_term: np.ndarray, years_in_term: float = 4.0) -> np.ndarray:
    return 1 - (1 - q_term) ** (1 / years_in_term)


def simulate(n_param: int = 200_000, n_scen: int = 5, seed: int = 20260929) -> dict:
    rng = np.random.default_rng(seed)
    P = {k: v.sample(rng, n_param) for k, v in INPUTS.items()}
    M = n_param * n_scen
    pid = np.repeat(np.arange(n_param), n_scen)            # parameter-draw index of each sim
    p = {k: v[pid] for k, v in P.items()}

    # AI shock onset: piecewise-linear CDF through the cumulative anchors (forced monotone).
    # Each anchor is "onset by the END of year Y", i.e. before Y+1.0; no shock before Oct 2026.
    anchor_years = np.array([2026.75, 2029, 2031, 2036, 2041, 2051], dtype=float)
    cum = np.stack([np.zeros(M), p["shock_by_2028"], p["shock_by_2030"], p["shock_by_2035"],
                    p["shock_by_2040"], p["shock_by_2050"]], axis=1)
    cum = np.maximum.accumulate(cum, axis=1)
    u = rng.random(M)
    onset = np.full(M, np.inf)
    for j in range(1, len(anchor_years)):
        lo_c, hi_c = cum[:, j - 1], cum[:, j]
        hit = np.isinf(onset) & (u < hi_c)
        frac = np.where(hi_c > lo_c, (u - lo_c) / np.maximum(hi_c - lo_c, 1e-12), 0)
        onset[hit] = anchor_years[j - 1] + frac[hit] * (anchor_years[j] - anchor_years[j - 1])
    lag = np.rint(p["politics_lag_years"])
    shock_from = np.ceil(onset) + lag                        # first calendar year the shock drives politics

    # Party control per Congress: 0 = divided, 1 = D trifecta, 2 = R trifecta.
    ctrl = {}
    r = rng.random(M)
    ctrl[2027] = np.where(r < p["p_R_trifecta_2027"], 2, 0)
    r = rng.random(M)
    ctrl[2029] = np.select([r < p["p_D_trifecta_2029"], r < p["p_D_trifecta_2029"] + p["p_R_trifecta_2029"]], [1, 2], 0)
    for c in CONGRESS_START[2:]:
        if (c - 2029) % 4 == 2:                               # midterm Congress
            keep = rng.random(M) < p["p_keep_trifecta_midterm"]
            ctrl[c] = np.where(keep, ctrl[c - 2], 0)
        else:                                                 # presidential Congress
            pD, pR = p["p_D_trifecta_later"], p["p_R_trifecta_later"]
            s = np.maximum(pD + pR, 0.9) / 0.9                # keep D + R <= 0.9
            r = rng.random(M)
            ctrl[c] = np.select([r < pD / s, r < (pD + pR) / s], [1, 2], 0)

    def control_in(year: int) -> np.ndarray:
        if year < 2027:
            return np.full(M, 2)                              # R trifecta through Jan 3, 2027 (lame duck)
        return ctrl[year - ((year - 2027) % 2)]

    amount = np.zeros(M)                                     # current program amount (0 = none)
    endorsed = np.full(M, -1)                                # control type that endorsed a UBI (-1 = none)
    first_endorse = np.full(M, 9999)
    first_year_at = {t: np.full(M, 9999) for t in (1000, 3000, 6000, 12000)}
    floor_year = np.full(M, 9999)
    ctc_year = np.full(M, 9999)                              # enactment year
    enact_state = np.full(M, -1)                             # 0 normal / 1 shock, at first >= $6k
    enact_ctrl = np.full(M, -1)

    for y in YEARS:
        if y == 2026:
            continue                                          # rest of 2026: lame-duck R trifecta, set to 0
        shock = y >= shock_from
        c = control_in(y)
        isD, isR, isDiv = c == 1, c == 2, c == 0

        # A new type of control must endorse anew; then endorsement, then passage (never both in one year).
        endorsed = np.where((endorsed >= 0) & (endorsed != c), -1, endorsed)
        e = np.select([isD & ~shock, isR & ~shock, isDiv & ~shock, isD & shock, isR & shock],
                      [p["e_D_normal"], p["e_R_normal"], p["e_div_normal"], p["e_D_shock"], p["e_R_shock"]], p["e_div_shock"])
        pz = np.select([isD, isR], [p["pass_D"], p["pass_R"]], p["pass_div"])
        u_e, u_p = rng.random(M), rng.random(M)
        open_ = amount == 0
        do_endorse = open_ & (endorsed < 0) & (u_e < per_year(e))
        new = open_ & (endorsed >= 0) & (u_p < per_year(pz))
        endorsed = np.where(do_endorse, c, endorsed)
        first_endorse = np.where(do_endorse & (first_endorse == 9999), y, first_endorse)
        med = np.where(shock, p["amount_median_shock"], p["amount_median_normal"])
        sig = np.where(shock, 0.5, 0.6)
        draw = med * np.exp(sig * rng.standard_normal(M))
        amount = np.where(new, np.maximum(draw, 1000), amount)   # a qualifying program is >= $1k

        up = (amount > 0) & shock & ~isDiv & (rng.random(M) < p["ratchet_per_year"])
        redraw = p["amount_median_shock"] * np.exp(0.5 * rng.standard_normal(M))
        amount = np.where(up, np.maximum(amount, redraw), amount)

        for t, arr in first_year_at.items():
            hit = (amount >= t) & (arr == 9999)
            if t == 6000:
                enact_state[hit] = shock[hit].astype(int)
                enact_ctrl[hit] = c[hit]
            arr[hit] = y

        q_fl = np.select([isD & ~shock, isR & ~shock, isD & shock, isR & shock, isDiv & shock],
                         [p["q_floor_D_normal"], p["q_floor_R_normal"], p["q_floor_D_shock"],
                          p["q_floor_R_shock"], p["q_floor_div_shock"]], 0.0)
        fl_hit = (floor_year == 9999) & ((rng.random(M) < per_year(q_fl)) | (amount >= 6000))
        floor_year[fl_hit] = y

        q_ct = np.select([isD, isR], [p["q_ctc_D"], p["q_ctc_R"]], p["q_ctc_div"])
        # Reconciliation front-loads action into a Congress's first year.
        first_yr = ((y - 2027) % 2) == 0
        q2 = q_ct                                             # already per Congress
        h = np.where(first_yr, 0.7 * q2, 0.3 * q2 / np.maximum(1 - 0.7 * q2, 1e-9))
        ct_hit = (ctc_year == 9999) & (rng.random(M) < h)
        ctc_year[ct_hit] = y

    ctc_ty = np.where(rng.random(M) < p["p_ctc_same_tax_year"], ctc_year, ctc_year + 1)

    # ---------------- outputs ----------------
    # Bayesian reading: every simulated history carries its own draw of the inputs, so a plain
    # average over histories integrates the input uncertainty out. Each output is ONE probability.
    # Uncertainty about the inputs shows up as conditional probabilities (what you'd believe if you
    # learned an input was high or low, or observed a signpost), never as an interval on a probability.
    P_ = lambda ev: float(np.mean(ev))

    y6 = first_year_at[6000]
    buckets = {"2026–2028": (2026, 2028), "2029–2032": (2029, 2032), "2033–2036": (2033, 2036),
               "2037–2040": (2037, 2040), "2041–2050": (2041, 2050)}
    m1 = {k: P_((y6 >= a) & (y6 <= b)) for k, (a, b) in buckets.items()}
    m1["Not by the end of 2050"] = P_(y6 > 2050)
    m2 = {f"${t:,}/year": P_(first_year_at[t] <= 2036) for t in (1000, 3000, 6000, 12000)}
    m3 = P_(floor_year <= 2036)
    ctc_b = {"2026": (2026, 2026), "2027": (2027, 2027), "2028": (2028, 2028),
             "2029–2030": (2029, 2030), "2031–2035": (2031, 2035)}
    m4 = {k: P_((ctc_ty >= a) & (ctc_ty <= b)) for k, (a, b) in ctc_b.items()}
    m4["Not by tax year 2035"] = P_(ctc_ty > 2035)
    cum6 = {str(yr): P_(y6 <= yr) for yr in range(2027, 2051)}

    u40, u50 = y6 <= 2040, y6 <= 2050
    by40 = u40
    attribution = {
        "share_in_shock_state": float(enact_state[by40].mean()) if by40.any() else float("nan"),
        "share_D_trifecta": float((enact_ctrl[by40] == 1).mean()) if by40.any() else float("nan"),
        "share_R_trifecta": float((enact_ctrl[by40] == 2).mean()) if by40.any() else float("nan"),
        "share_divided": float((enact_ctrl[by40] == 0).mean()) if by40.any() else float("nan"),
        "p_shock_drives_politics_by_2040": P_(shock_from <= 2040),
    }

    def cond(ev_s, target):
        ps = P_(ev_s)
        return {"p_signpost": ps,
                "p_if_yes": float(target[ev_s].mean()) if ev_s.any() else float("nan"),
                "p_if_no": float(target[~ev_s].mean()) if (~ev_s).any() else float("nan")}

    signposts_def = {
        "Democratic trifecta in 2029–30": ctrl[2029] == 1,
        "Republican trifecta in 2029–30": ctrl[2029] == 2,
        "AI labor shock starts by end-2030": onset < 2031,
        "AI labor shock starts by end-2035": onset < 2036,
        "Any universal payment ($1k+) enacted by 2032": first_year_at[1000] <= 2032,
        "Fully refundable CTC enacted by 2030": ctc_year <= 2030,
    }
    signposts = {k: {"by_2040": cond(v, u40), "by_2050": cond(v, u50)} for k, v in signposts_def.items()}

    # What you'd believe if an input sat in its bottom vs top third of its range.
    sensitivity = {}
    for k, v in P.items():
        if np.ptp(v) == 0:
            continue
        x = v[pid]
        lo_c, hi_c = np.quantile(v, [1 / 3, 2 / 3])
        sensitivity[k] = {"p_if_low_third": float(u40[x <= lo_c].mean()), "p_if_high_third": float(u40[x >= hi_c].mean())}
    sensitivity = dict(sorted(sensitivity.items(), key=lambda kv: -abs(kv[1]["p_if_high_third"] - kv[1]["p_if_low_third"])))

    return {
        "n_sims": M, "seed": seed,
        "m1_when_ubi_6k": m1,
        "m2_amount_ladder_by_2036": m2,
        "m3_guaranteed_floor_by_2036": m3,
        "m4_ctc_first_tax_year": m4,
        "m5_primary_winner_backs_ubi": float(P["p_2028_primary_winner_backs_ubi"].mean()),
        "cumulative_ubi_6k": cum6,
        "attribution_by_2040": attribution,
        "signposts": signposts,
        "sensitivity_by_2040": sensitivity,
    }


def seeds(res: dict) -> dict:
    """Turn model probabilities into integer market seeds (1-99; sum-to-one sets add to 100)."""
    def sum_to_100(d: dict) -> dict:
        raw = {k: max(v * 100, 1.0) for k, v in d.items()}
        fl = {k: int(np.floor(v)) for k, v in raw.items()}
        rem = 100 - sum(fl.values())
        order = sorted(raw, key=lambda k: -(raw[k] - fl[k]))
        i = 0
        while rem != 0:                                        # largest remainder, either direction
            k = order[i % len(order)]
            if rem > 0:
                fl[k] += 1; rem -= 1
            elif fl[k] > 1:
                fl[k] -= 1; rem += 1
            i += 1
        return fl
    clip = lambda x: int(min(99, max(1, round(x * 100))))
    ladder = [clip(v) for v in res["m2_amount_ladder_by_2036"].values()]
    ladder = [int(x) for x in np.minimum.accumulate(ladder)]  # enforce non-increasing rungs
    return {
        "m1": sum_to_100(res["m1_when_ubi_6k"]),
        "m2": dict(zip(res["m2_amount_ladder_by_2036"], ladder)),
        "m3": clip(res["m3_guaranteed_floor_by_2036"]),
        "m4": sum_to_100(res["m4_ctc_first_tax_year"]),
        "m5": clip(res["m5_primary_winner_backs_ubi"]),
    }


if __name__ == "__main__":
    res = simulate(*(int(a) for a in sys.argv[1:3])) if len(sys.argv) > 2 else simulate()
    res["seeds"] = seeds(res)
    (HERE / "results.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    (HERE / "inputs.json").write_text(json.dumps({k: vars(v) for k, v in INPUTS.items()}, indent=1, ensure_ascii=False))
    c = res["cumulative_ubi_6k"]
    print("P(UBI >= $6k) by", {y: round(c[y], 4) for y in ("2028", "2032", "2036", "2040", "2050")})
    print("seeds", json.dumps(res["seeds"], ensure_ascii=False))
    for k, v in res["signposts"].items():
        b = v["by_2040"]; print(f"  signpost {k}: P={b['p_signpost']:.2f}  P(U40|yes)={b['p_if_yes']:.3f}  P(U40|no)={b['p_if_no']:.3f}")
    for k, v in list(res["sensitivity_by_2040"].items())[:6]:
        print(f"  input {k}: low third {v['p_if_low_third']:.3f}  high third {v['p_if_high_third']:.3f}")

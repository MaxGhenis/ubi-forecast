"""Invariants of the UBI decomposition model, checked for arbitrary input ranges."""
import copy

import numpy as np
import pytest
from hypothesis import HealthCheck, given, settings, strategies as st

import ubi_model as um

SMALL = dict(n_param=2400, n_scen=1)


def run_with(overrides=None, seed=1, **kw):
    saved = copy.deepcopy(um.INPUTS)
    try:
        for k, (lo, mode, hi) in (overrides or {}).items():
            um.INPUTS[k] = um.Rng3(lo, mode, hi, "test")
        return um.simulate(seed=seed, **{**SMALL, **kw})
    finally:
        um.INPUTS.clear(); um.INPUTS.update(saved)


def rng3(max_hi=1.0):
    return st.tuples(st.floats(0, max_hi), st.floats(0, max_hi), st.floats(0, max_hi)).map(sorted).map(
        lambda t: (t[0], t[1], t[2]))


PROB_KEYS = [k for k, v in um.INPUTS.items() if v.hi <= 1.0 and k != "politics_lag_years"]


@settings(max_examples=25, deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(st.dictionaries(st.sampled_from(PROB_KEYS), rng3(), max_size=8), st.integers(0, 10_000))
def test_invariants_hold_for_any_inputs(over, seed):
    r = run_with(over, seed=seed)
    m1 = r["m1_when_ubi_6k"]; m2 = r["m2_amount_ladder_by_2036"]; m4 = r["m4_ctc_first_tax_year"]
    # Partitions sum to one.
    assert sum(m1.values()) == pytest.approx(1.0)
    assert sum(m4.values()) == pytest.approx(1.0)
    # Ladder is non-increasing in the threshold.
    rungs = list(m2.values())
    assert all(a >= b - 1e-12 for a, b in zip(rungs, rungs[1:]))
    # Identity: M1 cumulative through 2036 is the same event as the $6,000 rung.
    by2036 = sum(m1[k] for k in ("2026–2028", "2029–2032", "2033–2036"))
    assert by2036 == pytest.approx(m2["$6,000/year"])
    # The guaranteed floor contains every UBI >= $6,000.
    assert r["m3_guaranteed_floor_by_2036"] >= m2["$6,000/year"] - 1e-12
    # Cumulative probabilities never fall over time and stay in [0, 1].
    cum = list(r["cumulative_ubi_6k"].values())
    assert all(0 <= c <= 1 for c in cum) and all(a <= b + 1e-12 for a, b in zip(cum, cum[1:]))
    # Seeds are valid Manifold inputs.
    s = um.seeds(r)
    assert sum(s["m1"].values()) == 100 and sum(s["m4"].values()) == 100
    assert all(1 <= x <= 99 for d in (s["m1"], s["m2"], s["m4"]) for x in d.values())
    assert list(s["m2"].values()) == sorted(s["m2"].values(), reverse=True)
    # Conservation of expected evidence: every signpost's conditionals average back to the prior.
    for sp in r["signposts"].values():
        for horizon, b in sp.items():
            target = r["cumulative_ubi_6k"]["2040" if horizon == "by_2040" else "2050"]
            if 0 < b["p_signpost"] < 1:
                assert b["p_signpost"] * b["p_if_yes"] + (1 - b["p_signpost"]) * b["p_if_no"] == pytest.approx(target)


def test_zero_enactment_hazard_means_no_ubi():
    zero = {k: (0.0, 0.0, 0.0) for k in um.INPUTS if k.startswith(("e_", "q_floor", "ratchet"))}
    r = run_with(zero)
    assert r["m1_when_ubi_6k"]["Not by the end of 2050"] == 1.0
    assert all(v == 0 for v in r["m2_amount_ladder_by_2036"].values())
    assert r["m3_guaranteed_floor_by_2036"] == 0


def test_no_shock_and_no_trifectas_blocks_normal_route():
    over = {k: (0.0, 0.0, 0.0) for k in um.INPUTS if k.startswith(("shock_by", "p_R_trifecta", "p_D_trifecta"))}
    over["e_div_normal"] = (0.0, 0.0, 0.0)
    r = run_with(over)
    assert r["cumulative_ubi_6k"]["2050"] == 0


def test_more_ai_shock_never_lowers_ubi_odds_in_expectation():
    lo = run_with({k: (0.0, 0.0, 0.0) for k in um.INPUTS if k.startswith("shock_by")}, n_param=40000, n_scen=1)
    hi = run_with({k: (0.9, 0.95, 1.0) for k in um.INPUTS if k.startswith("shock_by")}, n_param=40000, n_scen=1)
    assert hi["cumulative_ubi_6k"]["2040"] > lo["cumulative_ubi_6k"]["2040"]


def test_deterministic_for_a_seed():
    assert run_with(seed=7) == run_with(seed=7)


def test_pert_sampler_stays_in_range():
    rng = np.random.default_rng(0)
    for v in um.INPUTS.values():
        x = v.sample(rng, 2000)
        assert x.min() >= v.lo - 1e-9 and x.max() <= v.hi + 1e-9


def test_no_passage_means_no_ubi():
    r = run_with({k: (0.0, 0.0, 0.0) for k in um.INPUTS if k.startswith("pass_")})
    assert r["cumulative_ubi_6k"]["2050"] == 0

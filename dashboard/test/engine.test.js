import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { simulate, cumulative, cumulativeOf, signpost, eventMask, maskFrom, THRESHOLDS, rngFrom, pert } from "../src/engine.js";
import { GLOBALS, US } from "../src/countries.js";

// A second synthetic country (test fixture only) so subset properties can be checked.
const TWIN = { ...US, iso3: "TWN_TEST", name: "Test twin", exposure: { lo: 0.3, mode: 0.6, hi: 0.9 }, lag: { lo: -1, mode: 1, hi: 4 } };
const rangeArb = fc.tuple(fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }))
  .map((t) => t.sort((a, b) => a - b)).map(([lo, mode, hi]) => ({ lo, mode, hi }));
const controlsArb = fc.record({
  shockShiftYears: fc.integer({ min: -5, max: 10 }),
  endorse: fc.record({ L: fc.double({ min: 0, max: 4, noNaN: true }), R: fc.double({ min: 0, max: 4, noNaN: true }), O: fc.double({ min: 0, max: 4, noNaN: true }) }),
  pass: fc.double({ min: 0, max: 3, noNaN: true }),
  amount: fc.double({ min: 0.25, max: 3, noNaN: true }),
  exposureMode: fc.constantFrom("model", "all", "us-only"),
  risks: fc.record({ fiscal: fc.boolean(), meansTested: fc.boolean(), diffusion: fc.boolean(), gridlock: fc.boolean() }),
});

describe("engine invariants (any priors, any controls)", () => {
  it("probabilities are valid, cumulative, nested by threshold and by country set, and conserve expected evidence", () => {
    fc.assert(fc.property(rangeArb, rangeArb, controlsArb, fc.integer({ min: 1, max: 1e6 }), (qL, amt, controls, seed) => {
      const a = { ...US, endorse: { ...US.endorse, L_shock: qL } };
      const b = { ...TWIN, amount: { ...TWIN.amount, shock: { lo: amt.lo * 20, mode: amt.mode * 20, hi: amt.hi * 20 } } };
      const sim = simulate({ countries: [a, b], globals: GLOBALS, controls, n: 1500, seed });
      for (let t = 0; t < THRESHOLDS.length; t++) {
        const c = cumulative(sim, [0, 1], t).curve.map((r) => r.p);
        c.forEach((p, i) => { expect(p).toBeGreaterThanOrEqual(0); expect(p).toBeLessThanOrEqual(1); if (i) expect(p).toBeGreaterThanOrEqual(c[i - 1]); });
        if (t) {
          const prev = cumulative(sim, [0, 1], t - 1).curve.map((r) => r.p);
          c.forEach((p, i) => expect(p).toBeLessThanOrEqual(prev[i] + 1e-12));
        }
        const onlyA = cumulative(sim, [0], t).curve.map((r) => r.p);
        onlyA.forEach((p, i) => expect(p).toBeLessThanOrEqual(c[i] + 1e-12));
      }
      const U = eventMask(sim, [0, 1], 2, 2040);
      const S = maskFrom(sim.n, (s) => sim.onset[s] < 2031);
      const r = signpost(S, U);
      if (r.pS > 0 && r.pS < 1) expect(r.pS * r.pIfYes + (1 - r.pS) * r.pIfNo).toBeCloseTo(r.pU, 12);
    }), { numRuns: 40 });
  });

  it("no endorsements means no UBI anywhere", () => {
    const sim = simulate({ countries: [US, TWIN], globals: GLOBALS, controls: { endorse: { L: 0, R: 0, O: 0 } }, n: 3000 });
    expect(cumulative(sim, [0, 1], 0).curve.at(-1).p).toBe(0);
    expect(cumulativeOf(sim, sim.firstEndorse, [0, 1]).curve.at(-1).p).toBe(0);
  });

  it("endorsements without passage mean no UBI, but endorsements still happen", () => {
    const sim = simulate({ countries: [US, TWIN], globals: GLOBALS, controls: { pass: 0 }, n: 3000 });
    expect(cumulative(sim, [0, 1], 0).curve.at(-1).p).toBe(0);
    expect(cumulativeOf(sim, sim.firstEndorse, [0, 1]).curve.at(-1).p).toBeGreaterThan(0);
  });

  it("every enactment comes no earlier than the first endorsement", () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 1e6 }), (seed) => {
      const sim = simulate({ countries: [US, TWIN], globals: GLOBALS, n: 2000, seed });
      for (let s = 0; s < sim.n; s++) for (let ci = 0; ci < sim.C; ci++) {
        const enacted = sim.firstYear[(s * sim.C + ci) * sim.T], endorsed = sim.firstEndorse[s * sim.C + ci];
        if (enacted !== 9999) expect(endorsed).toBeLessThanOrEqual(enacted);
      }
    }), { numRuns: 10 });
  });

  it("the trigger never comes before October 2026 and the US trigger year matches its onset", () => {
    const sim = simulate({ countries: [US], globals: GLOBALS, controls: { shockShiftYears: -5 }, n: 5000, seed: 12 });
    for (let s = 0; s < sim.n; s++) {
      const t = sim.triggerYear[s];
      if (Number.isFinite(sim.onset[s]) && sim.onset[s] < 2051) expect(t).toBe(Math.max(2026, Math.floor(sim.onset[s])));
      if (t !== 9999) expect(t).toBeGreaterThanOrEqual(2026);
    }
  });

  it("is deterministic for a seed", () => {
    const run = () => Array.from(simulate({ countries: [US], globals: GLOBALS, n: 2000, seed: 5 }).firstYear);
    expect(run()).toEqual(run());
  });

  it("conditioning on a signpost equals filtering histories", () => {
    const sim = simulate({ countries: [US], globals: GLOBALS, n: 20000, seed: 3 });
    const S = maskFrom(sim.n, (s) => sim.onset[s] < 2031);
    const U = eventMask(sim, [0], 2, 2040);
    const direct = cumulative(sim, [0], 2, S).curve.find((r) => r.year === 2040).p;
    expect(direct).toBeCloseTo(signpost(S, U).pIfYes, 12);
  });

  it("an earlier AI shock raises the chance of a UBI (large sample)", () => {
    const run = (shift) => cumulative(simulate({ countries: [US], globals: GLOBALS, n: 60000, seed: 9,
      controls: { shockShiftYears: shift } }), [0], 2).curve.find((r) => r.year === 2040).p;
    expect(run(-3)).toBeGreaterThan(run(5));
  });

  it("PERT draws stay inside their range", () => {
    fc.assert(fc.property(rangeArb, fc.integer({ min: 1, max: 1e6 }), (r, seed) => {
      const rng = rngFrom(seed);
      for (let i = 0; i < 50; i++) { const x = pert(rng, r); expect(x).toBeGreaterThanOrEqual(r.lo - 1e-12); expect(x).toBeLessThanOrEqual(r.hi + 1e-12); }
    }), { numRuns: 100 });
  });
});

describe("probit", () => {
  it("inverts the normal CDF at known points", async () => {
    const { probit } = await import("../src/engine.js");
    expect(probit(0.5)).toBeCloseTo(0, 9);
    expect(probit(0.975)).toBeCloseTo(1.959963985, 6);
    expect(probit(0.01)).toBeCloseTo(-2.326347874, 6);
    expect(probit(1e-9)).toBeCloseTo(-5.997807015, 4);
  });
});

describe("common random numbers", () => {
  it("a control that only affects other countries leaves the US unchanged", () => {
    const TWIN2 = { ...US, iso3: "TW2_TEST", name: "Twin 2" };
    const base = { shockShiftYears: 0, exposureMode: "model", risks: {} };
    const a = simulate({ countries: [US, TWIN2], globals: GLOBALS, controls: base, n: 5000, seed: 4 });
    const b = simulate({ countries: [US], globals: GLOBALS, controls: base, n: 5000, seed: 4 });
    const us = (sim) => cumulative(sim, [0], 2).curve.map((r) => r.p);
    expect(us(a)).toEqual(us(b));
  });
  it("the shift slider never places a shock before October 2026", () => {
    const sim = simulate({ countries: [US], globals: GLOBALS, controls: { shockShiftYears: -5 }, n: 5000, seed: 2 });
    for (const o of sim.onset) expect(o >= 2026.75 || o === Infinity).toBe(true);
  });
});

describe("batching", () => {
  it("two batches equal one run", () => {
    const one = simulate({ countries: [US], globals: GLOBALS, n: 4000, seed: 8 });
    const a = simulate({ countries: [US], globals: GLOBALS, n: 2500, seed: 8, start: 0 });
    const b = simulate({ countries: [US], globals: GLOBALS, n: 1500, seed: 8, start: 2500 });
    expect([...a.firstYear, ...b.firstYear]).toEqual([...one.firstYear]);
    expect([...a.onset, ...b.onset]).toEqual([...one.onset]);
  });
});

describe("common random numbers on the real ten countries", () => {
  it("'the US only' exposure leaves the US forecast unchanged", async () => {
    const { COUNTRIES } = await import("../src/countries.js");
    const base = { shockShiftYears: 0, risks: {} };
    const a = simulate({ countries: COUNTRIES, globals: GLOBALS, controls: { ...base, exposureMode: "model" }, n: 4000, seed: 6 });
    const b = simulate({ countries: COUNTRIES, globals: GLOBALS, controls: { ...base, exposureMode: "us-only" }, n: 4000, seed: 6 });
    const us = (sim) => cumulative(sim, [0], 2).curve.map((r) => r.p);
    expect(us(b)).toEqual(us(a));
  });
});

// ---------------------------------------------------------------- stated chances are realized chances
// Fixtures: a country that is always left-led, with elections every `len` years from 2027.
const fixedR = (v) => ({ lo: v, mode: v, hi: v });
const ZERO_E = { L_normal: fixedR(0), R_normal: fixedR(0), O_normal: fixedR(0), L_shock: fixedR(0), R_shock: fixedR(0), O_shock: fixedR(0) };
function steadyLeft(len, qPass, qEndorse) {
  const periods = [{ start: 2027, kind: "fixed", state: "L" }];
  for (let y = 2027 + len; y <= 2050; y += len) periods.push({ start: y, kind: "draw", pL: fixedR(1), pR: fixedR(0) });
  return { ...US, iso3: "TST_STEADY", periods, termYears: len, exposure: fixedR(0),
           endorse: { ...ZERO_E, L_normal: fixedR(qEndorse) }, pass: { L: fixedR(qPass), R: fixedR(0), O: fixedR(0) } };
}

describe("the ledger's chances are what the model does", () => {
  it("an endorsed UBI becomes law before the next election with the stated chance, wherever in the period it was endorsed", () => {
    for (const [len, q] of [[2, 0.55], [4, 0.3], [5, 0.7], [3, 0.9]]) {
      const c = steadyLeft(len, q, 0.5), n = 20000;
      const sim = simulate({ countries: [c], globals: GLOBALS, n, seed: 7 });
      let endorsed = 0, passedInPeriod = 0;
      for (let s = 0; s < n; s++) {
        const e = sim.firstEndorse[s], law = sim.firstYear[s * sim.T];
        if (e === 9999) continue;
        const periodEnd = 2027 + Math.floor((e - 2027) / len) * len + len - 1;
        if (periodEnd > 2050) continue;                                   // the horizon cuts this period short
        endorsed++;
        if (law <= periodEnd) passedInPeriod++;
      }
      const p = passedInPeriod / endorsed, se = Math.sqrt(q * (1 - q) / endorsed);
      expect(Math.abs(p - q)).toBeLessThan(5 * se + 1e-9);
    }
  });

  it("a government endorses before the next election with its per-term chance scaled to the period length", () => {
    for (const [len, term, q] of [[2, 4, 0.6], [5, 5, 0.3]]) {
      const c = { ...steadyLeft(len, 0, q), termYears: term }, n = 20000;
      const sim = simulate({ countries: [c], globals: GLOBALS, n, seed: 11 });
      let hit = 0;
      for (let s = 0; s < n; s++) if (sim.firstEndorse[s] <= 2027 + len - 1) hit++;
      const expected = 1 - Math.pow(1 - q, len / term), se = Math.sqrt(expected * (1 - expected) / n);
      expect(Math.abs(hit / n - expected)).toBeLessThan(5 * se);
    }
  });

  it("a midterm never cancels an endorsement; an election that hands office to the other side does", () => {
    // Left-led endorses in 2027 for sure and cannot pass; the next period is 'other', which can only pass.
    const base = { ...US, iso3: "TST_LAPSE", exposure: fixedR(0), termYears: 2,
                   endorse: { ...ZERO_E, L_normal: fixedR(1) }, pass: { L: fixedR(0), R: fixedR(0), O: fixedR(1) } };
    const midterm = { ...base, periods: [{ start: 2027, kind: "fixed", state: "L" }, { start: 2029, kind: "keep", keep: fixedR(0) }] };
    const assembly = { ...base, periods: [{ start: 2027, kind: "fixed", state: "L" }, { start: 2029, kind: "draw", hog: false, pL: fixedR(0), pR: fixedR(0) }] };
    const election = { ...base, periods: [{ start: 2027, kind: "fixed", state: "L" }, { start: 2029, kind: "draw", pL: fixedR(0), pR: fixedR(0) }] };
    const law = (c) => simulate({ countries: [c], globals: GLOBALS, n: 500, seed: 3 }).firstYear;
    for (const c of [midterm, assembly]) expect(Array.from(law(c)).filter((_, i) => i % THRESHOLDS.length === 0).every((y) => y === 2029)).toBe(true);
    expect(Array.from(law(election)).every((y) => y === 9999)).toBe(true);
  });

  it("a re-elected government keeps its endorsement and gets the passage chance afresh each period", () => {
    const c = steadyLeft(4, 0.5, 0.999999), n = 20000;
    const sim = simulate({ countries: [c], globals: GLOBALS, n, seed: 5 });
    // Endorsed in 2027 almost surely; passes by 2030 w.p. 0.5 and by 2034 w.p. 0.75.
    const by = (y) => Array.from({ length: n }, (_, s) => sim.firstYear[s * sim.T] <= y).filter(Boolean).length / n;
    expect(Math.abs(by(2030) - 0.5)).toBeLessThan(0.02);
    expect(Math.abs(by(2034) - 0.75)).toBeLessThan(0.02);
  });
});

describe("a standing endorsement from before 2027", () => {
  // Left-led before 2027 with a standing endorsement; no new endorsements; passes for sure if endorsed.
  const base = { ...US, iso3: "TST_STAND", signpostPeriod: 0, exposure: fixedR(0), termYears: 4, standingEndorsement: { type: "L" },
                 endorse: { ...ZERO_E }, pass: { L: fixedR(1), R: fixedR(1), O: fixedR(1) } };
  const run = (periods) => simulate({ countries: [{ ...base, periods }], globals: GLOBALS, n: 4000, seed: 9 });
  it("carries into 2027 when the first election keeps the same side, and never counts as a new endorsement", () => {
    const sim = run([{ start: 2027, kind: "draw", pL: fixedR(0.5), pR: fixedR(0.5) }]);
    let passed = 0, keptLeft = 0;
    for (let s = 0; s < sim.n; s++) {
      if (sim.firstYear[s * sim.T] !== 9999) passed++;
      if (sim.stateNext[s] === 1) keptLeft++;
      expect(sim.firstEndorse[s]).toBe(9999);
    }
    expect(passed).toBe(keptLeft);           // passes exactly when the left kept office
    expect(Math.abs(keptLeft / sim.n - 0.5)).toBeLessThan(0.03);
  });
  it("carries through a fixed period or an election that can't change the head of government", () => {
    for (const first of [{ start: 2027, kind: "fixed", state: "O" }, { start: 2027, kind: "draw", hog: false, pL: fixedR(0), pR: fixedR(1) }]) {
      const sim = run([first]);
      expect(Array.from({ length: sim.n }, (_, s) => sim.firstYear[s * sim.T]).every((y) => y !== 9999)).toBe(true);
    }
  });
});

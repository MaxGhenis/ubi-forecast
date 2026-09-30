import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { simulate, cumulative, signpost, eventMask, maskFrom, THRESHOLDS, rngFrom, pert } from "../src/engine.js";
import { GLOBALS, US } from "../src/countries.js";

// A second synthetic country (test fixture only) so subset properties can be checked.
const TWIN = { ...US, iso3: "TWN_TEST", name: "Test twin", exposure: { lo: 0.3, mode: 0.6, hi: 0.9 }, lag: { lo: -1, mode: 1, hi: 4 } };
const rangeArb = fc.tuple(fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }))
  .map((t) => t.sort((a, b) => a - b)).map(([lo, mode, hi]) => ({ lo, mode, hi }));
const controlsArb = fc.record({
  shockShiftYears: fc.integer({ min: -5, max: 10 }),
  appetite: fc.double({ min: 0, max: 4, noNaN: true }),
  generosity: fc.double({ min: 0.25, max: 3, noNaN: true }),
  exposureMode: fc.constantFrom("model", "all", "us-only"),
  risks: fc.record({ fiscal: fc.boolean(), meansTested: fc.boolean(), diffusion: fc.boolean(), gridlock: fc.boolean() }),
});

describe("engine invariants (any priors, any controls)", () => {
  it("probabilities are valid, cumulative, nested by threshold and by country set, and conserve expected evidence", () => {
    fc.assert(fc.property(rangeArb, rangeArb, controlsArb, fc.integer({ min: 1, max: 1e6 }), (qL, amt, controls, seed) => {
      const a = { ...US, q: { ...US.q, L_shock: qL } };
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

  it("zero political appetite means no UBI anywhere", () => {
    const sim = simulate({ countries: [US, TWIN], globals: GLOBALS, controls: { appetite: 0, shockShiftYears: 0, generosity: 1, exposureMode: "model", risks: {} }, n: 3000 });
    expect(cumulative(sim, [0, 1], 0).curve.at(-1).p).toBe(0);
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
      controls: { shockShiftYears: shift, appetite: 1, generosity: 1, exposureMode: "model", risks: {} } }), [0], 2).curve.find((r) => r.year === 2040).p;
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
    const base = { shockShiftYears: 0, appetite: 1, generosity: 1, exposureMode: "model", risks: {} };
    const a = simulate({ countries: [US, TWIN2], globals: GLOBALS, controls: base, n: 5000, seed: 4 });
    const b = simulate({ countries: [US], globals: GLOBALS, controls: base, n: 5000, seed: 4 });
    const us = (sim) => cumulative(sim, [0], 2).curve.map((r) => r.p);
    expect(us(a)).toEqual(us(b));
  });
  it("the shift slider never places a shock before October 2026", () => {
    const sim = simulate({ countries: [US], globals: GLOBALS, controls: { shockShiftYears: -5, appetite: 1, generosity: 1, exposureMode: "model", risks: {} }, n: 5000, seed: 2 });
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
    const base = { shockShiftYears: 0, appetite: 1, generosity: 1, risks: {} };
    const a = simulate({ countries: COUNTRIES, globals: GLOBALS, controls: { ...base, exposureMode: "model" }, n: 4000, seed: 6 });
    const b = simulate({ countries: COUNTRIES, globals: GLOBALS, controls: { ...base, exposureMode: "us-only" }, n: 4000, seed: 6 });
    const us = (sim) => cumulative(sim, [0], 2).curve.map((r) => r.p);
    expect(us(b)).toEqual(us(a));
  });
});

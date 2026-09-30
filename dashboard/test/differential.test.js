// The JS engine's US configuration must agree with the Python reference model
// (../model/ubi_model.py, results in ../model/results.json) up to Monte Carlo noise.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { simulate, cumulative, THRESHOLDS } from "../src/engine.js";
import { GLOBALS, US } from "../src/countries.js";

const py = JSON.parse(readFileSync(new URL("../../model/results.json", import.meta.url)));
const N = 300_000;
const sim = simulate({ countries: [US], globals: GLOBALS, n: N, seed: 11 });
const at = (curve, y) => curve.find((r) => r.year === y).p;

describe("JS engine vs Python reference (US)", () => {
  const t6k = THRESHOLDS.indexOf(6.665);
  const curve = cumulative(sim, [0], t6k).curve;
  for (const y of [2032, 2036, 2040, 2045, 2050]) {
    it(`P(UBI >= $6k by ${y}) matches within 5 standard errors`, () => {
      const p = py.cumulative_ubi_6k[String(y)];
      const se = Math.sqrt((p * (1 - p)) / N + (p * (1 - p)) / py.n_sims);
      expect(Math.abs(at(curve, y) - p)).toBeLessThan(5 * se + 1e-4);
    });
  }
  it("P(any universal payment >= $1k by 2036) matches", () => {
    const p = py.m2_amount_ladder_by_2036["$1,000/year"];
    const got = at(cumulative(sim, [0], 0).curve, 2036);
    const se = Math.sqrt((p * (1 - p)) / N + (p * (1 - p)) / py.n_sims);
    expect(Math.abs(got - p)).toBeLessThan(5 * se + 1e-4);
  });
});

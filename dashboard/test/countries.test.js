import { describe, expect, it } from "vitest";
import { COUNTRIES, GLOBALS } from "../src/countries.js";
import { FIRST_YEAR, LAST_YEAR } from "../src/engine.js";

const ranges = (c) => [
  ...Object.values(c.endorse), ...Object.values(c.pass), c.exposure, c.ratchet, c.amount.normal, c.amount.shock,
  ...c.periods.flatMap((p) => (p.kind === "draw" ? [p.pL, p.pR] : p.kind === "keep" ? [p.keep] : [])),
];

describe("country configurations", () => {
  it("has ten distinct countries with World Bank GDP per head", () => {
    expect(new Set(COUNTRIES.map((c) => c.iso3)).size).toBe(10);
    for (const c of COUNTRIES) expect(c.gdppc).toBeGreaterThan(5000);
  });
  for (const c of COUNTRIES) {
    describe(c.name, () => {
      it("every range is ordered lo <= mode <= hi", () => {
        for (const r of [...ranges(c), c.lag]) { expect(r.lo).toBeLessThanOrEqual(r.mode); expect(r.mode).toBeLessThanOrEqual(r.hi); }
      });
      it("probabilities sit in [0, 1]", () => {
        for (const r of [...Object.values(c.endorse), ...Object.values(c.pass), c.exposure, c.ratchet, ...c.periods.flatMap((p) => (p.kind === "draw" ? [p.pL, p.pR] : p.kind === "keep" ? [p.keep] : []))]) {
          expect(r.lo).toBeGreaterThanOrEqual(0); expect(r.hi).toBeLessThanOrEqual(1);
        }
      });
      it("calendar covers the whole horizon, in order", () => {
        expect(c.periods[0].start).toBeLessThanOrEqual(FIRST_YEAR);
        for (let i = 1; i < c.periods.length; i++) expect(c.periods[i].start).toBeGreaterThan(c.periods[i - 1].start);
        expect(c.periods.at(-1).start).toBeLessThanOrEqual(LAST_YEAR);
        expect(c.periods[0].kind).not.toBe("keep");
      });
      it("its signpost election is an election", () => {
        const i = c.signpostPeriod ?? c.periods.findIndex((p) => p.kind === "draw");
        expect(c.periods[i].kind).toBe("draw");
      });
      it("cites sources for its facts", () => {
        if (c.iso3 !== "USA") { expect(c.facts.length).toBeGreaterThanOrEqual(3); for (const f of c.facts) expect(f.url).toMatch(/^https:\/\//); }
      });
      it("a shock never lowers a government's chance of endorsing", () => {
        for (const s of ["L", "R", "O"]) expect(c.endorse[`${s}_shock`].mode).toBeGreaterThanOrEqual(c.endorse[`${s}_normal`].mode);
      });
    });
  }
  it("global shock anchors are non-decreasing in their modes", () => {
    const m = ["shock_by_2028", "shock_by_2030", "shock_by_2035", "shock_by_2040", "shock_by_2050"].map((k) => GLOBALS[k].mode);
    for (let i = 1; i < m.length; i++) expect(m[i]).toBeGreaterThanOrEqual(m[i - 1]);
  });
});

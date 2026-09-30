// Every number in the paper comes from this script, which runs the dashboard's
// engine with the dashboard's seed and history count (200,000 histories, seed
// 20260929), so the paper's default numbers equal the dashboard's default view.
import { writeFileSync } from "node:fs";
import { simulate, cumulative, cumulativeOf, eventMask, maskFrom, signpost, THRESHOLDS, DEFAULT_CONTROLS } from "../../dashboard/src/engine.js";
import { COUNTRIES, GLOBALS } from "../../dashboard/src/countries.js";
import MARKETS from "../../dashboard/src/markets.json" with { type: "json" };

const N = 200000, SEED = 20260929, YEARS = [2030, 2035, 2040, 2045, 2050];
const idx = Object.fromEntries(COUNTRIES.map((c, i) => [c.iso3, i]));
const ALL = COUNTRIES.map((_, i) => i);
const G7 = ["USA", "GBR", "CAN", "DEU", "FRA", "JPN"].map((k) => idx[k]);
const OECD9 = COUNTRIES.filter((c) => c.iso3 !== "BRA").map((c) => idx[c.iso3]);
const run = (controls = DEFAULT_CONTROLS, n = N) => simulate({ countries: COUNTRIES, globals: GLOBALS, controls, n, seed: SEED });
const N_SCEN = 100000;   // sensitivity scenarios; the default view uses the dashboard's 200,000
const at = (sim, set, t, y, cond = null) => cumulative(sim, set, t, cond).curve.find((r) => r.year === y).p;

const t0 = performance.now();
const base = run();
const out = { n: N, seed: SEED, thresholds: THRESHOLDS, countries: {}, sets: {}, curves: {}, signposts: {}, scenarios: {}, markets: [] };
for (const c of COUNTRIES) {
  const i = idx[c.iso3];
  out.countries[c.iso3] = { name: c.name, gdppc: c.gdppc, byThreshold: THRESHOLDS.map((_, t) => Object.fromEntries(YEARS.map((y) => [y, at(base, [i], t, y)]))) };
  out.curves[c.iso3] = cumulative(base, [i], 2).curve.map((r) => r.p);
  // Conditional on no AI shock by 2040, and on a left-led government after the signpost election.
  const noShock = maskFrom(N, (s) => !(base.onset[s] < 2041));
  const left = maskFrom(N, (s) => base.stateNext[s * base.C + i] === 1);
  const U = eventMask(base, [i], 2, 2040);
  out.countries[c.iso3].noShock2040 = signpost(noShock, U);
  const tr = cumulativeOf(base, base.triggerYear, [i]).curve, en = cumulativeOf(base, base.firstEndorse, [i]).curve;
  const atc = (curve, y) => curve.find((r) => r.year === y).p;
  out.countries[c.iso3].soon = { trig2028: atc(tr, 2028), trig2030: atc(tr, 2030), end2028: atc(en, 2028), end2030: atc(en, 2030),
                                 enact2030: at(base, [i], 0, 2030), end2040: atc(en, 2040) };
  out.countries[c.iso3].leftNext = signpost(left, U);
}
for (const [k, set] of Object.entries({ all: ALL, g7: G7, oecd9: OECD9 }))
  out.sets[k] = THRESHOLDS.map((_, t) => Object.fromEntries(YEARS.map((y) => [y, at(base, set, t, y)])));
out.curves.all = cumulative(base, ALL, 2).curve.map((r) => r.p);
{
  const tr = cumulativeOf(base, base.triggerYear, ALL).curve, en = cumulativeOf(base, base.firstEndorse, ALL).curve;
  const atc = (curve, y) => curve.find((r) => r.year === y).p;
  out.soonAll = { trig2028: atc(tr, 2028), trig2030: atc(tr, 2030), end2028: atc(en, 2028), end2030: atc(en, 2030), enact2030: at(base, ALL, 0, 2030), end2040: atc(en, 2040) };
}
out.curveYears = cumulative(base, [0], 2).curve.map((r) => r.year);

const sp = (label, mask, set) => ({ label, ...signpost(mask, eventMask(base, set, 2, 2040)) });
for (const [k, set] of Object.entries({ USA: [idx.USA], all: ALL })) {
  out.signposts[k] = [
    sp("The US trigger is met by the end of 2030", maskFrom(N, (s) => base.onset[s] < 2031), set),
    sp("The US trigger is met by the end of 2035", maskFrom(N, (s) => base.onset[s] < 2036), set),
    sp("The US trigger has not been met by 2040", maskFrom(N, (s) => !(base.onset[s] < 2041)), set),
    sp("A government endorses a UBI by the end of 2030", maskFrom(N, (s) => set.some((ci) => base.firstEndorse[s * base.C + ci] <= 2030)), set),
    sp("A universal payment of any size (1.1%+ of GDP per head) passes by 2032", eventMask(base, set, 0, 2032), set),
  ];
}
out.signposts.USA.push(sp("Democrats win a trifecta in the 2028 election", maskFrom(N, (s) => base.stateNext[s * base.C + idx.USA] === 1), [idx.USA]));
out.signposts.USA.push(sp("Republicans win a trifecta in the 2028 election", maskFrom(N, (s) => base.stateNext[s * base.C + idx.USA] === 2), [idx.USA]));

const B = { ...DEFAULT_CONTROLS, endorse: { ...DEFAULT_CONTROLS.endorse }, risks: { ...DEFAULT_CONTROLS.risks } };
const SCEN = {
  "US trigger 3 years earlier": { ...B, shockShiftYears: -3 },
  "US trigger 5 years later": { ...B, shockShiftYears: 5 },
  "Left-led governments endorse half as often": { ...B, endorse: { L: 0.5, R: 1, O: Math.SQRT1_2 } },
  "Left-led governments endorse twice as often": { ...B, endorse: { L: 2, R: 1, O: Math.SQRT2 } },
  "Right-led governments endorse half as often": { ...B, endorse: { L: 1, R: 0.5, O: Math.SQRT1_2 } },
  "Right-led governments endorse twice as often": { ...B, endorse: { L: 1, R: 2, O: Math.SQRT2 } },
  "Endorsed UBIs pass half as often": { ...B, pass: 0.5 },
  "Endorsed UBIs pass twice as often": { ...B, pass: 2 },
  "Amounts half as large": { ...B, amount: 0.5 },
  "Amounts twice as large": { ...B, amount: 2 },
  "Every country meets its trigger with the US": { ...B, exposureMode: "all" },
  "Only the US meets its trigger": { ...B, exposureMode: "us-only" },
  "Fiscal squeeze": { ...B, risks: { ...B.risks, fiscal: true } },
  "Means-tested route wins": { ...B, risks: { ...B.risks, meansTested: true } },
  "Policy diffusion": { ...B, risks: { ...B.risks, diffusion: true } },
  "Gridlock": { ...B, risks: { ...B.risks, gridlock: true } },
};
const base100 = run(DEFAULT_CONTROLS, N_SCEN);
out.scenarios["Default"] = { USA: at(base100, [idx.USA], 2, 2040), all: at(base100, ALL, 2, 2040) };
out.nScen = N_SCEN;
for (const [k, controls] of Object.entries(SCEN)) {
  const s = run(controls, N_SCEN);
  out.scenarios[k] = { USA: at(s, [idx.USA], 2, 2040), all: at(s, ALL, 2, 2040) };
}
for (const mk of MARKETS.markets) {
  const set = mk.model.countries === "all" ? ALL : mk.model.countries.filter((k) => k in idx).map((k) => idx[k]);
  out.markets.push({ question: mk.question, url: mk.url, price: mk.price, traders: mk.traders, own: mk.url.includes("/MaxGhenis/"),
                     model: at(base, set, mk.model.t, mk.model.year), note: mk.model.note, definition: mk.definition });
}
out.seconds = (performance.now() - t0) / 1000;
writeFileSync(new URL("../results.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(`done in ${out.seconds.toFixed(0)} s; US 2040 = ${(100 * out.countries.USA.byThreshold[2][2040]).toFixed(2)}%, any of 10 = ${(100 * out.sets.all[2][2040]).toFixed(2)}%`);

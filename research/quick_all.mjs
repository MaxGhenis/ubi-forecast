import { simulate, cumulative, cumulativeOf } from "../dashboard/src/engine.js";
import { GLOBALS, COUNTRIES } from "../dashboard/src/countries.js";
const t0 = performance.now();
const sim = simulate({ countries: COUNTRIES, globals: GLOBALS, n: 100000, seed: 20260929 });
const at = (c, y) => c.curve.find((r) => r.year === y).p, pc = (x) => (100 * x).toFixed(1).padStart(5);
console.log("ms", Math.round(performance.now() - t0));
console.log("iso   6.7%: 2030  2040  2050 | any-size 2040 | endorse by 2030  2040 | trigger by 2030");
COUNTRIES.forEach((c, i) => {
  const b = cumulative(sim, [i], 2), a = cumulative(sim, [i], 0), e = cumulativeOf(sim, sim.firstEndorse, [i]), tr = cumulativeOf(sim, sim.triggerYear, [i]);
  console.log(c.iso3.padEnd(5), pc(at(b, 2030)), pc(at(b, 2040)), pc(at(b, 2050)), "|", pc(at(a, 2040)), "     |", pc(at(e, 2030)), pc(at(e, 2040)), "     |", pc(at(tr, 2030)));
});
const all = COUNTRIES.map((_, i) => i);
console.log("ALL  ", pc(at(cumulative(sim, all, 2), 2030)), pc(at(cumulative(sim, all, 2), 2040)), pc(at(cumulative(sim, all, 2), 2050)), "|", pc(at(cumulative(sim, all, 0), 2040)), "     |", pc(at(cumulativeOf(sim, sim.firstEndorse, all), 2030)), pc(at(cumulativeOf(sim, sim.firstEndorse, all), 2040)));

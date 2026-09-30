import { simulate } from "../dashboard/src/engine.js";
import { GLOBALS, COUNTRIES } from "../dashboard/src/countries.js";
for (const n of [5000, 20000]) { const t0 = performance.now(); simulate({ countries: COUNTRIES, globals: GLOBALS, n, seed: 1 }); console.log(n, Math.round(performance.now() - t0), "ms"); }

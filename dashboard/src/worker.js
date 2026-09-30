// Runs one batch of the simulation off the main thread and hands the typed arrays back.
import { simulate } from "./engine.js";

self.onmessage = (e) => {
  const { id, countries, globals, controls, n, seed, start } = e.data;
  const t0 = performance.now();
  const sim = simulate({ countries, globals, controls, n, seed, start });
  self.postMessage({ id, start, sim, ms: performance.now() - t0 }, [sim.onset.buffer, sim.firstYear.buffer, sim.stateNext.buffer]);
};

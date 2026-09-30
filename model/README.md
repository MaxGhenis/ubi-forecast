# US reference model (Python)

A second, independent implementation of the dashboard engine's US configuration, in numpy. Its job is to catch implementation bugs: `dashboard/test/differential.test.js` checks that the JavaScript engine and this model give the same US forecasts within Monte Carlo noise. It also produced the opening odds of the five Manifold markets on 29 September 2026 (revision 1; frozen in `../markets/opening_seeds.json`).

The model follows the same structure as the dashboard: an observable unemployment trigger, US Congress control per two-year period (Democratic trifecta, Republican trifecta or divided), endorsement by the governing side with a yearly chance by control type and shock state, passage before the next federal election with a stated chance by control type, and an amount drawn relative to the $6,000 line. `INPUTS` lists every prior with its basis. Current results are in `results.json`; the dashboard and paper are the place to read them.

```bash
uv run --with numpy python ubi_model.py                                             # writes results.json
uv run --with numpy --with pytest --with hypothesis python -m pytest -q             # property tests
```

`export_radiant.py` writes the model as a Radiant-style map (`ubi_map_radiant.json`, `ubi_map_ir.json`) for revision 1; it has not been updated for the endorsement-and-passage structure.

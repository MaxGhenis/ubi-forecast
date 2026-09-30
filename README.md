# When will countries enact a universal basic income?

A Bayesian forecast of universal basic income adoption in ten countries (the United States, the United Kingdom, Canada, Germany, France, Spain, Japan, South Korea, Australia and Brazil), with a dashboard at [maxghenis.com/ubi-forecast](https://maxghenis.com/ubi-forecast/) and a working paper at [maxghenis.com/ubi-forecast/paper](https://maxghenis.com/ubi-forecast/paper/). Current numbers live on those pages and in `paper/_variables.yml`, which the model run writes; this file quotes none, so it can't go stale.

The question: when does a country enact a national law paying every adult a recurring, unconditional cash amount at or above a threshold? The threshold is a share of GDP per head, so it means the same thing everywhere. The default of 6.7% is $6,000 a year in the US.

## How it works

Every input is stated as a proposition that can turn out wrong, with a resolution date or condition and a source (the dashboard's assumption ledger lists them all). The model simulates histories from 2027 to 2050. Each history draws every uncertain input from a prior range (a PERT distribution over "between lo and hi, most likely mode"), then:

1. decides when, if ever, the US meets an observable unemployment trigger, defined on official unemployment and GDP series, and whether and when each other country meets its own;
2. walks each country's election calendar: left-led, right-led or other governments;
3. each year, lets a government without a standing endorsement endorse a UBI (a public commitment by the head of government, in the leading party's platform, or in a coalition agreement), with a yearly chance set by its type and whether its country's shock is under way;
4. while an endorsement stands, lets the UBI become law before the next election with a stated chance for the government in office; an endorsement ends only when an election hands the head of government to the other side;
5. draws the amount relative to GDP per head, and lets governing majorities raise it during a shock.

No-shock endorsement rates are fitted to a verified record of every government since 2000 in the ten countries (`research/endorsement/`). Passage chances are anchored to pledge-fulfilment research and the US record of flagship bills. Shock-state chances are judgments, labeled as such.

A forecast is the share of histories where the event happens. Every history carries its own draw of the inputs, so the uncertainty about them is already inside that one number, and no interval is placed around a probability. What we don't know appears as signposts (how far the forecast moves if something observable happens) and suppositions (filters on the histories, which is Bayes' rule applied to the simulation). "Checkable soon" lists near-term predictions, scored with the log score as they resolve.

## What's here

| Path | What it is |
|---|---|
| `dashboard/src/engine.js` | The simulation, run in a Web Worker. |
| `dashboard/src/countries.js` | Every prior, with its evidence and sources. |
| `dashboard/test/` | Vitest and fast-check tests: invariants for arbitrary priors and controls, stated chances equal realized ones, and a differential test against the Python model. |
| `model/ubi_model.py` | A separate US-only implementation in Python (numpy) used as the reference for the differential test. |
| `paper/` | The working paper (Quarto). `scripts/results.mjs` runs the engine and writes every model output the paper uses; `scripts/build_assets.py` turns them into variables, tables and figures. |
| `research/` | Country research and fact checks, the trigger data and backtests, the endorsement record and its fit, and the pre-publish reviews. |
| `markets/` | Specs and the creation script for five Manifold markets; `opening_seeds.json` records the revision-1 odds they opened at. |

## Run it

```bash
cd dashboard && bun install && bunx vitest run && bun build.js   # writes dist/index.html
cd model && uv run --with numpy --with pytest --with hypothesis python -m pytest -q
bun paper/scripts/results.mjs && uv run --with matplotlib --with numpy python paper/scripts/build_assets.py && quarto render paper
```

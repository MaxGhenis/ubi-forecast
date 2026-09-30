# When will countries enact a universal basic income?

A Bayesian forecast of universal basic income adoption in ten countries (the United States, the United Kingdom, Canada, Germany, France, Spain, Japan, South Korea, Australia and Brazil), running at [maxghenis.com/ubi-forecast](https://maxghenis.com/ubi-forecast/).

The question: when does a country enact a national law paying every adult citizen a recurring, unconditional cash amount at or above a threshold? The threshold is set as a share of GDP per head, so it means the same thing everywhere. The default of 6.7% is $6,000 a year in the US.

## How it works

The model simulates histories from 2027 to 2050. Each history draws every input from a prior range: a PERT distribution over "between lo and hi, most likely mode". It then:

1. decides when, if ever, an AI labor shock starts. This is a sustained, economist-attributed displacement of about 3 points of unemployment, shared across countries.
2. decides whether and when that shock reaches each country.
3. walks each country's election calendar (left-led, right-led or other governments).
4. each year, gives the government a chance of enacting a qualifying payment, which depends on who governs and whether a shock is under way.
5. draws the amount relative to GDP per head, and lets governing majorities raise it during a shock.

A forecast is the share of histories where the event happens. Every history carries its own draw of the inputs, so the uncertainty about them is already inside that one number, and no interval is placed around a probability. What we don't know appears as conditional probabilities:
- **Signposts:** how far the forecast moves if an AI shock starts by 2030, or if a party wins the next election.
- **Suppositions:** filters on the simulated histories. This is Bayes' rule applied to the simulation.

## What's here

| Path | What it is |
|---|---|
| `model/ubi_model.py` | The US reference model in Python (numpy). Produces `results.json`, including the opening odds of five Manifold markets. |
| `model/test_ubi_model.py` | Hypothesis property tests: partitions sum to one, the amount ladder is nested, conservation of expected evidence, zero-hazard gives zero, determinism. |
| `dashboard/src/engine.js` | The same model generalized to ten countries, run in a Web Worker. |
| `dashboard/src/countries.js` | Every prior, with its evidence and sources. |
| `dashboard/test/` | Vitest and fast-check tests, including a differential test showing the JS engine matches the Python model for the US within Monte Carlo noise. |
| `research/country_research.json` | Country research from five agents, each checked field by field by an adversarial verifier (365 checks). |
| `markets/` | Specs and the creation script for the Manifold markets seeded from this model. |

## Run it

```bash
cd model && uv run --with numpy python ubi_model.py
cd model && uv run --with numpy --with pytest --with hypothesis python -m pytest -q
cd dashboard && bun install && bunx vitest run && bun build.js   # writes dist/index.html
```

## Where the inputs come from

- **Markets:** AI-shock timing is anchored to Manifold's AGI and AI-unemployment markets. Election odds come from Polymarket, Kalshi and Manifold where they exist.
- **Data:** official records and polls, cited per fact.
- **Judgment:** the chance a given government enacts a UBI, and how large it would be. The dashboard labels each input by source, and the sliders let you replace any judgment with your own.

Snapshot date: 2026-09-29.

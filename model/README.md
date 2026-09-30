# When will the US adopt a UBI? A decomposed forecast

Snapshot: 2026-09-29. A Bayesian decomposition in the style of Metaculus's [Radiant](https://metaculus.substack.com/p/radiant-map-the-predictions-ai-forecasting): boxes hold ranges, arrows show causal links. Here the formulas run as a Monte Carlo simulation: 2,000 draws of the inputs × 500 simulated histories each, one year at a time from 2027 to 2050.

**Target event:** a federal law creating (or amending into) a universal, recurring cash payment with no means or work test, worth at least $6,000 per adult per year in 2026 dollars. This is the definition used by the Manifold market "When will the US enact a universal basic income of at least $500/month per adult?"

## Result

| By the end of | P(US UBI ≥ $6,000/adult/yr) |
|---|---|
| 2028 | <0.1% |
| 2032 | 1.4% |
| 2036 | 5.0% |
| 2040 | 9.6% |
| 2050 | 23.0% |

Each number is a single probability. Every simulated history draws its own inputs from their prior ranges, so averaging over histories integrates the input uncertainty out. There is no interval on a probability; the uncertainty is already in it. What we don't know shows up in the conditional probabilities below.

**Compared with the markets:** Manifold's thin US-UBI markets put 30–40% on a UBI by 2040, and several set a lower bar. This model says 9.6% for a $6,000 bar by 2040, and 9% for any universal recurring payment of $1,000 or more by 2036.

## Signposts: how much each observation would move the 2040 forecast

| If we observe… | P(observe it) | P(UBI by 2040) if yes | if no |
|---|---|---|---|
| Democratic trifecta in 2029–30 | 32.1% | 10.3% | 9.2% |
| Republican trifecta in 2029–30 | 16.3% | 9.6% | 9.6% |
| AI labor shock starts by end-2030 | 18.3% | 32.6% | 4.4% |
| AI labor shock starts by end-2035 | 33.3% | 27.2% | 0.8% |
| Any universal payment ($1k+) enacted by 2032 | 3.1% | 51.5% | 8.2% |
| Fully refundable CTC enacted by 2030 | 15.6% | 10.2% | 9.4% |

Conservation of expected evidence holds, and the tests enforce it: P(yes) × P(UBI | yes) + P(no) × P(UBI | no) equals the headline for every signpost. The AI shock is the signpost that matters. If none starts by 2035, a 2040 UBI is almost off the table. A Democratic trifecta in 2029 barely moves it on its own, because without a shock even a trifecta rarely acts.

## Which assumptions matter

This shows P(UBI by 2040) if you believed an input sat in the bottom or top third of its range:

| Input | Bottom third | Top third |
|---|---|---|
| `amount_median_shock` | 7.5% | 11.2% |
| `shock_by_2035` | 8.5% | 10.6% |
| `q_any_D_shock` | 8.6% | 10.6% |
| `q_any_div_shock` | 8.9% | 10.2% |
| `q_any_R_shock` | 9.1% | 10.1% |
| `p_D_trifecta_later` | 9.1% | 10.0% |
| `politics_lag_years` | 9.9% | 9.2% |
| `shock_by_2030` | 9.2% | 9.9% |

## Live markets seeded from this model (created 2026-09-29)

- [When will the US enact a universal basic income of at least $500/month per adult?](https://manifold.markets/MaxGhenis/when-will-the-us-enact-a-universal) (AgqLQlpPEO)
- [By the end of 2036, will the US enact a universal cash payment to all adults of at least...](https://manifold.markets/MaxGhenis/by-the-end-of-2036-will-the-us-enac) (IRnSEROEyu)
- [By the end of 2036, will US federal law guarantee $6,000/year in cash to a non-disabled adult with no income?](https://manifold.markets/MaxGhenis/by-the-end-of-2036-will-us-federal) (dCnCSlupAz)
- [In which tax year will the US Child Tax Credit next give its full amount to families with no earnings?](https://manifold.markets/MaxGhenis/in-which-tax-year-will-the-us-child) (csEhSpuNy9)
- [Will any 2028 presidential primary or caucus winner have publicly backed a universal basic income since 2025?](https://manifold.markets/MaxGhenis/will-any-2028-presidential-primary) (n6I6lQUhL0)

Resolution criteria went through two rounds of adversarial review (markets/specs.py has the revision notes).

## The map

```
Evidence: Manifold AGI & AI-unemployment markets ──> AI labor shock onset year ──┐
                                   political lag (0–2 yrs) ──────────────────────┴─> demand state each year (normal / shock)
Evidence: Polymarket 2026 & 2028 control ──> control 2027–28, 2029–30 ─┐                    │
                          base rates + midterm retention ──> 2031–2050 ─┴─> enactment chance per term <─┘
                                                                                  │        │
                                                   amount per adult (+ ratchets) ─┴─> UBI ≥ $6k: when?  ──> floor by 2036
                                                                                  └─> amount ladder by 2036
                     control ──> fully refundable CTC: first tax year        2028 primary-winner signal (standalone)
```

## What drives it

- **99% of the enactments by 2040 happen during an AI labor shock.** Without a sustained, AI-attributed rise in unemployment of about 3 points, the model almost never gets a US UBI. That matches history: the 2009 and 2021 Democratic trifectas passed temporary transfers (the 2021 CTC and one-time checks), not a UBI.
- **Of the judgment inputs, generosity matters most:** how big an AI-era program would be. If its median sits in the bottom third of the $4,000–$14,000 range, P(UBI by 2040) is 7.5%; in the top third, 11.2%. The $6,000 bar is the fault line. So the useful question isn't just "UBI or not?" but "how big?", and the amount ladder market exists to split that out.
- **Who enacts it (by 2040):** a Democratic trifecta 50%, a Republican trifecta 26%, divided government 25%. In the divided case, a crisis-driven bipartisan deal is the channel, as with the 2020 CARES Act, except permanent.
- **The next two years are nearly closed.** Polymarket has Democrats at 92.5% to win the House in 2026, so 2027–28 is almost surely divided government, and no AI shock is under way yet (unemployment was 4.1% in August 2026, per FRED).

## Inputs

All inputs, with their ranges and evidence notes, are in `ubi_model.py` (`INPUTS`) and `inputs.json`. Market-anchored inputs, fetched 2026-09-29:
- **Polymarket:** 2026 House D 92.5%, Senate D 62.5%; 2028 presidency D 64.5%.
- **Manifold:**
  - AGI before 2030 53% (342 traders); before 2040 72%; before 2048 87%.
  - "AI causes US unemployment > 10% before 2030" 23% (175 traders).
  - ACX "visible macro trend break attributed to AI by 2028" 30% (643 traders).

Everything labeled JUDGMENT is my own estimate. That covers the enactment chances by party and state, the amounts, the political lag, and the CTC and floor inputs. Edit a range in `INPUTS` and rerun to see how much a disagreement matters.

## Limitations

- **AI and elections are modeled independently.** In reality, a shock would move elections, probably against the incumbent party.
- **Enactment chances are judgments.** Nothing observable pins down, say, "a D trifecta during an AI shock enacts a universal payment with 45% probability per term." This is where Radiant-style disagreement between forecasters would add the most.
- **Amounts and ratchets are stylized.** A shock-era program draws from one lognormal, and increases only happen during shocks.
- **The 2028 primary node is standalone.** It isn't wired into party willingness.

## Files

- `ubi_model.py`: the model. Run `uv run --with numpy python ubi_model.py`; it writes `results.json` (including `seeds`) and `inputs.json`.
- `test_ubi_model.py`: property-based invariant tests. Run `uv run --with numpy --with pytest --with hypothesis python -m pytest -q`. They check that the partitions sum to one, the ladder never increases, M1 by 2036 equals the $6,000 rung, the floor contains the UBI event, cumulative probabilities never fall, zero hazard gives zero UBI, and a fixed seed is deterministic.
- `export_radiant.py`: builds `ubi_map_radiant.json`, a payload in the format of `map_forecasting.maps.radiant.to_radiant_payload` from [Metaculus/map-forecasting-research](https://github.com/Metaculus/map-forecasting-research), plus `ubi_map_ir.json`. I haven't tested importing it into Radiant, which needs a sign-in.

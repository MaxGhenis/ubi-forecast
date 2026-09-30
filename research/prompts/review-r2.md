# Independent review: UBI forecast revision 2

Repo: ~/ubi-forecast (branch `revision-2`, PR https://github.com/MaxGhenis/ubi-forecast/pull/1).
Site preview PR: https://github.com/MaxGhenis/maxghenis.com/pull/62 (built copy of the same dashboard + paper).

The owner asked for "everything to be falsifiable incl assumptions". Revision 2 replaces the fuzzy
"political appetite" and "generosity" multipliers with:
- a per-country unemployment trigger (`dashboard/src/countries.js` `trigger`, `research/trigger/`);
- endorsement (per-term probability by government type x shock state; lapses on a change of government type),
  then passage (per-term probability by government type), in `dashboard/src/engine.js`;
- explicit amounts; an assumption ledger and a "Checkable soon" table in `dashboard/src/app.js`;
- a Python reference (`model/ubi_model.py`) and a working paper (`paper/index.qmd`, numbers from `paper/scripts/results.mjs`).

Please review adversarially. You are NOT to edit files or push; write findings only.

1. **Engine correctness.** Read `engine.js` end to end. Check the per-term to per-year hazard conversion,
   the endorsement lapse rule, the trigger-year bookkeeping, common random numbers across countries, batching,
   supposition conditioning, and `cumulativeOf`. Run `cd dashboard && bunx vitest run`. Try to break an
   invariant with a new fast-check property (write it to a scratch file outside the repo, run it, report).
2. **Differential.** Confirm `model/ubi_model.py` implements the same semantics as the JS engine for the US
   (run `cd model && uv run --with pytest --with numpy pytest -q`), and flag any semantic drift the
   5-standard-error tolerance could hide.
3. **Mechanism claims in copy.** Every sentence in `app.js` (How it works, ledger, slider help, revisions),
   `template.html` and `paper/index.qmd` that says how the model works: verify it against the code. List any
   claim the code does not implement.
4. **Falsifiability.** For each ledger row: is the resolution criterion observable, dated, and unambiguous?
   Which inputs are still unfalsifiable in practice?
5. **Calibration sanity.** Are the no-shock endorsement priors consistent with the stated record (no strict-UBI
   endorsement in ~75 government terms since 2000)? Are the passage priors consistent with Thomson et al. 2017
   (`research/thomson2017.txt` if present) and US flagship-bill history? Any number in `countries.js` whose
   `note`/`source` does not support it.
6. **Paper.** Numbers in `paper/_variables.yml` must match `paper/results.json`; tables in `paper/_includes/`
   must match; `paper/references_PENDING_VERIFICATION.txt` lists citations still unverified — flag any cited
   claim that depends on them.

Output: a markdown report with sections 1-6, each finding as
`[severity: blocker|major|minor] file:line — claim — evidence — suggested fix`, and a final verdict line:
`VERDICT: APPROVE` or `VERDICT: REQUEST_CHANGES`. Only report findings you executed or read directly.

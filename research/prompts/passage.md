# Research task: passage

Context: a Bayesian Monte Carlo model forecasts when ten countries (US, UK, Canada, Germany, France, Spain, Japan, South Korea, Australia, Brazil) enact a national universal basic income (UBI): a recurring, unconditional cash payment to essentially all adult citizens. The model is being rebuilt so that every assumption is an explicit, falsifiable proposition with a data source and a resolution date.
(1) The AI labor shock becomes an observable TRIGGER: a country's 12-month average unemployment rate rises at least 3 percentage points above its 2025 annual average, while real GDP is at or above its previous peak.
(2) Enactment is split into two observable steps per term: ENDORSEMENT (the head of government, or the governing party's official platform or coalition agreement, endorses a qualifying UBI) and PASSAGE (an endorsed flagship measure becomes law within the same term).
Today is 2026-09-30. Use web search and fetch tools. FRED (https://fred.stlouisfed.org/graph/fredgraph.csv?id=SERIES) and the OECD, World Bank and national statistics APIs are fetchable with curl through Bash. Every number needs a source you fetched this session. Mark anything unverified. Read only.

## Your task
PASSAGE BASE RATES: how often a governing party's endorsed flagship measure becomes law within the term, by system.
- US trifectas since 1993, with each party's top one or two legislative priorities and whether they passed: 1993 health reform, 2009-10 ACA and climate bill, 2017 ACA repeal and TCJA, 2021-22 Build Back Better and the CTC extension, 2025 reconciliation.
- UK and Canadian single-party majorities: manifesto-pledge fulfilment studies (e.g. Thomson et al. 2017 AJPS 'The Fulfillment of Parties' Election Pledges'; Naurin; Royed).
- German and Spanish coalition-agreement fulfilment rates.
- French aligned-executive terms, Korean unified governments, Brazilian presidents facing a hostile Congress, and Japanese LDP majorities.
Give suggested_priors for 'passage given endorsement within a term' for: US trifecta, US divided, Westminster majority, coalition or minority parliament, semi-presidential aligned, and presidential with an opposition legislature. Also estimate how often each such government enacts ANY brand-new universal cash transfer (for context).

## Output (write to the -o path)
1. A markdown summary (<= 500 words).
2. A fenced ```json block: {"items": [{"country", "topic", "finding", "value", "source_url", "series_id", "verified": true|false}], "suggested_priors": [{"name", "lo", "mode", "hi", "rationale"}]}.
Every number must come from a page or API response you fetched in this run. If you could not verify something, set verified=false and say what you tried. Never fill in a number from memory.

# Research task: endorse

Context: a Bayesian Monte Carlo model forecasts when ten countries (US, UK, Canada, Germany, France, Spain, Japan, South Korea, Australia, Brazil) enact a national universal basic income (UBI): a recurring, unconditional cash payment to essentially all adult citizens. The model is being rebuilt so that every assumption is an explicit, falsifiable proposition with a data source and a resolution date.
(1) The AI labor shock becomes an observable TRIGGER: a country's 12-month average unemployment rate rises at least 3 percentage points above its 2025 annual average, while real GDP is at or above its previous peak.
(2) Enactment is split into two observable steps per term: ENDORSEMENT (the head of government, or the governing party's official platform or coalition agreement, endorses a qualifying UBI) and PASSAGE (an endorsed flagship measure becomes law within the same term).
Today is 2026-09-30. Use web search and fetch tools. FRED (https://fred.stlouisfed.org/graph/fredgraph.csv?id=SERIES) and the OECD, World Bank and national statistics APIs are fetchable with curl through Bash. Every number needs a source you fetched this session. Mark anything unverified. Read only.

## Your task
ENDORSEMENT BASE RATES AND SHOCK HISTORY.
- Since 2000, which heads of government or governing-party platforms or coalition agreements in these ten countries (plus any other OECD country) endorsed a UBI in the strict sense (universal, unconditional, recurring)? Examples to check: Lee Jae-myung's 2022 pledge (campaign only); the Finnish government's 2017 experiment (an experiment, not an endorsement); Spain's Podemos in coalition 2020 (IMV, means-tested); Scotland's SNP. What happened to each?
- During past unemployment shocks, which governments made universal or near-universal cash payments (2008-09 stimulus: the US 2008 rebates, Australia 2009 tax bonus, Japan 2009 teigaku kyufukin; 2020 COVID: US EIPs, Japan's ¥100k, Korea, Hong Kong, Singapore) and did any become permanent?
- Current platforms (2026): does any governing party in the ten countries endorse a qualifying UBI? Note the Marshall Islands' 2025 ENRA program as a precedent.
Give suggested_priors for 'endorsement within a term': left-led during a shock, right-led during a shock, other during a shock, and the same three without a shock, using this history as the base rate. Say how the no-shock base rate follows from the record: for example, N governing-party endorsements across M government-terms since 2000.

## Output (write to the -o path)
1. A markdown summary (<= 500 words).
2. A fenced ```json block: {"items": [{"country", "topic", "finding", "value", "source_url", "series_id", "verified": true|false}], "suggested_priors": [{"name", "lo", "mode", "hi", "rationale"}]}.
Every number must come from a page or API response you fetched in this run. If you could not verify something, set verified=false and say what you tried. Never fill in a number from memory.

# Research task: trigger-data

Context: a Bayesian Monte Carlo model forecasts when ten countries (US, UK, Canada, Germany, France, Spain, Japan, South Korea, Australia, Brazil) enact a national universal basic income (UBI): a recurring, unconditional cash payment to essentially all adult citizens. The model is being rebuilt so that every assumption is an explicit, falsifiable proposition with a data source and a resolution date.
(1) The AI labor shock becomes an observable TRIGGER: a country's 12-month average unemployment rate rises at least 3 percentage points above its 2025 annual average, while real GDP is at or above its previous peak.
(2) Enactment is split into two observable steps per term: ENDORSEMENT (the head of government, or the governing party's official platform or coalition agreement, endorses a qualifying UBI) and PASSAGE (an endorsed flagship measure becomes law within the same term).
Today is 2026-09-30. Use web search and fetch tools. FRED (https://fred.stlouisfed.org/graph/fredgraph.csv?id=SERIES) and the OECD, World Bank and national statistics APIs are fetchable with curl through Bash. Every number needs a source you fetched this session. Mark anything unverified. Read only.

## Your task
TRIGGER DATA. For each of the ten countries, give:
- the 2025 annual average unemployment rate from the official or harmonised series (US: BLS U-3, FRED UNRATE; others: OECD harmonised unemployment rate, or the national LFS series if OECD lacks it; name the series ID or dataset), and the latest monthly value;
- the resulting trigger level (2025 average + 3.0 pp);
- whether real GDP is currently at or above its previous peak (latest quarter vs the pre-2026 peak), with the series.
Also list every historical episode since 1970 where a country's 12-month average unemployment rose 3+ pp above its level of two years earlier. For each, note whether real GDP was below its previous peak at the time (a recession) or not (jobless growth). The question is whether the jobless-growth condition separates a hypothetical AI shock from ordinary recessions. Report counts per country.

## Output (write to the -o path)
1. A markdown summary (<= 500 words).
2. A fenced ```json block: {"items": [{"country", "topic", "finding", "value", "source_url", "series_id", "verified": true|false}], "suggested_priors": [{"name", "lo", "mode", "hi", "rationale"}]}.
Every number must come from a page or API response you fetched in this run. If you could not verify something, set verified=false and say what you tried. Never fill in a number from memory.

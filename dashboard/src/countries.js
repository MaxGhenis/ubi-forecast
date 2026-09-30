// Country configurations: priors for every input, with evidence notes.
// Probabilities are 0-1; q_* are chances of enacting a qualifying UBI within a
// 4-year term; amounts are medians in % of GDP per capita per adult per year.
// Every range is a prior; notes say which are anchored to data and which are
// judgment. The US block mirrors ../model/ubi_model.py exactly.

const R = (lo, mode, hi) => ({ lo, mode, hi });
const usd = (x) => (100 * x) / 90027; // US GDP per capita 2025 (World Bank NY.GDP.PCAP.CD)

// Global AI-shock timing: cumulative probability that a sustained,
// economist-attributed AI displacement of about 3 pp of US unemployment has
// started by the end of each year.
export const GLOBALS = {
  shock_by_2028: R(0.04, 0.08, 0.15),
  shock_by_2030: R(0.10, 0.18, 0.28),
  shock_by_2035: R(0.20, 0.33, 0.48),
  shock_by_2040: R(0.28, 0.43, 0.60),
  shock_by_2050: R(0.35, 0.55, 0.75),
  politics_lag_years: R(0, 1, 2),
};

export const GLOBAL_NOTES = {
  shock_by_2028: "Manifold ACX market: 30% for a visible AI-attributed macro trend break by 2028 (643 traders), which also counts positive breaks.",
  shock_by_2030: "Manifold: AI causes US unemployment above 10% before 2030, 23% (175 traders), discounted for Manifold's pro-AI lean.",
  shock_by_2035: "Manifold AGI series: 58% before 2032 and 63% before 2035, times a 0.5-0.6 chance that AGI produces a shock this size.",
  shock_by_2040: "Manifold: AGI before 2040, 72% (98 traders), times about 0.6.",
  shock_by_2050: "Manifold: AGI before 2048 87%; more than 97% of jobs automated before 2075, 63%.",
  politics_lag_years: "Judgment: the 2020 CARES Act passed within weeks, but a permanent program needs a sustained shock.",
};

const US_LATER = { kind: "draw", pL: R(0.22, 0.32, 0.42), pR: R(0.22, 0.32, 0.42) };
const US_KEEP = { kind: "keep", keep: R(0.10, 0.25, 0.45), source: "data" };

export const US = {
  iso3: "USA",
  trigger: { series: "BLS U-3 unemployment rate", baseline: 4.26, level: 7.3, source: "FRED UNRATE (unemployment) and GDPC1 (real GDP)",
             note: "2025 average from 11 monthly values; latest 4.1% (2026-08). Real GDP is at or above its previous peak (latest quarter). Since 1948, 3 rises of 3 points or more, all with real GDP below its previous peak." }, name: "United States", inName: "the United States", gdppc: 90027,
  govShort: "Republican trifecta until January 2027",
  leftWins: "Democrats win a trifecta in the 2028 election",
  rightWins: "Republicans win a trifecta in the 2028 election",
  signpostPeriod: 1,
  pass: { L: R(0.35, 0.55, 0.75), R: R(0.35, 0.55, 0.75), O: R(0.03, 0.10, 0.20) },
  passNote: "US trifectas since 1993 passed about half their flagship domestic priorities: the 2010 ACA, 2017 tax law, 2021 American Rescue Plan and 2025 reconciliation law passed; 1993 health reform, the 2009 climate bill, 2017 ACA repeal and Build Back Better did not. Across 12 countries, governing parties fulfilled 59% of pledges at least partially (Thomson et al. 2017); a UBI is costlier than the typical pledge.",
  endorse: { L_normal: R(0.002, 0.01, 0.03), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.35, 0.6, 0.85), R_shock: R(0.1, 0.35, 0.65), O_shock: R(0.15, 0.4, 0.7) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate.",
  electionNote: "Left-led = Democratic trifecta; right-led = Republican trifecta; other = divided government. Congress periods start in odd years.",
  periods: [
    { start: 2027, kind: "draw", hog: false, pL: R(0, 0, 0), pR: R(0.03, 0.05, 0.08),
      source: "market", note: "Polymarket, 2026-09-29: Democrats 92.5% for the House and 62.5% for the Senate, so a Republican trifecta in 2027-28 is about 5%." },
    { start: 2029, kind: "draw", pL: R(0.22, 0.32, 0.42), pR: R(0.10, 0.16, 0.24),
      source: "market", note: "Polymarket: 2028 presidency Democratic 64.5%, times the chance the same party takes both chambers." },
    { start: 2031, ...US_KEEP, note: "Of six trifectas that opened a term from 1993 to 2021, only one (2001) survived its midterm." },
    { start: 2033, ...US_LATER, source: "data", note: "Recent base rate: a trifecta opened 6 of 7 terms from 2001 to 2025." },
    { start: 2035, ...US_KEEP }, { start: 2037, ...US_LATER }, { start: 2039, ...US_KEEP },
    { start: 2041, ...US_LATER }, { start: 2043, ...US_KEEP }, { start: 2045, ...US_LATER },
    { start: 2047, ...US_KEEP }, { start: 2049, ...US_LATER },
  ],
  endorseNote: "Judgment. The 2009 and 2021 Democratic trifectas enacted no UBI (2021 brought a temporary CTC and one-time checks). The 2020 CARES checks passed under divided government but were temporary.",
  exposure: R(1, 1, 1), lag: R(0, 0, 0),
  amount: { normal: R(usd(1000), usd(2000), usd(3500)), shock: R(usd(4000), usd(8000), usd(14000)) },
  amountNote: "Judgment. Without a shock: dividend-scale, around $2,000. During a shock: around $8,000; Yang's Freedom Dividend was $12,000.",
  ratchet: R(0.05, 0.12, 0.25),
  sources: [
    { label: "Polymarket: 2026 House", url: "https://polymarket.com/event/which-party-will-win-the-house-in-2026" },
    { label: "Polymarket: 2026 Senate", url: "https://polymarket.com/event/which-party-will-win-the-senate-in-2026" },
    { label: "Polymarket: 2028 presidency", url: "https://polymarket.com/event/which-party-wins-2028-us-presidential-election" },
    { label: "Manifold AGI and AI-unemployment markets", url: "https://manifold.markets/ahalekelly/will-ai-cause-the-us-unemployment-r" },
    { label: "FRED UNRATE: 4.1% in August 2026", url: "https://fred.stlouisfed.org/series/UNRATE" },
  ],
};


// ---------------------------------------------------------------- other countries
// Researched 2026-09-29 by five research agents, each checked by an adversarial
// verifier (332 checks: 264 confirmed, 42 corrected, 7 wrong, 19 unverifiable; corrections applied).
// Every fact was then re-checked against its own link (37 facts: 16 fully supported, 21 trimmed,
// split or re-sourced). Results: ../research/fact_link_check.json.
// Raw research: ../research/country_research.json.
const draw = (start, pL, pR, note, source = "judgment") => ({ start, kind: "draw", pL, pR, note, source });
const keep = (start, k, note) => ({ start, kind: "keep", keep: k, note });
const fixed = (start, state, note) => ({ start, kind: "fixed", state, note });
const every = (from, to, step, pL, pR) => { const out = []; for (let y = from; y <= to; y += step) out.push(draw(y, pL, pR)); return out; };
const RATCHET = R(0.05, 0.12, 0.25);

export const GBR = {
  termYears: 5,
  iso3: "GBR", name: "United Kingdom", inName: "the United Kingdom", gdppc: 57602,
  trigger: { series: "OECD harmonised unemployment rate", baseline: 4.85, level: 7.9, source: "FRED LRHUTTTTGBM156S and NGDPRSAXDCGBQ",
             note: "2025 average from 12 monthly values; latest 4.9% (2026-05). Real GDP is at or above its previous peak (latest quarter). Since 1983, 1 rise of 3 points or more, all with real GDP below its previous peak." },
  pass: { L: R(0.5, 0.7, 0.9), R: R(0.5, 0.7, 0.9), O: R(0.3, 0.5, 0.7) },
  passNote: "UK single-party majorities fulfilled 86% of pledges at least partially (Thomson et al. 2017), the highest of 12 countries; a costly flagship passes less often than the typical pledge.",
  endorse: { L_normal: R(0.002, 0.01, 0.03), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.2, 0.45, 0.7), R_shock: R(0.02, 0.08, 0.2), O_shock: R(0.1, 0.3, 0.55) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate.",
  govShort: "Labour majority under Andy Burnham; election due by August 2029",
  leftWins: "Labour wins a Commons majority at the 2029 election",
  rightWins: "Reform or the Conservatives win a Commons majority in 2029",
  electionNote: "Left-led = a Labour Commons majority; right-led = a Reform or Conservative majority; other = hung parliament or coalition. A Commons majority can legislate a national benefit; the Lords can only delay.",
  periods: [
    fixed(2027, "L", "Labour holds 402 of 650 seats; Holborn and St Pancras is vacant. Polymarket: 23% that an election is called by mid-2027, not modeled."),
    draw(2029, R(0.08, 0.18, 0.32), R(0.10, 0.20, 0.35), "Manifold 'which government will form' (30 traders): Labour majority about 17%, a Reform or Conservative majority about 20%, hung parliament 53-63%. Latest polls: Reform 25, Labour 24, Conservatives 19.", "market"),
    ...every(2034, 2049, 5, R(0.18, 0.30, 0.42), R(0.20, 0.33, 0.46)),
  ],
  signpostPeriod: 1,
  endorseNote: "Burnham backed UBI as mayor ('an idea whose time has come', 2022) but has made no pledge as PM. Gilt yields near 5.3% and £13bn of fiscal headroom constrain a program. Reform and the Conservatives campaign on cutting benefits.",
  exposure: R(0.55, 0.78, 0.93), lag: R(-0.5, 1, 3),
  exposureNote: "IMF (2024): about 70% of UK jobs in high-AI-exposure occupations, above the US.",
  amount: { normal: R(4, 8, 14), shock: R(6, 12, 22) },
  amountNote: "The Universal Credit standard allowance (£424.90 a month, single, 25+) is about 11% of GDP per head.",
  ratchet: RATCHET,
  facts: [
    { text: "Andy Burnham became Prime Minister on 20 July 2026.", url: "https://en.wikipedia.org/wiki/2026_Labour_Party_leadership_election" },
    { text: "Labour holds 402 of 650 Commons seats; Holborn and St Pancras has been vacant since Keir Starmer resigned on 1 September 2026.", url: "https://en.wikipedia.org/wiki/List_of_MPs_elected_in_the_2024_United_Kingdom_general_election" },
    { text: "As Greater Manchester mayor, Burnham said of universal basic income in 2022: 'I think this is an idea whose time has come.'", url: "https://leftfootforward.org/2022/05/the-time-has-come-for-a-universal-basic-income-says-andy-burnham/" },
    { text: "In July 2023, Burnham called for a basic income pilot in Greater Manchester: 'I am calling for a pilot in our city-region.'", url: "https://nowthenmagazine.com/articles/could-this-radical-yet-simple-idea-transform-the-north-of-england-universal-basic-income-andy-burnham-ubi-lab" },
    { text: "Investment minister Jason Stockwood, a Labour peer, floated 'some sort of UBI' for AI-displaced workers (January 2026); the policy is not part of government plans.", url: "https://www.peoplemanagement.co.uk/article/1946845/universal-basic-income-needed-support-workers-displaced-ai-minister-says" },
    { text: "YouGov (2024): 46% support a UBI, 33% oppose; Labour voters 61%, Conservative 21%.", url: "https://yougov.com/en-gb/articles/50806-what-do-britons-think-of-universal-basic-income-in-2024" },
    { text: "The Green Party of England and Wales backs a UBI; in March 2023 the Liberal Democrats adopted a Guaranteed Basic Income instead of a UBI.", url: "https://en.wikipedia.org/wiki/Universal_basic_income_in_the_United_Kingdom" },
    { text: "The Lib Dems' Guaranteed Basic Income would raise Universal Credit to end deep poverty within a decade and remove UC sanctions.", url: "https://leftfootforward.org/2023/03/liberal-democrats-vote-for-a-guaranteed-basic-income/" },
  ],
};

export const CAN = {
  iso3: "CAN", name: "Canada", inName: "Canada", gdppc: 55698,
  trigger: { series: "OECD harmonised unemployment rate", baseline: 6.86, level: 9.9, source: "FRED LRHUTTTTCAM156S and NGDPRSAXDCCAQ",
             note: "2025 average from 12 monthly values; latest 6.4% (2026-08). Real GDP is at or above its previous peak (latest quarter). Since 1955, 3 rises of 3 points or more, all with real GDP below its previous peak." },
  pass: { L: R(0.5, 0.7, 0.9), R: R(0.5, 0.7, 0.9), O: R(0.3, 0.5, 0.7) },
  passNote: "Single-party governments fulfil pledges at the highest rates (Thomson et al. 2017); Canada's 2004-06 Liberal minority fulfilled 72%.",
  endorse: { L_normal: R(0.002, 0.01, 0.03), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.1, 0.3, 0.55), R_shock: R(0.02, 0.06, 0.15), O_shock: R(0.1, 0.25, 0.45) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate.",
  govShort: "Liberal majority under Mark Carney; election October 2029",
  leftWins: "The Liberals win a majority at the 2029 election",
  rightWins: "The Conservatives win a majority in 2029",
  electionNote: "Left-led = a Liberal majority; right-led = a Conservative majority; other = minority parliament (often Liberal with NDP support).",
  periods: [
    fixed(2027, "L", "Liberals reached 174 seats (172 needed) through 2026 by-elections and floor-crossings."),
    draw(2030, R(0.22, 0.40, 0.58), R(0.07, 0.16, 0.30), "Manifold (78 traders): Carney PM after the next election 67%, Poilievre 18%. Leger September 2026: Liberals 49, Conservatives 33. Minority parliaments are common (2019, 2021, 2025).", "market"),
    ...every(2034, 2050, 4, R(0.15, 0.27, 0.40), R(0.16, 0.30, 0.43)),
  ],
  signpostPeriod: 1,
  endorseNote: "Liberal MPs voted down the C-223 basic income framework 54-273 in 2024, and the 2026 convention adopted no basic-income resolution. Canadian designs lean income-tested (the PBO's guaranteed basic income), which would not qualify.",
  exposure: R(0.55, 0.78, 0.92), lag: R(-0.5, 0.5, 2),
  exposureNote: "Statistics Canada: about 60% of workers in highly AI-exposed jobs; US firms dominate Canadian tech services.",
  amount: { normal: R(4, 8, 16), shock: R(6, 12, 25) },
  ratchet: RATCHET,
  facts: [
    { text: "Bill C-223, which would have created a national framework for a guaranteed livable basic income, failed at second reading 54-273 on 25 September 2024.", url: "https://www.parl.ca/legisinfo/en/bill/44-1/c-223" },
    { text: "Speaking in the May 2024 debate on Bill C-223, Liberal MP Kevin Lamoureux said: 'I do not know if Canada is ready.'", url: "https://openparliament.ca/debates/2024/5/8/kevin-lamoureux-7/" },
    { text: "Its Senate successor, S-206, passed second reading on 6 November 2025 and sits in committee.", url: "https://www.parl.ca/legisinfo/en/bill/45-1/s-206" },
    { text: "Narrative Research (2022): 60% support an income-tested basic income, 37% a universal one.", url: "https://narrativeresearch.ca/while-the-majority-of-canadians-would-support-a-guaranteed-basic-income-for-low-income-individuals-opinions-are-mixed-towards-the-idea-of-a-universal-basic-income-for-all/" },
    { text: "Ontario's basic income pilot, introduced in 2017, was cancelled by Doug Ford's government in July 2018, after one year.", url: "https://www.cbc.ca/news/canada/toronto/basic-income-pilot-ontario-cancellation-lawsuit-1.7149067" },
  ],
};

export const DEU = {
  iso3: "DEU", name: "Germany", inName: "Germany", gdppc: 60496,
  trigger: { series: "OECD harmonised unemployment rate", baseline: 3.73, level: 6.7, source: "FRED LRHUTTTTDEM156S and CLVMNACSCAB1GQDE",
             note: "2025 average from 12 monthly values; latest 4.0% (2026-07). Real GDP is at or above its previous peak (latest quarter). No rise of 3 points or more since 1991." },
  pass: { L: R(0.3, 0.5, 0.7), R: R(0.3, 0.5, 0.7), O: R(0.25, 0.4, 0.6) },
  passNote: "Coalition governments have 72-76% lower odds of fulfilling pledges than single-party majorities (Thomson et al. 2017).",
  endorse: { L_normal: R(0.002, 0.01, 0.03), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.2, 0.45, 0.7), R_shock: R(0.02, 0.08, 0.2), O_shock: R(0.05, 0.15, 0.3) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate.",
  govShort: "CDU/CSU–SPD coalition under Friedrich Merz; election by March 2029",
  leftWins: "An SPD-, Green- or Linke-led government without the Union forms in 2029",
  rightWins: "A Union- or AfD-led government without the SPD or Greens forms in 2029",
  electionNote: "Left-led = a chancellor from the SPD, Greens or Linke governing without the Union; right-led = a Union- or AfD-led government without the SPD or Greens (in practice, a broken firewall); other = cross-bloc coalitions such as today's.",
  periods: [
    fixed(2027, "O", "CDU/CSU–SPD coalition, 328 of 630 seats, under strain after the September 2026 state elections."),
    draw(2029, R(0.03, 0.08, 0.18), R(0.07, 0.19, 0.38), "September 2026 polls put SPD+Greens+Linke at about 36-42%. Kalshi has the AfD at 81% to win the most seats, but the Union still rules out governing with it.", "market"),
    ...every(2033, 2049, 4, R(0.08, 0.17, 0.30), R(0.15, 0.33, 0.50)),
  ],
  signpostPeriod: 1,
  endorseNote: "The SPD calls a basic income 'falsch' (2019); Linke delegates overrode a pro-UBI member vote in 2024; the Greens keep it as a 'guiding idea'. The coalition tightened basic security in March 2026. Hamburg voters rejected even a pilot, 62.7% to 37.3%, in October 2025.",
  exposure: R(0.40, 0.70, 0.95), lag: R(0, 2, 5),
  exposureNote: "IMF (2024): Germany near the advanced-economy average of about 60% high-exposure employment; codetermination and short-time work slow measured job loss.",
  amount: { normal: R(4, 10, 22), shock: R(5, 13, 28) },
  amountNote: "The basic-security standard rate (€563 a month) is about 12.5% of GDP per head.",
  ratchet: RATCHET,
  facts: [
    { text: "Hamburg's referendum on a basic income pilot failed 37.3% to 62.7% (12 October 2025).", url: "https://de.wikipedia.org/wiki/Volksentscheid_%E2%80%9EHamburg_testet_Grundeinkommen%E2%80%9C_2025" },
    { text: "The Bundestag passed the stricter 'neue Grundsicherung' 320-268 on 5 March 2026.", url: "https://www.bundestag.de/dokumente/textarchiv/2026/kw10-de-grundsicherung-1150460" },
    { text: "A DIW Berlin study of Mein Grundeinkommen's pilot (€1,200 a month for 3 years) found no drop in work and better mental health (April 2025).", url: "https://www.diw.de/de/diw_01.c.945271.de/pilotprojekt_grundeinkommen__feldstudie_entkraeftet_mythos_von_der_sozialen_haengematte.html" },
    { text: "Compass survey by Infratest dimap (August 2022), analysed by DIW: 53% of Germans with online access support an unconditional basic income; 36% oppose.", url: "https://www.diw.de/de/diw_01.c.873126.de/publikationen/wochenberichte/2023_21_1/hohe_zustimmung_zu_bedingungslosem_grundeinkommen_____vor_allem_bei_den_moeglichen_profiteur_innen.html" },
  ],
};

export const FRA = {
  termYears: 5,
  iso3: "FRA", name: "France", inName: "France", gdppc: 48986,
  trigger: { series: "OECD harmonised unemployment rate", baseline: 7.72, level: 10.7, source: "FRED LRHUTTTTFRM156S and CLVMNACSCAB1GQFR",
             note: "2025 average from 12 monthly values; latest 8.3% (2026-07). Real GDP is below its previous peak in the latest quarter. No rise of 3 points or more since 1983." },
  pass: { L: R(0.5, 0.7, 0.9), R: R(0.5, 0.7, 0.9), O: R(0.1, 0.25, 0.45) },
  passNote: "An aligned president and Assembly behave like a single-party executive; cohabitation and minority governments pass little.",
  endorse: { L_normal: R(0.002, 0.01, 0.03), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.2, 0.45, 0.75), R_shock: R(0.03, 0.08, 0.2), O_shock: R(0.05, 0.15, 0.3) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate.",
  govShort: "Centrist minority government; presidential election April 2027",
  leftWins: "A left president with an aligned Assembly after 2027",
  rightWins: "A right or RN president with an aligned Assembly after 2027",
  electionNote: "Left-led = a left president with an aligned National Assembly; right-led = a right or RN president with an aligned Assembly; other = cohabitation or a minority government.",
  periods: [
    draw(2027, R(0.07, 0.15, 0.26), R(0.28, 0.40, 0.55), "Polymarket: Le Pen 42.75% to win the presidency; the left's candidates total about 23%. Legislative elections likely follow.", "market"),
    ...every(2032, 2047, 5, R(0.12, 0.22, 0.35), R(0.25, 0.38, 0.52)),
  ],
  endorseNote: "An aligned French executive faces few veto points and serves five years. Hamon ran on a universal income in 2017 (6.4%); today's left offers means-tested top-ups, and the government's reform (allocation sociale unique) is means-tested. Debt is 115.6% of GDP.",
  exposure: R(0.45, 0.75, 0.95), lag: R(0, 2, 5),
  amount: { normal: R(4, 11, 22), shock: R(5, 14, 26) },
  amountNote: "The RSA (€651.69 a month, single) is about 18% of GDP per head.",
  ratchet: RATCHET,
  facts: [
    { text: "Polymarket has Marine Le Pen at 42.8% to win the 2027 French presidential election.", url: "https://polymarket.com/event/next-french-presidential-election" },
    { text: "The 2027 French presidential election is scheduled for 18 April 2027, with a second round on 2 May if needed.", url: "https://en.wikipedia.org/wiki/2027_French_presidential_election" },
    { text: "Benoît Hamon's 2017 universal income platform won 6.36% in the first round.", url: "https://en.wikipedia.org/wiki/2017_French_presidential_election" },
    { text: "The National Assembly rejected a bill for a territorial basic income experiment on 31 January 2019.", url: "https://www.assemblee-nationale.fr/dyn/15/dossiers/experimentation_territoriale_instauration" },
    { text: "The bill, backed by 18 departments, would have covered 60,000 people over three years.", url: "https://www.rtes.fr/la-proposition-de-loi-d-experimentation-du-revenu-de-base-soutenue-par-18-departements-rejetee-a-l" },
    { text: "Ifop (March 2021): 57% favour a basic income paid monthly to people below a certain income level.", url: "https://www.ifopgroup.com/publication/les-francais-et-la-mise-en-place-dun-revenu-de-base/" },
    { text: "OpinionWay (January 2018): 34% favour a universal income of €600–800 a month paid to every citizen without a means test; 63% oppose.", url: "https://www.publicsenat.fr/actualites/non-classe/sondage-63-des-francais-sont-opposes-a-la-creation-d-un-revenu-universel-82155" },
  ],
};

export const ESP = {
  iso3: "ESP", name: "Spain", inName: "Spain", gdppc: 38627,
  trigger: { series: "OECD harmonised unemployment rate", baseline: 10.51, level: 13.5, source: "FRED LRHUTTTTESM156S and CLVMNACSCAB1GQES",
             note: "2025 average from 12 monthly values; latest 10.0% (2026-07). Real GDP is at or above its previous peak (latest quarter). Since 1986, 1 rise of 3 points or more, all with real GDP below its previous peak." },
  pass: { L: R(0.3, 0.5, 0.7), R: R(0.3, 0.5, 0.7), O: R(0.2, 0.4, 0.6) },
  passNote: "Spanish governments are usually minority coalitions; coalitions have 72-76% lower odds of fulfilling pledges (Thomson et al. 2017).",
  endorse: { L_normal: R(0.002, 0.01, 0.03), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.15, 0.4, 0.65), R_shock: R(0.02, 0.08, 0.2), O_shock: R(0.05, 0.15, 0.3) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate.",
  govShort: "PSOE–Sumar minority under Pedro Sánchez; election by August 2027",
  leftWins: "A PSOE-led government forms after the 2027 election",
  rightWins: "A PP-led government forms after the 2027 election",
  electionNote: "Left-led = a PSOE-led government; right-led = a PP-led government (likely with Vox); other = grand coalition or caretaker. Ordinary laws pass by a simple majority of those present.",
  periods: [
    fixed(2027, "L", "PSOE–Sumar minority coalition (147 of 350 seats) governing through ad hoc majorities."),
    draw(2028, R(0.10, 0.20, 0.35), R(0.60, 0.76, 0.88), "Polymarket: Feijóo 79% to be the next prime minister. Private polls put PP+Vox above 176 seats.", "market"),
    ...every(2032, 2048, 4, R(0.30, 0.45, 0.60), R(0.35, 0.50, 0.65)),
  ],
  signpostPeriod: 1,
  endorseNote: "PSOE built the means-tested Ingreso Mínimo Vital and dropped Sumar's universal inheritance in coalition talks. Sumar proposes €550 a month for 18- to 21-year-olds as a first step. The Catalan pilot has not launched.",
  exposure: R(0.30, 0.55, 0.80), lag: R(0, 2, 5),
  exposureNote: "A services-heavy economy whose firms adopt AI more slowly than US firms.",
  amount: { normal: R(4, 10, 25), shock: R(6, 14, 28) },
  amountNote: "The IMV guarantee (€8,803 a year, single) is about 26% of GDP per head.",
  ratchet: RATCHET,
  facts: [
    { text: "Polymarket gives Alberto Núñez Feijóo 79% to be Spain's next prime minister.", url: "https://polymarket.com/predictions/spain" },
    { text: "Feijóo has led Spain's People's Party (PP) since 2022.", url: "https://en.wikipedia.org/wiki/Alberto_N%C3%BA%C3%B1ez_Feij%C3%B3o" },
    { text: "In 2026 the IMV guarantees a single adult an income floor of €8,803.20 a year; it is means-tested and lasts as long as the need persists (Ley 19/2021).", url: "https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesTrabajadores/65850d68-8d06-4645-bde7-05374ee42ac7/acreditaciondelosrequisitos" },
    { text: "Movimiento Sumar proposed a universal €550 a month for ages 18-21 (November 2025).", url: "https://www.infobae.com/espana/agencias/2025/11/22/movimiento-sumar-propone-una-renta-basica-universal-para-los-jovenes-de-550-euros-al-mes-entre-los-18-y-21-anos/" },
    { text: "Pedro Sánchez's AI plan, IA360 (September 2026), answers AI job risk with a social contract among companies, workers and unions; it contains no income guarantee.", url: "https://www.lamoncloa.gob.es/presidente/actividades/paginas/2026/210926-sanchez-plan-ia.aspx" },
    { text: "IA360 plans a tripartite agreement, with the government convening the social partners in October 2026.", url: "https://www.lamoncloa.gob.es/presidente/actividades/Documents/2026/20260920%20Plan%20IA360.pdf" },
  ],
};

export const BRA = {
  iso3: "BRA", name: "Brazil", inName: "Brazil", gdppc: 10713,
  trigger: { series: "IBGE PNAD Cont\u00ednua unemployment rate (rolling quarter)", baseline: 5.95, level: 8.9, source: "IBGE SIDRA table 6381 and FRED NGDPRSAXDCBRQ",
             note: "2025 average from 12 monthly values; latest 5.3% (2026-08). Real GDP is at or above its previous peak (latest quarter). History not checked (series fetched from 2024)." },
  pass: { L: R(0.15, 0.3, 0.5), R: R(0.15, 0.3, 0.5), O: R(0.15, 0.3, 0.5) },
  passNote: "Presidents govern with fragmented, center-right congresses that control appropriations under a spending cap.",
  endorse: { L_normal: R(0.002, 0.01, 0.03), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.2, 0.45, 0.7), R_shock: R(0.05, 0.12, 0.3), O_shock: R(0.1, 0.25, 0.45) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate.",
  govShort: "Lula (PT) seeking re-election on 4 October 2026",
  leftWins: "Lula wins the 2026 presidential election",
  rightWins: "Flávio Bolsonaro or another right candidate wins in 2026",
  electionNote: "Left-led = a PT-led presidency; right-led = a right-wing presidency; other = a centrist president. Brazil's Congress leans right and controls appropriations under a spending cap.",
  periods: [
    draw(2027, R(0.35, 0.45, 0.56), R(0.43, 0.53, 0.63), "Polymarket: Flávio Bolsonaro 58%, Lula 41%. Polls show a tied runoff (Datafolha 47-45 Lula; AtlasIntel 46.4-46.2 Flávio).", "market"),
    ...every(2031, 2047, 4, R(0.25, 0.38, 0.52), R(0.35, 0.50, 0.65)),
  ],
  endorseNote: "A universal statute already exists (Law 10.835/2004, only partially implemented), and the 2023 Bolsa Família law calls itself a step toward it. A left president would still face a right-leaning Congress and a spending cap.",
  exposure: R(0.15, 0.35, 0.60), lag: R(0, 3, 7),
  exposureNote: "IMF (2024): 41% of Brazilian employment highly exposed, against about 60% in the US.",
  amount: { normal: R(1.5, 4, 9), shock: R(3, 7, 16) },
  amountNote: "Bolsa Família's per-person component is 2.9% of GDP per head; the 2020 Auxílio Emergencial paid R$600 a month to about 68 million people, about 12%.",
  ratchet: RATCHET,
  facts: [
    { text: "Law 10.835/2004, written by Eduardo Suplicy, created a citizen's basic income from 2005, but it has been only partially implemented.", url: "https://pt.wikipedia.org/wiki/Renda_b%C3%A1sica_universal" },
    { text: "As of July 2026, Suplicy was still campaigning, as he has for decades, for the law to be implemented.", url: "https://www.redemacuco.com.br/2026/07/15/suplicy-mostra-como-paises-da-copa-adotam-a-renda-basica/" },
    { text: "The Bolsa Família law (Lei 14.601/2023) describes the program as a stage toward universalizing that income.", url: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14601.htm" },
    { text: "None of the 13 registered 2026 presidential platforms summarized proposes a universal income; Flavio Bolsonaro, Caiado and Zema propose 'porta de saída' exit paths from social programs such as Bolsa Família.", url: "https://planodegoverno2026.com.br/temas/presidente/renda/" },
    { text: "Maricá pays a municipal basic income of R$230 a month to more than 70,000 residents (income-tested).", url: "https://maricainfo.com/2026/05/11/marica-faz-recadastramento-do-mumbuca-para-mais-de-70-mil-beneficiarios-saiba-mais.html" },
  ],
};

export const KOR = {
  iso3: "KOR", name: "South Korea", inName: "South Korea", gdppc: 36227,
  trigger: { series: "OECD harmonised unemployment rate", baseline: 2.79, level: 5.8, source: "FRED LRHUTTTTKRM156S and NGDPRSAXDCKRQ",
             note: "2025 average from 12 monthly values; latest 2.8% (2026-07). Real GDP is at or above its previous peak (latest quarter). Since 1990, 1 rise of 3 points or more, all with real GDP below its previous peak." },
  pass: { L: R(0.5, 0.7, 0.9), R: R(0.5, 0.7, 0.9), O: R(0.05, 0.15, 0.3) },
  passNote: "A unified government passes its program; under divided government the president can veto and the Assembly controls the budget.",
  endorse: { L_normal: R(0.005, 0.03, 0.08), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.35, 0.6, 0.85), R_shock: R(0.03, 0.1, 0.25), O_shock: R(0.1, 0.25, 0.45) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate. South Korea is set higher because its president has proposed universal payments before.",
  govShort: "Lee Jae-myung (DP), who pledged a universal payment in 2022; Assembly election April 2028",
  leftWins: "The Democratic Party keeps its Assembly majority in April 2028",
  electionNote: "Left-led = a Democratic Party president with an Assembly majority; right-led = the same for the People Power Party; other = divided government. The president serves one five-year term.",
  periods: [
    fixed(2027, "L", "President Lee (DP) with a DP majority of 161 of 300 seats."),
    { ...draw(2028, R(0.35, 0.52, 0.72), R(0, 0.02, 0.05), "Gallup Korea (September 2026): DP 40%, PPP 27%, but Lee's approval is at a record low of 37%.", "data"), hog: false },
    draw(2030, R(0.28, 0.40, 0.52), R(0.20, 0.30, 0.42), "Open presidential election; power changed hands in 2017, 2022 and 2025."),
    keep(2032, R(0.30, 0.50, 0.70), "Assembly election two years into a presidency."),
    draw(2035, R(0.28, 0.40, 0.52), R(0.20, 0.30, 0.42)), keep(2036, R(0.30, 0.50, 0.70)),
    draw(2040, R(0.28, 0.40, 0.52), R(0.20, 0.30, 0.42)), keep(2044, R(0.30, 0.50, 0.70)),
    draw(2045, R(0.28, 0.40, 0.52), R(0.20, 0.30, 0.42)), keep(2048, R(0.30, 0.50, 0.70)),
    draw(2050, R(0.28, 0.40, 0.52), R(0.20, 0.30, 0.42)),
  ],
  signpostPeriod: 1,
  endorseNote: "Lee ran the Gyeonggi youth basic income and pledged a universal payment in 2022, then dropped it in 2025. His health ministry now has a Basic Income Planning Team aiming at a 2027 pilot and cites AI-driven unemployment. Amounts proposed so far are small.",
  exposure: R(0.40, 0.60, 0.85), lag: R(-1, 0.5, 3),
  exposureNote: "Highly digitized, and the government already reports AI-driven cuts to youth hiring. Unemployment starts low (2.7% in 2025 against 4.2% in the US).",
  amount: { normal: R(0.5, 2.5, 7), shock: R(2, 5, 12) },
  amountNote: "Lee's 2022 pledge (1 million won a year) was about 1.9% of GDP per head; the rural pilot pays 150,000 won a month in local vouchers.",
  ratchet: RATCHET,
  facts: [
    { text: "Lee Jae Myung took office as president on 4 June 2025.", url: "https://en.wikipedia.org/wiki/Lee_Jae_Myung" },
    { text: "South Korean presidents serve a single five-year term; the next presidential election is scheduled for 27 March 2030.", url: "https://en.wikipedia.org/wiki/2030_South_Korean_presidential_election" },
    { text: "Han Seong-sook has been Prime Minister of South Korea since 1 July 2026.", url: "https://en.wikipedia.org/wiki/Han_Seong-sook" },
    { text: "The health ministry created a Basic Income Planning Team (April 2026), aiming at a 2027 pilot and citing AI-driven structural unemployment.", url: "https://www.asiae.co.kr/en/article/2026041010003852773" },
    { text: "A rural basic income pilot pays all registered residents of selected depopulating counties 150,000 won a month in local vouchers (2026-27).", url: "https://www.koreaherald.com/article/10643605" },
    { text: "KIHASA survey (2024): 45.7% support a universal basic income, 54.3% oppose.", url: "https://www.segye.com/newsView/20250129507224" },
  ],
};

export const JPN = {
  iso3: "JPN", name: "Japan", inName: "Japan", gdppc: 35951,
  trigger: { series: "OECD harmonised unemployment rate", baseline: 2.52, level: 5.5, source: "FRED LRHUTTTTJPM156S and JPNRGDPEXP",
             note: "2025 average from 12 monthly values; latest 2.4% (2026-07). Real GDP is at or above its previous peak (latest quarter). No rise of 3 points or more since 1955." },
  pass: { L: R(0.3, 0.5, 0.7), R: R(0.5, 0.7, 0.9), O: R(0.25, 0.45, 0.65) },
  passNote: "An LDP majority passes its program; a non-LDP government would be a coalition.",
  endorse: { L_normal: R(0.002, 0.01, 0.03), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.2, 0.4, 0.65), R_shock: R(0.05, 0.15, 0.3), O_shock: R(0.1, 0.25, 0.45) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate.",
  govShort: "LDP–Ishin supermajority under Sanae Takaichi; election by February 2030",
  leftWins: "A non-LDP government forms after the next lower-house election",
  rightWins: "The LDP keeps a governing majority after the next lower-house election",
  electionNote: "Left-led = a non-LDP government led by the centre-left opposition; right-led = an LDP-led government; other = an LDP minority or loose-support arrangement. Japan's most basic-income-friendly large party, Ishin, sits inside the right-led coalition.",
  periods: [
    fixed(2027, "R", "LDP 316 of 465 lower-house seats plus Ishin 36; 120 of 248 in the upper house."),
    draw(2030, R(0.01, 0.03, 0.08), R(0.80, 0.90, 0.97), "The LDP polls 23-43% in September 2026; no other party tops about 6%.", "data"),
    ...every(2034, 2050, 4, R(0.03, 0.08, 0.18), R(0.60, 0.75, 0.88)),
  ],
  signpostPeriod: 1,
  endorseNote: "The Takaichi cabinet chose a work-conditional refundable credit (from April 2027), which crowds out a basic income for years. Ishin lists basic income among its options; Team Mirai names it as the safety net for an AGI scenario. Debt is about 206% of GDP.",
  exposure: R(0.25, 0.45, 0.70), lag: R(0, 2, 5),
  exposureNote: "Unemployment is 2.45% and the workforce is shrinking, so AI may show up as fewer hires rather than job losses.",
  amount: { normal: R(1.5, 4, 13.4), shock: R(3, 7, 15) },
  amountNote: "The 2020 one-off ¥100,000 payment was 1.9% of GDP per head; Ishin's ¥60,000-a-month plan would be about 13%.",
  ratchet: RATCHET,
  facts: [
    { text: "Sanae Takaichi has been Prime Minister since 21 October 2025; the LDP won 316 of 465 seats in February 2026.", url: "https://en.wikipedia.org/wiki/2026_Japanese_general_election" },
    { text: "The cabinet adopted a work-conditional 'worker burden relief payment' from April 2027 (outline, 15 September 2026).", url: "https://jitsumu-guide.com/refundable-tax-credit-guide-2026/" },
    { text: "Ishin's 2026 platform lists a refundable credit, negative income tax or basic income as routes to a minimum income.", url: "https://o-ishin.jp/policy/8saku2026.html" },
    { text: "Japan paid ¥100,000 to every registered resident once in 2020.", url: "https://ja.wikipedia.org/wiki/%E7%89%B9%E5%88%A5%E5%AE%9A%E9%A1%8D%E7%B5%A6%E4%BB%98%E9%87%91" },
  ],
};

export const AUS = {
  termYears: 3,
  iso3: "AUS", name: "Australia", inName: "Australia", gdppc: 65130,
  trigger: { series: "OECD harmonised unemployment rate", baseline: 4.2, level: 7.2, source: "FRED LRHUTTTTAUM156S and NGDPRSAXDCAUQ",
             note: "2025 average from 12 monthly values; latest 4.461825% (2026-07). Real GDP is at or above its previous peak (latest quarter). Since 1978, 2 rises of 3 points or more, all with real GDP below its previous peak." },
  pass: { L: R(0.5, 0.7, 0.9), R: R(0.5, 0.7, 0.9), O: R(0.3, 0.5, 0.7) },
  passNote: "Single-party Westminster majorities fulfil pledges at the highest rates (Thomson et al. 2017); the Senate can delay.",
  endorse: { L_normal: R(0.002, 0.01, 0.03), R_normal: R(0.001, 0.004, 0.012), O_normal: R(0.001, 0.004, 0.012),
             L_shock: R(0.1, 0.35, 0.6), R_shock: R(0.02, 0.08, 0.2), O_shock: R(0.1, 0.3, 0.55) },
  endorseSource: { L_normal: "data", R_normal: "data", O_normal: "data" },
  endorseBaseNote: "None of the ten governments endorsed a strict UBI in about 75 government terms since 2000, so no-shock endorsement is near 1% per term; with that rate the clean record had about a 47% chance, against 11% under a 3% rate.",
  govShort: "Labor majority under Anthony Albanese; election due by 2028",
  leftWins: "Labor wins a majority at the 2028 election",
  rightWins: "The Coalition or One Nation forms government in 2028",
  electionNote: "Left-led = a Labor majority; right-led = a Coalition- or One Nation-led government; other = a minority government, most likely Labor with Greens or independents. Three-year terms.",
  periods: [
    fixed(2027, "L", "Labor holds 94 of 150 House seats after the May 2025 landslide."),
    draw(2028, R(0.38, 0.53, 0.65), R(0.20, 0.32, 0.45), "Manifold: Labor majority 57% (12 traders); Labor alone 54% in the government-combination market. Polymarket: Albanese 45.5%, Hanson 23%, Taylor 15.5% as next PM.", "market"),
    ...every(2031, 2049, 3, R(0.35, 0.44, 0.52), R(0.33, 0.43, 0.52)),
  ],
  signpostPeriod: 1,
  endorseNote: "Andrew Leigh, now an assistant Treasury minister, wrote in 2017, as shadow assistant treasurer, that a UBI has 'zero impact on inequality'. The government answered AI job risk with monitoring and training (2026). The Greens back 'an unconditional livable income'. Pape v FCT (2009) leaves the constitutional basis for a lasting payment unsettled.",
  exposure: R(0.50, 0.75, 0.92), lag: R(-0.5, 1, 3),
  amount: { normal: R(3, 7, 14), shock: R(4, 9, 20) },
  amountNote: "JobSeeker's maximum (A$824.90 a fortnight) is about 21% of GDP per head.",
  ratchet: RATCHET,
  facts: [
    { text: "Labor won 94 of 150 House seats in May 2025; the House now stands at Labor 94, Coalition 41, crossbench 15.", url: "https://en.wikipedia.org/wiki/Next_Australian_federal_election" },
    { text: "A Department of Employment and Workplace Relations report (July 2026) found AI not yet causing mass job losses; the government responded with regular monitoring, a regular government-employer-union meeting, and skills and training support.", url: "https://www.abc.net.au/news/2026-07-08/government-report-finds-ai-not-yet-causing-mass-job-losses/106889304" },
    { text: "The Greens' policy calls for 'an unconditional livable income'.", url: "https://greens.org.au/policies/social-services" },
    { text: "ANU Poll (2021): 55% in favour of a basic income; only 38% favour equal payments to everyone.", url: "https://whataustraliathinks.org.au/data_story/is-the-universal-basic-income-for-us/" },
  ],
};

export const COUNTRIES = [US, GBR, CAN, DEU, FRA, ESP, JPN, KOR, AUS, BRA];


# Adversarial citation verification: UBI economics, politics and opinion references

Today is 2026-09-30. These references will be cited in a working paper by Max Ghenis, "When will countries enact a universal basic income? A Bayesian decomposition". For each one, independently fetch the primary landing page (publisher, DOI resolver, NBER, official site) and check every BibTeX field: author spelling, year, title, venue, volume, issue, pages, DOI. Also check that the "supports" sentence doesn't overstate the work.

Verdicts: CONFIRMED, CORRECTED (give the corrected BibTeX), WRONG (the work doesn't exist or is misattributed) or UNVERIFIABLE (say what you tried). Never invent a DOI. Read only.

Write to the -o path: a short summary, then a fenced ```json block with {"checks": [{"key", "verdict", "corrected_bibtex", "supports_ok", "supports_fix", "evidence"}]}.

References:
[
 {
  "key": "hoynes2019universal",
  "bibtex": "@article{hoynes2019universal,\n  author  = {Hoynes, Hilary and Rothstein, Jesse},\n  title   = {Universal Basic Income in the {United States} and Advanced Countries},\n  journal = {Annual Review of Economics},\n  volume  = {11},\n  number  = {1},\n  pages   = {929--958},\n  year    = {2019},\n  doi     = {10.1146/annurev-economics-080218-030237}\n}",
  "supports": "Supports the claim that a UBI would shift transfers toward childless, nonelderly, nondisabled and middle-income households compared with existing US programs. It also supports the claim that a UBI generous enough to raise transfers to low-income families would be 'enormously expensive'. That fiscal barrier is the one the enactment-hazard priors must price in advanced countries. The review also covers labor-supply evidence and argues that pilots will do little to settle the main open questions.",
  "url_checked": "https://www.annualreviews.org/content/journals/10.1146/annurev-economics-080218-030237",
  "verified": true
 },
 {
  "key": "banerjee2019universal",
  "bibtex": "@article{banerjee2019universal,\n  author  = {Banerjee, Abhijit and Niehaus, Paul and Suri, Tavneet},\n  title   = {Universal Basic Income in the Developing World},\n  journal = {Annual Review of Economics},\n  volume  = {11},\n  number  = {1},\n  pages   = {959--983},\n  year    = {2019},\n  doi     = {10.1146/annurev-economics-080218-030229}\n}",
  "supports": "The developing-country counterpart to Hoynes and Rothstein. It reviews what is known and unknown about three questions: how recipients use extra income, whether a UBI would unlock growth, and whether universal payments beat targeted ones. Cite it for the argument that the economics and politics of a UBI differ between countries with and without mature safety nets. It does not give enactment probabilities.",
  "url_checked": "https://www.annualreviews.org/content/journals/10.1146/annurev-economics-080218-030229",
  "verified": true
 },
 {
  "key": "dewispelaere2012feasibility",
  "bibtex": "@incollection{dewispelaere2012feasibility,\n  author    = {De Wispelaere, Jurgen and Noguera, Jos{\\'e} Antonio},\n  title     = {On the Political Feasibility of Universal Basic Income: An Analytic Framework},\n  booktitle = {Basic Income Guarantee and Politics},\n  editor    = {Caputo, Richard K.},\n  publisher = {Palgrave Macmillan},\n  address   = {New York},\n  year      = {2012},\n  pages     = {17--38},\n  doi       = {10.1057/9781137045300_2}\n}",
  "supports": "Defines political feasibility in probabilistic terms: a 'reasonable probability of the policy becoming actualized in the foreseeable future'. That definition motivates treating enactment as a forecastable probability. It crosses agency (discrete vs. diffuse) with constraints (prospective vs. retrospective) to get four types: strategic, institutional, psychological and behavioral feasibility. The paper can map its government-control and enactment-hazard terms onto the prospective cells. That mapping is the paper's own, not the authors'.",
  "url_checked": "https://link.springer.com/chapter/10.1057/9781137045300_2 (metadata and abstract); full text read from the author-posted PDF on ResearchGate (pp. 17-21, Table 2.1)",
  "verified": true
 },
 {
  "key": "roosma2020public",
  "bibtex": "@article{roosma2020public,\n  author  = {Roosma, Femke and van Oorschot, Wim},\n  title   = {Public Opinion on Basic Income: Mapping {European} Support for a Radical Alternative for Welfare Provision},\n  journal = {Journal of European Social Policy},\n  volume  = {30},\n  number  = {2},\n  pages   = {190--205},\n  year    = {2020},\n  doi     = {10.1177/0958928719882827}\n}",
  "supports": "Uses the ESS round 8 (2016) question in 23 countries, which describes a BI as universal, unconditional, tax-financed and replacing other benefits. Support is 'relatively high, but varying' across countries and groups. It is higher among economically vulnerable, left-leaning, egalitarian and younger respondents, and in countries with more material deprivation. It is evidence on stated support, not on enactment. Caveat: the article labels code LT as 'Latvia' (its top-support country), but LT is Lithuania in ESS 8. Cite the country as Lithuania or not at all.",
  "url_checked": "https://journals.sagepub.com/doi/10.1177/0958928719882827 (also Tilburg University research portal record and Crossref abstract)",
  "verified": true
 },
 {
  "key": "parolin2020support",
  "bibtex": "@article{parolin2020support,\n  author  = {Parolin, Zachary and Si{\\\"o}land, Linus},\n  title   = {Support for a Universal Basic Income: A Demand--Capacity Paradox?},\n  journal = {Journal of European Social Policy},\n  volume  = {30},\n  number  = {1},\n  pages   = {5--19},\n  year    = {2020},\n  doi     = {10.1177/0958928719886525}\n}",
  "supports": "Uses ESS 2016 multilevel models to show that a broader coalition of UBI supporters appears where social spending is low. Welfare chauvinism and ideology matter more for UBI attitudes in high-spending countries. The authors call this a 'demand-capacity paradox': countries least equipped to implement a UBI show the broadest support. It supports treating high stated support as weak evidence of enactment capacity when setting cross-country priors.",
  "url_checked": "https://journals.sagepub.com/doi/10.1177/0958928719886525",
  "verified": true
 },
 {
  "key": "dermont2020automation",
  "bibtex": "@article{dermont2020automation,\n  author  = {Dermont, Clau and Weisstanner, David},\n  title   = {Automation and the Future of the Welfare State: Basic Income as a Response to Technological Change?},\n  journal = {Political Research Exchange},\n  volume  = {2},\n  number  = {1},\n  pages   = {1757387},\n  year    = {2020},\n  doi     = {10.1080/2474736X.2020.1757387}\n}",
  "supports": "A research note using ESS data for 21 countries. It finds no association between an individual's job-automation risk and UBI support, and finds demand for UBI lower than demand for redistribution. This is a caution for the AI-labor-shock channel: pre-shock automation exposure has not translated into UBI support, so the shock-to-enactment link must work through something other than existing risk-driven preferences. Busemeyer and Sahm (2022, Journal of Social Policy 51(4):751-770, doi:10.1017/S0047279421000519, also verified) likewise find no significant automation-risk association with basic-income support.",
  "url_checked": "https://www.tandfonline.com/doi/full/10.1080/2474736X.2020.1757387",
  "verified": true
 },
 {
  "key": "steensland2008failed",
  "bibtex": "@book{steensland2008failed,\n  author    = {Steensland, Brian},\n  title     = {The Failed Welfare Revolution: {America}'s Struggle over Guaranteed Income Policy},\n  publisher = {Princeton University Press},\n  address   = {Princeton, NJ},\n  year      = {2008},\n  doi       = {10.1515/9781400837489},\n  note      = {DOI is the De Gruyter digital edition (2011); paperback reissue 2017, ISBN 9780691177977},\n  url       = {https://press.princeton.edu/books/paperback/9780691177977/the-failed-welfare-revolution}\n}",
  "supports": "The historical near-miss case: guaranteed-income plans had broad bipartisan support in the 1960s, and Nixon's Family Assistance Plan 'nearly passed into law'. Carter later advanced a similar bill. Steensland attributes the failure partly to stakeholders and institutions, and centrally to culture: the plans challenged the distinction between 'deserving' and 'undeserving' poor. This supports keeping enactment hazards well below 1 even when the governing coalition favors the policy.",
  "url_checked": "https://press.princeton.edu/books/paperback/9780691177977/the-failed-welfare-revolution ; https://www.degruyterbrill.com/document/doi/10.1515/9781400837489/html",
  "verified": true
 },
 {
  "key": "kangas2021feasibility",
  "bibtex": "@incollection{kangas2021feasibility,\n  author    = {Kangas, Olli},\n  title     = {The Feasibility of Universal Basic Income},\n  booktitle = {Experimenting with Unconditional Basic Income: Lessons from the {Finnish} {BI} Experiment 2017--2018},\n  editor    = {Kangas, Olli and Jauhiainen, Signe and Simanainen, Miska and Ylik{\\\"a}nn{\\\"o}, Minna},\n  publisher = {Edward Elgar Publishing},\n  year      = {2021},\n  chapter   = {14},\n  pages     = {187--196},\n  doi       = {10.4337/9781839104855.00022}\n}",
  "supports": "Applies the De Wispelaere-Noguera typology to Finland after the 2017-2018 experiment. Finnish support is 60-70% in principle but falls to about 30% when respondents are told taxes would rise. Advocates are a diffuse group without discrete power, and there are institutional and EU-level constraints. It concludes that 'for the time being universal basic income is not a realistic policy option' in Finland. That directly informs a low Finnish enactment prior and shows how cost framing moves stated support.",
  "url_checked": "https://doi.org/10.4337/9781839104855.00022 (resolves to Elgar Online); full chapter read from the University of Turku repository copy (utupub.fi), pp. 187-196",
  "verified": true
 },
 {
  "key": "verho2022removing",
  "bibtex": "@article{verho2022removing,\n  author  = {Verho, Jouko and H{\\\"a}m{\\\"a}l{\\\"a}inen, Kari and Kanninen, Ohto},\n  title   = {Removing Welfare Traps: Employment Responses in the {Finnish} Basic Income Experiment},\n  journal = {American Economic Journal: Economic Policy},\n  volume  = {14},\n  number  = {1},\n  pages   = {501--522},\n  year    = {2022},\n  doi     = {10.1257/pol.20200143}\n}",
  "supports": "The peer-reviewed employment estimate from Finland's experiment. It randomized 2,000 unemployment-benefit recipients to a basic income, which cut participation tax rates for full-time work by 23 percentage points. Days in employment were statistically unchanged in the first year. Use it for the finding that the only nationwide randomized BI trial produced minor employment effects at best. It is not evidence about a full-population UBI.",
  "url_checked": "https://www.aeaweb.org/articles?id=10.1257/pol.20200143",
  "verified": true
 },
 {
  "key": "vivalt2024employment",
  "bibtex": "@techreport{vivalt2024employment,\n  author      = {Vivalt, Eva and Rhodes, Elizabeth and Bartik, Alexander W. and Broockman, David E. and Krause, Patrick and Miller, Sarah},\n  title       = {The Employment Effects of a Guaranteed Income: Experimental Evidence from Two {U.S.} States},\n  institution = {National Bureau of Economic Research},\n  type        = {NBER Working Paper},\n  number      = {32719},\n  year        = {2024},\n  note        = {Revised August 2026},\n  doi         = {10.3386/w32719}\n}",
  "supports": "The OpenResearch RCT randomized 1,000 low-income people to $1,000 a month for three years, against 2,000 controls receiving $50 a month. Non-transfer income fell about $1,900 a year, and labor-market participation fell 4.2 percentage points. Hours fell 1-2 a week, with a similar reduction for partners. The authors call it a moderate labor-supply effect. It is still a working paper (July 2024, revised August 2026, no journal version listed). Cite the revision's numbers; earlier versions reported different magnitudes.",
  "url_checked": "https://www.nber.org/papers/w32719",
  "verified": true
 },
 {
  "key": "jones2022labor",
  "bibtex": "@article{jones2022labor,\n  author  = {Jones, Damon and Marinescu, Ioana},\n  title   = {The Labor Market Impacts of Universal and Permanent Cash Transfers: Evidence from the {Alaska} {Permanent} {Fund}},\n  journal = {American Economic Journal: Economic Policy},\n  volume  = {14},\n  number  = {2},\n  pages   = {315--340},\n  year    = {2022},\n  doi     = {10.1257/pol.20190299}\n}",
  "supports": "Every Alaska resident has received a yearly dividend since 1982. Using CPS data and synthetic control, the authors find no effect on employment and a 1.8 percentage point (17 percent) rise in part-time work, consistent with local general-equilibrium stimulus. Cite it as evidence that a universal, permanent, unconditional transfer exists subnationally and did not significantly reduce aggregate employment. Not verified: whether the dividend clears the paper's share-of-GDP-per-head threshold.",
  "url_checked": "https://www.aeaweb.org/articles?id=10.1257/pol.20190299",
  "verified": true
 },
 {
  "key": "salehiisfahani2018cash",
  "bibtex": "@article{salehiisfahani2018cash,\n  author  = {Salehi-Isfahani, Djavad and Mostafavi-Dehzooei, Mohammad H.},\n  title   = {Cash Transfers and Labor Supply: Evidence from a Large-Scale Program in {Iran}},\n  journal = {Journal of Development Economics},\n  volume  = {135},\n  pages   = {349--367},\n  year    = {2018},\n  doi     = {10.1016/j.jdeveco.2018.08.005}\n}",
  "supports": "Iran's 2011 program paid monthly cash into individual accounts for more than 70 million people, worth 28% of median per capita household income. It compensated for the removal of energy subsidies. Panel evidence shows no reduction in hours or participation, and positive effects for women and self-employed men. Cite it as the closest national-scale precedent, enacted as subsidy compensation. The 28% is relative to median per capita household income, not GDP per head, so don't apply it directly to the paper's threshold.",
  "url_checked": "https://ideas.repec.org/a/eee/deveco/v135y2018icp349-367.html (DOI redirect to ScienceDirect pii S0304387818306084 observed; ScienceDirect page itself blocked automated access)",
  "verified": true
 }
]

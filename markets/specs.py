"""Specs for Max's US UBI Manifold slate (2026-09-29, revision 2).

Revision 2 applies the adversarial review (B1-B2, S1-S14, N1-N5) and takes the
opening odds from the decomposed model in ../model (results.json -> seeds).
build(links) returns create-market payloads; links fills cross-market URLs.
"""
import datetime
import json
import zoneinfo
from pathlib import Path

ET = zoneinfo.ZoneInfo("America/New_York")
SEEDS = json.loads((Path(__file__).parent.parent / "model" / "results.json").read_text())["seeds"]


def ms(y, m, d, hh=23, mm=59):
    return int(datetime.datetime(y, m, d, hh, mm, tzinfo=ET).timestamp() * 1000)


G = {  # Manifold topic ids (GET /v0/group/<slug>, 2026-09-29)
    "universal-basic-income": "4d7e6c83-c429-409c-bd1e-f38ad730f9d7",
    "ubi": "6c924bd5-d4ae-414b-80c0-0368c0d89601",
    "us-politics": "AjxQR8JMpNyDqtiqoA96",
    "economics-default": "p88Ycq6yFd5ECKqq9PFO",
    "elections": "i5JOzjrK5ZMHPSkhgzoi",
    "2028-us-presidential-election": "c83fd20c-226d-4b9e-ad21-b116412d4009",
}

CPI_RULE = (
    "**Inflation.** Thresholds are in 2026 dollars. Compare a payment for calendar year P with the threshold × "
    "CPI-U(P) / CPI-U(2026), using the BLS CPI-U annual average (series CUUR0000SA0). If CPI-U(P) isn't published "
    "when I resolve, grow the latest published 12-month average by CBO's latest CPI-U projection."
)

MODEL_NOTE = (
    "_Opening odds come from my own Monte Carlo model: when an AI labor shock might start, which party controls each "
    "Congress, and the chance of enactment under each combination. Prediction-market prices and recent base rates set "
    "the shock-timing and party-control inputs; the enactment chances are my judgment. Trade against it._"
)
MODEL_NOTE_CTC = (
    "_Opening odds come from my own model: which party controls each Congress (from Polymarket and recent base rates) "
    "times my judgment of each Congress's chance of enacting this. Trade against it._"
)
MODEL_NOTE_JUDGMENT = "_The opening odds are my own judgment. Trade against it._"


def ubi_definition(amount_clause):
    return f"""**What counts.** A federal statute that becomes law (signed by the President, passed over a veto, or enacted without signature) and creates or amends a cash payment program so that it meets all five conditions:

1. **Universal among adults.** Every US citizen aged 18 or older who lives in the 50 states or DC is eligible, including adults someone else claims as a dependent (paying their amount to the person who claims them is fine). The only allowed exclusions are people who are incarcerated or living abroad. Covering territories and non-citizens is optional. Administrative steps (an SSN, filing a return or claim form) are fine if every such adult can still claim each year's payment; limiting it to people who filed a past return is not. Amounts may vary by age, location or anything else, as long as every eligible adult who gets no other federal benefits gets at least the threshold. Making people choose between this payment and other federal benefits, or reducing it by other federal benefits they get, doesn't disqualify it.
2. **No means or work test.** Every eligible adult gets the full payment during the year, whatever their income, assets, earnings, employment or job search. A tax that later recovers some or all of it from higher earners is fine, whatever it's called (surtax, reconciliation, repayment). A payment that is reduced or withheld during the year as income rises (a negative income tax) doesn't count.
3. **Amount.** {amount_clause} A scheduled phase-in counts once it reaches the threshold. If the law sets the amount by formula (for example, a fund's net revenue divided among recipients), use CBO's estimate at enactment for that year, or JCT's if CBO has none. If neither exists, wait for that year's actual payments, even if that means resolving after the close.
4. **Recurring, lasting and mandatory.** Payments come at least once a year, begin within 3 years of enactment, and are not scheduled to end within 5 years of the first payment. They must be mandatory spending (paid automatically, like Social Security), not subject to annual appropriations, waitlists or caps. One-time or temporary payments (stimulus checks, a one-off tariff or "dividend" rebate) don't count.
5. **Cash.** Recipients can spend it freely: direct deposit, check or debit card. In-kind benefits, vouchers, restricted or locked savings accounts, and tax credits that only offset tax don't count.

A later statute that raises, extends or otherwise amends an existing federal program so that it newly meets all five conditions also counts, dated to that statute's enactment. State and local programs don't count (so Alaska's Permanent Fund Dividend doesn't). Judge each statute as enacted: a later repeal, amendment or court ruling doesn't undo a qualifying law.

{CPI_RULE}"""


FOOTER = "_The creator may trade in this market. Resolution follows the enacted law's text (congress.gov), CBO/JCT estimates where needed, and BLS CPI-U._"

RELATED_M1 = """**Related markets.** [When will USA have UBI?](https://manifold.markets/NoAnswer/when-will-usa-have-ubi) and [By what year will the US implement a UBI?](https://manifold.markets/dog/by-what-year-will-the-us-implement) also ask when, but set no minimum amount, so a small universal payment could resolve them (the first ends in 2040; the second dates by implementation). [US UBI before 2040 (full UBI)](https://manifold.markets/vicli/will-an-ubi-universal-basic-income-5acc5bf6c22d) requires a payment covering basic living costs, and [US government introduces UBI before 2040](https://manifold.markets/JaundicedBaboon/will-the-united-states-government-i) and the [Metaculus mirror](https://manifold.markets/mirrorbot/metaculus-will-any-of-the-us-eu-uk) are yes/no questions with a single deadline. This market fixes the bar at $500/month per adult in 2026 dollars, dates by enactment, and runs to 2050."""


def build(links=None):
    L = {"m1": "", "m2": "", "m3": ""} | (links or {})
    s = SEEDS
    m = []
    m1_companions = ""
    if L["m2"] and L["m3"]:
        m1_companions = (f"**Companion markets:** [the amount ladder]({L['m2']}) (its $6,000 rung resolves YES exactly when this one "
                         f"resolves to 2026–2028, 2029–2032 or 2033–2036) and [a guaranteed income floor, where a negative income tax counts]({L['m3']}).")
    m.append(dict(
        key="m1_when_ubi",
        outcomeType="MULTIPLE_CHOICE",
        question="When will the US enact a universal basic income of at least $500/month per adult?",
        answers=list(s["m1"].keys()),
        answerProbs=list(s["m1"].values()),
        shouldAnswersSumToOne=True,
        addAnswersMode="DISABLED",
        closeTime=ms(2050, 12, 31),
        liquidityTier=1000,
        groupIds=[G["universal-basic-income"], G["ubi"], G["us-politics"], G["economics-default"]],
        descriptionMarkdown="\n\n".join(x for x in [
            "Resolves to the calendar-year bucket (Eastern Time) in which the US enacts a federal universal basic income, as defined below. The buckets roughly follow presidential terms. If none is enacted by December 31, 2050, it resolves to \"Not by the end of 2050\". I'll resolve early as soon as a qualifying law is enacted.",
            ubi_definition("As enacted, the law schedules at least $6,000 per adult per year ($500 a month) for some full calendar year that begins within 5 years of enactment."),
            RELATED_M1, m1_companions, MODEL_NOTE, FOOTER] if x),
    ))
    m.append(dict(
        key="m2_amount_ladder",
        outcomeType="MULTIPLE_CHOICE",
        question="By the end of 2036, will the US enact a universal cash payment to all adults of at least... (per year, 2026 dollars)",
        answers=list(s["m2"].keys()),
        answerProbs=list(s["m2"].values()),
        shouldAnswersSumToOne=False,
        addAnswersMode="DISABLED",
        closeTime=ms(2036, 12, 31),
        liquidityTier=1000,
        groupIds=[G["universal-basic-income"], G["ubi"], G["us-politics"], G["economics-default"]],
        descriptionMarkdown="\n\n".join(x for x in [
            "Each answer resolves independently. It resolves YES if, by December 31, 2036 (Eastern Time), the US enacts a federal universal cash payment, as defined below, of at least that amount per adult per year in 2026 dollars. Otherwise it resolves NO. A law that clears a higher threshold also clears every lower one, so the answers should be non-increasing from top to bottom. Arbitrage welcome.",
            "The $1,000 rung would catch a recurring universal \"dividend\" (tariff, carbon, AI, sovereign-wealth-fund) if it's legislated as a lasting program. The $12,000 rung matches the nominal $1,000/month of Andrew Yang's 2020 Freedom Dividend, which is worth more than that in 2026 dollars.",
            ubi_definition("As enacted, the law schedules at least the answer's amount per adult per year for some full calendar year that begins within 5 years of enactment."),
            (f"**Companion market:** [When will the US enact a universal basic income of at least $500/month per adult?]({L['m1']}). "
             "The $6,000 rung here resolves YES exactly when that market resolves to 2026–2028, 2029–2032 or 2033–2036.") if L["m1"] else "",
            MODEL_NOTE, FOOTER] if x),
    ))
    m.append(dict(
        key="m3_guaranteed_floor",
        outcomeType="BINARY",
        question="By the end of 2036, will US federal law guarantee $6,000/year in cash to a non-disabled adult with no income?",
        initialProb=s["m3"],
        closeTime=ms(2036, 12, 31),
        liquidityTier=100,
        groupIds=[G["universal-basic-income"], G["ubi"], G["us-politics"], G["economics-default"]],
        descriptionMarkdown="\n\n".join(x for x in [
            "This market asks about a guaranteed income floor, universal or not. A negative income tax counts here, unlike in "
            + (f"[the companion UBI market]({L['m1']}) and [the amount ladder]({L['m2']})" if L["m1"] and L["m2"] else "the companion UBI markets") + ".",
            "**Reference person.** A single, childless, non-disabled US citizen aged 30 who lives in one of the 50 states or DC. They have no income, no assets and no work history, and are neither working nor looking for work.",
            "**Resolves YES** if, by December 31, 2036 (Eastern Time), federal law as enacted entitles this person, wherever they live in the 50 states or DC, to federal cash benefits worth at least $6,000 in 2026 dollars for some calendar year, summed across all federal programs. Otherwise it resolves NO.",
            "**Counts:** federal cash benefits and refundable tax credits paid in cash, whether universal or phasing out with income. Programs must be entitlements: anyone who meets the rules gets paid, with no waitlists, lotteries or appropriation caps that ration payment. Payments must be at least annual, begin within 3 years of enactment, and not be scheduled to end within 5 years of the first payment. If a program sets the amount by formula (for example, a fund's net revenue divided among recipients), use CBO's estimate at enactment for that year, or JCT's if CBO has none; if neither exists, wait for that year's actual payments, even if that means resolving after the close. The qualifying calendar year must begin within 5 years of the enactment of the last law needed.",
            "**Doesn't count:** in-kind benefits (SNAP, housing, health care), state-designed or state-funded programs (including TANF and general assistance), unemployment insurance, one-time or temporary payments, and any benefit that requires work, job search or training.",
            "**Today:** this person is entitled to $0 in federal cash. SSI requires age 65+, blindness or disability; the EITC requires earnings; unemployment insurance requires a work history.",
            CPI_RULE, MODEL_NOTE, FOOTER] if x),
    ))
    m.append(dict(
        key="m4_ctc_no_earnings",
        outcomeType="MULTIPLE_CHOICE",
        question="In which tax year will the US Child Tax Credit next give its full amount to families with no earnings?",
        answers=list(s["m4"].keys()),
        answerProbs=list(s["m4"].values()),
        shouldAnswersSumToOne=True,
        addAnswersMode="DISABLED",
        closeTime=ms(2036, 4, 15),
        liquidityTier=100,
        groupIds=[G["us-politics"], G["economics-default"]],
        descriptionMarkdown="\n\n".join([
            "This continues my yearly series: [2023](https://manifold.markets/MaxGhenis/will-the-us-child-tax-credit-provid), [2024](https://manifold.markets/MaxGhenis/will-the-us-child-tax-credit-provid-4d0b13a18644) and [2025](https://manifold.markets/MaxGhenis/will-the-us-child-tax-credit-provid-736ff618d96c). All three resolved NO.",
            "**Current law (tax year 2026):** the CTC is up to $2,200 per child. Only $1,700 of that is refundable, and the refundable part phases in at 15% of earnings above $2,500. A family with no earnings gets only the nonrefundable part, which just offsets income tax, so a family with no income gets $0. Sources: 26 U.S.C. §24(d) and (h), as amended by P.L. 119-21, and IRS Rev. Proc. 2025-32.",
            "**Resolves** to the first tax year from 2026 on in which every otherwise-eligible family with no earnings or income, in that year or any earlier year, gets the maximum CTC for every qualifying child, whatever the child's age. The $500 credit for other dependents doesn't count. That was last true in 2021, when the American Rescue Plan made the credit fully refundable and removed the earnings requirement. A lookback to past earnings, or any work, job-search, training or earnings condition (even with exemptions for some families), doesn't count. A tax year counts if the law providing this for that year is enacted by April 15 of the following year (retroactive changes count). If the CTC is replaced by a successor federal child benefit, such as a monthly child allowance, judge the successor. Otherwise it resolves to \"Not by tax year 2035\". I'll resolve early once a qualifying law is enacted and no earlier tax year can still qualify.",
            MODEL_NOTE_CTC,
            "_The creator may trade in this market. Resolution follows the enacted law's text (congress.gov) and IRS guidance._"]),
    ))
    m.append(dict(
        key="m5_2028_primary_ubi",
        outcomeType="BINARY",
        question="Will any 2028 presidential primary or caucus winner have publicly backed a universal basic income since 2025?",
        initialProb=s["m5"],
        closeTime=ms(2028, 8, 31),
        liquidityTier=100,
        groupIds=[G["universal-basic-income"], G["ubi"], G["us-politics"], G["elections"], G["2028-us-presidential-election"]],
        descriptionMarkdown="\n\n".join([
            "**Resolves YES** if at least one person who wins a 2028 Democratic or Republican presidential primary or caucus publicly supported a universal basic income between January 1, 2025 and the date of that win. Any statewide presidential preference primary or caucus in the 50 states or DC counts, whether run by the state or a state party, binding or not, sanctioned by the national party or not. A person wins by placing first among named candidates on any official statewide count (popular vote, a caucus's first or final alignment, or delegates or state delegate equivalents). If \"uncommitted\" or \"none of these candidates\" places first on a count, nobody wins that count. Otherwise it resolves NO after the last such contest.",
            "**Supported a UBI** means the candidate said they favor enacting a recurring federal cash payment to all or nearly all adults with no income or work test. Names like UBI, universal high income, Freedom Dividend, or a citizen or AI dividend paid to every American all count. Saying they would enact or sign one counts, including conditionally (\"if AI wipes out jobs, we should pass a UBI\"). It can be in a speech, interview, debate, post or campaign platform, and a bill counts if they sponsored or cosponsored it. These don't count: saying they're open to it or that it's worth considering, praising or funding pilots, guaranteed income limited to low-income people, one-time payments (such as tariff rebate checks), and child benefits.",
            "I'll check each primary and caucus winner's public record and link the evidence in a comment at resolution.",
            MODEL_NOTE_JUDGMENT,
            "_The creator may trade in this market._"]),
    ))
    return m


if __name__ == "__main__":
    payloads = build({"m1": "https://example/m1", "m2": "https://example/m2", "m3": "https://example/m3"})
    for x in payloads:
        body = {k: v for k, v in x.items() if k != "key"}
        assert len(body["question"]) <= 120, (x["key"], len(body["question"]))
        assert len(body["descriptionMarkdown"]) < 16000
        if body["outcomeType"] == "MULTIPLE_CHOICE":
            assert len(body["answers"]) == len(body["answerProbs"])
            assert all(1 <= p <= 99 for p in body["answerProbs"])
            if body["shouldAnswersSumToOne"]:
                assert sum(body["answerProbs"]) == 100, x["key"]
            else:
                assert body["answerProbs"] == sorted(body["answerProbs"], reverse=True), x["key"]
        print(x["key"], len(body["question"]), len(body["descriptionMarkdown"]), body.get("answerProbs") or body.get("initialProb"))
    json.dump(build(), open(Path(__file__).with_name("specs.json"), "w"), indent=1, ensure_ascii=False)

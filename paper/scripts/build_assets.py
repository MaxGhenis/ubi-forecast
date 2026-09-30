"""Turn results.json (from results.mjs) into the paper's variables, tables and figures.

Every number in the manuscript is a {{< var >}} shortcode or a table built here, so
the text cannot drift from the model. Probabilities are formatted with the
dashboard's rule: one decimal once the Monte Carlo standard error is below 0.1
points, whole percents otherwise.
"""
import json
import math
import subprocess
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

HERE = Path(__file__).resolve().parent.parent
R = json.loads((HERE / "results.json").read_text())
PY = json.loads((HERE.parent / "model" / "results.json").read_text())
N = R["n"]
BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
INK, INK2, MUTED, GRID = "#1c2a33", "#4c5a63", "#637078", "#dde2df"
ORDER = ["USA", "GBR", "CAN", "AUS", "ESP", "FRA", "DEU", "KOR", "JPN", "BRA"]


def fp(p, n=N):
    if p is None or (isinstance(p, float) and math.isnan(p)):
        return "–"
    if p == 0:
        return "0%"
    se = math.sqrt(p * (1 - p) / max(n, 1))
    if se < 0.001:
        return "<0.1%" if p < 0.001 else f"{100 * p:.1f}%"
    return "<1%" if p < 0.005 else f"{round(100 * p)}%"


def sp_n(sp, yes=True):
    return max(1, round(sp["pS"] * N)) if yes else max(1, round((1 - sp["pS"]) * N))


# ---------------------------------------------------------------- variables
V = {"n_histories": f"{N:,}", "seed": str(R["seed"])}
C = R["countries"]
for iso, c in C.items():
    k = iso.lower()
    for y in ["2030", "2035", "2040", "2045", "2050"]:
        V[f"{k}_{y}"] = fp(c["byThreshold"][2][y])
    V[f"{k}_any_2040"] = fp(c["byThreshold"][0]["2040"])
    V[f"{k}_15_2040"] = fp(c["byThreshold"][3]["2040"])
    ns = c["noShock2040"]
    V[f"{k}_noshock_2040"] = fp(ns["pIfYes"], sp_n(ns))
    V[f"{k}_shock_2040"] = fp(ns["pIfNo"], sp_n(ns, False))
    so = c["soon"]
    for kk in ["trig2028", "trig2030", "end2028", "end2030", "enact2030", "end2040"]:
        V[f"{k}_{kk}"] = fp(so[kk])
    ln = c["leftNext"]
    V[f"{k}_left_yes"] = fp(ln["pIfYes"], sp_n(ln))
    V[f"{k}_left_no"] = fp(ln["pIfNo"], sp_n(ln, False))
for kk, v in R["soonAll"].items():
    V[f"all_{kk}"] = fp(v)
for key, lab in [("all", "all"), ("g7", "g7"), ("oecd9", "oecd9")]:
    for t, tl in [(0, "any"), (2, "t2"), (3, "t3")]:
        for y in ["2030", "2035", "2040", "2050"]:
            V[f"{lab}_{tl}_{y}"] = fp(R["sets"][key][t][y])
for key in ["USA", "all"]:
    for i, sp in enumerate(R["signposts"][key]):
        V[f"sp_{key.lower()}_{i}_ps"] = fp(sp["pS"])
        V[f"sp_{key.lower()}_{i}_yes"] = fp(sp["pIfYes"], sp_n(sp))
        V[f"sp_{key.lower()}_{i}_no"] = fp(sp["pIfNo"], sp_n(sp, False))
for k, v in R["scenarios"].items():
    slug = "".join(ch if ch.isalnum() else "_" for ch in k.lower()).strip("_")
    V[f"sc_{slug}_usa"] = fp(v["USA"])
    V[f"sc_{slug}_all"] = fp(v["all"])
# Python reference model (US only; 1,000,000 histories).
PN = PY["n_sims"]
V["py_n"] = f"{PN:,}"
V["py_us_2040"] = fp(PY["cumulative_ubi_6k"]["2040"], PN)
V["py_us_2050"] = fp(PY["cumulative_ubi_6k"]["2050"], PN)
V["py_share_shock"] = f"{round(100 * PY['attribution_by_2040']['share_in_shock_state'])}%"
V["py_share_d"] = f"{round(100 * PY['attribution_by_2040']['share_D_trifecta'])}%"
V["py_share_r"] = f"{round(100 * PY['attribution_by_2040']['share_R_trifecta'])}%"
V["py_share_div"] = f"{round(100 * PY['attribution_by_2040']['share_divided'])}%"
V["py_floor_2036"] = fp(PY["m3_guaranteed_floor_by_2036"], PN)
V["py_ctc_2029_30"] = fp(PY["m4_ctc_first_tax_year"]["2029–2030"], PN)
V["py_ctc_never"] = fp(PY["m4_ctc_first_tax_year"]["Not by tax year 2035"], PN)
for k, v in PY["m2_amount_ladder_by_2036"].items():
    V["py_ladder_" + k.split("/")[0].replace("$", "").replace(",", "")] = fp(v, PN)
V["results_seconds"] = f"{R['seconds']:.0f}"
MK = {"when-will-usa-have-ubi": "usa_any_2040", "will-an-ubi-universal-basic-income-5acc5bf6c22d": "usa_full_2040",
      "will-the-united-states-government-i": "usa_gov_2040", "will-universal-basic-income-be-intr": "usa_intro_2030",
      "will-an-ubi-universal-basic-income": "usa_partial_2030", "will-universal-basic-income-be-impl": "g7_2028",
      "will-any-oecd-country-effectively-i": "oecd_2033", "will-any-country-implement-a-ubi-un": "any_full_2040",
      "will-any-eu-country-implement-a-ubi": "eu_full_2040"}
for m in R["markets"]:
    k = MK.get(m["url"].rsplit("/", 1)[1])
    if k:
        V[f"mk_{k}_price"] = m["price"].split(" ")[0]
        V[f"mk_{k}_model"] = fp(m["model"])
        V[f"mk_{k}_traders"] = m["traders"]
V["gdppc_usa"] = f"${C['USA']['gdppc']:,}"
(HERE / "_variables.yml").write_text("".join(f'{k}: "{v}"\n' for k, v in sorted(V.items())))


# ---------------------------------------------------------------- tables
def table(header, rows, align):
    out = ["| " + " | ".join(header) + " |", "|" + "|".join(":--" if a == "l" else "--:" for a in align) + "|"]
    out += ["| " + " | ".join(r) + " |" for r in rows]
    return "\n".join(out) + "\n"


rows = []
for iso in ORDER:
    c = C[iso]; t2 = c["byThreshold"][2]; ns = c["noShock2040"]
    rows.append([c["name"], fp(t2["2030"]), fp(t2["2035"]), fp(t2["2040"]), fp(t2["2050"]), fp(c["byThreshold"][0]["2040"]), fp(ns["pIfYes"], sp_n(ns))])
a = R["sets"]["all"]
rows.append(["At least one of the ten", fp(a[2]["2030"]), fp(a[2]["2035"]), fp(a[2]["2040"]), fp(a[2]["2050"]), fp(a[0]["2040"]), "–"])
(HERE / "_includes" / "table_countries.md").write_text(table(
    ["Country", "By 2030", "By 2035", "By 2040", "By 2050", "Any size, by 2040", "By 2040 if no AI shock"], rows, "lrrrrrr"))

rows = []
for iso in ORDER:
    so = C[iso]["soon"]
    rows.append([C[iso]["name"], fp(so["trig2028"]), fp(so["trig2030"]), fp(so["end2028"]), fp(so["end2030"]), fp(so["enact2030"])])
so = R["soonAll"]
rows.append(["At least one of the ten", fp(so["trig2028"]), fp(so["trig2030"]), fp(so["end2028"]), fp(so["end2030"]), fp(so["enact2030"])])
(HERE / "_includes" / "table_soon.md").write_text(table(
    ["Country", "Trigger met by 2028", "By 2030", "A government endorses a UBI by 2028", "By 2030", "A UBI of any size enacted by 2030"], rows, "lrrrrr"))

rows = [[k, fp(v["USA"]), fp(v["all"])] for k, v in R["scenarios"].items()]
(HERE / "_includes" / "table_scenarios.md").write_text(table(["Assumption", "United States", "At least one of the ten"], rows, "lrr"))

SHORT_T = {"when-will-usa-have-ubi": "When will USA have UBI?", "will-an-ubi-universal-basic-income-5acc5bf6c22d": "US UBI before 2040 (full UBI)",
           "will-the-united-states-government-i": "US government UBI before 2040", "will-universal-basic-income-be-intr": "UBI introduced in the US by 2030",
           "will-an-ubi-universal-basic-income": "US UBI before 2030 (partial counts)", "will-universal-basic-income-be-impl": "G7 country UBI by end of 2028",
           "will-any-oecd-country-effectively-i": "OECD country 'form of UBI' before 2033", "will-any-country-implement-a-ubi-un": "Any country, full UBI, before 2040",
           "will-any-eu-country-implement-a-ubi": "Any EU country, full UBI, before 2040"}
rows = []
for m in R["markets"]:
    if m["own"]:
        continue
    rows.append([f"[{SHORT_T.get(m['url'].rsplit('/', 1)[1], m['question'])}]({m['url']})", m["traders"], m["price"], fp(m["model"]), m["note"]])
(HERE / "_includes" / "table_markets.md").write_text(table(["Market (Manifold)", "Traders", "Price", "Model", "Model's version of the question"], rows, "lrrrl"))

for key, fname in [("USA", "table_signposts_us.md"), ("all", "table_signposts_all.md")]:
    rows = [[sp["label"], fp(sp["pS"]), fp(sp["pIfYes"], sp_n(sp)), fp(sp["pIfNo"], sp_n(sp, False))] for sp in R["signposts"][key]]
    (HERE / "_includes" / fname).write_text(table(["If we observe", "Chance of that", "Forecast if yes", "If no"], rows, "lrrr"))

# Inputs summary from the dashboard's country configs (via a tiny bun export).
CFG_JS = r"""
import { COUNTRIES } from '../dashboard/src/countries.js';
const m = (r) => (r.lo + 4 * r.mode + r.hi) / 6;
console.log(JSON.stringify(COUNTRIES.map(c => { const i = c.signpostPeriod ?? c.periods.findIndex(p => p.kind === 'draw'); const p = c.periods[i];
  return { iso: c.iso3, name: c.name, term: c.termYears ?? 4, start: p.start, pL: m(p.pL), pR: m(p.pR),
           eLn: m(c.endorse.L_normal), eLs: m(c.endorse.L_shock), eRs: m(c.endorse.R_shock), pLp: m(c.pass.L), pOp: m(c.pass.O),
           exp: m(c.exposure), lag: c.lag.mode, amtS: c.amount.shock.mode, level: c.trigger ? c.trigger.level : null }; })));
"""
cfg = json.loads(subprocess.run(["bun", "-e", CFG_JS], cwd=HERE, capture_output=True, text=True, check=True).stdout)
pc = lambda x: f"{round(100 * x)}%" if x >= 0.01 else f"{100 * x:.1f}%"
pol = [[c["name"], f"{c['start']}: {pc(c['pL'])} / {pc(c['pR'])}", pc(c["eLn"]), pc(c["eLs"]), pc(c["eRs"]), pc(c["pLp"]), pc(c["pOp"]), f"{c['term']}"]
       for c in sorted(cfg, key=lambda c: ORDER.index(c["iso"]))]
(HERE / "_includes" / "table_inputs.md").write_text(table(
    ["Country", "Next election: left / right", "Left endorses, no shock", "Left endorses, shock", "Right endorses, shock", "Passes, left-led", "Passes, other", "Term"],
    pol, "llrrrrrr"))
trg = [[c["name"], f"{c['level']}%" if c["level"] else "–", pc(c["exp"]), f"{c['lag']:g}", f"{round(c['amtS'], 1):g}%"]
       for c in sorted(cfg, key=lambda c: ORDER.index(c["iso"]))]
(HERE / "_includes" / "table_trigger.md").write_text(table(
    ["Country", "Trigger: 12-month unemployment at or above", "Meets it if the US does", "Lag behind the US (years)", "Amount if enacted in a shock (% of GDP per head)"],
    trg, "lrrrr"))

# ---------------------------------------------------------------- figures
plt.rcParams.update({"font.family": "sans-serif", "font.size": 9, "axes.edgecolor": GRID, "axes.labelcolor": INK2,
                     "xtick.color": MUTED, "ytick.color": MUTED, "axes.spines.top": False, "axes.spines.right": False})
years = R["curveYears"]

fig, axes = plt.subplots(2, 5, figsize=(10, 4.2), sharex=True, sharey=True)
top = max(max(R["curves"][k]) for k in ORDER)
top = math.ceil(top * 20) / 20
for ax, iso in zip(axes.flat, ORDER):
    ax.plot(years, R["curves"][iso], color=BLUE, lw=2)
    ax.set_title(f"{C[iso]['name']}  {fp(C[iso]['byThreshold'][2]['2040'])}", fontsize=9, loc="left", color=INK)
    ax.axvline(2040, color=GRID, lw=1, ls="--")
    ax.set_ylim(0, top); ax.set_xlim(years[0], years[-1]); ax.grid(axis="y", color=GRID, lw=0.6)
    ax.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0, decimals=0))
    ax.set_xticks([2030, 2040, 2050])
fig.suptitle("Chance of a UBI worth at least 6.7% of GDP per head, by year (number: by 2040)", x=0.01, ha="left", fontsize=10, color=INK)
fig.tight_layout(rect=(0, 0, 1, 0.94))
fig.savefig(HERE / "figures" / "fig_countries.png", dpi=200); plt.close(fig)

fig, ax = plt.subplots(figsize=(7, 2.8))
ax.plot(years, R["curves"]["all"], color=BLUE, lw=2)
ax.plot(years, R["curves"]["USA"], color=ORANGE, lw=2)
ax.text(years[-1] + 0.3, R["curves"]["all"][-1], "At least one of the ten", color=INK2, va="center", fontsize=8.5)
ax.text(years[-1] + 0.3, R["curves"]["USA"][-1], "United States", color=INK2, va="center", fontsize=8.5)
ax.set_xlim(years[0], years[-1] + 9); ax.set_ylim(0, 0.7); ax.grid(axis="y", color=GRID, lw=0.6)
ax.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0, decimals=0)); ax.set_xticks([2030, 2035, 2040, 2045, 2050])
fig.tight_layout(); fig.savefig(HERE / "figures" / "fig_any.png", dpi=200); plt.close(fig)


def dotplot(sps, path, title):
    fig, ax = plt.subplots(figsize=(7.2, 0.5 + 0.42 * len(sps)))
    prior = sps[0]["pU"]
    for i, sp in enumerate(reversed(sps)):
        lo, hi = sorted([sp["pIfNo"], sp["pIfYes"]])
        ax.plot([lo, hi], [i, i], color=BLUE, lw=2, solid_capstyle="round")
        ax.scatter([sp["pIfNo"]], [i], s=36, facecolor="white", edgecolor=BLUE, zorder=3, lw=1.8)
        ax.scatter([sp["pIfYes"]], [i], s=36, color=BLUE, zorder=3)
    ax.axvline(prior, color=INK2, lw=1)
    ax.set_yticks(range(len(sps))); ax.set_yticklabels([sp["label"] for sp in reversed(sps)], fontsize=8.5, color=INK)
    ax.xaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0, decimals=0)); ax.grid(axis="x", color=GRID, lw=0.6)
    ax.set_title(title, fontsize=9.5, loc="left", color=INK)
    fig.tight_layout(); fig.savefig(path, dpi=200); plt.close(fig)


dotplot(R["signposts"]["USA"], HERE / "figures" / "fig_signposts_us.png",
        "United States, UBI by 2040. Filled: if yes. Hollow: if no. Line: today's forecast.")

mk = [m for m in R["markets"] if not m["own"]]
fig, ax = plt.subplots(figsize=(7.2, 0.6 + 0.4 * len(mk)))
for i, m in enumerate(reversed(mk)):
    price = int(m["price"].split("%")[0]) / 100
    ax.plot([min(price, m["model"]), max(price, m["model"])], [i, i], color=GRID, lw=2)
    ax.scatter([price], [i], s=40, color=ORANGE, marker="D", zorder=3)
    ax.scatter([m["model"]], [i], s=40, color=BLUE, zorder=3)
SHORT = {"when-will-usa-have-ubi": "US, any UBI, by 2040", "will-an-ubi-universal-basic-income-5acc5bf6c22d": "US, full UBI, before 2040",
         "will-the-united-states-government-i": "US government UBI, before 2040", "will-universal-basic-income-be-intr": "US UBI introduced, by 2030",
         "will-an-ubi-universal-basic-income": "US, partial UBI counts, before 2030", "will-universal-basic-income-be-impl": "A G7 member, above poverty line, by 2028",
         "will-any-oecd-country-effectively-i": "Any OECD country, a form of UBI, before 2033", "will-any-country-implement-a-ubi-un": "Any country, full UBI, before 2040",
         "will-any-eu-country-implement-a-ubi": "Any EU country, full UBI, before 2040"}
lab = [SHORT.get(m["url"].rsplit("/", 1)[1], m["question"][:50]) + f" ({m['traders']} traders)" for m in reversed(mk)]
ax.set_yticks(range(len(mk))); ax.set_yticklabels(lab, fontsize=8, color=INK)
ax.xaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0, decimals=0)); ax.grid(axis="x", color=GRID, lw=0.6)
ax.scatter([], [], color=ORANGE, marker="D", s=40, label="Manifold price"); ax.scatter([], [], color=BLUE, s=40, label="This model")
ax.legend(loc="lower left", bbox_to_anchor=(0, 1.0), ncol=2, frameon=False, fontsize=8.5)
fig.tight_layout(); fig.savefig(HERE / "figures" / "fig_markets.png", dpi=200); plt.close(fig)

# Model structure (graphviz).
dot = """digraph G { rankdir=LR; bgcolor="white"; node [shape=box, style="rounded", fontname="Helvetica", fontsize=11, color="#bfc7c3", fontcolor="#1c2a33"];
edge [color="#76828a", arrowsize=0.7];
ev1 [label="AGI and AI-unemployment\\nmarkets", color="#cfe0f6"]; ev2 [label="Election markets,\\npolls, base rates", color="#cfe0f6"];
shock [label="US trigger met:\\nunemployment +3 points\\nwithout a recession"]; reach [label="Each country's own\\ntrigger and lag"]; demand [label="Shock under way?\\n(each year)"];
gov [label="Government each period:\\nleft-led, right-led, other"]; haz [label="Government endorses\\na UBI"]; pas [label="Endorsed UBI\\nbecomes law"];
amt [label="Amount (share of GDP\\nper head) and later increases"];
ubi [label="UBI at or above the\\nthreshold, by year", color="#2a78d6", penwidth=1.6];
ctl [label="Sliders and risk switches\\nedit these explicit values", style="rounded,dashed"];
ev1 -> shock; shock -> demand; reach -> demand; ev2 -> gov; demand -> haz; gov -> haz; haz -> pas; gov -> pas; demand -> amt; pas -> ubi; amt -> ubi;
ctl -> haz; ctl -> pas; ctl -> amt; }"""
subprocess.run(["dot", "-Tpng", "-Gdpi=200", "-o", str(HERE / "figures" / "fig_model.png")], input=dot, text=True, check=True)
print(f"{len(V)} variables, 6 tables, 5 figures")

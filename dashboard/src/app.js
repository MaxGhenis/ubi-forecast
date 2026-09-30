import { THRESHOLDS, FIRST_YEAR, LAST_YEAR, RISKS, simulate, cumulative, eventMask, maskFrom, signpost, pertMean } from "./engine.js";
import { COUNTRIES, GLOBALS, GLOBAL_NOTES } from "./countries.js";
import MARKETS from "./markets.json";

const $ = (id) => document.getElementById(id);
const TOTAL = 200000, BATCH = 20000, FIRST_BATCH = 5000, SEED = 20260929;
const YEARS_SHOWN = [2030, 2035, 2040, 2045, 2050];
const G7 = ["USA", "GBR", "CAN", "DEU", "FRA", "JPN", "ITA"];
const NAMES = { ITA: "Italy" };
const byIso = Object.fromEntries(COUNTRIES.map((c, i) => [c.iso3, i]));
const nameOf = (iso) => (iso in byIso ? COUNTRIES[byIso[iso]].name : NAMES[iso] || iso);
const money = (x) => `$${(Math.round(x / 50) * 50).toLocaleString("en-US")}`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
const shareLabel = (t) => `${t === 6.665 ? "6.7" : t}% of GDP per head`;
const C = COUNTRIES.length, T = THRESHOLDS.length;

// A probability shown to the precision the simulation supports: one decimal once the
// Monte Carlo standard error is below 0.1 points, whole percents before that.
function fmtP(p, n) {
  if (!Number.isFinite(p)) return "–";
  if (p === 0) return "0%";
  const se = Math.sqrt((p * (1 - p)) / Math.max(n, 1));
  if (se < 0.001) return p < 0.001 ? "<0.1%" : `${(100 * p).toFixed(1)}%`;
  return p < 0.005 ? "<1%" : `${Math.round(100 * p)}%`;
}
const pctIn = (x) => `${Math.round(x * 1000) / 10}%`;   // inputs, not forecasts

// ---------------------------------------------------------------- state (mirrored in the URL hash)
const DEFAULT_STATE = { sel: ["USA"], t: 2, year: 2040, cond: null, shift: 0, exposure: "model", appetite: 0, generosity: 0, risks: [] };
let state = readHash();
function num(v, lo, hi, step, fallback) {
  const x = Number(v);
  if (v === null || v === "" || !Number.isFinite(x)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(x / step) * step));
}
function readHash() {
  const s = structuredClone(DEFAULT_STATE);
  const h = new URLSearchParams(location.hash.slice(1));
  const sel = (h.get("c") || "").split(",").filter((x) => x in byIso);
  if (sel.length) s.sel = [...new Set(sel)];
  s.t = num(h.get("t"), 0, THRESHOLDS.length - 1, 1, s.t);
  s.year = num(h.get("y"), 2028, LAST_YEAR, 1, s.year);
  s.shift = num(h.get("shift"), -5, 10, 1, 0);
  s.appetite = num(h.get("appetite"), -2, 2, 0.25, 0);
  s.generosity = num(h.get("generosity"), -1, 1, 0.125, 0);
  if (["model", "all", "us-only"].includes(h.get("exposure"))) s.exposure = h.get("exposure");
  s.risks = (h.get("risks") || "").split(",").filter((r) => r in RISKS);
  s.cond = h.get("if") || null;
  return s;
}
function writeHash() {
  const h = new URLSearchParams({ c: state.sel.join(","), t: state.t, y: state.year });
  if (state.cond) h.set("if", state.cond);
  for (const k of ["shift", "appetite", "generosity"]) if (state[k]) h.set(k, state[k]);
  if (state.exposure !== "model") h.set("exposure", state.exposure);
  if (state.risks.length) h.set("risks", state.risks.join(","));
  history.replaceState(null, "", `#${h.toString().replace(/%2C/g, ",")}`);   // readable commas in shared links
}
const controlsFrom = (s) => ({
  shockShiftYears: s.shift, appetite: 2 ** s.appetite, generosity: 2 ** s.generosity, exposureMode: s.exposure,
  risks: Object.fromEntries(Object.keys(RISKS).map((k) => [k, s.risks.includes(k)])),
});
const simKey = (s) => JSON.stringify([s.shift, s.exposure, s.appetite, s.generosity, s.risks]);

// ---------------------------------------------------------------- progressive simulation
// Batches of 20,000 histories accumulate to 200,000. Batches use consecutive history
// indices, so the accumulated result equals one run of the same size.
let worker = null, run = null, sim = null, lastSimKey = simKey(state), debounce = null;
function makeWorker() {
  try { return new Worker(URL.createObjectURL(new Blob([$("worker-src").textContent], { type: "text/javascript" }))); }
  catch { return null; }
}
function startRun() {
  run = { id: (run?.id || 0) + 1, filled: 0, t0: performance.now(), controls: controlsFrom(state),
          onset: new Float32Array(TOTAL), firstYear: new Int16Array(TOTAL * C * T), stateNext: new Int8Array(TOTAL * C) };
  sim = null;
  for (const el of document.querySelectorAll("main section, .check")) el.classList.add("busy");
  $("status").textContent = "Simulating…";
  requestBatch();
}
function requestBatch() {
  // A small first batch puts a number on screen quickly on slower (phone) processors.
  const size = run.filled === 0 ? FIRST_BATCH : BATCH;
  const msg = { id: run.id, countries: COUNTRIES, globals: GLOBALS, controls: run.controls, n: Math.min(size, TOTAL - run.filled), seed: SEED, start: run.filled };
  if (worker) worker.postMessage(msg);
  else setTimeout(() => onBatch({ id: msg.id, start: msg.start, sim: simulate(msg) }), 0);   // no Worker: same batches on the main thread
}
function onBatch({ id, start, sim: b }) {
  if (!run || id !== run.id) return;              // a newer run replaced this one
  run.onset.set(b.onset, start);
  run.firstYear.set(b.firstYear, start * C * T);
  run.stateNext.set(b.stateNext, start * C);
  run.filled = start + b.n;
  const n = run.filled;
  sim = { n, C, T, onset: run.onset.subarray(0, n), firstYear: run.firstYear.subarray(0, n * C * T), stateNext: run.stateNext.subarray(0, n * C) };
  if (state.cond && !signpostDefs().some((d) => d.id === state.cond)) state.cond = null;
  render();
  const secs = ((performance.now() - run.t0) / 1000).toFixed(1);
  $("status").textContent = n < TOTAL ? `Refining: ${n.toLocaleString("en-US")} of ${TOTAL.toLocaleString("en-US")} histories…`
                                      : `${n.toLocaleString("en-US")} histories simulated in ${secs} s.`;
  if (n < TOTAL) requestBatch();
}
function maybeResimulate() {
  const k = simKey(state);
  if (k === lastSimKey && run) { render(); renderAssumptions(); return; }
  lastSimKey = k;
  renderAssumptions();
  clearTimeout(debounce);
  debounce = setTimeout(startRun, 200);
}

// ---------------------------------------------------------------- derived
const subset = () => state.sel.map((iso) => byIso[iso]);
function signpostDefs() {
  const out = [
    { id: "ai2030", label: "An AI labor shock starts by the end of 2030", mask: () => maskFrom(sim.n, (s) => sim.onset[s] < 2031) },
    { id: "ai2035", label: "An AI labor shock starts by the end of 2035", mask: () => maskFrom(sim.n, (s) => sim.onset[s] < 2036) },
    { id: "noai2040", label: "No AI labor shock has started by 2040", mask: () => maskFrom(sim.n, (s) => !(sim.onset[s] < 2041)) },
  ];
  if (state.sel.length <= 3) for (const iso of state.sel) {
    const ci = byIso[iso], c = COUNTRIES[ci];
    if (c.leftWins) out.push({ id: `L-${iso}`, label: c.leftWins, mask: () => maskFrom(sim.n, (s) => sim.stateNext[s * sim.C + ci] === 1) });
    if (c.rightWins) out.push({ id: `R-${iso}`, label: c.rightWins, mask: () => maskFrom(sim.n, (s) => sim.stateNext[s * sim.C + ci] === 2) });
  }
  if (state.t > 0) {
    const where = state.sel.length === 1 ? COUNTRIES[byIso[state.sel[0]]].inName : "a selected country";
    out.push({ id: "small2032", label: `Any universal payment (1.1%+ of GDP per head) passes in ${where} by 2032`, mask: () => eventMask(sim, subset(), 0, 2032) });
  }
  return out;
}
const conditionDef = () => (state.cond && sim ? signpostDefs().find((x) => x.id === state.cond) || null : null);
// Lowercase only a leading article, so names keep their capitals.
const lowerFirst = (s) => (/^(A|An|The|No|Any)\b/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

// ---------------------------------------------------------------- hero
function subjectText() {
  return state.sel.length === 1 ? COUNTRIES[byIso[state.sel[0]]].inName : `at least one of ${state.sel.length} countries`;
}
function buildHeroControls() {
  const hc = $("hero-country");
  hc.innerHTML = COUNTRIES.map((c) => `<option value="${c.iso3}">${esc(c.inName)}</option>`).join("") +
    `<option value="__multi">${state.sel.length > 1 ? esc(subjectText()) : "all ten countries"}</option>`;
  hc.value = state.sel.length === 1 ? state.sel[0] : "__multi";
  const one = state.sel.length === 1 ? COUNTRIES[byIso[state.sel[0]]] : null;
  $("hero-threshold").innerHTML = THRESHOLDS.map((t, i) => `<option value="${i}">${esc(one ? `${money((t / 100) * one.gdppc)} a year` : `${shareLabel(t)} a year`)}</option>`).join("");
  $("hero-threshold").value = state.t;
  const t = THRESHOLDS[state.t];
  const tail = state.t === 0 ? ", the smallest program that qualifies" : "";
  $("hero-amount-note").textContent = one ? `${shareLabel(t)}${tail}` : `about ${money((t / 100) * COUNTRIES[byIso.USA].gdppc)} in the US${tail}`;
  $("hero-year").innerHTML = Array.from({ length: LAST_YEAR - 2028 + 1 }, (_, i) => 2028 + i).map((y) => `<option>${y}</option>`).join("");
  $("hero-year").value = state.year;
}

// ---------------------------------------------------------------- charts
function lineChart(el, { series, yMax, height = 260, markYear, compact = false, label }) {
  const W = el.clientWidth || 600, H = height;
  const m = compact ? { l: 30, r: 10, t: 6, b: 18 } : { l: 40, r: 16, t: 10, b: 26 };
  const x = (y) => m.l + ((y - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR)) * (W - m.l - m.r);
  const top = niceMax(yMax);
  const yv = (p) => m.t + (1 - p / top) * (H - m.t - m.b);
  const ticks = [0, top / 2, top];
  const xt = compact ? [2030, 2040, 2050] : [2030, 2035, 2040, 2045, 2050];
  let svg = `<svg width="${W}" height="${H}" role="img" aria-label="${esc(label)}">`;
  svg += `<g class="grid">${ticks.map((t) => `<line x1="${m.l}" x2="${W - m.r}" y1="${yv(t)}" y2="${yv(t)}"/>`).join("")}</g>`;
  svg += `<g class="axis">${ticks.map((t) => `<text x="${m.l - 6}" y="${yv(t) + 3.5}" text-anchor="end">${fmtTick(t)}</text>`).join("")}`;
  svg += xt.map((t) => `<text x="${x(t)}" y="${H - m.b + 14}" text-anchor="${t === LAST_YEAR ? "end" : "middle"}">${t}</text>`).join("") + `</g>`;
  svg += `<line class="baseline" x1="${m.l}" x2="${W - m.r}" y1="${yv(0)}" y2="${yv(0)}"/>`;
  if (markYear) svg += `<line x1="${x(markYear)}" x2="${x(markYear)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--axis)" stroke-dasharray="3 3"/>`;
  for (const s of series) {
    const d = s.points.map((p, i) => `${i ? "L" : "M"}${x(p.year).toFixed(1)},${yv(p.p).toFixed(1)}`).join("");
    svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (markYear) {
      const pt = s.points.find((p) => p.year === markYear);
      if (pt) svg += `<circle cx="${x(markYear)}" cy="${yv(pt.p)}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`;
    }
    if (!compact && s.endLabel) {
      const last = s.points.at(-1);
      svg += `<text x="${x(last.year) - 4}" y="${yv(last.p) - 8}" text-anchor="end" font-size="12" fill="var(--ink-2)">${esc(s.endLabel)}</text>`;
    }
  }
  svg += `<rect class="hit" x="${m.l}" y="${m.t}" width="${Math.max(0, W - m.l - m.r)}" height="${H - m.t - m.b}" fill="transparent"/>`;
  svg += `<line class="cross" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink-2)" stroke-width="1" visibility="hidden"/></svg>`;
  el.innerHTML = svg;
  const tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; el.appendChild(tip);
  const hit = el.querySelector(".hit"), cross = el.querySelector(".cross");
  const show = (ev) => {
    const r = el.getBoundingClientRect(), px = ev.clientX - r.left;
    const yr = Math.round(FIRST_YEAR + ((px - m.l) / (W - m.l - m.r)) * (LAST_YEAR - FIRST_YEAR));
    if (yr < FIRST_YEAR || yr > LAST_YEAR) return;
    cross.setAttribute("x1", x(yr)); cross.setAttribute("x2", x(yr)); cross.setAttribute("visibility", "visible");
    tip.hidden = false;
    tip.innerHTML = `<b>By ${yr}</b>` + series.map((s) => `<div><span style="background:${s.color};display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px"></span>${esc(s.label)}: ${fmtP(s.points.find((p) => p.year === yr).p, s.n)}</div>`).join("");
    tip.style.left = `${Math.max(0, Math.min(px + 12, W - tip.offsetWidth - 4))}px`; tip.style.top = `${compact ? 4 : 10}px`;
  };
  hit.addEventListener("pointermove", show);
  hit.addEventListener("pointerdown", show);   // touch screens: tap to read a value
  hit.addEventListener("pointerleave", () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
}
const niceMax = (v) => [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1].find((s) => s >= v * 1.05) ?? 1;
const fmtTick = (t) => `${Math.round(t * 1000) / 10}%`;

// ---------------------------------------------------------------- render
function render() {
  buildHeroControls();
  if (!sim) return;
  const S = subset(), t = state.t, cd = conditionDef();
  const cond = cd ? cd.mask() : null;
  const prior = cumulative(sim, S, t);
  const post = cond ? cumulative(sim, S, t, cond) : null;
  const at = (curve, y) => curve.find((r) => r.year === y).p;
  const pNow = at(prior.curve, state.year);

  $("hero-p").textContent = post ? fmtP(at(post.curve, state.year), post.n) : fmtP(pNow, sim.n);
  $("hero-sub").textContent = post ? `If ${lowerFirst(cd.label)}. Today's forecast: ${fmtP(pNow, sim.n)}.` : "Chance, averaged over every assumption's range";
  $("hero-hist").textContent = `${sim.n.toLocaleString("en-US")} simulated histories${post ? `, ${post.n.toLocaleString("en-US")} of them matching the supposition` : ""}`;
  $("cond-note").innerHTML = post ? `Supposing ${esc(lowerFirst(cd.label))}. <button class="btn" type="button" id="clear-cond">Clear supposition</button>` : "";
  if (post) $("clear-cond").onclick = () => { state.cond = null; update(); };

  const series = [{ label: post ? "Today's forecast" : subjectCap(), color: "var(--series-1)", points: prior.curve, n: prior.n, endLabel: post ? "Today" : "" }];
  if (post) series.push({ label: `If ${lowerFirst(cd.label)}`, color: "var(--series-3)", points: post.curve, n: post.n, endLabel: "Supposed" });
  $("curve-legend").innerHTML = series.length > 1 ? series.map((s) => `<span><span class="sw" style="background:${s.color}"></span>${esc(s.label)}</span>`).join("") : "";
  lineChart($("curve"), { series, yMax: Math.max(...series.flatMap((s) => s.points.map((p) => p.p)), 0.02), markYear: state.year, label: `Chance by year that ${subjectText()} enacts a UBI` });
  $("curve-lede").textContent = `Chance that ${subjectText()} has enacted a UBI worth at least ${thresholdWords()} by each year. The dashed line marks ${state.year}.`;
  const years = [...new Set([...YEARS_SHOWN, state.year])].sort((a, b) => a - b);
  $("curve-table").innerHTML = `<table><thead><tr><th>By</th>${series.map((s) => `<th class="num">${esc(s.label)}</th>`).join("")}</tr></thead><tbody>${
    years.map((y) => `<tr><td>${y}</td>${series.map((s) => `<td class="num">${fmtP(at(s.points, y), s.n)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  const per = state.sel.map((iso) => { const r = cumulative(sim, [byIso[iso]], t, cond); return { c: COUNTRIES[byIso[iso]], curve: r.curve, n: r.n }; });
  const shared = Math.max(0.02, ...per.map((x) => x.curve.at(-1).p));
  $("multiples").innerHTML = per.map((x, i) => `<div class="cell"><h3>${esc(x.c.name)} <span>${fmtP(at(x.curve, state.year), x.n)}</span></h3><p class="gov">${esc(x.c.govShort || "")}</p><div class="chartbox" id="mult-${i}"></div></div>`).join("");
  per.forEach((x, i) => lineChart($(`mult-${i}`), { series: [{ label: x.c.name, color: "var(--series-1)", points: x.curve, n: x.n }], yMax: shared, height: 110, compact: true, markYear: state.year, label: `${x.c.name}: chance by year` }));

  for (const c of COUNTRIES) {
    const el = document.querySelector(`[data-p="${c.iso3}"]`);
    if (el) el.textContent = fmtP(at(cumulative(sim, [byIso[c.iso3]], t).curve, state.year), sim.n);
  }
  renderSignposts(S, t);
  renderMarkets();
  for (const el of document.querySelectorAll(".busy")) el.classList.remove("busy");
}
const subjectCap = () => (state.sel.length === 1 ? COUNTRIES[byIso[state.sel[0]]].name : `At least one of ${state.sel.length} countries`);
function thresholdWords() {
  const th = THRESHOLDS[state.t];
  return state.sel.length === 1 ? `${money((th / 100) * COUNTRIES[byIso[state.sel[0]]].gdppc)} a year (${shareLabel(th)})` : `${shareLabel(th)} a year`;
}

function renderSignposts(S, t) {
  const U = eventMask(sim, S, t, state.year);
  const rows = signpostDefs().map((d) => { const m = d.mask(); let k = 0; for (const v of m) k += v; return { d, r: signpost(m, U), nYes: k }; })
    .filter((x) => x.r.pS > 0 && x.r.pS < 1);
  const top = niceMax(Math.max(...rows.map((x) => Math.max(x.r.pIfYes, x.r.pIfNo)), 0.02));
  const W = 170, pad = 6, sx = (p) => pad + (p / top) * (W - 2 * pad);
  $("signposts").innerHTML = `<table><thead><tr><th>If we observe</th><th class="num">Chance of that</th><th class="num">Forecast if yes</th><th class="num">If no</th><th><span class="sr">Shift</span></th><th></th></tr></thead><tbody>${
    rows.map(({ d, r, nYes }) => `<tr class="${state.cond === d.id ? "active" : ""}"><td>${esc(d.label)}</td><td class="num">${fmtP(r.pS, sim.n)}</td><td class="num">${fmtP(r.pIfYes, nYes)}</td><td class="num">${fmtP(r.pIfNo, sim.n - nYes)}</td>
      <td><svg width="${W}" height="18" role="img" aria-label="Forecast ${fmtP(r.pU, sim.n)} today; ${fmtP(r.pIfYes, nYes)} if yes; ${fmtP(r.pIfNo, sim.n - nYes)} if no">
        <line x1="${pad}" x2="${W - pad}" y1="9" y2="9" stroke="var(--hairline)"/>
        <line x1="${sx(r.pU)}" x2="${sx(r.pU)}" y1="3" y2="15" stroke="var(--ink-2)"/>
        <line x1="${sx(Math.min(r.pIfNo, r.pIfYes))}" x2="${sx(Math.max(r.pIfNo, r.pIfYes))}" y1="9" y2="9" stroke="var(--series-1)" stroke-width="2"/>
        <circle cx="${sx(r.pIfNo)}" cy="9" r="4" fill="var(--surface)" stroke="var(--series-1)" stroke-width="2"/>
        <circle cx="${sx(r.pIfYes)}" cy="9" r="4" fill="var(--series-1)" stroke="var(--surface)" stroke-width="1.5"/></svg></td>
      <td><button class="btn" type="button" data-cond="${d.id}" aria-pressed="${state.cond === d.id}">${state.cond === d.id ? "Supposed" : "Suppose this"}</button></td></tr>`).join("")}</tbody></table>
    <p class="help">Filled dot: forecast if yes. Hollow dot: if no. Tick: today's forecast. Scale 0 to ${fmtTick(top)}. An AI labor shock is a sustained rise in US unemployment of about 3 points that economists attribute to AI; each country gets it with its own chance and lag.</p>`;
  for (const b of document.querySelectorAll("[data-cond]")) b.onclick = () => { state.cond = state.cond === b.dataset.cond ? null : b.dataset.cond; update(); };
}

function renderMarkets() {
  const own = MARKETS.markets.filter((mk) => mk.url.includes("/MaxGhenis/"));
  const rows = MARKETS.markets.filter((mk) => !own.includes(mk)).map((mk) => {
    const isos = mk.model.countries === "all" ? COUNTRIES.map((c) => c.iso3) : mk.model.countries.filter((iso) => iso in byIso);
    const missing = mk.model.countries === "all" ? [] : mk.model.countries.filter((iso) => !(iso in byIso));
    if (!isos.length) return null;
    const p = cumulative(sim, isos.map((iso) => byIso[iso]), mk.model.t).curve.find((r) => r.year === mk.model.year).p;
    return { mk, p, missing };
  }).filter(Boolean);
  $("markets").innerHTML = `<table><thead><tr><th>Market</th><th class="num">Price</th><th class="num">This model</th><th>Model's version of the question</th></tr></thead><tbody>${
    rows.map(({ mk, p, missing }) => `<tr><td><a href="${esc(mk.url)}" target="_blank" rel="noopener">${esc(mk.question)}</a><div class="help">${esc(mk.platform)}, ${esc(mk.traders)} traders. ${esc(mk.definition)}</div></td>
      <td class="num">${esc(mk.price)}</td><td class="num">${fmtP(p, sim.n)}</td><td>${esc(mk.model.note)}${missing.length ? ` Not modeled: ${esc(missing.map(nameOf).join(", "))}.` : ""}</td></tr>`).join("")}</tbody></table>
    <p class="help">Market prices as of ${esc(MARKETS.asOf)}. The model column uses the current assumptions, without any supposition. My own markets on this question opened at this model's odds, so they aren't an independent check: ${own.map((mk) => `<a href="${esc(mk.url)}" target="_blank" rel="noopener">${esc(mk.question)}</a> (${esc(mk.price)})`).join("; ")}.</p>`;
}

const STATE_WORD = { L: "left-led", R: "right-led", O: "other" };
const GLOBAL_LABELS = {
  shock_by_2028: "AI labor shock started by the end of 2028", shock_by_2030: "…by the end of 2030", shock_by_2035: "…by the end of 2035",
  shock_by_2040: "…by the end of 2040", shock_by_2050: "…by the end of 2050", politics_lag_years: "Years from shock to legislation",
};
function renderAssumptions() {
  const badge = (k) => `<span class="badge ${k}">${k}</span>`;
  const qty = (r, f) => `${f(r.lo)}–${f(r.hi)}, most likely ${f(r.mode)}`;
  const g = Object.entries(GLOBALS).map(([k, r]) => k === "politics_lag_years"
    ? `<tr><td>${esc(GLOBAL_LABELS[k])}</td><td>${qty(r, (x) => `${x}`)} years</td><td>${badge("judgment")} ${esc(GLOBAL_NOTES[k])}</td></tr>`
    : `<tr><td>${esc(GLOBAL_LABELS[k])}</td><td>${pctIn(pertMean(r))}</td><td>${badge("judgment")} Anchored to markets. ${esc(GLOBAL_NOTES[k])}</td></tr>`).join("");
  let html = `<h3 style="font-size:14px;margin:4px 0">Shared by every country</h3><div class="tablewrap"><table><thead><tr><th>Input</th><th>Value</th><th>Source</th></tr></thead><tbody>${g}</tbody></table></div>`;
  for (const iso of state.sel) {
    const c = COUNTRIES[byIso[iso]], term = c.termYears ?? 4;
    const rows = [];
    c.periods.forEach((p) => {
      if (p.kind === "fixed") rows.push([`Government from ${p.start}`, STATE_WORD[p.state], "data", p.note || ""]);
      if (p.kind === "keep") rows.push([`Majority survives the midterm (government from ${p.start})`, pctIn(pertMean(p.keep)), p.source || "judgment", p.note || "Judgment from how often majorities survive mid-term elections."]);
      if (p.kind === "draw") {
        let pL = pertMean(p.pL), pR = pertMean(p.pR); const sum = pL + pR;
        if (sum > 0.98) { pL *= 0.98 / sum; pR *= 0.98 / sum; }
        rows.push([`Election starting ${p.start}: left-led / right-led`, `${pctIn(pL)} / ${pctIn(pR)}`, p.source || "judgment", p.note || "Judgment from how often power has alternated in recent decades."]);
      }
    });
    const qn = { L_normal: "left-led, no shock", R_normal: "right-led, no shock", O_normal: "other, no shock", L_shock: "left-led, during a shock", R_shock: "right-led, during a shock", O_shock: "other, during a shock" };
    for (const [k, lab] of Object.entries(qn)) rows.push([`Chance of enacting in a ${term}-year term: ${lab}`, pctIn(pertMean(c.q[k])), "judgment", k === "L_shock" ? c.qNote : ""]);
    rows.push(["Chance a US-scale AI shock reaches it", pctIn(pertMean(c.exposure)), c.iso3 === "USA" ? "data" : "judgment", c.exposureNote || ""]);
    rows.push(["Lag behind the US shock", `${qty(c.lag, (x) => `${Math.round(x * 10) / 10}`)} years`, c.iso3 === "USA" ? "data" : "judgment", ""]);
    rows.push(["Amount if enacted without a shock", `${qty(c.amount.normal, (x) => `${Math.round(x * 10) / 10}%`)} of GDP per head`, "judgment", ""]);
    rows.push(["Amount if enacted during a shock", `${qty(c.amount.shock, (x) => `${Math.round(x * 10) / 10}%`)} of GDP per head`, "judgment", c.amountNote || ""]);
    rows.push(["Yearly chance a governing majority raises an existing program during a shock", pctIn(pertMean(c.ratchet)), "judgment", ""]);
    html += `<details class="country" ${state.sel.length === 1 ? "open" : ""}><summary>${esc(c.name)}</summary>
      ${c.facts ? `<ul>${c.facts.map((f) => `<li>${esc(f.text)} <a href="${esc(f.url)}" target="_blank" rel="noopener">source</a></li>`).join("")}</ul>` : ""}
      ${c.electionNote ? `<p>${esc(c.electionNote)}</p>` : ""}
      <div class="tablewrap"><table><thead><tr><th>Input</th><th>Value</th><th>Source</th></tr></thead><tbody>${
        rows.map(([a, b, k, n]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${badge(k)} ${esc(n)}</td></tr>`).join("")}</tbody></table></div>
      ${c.sources?.length ? `<p>Sources: ${c.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join("; ")}</p>` : ""}</details>`;
  }
  $("assumptions").innerHTML = html;
}

function renderHow() {
  $("how").innerHTML = `
    <p>The model covers ten countries: the United States, the United Kingdom, Canada, Germany, France, Spain, Japan, South Korea, Australia and Brazil. For each, a research agent gathered the current government, election calendar, party positions on basic income, polling, existing programs and election markets. A second agent re-fetched the cited sources for 332 of those claims: 264 held, 42 needed corrections, 7 were wrong and 19 could not be checked. The corrections are applied, and each fact above links to a source that states it.</p>
    <p>The model simulates histories from 2027 to 2050. In each one it draws the inputs from their ranges and decides when, if at all by 2050, an AI labor shock starts. The shock is the same for every country, so their fates are linked. It then decides whether and when the shock reaches each country and walks election by election. Each year a government has a chance of enacting a universal payment that depends on who governs and whether a shock is under way. If one passes, its size is drawn relative to GDP per head, and during a shock a governing majority can raise it later.</p>
    <p>A forecast here is the share of histories where the event happens. Every history carries its own draw of the inputs, so that share already averages over what we don't know about them. The signposts above show how far it would move if we learned something.</p>
    <p>The sliders and risk switches change the assumptions and rerun the simulation. A supposition keeps the assumptions and filters to the histories where it comes true, which is Bayes' rule applied to the simulation. The page starts with 20,000 histories and adds batches up to 200,000; a decimal place appears once the simulation's own noise is below 0.1 points.</p>
    <h3>What it leaves out</h3>
    <p>AI timing and elections are independent here, though a shock would move elections. Party labels compress real coalitions into left-led, right-led and other. Enactment chances are judgments; the table above says which inputs rest on markets or data. The US version matches a separate Python model to within simulation noise. The engine is tested for invariants: probabilities are nested by year, amount and country set, and every signpost averages back to today's forecast. The Python model's tests check the same for year and amount.</p>
    <p>Code, research and tests: <a href="https://github.com/MaxGhenis/ubi-forecast">github.com/MaxGhenis/ubi-forecast</a>.</p>`;
}

// ---------------------------------------------------------------- controls wiring
function buildControls() {
  $("clist").innerHTML = COUNTRIES.map((c) => `<label><input type="checkbox" value="${c.iso3}" ${state.sel.includes(c.iso3) ? "checked" : ""}> ${esc(c.name)}<span class="p" data-p="${c.iso3}"></span></label>`).join("");
  for (const cb of document.querySelectorAll("#clist input")) cb.onchange = () => {
    const sel = [...document.querySelectorAll("#clist input:checked")].map((x) => x.value);
    if (!sel.length) { cb.checked = true; return; }
    state.sel = sel; update();
  };
  for (const b of document.querySelectorAll("[data-preset]")) b.onclick = () => {
    const p = b.dataset.preset;
    state.sel = p === "all" ? COUNTRIES.map((c) => c.iso3) : p === "g7" ? COUNTRIES.filter((c) => G7.includes(c.iso3)).map((c) => c.iso3) : ["USA"];
    state.cond = null;
    for (const cb of document.querySelectorAll("#clist input")) cb.checked = state.sel.includes(cb.value);
    update();
  };
  $("risks").innerHTML = Object.entries(RISKS).map(([k, r]) => `<label class="toggle"><input type="checkbox" value="${k}" ${state.risks.includes(k) ? "checked" : ""}><span>${esc(r.label)}</span><span class="help">${esc(r.detail)}</span></label>`).join("");
  for (const cb of document.querySelectorAll("#risks input")) cb.onchange = () => { state.risks = [...document.querySelectorAll("#risks input:checked")].map((x) => x.value); update(); };
  const bind = (id, key, fmt) => {
    const el = $(id); el.value = state[key];
    const show = () => { $(`v-${key}`).textContent = fmt(state[key]); el.setAttribute("aria-valuetext", fmt(state[key])); };
    show();
    el.oninput = () => { state[key] = +el.value; show(); update(); };
  };
  bind("c-shift", "shift", (v) => (v === 0 ? "as estimated" : v < 0 ? `${-v} years earlier` : `${v} years later`));
  bind("c-appetite", "appetite", (v) => (v === 0 ? "as estimated" : `× ${fmtMult(2 ** v)}`));
  bind("c-generosity", "generosity", (v) => (v === 0 ? "as estimated" : `× ${fmtMult(2 ** v)}`));
  $("c-exposure").value = state.exposure; $("c-exposure").onchange = (e) => { state.exposure = e.target.value; update(); };
  $("reset").onclick = () => { Object.assign(state, { shift: 0, exposure: "model", appetite: 0, generosity: 0, risks: [], cond: null }); buildControls(); update(); };
  $("hero-country").onchange = (e) => {
    if (e.target.value === "__multi") { if (state.sel.length === 1) state.sel = COUNTRIES.map((c) => c.iso3); }
    else state.sel = [e.target.value];
    state.cond = null;
    for (const cb of document.querySelectorAll("#clist input")) cb.checked = state.sel.includes(cb.value);
    update();
  };
  $("hero-threshold").onchange = (e) => { state.t = +e.target.value; update(); };
  $("hero-year").onchange = (e) => { state.year = +e.target.value; update(); };
}
const fmtMult = (x) => x.toFixed(2).replace(/\.?0+$/, "");

function update() {
  if (state.cond && sim && !signpostDefs().some((d) => d.id === state.cond)) state.cond = null;
  writeHash();
  maybeResimulate();
}

// ---------------------------------------------------------------- boot
function boot() {
  $("asof").textContent = `Forecast as of ${MARKETS.asOf}.`;
  const root = document.documentElement;
  const current = () => root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const setThemeLabel = () => { const next = current() === "dark" ? "Light" : "Dark"; $("theme").textContent = next; $("theme").setAttribute("aria-label", `${next} theme`); };
  try { const saved = localStorage.getItem("ubi-theme"); if (saved) root.dataset.theme = saved; } catch { /* storage unavailable */ }
  setThemeLabel();
  $("theme").onclick = () => {
    root.dataset.theme = current() === "dark" ? "light" : "dark";
    try { localStorage.setItem("ubi-theme", root.dataset.theme); } catch { /* storage unavailable */ }
    setThemeLabel(); render();
  };
  $("share").onclick = async () => {
    writeHash();
    try { await navigator.clipboard.writeText(location.href); $("share").textContent = "Link copied"; }
    catch { $("share").textContent = "Copy the address bar"; }
    setTimeout(() => ($("share").textContent = "Copy link to this view"), 1800);
  };
  $("curve-table-toggle").onclick = (e) => {
    const on = e.target.getAttribute("aria-pressed") !== "true";
    e.target.setAttribute("aria-pressed", on); e.target.textContent = on ? "Show as chart" : "Show as table";
    $("curve-table").hidden = !on; $("curve").hidden = on; $("curve-legend").hidden = on;
  };
  writeHash();   // normalizes a hand-edited link
  buildControls();
  buildHeroControls();   // fill the check's blanks before the first batch lands
  renderHow();
  renderAssumptions();
  worker = makeWorker();
  if (worker) {
    worker.onmessage = (e) => onBatch(e.data);
    worker.onerror = () => { worker = null; if (run) requestBatch(); };   // fall back to the main thread
  }
  let resizeT = null, lastW = 0;
  new ResizeObserver((entries) => {
    const w = Math.round(entries[0].contentRect.width);
    if (w === lastW) return;
    lastW = w; clearTimeout(resizeT); resizeT = setTimeout(render, 120);
  }).observe(document.querySelector("main"));
  addEventListener("hashchange", () => { state = readHash(); buildControls(); maybeResimulate(); });
  startRun();
}
boot();

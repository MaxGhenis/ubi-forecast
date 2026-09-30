// Monte Carlo engine for the UBI adoption dashboard.
//
// Bayesian by construction: every simulated history draws its own inputs from
// their prior ranges (PERT distributions), so averaging an event over histories
// gives its probability with the input uncertainty integrated out. Observations
// ("suppose an AI shock starts by 2030") are handled by conditioning: keep the
// histories where the observation holds and average over those.
//
// The US configuration reproduces ../model/ubi_model.py (checked by
// test/differential.test.js). Amounts are in % of GDP per capita, so one
// threshold means the same thing in every country.

export const FIRST_YEAR = 2027;          // no country can enact before 2027
export const LAST_YEAR = 2050;
export const NEVER = 9999;
export const STATES = { O: 0, L: 1, R: 2 }; // other/divided/coalition, left-led, right-led

// Qualifying-amount thresholds, % of GDP per capita per adult per year.
// 6.665 = $6,000 / $90,027 (US GDP per capita, World Bank 2025).
export const THRESHOLDS = [1.11, 2.5, 6.665, 15, 25];

// ---------------------------------------------------------------- random numbers
export function makeRng() {
  // sfc32, seeded through splitmix32; reseed() restarts the stream.
  let a = 0, b = 0, c = 0, d = 0, spare = null;
  const next = () => {
    const t = (((a + b) >>> 0) + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return t / 4294967296;
  };
  const reseed = (seed) => {
    let x = seed >>> 0;
    const sm = () => {
      x = (x + 0x9e3779b9) >>> 0;
      let z = x;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
      return (z ^ (z >>> 16)) >>> 0;
    };
    a = sm(); b = sm(); c = sm(); d = sm(); spare = null;
    for (let i = 0; i < 12; i++) next();
  };
  const normal = () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0;
    while (u === 0) u = next();
    const v = next();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
  const gamma = (k) => {
    // Marsaglia-Tsang; k >= 1 always holds for PERT shapes.
    const d0 = k - 1 / 3, c0 = 1 / Math.sqrt(9 * d0);
    for (;;) {
      let x, v;
      do { x = normal(); v = 1 + c0 * x; } while (v <= 0);
      v = v * v * v;
      const u = next();
      if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d0 * (1 - v + Math.log(v))) return d0 * v;
    }
  };
  const beta = (a1, b1) => { const x = gamma(a1); return x / (x + gamma(b1)); };
  return { next, normal, beta, reseed };
}
// Inverse standard normal CDF (Acklam's rational approximation, relative error < 1.2e-9).
export function probit(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - lo) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
export function rngFrom(seed) { const r = makeRng(); r.reseed(seed); return r; }

// Stream id for (seed, history, stream). Country streams key on the ISO code, so a
// country's randomness doesn't depend on which other countries are simulated.
const mix = (seed, s, k) => (seed ^ Math.imul(s + 1, 0x9e3779b1) ^ Math.imul(k + 1, 0x85ebca6b)) >>> 0;
const isoKey = (iso) => { let h = 7; for (const ch of iso) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0; return h; };

// A prior range: "between lo and hi, probably around mode", as a PERT (scaled beta)
// distribution. Draws use a cached inverse-CDF table (2,048-step numerical CDF, 1,024
// quantiles, linear interpolation): one uniform per draw, accurate to well under 0.1% of the range.
const tables = new WeakMap();
function pertTable(r) {
  let q = tables.get(r);
  if (q) return q;
  const a = 1 + (4 * (r.mode - r.lo)) / (r.hi - r.lo), b = 1 + (4 * (r.hi - r.mode)) / (r.hi - r.lo);
  const N = 2048, M = 1024;
  const pdf = (x) => Math.pow(x, a - 1) * Math.pow(1 - x, b - 1);
  const cdf = new Float64Array(N + 1);
  let prev = pdf(0), acc = 0;
  for (let i = 1; i <= N; i++) { const cur = pdf(i / N); acc += (prev + cur) / (2 * N); cdf[i] = acc; prev = cur; }
  q = new Float64Array(M + 1);
  let i = 0;
  for (let k = 0; k <= M; k++) {
    const target = (k / M) * acc;
    while (i < N && cdf[i + 1] < target) i++;
    const span = cdf[i + 1] - cdf[i];
    q[k] = Math.min(1, (i + (span > 0 ? (target - cdf[i]) / span : 0)) / N);
  }
  q[0] = 0; q[M] = 1;
  tables.set(r, q);
  return q;
}
export function pert(rng, r) {
  if (r.hi === r.lo) return r.lo;
  const q = pertTable(r), pos = rng.next() * (q.length - 1), k = Math.floor(pos);
  return r.lo + (r.hi - r.lo) * (q[k] + (pos - k) * (q[k + 1] - q[k]));
}
export const pertMean = (r) => (r.lo + 4 * r.mode + r.hi) / 6;

// Enactment chances are stated per term of office; termYears converts them to a yearly chance.
const perYear = (qTerm, termYears) => 1 - Math.pow(1 - Math.min(Math.max(qTerm, 0), 1), 1 / termYears);

// ---------------------------------------------------------------- controls
export const DEFAULT_CONTROLS = {
  shockShiftYears: 0,      // moves every AI-shock onset later (+) or earlier (-)
  appetite: 1,             // multiplies every enactment chance
  generosity: 1,           // multiplies every amount median
  exposureMode: "model",   // "model" | "all" (every country fully exposed, no lag) | "us-only"
  risks: { fiscal: false, meansTested: false, diffusion: false, gridlock: false },
};

export const RISKS = {
  fiscal: { label: "Fiscal squeeze", detail: "Debt and interest costs bind: enactment chances × 0.6 and amounts × 0.85." },
  meansTested: { label: "Means-tested route wins", detail: "Governments reach for targeted floors instead: enactment chances × 0.6 without a shock, × 0.8 during one." },
  diffusion: { label: "Policy diffusion", detail: "Once any of the ten countries enacts a UBI, each country without one gets enactment chances × 1.5 from the next year. It can't change when the first country acts." },
  gridlock: { label: "Gridlock", detail: "Governments coded 'other' (divided government, cross-bloc coalitions, hung parliaments) enact at 0.3 times their usual chance." },
};

// ---------------------------------------------------------------- periods
// A country's political calendar is a list of periods, each starting in a year:
//   {start, kind: "fixed", state}           state known (current government)
//   {start, kind: "draw", pL, pR}           an election: left-led w.p. pL, right-led w.p. pR, else other
//   {start, kind: "keep", keep}             a midterm: the previous state survives w.p. keep, else other
function stateInYear(periodStates, periods, year) {
  let idx = 0;
  for (let i = 0; i < periods.length; i++) if (periods[i].start <= year) idx = i;
  return periodStates[idx];
}

// ---------------------------------------------------------------- simulation
// Election, midterm and exposure inputs each feed exactly one yes/no draw per history, so drawing
// the probability from its range and then flipping a coin equals flipping a coin at the range's
// mean. The engine uses the mean: same distribution, far fewer random draws. Left + right is capped
// at 0.98; the US never reaches the Python model's 0.9 cap. Enactment chances, amounts, lags and shock timing are drawn once
// per history and shared by all its years, so their spread matters and they are drawn in full.
function planFor(c) {
  const periods = c.periods.map((p) => {
    if (p.kind === "draw") {
      let pL = pertMean(p.pL), pR = pertMean(p.pR);
      const sum = pL + pR;
      if (sum > 0.98) { pL *= 0.98 / sum; pR *= 0.98 / sum; }
      return { kind: 2, pL, pR };
    }
    if (p.kind === "keep") return { kind: 1, keep: pertMean(p.keep) };
    return { kind: 0, state: STATES[p.state] };
  });
  const idxOfYear = new Int8Array(LAST_YEAR - FIRST_YEAR + 1);
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
    let idx = 0;
    for (let i = 0; i < c.periods.length; i++) if (c.periods[i].start <= y) idx = i;
    idxOfYear[y - FIRST_YEAR] = idx;
  }
  const signpost = c.signpostPeriod ?? c.periods.findIndex((p) => p.kind === "draw");
  return { periods, idxOfYear, signpost, exposure: pertMean(c.exposure), termYears: c.termYears ?? 4, key: isoKey(c.iso3) };
}

const Q_KEYS = ["O_normal", "L_normal", "R_normal", "O_shock", "L_shock", "R_shock"]; // index = state + 3 * shock

// `start` offsets the history index, so batches [0, k) + [k, 2k) equal one run of 2k histories.
export function simulate({ countries, globals, controls = DEFAULT_CONTROLS, n = 40000, seed = 20260929, start = 0 }) {
  const C = countries.length, T = THRESHOLDS.length;
  const risks = { ...DEFAULT_CONTROLS.risks, ...(controls.risks || {}) };
  const shift = controls.shockShiftYears || 0;
  const appetite = controls.appetite ?? 1, generosity = controls.generosity ?? 1;
  const onset = new Float32Array(n);                         // global AI-shock onset (continuous year; Infinity = none by 2051)
  const firstYear = new Int16Array(n * C * T).fill(NEVER);   // [history][country][threshold]: first year amount >= threshold
  const stateNext = new Int8Array(n * C);                    // government after each country's signpost election
  const g = globals;
  const anchorYears = [2026.75, 2029, 2031, 2036, 2041, 2051];
  const plans = countries.map(planFor);
  const gr = makeRng();
  const rs = countries.map(() => makeRng());
  const cs = countries.map((c, ci) => ({ shockFrom: 0, states: new Int8Array(c.periods.length), h: new Float64Array(6), hd: new Float64Array(6), amtN: 0, amtS: 0, ratchet: 0, amount: 0 }));

  for (let s = 0; s < n; s++) {
    // Global AI-shock onset: piecewise-linear CDF through the cumulative anchors.
    const h = s + start;
    gr.reseed(mix(seed, h, 0));
    const cum = [0, pert(gr, g.shock_by_2028), pert(gr, g.shock_by_2030), pert(gr, g.shock_by_2035),
      pert(gr, g.shock_by_2040), pert(gr, g.shock_by_2050)];
    for (let j = 1; j < cum.length; j++) cum[j] = Math.max(cum[j], cum[j - 1]);
    const u = gr.next();
    let on = Infinity;
    for (let j = 1; j < cum.length; j++) {
      if (u < cum[j]) {
        const frac = cum[j] > cum[j - 1] ? (u - cum[j - 1]) / (cum[j] - cum[j - 1]) : 0;
        on = anchorYears[j - 1] + frac * (anchorYears[j] - anchorYears[j - 1]);
        break;
      }
    }
    if (Number.isFinite(on)) on = Math.max(on + shift, 2026.75);   // no shock has started as of October 2026
    onset[s] = on;
    const polLag = Math.round(pert(gr, g.politics_lag_years));

    // Per-country draws, each from its own stream, always in the same order.
    for (let ci = 0; ci < C; ci++) {
      const c = countries[ci], plan = plans[ci], x = cs[ci], r = rs[ci];
      r.reseed(mix(seed, h, plan.key));
      let exposed = r.next() < plan.exposure;
      let lag = pert(r, c.lag);
      if (controls.exposureMode === "all") { exposed = true; lag = 0; }
      if (controls.exposureMode === "us-only") exposed = c.iso3 === "USA";
      x.shockFrom = exposed && Number.isFinite(on) ? Math.ceil(on + lag) + polLag : Infinity;
      for (let i = 0; i < plan.periods.length; i++) {
        const p = plan.periods[i], v = r.next();
        x.states[i] = p.kind === 0 ? p.state : p.kind === 1 ? (v < p.keep ? x.states[i - 1] : 0) : v < p.pL ? 1 : v < p.pL + p.pR ? 2 : 0;
      }
      stateNext[s * C + ci] = x.states[plan.signpost >= 0 ? plan.signpost : 0];
      for (let k = 0; k < 6; k++) {
        // Yearly hazard for each (state, shock) pair, with the risk multipliers applied once per history.
        const shock = k >= 3, st = k % 3;
        let qTerm = pert(r, c.q[Q_KEYS[k]]) * appetite;
        if (risks.fiscal) qTerm *= 0.6;
        if (risks.meansTested) qTerm *= shock ? 0.8 : 0.6;
        if (risks.gridlock && st === 0) qTerm *= 0.3;
        x.h[k] = perYear(qTerm, plan.termYears);
        x.hd[k] = perYear(qTerm * 1.5, plan.termYears);   // after another country has enacted (diffusion)
      }
      x.amtN = pert(r, c.amount.normal) * generosity;
      x.amtS = pert(r, c.amount.shock) * generosity;
      x.ratchet = pert(r, c.ratchet);
      x.amount = 0;
    }

    let anyEnactedYear = NEVER;
    const fiscalAmt = risks.fiscal ? 0.85 : 1;
    for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
      let enactedThisYear = false;
      for (let ci = 0; ci < C; ci++) {
        const plan = plans[ci], x = cs[ci], r = rs[ci];
        // Four uniform draws every year, used or not, so a change elsewhere never shifts this stream;
        // normals come from the inverse CDF only when needed.
        const uEnact = r.next(), uAmt = r.next() || 1e-12, uRatchet = r.next(), uRedraw = r.next() || 1e-12;
        const shock = y >= x.shockFrom;
        const st = x.states[plan.idxOfYear[y - FIRST_YEAR]];
        const hk = st + (shock ? 3 : 0);
        const hazard = risks.diffusion && anyEnactedYear < y ? x.hd[hk] : x.h[hk];
        if (x.amount === 0 && uEnact < hazard) {
          const med = (shock ? x.amtS : x.amtN) * fiscalAmt;
          x.amount = Math.max(med * Math.exp((shock ? 0.5 : 0.6) * probit(uAmt)), THRESHOLDS[0]);   // a qualifying program is at least ~1.1% of GDP per head
          enactedThisYear = true;
        }
        if (x.amount > 0 && shock && st !== 0 && uRatchet < x.ratchet) {
          const redraw = x.amtS * fiscalAmt * Math.exp(0.5 * probit(uRedraw));
          if (redraw > x.amount) x.amount = redraw;
        }
        if (x.amount > 0) {
          const base = (s * C + ci) * T;
          for (let t = 0; t < T; t++) if (x.amount >= THRESHOLDS[t] && firstYear[base + t] === NEVER) firstYear[base + t] = y;
        }
      }
      if (enactedThisYear && anyEnactedYear === NEVER) anyEnactedYear = y;
    }
  }
  return { n, C, T, isos: countries.map((c) => c.iso3), onset, firstYear, stateNext };
}

// ---------------------------------------------------------------- summaries
// Event: some country in `subset` (indices) reaches threshold index t by year `year`.
export function eventMask(sim, subset, t, year, mask = null) {
  const { n, C, T, firstYear } = sim;
  const out = mask || new Uint8Array(n);
  for (let s = 0; s < n; s++) {
    let hit = 0;
    for (const ci of subset) if (firstYear[(s * C + ci) * T + t] <= year) { hit = 1; break; }
    out[s] = hit;
  }
  return out;
}

export function cumulative(sim, subset, t, condition = null) {
  // P(some country in subset reaches threshold t by year y | condition), for every year.
  const { n, C, T, firstYear } = sim;
  const Y = LAST_YEAR - FIRST_YEAR + 1;
  const counts = new Float64Array(Y);
  let denom = 0;
  for (let s = 0; s < n; s++) {
    if (condition && !condition[s]) continue;
    denom++;
    let first = NEVER;
    for (const ci of subset) { const f = firstYear[(s * C + ci) * T + t]; if (f < first) first = f; }
    if (first !== NEVER) counts[first - FIRST_YEAR]++;
  }
  const out = [];
  let acc = 0;
  for (let i = 0; i < Y; i++) { acc += counts[i]; out.push({ year: FIRST_YEAR + i, p: denom ? acc / denom : NaN }); }
  return { curve: out, n: denom };
}

// Conditional probabilities for a signpost event S and target U (both masks).
export function signpost(S, U) {
  let nS = 0, nSU = 0, nNS = 0, nNSU = 0;
  for (let s = 0; s < S.length; s++) {
    if (S[s]) { nS++; nSU += U[s]; } else { nNS++; nNSU += U[s]; }
  }
  const n = S.length;
  return { pS: nS / n, pIfYes: nS ? nSU / nS : NaN, pIfNo: nNS ? nNSU / nNS : NaN, pU: (nSU + nNSU) / n };
}

export function maskFrom(n, fn) {
  const m = new Uint8Array(n);
  for (let s = 0; s < n; s++) m[s] = fn(s) ? 1 : 0;
  return m;
}

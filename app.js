/* HHD Practice Room: static version for GitHub Pages. No accounts, no server, no AI.
   Everything a student writes is stored only in this browser (localStorage). */
(function () {
"use strict";
const AREAS = window.AREAS, CASES = window.CASES, BANK = window.QUESTIONS;
const TERMS = {
  Identify: "Name or recognise. No explanation needed, but be precise.",
  Outline: "Give the main features briefly. One or two clear sentences per mark.",
  Describe: "Give the characteristics or features in detail. Saying what it is, not why.",
  Explain: "Say how or why. Show cause and effect, and link to a health outcome or dimension.",
  Analyse: "Break it into parts and show how they relate. Explain the links and their significance.",
  Discuss: "Consider several points or perspectives in depth, with links and evidence.",
  Evaluate: "Weigh up strengths and limitations, then make and justify an overall judgement.",
  Compare: "Show similarities and differences, referring to both things in each point.",
  Justify: "Give reasons and evidence to support your answer or choice."
};

/* ---------- storage (never crashes if storage is blocked) ---------- */
const KEY = "hhd12.static.v1";
let state = { attempts: [], drafts: {} };
try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && Array.isArray(s.attempts) && s.drafts) state = s; } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
function getLast() { try { return localStorage.getItem(KEY + ".last"); } catch (e) { return null; } }
function setLast(id) { try { localStorage.setItem(KEY + ".last", id); } catch (e) {} }

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
const paras = s => String(s || "").split(/\n+/).filter(Boolean).map(p => "<p>" + esc(p) + "</p>").join("");
function stripTags(h) { const d = document.createElement("div"); d.innerHTML = h || ""; return d.textContent.replace(/\s+/g, " ").trim(); }
const words = s => (s.trim().match(/\S+/g) || []).length;
const getQ = id => BANK.find(q => q.id === id);
const attemptsFor = id => state.attempts.filter(a => a.qid === id);
function best(id) { const a = attemptsFor(id); return a.length ? a.reduce((m, x) => (x.mark / x.outOf > m.mark / m.outOf ? x : m)) : null; }
const pctClass = p => (p >= 0.99 ? "full" : p >= 0.5 ? "part" : "low");

/* ---------- marking guide → scorable criteria ----------
   "1 mark: …"                → one criterion worth 1
   "2 marks: …"               → one criterion worth 2
   "1 mark each (×2): …"      → two criteria worth 1 each
   "2 marks per dimension (×2)…" → two criteria worth 2 each
   "Note: …"                  → shown as a note, never scored
   Extended responses: "Criterion n: …" (checklist) + "Holistic bands: 7–8 = …; …" (band picker) */
function parseGuide(q) {
  if (q.ext) {
    const criteria = q.guide.filter(g => /^Criterion\s*\d/i.test(g)).map(g => g.replace(/^Criterion\s*\d+:\s*/i, ""));
    const bandLine = q.guide.find(g => /^Holistic bands/i.test(g)) || "";
    const bands = [...bandLine.replace(/^Holistic bands[^:]*:\s*/i, "").matchAll(/(\d+)(?:\s*[–-]\s*(\d+))?\s*=?\s*([^;]+)/g)]
      .map(m => ({ min: +m[1], max: +(m[2] ?? m[1]), text: m[3].trim().replace(/\.$/, "") }));
    return { criteria, bands, notes: [] };
  }
  const criteria = [], notes = [];
  for (const g of q.guide) {
    let m;
    if (/^note:/i.test(g)) { notes.push(g.replace(/^note:\s*/i, "")); continue; }
    if ((m = g.match(/^(\d+)\s*marks?\s*(?:each|per\s+\w+)\s*\(×\s*(\d+)\)\s*:?\s*([\s\S]*)$/i))) {
      for (let i = 1; i <= +m[2]; i++) criteria.push({ text: m[3] + (+m[2] > 1 ? ` (${i} of ${m[2]})` : ""), available: +m[1] });
      continue;
    }
    if ((m = g.match(/^(\d+)\s*marks?\s*:\s*([\s\S]*)$/i))) { criteria.push({ text: m[2], available: +m[1] }); continue; }
    criteria.push({ text: g, available: 0 }); // unknown format: shown, not scored (caught by checkGuides)
  }
  return { criteria, notes };
}
function checkGuides() { // console warning if any guide doesn't add up (for the teacher when editing questions.js)
  BANK.forEach(q => {
    const p = parseGuide(q);
    if (q.ext) { if (!p.bands.length) console.warn(q.id, "has no holistic bands"); return; }
    const t = p.criteria.reduce((s, c) => s + c.available, 0);
    if (t !== q.marks) console.warn(q.id, `marking guide adds to ${t}, question is worth ${q.marks}`);
  });
}

/* ---------- automatic checks (advice only, never marks) ---------- */
const DIMS = ["physical", "social", "emotional", "mental", "spiritual"];
function quickChecks(q, text) {
  const out = [], t = text.toLowerCase(), stem = stripTags(q.stem).toLowerCase(), all = (stem + " " + q.guide.join(" ")).toLowerCase();
  const ok = s => out.push({ ok: true, s }), warn = s => out.push({ ok: false, s });
  const n = words(text), target = q.ext ? 250 : q.marks * 18;
  if (n < target * 0.6) warn(`Your answer is ${n} words. For ${q.marks} marks you’ll usually need about ${q.ext ? "300 or more" : "one or two developed sentences per mark"}.`);
  else ok(`Length looks reasonable for ${q.marks} marks (${n} words).`);
  if (/health and wellbeing|dimension/.test(all)) {
    const found = DIMS.filter(d => new RegExp("\\b" + d + "\\b").test(t));
    if (!found.length) warn("No dimension of health and wellbeing is named (physical, social, emotional, mental or spiritual).");
    else ok("You named " + found.join(", ") + " health and wellbeing.");
    if (/interrelationship/.test(stem) && found.length < 2) warn("An interrelationship needs two dimensions, linked both ways (A affects B, and B affects A).");
  }
  if (/explain|analyse|discuss|evaluate/i.test(q.term) && /health|wellbeing|outcome|status|development/.test(all)) {
    if (!/\b(increas|decreas|reduc|improv|lower|higher|rais|promot|worsen|decline|less likely|more likely|prevent)/.test(t)) warn("No direction words found. Say whether the outcome increases, decreases, improves or worsens.");
    else ok("You used direction words (e.g. increases, reduces).");
  }
  const cs = q.case ? CASES[q.case] : "";
  if (cs) {
    if (/<table/.test(cs)) {
      if (!/\d/.test(text)) warn("This question has data. Quote figures with units and years, e.g. “4 120 per 100 000 in 2022”.");
      else if (/per 100 000/.test(cs) && !/per\s*100[ ,]?000/i.test(text)) warn("Include the unit with your figures (per 100 000).");
      else ok("You quoted data from the table.");
    }
    if (q.ext) {
      const s1 = /source\s*1/i.test(text), s2 = /source\s*2/i.test(text);
      if (!(s1 && s2)) warn("Refer to both sources by name, e.g. “… (Source 1)”. Not using every source caps your mark.");
      else ok("You referred to both sources.");
    } else {
      const names = [...cs.matchAll(/Case study:\s*([^<]+)</g)].map(m => m[1]).join(" ").match(/[A-Z][a-z]+/g) || [];
      const named = names.some(nm => t.includes(nm.toLowerCase()));
      if (names.length && !named && !/["“‘']/.test(text)) warn("Use the case study: mention " + names.join(" / ") + " and quote details from it.");
      else if (!/<table/.test(cs)) ok("You referred to the case study or source.");
    }
  }
  if (q.term === "Evaluate" && !/\b(overall|therefore|in conclusion|to conclude|on balance)\b/.test(t)) warn("Evaluate needs an overall judgement, e.g. “Overall, it is moderately effective because…”.");
  if (/\btwo\b/.test(stem)) out.push({ ok: null, s: "The question asks for two. Check each one is different and fully explained." });
  if (/\b(h\s*&\s*w|h\s*\+\s*w|hw)\b/i.test(text) && !/health and wellbeing\s*\(/i.test(text)) warn("Write “health and wellbeing (H&W)” in full the first time before using the abbreviation.");
  if (/\bA?TSI\b/.test(text)) warn("Don’t abbreviate “Aboriginal and Torres Strait Islander”. Write it in full.");
  if (/[↑↓]|-+>/.test(text)) warn("Replace arrows with words such as “increases” or “decreases”.");
  return out;
}

/* ---------- list ---------- */
let filter = "ALL", current = null, marking = null; // marking = in-progress self-check {scores, band, mark}
function renderChips() {
  const opts = [["ALL", "All"]].concat(Object.keys(AREAS).map(k => [k, AREAS[k].short]));
  $("#areaChips").innerHTML = opts.map(([k, l]) => `<button class="chip" type="button" data-a="${k}" aria-pressed="${filter === k}" title="${esc(k === "ALL" ? "All areas" : AREAS[k].name)}">${esc(l)}</button>`).join("");
}
function visibleQs() { const onlyNew = $("#onlyNew").checked; return BANK.filter(q => (filter === "ALL" || q.area === filter) && (!onlyNew || !attemptsFor(q.id).length)); }
function renderList() {
  renderOverallMini();
  const qs = visibleQs();
  $("#qlist").innerHTML = qs.length ? qs.map(q => {
    const b = best(q.id), p = b ? b.mark / b.outOf : null;
    return `<li><button type="button" data-q="${q.id}" aria-current="${!!(current && current.id === q.id)}">
      <span class="qt">${esc(stripTags(q.stem))}</span><span class="qm">${q.marks} mk</span>
      <span class="qs"><span class="dot ${p === null ? "" : pctClass(p)}"></span>${esc(AREAS[q.area].short)} · ${esc(q.term)}${b ? ` · best ${b.mark}/${b.outOf}` : ""}</span>
    </button></li>`;
  }).join("") : `<li class="note" style="padding:12px">Nothing here yet. Choose another area or untick the filter.</li>`;
}
$("#areaChips").addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (!b) return; filter = b.dataset.a; renderChips(); renderList(); });
$("#onlyNew").addEventListener("change", renderList);
$("#qlist").addEventListener("click", e => { const b = e.target.closest("[data-q]"); if (b) select(b.dataset.q, true); });
$("#randomBtn").addEventListener("click", () => { const qs = visibleQs(); if (qs.length) select(qs[Math.floor(Math.random() * qs.length)].id, true); });

function select(id, scroll) {
  current = getQ(id); marking = null; setLast(id); renderList(); renderSheet();
  if (scroll && window.matchMedia("(max-width:860px)").matches) $("#sheet").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- question sheet ---------- */
function renderSheet() {
  const el = $("#sheet"), q = current;
  if (!q) { el.innerHTML = `<p class="note">Choose a question from the list to start.</p>`; return; }
  const draft = state.drafts[q.id] || "", stim = q.case ? CASES[q.case] : "";
  el.innerHTML = `
    <div class="meta"><span class="tag">${esc(AREAS[q.area].short)} · ${esc(AREAS[q.area].name)}</span><span class="term">${esc(q.term)}</span><span class="marks">${q.marks} mark${q.marks > 1 ? "s" : ""}</span></div>
    ${stim ? `<div class="stim">${stim}</div>` : ""}
    <h2 class="stem" style="font-weight:400">${q.stem}</h2>
    <p class="kk">Study design: ${esc(q.kk)}</p>
    ${TERMS[q.term] ? `<details class="tip"><summary>What does “${esc(q.term)}” need?</summary><p style="margin:.4em 0 0">${esc(TERMS[q.term])} ${q.marks >= 3 ? `Aim for about one developed point per mark (${q.marks} marks).` : ""}</p></details>` : ""}
    <label for="ans" class="tag" style="display:block;margin-bottom:6px">Your answer</label>
    <textarea id="ans" class="answer" spellcheck="true" placeholder="Write your response as you would in the exam. Don’t include your name.">${esc(draft)}</textarea>
    <div class="under"><span id="wc">${words(draft)} words</span><span id="saved" aria-live="polite">${draft ? "Draft saved on this device" : ""}</span></div>
    <div class="actions">
      <button class="btn primary" id="checkBtn" type="button">Check my answer</button>
      <button class="btn" id="modelBtn" type="button">Show model answer</button>
    </div>
    <div id="modelBox"></div>
    <div id="fb" aria-live="polite"></div>`;
  const ta = $("#ans"); let t;
  ta.addEventListener("input", () => {
    $("#wc").textContent = words(ta.value) + " words";
    clearTimeout(t); t = setTimeout(() => { state.drafts[q.id] = ta.value; save(); $("#saved").textContent = "Draft saved on this device"; }, 400);
  });
  $("#checkBtn").addEventListener("click", startCheck);
  $("#modelBtn").addEventListener("click", showModel);
  const prev = attemptsFor(q.id).slice(-1)[0];
  if (prev) renderSummary(prev, true);
}
function modelHTML(q) { return `<div class="modelans"><h3 class="tag">Model answer (one possible full-mark response)</h3>${paras(q.model)}</div>`; }
function showModel() {
  const q = current, box = $("#modelBox");
  if (box.innerHTML) { box.innerHTML = ""; return; }
  if (!attemptsFor(q.id).length && !box.dataset.ok) {
    box.innerHTML = `<div class="modelans"><span class="confirm">You haven’t checked an answer to this question yet. Seeing the model answer first makes the practice less useful. <button class="btn small" id="mYes" type="button">Show it anyway</button></span></div>`;
    $("#mYes").onclick = () => { box.dataset.ok = "1"; box.innerHTML = ""; showModel(); };
    return;
  }
  box.innerHTML = modelHTML(q) + `<div class="modelans" style="margin-top:8px"><h3 class="tag">Marking guide</h3><ul>${q.guide.map(g => "<li>" + esc(g) + "</li>").join("")}</ul></div>`;
}

/* ---------- self-check ---------- */
function startCheck() {
  const q = current, answer = $("#ans").value;
  if (words(answer) < 3) { $("#fb").innerHTML = `<p class="err">Write your answer first, then check it.</p>`; return; }
  state.drafts[q.id] = answer; save();
  $("#modelBox").innerHTML = "";
  const p = parseGuide(q);
  marking = { p, scores: p.criteria.map(() => 0), band: null, mark: null };
  const qc = quickChecks(q, answer);
  const icon = c => (c.ok === true ? "✓" : c.ok === false ? "!" : "·");
  const cls = c => (c.ok === true ? "ok" : c.ok === false ? "warn" : "");
  $("#fb").innerHTML = `<div class="feedback">
    <h3 id="fbHead" tabindex="-1">Step 1 · Automatic checks</h3>
    <p class="note" style="margin-top:0">These look for common mistakes. They don’t give marks.</p>
    <ul class="qc">${qc.map(c => `<li class="${cls(c)}"><span class="ic" aria-hidden="true">${icon(c)}</span><span><span class="sr">${c.ok === false ? "Check: " : ""}</span>${esc(c.s)}</span></li>`).join("")}</ul>
    <div class="panel">
      <h3>Step 2 · Compare with the model answer</h3>
      ${paras(q.model)}
    </div>
    <div class="panel" id="markPanel">
      <h3>Step 3 · Mark it yourself</h3>
      <p class="howto">Only give yourself a mark if you can point to the sentence in your answer that earns it. If you’re unsure, leave it at 0 and ask your teacher.</p>
      ${q.ext ? extPanel(p) : criteriaPanel(p)}
      <div class="total"><span class="big" id="totalNum">– / ${q.marks}</span><span class="note" id="totalNote" style="margin:0"></span></div>
      <div class="actions"><button class="btn primary" id="saveMark" type="button" ${q.ext ? "disabled" : ""}>Save my mark</button></div>
    </div>
  </div>`;
  if (q.ext) wireExt(p); else wireCriteria(p);
  updateTotal();
  $("#saveMark").addEventListener("click", saveMark);
  $("#fbHead").focus();
}
function segHTML(i, max) {
  let h = `<span class="seg" role="group" aria-label="Marks for point ${i + 1}">`;
  for (let v = 0; v <= max; v++) h += `<button type="button" data-i="${i}" data-v="${v}" aria-pressed="${v === 0}">${v}</button>`;
  return h + "</span>";
}
function criteriaPanel(p) {
  return p.criteria.map((c, i) => `<div class="crit-row"><span class="t">${esc(c.text)}</span>${c.available ? segHTML(i, c.available) : `<span class="note">not scored</span>`}</div>`).join("")
    + (p.notes.length ? `<ul class="notes">${p.notes.map(n => "<li>Note: " + esc(n) + "</li>").join("")}</ul>` : "");
}
function wireCriteria() {
  $("#markPanel").addEventListener("click", e => {
    const b = e.target.closest(".seg button"); if (!b) return;
    const i = +b.dataset.i, v = +b.dataset.v; marking.scores[i] = v;
    b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.v === v)));
    updateTotal();
  });
}
function extPanel(p) {
  return `<p class="note" style="margin-top:0">Extended responses are marked as a whole. Use these criteria to judge your response, then choose the band that fits best.</p>
    <ul class="notes" style="color:var(--ink);font-size:.9rem">${p.criteria.map(c => "<li>" + esc(c) + "</li>").join("")}</ul>
    <fieldset class="bands" style="border:0;padding:0;margin:12px 0 0"><legend class="tag" style="margin-bottom:6px">Which band fits best?</legend>
    ${p.bands.map((b, i) => `<label><input type="radio" name="band" value="${i}"><span class="r">${b.min === b.max ? b.min : b.min + "–" + b.max}</span><span>${esc(b.text)}</span></label>`).join("")}
    </fieldset>
    <div id="bandMark" style="margin-top:10px"></div>`;
}
function wireExt(p) {
  $("#markPanel").addEventListener("change", e => {
    if (e.target.name !== "band") return;
    const b = p.bands[+e.target.value]; marking.band = b; marking.mark = null;
    if (b.min === b.max) { marking.mark = b.min; $("#bandMark").innerHTML = ""; }
    else {
      $("#bandMark").innerHTML = `<span class="tag" style="margin-right:8px">Top or bottom of the band?</span>` + `<span class="seg" role="group" aria-label="Mark within band">` +
        Array.from({ length: b.max - b.min + 1 }, (_, k) => b.min + k).map(v => `<button type="button" data-bm="${v}" aria-pressed="false">${v}</button>`).join("") + "</span>";
    }
    updateTotal();
  });
  $("#markPanel").addEventListener("click", e => {
    const b = e.target.closest("[data-bm]"); if (!b) return;
    marking.mark = +b.dataset.bm;
    b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    updateTotal();
  });
}
function currentMark() {
  const q = current;
  if (q.ext) return marking.mark;
  return Math.min(q.marks, marking.scores.reduce((s, v) => s + v, 0));
}
function updateTotal() {
  const m = currentMark(), q = current;
  $("#totalNum").textContent = (m === null ? "–" : m) + " / " + q.marks;
  $("#totalNote").textContent = q.ext && m === null ? "Choose a band, then a mark." : "Your self-check mark";
  $("#saveMark").disabled = m === null;
}
function saveMark() {
  const q = current, m = currentMark(); if (m === null) return;
  let worked = [], improve = [];
  if (q.ext) {
    improve = m < q.marks ? ["Compare your response with the band above yours and the model answer. Look at how sources are signposted and linked to health outcomes."] : [];
  } else {
    marking.p.criteria.forEach((c, i) => { if (!c.available) return; (marking.scores[i] === c.available ? worked : improve).push(c.text); });
  }
  const a = { qid: q.id, area: q.area, at: Date.now(), outOf: q.marks, mark: m, worked: worked.slice(0, 2), improve: improve.slice(0, 2), revise: m < q.marks ? [q.kk] : [], band: marking.band ? marking.band.text : "" };
  state.attempts.push(a); if (state.attempts.length > 500) state.attempts.shift();
  save(); marking = null; renderList(); renderSummary(a, false);
  const h = $("#fbHead"); if (h) h.focus();
}
function renderSummary(a, previous) {
  const p = a.mark / a.outOf, cls = pctClass(p);
  const label = cls === "full" ? "Full marks" : cls === "part" ? "Partly there" : "Needs work";
  const li = arr => arr.map(s => "<li>" + esc(s) + "</li>").join("");
  $("#fb").innerHTML = `<div class="feedback">
    <h3 id="fbHead" tabindex="-1" class="sr">Your result</h3>
    ${previous ? `<p class="note" style="margin-top:0">Your last attempt, ${new Date(a.at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}. Edit your answer above and check it again to improve it.</p>` : ""}
    <div class="score"><span class="big">${a.mark} / ${a.outOf}</span><span class="band ${cls}">${label}</span><span class="estimate">Self-check mark · practice only</span></div>
    <div class="fbgrid">
      ${a.worked && a.worked.length ? `<section><h3>What you got</h3><ul>${li(a.worked)}</ul></section>` : ""}
      ${a.improve && a.improve.length ? `<section><h3>To earn more marks</h3><ul>${li(a.improve)}</ul></section>` : ""}
      ${a.revise && a.revise.length ? `<section><h3>Revise</h3><ul>${li(a.revise)}</ul></section>` : ""}
    </div>
    <p class="note">Not sure you marked it fairly? Bring your answer to class. Your teacher’s mark is the one that counts.</p>
  </div>`;
}

/* ---------- overall mark ----------
   Uses each question's BEST attempt, so redoing a question to improve it raises the overall mark. */
function overall() {
  const bests = BANK.map(q => best(q.id)).filter(Boolean);
  const got = bests.reduce((s, b) => s + b.mark, 0), out = bests.reduce((s, b) => s + b.outOf, 0);
  const bankTotal = BANK.reduce((s, q) => s + q.marks, 0);
  return { got, out, tried: bests.length, pct: out ? got / out : null, bankTotal };
}
function renderOverallMini() {
  const o = overall(), el = $("#overallMini"); if (!el) return;
  el.innerHTML = o.tried ? `Overall: <strong>${o.got} / ${o.out}</strong> (${Math.round(o.pct * 100)}%) · ${o.tried} of ${BANK.length} questions` : "Overall mark: check an answer to start";
}

/* ---------- progress ---------- */
function areaStats() {
  return Object.keys(AREAS).map(k => {
    const qs = BANK.filter(q => q.area === k), bests = qs.map(q => best(q.id)).filter(Boolean);
    const got = bests.reduce((s, b) => s + b.mark, 0), out = bests.reduce((s, b) => s + b.outOf, 0);
    return { k, tried: bests.length, total: qs.length, pct: out ? got / out : null };
  });
}
function suggestions(stats) {
  const s = [];
  const untried = stats.filter(x => !x.tried);
  if (untried.length) s.push(`You haven’t tried ${untried.map(x => AREAS[x.k].short + " (" + AREAS[x.k].name + ")").join(", ")} yet. Start there so nothing surprises you in the exam.`);
  stats.filter(x => x.pct !== null && x.pct < 0.6).sort((a, b) => a.pct - b.pct)
    .forEach(x => s.push(`${AREAS[x.k].short} ${AREAS[x.k].name}: you’re averaging ${Math.round(x.pct * 100)}% on your best attempts. Redo those questions without looking at the model answer.`));
  const ext = stats.find(x => x.k === "EXT");
  if (ext && !ext.tried) s.push("Practise at least one extended response under timed conditions (about 15 minutes). Plan around the parts of the question, not the sources.");
  if (!s.length) s.push("You’re in good shape. Keep mixing areas, and redo any question you scored under full marks after a few days.");
  return s;
}
function weekPlan(stats) {
  const order = stats.filter(x => x.k !== "EXT").slice().sort((a, b) => (a.pct === null ? -1 : a.pct) - (b.pct === null ? -1 : b.pct));
  const pick = i => order[i % order.length];
  const days = [];
  for (let d = 0; d < 7; d++) {
    if (d === 3) { days.push({ title: "Extended response", tasks: ["Do one Section B question in 15 minutes, with 2 minutes of planning first.", "Self-check it against the bands, then underline every place you used a source."] }); continue; }
    if (d === 6) { days.push({ title: "Mixed review", tasks: ["Use Random question three times and answer without notes.", "Redo your lowest-scoring question from this week."] }); continue; }
    const a = pick(d < 3 ? d : d - 1);
    days.push({ title: `${AREAS[a.k].short} · ${AREAS[a.k].name}`, tasks: [
      `Make a one-page summary of the key knowledge for ${AREAS[a.k].name}.`,
      `Answer two ${AREAS[a.k].short} questions you haven’t tried (or scored lowest on), then self-check them.`] });
  }
  return days;
}
function renderProgress() {
  const stats = areaStats(), el = $("#view-progress"), n = state.attempts.length;
  const list = state.attempts.slice().reverse().slice(0, 40);
  const o = overall();
  el.innerHTML = `
    <div class="block overall">
      <div class="ov-main"><div class="lab">Overall mark</div>
        <div class="ov-num">${o.tried ? `${o.got} / ${o.out}` : "–"}</div>
        <div class="ov-pct">${o.tried ? `${Math.round(o.pct * 100)}% <span class="band ${pctClass(o.pct)}">${pctClass(o.pct) === "full" ? "Full marks" : pctClass(o.pct) === "part" ? "Partly there" : "Needs work"}</span>` : "No checked answers yet"}</div></div>
      <div class="ov-side">
        <p>${o.tried ? `Across the <strong>${o.tried}</strong> question${o.tried > 1 ? "s" : ""} you’ve checked, using your best attempt at each.` : "Check an answer to start your overall mark."}</p>
        <p>Question bank completed: <strong>${o.tried} of ${BANK.length}</strong> questions (${o.out} of ${o.bankTotal} marks attempted).</p>
        <div class="bar" aria-hidden="true"><i style="width:${Math.round(o.out / o.bankTotal * 100)}%"></i></div>
      </div>
    </div>
    <div class="cards" style="margin-top:16px">${stats.map(x => `<div class="card"><div class="lab">${esc(AREAS[x.k].short)}</div><div style="font-weight:600;font-size:.92rem">${esc(AREAS[x.k].name)}</div>
      <div class="val">${x.pct === null ? "–" : Math.round(x.pct * 100) + "%"}</div><div class="bar"><i style="width:${x.pct === null ? 0 : Math.round(x.pct * 100)}%"></i></div>
      <div class="sub">${x.tried} of ${x.total} questions tried</div></div>`).join("")}</div>
    <div class="block"><h2>What to revise next</h2><ul>${suggestions(stats).map(s => "<li>" + esc(s) + "</li>").join("")}</ul></div>
    <div class="block"><h2>7-day revision plan</h2><p class="note" style="margin-top:0">Built from your results, with weakest and untried areas first. About 30–45 minutes a day.</p>
      <div class="plan">${weekPlan(stats).map((d, i) => `<h4>Day ${i + 1}: ${esc(d.title)}</h4><ul>${d.tasks.map(t => "<li>" + esc(t) + "</li>").join("")}</ul>`).join("")}</div></div>
    <div class="block"><h2>History</h2>${n ? `<div class="histwrap"><table class="hist"><thead><tr><th>Date</th><th>Question</th><th>Mark</th></tr></thead><tbody>${list.map(a => { const q = getQ(a.qid); return `<tr><td class="n">${new Date(a.at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</td><td>${q ? `<button class="btn small" type="button" data-open="${q.id}" style="text-align:left">${esc(stripTags(q.stem).slice(0, 90))}${stripTags(q.stem).length > 90 ? "…" : ""}</button>` : "(question removed)"}</td><td class="n">${a.mark}/${a.outOf}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="note">No checked answers yet. They’ll appear here.</p>`}
      <div class="actions"><span id="clearWrap"><button class="btn small danger" id="clearBtn" type="button" ${n || Object.keys(state.drafts).length ? "" : "disabled"}>Clear my progress</button></span></div></div>`;
  el.querySelectorAll("[data-open]").forEach(b => b.onclick = () => { showView("practise"); filter = "ALL"; renderChips(); select(b.dataset.open); });
  $("#clearBtn").onclick = () => {
    $("#clearWrap").innerHTML = `<span class="confirm">Delete all saved answers and marks on this device? <button class="btn small danger" id="clearYes" type="button">Delete</button><button class="btn small" id="clearNo" type="button">Cancel</button></span>`;
    $("#clearYes").onclick = () => { state = { attempts: [], drafts: {} }; save(); renderList(); renderSheet(); renderProgress(); };
    $("#clearNo").onclick = renderProgress;
  };
}

/* ---------- views ---------- */
function showView(v) {
  document.querySelectorAll("nav.tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.view === v)));
  ["practise", "progress", "about"].forEach(x => { $("#view-" + x).hidden = x !== v; });
  if (v === "progress") renderProgress();
}
document.querySelector("nav.tabs").addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (b) showView(b.dataset.view); });
$("#termTable tbody").innerHTML = Object.entries(TERMS).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("");

checkGuides();
renderChips();
current = getQ(getLast()) || BANK[0];
renderList(); renderSheet();
})();

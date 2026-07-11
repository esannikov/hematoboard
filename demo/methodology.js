const CASES = {
  case01: {
    label: "CASE-01 · анемія",
    bundle: "./data/case_bundle.json",
    latest: null,
  },
  case02: {
    label: "CASE-02 · лімфаденопатія",
    bundle: "./case02/data/case_bundle.json",
    latest: "./case02/runs/latest.json",
  },
  case05: {
    label: "CASE005 · легкі ланцюги / нирка",
    bundle: "./case05/data/case_bundle.json",
    latest: "./case05/runs/latest.json",
  },
};

const PRIMARY_VIEWS = [
  ["overview", "Огляд"],
  ["timeline", "Історія"],
  ["consilium", "Консиліум"],
  ["evidence", "Докази"],
  ["state", "Дослідження"],
  ["packet", "Пакет"],
];

const METHOD_VIEWS = [
  ["graph", "Граф"],
  ["multimodal", "Зіставлення даних"],
  ["protocol", "Протокол агентних дебатів"],
];

const VIEW_LABELS = Object.fromEntries([...PRIMARY_VIEWS, ...METHOD_VIEWS, ["bodymap", "Локалізація"]]);
const state = { caseKey: "case02", view: "overview", bundle: null, latestRun: null };

const DISPLAY_REPLACEMENTS = [
  [/working_deidentified/gi, "робоче знеособлення підтверджено"],
  [/важливий понижений диференціал/gi, "можливий варіант, але з меншою ймовірністю"],
  [/пониженим диференціалом для порівняння/gi, "можливим варіантом із меншою ймовірністю"],
  [/понижений диференціал для порівняння/gi, "можливий варіант із меншою ймовірністю"],
  [/понижений диференціал/gi, "можливий варіант із меншою ймовірністю"],
  [/понижена, але видима/gi, "можлива, але менш імовірна"],
  [/clinician\/source QA/gi, "перевірку лікарем і джерела"],
  [/candidate\/decision support/gi, "попередню оцінку / підтримку рішень"],
  [/candidate local provenance/gi, "локальний попередній слід джерела"],
  [/guideline[- ]candidate traces?/gi, "попередні сліди настанов"],
  [/candidate traces?/gi, "попередні сліди"],
  [/source QA/gi, "перевірку джерела"],
  [/tissue QA/gi, "морфологічну верифікацію"],
  [/central QA/gi, "центральну морфологічну верифікацію"],
  [/red team/gi, "рецензент з безпеки"],
  [/workup/gi, "діагностичний алгоритм"],
  [/comparator/gi, "диференціал для порівняння"],
  [/overcall/gi, "переоцінка впевненості"],
  [/confidence/gi, "рівень впевненості"],
  [/proof of subtype/gi, "доказ підтипу"],
  [/TFH-oriented IHC/gi, "ІГХ, орієнтована на TFH"],
  [/tissue signal/gi, "тканинний сигнал"],
  [/therapy language/gi, "мови лікувальних рекомендацій"],
  [/no treatment/gi, "без лікувальних рекомендацій"],
  [/side-by-side/gi, "порівняльному"],
  [/reactive-only/gi, "суто реактивному"],
  [/competitors/gi, "конкурентні гіпотези"],
  [/imaging/gi, "візуалізація"],
  [/staging/gi, "стадіювання"],
  [/dashboard/gi, "панель"],
  [/raw NCCN PDF/gi, "оригінальний PDF NCCN"],
  [/\bQA\b/g, "перевірка якості"],
];

function displayText(value) {
  let text = String(value);
  DISPLAY_REPLACEMENTS.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });
  return text;
}

const content = document.getElementById("content");
const statusLine = document.getElementById("bundle-status");
const caseSelect = document.getElementById("case-select");
const footerContract = document.getElementById("footer-contract");

function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = displayText(options.text);
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === undefined || child === null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function textValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(textValue).join(" · ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${textValue(item)}`)
      .join(" · ");
  }
  return displayText(value);
}

function clipped(value, length = 46) {
  const text = textValue(value);
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

// Clip at a word boundary — never cut mid-word (reads as a whole short phrase).
function wordClip(value, maxLen = 46) {
  const t = displayText(String(value));
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const i = cut.lastIndexOf(" ");
  const base = i > maxLen * 0.55 ? cut.slice(0, i) : cut;
  return `${base.replace(/[\s,;:.–—-]+$/, "")}…`;
}

// Internal enum values → clinical Ukrainian labels (never show raw enums to a clinician).
const ENUM_LABELS = {
  present: "наявна", audited: "перевірено", discordant: "розбіжність між методами",
  high_signal_partial: "сильний сигнал (частково)", partial: "частковий сигнал",
  missing: "відсутня", not_used_clean: "не застосовувалась",
  decisive: "вирішальна", high: "висока", moderate: "помірна", parallel: "паралельна", urgent: "термінова",
  candidate: "кандидатний висновок", critical: "критичний", gap: "прогалина",
  neoplasm: "неопластичний", "non-diagnostic": "недіагностично", partial_refute: "частково спростовує",
  reactive: "реактивний", refute: "спростовує", suspicious: "підозрілий", support: "підтримує", neutral: "нейтрально",
};
const ENUM_TONE = {
  present: "evidence", audited: "evidence", discordant: "critical", high_signal_partial: "candidate",
  partial: "candidate", decisive: "critical", high: "candidate", urgent: "critical",
  candidate: "candidate", critical: "critical", neoplasm: "critical", partial_refute: "candidate",
  refute: "candidate", suspicious: "candidate",
};
function enumLabel(value) {
  if (value === true) return "виконано";
  if (value === false) return "не виконано";
  if (value === null || value === undefined || value === "") return "—";
  const k = String(value);
  return ENUM_LABELS[k] || ENUM_LABELS[k.toLowerCase()] || displayText(k);
}
function enumTone(value) {
  return ENUM_TONE[String(value).toLowerCase()] || "";
}

// Wrap into up to N lines by words (for SVG labels — no mid-word cuts).
function wrapLines(value, maxChars, maxLines = 2) {
  const words = displayText(String(value)).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  const shown = lines.join(" ");
  const full = displayText(String(value));
  if (shown.length < full.length && lines.length) {
    lines[lines.length - 1] = wordClip(`${lines[lines.length - 1]} ${full.slice(shown.length).trim()}`, maxChars);
  }
  return lines;
}

function sectionHeader(label, title, copy = "") {
  const heading = element("div", { className: "section-head" });
  const left = element("div");
  left.append(element("p", { className: "section-label", text: label }), element("h3", { text: title }));
  heading.append(left);
  if (copy) heading.append(element("p", { className: "section-copy", text: copy }));
  return heading;
}

function section(label, title, copy = "") {
  const node = element("section", { className: "content-section" });
  node.append(sectionHeader(label, title, copy));
  return node;
}

function viewHeader(title, intro, contextLabel = `Пакет кейсу · ${VIEW_LABELS[state.view]}`) {
  const wrapper = element("header", { className: "view-header" });
  const copy = element("div");
  copy.append(
    element("p", { className: "eyebrow", text: contextLabel }),
    element("h2", { text: title }),
    element("p", { className: "view-intro", text: intro }),
  );
  wrapper.append(copy);
  return wrapper;
}

function statusTag(label, tone = "") {
  return element("span", {
    className: "status-tag",
    text: label,
    attrs: tone ? { "data-tone": tone } : {},
  });
}

function chip(label) {
  return element("span", { className: "chip", text: label });
}

// Patient-data chip: clean label (no "Знахідка Fxx:" prefix), id as tooltip.
function dataChip(ref) {
  const fact = factById(ref);
  return element("span", {
    className: "chip fact",
    text: fact ? fact.label : String(ref),
    attrs: { title: String(ref) },
  });
}

// Evidence chip: colour + icon by source type, brief gist of the essence,
// clickable to the source (PubMed/guideline), full citation on hover.
function evidenceChip(ref) {
  const source = sourceById(ref);
  if (!source) return element("span", { className: "chip", text: String(ref) });
  const map = {
    pmid: ["chip evi", "◆ "],
    guideline: ["chip guideline", "📚 "],
    gap: ["chip gap", "◇ "],
    patient: ["chip fact", ""],
    case: ["chip fact", ""],
    local: ["chip", ""],
  };
  const [cls, icon] = map[source.type] || ["chip", ""];
  // guideline: its name is the essence; pmid/other: a short gist of the citation.
  const gist = source.type === "guideline" ? source.ref : wordClip(source.citation || source.ref, 50);
  const tooltip = source.type === "guideline" ? guidelineCitation(source) : source.citation || "";
  const linkable = source.source_uri && /^https?:/.test(source.source_uri);
  if (linkable) {
    return element("a", {
      className: `${cls} chip-link`,
      text: `${icon}${gist} ↗`,
      attrs: { href: source.source_uri, target: "_blank", rel: "noopener", title: tooltip },
    });
  }
  return element("span", { className: cls, text: `${icon}${gist}`, attrs: { title: tooltip } });
}

// Bold known clinical markers/abbreviations inside a plain string (→ HTML).
function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
}
const MARKER_RE = /\b(TFH|PTCL|CHL|AITL|MGRS|LCDD|MIDD|PGNMID|PD-?1|CD279|CD\d+[a-z]?|BCL6|CXCL13|ICOS|MUM1|PAX5|Ki-?67|TCR|TRBC1|TRB|TRG|MGPT|EBER|EBV|HHV-?8|LANA-?1|ALK|TP63|DUSP22|PET-?CT|LDH|NodeRADS|sIL-2R|IgA|IgG|IgM|C3|C1q|PAS|KDIGO|NCCN|IKMG|RPS)\b/g;
function highlightMarkers(text) {
  return escapeHtml(displayText(text)).replace(MARKER_RE, "<b>$1</b>");
}

const CLINICAL_EMPHASIS_RE = /(Звіт №[^:]{1,80}(?=:)|не підтверджує|свідчить на користь|лімфом[\p{L}\p{M}-]* Ходжкіна|нодальн[\p{L}\p{M}-]+ [^.;]{0,90}лімфом[\p{L}\p{M}-]*|периферичн[\p{L}\p{M}-]+ Т-клітинн[\p{L}\p{M}-]+ лімфом[\p{L}\p{M}-]*|ALK-позитивн[\p{L}\p{M}-]+ ALCL|LCDD\/MIDD|нефротичн[\p{L}\p{M}-]+ протеїнур[\p{L}\p{M}-]*|монотиповість|ультраструктур[\p{L}\p{M}-]* депозит[\p{L}\p{M}-]*|провідн[\p{L}\p{M}-]+ робоч[\p{L}\p{M}-]+ гіпотез[\p{L}\p{M}-]*|з меншою ймовірністю|не автономн[\p{L}\p{M}-]+ діагноз[\p{L}\p{M}-]*|не доведен[\p{L}\p{M}-]*)/giu;

function highlightClinicalSummary(text) {
  return escapeHtml(displayText(text))
    .replace(CLINICAL_EMPHASIS_RE, "<strong>$1</strong>")
    .replace(MARKER_RE, "<b>$1</b>");
}

function summaryGroupKey(sentence) {
  if (/(?:\bотже\b|\bтепер\b|системна задача|найсильніший.{0,30}вузол|джерельний висновок|залишається.{0,40}ймовірн|не доведен)/iu.test(sentence)) return "conclusion";
  if (/(?:звіт|біопс|ІГХ|імуногістохім|дослідж|показує|свідчить|CRP|феритин|депозит|\d{2}\.\d{2}\.\d{4})/iu.test(sentence)) return "evidence";
  return "context";
}

function clinicalSummary(text) {
  const sentences = displayText(text || "")
    .split(/(?<=[.!?])\s+(?=[А-ЯA-ZІЇЄҐ0-9])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (!sentences.length) return emptyState("Клінічне резюме не записано.");

  const groups = { context: [], evidence: [], conclusion: [] };
  sentences.forEach((sentence) => groups[summaryGroupKey(sentence)].push(sentence));
  const labels = {
    context: "Вихідна рамка",
    evidence: "Ключові дані",
    conclusion: "Поточна інтерпретація",
  };
  const wrapper = element("div", { className: "clinical-summary" });
  for (const key of ["context", "evidence", "conclusion"]) {
    if (!groups[key].length) continue;
    const block = element("section", { className: "clinical-summary-block", attrs: { "data-kind": key } });
    block.append(element("p", { className: "clinical-summary-label", text: labels[key] }));
    const copy = element("div", { className: "clinical-summary-copy" });
    groups[key].forEach((sentence) => {
      const paragraph = element("p");
      paragraph.innerHTML = highlightClinicalSummary(sentence);
      copy.append(paragraph);
    });
    block.append(copy);
    wrapper.append(block);
  }
  return wrapper;
}

// Teal "discriminating step" card (clinical panel parity).
function discriminatingCard(text) {
  const card = element("aside", { className: "disc-card" });
  card.append(element("p", { className: "disc-label", text: "◈ Вирішальне дослідження — що уточнює діагноз" }));
  const body = element("p", { className: "disc-body" });
  body.innerHTML = highlightMarkers(text);
  card.append(body);
  return card;
}

// "How to read this consilium" explainer with the evidence legend.
function consiliumLegend() {
  const box = element("section", { className: "content-section legend-box" });
  box.append(element("p", { className: "section-label", text: "Як читати цей консиліум" }));
  const p = element("p", { className: "legend-copy" });
  p.innerHTML =
    'Консиліум <b>не звужується до одного переможця</b>. Він ранжує позиції, позначає ті, що не можна пропустити, і називає єдиний крок, який їх розділяє. Кожна позиція несе <b>раунд заперечень</b> — аргумент прихильника, найсильніше заперечення і тест, що вирішує суперечку. Докази — це <span class="chip evi">◆ простежений PubMed</span>, <span class="chip guideline">📚 настанова</span> або чесна <span class="chip gap">◇ прогалина</span> — ніколи не вигадка.';
  box.append(p);
  return box;
}

// Left-accent tone for a hypothesis card (by rank/status).
function hypothesisTone(status, rank) {
  if (rank === 1 || ["leading", "critical", "must-resolve"].includes(status)) return "lead";
  if (["must-not-miss", "must_not_miss", "safety"].includes(status)) return "critical";
  if (["downgraded", "weak", "possible_lower", "unlikely", "refuted", "refuted-by-course"].includes(status)) return "down";
  if (["excluded", "largely-excluded"].includes(status)) return "muted";
  return "";
}

function emptyState(message) {
  return element("p", { className: "empty-state", text: message });
}

function definitionList(items, className = "metadata") {
  const list = element("dl", { className });
  for (const [label, value] of items) {
    const item = element("div");
    item.append(element("dt", { text: label }), element("dd", { text: textValue(value) }));
    list.append(item);
  }
  return list;
}

function metadataField(label, value, className = "") {
  const field = element("div", { className: `governance-field ${className}`.trim() });
  field.append(element("dt", { text: label }), element("dd", { text: textValue(value) }));
  return field;
}

function deidentificationLabel(value) {
  const labels = {
    working_deidentified: "робоче знеособлення підтверджено",
    declared_deidentified: "знеособлення задекларовано",
    deidentified: "знеособлено",
  };
  return labels[String(value || "").toLowerCase()] || displayText(value || "статус не записано");
}

function governanceSummary(bundle) {
  const wrapper = element("dl", { className: "governance-layout" });
  const core = element("div", { className: "governance-core" }, [
    metadataField("Кейс", bundle.case.id),
    metadataField("Сформовано", bundle.case.generated),
    metadataField("Версія контракту", bundle.schema_version),
  ]);
  const detail = element("div", { className: "governance-detail" });
  detail.append(
    metadataField("Джерело", bundle.case.source, "governance-source"),
    element("div", { className: "governance-deidentification" }, [
      metadataField("Статус деідентифікації", deidentificationLabel(bundle.deidentification.status)),
      metadataField(
        "Вилучені категорії",
        bundle.deidentification.categories_removed.length
          ? bundle.deidentification.categories_removed.join(", ")
          : "Не зафіксовано для попереднього кейсу.",
      ),
    ]),
  );
  wrapper.append(core, detail);
  return wrapper;
}

function sourceById(id) {
  return state.bundle.sources.find((source) => source.id === id);
}

function factById(id) {
  return state.bundle.facts.find((fact) => fact.id === id);
}

function hypothesisById(id) {
  return state.bundle.hypotheses.find((hypothesis) => hypothesis.id === id);
}

function decodedDataRef(ref) {
  const fact = factById(ref);
  return fact ? `Знахідка ${ref}: ${fact.label}` : String(ref);
}

function decodedSourceRef(ref) {
  const source = sourceById(ref);
  return source ? `${source.ref}: ${source.citation}` : String(ref);
}

function hypothesisStatus(value) {
  const labels = {
    leading: "провідна робоча гіпотеза",
    critical: "провідна лінія",
    supported: "підтримано матеріалами",
    open: "потребує перевірки",
    watch: "перевірити",
    safety: "критичний диференціал",
    "must-resolve": "потребує верифікації",
    "must-not-miss": "не пропустити",
    weak: "можливий варіант із меншою ймовірністю",
    downgraded: "можливий варіант із меншою ймовірністю",
    possible_lower: "можливий варіант із меншою ймовірністю",
    unlikely: "малоймовірний варіант",
    attention: "потребує окремої перевірки",
    must_not_miss: "не пропустити",
    refuted: "послаблено",
    "refuted-by-course": "послаблено перебігом",
    "largely-excluded": "значною мірою виключено",
    excluded: "виключено",
  };
  return labels[value] || value || "потребує перевірки";
}

function sourceTypeLabel(source) {
  const labels = {
    case: "джерельний пакет",
    patient: "дані кейсу",
    pmid: "публікація PubMed",
    guideline: "настанова · попередній слід",
    gap: "прогалина доказів",
    local: "локальне джерело",
  };
  return labels[source.type] || source.type;
}

function sourceStatusChips(source) {
  const row = element("div", { className: "chip-row" });
  if (source.type === "pmid") {
    row.append(statusTag("звірена публікація", "evidence"));
  } else if (source.type === "guideline") {
    return null;
  } else if (source.type === "gap") {
    row.append(statusTag("прогалина доказів", "critical"));
  } else {
    row.append(statusTag(sourceTypeLabel(source), ""));
  }
  return row;
}

// Explain what a "guideline trace" is and what each status chip means (for clinicians).
function guidelineExplainer() {
  const box = element("aside", { className: "explainer" });
  box.innerHTML =
    '<b>Як читати покажчик.</b> У записі <b>NCCN Hodgkin v2.2026 (HODG-1A, p.9)</b> зазначено назву й версію настанови, індекс розділу <b>HODG-1A</b> та сторінку PDF <b>9</b>. Це точне місце, яке треба відкрити в оригінальному документі й звірити перед клінічним використанням. Фіолетові чіпи нижче є такими покажчиками; повторюваний статусний чіп прибрано.';
  return box;
}

function guidelineCitation(source) {
  let text = displayText(source.citation || "");
  text = text
    .replace(/^Кандидатний локальний слід настанови\.?\s*/i, "")
    .replace(/;?\s*потрібна перевірка джерела\/?клініцистом\.?$/i, "")
    .trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Теза прив’язана до вказаного розділу та сторінки настанови.";
}

function guidelineList(limit = Infinity) {
  const guidelines = state.bundle.sources.filter((source) => source.type === "guideline").slice(0, limit);
  if (!guidelines.length) return emptyState("У пакеті немає попередніх слідів із настанов для цього кейсу.");
  const list = element("div", { className: "source-list" });
  guidelines.forEach((source) => {
    const item = element("article", { className: "source-item" });
    item.append(
      element("div", { className: "guideline-pointer" }, [evidenceChip(source.id)]),
      element("p", { className: "src-cite", text: guidelineCitation(source) }),
    );
    const linked = (source.supports || []).map((id) => hypothesisById(id)).filter(Boolean);
    if (linked.length) {
      const wrap = element("div", { className: "src-linked" });
      wrap.append(element("span", { className: "src-linked-label", text: "Гіпотези" }));
      linked.forEach((h) => wrap.append(element("span", { className: "chip", text: `#${h.rank} ${wordClip(h.label, 28)}`, attrs: { title: h.label } })));
      item.append(wrap);
    }
    list.append(item);
  });
  return list;
}

function renderOverview() {
  const bundle = state.bundle;
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      bundle.case.title,
      "Одна точка входу до нормалізованих фактів, гіпотез, ланцюжків доказів і методологічних артефактів кейсу.",
    ),
  );

  // dashboard stat tiles — the headline of the case at a glance
  const missingCount = bundle.clinical_state.panel.reduce(
    (total, group) => total + group.items.filter((item) => item.present === false).length,
    0,
  );
  const stats = section("Огляд пакета", "Ключові кількості", "Покриття методологічного представлення, а не клінічна впевненість.");
  stats.append(
    definitionList(
      [
        ["Факти", bundle.facts.length],
        ["Гіпотези", bundle.hypotheses.length],
        ["Зв’язки", bundle.relations.length],
        ["Джерела", bundle.sources.length],
        ["Події", bundle.timeline.length],
        ["Прогалини", missingCount],
      ],
      "metric-list",
    ),
  );
  fragment.append(stats);

  // signal — one clean full-width card + the discriminating step (teal)
  const signal = section("Клінічне резюме", "Провідна діагностична проблема");
  signal.append(clinicalSummary(bundle.case.signal));
  if (bundle.case.discriminating_step) {
    signal.append(discriminatingCard(bundle.case.discriminating_step));
  }
  fragment.append(signal);

  const metadata = section("Походження", "Управління даними");
  metadata.append(governanceSummary(bundle));
  metadata.append(element("p", { className: "boundary-note", text: bundle.case.governance }));
  fragment.append(metadata);

  const guidelineSection = section("Попередні сліди", "Настанови, розпарсені з PDF");
  guidelineSection.append(guidelineExplainer());
  guidelineSection.append(guidelineList(8));
  fragment.append(guidelineSection);
  return fragment;
}

function timelineDomainLabel(value) {
  const labels = {
    hx: "анамнез",
    clinical: "клінічна подія",
    marker: "лабораторія",
    labs: "лабораторія",
    lab: "лабораторія",
    pathology: "патоморфологія",
    path: "патоморфологія",
    imaging: "візуалізація",
    consult: "консультація",
    treatment_history: "попереднє лікування",
    marrow: "кістковий мозок",
  };
  return labels[String(value || "").toLowerCase()] || displayText(value || "подія");
}

function renderTimeline() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Історія хвороби",
      "Хронологічна лінза показує, як змінювався сигнал у документах. Вона не переоцінює подію як причинний висновок.",
    ),
  );
  const events = [...(state.bundle.timeline || [])].sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""), "uk"));
  if (!events.length) {
    const empty = section("Час", "Перебіг у документах");
    empty.append(emptyState("У bundle немає нормалізованих подій."));
    fragment.append(empty);
    return fragment;
  }
  const detail = section("Хронологія", "Документи у часі", "Кожен вузол відповідає одному запису джерельного пакета. Колір показує рівень уваги, а не причинність.");
  const list = element("div", { className: "timeline" });
  events.forEach((event) => {
    const tone = event.flag === "critical" ? "critical" : event.flag === "attention" || event.flag === "watch" ? "candidate" : "neutral";
    const item = element("article", { className: "timeline-item", attrs: { "data-tone": tone } });
    item.append(
      element("time", { className: "timeline-date", text: event.date || "—", attrs: event.date ? { datetime: event.date } : {} }),
      element("div", { className: "timeline-rail", attrs: { "aria-hidden": "true" } }, [element("span", { className: "timeline-node" })]),
      element("div", { className: "timeline-document" }, [
        element("div", { className: "timeline-document-head" }, [
          element("h3", { text: event.label }),
          statusTag(timelineDomainLabel(event.domain), tone === "critical" ? "critical" : tone === "candidate" ? "candidate" : ""),
        ]),
        element("p", { text: event.summary || "Деталі не перенесено з попереднього знімка." }),
      ]),
    );
    list.append(item);
  });
  detail.append(list);
  fragment.append(detail);
  return fragment;
}

function renderConsilium() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Консиліум гіпотез",
      "Ранжування зберігає альтернативи, показує підтверджувальні й послаблювальні дані та робить раунд заперечень видимим.",
    ),
  );
  const question = section("Питання", "Що розводить консиліум");
  question.append(element("p", { className: "view-intro", text: state.bundle.methodology.question || "Питання консиліуму не записано." }));
  if (state.bundle.case.discriminating_step) {
    question.append(discriminatingCard(state.bundle.case.discriminating_step));
  }
  fragment.append(question);
  fragment.append(consiliumLegend());

  const positions = section("Ранжування", "Робочі гіпотези");
  const list = element("div", { className: "hypothesis-list" });
  [...state.bundle.hypotheses]
    .sort((a, b) => a.rank - b.rank)
    .forEach((hypothesis) => {
      const article = element("article", {
        className: "hypothesis",
        attrs: { "data-tone": hypothesisTone(hypothesis.status, hypothesis.rank) },
      });
      const head = element("div", { className: "hypothesis-head" });
      head.append(
        element("span", { className: "rank", text: `#${hypothesis.rank}` }),
        element("div", {}, [
          element("h3", { text: hypothesis.label }),
          element("p", { text: hypothesis.stance || "Позицію не описано." }),
        ]),
        statusTag(hypothesisStatus(hypothesis.status), hypothesis.rank <= 2 ? "evidence" : ""),
      );
      article.append(head);

      if (hypothesis.data_refs.length) {
        const row = element("div", { className: "chip-row", attrs: { "aria-label": "Дані пацієнта" } });
        hypothesis.data_refs.forEach((ref) => row.append(dataChip(ref)));
        article.append(element("p", { className: "chip-label", text: "Дані пацієнта" }), row);
      }
      if (hypothesis.evidence_refs.length) {
        const row = element("div", { className: "chip-row", attrs: { "aria-label": "Докази" } });
        hypothesis.evidence_refs.forEach((ref) => row.append(evidenceChip(ref)));
        article.append(element("p", { className: "chip-label", text: "Докази" }), row);
      }
      if (hypothesis.confirms)
        article.append(
          element("p", { className: "cr confirm" }, [
            element("b", { text: "✓ Підтверджує: " }),
            element("span", { text: hypothesis.confirms }),
          ]),
        );
      if (hypothesis.refutes)
        article.append(
          element("p", { className: "cr refute" }, [
            element("b", { text: "✗ Спростувало б: " }),
            element("span", { text: hypothesis.refutes }),
          ]),
        );

      const challengeEntries = Object.entries(hypothesis.challenge || {}).filter(([, value]) => value);
      if (challengeEntries.length) {
        const details = element("details", { className: "challenge" });
        details.append(element("summary", { text: "Раунд заперечень" }));
        const labels = { proponent: "Позиція", opponent: "Заперечення", resolver: "Що розв’язує" };
        const grid = element("div", { className: "challenge-grid" });
        challengeEntries.forEach(([key, value]) => {
          grid.append(element("div", {}, [element("h4", { text: labels[key] || key }), element("p", { text: value })]));
        });
        details.append(grid);
        article.append(details);
      }
      list.append(article);
    });
  positions.append(list);
  fragment.append(positions);
  return fragment;
}

function renderEvidence() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Докази та джерела",
      "Тут видно, на якому джерелі ґрунтується кожна гіпотеза і яких даних бракує. Для настанов вказано точний розділ і сторінку; перед клінічним використанням тезу звіряють з оригінальним PDF.",
    ),
  );

  const groups = [
    ["Настанови", state.bundle.sources.filter((source) => source.type === "guideline")],
    ["PubMed", state.bundle.sources.filter((source) => source.type === "pmid")],
    ["Дані кейсу", state.bundle.sources.filter((source) => ["case", "patient", "local"].includes(source.type))],
    ["Прогалини", state.bundle.sources.filter((source) => source.type === "gap")],
  ];
  groups.forEach(([title, sources]) => {
    const block = section("Шар доказів", title);
    if (!sources.length) {
      block.append(emptyState(`Джерела категорії «${title}» відсутні.`));
    } else {
      if (title === "Настанови") block.append(guidelineExplainer());
      const list = element("div", { className: "source-list" });
      sources.forEach((source) => {
        const item = element("article", { className: "source-item" });
        let heading;
        if (source.type === "pmid") {
          heading = element("a", { className: "src-link", text: `◆ PMID ${source.ref} ↗`, attrs: { href: source.source_uri, target: "_blank", rel: "noopener" } });
        } else if (source.type === "guideline") {
          heading = evidenceChip(source.id);
        } else if (source.source_uri && source.source_uri.startsWith("http")) {
          heading = element("a", { className: "src-link", text: `${source.ref} ↗`, attrs: { href: source.source_uri, target: "_blank", rel: "noopener" } });
        } else {
          heading = element("span", { className: "src-ref", text: source.ref });
        }
        item.append(element("h4", { className: "src-head" }, [heading]));
        item.append(element("p", { className: "src-cite", text: source.type === "guideline" ? guidelineCitation(source) : source.citation }));
        const status = sourceStatusChips(source);
        if (status) item.append(status);
        const linked = (source.supports || []).map((id) => hypothesisById(id)).filter(Boolean);
        if (linked.length) {
          const wrap = element("div", { className: "src-linked" });
          wrap.append(element("span", { className: "src-linked-label", text: "Гіпотези" }));
          linked.forEach((h) => wrap.append(element("span", { className: "chip", text: `#${h.rank} ${wordClip(h.label, 28)}`, attrs: { title: h.label } })));
          item.append(wrap);
        }
        list.append(item);
      });
      block.append(list);
    }
    fragment.append(block);
  });
  return fragment;
}

function table(headers, rows) {
  const wrapper = element("div", { className: "data-table-wrap" });
  const tableNode = element("table", { className: "data-table" });
  const head = element("thead");
  const headRow = element("tr");
  headers.forEach((header) => headRow.append(element("th", { text: header, attrs: { scope: "col" } })));
  head.append(headRow);
  const body = element("tbody");
  rows.forEach((row) => {
    const tr = element("tr");
    row.forEach((cell) => tr.append(element("td", { text: textValue(cell) })));
    body.append(tr);
  });
  tableNode.append(head, body);
  wrapper.append(tableNode);
  return wrapper;
}

function renderState() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Дослідження та прогалини",
      "Зібрані лабораторні, тканинні й інструментальні дослідження, а також те, чого бракує для розрізнення гіпотез. Значення тут не редагуються.",
    ),
  );
  const clinical = state.bundle.clinical_state;

  const labs = section("Кількісні дані", "Лабораторні показники");
  labs.append(
    clinical.labs.length
      ? table(
          ["Показник", "Значення", "Одиниця", "Референс", "Примітка"],
          clinical.labs.map((lab) => [lab.an || lab.name, lab.v || lab.value, lab.unit, `${textValue(lab.lo)}–${textValue(lab.hi)}`, lab.note]),
        )
      : emptyState("Лабораторний ряд у bundle відсутній."),
  );
  fragment.append(labs);

  const pathology = section("Тканини", "Патоморфологія та ІГХ");
  if (!clinical.pathology.length) pathology.append(emptyState("Тканинні дослідження не записані."));
  else {
    const list = element("div", { className: "state-list" });
    clinical.pathology.forEach((item) => {
      list.append(element("article", { className: "state-item" }, [
        element("h3", { text: item.label || item.kind || item.specimen || "Тканинне дослідження" }),
        element("p", { text: item.finding || item.conclusion || item.verdict || "Деталі не записані." }),
        definitionList([["Дата", item.date], ["Матеріал", item.specimen], ["Висновок", enumLabel(item.verdict || item.conclusion)]]),
      ]));
    });
    pathology.append(list);
  }
  fragment.append(pathology);

  const imaging = section("Візуалізація", "Динаміка уражень");
  if (!clinical.imaging.length) imaging.append(emptyState("Візуалізаційні дослідження не записані."));
  else {
    const list = element("div", { className: "state-list" });
    clinical.imaging.forEach((item) => {
      list.append(element("article", { className: "state-item" }, [
        element("h3", { text: `${item.date || ""} ${item.modality || item.kind || "Візуалізація"}`.trim() }),
        element("p", { text: item.impression || item.finding || item.trend || "Деталі не записані." }),
      ]));
    });
    imaging.append(list);
  }
  fragment.append(imaging);

  const panel = section("Missing-data-first", "Очікувана панель і прогалини");
  if (!clinical.panel.length) panel.append(emptyState("Очікувана панель не визначена."));
  else {
    const list = element("div", { className: "state-list" });
    clinical.panel.forEach((group) => {
      const article = element("article", { className: "state-item" });
      article.append(element("h3", { text: group.group }));
      const rows = group.items.map((item) => [item.t || item.test || item.name, item.present === true ? "виконано" : "не виконано", item.why || item.note, enumLabel(item.disc)]);
      article.append(table(["Дослідження", "Статус", "Навіщо", "Значущість"], rows));
      list.append(article);
    });
    panel.append(list);
  }
  fragment.append(panel);
  return fragment;
}

function renderPacket() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Пакет для консиліуму",
      "Зведення кейсу для перегляду й друку: клінічна картина, ранжований диференціал із доказами-посиланнями та відкриті прогалини. Матеріал для обговорення лікарем, не введення клінічного рішення.",
    ),
  );
  const action = element("button", { className: "action-button", text: "Друкувати або зберегти PDF", attrs: { type: "button" } });
  action.addEventListener("click", () => window.print());
  fragment.append(action);

  const summary = section("Кейс", state.bundle.case.id);
  summary.append(
    definitionList([
      ["Клінічна картина", state.bundle.case.demographics],
      ["Клінічне резюме", state.bundle.case.signal],
      ["Джерело", state.bundle.case.source],
    ]),
  );
  if (state.bundle.case.discriminating_step) {
    summary.append(discriminatingCard(state.bundle.case.discriminating_step));
  }
  fragment.append(summary);

  const hypotheses = section("Диференціал", "Ранжовані гіпотези", "Кожна позиція з доказовими чіпами — клік відкриває джерело (PubMed / настанова).");
  const hlist = element("div", { className: "hypothesis-list" });
  [...state.bundle.hypotheses]
    .sort((a, b) => a.rank - b.rank)
    .forEach((hypothesis) => {
      const art = element("article", { className: "hypothesis", attrs: { "data-tone": hypothesisTone(hypothesis.status, hypothesis.rank) } });
      art.append(
        element("div", { className: "hypothesis-head" }, [
          element("span", { className: "rank", text: `#${hypothesis.rank}` }),
          element("div", {}, [element("h3", { text: hypothesis.label })]),
          statusTag(hypothesisStatus(hypothesis.status), hypothesis.rank <= 2 ? "evidence" : ""),
        ]),
      );
      if (hypothesis.evidence_refs && hypothesis.evidence_refs.length) {
        const row = element("div", { className: "chip-row" });
        hypothesis.evidence_refs.forEach((ref) => row.append(evidenceChip(ref)));
        art.append(element("p", { className: "chip-label", text: "Докази" }), row);
      }
      hlist.append(art);
    });
  hypotheses.append(hlist);
  fragment.append(hypotheses);

  const gaps = state.bundle.clinical_state.panel.flatMap((group) =>
    group.items.filter((item) => item.present === false).map((item) => `${item.t || item.test || item.name}: ${item.why || "не виконано"}`),
  );
  const gapSection = section("Прогалини", "Що не закрито в наявному пакеті");
  gapSection.append(gaps.length ? element("ul", {}, gaps.map((gap) => element("li", { text: gap }))) : emptyState("Структуровані прогалини не записані."));
  fragment.append(gapSection);
  return fragment;
}

function renderBodyMap() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Локалізація ураження й матеріалів",
      "Панель показує лише анатомічні локалізації, прямо зафіксовані у структурованому пакеті. Вона не домальовує координати, поширеність або системне ураження без джерельних даних.",
    ),
  );

  const pathology = Array.isArray(state.bundle.clinical_state?.pathology)
    ? state.bundle.clinical_state.pathology
    : [];
  const specimens = [...new Set(pathology.map((item) => item.specimen).filter(Boolean))];
  const overview = section("Покриття", "Органи та матеріали");
  overview.append(
    specimens.length
      ? table(
          ["Локалізація", "Кількість структурованих записів"],
          specimens.map((specimen) => [specimen, pathology.filter((item) => item.specimen === specimen).length]),
        )
      : emptyState("Структуровані анатомічні локалізації у пакеті не записані."),
  );
  fragment.append(overview);

  const material = section("Джерельні спостереження", "Матеріали та висновки");
  material.append(
    pathology.length
      ? table(
          ["Дата", "Матеріал", "Дослідження", "Знахідка", "Межа висновку"],
          pathology.map((item) => [item.date, item.specimen, item.kind, item.finding, item.conclusion]),
        )
      : emptyState("Патоморфологічний шар для цього кейсу відсутній."),
  );
  fragment.append(material);

  const boundary = section("Межа інтерпретації", "Що ця панель не стверджує");
  boundary.append(
    element("ul", {}, [
      element("li", { text: "Відсутність органа у переліку не означає відсутність ураження." }),
      element("li", { text: "Кількість записів не є мірою тяжкості або поширеності." }),
      element("li", { text: "Графічна карта тіла не будується без структурованих координат і валідованої анатомічної моделі." }),
    ]),
  );
  fragment.append(boundary);
  return fragment;
}

function svgElement(tag, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}

function renderGraph() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Граф доказів і гіпотез",
      "Інтерактивність тут служить методологічному аналізу: клавіатура й pointer однаково відкривають зв’язки. Ребра показують напрям доказу, а не ймовірність.",
    ),
  );
  const graphSection = section("Граф фактів", "Знахідки ↔ гіпотези", state.bundle.methodology.graph_note || "Типізований граф зв’язків.");
  if (!state.bundle.relations.length) {
    graphSection.append(emptyState("Для цього bundle немає типізованих зв’язків графа."));
    fragment.append(graphSection);
    return fragment;
  }

  const layout = element("div", { className: "graph-layout" });
  const stage = element("div", { className: "graph-stage", attrs: { "aria-label": "Інтерактивний граф" } });
  const detail = element("aside", { className: "graph-detail", attrs: { "aria-live": "polite" } });
  const svg = svgElement("svg", { viewBox: `0 0 1000 ${Math.max(520, Math.max(state.bundle.facts.length, state.bundle.hypotheses.length) * 62 + 90)}`, role: "group", "aria-label": "Граф клінічних знахідок і робочих гіпотез" });
  const height = Number(svg.getAttribute("viewBox").split(" ")[3]);
  const factY = new Map();
  const hypothesisY = new Map();
  state.bundle.facts.forEach((fact, index) => factY.set(fact.id, 75 + index * ((height - 130) / Math.max(1, state.bundle.facts.length - 1))));
  state.bundle.hypotheses.forEach((hypothesis, index) => hypothesisY.set(hypothesis.id, 75 + index * ((height - 130) / Math.max(1, state.bundle.hypotheses.length - 1))));

  state.bundle.relations.forEach((relation, index) => {
    const y1 = factY.get(relation.fact_id);
    const y2 = hypothesisY.get(relation.hypothesis_id);
    if (y1 === undefined || y2 === undefined) return;
    const edge = svgElement("path", {
      class: "graph-edge",
      d: `M 310 ${y1} C 480 ${y1}, 520 ${y2}, 690 ${y2}`,
      "data-fact": relation.fact_id,
      "data-hypothesis": relation.hypothesis_id,
      "data-relation": relation.relation,
      id: `edge-${index}`,
    });
    svg.append(edge);
  });

  function setDetail(kind, item) {
    detail.replaceChildren();
    const connections = state.bundle.relations.filter((relation) =>
      kind === "fact" ? relation.fact_id === item.id : relation.hypothesis_id === item.id,
    );
    detail.append(
      element("p", { className: "section-label", text: kind === "fact" ? `Знахідка ${item.id}` : `Гіпотеза #${item.rank}` }),
      element("h3", { text: item.label }),
      element("p", { text: kind === "fact" ? item.detail : item.stance }),
    );
    const relOrder = { support: 0, neutral: 1, refute: 2 };
    const relWord = { support: "за", refute: "проти", neutral: "нейтрально" };
    const list = element("ul", { className: "relation-list" });
    connections
      .slice()
      .sort((a, b) => (relOrder[a.relation] ?? 1) - (relOrder[b.relation] ?? 1))
      .forEach((relation) => {
        const counterpart = kind === "fact" ? hypothesisById(relation.hypothesis_id) : factById(relation.fact_id);
        const li = element("li", { className: "rel-item" });
        li.append(
          element("span", { className: `rel-tag ${relation.relation}`, text: relWord[relation.relation] || relation.relation }),
          element("span", { className: "rel-text", text: counterpart ? counterpart.label : "невідомий вузол" }),
        );
        list.append(li);
      });
    detail.append(list);
    svg.querySelectorAll(".graph-edge").forEach((edge) => {
      edge.classList.toggle("is-active", kind === "fact" ? edge.dataset.fact === item.id : edge.dataset.hypothesis === item.id);
    });
    svg.querySelectorAll(".graph-node").forEach((node) => {
      const connected = connections.some((relation) =>
        node.dataset.kind === "fact" ? relation.fact_id === node.dataset.id : relation.hypothesis_id === node.dataset.id,
      );
      node.classList.toggle("is-dim", node.dataset.id !== item.id && !connected);
    });
  }

  function interactiveGroup(kind, item, x, y, width) {
    const group = svgElement("g", {
      class: "graph-node",
      transform: `translate(${x} ${y})`,
      tabindex: "0",
      role: "button",
      "aria-label": `${kind === "fact" ? "Клінічна знахідка" : "Робоча гіпотеза"} ${kind === "fact" ? item.id : `номер ${item.rank}`}: ${item.label}`,
      "data-kind": kind,
      "data-id": item.id,
    });
    if (kind === "fact") {
      group.append(svgElement("circle", { cx: "0", cy: "0", r: item.linchpin ? "10" : "7" }));
    } else {
      group.setAttribute("data-tone", hypothesisTone(item.status, item.rank));
      group.append(svgElement("rect", { x: "0", y: "-28", width, height: "56", rx: "9" }));
    }
    const code = svgElement("text", { class: "node-code", x: kind === "fact" ? "-18" : "14", y: kind === "fact" ? "5" : "-12", "text-anchor": kind === "fact" ? "end" : "start" });
    code.textContent = kind === "fact" ? `Знахідка ${item.id}` : `#${item.rank}`;
    group.append(code);
    // wrapped label (2 lines, whole words) — no mid-word clipping
    const labelLines = wrapLines(item.label, kind === "fact" ? 30 : 32, 2);
    const anchor = kind === "fact" ? "end" : "start";
    const lx = kind === "fact" ? "-18" : "14";
    const topY = kind === "fact" ? (labelLines.length === 2 ? -26 : -12) : labelLines.length === 2 ? 2 : 6;
    const lineH = kind === "fact" ? 14 : 15;
    labelLines.forEach((ln, li) => {
      const t = svgElement("text", { x: lx, y: String(topY + li * lineH), "text-anchor": anchor, class: "node-label" });
      t.textContent = ln;
      group.append(t);
    });
    const activate = () => setDetail(kind, item);
    group.addEventListener("click", activate);
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
    return group;
  }

  state.bundle.facts.forEach((fact) => svg.append(interactiveGroup("fact", fact, 310, factY.get(fact.id), 0)));
  state.bundle.hypotheses.forEach((hypothesis) => svg.append(interactiveGroup("hypothesis", hypothesis, 690, hypothesisY.get(hypothesis.id), 270)));
  stage.append(svg);
  layout.append(stage, detail);
  graphSection.append(layout);
  fragment.append(graphSection);
  setDetail("hypothesis", [...state.bundle.hypotheses].sort((a, b) => a.rank - b.rank)[0]);
  return fragment;
}

function modalityExplainer() {
  const box = element("aside", { className: "explainer" });
  box.innerHTML =
    "<b>Що це.</b> Кожен тип дослідження (клініка, світлова мікроскопія, ІГХ, лабораторія…) показано окремо: який у нього <b>сигнал</b> (наявний / частковий / розбіжність з іншими методами) і чого в ньому <b>бракує</b>. " +
    "Мета — побачити, де методи <b>сходяться</b>, а де <b>суперечать</b>, і які прогалини це закрили б. Це не окремий клінічний висновок.";
  return box;
}

function renderMultimodal() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Зіставлення даних",
      "Порівняння клініки, лабораторії, патології та візуалізації: де вони підтверджують одна одну, де суперечать і якого шару даних бракує. Це аудит узгодженості, а не окремий діагноз.",
    ),
  );
  const multimodal = state.bundle.methodology.multimodal || {};
  const overview = section("Навіщо", "Що показує зіставлення");
  overview.append(multimodal.summary ? element("p", { className: "view-intro", text: multimodal.summary }) : emptyState("Для цього кейсу зіставлення типів даних не описано."));
  overview.append(modalityExplainer());
  fragment.append(overview);

  const modalities = section("Покриття", "Що дає кожен тип даних");
  if (!Array.isArray(multimodal.modalities) || !multimodal.modalities.length) modalities.append(emptyState("Структурований список типів даних відсутній."));
  else {
    const list = element("div", { className: "state-list" });
    multimodal.modalities.forEach((item) => {
      const art = element("article", { className: "method-item" });
      art.append(element("h3", { text: item.label || item.name || "Модальність" }));
      art.append(element("p", { text: item.signal || item.summary || "" }));
      const sig = element("div", { className: "chip-row" });
      sig.append(element("span", { className: "chip-label", text: "Сигнал" }), statusTag(enumLabel(item.status), enumTone(item.status)));
      art.append(sig);
      if ((item.gaps || []).length) {
        const g = element("div", { className: "chip-row" });
        g.append(element("span", { className: "chip-label", text: "Бракує" }));
        item.gaps.forEach((gap) => g.append(chip(gap)));
        art.append(g);
      }
      list.append(art);
    });
    modalities.append(list);
  }
  fragment.append(modalities);

  for (const [key, title] of [["fusion", "Перетин сигналів"], ["explainability", "Пояснення й прогалини"]]) {
    const block = section("Аудиторська лінза", title);
    const items = multimodal[key];
    if (!Array.isArray(items) || !items.length) block.append(emptyState("Окремі твердження не записані."));
    else block.append(element("div", { className: "state-list" }, items.map((item) => element("article", { className: "method-item" }, [element("h3", { text: item.label || item.title || title }), element("p", { text: item.claim || item.summary || item.text || textValue(item) })]))));
    fragment.append(block);
  }
  return fragment;
}

async function loadLatestRun() {
  const config = CASES[state.caseKey];
  if (!config.latest) return null;
  try {
    const pointerResponse = await fetch(config.latest, { cache: "no-store" });
    if (!pointerResponse.ok) return null;
    const pointer = await pointerResponse.json();
    const base = config.latest.slice(0, config.latest.lastIndexOf("/") + 1);
    const runResponse = await fetch(`${base}${pointer.path}`, { cache: "no-store" });
    if (!runResponse.ok) return null;
    return { pointer, run: await runResponse.json() };
  } catch {
    return null;
  }
}

function protocolRounds(run) {
  const list = element("div", { className: "protocol-list" });
  const stageNames = ["intake", "positions", "challenge", "evidence", "safety", "synthesis"];
  (run.rounds || []).forEach((round, roundIndex) => {
    const entries = round.entries || [];
    const stage = stageNames[Math.min(Number(round.round) || roundIndex, stageNames.length - 1)];
    const isSynthesis = stage === "synthesis";
    const article = element("article", {
      className: "protocol-round",
      attrs: { "data-stage": stage },
    });
    const head = element("header", { className: "protocol-round-head" });
    head.append(
      element("span", { className: "round-index", text: String(Number(round.round) + 1).padStart(2, "0") }),
      element("div", { className: "round-title" }, [
        element("p", { className: "round-kicker", text: `Етап ${Number(round.round) + 1} із ${run.rounds.length}` }),
        element("h3", { text: round.title }),
      ]),
      element("span", { className: "round-count", text: isSynthesis ? "Фінальний синтез" : `${entries.length} ${entries.length === 1 ? "позиція" : entries.length < 5 ? "позиції" : "позицій"}` }),
    );
    article.append(head);
    if (round.takeaway) article.append(element("p", { className: "round-takeaway", text: round.takeaway }));

    const entryList = element("div", { className: "protocol-entry-list" });
    entries.forEach((entry) => {
      const detail = element("details", {
        className: `protocol-entry${isSynthesis ? " protocol-entry-final" : ""}`,
        attrs: entries.length === 1 ? { open: "" } : {},
      });
      const summary = element("summary", { className: "protocol-entry-head" });
      const summaryCopy = element("span", { className: "protocol-summary-wrap" });
      if (isSynthesis) summaryCopy.append(element("span", { className: "protocol-final-label", text: "Фінальний висновок" }));
      summaryCopy.append(element("span", { className: "protocol-summary", text: entry.summary || "Позиція без короткого резюме." }));
      summary.append(
        element("span", { className: "protocol-role", text: entry.role || "Учасник" }),
        summaryCopy,
        element("span", { className: "entry-toggle", attrs: { "aria-hidden": "true" }, text: "+" }),
      );
      detail.append(summary);

      const analysis = element("dl", { className: "protocol-analysis" });
      for (const [key, label] of [["seen", "Що враховано"], ["reasoning", "Як витлумачено"], ["challenge", "Ключове заперечення"], ["impact", "Що змінилося"]]) {
        if (!entry[key]) continue;
        const item = element("div", { className: "protocol-analysis-item", attrs: { "data-kind": key } });
        item.append(element("dt", { text: label }), element("dd", { text: entry[key] }));
        analysis.append(item);
      }
      detail.append(analysis);

      if (Array.isArray(entry.evidence_refs) && entry.evidence_refs.length) {
        const refs = element("div", { className: "protocol-refs" });
        refs.append(element("span", { className: "protocol-refs-label", text: "Опорні дані" }));
        entry.evidence_refs.forEach((ref) => {
          if (factById(ref)) refs.append(dataChip(ref));
          else if (sourceById(ref)) refs.append(evidenceChip(ref));
          else {
            const hypothesis = hypothesisById(ref);
            refs.append(element("span", {
              className: "chip",
              text: hypothesis ? hypothesis.label : displayText(ref),
              attrs: { title: String(ref) },
            }));
          }
        });
        detail.append(refs);
      }
      entryList.append(detail);
    });
    article.append(entryList);
    list.append(article);
  });
  return list;
}

async function renderProtocol() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Протокол агентних дебатів",
      "Раунд за раундом: які позиції сформували агенти-спеціалісти, які заперечення висунули та як модератор зібрав фінальний синтез.",
      "Агентні дебати",
    ),
  );
  state.latestRun = await loadLatestRun();
  const audit = section("Відтворюваність", "Дані для перевірки запуску", "Ідентифікатори й хеші дозволяють підтвердити, що протокол побудовано з незмінних вхідних даних.");
  if (!state.latestRun) {
    audit.append(emptyState("Незмінний запуск ще не створено для цього кейсу. Доступний лише статичний методологічний знімок із пакета."));
  } else {
    const { pointer, run } = state.latestRun;
    audit.append(
      definitionList([
        ["Ідентифікатор запуску", pointer.run_id],
        ["Режим", run.mode === "operator_offline" ? "операторський офлайн" : run.mode],
        ["Створено", run.created_at],
        ["Хеш пакета кейсу", run.input_hashes.case_bundle_sha256.slice(0, 16)],
        ["Хеш початкових даних дебатів", run.input_hashes.debate_seed_sha256.slice(0, 16)],
        ["Хеш набору ролей", run.input_hashes.role_bundle_sha256.slice(0, 16)],
        ["Статус", "перевірено · незмінний"],
      ]),
    );
    const rounds = section(`${run.rounds?.length || 0} етапів`, "Як змінювався висновок", "Спочатку перегляньте підсумки етапів. Натисніть на позицію учасника, щоб відкрити аргументи та опорні дані.");
    rounds.append(run.rounds?.length ? protocolRounds(run) : emptyState("Раунди не записані."));
    fragment.append(rounds);

    const safety = section("Безпека", "Обмеження запуску");
    safety.append(element("ul", {}, (run.safety?.flags || []).map((flag) => element("li", { text: flag }))));
    fragment.append(safety);
    fragment.append(audit);
    return fragment;
  }
  fragment.append(audit);

  const legacyDebate = state.bundle.methodology.debate || {};
  const snapshot = section("Попередній знімок", "Статичний протокол у пакеті кейсу");
  if (Array.isArray(legacyDebate.rounds)) {
    snapshot.append(element("ol", {}, legacyDebate.rounds.map((round) => element("li", { text: typeof round === "string" ? round : textValue(round) }))));
  } else snapshot.append(emptyState("Статичний протокол відсутній."));
  fragment.append(snapshot);
  return fragment;
}

const RENDERERS = {
  overview: renderOverview,
  timeline: renderTimeline,
  consilium: renderConsilium,
  evidence: renderEvidence,
  state: renderState,
  packet: renderPacket,
  graph: renderGraph,
  bodymap: renderBodyMap,
  multimodal: renderMultimodal,
  protocol: renderProtocol,
};

function buildNavigation(target, views) {
  views.forEach(([id, label]) => {
    const button = element("button", {
      className: "route-button",
      text: label,
      attrs: { type: "button", "data-view": id },
    });
    button.addEventListener("click", () => setView(id, true));
    target.append(button);
  });
}

function syncNavigation() {
  document.querySelectorAll(".route-button").forEach((button) => {
    if (button.dataset.view === state.view) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function updateUrl(push = false) {
  const url = new URL(window.location.href);
  url.searchParams.set("case", state.caseKey);
  url.searchParams.set("view", state.view);
  history[push ? "pushState" : "replaceState"]({}, "", url);
}

async function renderCurrent({ focus = false } = {}) {
  syncNavigation();
  content.replaceChildren(element("p", { className: "empty-state", text: "Підготовка поверхні…" }));
  try {
    const renderer = RENDERERS[state.view] || renderOverview;
    const view = await renderer();
    content.replaceChildren(view);
    document.title = `${state.bundle.case.id} · ${VIEW_LABELS[state.view]} · MedAI`;
    if (focus) content.focus({ preventScroll: true });
  } catch (error) {
    content.replaceChildren(
      element("section", { className: "error-panel" }, [
        element("h2", { text: "Поверхню не вдалося побудувати" }),
        element("p", { text: error instanceof Error ? error.message : String(error) }),
      ]),
    );
  }
}

async function loadCase(caseKey, { push = false, focus = false } = {}) {
  state.caseKey = CASES[caseKey] ? caseKey : "case02";
  caseSelect.value = state.caseKey;
  statusLine.dataset.state = "loading";
  statusLine.textContent = "Завантаження й перевірка пакета кейсу…";
  try {
    const response = await fetch(CASES[state.caseKey].bundle, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}: bundle недоступний`);
    const bundle = await response.json();
    if (bundle.schema_version !== "1.0.0") throw new Error(`Непідтримувана версія контракту: ${bundle.schema_version}`);
    state.bundle = bundle;
    state.latestRun = null;
    statusLine.dataset.state = "ready";
    statusLine.textContent = `${bundle.case.id} · пакет ${bundle.bundle_id} · ${bundle.facts.length} фактів · ${bundle.sources.length} джерел · контракт ${bundle.schema_version}`;
    const provenanceHash = bundle.provenance.legacy_sha256 || bundle.provenance.source_sha256;
    footerContract.textContent = provenanceHash
      ? `пакет ${bundle.bundle_id} · джерело ${provenanceHash.slice(0, 12)}`
      : `пакет ${bundle.bundle_id}`;
    updateUrl(push);
    await renderCurrent({ focus });
  } catch (error) {
    statusLine.dataset.state = "error";
    statusLine.textContent = `Bundle не завантажено: ${error instanceof Error ? error.message : String(error)}`;
    content.replaceChildren(element("section", { className: "error-panel" }, [element("h2", { text: "Пакет кейсу недоступний" }), element("p", { text: "Запустіть локальний HTTP-сервер із кореня workbench і перевірте контракт." })]));
  }
}

function setView(view, push = false) {
  state.view = VIEW_LABELS[view] ? view : "overview";
  updateUrl(push);
  renderCurrent({ focus: true });
}

Object.entries(CASES).forEach(([key, config]) => {
  caseSelect.append(element("option", { text: config.label, attrs: { value: key } }));
});
buildNavigation(document.getElementById("primary-nav"), PRIMARY_VIEWS);
buildNavigation(document.getElementById("method-nav"), METHOD_VIEWS);

caseSelect.addEventListener("change", () => loadCase(caseSelect.value, { push: true, focus: true }));
window.addEventListener("popstate", () => {
  const params = new URLSearchParams(window.location.search);
  state.view = VIEW_LABELS[params.get("view")] ? params.get("view") : "overview";
  loadCase(params.get("case") || "case02", { push: false, focus: true });
});

const initial = new URLSearchParams(window.location.search);
state.view = VIEW_LABELS[initial.get("view")] ? initial.get("view") : "overview";
loadCase(initial.get("case") || "case02");

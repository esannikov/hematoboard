// The case registry is data, not code: methodology/active_cases.json is the
// validated routing manifest. Adding a case never requires editing this file.
const CASE_MANIFEST_URL = "active_cases.json";
let CASES = {};

async function loadCaseManifest() {
  let response;
  try {
    response = await fetch(CASE_MANIFEST_URL, { cache: "no-store" });
  } catch {
    throw new ManifestError("network", "Маніфест кейсів недоступний: немає відповіді від сервера.");
  }
  if (!response.ok) throw new ManifestError("http", `Маніфест кейсів недоступний (HTTP ${response.status}).`);
  let manifest;
  try {
    manifest = await response.json();
  } catch {
    throw new ManifestError("malformed", "Маніфест кейсів пошкоджений: це не валідний JSON.");
  }
  if (!manifest || !Array.isArray(manifest.cases) || !manifest.cases.length) {
    throw new ManifestError("malformed", "Маніфест кейсів не містить жодного кейсу.");
  }
  const active = manifest.cases.filter((entry) => entry && entry.status === "active");
  if (!active.length) throw new ManifestError("malformed", "У маніфесті немає жодного активного кейсу.");
  CASES = Object.fromEntries(
    active.map((entry) => [
      entry.key,
      { label: entry.label, bundle: entry.bundle, latest: entry.latest ?? null, replay: entry.replay ?? null, default: entry.default === true },
    ]),
  );
}

function defaultCaseKey() {
  return Object.keys(CASES).find((key) => CASES[key].default) || Object.keys(CASES)[0];
}

class ManifestError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

const PRIMARY_VIEWS = [
  ["overview", "Огляд"],
  ["timeline", "Історія"],
  ["state", "Дослідження"],
  ["graph", "Граф гіпотез"],
  ["provenance", "Структура висновку"],
  ["consilium", "Консиліум"],
  ["evidence", "Джерела"],
];

const OPTIONAL_PRIMARY_VIEWS = [
  ["multimodal", "Узгодженість"],
  ["replay", "Докази в часі"],
  ["protocol", "Протокол AI дебатів"],
];

const VIEW_LABELS = Object.fromEntries([...PRIMARY_VIEWS, ...OPTIONAL_PRIMARY_VIEWS, ["packet", "Бриф для консиліуму"], ["bodymap", "Локалізація"]]);
const state = { caseKey: "case02", view: "overview", bundle: null, latestRun: null, replay: null };

const DISPLAY_REPLACEMENTS = [
  [/знеособлену ручну розшифровку/gi, "знеособлену агентну розшифровку"],
  [/ручну розшифровку/gi, "агентну розшифровку"],
  [/working_deidentified/gi, "робоче знеособлення підтверджено"],
  [/важливий понижений диференціал/gi, "можливий варіант, але з меншою ймовірністю"],
  [/пониженим диференціалом для порівняння/gi, "можливим варіантом із меншою ймовірністю"],
  [/понижений диференціал для порівняння/gi, "можливий варіант із меншою ймовірністю"],
  [/понижений диференціал/gi, "можливий варіант із меншою ймовірністю"],
  [/понижена, але видима/gi, "можлива, але менш імовірна"],
  [/\bclinician\/source QA\b/gi, "перевірку лікарем і джерела"],
  [/\bcandidate\/decision support\b/gi, "попередню оцінку / підтримку рішень"],
  [/\bcandidate local provenance\b/gi, "локальний попередній слід джерела"],
  [/\bguideline[- ]candidate traces?\b/gi, "попередні сліди настанов"],
  [/\bcandidate traces?\b/gi, "попередні сліди"],
  [/\bsource QA\b/gi, "перевірку джерела"],
  [/\btissue QA\b/gi, "морфологічну верифікацію"],
  [/\bcentral QA\b/gi, "центральну морфологічну верифікацію"],
  [/\bred team\b/gi, "рецензент з безпеки"],
  [/\bworkup\b/gi, "діагностичний алгоритм"],
  [/\bcomparator\b/gi, "диференціал для порівняння"],
  [/\bovercall\b/gi, "переоцінка впевненості"],
  [/\bconfidence\b/gi, "рівень впевненості"],
  [/\bproof of subtype\b/gi, "доказ підтипу"],
  [/\bTFH-oriented IHC\b/gi, "ІГХ, орієнтована на TFH"],
  [/\btissue signal\b/gi, "тканинний сигнал"],
  [/\btherapy language\b/gi, "мови лікувальних рекомендацій"],
  [/\bno treatment\b/gi, "без лікувальних рекомендацій"],
  [/\bside-by-side\b/gi, "порівняльному"],
  [/\breactive-only\b/gi, "суто реактивному"],
  [/\bcompetitors\b/gi, "конкурентні гіпотези"],
  [/\bimaging\b/gi, "візуалізація"],
  [/\bstaging\b/gi, "стадіювання"],
  [/\bdashboard\b/gi, "панель"],
  [/\braw NCCN PDF\b/gi, "оригінальний PDF NCCN"],
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
const primaryNav = document.getElementById("primary-nav");
const packetNavAction = document.getElementById("packet-nav-action");

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

// Single label registry: internal enum values → clinical Ukrainian labels
// (never show raw enums to a clinician). Namespaces stay separate on purpose:
// the same token can mean different things in different contexts
// (e.g. "critical" as a fact flag vs as a hypothesis status).
const LABELS = {
  enum: {
    declared_deidentified: "задекларовано",
    declared_deidentified_canonical_text_only: "знеособлено в доступному тексті",
    source_verified_candidate_clinical_review: "джерело звірено · клінічна перевірка відкрита",
    candidate_unverified: "кандидатний покажчик · не перевірено",
    context_only: "лише контекст",
    present: "наявна", audited: "перевірено", discordant: "розбіжність між методами",
    high_signal_partial: "сильний сигнал (частково)", partial: "частковий сигнал",
    missing: "відсутня", not_used_clean: "не застосовувалась",
    decisive: "вирішальна", high: "висока", moderate: "помірна", parallel: "паралельна", urgent: "термінова",
    candidate: "кандидатний висновок", critical: "критичний", gap: "прогалина",
    neoplasm: "неопластичний", "non-diagnostic": "недіагностично", partial_refute: "частково спростовує",
    reactive: "реактивний", refute: "спростовує", suspicious: "підозрілий", support: "підтримує", neutral: "нейтрально",
  },
  enumTone: {
    present: "evidence", audited: "evidence", discordant: "critical", high_signal_partial: "candidate",
    partial: "candidate", decisive: "critical", high: "candidate", urgent: "critical",
    candidate: "candidate", critical: "critical", neoplasm: "critical", partial_refute: "candidate",
    refute: "candidate", suspicious: "candidate",
  },
  hypothesisStatus: {
    leading: "провідна робоча гіпотеза",
    "leading-provisional": "провідна попередня гіпотеза",
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
    "less-likely-not-excluded": "менш імовірний, не виключений",
    "possible-reactive-background": "можливий самостійний процес або реактивний фон",
    "parallel-check": "окрема паралельна перевірка",
    "low-probability": "низька ймовірність",
    "low-probability-not-excluded": "низька ймовірність, не виключено",
    "largely-excluded": "значною мірою виключено",
    excluded: "виключено",
  },
  sourceType: {
    case: "джерельний пакет",
    patient: "дані кейсу",
    pmid: "публікація PubMed",
    guideline: "настанова · попередній слід",
    gap: "прогалина доказів",
    local: "локальне джерело",
  },
  verification: {
    local_recorded: ["локальний запис", ""],
    metadata_verified: ["метадані звірено", "evidence"],
    content_verified: ["зміст звірено", "evidence"],
    page_verified: ["сторінку звірено", "evidence"],
    context_only: ["лише контекст", "candidate"],
    candidate: ["кандидат на перевірку", "candidate"],
    gap: ["прогалина доказів", "critical"],
  },
};
function enumLabel(value) {
  if (value === true) return "виконано";
  if (value === false) return "не виконано";
  if (value === null || value === undefined || value === "") return "—";
  const k = String(value);
  return LABELS.enum[k] || LABELS.enum[k.toLowerCase()] || displayText(k);
}
function enumTone(value) {
  return LABELS.enumTone[String(value).toLowerCase()] || "";
}
function verificationLabel(level) {
  return LABELS.verification[level] || [level || "—", ""];
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

function viewHeader(title, intro, contextLabel = state.bundle?.case?.id || "Кейс") {
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
  if (rank === 1 || ["leading", "leading-provisional", "critical", "must-resolve"].includes(status)) return "lead";
  if (["must-not-miss", "must_not_miss", "safety"].includes(status)) return "critical";
  if (["downgraded", "weak", "possible_lower", "unlikely", "refuted", "refuted-by-course", "less-likely-not-excluded", "low-probability", "low-probability-not-excluded"].includes(status)) return "down";
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
    declared_deidentified_canonical_text_only: "доступний канонічний текст знеособлено",
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

function claimById(id) {
  return (state.bundle.claims || []).find((claim) => claim.id === id);
}

function claimLayer(claim) {
  const layers = {
    case_fact: ["Дані з кейсу", "evidence"],
    external_evidence: ["Висновок із настанови або статті", "evidence"],
    source_interpretation: ["Висновок із настанови або статті", "candidate"],
    case_interpretation: ["Пояснення для цього кейсу", "candidate"],
    gap: ["Прогалина", "critical"],
  };
  return layers[claim?.kind] || ["Твердження", ""];
}

function factById(id) {
  return state.bundle.facts.find((fact) => fact.id === id);
}

function hypothesisById(id) {
  return state.bundle.hypotheses.find((hypothesis) => hypothesis.id === id);
}

function hypothesesSupportedBy(source) {
  const explicit = (source.supports || [])
    .map((id) => claimById(id))
    .filter(Boolean)
    .flatMap((claim) => claim.hypothesis_refs || [])
    .map((id) => hypothesisById(id))
    .filter(Boolean);
  if (explicit.length) return explicit;
  return state.bundle.hypotheses.filter((hypothesis) => (hypothesis.evidence_refs || []).includes(source.id));
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
  return LABELS.hypothesisStatus[value] || value || "потребує перевірки";
}

function sourceTypeLabel(source) {
  return LABELS.sourceType[source.type] || source.type;
}

function sourceStatusChips(source) {
  const row = element("div", { className: "chip-row" });
  const claim = (source.supports || []).map((id) => claimById(id)).find(Boolean);
  const level = claim?.verification?.level;
  if (level && LABELS.verification[level]) {
    const [label, tone] = verificationLabel(level);
    row.append(statusTag(label, tone));
    return row;
  }
  if (source.type === "pmid") {
    row.append(statusTag("публікація", "evidence"));
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
  const exactPointer = displayText(source.ref || "").trim();
  if (source.human_verified === true && /(?:\bp\.|\bPDF\b|\bCh\.|Practice Point)/i.test(exactPointer)) {
    return exactPointer;
  }
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
    const linked = hypothesesSupportedBy(source);
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

function recommendationPlanForCase(bundle) {
  // Canonical source: the validated case bundle. The renderer never authors
  // case-specific clinical content — it only maps contract fields to view props.
  const canonical = bundle.methodology?.workup;
  if (Array.isArray(canonical) && canonical.length) {
    return canonical.map((item) => ({
      title: item.title,
      action: item.action,
      why: item.why,
      refs: item.evidence_refs || [],
      status: item.status,
      tone: item.tone,
      phase: item.phase,
    }));
  }
  const missing = (bundle.clinical_state?.panel || []).flatMap((group) =>
    (group.items || []).filter((item) => item.present === false).map((item) => ({ ...item, group: group.group })),
  );
  return missing.map((item) => ({
    title: item.t || item.test || item.name || item.group || "Незаповнена перевірка",
    action: item.action || item.why || item.group || "Точний спосіб виконання не записано.",
    why: item.interpretive_limit || item.note || "Результат має бути зіставлений із провідною та альтернативними гіпотезами.",
    refs: item.evidence_refs || item.source_refs || [],
    status: item.disc === "critical" || item.disc === "decisive" ? "Обов’язкова перевірка" : enumLabel(item.disc || "Не виконано"),
    tone: item.disc === "critical" || item.disc === "decisive" ? "danger" : "caution",
    phase: item.phase || (item.disc === "critical" || item.disc === "decisive" ? "Для верифікації діагнозу" : "Додаткові дані"),
  }));
}

function overviewClinicalBrief(bundle) {
  return bundle.case.overview_brief || bundle.case.demographics || "Клінічний профіль не записано у пакеті.";
}

function overviewCaseCode(bundle) {
  const raw = String(bundle.case.id || "КЕЙС");
  const number = raw.match(/\d+/)?.[0];
  return number ? `CASE${number.padStart(3, "0")}` : raw.replace(/[^A-Za-z0-9]/g, "");
}

function renderOverview() {
  const bundle = state.bundle;
  const hypotheses = [...bundle.hypotheses].sort((a, b) => a.rank - b.rank);
  const lead = hypotheses[0];
  const missing = (bundle.clinical_state?.panel || []).flatMap((group) =>
    (group.items || []).filter((item) => item.present === false).map((item) => ({ ...item, group: group.group })),
  );
  const timeline = [...(bundle.timeline || [])];
  const firstDate = timeline[0]?.date || "—";
  const lastDate = timeline.at(-1)?.date || bundle.case.generated || "—";
  const rankTone = (hypothesis) => {
    if (hypothesis.rank === 1) return "danger";
    if (hypothesis.status === "must-not-miss" || hypothesis.status === "must_not_miss") return "miss";
    return "caution";
  };
  const rankLabel = (hypothesis) => {
    if (hypothesis.rank === 1) return "Найбільш імовірна";
    if (hypothesis.status === "must-not-miss" || hypothesis.status === "must_not_miss") return "Не пропустити";
    return hypothesis.rank === 2 ? "Також можлива" : "Робоча гіпотеза";
  };
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      overviewCaseCode(bundle),
      overviewClinicalBrief(bundle),
      "Огляд клінічної картини",
    ),
  );

  const provenance = element("section", { className: "overview-provenance overview-provenance-top" });
  const provenanceHead = element("div");
  provenanceHead.append(element("p", { className: "overview-eyebrow", text: "Походження та межа" }), element("h3", { text: "Пакет даних" }));
  const provenanceList = element("dl");
  [
    ["Первинні матеріали", wordClip(bundle.case.source || `${bundle.sources.length} джерел`, 72)],
    ["Період", `${firstDate} — ${lastDate}`],
    ["Знеособлення", enumLabel(bundle.deidentification?.status || "—")],
    ["Контракт", bundle.schema_version || "—"],
  ].forEach(([label, value]) => {
    const row = element("div");
    row.append(element("dt", { text: label }), element("dd", { text: value }));
    provenanceList.append(row);
  });
  provenance.append(provenanceHead, provenanceList, element("p", { text: bundle.case.governance }));
  fragment.append(provenance);

  const deck = element("section", { className: "overview-command-deck" });
  const commandMain = element("div", { className: "overview-command-main" });
  const assessment = element("div", { className: "overview-primary-assessment" });
  const assessmentHead = element("div", { className: "overview-section-head" });
  const assessmentTitle = element("div");
  assessmentTitle.append(
    element("h3", { className: "overview-primary-title", text: lead?.label || "Робоча гіпотеза не сформована" }),
  );
  assessmentHead.append(element("span", { className: "overview-rank-chip danger", text: "Найбільш імовірна" }), assessmentTitle);
  const assessmentCopy = element("div");
  assessmentCopy.append(element("p", { className: "overview-primary-copy", text: lead?.stance || bundle.case.signal }));
  const signals = element("div", { className: "overview-signal-row", attrs: { "aria-label": "Опорні сигнали" } });
  const leadRefs = lead?.data_refs?.length ? lead.data_refs : bundle.facts.slice(-4).map((fact) => fact.id);
  leadRefs.slice(0, 4).forEach((ref) => signals.append(element("span", { text: factById(ref)?.label || ref })));
  assessmentCopy.append(signals);
  assessment.append(assessmentHead, assessmentCopy);
  const secondary = element("div", { className: "overview-secondary-field" });
  hypotheses.slice(1, 3).forEach((hypothesis) => {
    const item = element("div");
    const copy = element("div");
    copy.append(element("p", { text: rankLabel(hypothesis) }), element("strong", { text: hypothesis.label }));
    item.append(element("span", { className: `overview-rank-number ${rankTone(hypothesis)}`, text: String(hypothesis.rank).padStart(2, "0") }), copy);
    secondary.append(item);
  });
  assessment.append(secondary);
  assessment.append(element("a", { className: "overview-text-link focus-ring", text: `Усі ${hypotheses.length} позицій у консиліумі →`, attrs: { href: `?case=${state.caseKey}&view=consilium` } }));

  const decision = element("aside", { className: "overview-decision-gate" });
  decision.append(
    element("p", { className: "overview-eyebrow text-clinical-700", text: "Рішення, що розрізняє" }),
    element("p", { text: bundle.case.discriminating_step || "Розрізняльний крок не записано." }),
  );
  decision.append(element("a", { className: "overview-text-link focus-ring", text: "Перевірки й потрібні матеріали →", attrs: { href: `?case=${state.caseKey}&view=state` } }));
  commandMain.append(assessment, decision);
  deck.append(commandMain);

  const evidenceShift = element("div", { className: "overview-evidence-shift" });
  const shiftLabel = element("div", { className: "overview-evidence-label" });
  shiftLabel.append(element("p", { className: "overview-eyebrow", text: "Що змінило рамку" }), element("h3", { text: "Три ключові проходи" }));
  const steps = element("ol", { className: "overview-shift-steps" });
  timeline.slice(-3).forEach((event, index, items) => {
    const li = element("li", { attrs: index === items.length - 1 ? { class: "current" } : {} });
    li.append(element("time", { text: event.date || "—" }), element("strong", { text: event.label }), element("p", { text: event.summary }));
    steps.append(li);
  });
  evidenceShift.append(shiftLabel, steps);
  deck.append(evidenceShift);
  fragment.append(deck);

  const workspace = element("div", { className: "overview-workspace" });
  const workspaceMain = element("div", { className: "overview-workspace-main" });
  const balance = element("section", { className: "overview-panel" });
  const balanceHead = element("div", { className: "overview-panel-head" });
  const balanceTitle = element("div");
  balanceTitle.append(element("p", { className: "overview-eyebrow text-danger-700", text: "Межа висновку" }), element("h3", { text: "Що не дозволяє вважати напрям підтвердженим" }));
  balanceHead.append(balanceTitle);
  if (bundle.relations.length) balanceHead.append(element("a", { className: "overview-text-link focus-ring", text: "Дивитися граф →", attrs: { href: `?case=${state.caseKey}&view=graph` } }));
  const limits = element("div", { className: "overview-limit-list" });
  const limitList = element("ul");
  [lead?.refutes].filter(Boolean).forEach((item) => limitList.append(element("li", { text: item })));
  limits.append(limitList);
  balance.append(balanceHead, limits);
  workspaceMain.append(balance);

  const controls = element("aside", { className: "overview-control-column" });
  const readiness = element("section", { className: "overview-readiness" });
  readiness.append(
    element("p", { className: "overview-eyebrow", text: "Стан підготовки" }),
    element("h3", { text: "Що потребує окремого перегляду" }),
  );
  const readinessList = element("dl");
  const guidelineCount = bundle.sources.filter((source) => source.type === "guideline").length;
  const readinessItems = [
    ["Відкриті перевірки", missing.length, "state", "Переглянути дослідження"],
    ["Настанови", guidelineCount, "evidence", "Переглянути джерела"],
    ["Раунди дебатів", CASES[state.caseKey]?.latest ? "наявні" : "не записані", "protocol", "Переглянути протокол"],
  ];
  readinessItems.forEach(([label, value, view, action]) => {
    if (view === "protocol" && !CASES[state.caseKey]?.latest) return;
    const row = element("div");
    row.append(
      element("div", {}, [element("dt", { text: label }), element("dd", { text: value })]),
      element("a", { className: "focus-ring", text: `${action} →`, attrs: { href: `?case=${state.caseKey}&view=${view}` } }),
    );
    readinessList.append(row);
  });
  readiness.append(readinessList);
  if (hasMultimodalData(bundle)) {
    readiness.append(element("a", { className: "overview-discrepancy-link focus-ring", text: "Є структуровані розбіжності між методами →", attrs: { href: `?case=${state.caseKey}&view=multimodal` } }));
  }
  controls.append(readiness);
  workspace.append(workspaceMain, controls);
  fragment.append(workspace);
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


function renderConclusionStructureMap({ lead, facts, sourceClaims, fallbackSources, interpretation }) {
  const sources = sourceClaims.length ? sourceClaims : fallbackSources;
  const root = element("section", { className: "conclusion-map", attrs: { "aria-label": "Послідовність формування робочого висновку" } });
  const head = element("div", { className: "conclusion-map-head" });
  head.append(
    element("div", {}, [
      element("p", { className: "section-kicker", text: "Шлях до робочого висновку" }),
      element("h3", { text: "Як система пояснює поточний напрям" }),
    ]),
    element("p", { className: "conclusion-map-intro", text: "Оберіть етап або переміщуйте повзунок. Деталі з’являються праворуч: від даних цього кейсу й настанов до пояснення та робочої гіпотези." }),
  );

  const canvas = element("div", { className: "conclusion-map-canvas", attrs: { "aria-label": "Дані з кейсу та висновки настанов і статей формують пояснення для цього кейсу, з якого виходить робоча гіпотеза" } });
  const paths = svgElement("svg", { className: "conclusion-map-paths", attrs: { viewBox: "0 0 1000 340", preserveAspectRatio: "none", "aria-hidden": "true" } });
  [
    "M 238 88 C 370 88, 405 150, 495 170",
    "M 238 252 C 370 252, 405 190, 495 170",
    "M 625 170 C 710 170, 748 170, 818 170",
  ].forEach((d) => paths.append(svgElement("path", { attrs: { d } })));
  canvas.append(paths);

  const territories = [
    ["facts", "01", "Дані з кейсу", "Що зафіксовано в медичних матеріалах"],
    ["sources", "02", "Настанови й статті", "Що про це кажуть зовнішні джерела"],
    ["interpretation", "03", "Інтерпретація", "Що це означає саме для цього кейсу"],
    ["hypothesis", "04", "Робоча гіпотеза", "Який напрям перевіряємо далі"],
  ];
  const territoryButtons = [];
  territories.forEach(([id, number, title, meta]) => {
    const button = element("button", {
      className: `conclusion-territory ${id} focus-ring`,
      attrs: { type: "button", "data-stage": id, "aria-current": "false" },
    }, [
      element("span", { className: "conclusion-territory-number", text: number }),
      element("span", { className: "conclusion-territory-copy" }, [
        element("strong", { text: title }),
        element("small", { text: meta }),
      ]),
    ]);
    canvas.append(button);
    territoryButtons.push(button);
  });

  const rail = element("div", { className: "conclusion-map-rail" });
  const stageOutput = element("p", { className: "conclusion-map-stage", attrs: { "aria-live": "polite" } });
  const range = element("input", {
    className: "conclusion-map-range focus-ring",
    attrs: { type: "range", min: "0", max: "4", value: "0", step: "1", "aria-label": "Етап формування робочого висновку" },
  });
  const ticks = element("div", { className: "conclusion-map-ticks", attrs: { "aria-hidden": "true" } });
  ["Огляд", "Дані кейсу", "Настанови й статті", "Пояснення", "Гіпотеза"].forEach((label, index) => ticks.append(element("span", { text: `${String(index).padStart(2, "0")} · ${label}` })));
  rail.append(stageOutput, range, ticks);

  const focus = element("article", { className: "conclusion-map-focus", attrs: { "aria-live": "polite" } });
  const mapColumn = element("div", { className: "conclusion-map-controls" });
  mapColumn.append(canvas, rail);
  const workspace = element("div", { className: "conclusion-map-workspace" });
  workspace.append(mapColumn, focus);
  root.append(head, workspace);

  const stageDefinitions = [
    {
      key: "overview",
      label: "00 · Огляд шляху",
      title: "Чотири кроки до робочого висновку",
      copy: "Система спочатку відокремлює дані, записані в цьому кейсі, від загальних висновків настанов і статей. Далі вона пояснює, як ці два шари стосуються саме цього кейсу, і формує робочу гіпотезу для наступної перевірки.",
      build: (body) => {
        const list = element("dl", { className: "conclusion-map-summary" });
        [
          ["Дані кейсу", facts.length ? `${facts.length} записів із пакета` : "не виділено"],
          ["Настанови й статті", sources.length ? `${sources.length} пов’язаних висновків` : "не пов’язано"],
          ["Пояснення для кейсу", interpretation ? "сформовано окремо" : "ще не сформовано"],
          ["Робоча гіпотеза", `напрям #${lead.rank}`],
        ].forEach(([term, value]) => {
          const row = element("div", {});
          row.append(element("dt", { text: term }), element("dd", { text: value }));
          list.append(row);
        });
        body.append(list);
      },
    },
    {
      key: "facts",
      label: "01 · Дані з кейсу",
      title: "Що записано в медичних матеріалах",
      copy: "Це знеособлені результати досліджень, описи матеріалів і події перебігу. Кожен запис походить із пакета цього кейсу. Дані описують клінічну картину та ще не є діагностичним висновком.",
      build: (body) => {
        const list = element("div", { className: "conclusion-map-detail-list" });
        if (!facts.length) list.append(emptyState("Для цієї гіпотези не відібрано пов’язаних даних із кейсу."));
        facts.slice(0, 4).forEach((fact) => list.append(element("article", { className: "conclusion-map-detail" }, [element("span", { text: fact.id }), element("strong", { text: fact.label }), element("p", { text: fact.detail })])));
        if (facts.length > 4) list.append(element("p", { className: "conclusion-map-more", text: `Ще ${facts.length - 4} записів із кейсу — у детальному реєстрі нижче.` }));
        body.append(list);
      },
    },
    {
      key: "sources",
      label: "02 · Настанови й статті",
      title: "Що з цього приводу кажуть зовнішні джерела",
      copy: "Тут зібрані висновки з клінічних настанов і наукових статей: які ознаки підтримують або обмежують напрям і які перевірки розрізняють альтернативи. Джерело задає загальне правило; застосування до цього кейсу показано на наступному етапі.",
      build: (body) => {
        const list = element("div", { className: "conclusion-map-detail-list" });
        if (!sources.length) list.append(emptyState("Для цієї гіпотези не вказано пов’язаних висновків із настанов або статей."));
        sources.slice(0, 3).forEach((source) => {
          const card = element("article", { className: "conclusion-map-detail" });
          const text = source.text || source.citation || source.ref || "Висновок із зовнішнього джерела";
          card.append(element("strong", { text }));
          if (source.source_refs?.length) {
            const refs = element("div", { className: "provenance-source-row" });
            source.source_refs.forEach((id) => refs.append(evidenceChip(id)));
            card.append(refs);
          } else if (source.id) card.append(evidenceChip(source.id));
          list.append(card);
        });
        if (sources.length > 3) list.append(element("p", { className: "conclusion-map-more", text: `Ще ${sources.length - 3} висновків із джерел — у детальному реєстрі нижче.` }));
        body.append(list);
      },
    },
    {
      key: "interpretation",
      label: "03 · Пояснення для цього кейсу",
      title: interpretation ? "Що означає це поєднання саме тут" : "Інтерпретацію ще потрібно сформувати",
      copy: interpretation?.text || "У пакеті немає окремої інтерпретації, яка пов’язує факти конкретного кейсу з положеннями зовнішніх джерел. Такий висновок не можна підміняти самими посиланнями.",
      build: (body) => {
        if (interpretation?.limitations) body.append(element("p", { className: "conclusion-map-boundary", text: `Межа висновку: ${interpretation.limitations}` }));
      },
    },
    {
      key: "hypothesis",
      label: "04 · Робоча гіпотеза",
      title: lead.label,
      copy: lead.stance || "Поточне обґрунтування не внесено до пакета.",
      build: (body) => {
        const checks = element("div", { className: "conclusion-map-checks" });
        checks.append(
          element("div", {}, [element("span", { text: "Зміцнить напрям" }), element("p", { text: lead.confirms || "Критерій не записано." })]),
          element("div", {}, [element("span", { text: "Змусить переглянути" }), element("p", { text: lead.refutes || "Критерій не записано." })]),
        );
        body.append(checks);
      },
    },
  ];

  function setStage(index) {
    const stage = stageDefinitions[index];
    root.dataset.stage = stage.key;
    range.value = String(index);
    stageOutput.textContent = stage.label;
    territoryButtons.forEach((button) => button.setAttribute("aria-current", String(button.dataset.stage === stage.key)));
    focus.replaceChildren(
      element("p", { className: "conclusion-map-focus-label", text: stage.label }),
      element("h4", { text: stage.title }),
      element("p", { className: "conclusion-map-focus-copy", text: stage.copy }),
    );
    stage.build(focus);
  }

  range.addEventListener("input", () => setStage(Number(range.value)));
  territoryButtons.forEach((button) => button.addEventListener("click", () => setStage(stageDefinitions.findIndex((stage) => stage.key === button.dataset.stage))));
  setStage(0);
  return root;
}

function renderProvenance() {
  const bundle = state.bundle;
  const lead = bundle.hypotheses.find((hypothesis) => hypothesis.primary) || [...bundle.hypotheses].sort((a, b) => a.rank - b.rank)[0];
  const leadClaimRefs = lead?.claim_refs || [];
  const interpretation = leadClaimRefs.map((id) => claimById(id)).find((claim) => claim?.kind === "case_interpretation");
  const facts = (interpretation?.fact_refs?.length ? interpretation.fact_refs : lead?.data_refs || [])
    .map((id) => factById(id))
    .filter(Boolean);
  const sourceClaims = (interpretation?.claim_refs?.length ? interpretation.claim_refs : leadClaimRefs)
    .map((id) => claimById(id))
    .filter((claim) => claim && ["external_evidence", "source_interpretation"].includes(claim.kind));
  const fallbackSources = (lead?.evidence_refs || []).map((id) => sourceById(id)).filter(Boolean);

  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Структура робочого висновку",
      "Ця сторінка показує шлях від даних, записаних у медичних матеріалах, до робочої гіпотези. Вона окремо показує, що відомо про кейс, що кажуть настанови й статті, як це пояснено для цього кейсу та що ще потрібно перевірити.",
    ),
  );

  const map = section(
    "Перевірювані деталі",
    lead ? `Повний ланцюг для напряму #${lead.rank}` : "Провідну гіпотезу не сформовано",
    "Для перевірки або друку тут розкладено чотири частини: дані з кейсу, настанови й статті, пояснення для цього кейсу та робоча гіпотеза.",
  );
  if (!lead) {
    map.append(emptyState("У пакеті немає ранжованої гіпотези, для якої можна побудувати карту походження."));
    fragment.append(map);
    return fragment;
  }

  fragment.append(renderConclusionStructureMap({ lead, facts, sourceClaims, fallbackSources, interpretation }));

  const diagram = element("div", { className: "provenance-diagram" });
  const inputs = element("section", { className: "provenance-inputs", attrs: { "aria-label": "Вхідні шари" } });
  const factsColumn = element("div", { className: "provenance-column provenance-facts" });
  factsColumn.append(element("p", { className: "provenance-step", text: "1 · Дані з кейсу" }));
  factsColumn.append(element("p", { className: "provenance-subcopy", text: "Знеособлені результати досліджень, описи матеріалів і події перебігу, записані в пакеті цього кейсу." }));
  const factsList = element("div", { className: "provenance-card-list" });
  if (facts.length) {
    facts.forEach((fact) => {
      const card = element("article", { className: "provenance-card" });
      card.append(element("span", { className: "provenance-id", text: fact.id }), element("strong", { text: fact.label }), element("p", { text: fact.detail }));
      factsList.append(card);
    });
  } else {
    factsList.append(emptyState("У цьому пакеті немає окремо пов’язаних даних для провідної гіпотези."));
  }
  factsColumn.append(factsList);

  const sourcesColumn = element("div", { className: "provenance-column provenance-sources" });
  sourcesColumn.append(element("p", { className: "provenance-step", text: "2 · Настанови й статті" }));
  sourcesColumn.append(element("p", { className: "provenance-subcopy", text: "Висновки з настанов і наукових статей: загальні правила, з якими система зіставляє дані кейсу." }));
  const sourcesList = element("div", { className: "provenance-card-list" });
  if (sourceClaims.length) {
    sourceClaims.forEach((claim) => {
      const card = element("article", { className: "provenance-card" });
      const [label, tone] = claimLayer(claim);
      card.append(statusTag(label, tone), element("p", { text: claim.text }));
      if (claim.source_refs?.length) {
        const refs = element("div", { className: "provenance-source-row" });
        claim.source_refs.forEach((id) => refs.append(evidenceChip(id)));
        card.append(refs);
      }
      sourcesList.append(card);
    });
  } else if (fallbackSources.length) {
    fallbackSources.forEach((source) => {
      const card = element("article", { className: "provenance-card" });
      card.append(element("strong", { text: source.ref }), element("p", { text: source.citation }), evidenceChip(source.id));
      sourcesList.append(card);
    });
  } else {
    sourcesList.append(emptyState("Для цієї позиції не вказано простежуваних джерел."));
  }
  sourcesColumn.append(sourcesList);
  inputs.append(factsColumn, sourcesColumn);

  const interpretationColumn = element("section", { className: "provenance-interpretation", attrs: { "aria-label": "Пояснення для цього кейсу" } });
  interpretationColumn.append(element("p", { className: "provenance-step", text: "3 · Пояснення для цього кейсу" }));
  if (interpretation) {
    interpretationColumn.append(
      element("h4", { text: "Що означає поєднання цих даних саме для цього кейсу" }),
      element("p", { className: "provenance-interpretation-copy", text: interpretation.text }),
      element("p", { className: "provenance-limit", text: `Межа: ${interpretation.limitations}` }),
    );
  } else {
    interpretationColumn.append(
      element("h4", { text: "Потрібна окрема інтерпретація про кейс" }),
      element("p", { className: "provenance-interpretation-copy", text: "У цьому пакеті поки немає окремого пояснення, яке прямо пов’язує дані кейсу з висновками настанов і статей. Доступні матеріали збережено для перевірки, а робочий висновок про конкретний кейс ще не сформовано." }),
    );
  }

  const hypothesisColumn = element("section", { className: "provenance-hypothesis", attrs: { "aria-label": "Провідна робоча гіпотеза" } });
  hypothesisColumn.append(
    statusTag("Найбільш імовірна", "critical"),
    element("p", { className: "provenance-step", text: `4 · Робоча гіпотеза #${lead.rank}` }),
    element("h4", { text: lead.label }),
    element("p", { text: lead.stance }),
  );
  const joinFlow = element("div", { className: "provenance-flow", attrs: { "aria-hidden": "true" } });
  joinFlow.append(element("span", { text: "зіставлення" }), element("strong", { text: "→" }));
  const rankFlow = element("div", { className: "provenance-flow", attrs: { "aria-hidden": "true" } });
  rankFlow.append(element("span", { text: "ранжування" }), element("strong", { text: "→" }));
  diagram.append(inputs, joinFlow, interpretationColumn, rankFlow, hypothesisColumn);
  const auditDisclosure = element("details", { className: "provenance-audit-disclosure" });
  auditDisclosure.append(element("summary", { text: "Відкрити повний структурований реєстр" }), diagram);
  map.append(auditDisclosure);
  fragment.append(map);

  const boundary = section("Перевірка висновку", "Що зміцнить або перегляне цей напрям");
  const ledger = element("div", { className: "provenance-ledger" });
  [
    ["Що підтвердить напрям", lead.confirms || "Критерій підтвердження не записано."],
    ["Що змусить переглянути напрям", lead.refutes || "Критерій перегляду не записано."],
    ["Джерела та повний ланцюг", "Відкрийте вкладку «Джерела», щоб звірити статус кожного положення, точне посилання та його межу застосування."],
  ].forEach(([title, copy], index) => {
    const item = element("article", { className: "provenance-ledger-item" });
    item.append(element("span", { className: "provenance-ledger-number", text: String(index + 1).padStart(2, "0") }), element("h4", { text: title }), element("p", { text: copy }));
    if (index === 2) item.append(element("a", { className: "overview-text-link focus-ring", text: "Відкрити джерела →", attrs: { href: `?case=${state.caseKey}&view=evidence` } }));
    ledger.append(item);
  });
  boundary.append(ledger);
  fragment.append(boundary);
  return fragment;
}

function renderEvidence() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Джерела",
      "Каталог публікацій, настанов і первинних документів, на яких ґрунтуються гіпотези. Клінічні прогалини та потрібні дослідження зібрані окремо у вкладці «Дослідження».",
    ),
  );

  const claims = state.bundle.claims || [];
  if (claims.length) {
    const chain = section(
      "Шари підтвердження",
      "Дані кейсу + настанови й статті → пояснення для цього кейсу → робоча гіпотеза",
      "Кожен рядок є окремою перевірюваною тезою. Настанова або стаття формулює загальне правило чи контекст; наступний шар показує, як це правило застосовано до даних конкретного кейсу.",
    );
    const list = element("div", { className: "source-list" });
    claims.forEach((claim) => {
      const item = element("article", { className: "source-item" });
      const [layerLabel, layerTone] = claimLayer(claim);
      item.append(statusTag(layerLabel, layerTone), element("h4", { className: "src-head", text: claim.text }));
      const level = claim.verification?.level || "candidate";
      const [levelLabel, levelTone] = verificationLabel(level);
      item.append(statusTag(levelLabel, levelTone));
      const refs = element("div", { className: "src-linked" });
      if (claim.fact_refs?.length) {
        refs.append(element("span", { className: "src-linked-label", text: "Дані кейсу" }));
        claim.fact_refs.forEach((id) => refs.append(dataChip(id)));
      }
      if (claim.source_refs?.length) {
        refs.append(element("span", { className: "src-linked-label", text: "Настанови й статті" }));
        claim.source_refs.forEach((id) => refs.append(evidenceChip(id)));
      }
      if (claim.claim_refs?.length) {
        refs.append(element("span", { className: "src-linked-label", text: "Висновки джерел" }));
        claim.claim_refs.forEach((id) => {
          const linked = claimById(id);
          if (linked) refs.append(element("span", { className: "chip", text: wordClip(linked.text, 48), attrs: { title: linked.text } }));
        });
      }
      if (claim.hypothesis_refs?.length) {
        refs.append(element("span", { className: "src-linked-label", text: "Гіпотези" }));
        claim.hypothesis_refs.forEach((id) => {
          const hypothesis = hypothesisById(id);
          if (hypothesis) refs.append(element("span", { className: "chip", text: `#${hypothesis.rank} ${wordClip(hypothesis.label, 28)}`, attrs: { title: hypothesis.label } }));
        });
      }
      if (refs.childNodes.length) item.append(refs);
      item.append(element("p", { className: "src-cite", text: `Межа: ${claim.limitations}` }));
      list.append(item);
    });
    chain.append(list);
    fragment.append(chain);
  }

  const groups = [
    ["Настанови", state.bundle.sources.filter((source) => source.type === "guideline")],
    ["PubMed", state.bundle.sources.filter((source) => source.type === "pmid")],
    ["Первинні документи", state.bundle.sources.filter((source) => ["case", "patient", "local"].includes(source.type))],
    ["Джерельні прогалини", state.bundle.sources.filter((source) => source.type === "gap")],
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
          const linked = hypothesesSupportedBy(source);
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
  const coverage = element("dl", { className: "state-coverage", attrs: { "aria-label": "Покриття структурованих досліджень" } });
  [
    ["Лабораторія", clinical.labs.length],
    ["Тканинні дослідження", clinical.pathology.length],
    ["Візуалізація", clinical.imaging.length],
    ["Групи перевірок", clinical.panel.length],
  ].forEach(([label, value]) => coverage.append(element("div", {}, [element("dt", { text: label }), element("dd", { text: value || "немає" })])));
  fragment.append(coverage);

  if (clinical.labs.length) {
    const labs = section("Кількісні дані", "Лабораторні показники");
    labs.append(table(
      ["Показник", "Значення", "Одиниця", "Референс", "Примітка"],
      clinical.labs.map((lab) => [lab.an || lab.name, lab.v || lab.value, lab.unit, `${textValue(lab.lo)}–${textValue(lab.hi)}`, lab.note]),
    ));
    fragment.append(labs);
  }

  if (clinical.pathology.length) {
    const pathology = section("Тканини", "Патоморфологія та ІГХ");
    const list = element("div", { className: "state-list" });
    clinical.pathology.forEach((item) => {
      list.append(element("article", { className: "state-item" }, [
        element("h3", { text: item.label || item.kind || item.specimen || "Тканинне дослідження" }),
        element("p", { text: item.finding || item.conclusion || item.verdict || "Деталі не записані." }),
        definitionList([["Дата", item.date], ["Матеріал", item.specimen], ["Висновок", enumLabel(item.verdict || item.conclusion)]]),
      ]));
    });
    pathology.append(list);
    fragment.append(pathology);
  }

  if (clinical.imaging.length) {
    const imaging = section("Візуалізація", "Динаміка уражень");
    const list = element("div", { className: "state-list" });
    clinical.imaging.forEach((item) => {
      list.append(element("article", { className: "state-item" }, [
        element("h3", { text: `${item.date || ""} ${item.modality || item.kind || "Візуалізація"}`.trim() }),
        element("p", { text: item.impression || item.finding || item.trend || "Деталі не записані." }),
      ]));
    });
    imaging.append(list);
    fragment.append(imaging);
  }

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
  const bundle = state.bundle;
  const hypotheses = [...bundle.hypotheses].sort((a, b) => a.rank - b.rank);
  const lead = hypotheses[0];
  const recommendations = recommendationPlanForCase(bundle);
  const groupedRecommendations = recommendations.reduce((groups, item) => {
    const key = item.phase || "Додаткові дані";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
    return groups;
  }, new Map());
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Пакет для консиліуму",
      "Стислий знімок кейсу для обговорення й друку: поточна клінічна рамка, ранжований диференціал, ключові докази та план перевірок. Детальна історія, граф і раунди заперечень залишаються у відповідних вкладках.",
      `${bundle.case.id} · Бриф консиліуму`,
    ),
  );
  const action = element("button", { className: "action-button packet-print-action focus-ring", text: "Друкувати або зберегти PDF", attrs: { type: "button" } });
  action.addEventListener("click", () => window.print());
  fragment.append(action);

  const cover = element("section", { className: "packet-cover" });
  const coverMain = element("div", { className: "packet-cover-main" });
  coverMain.append(
    element("p", { className: "packet-kicker", text: "Поточна клінічна рамка" }),
    element("h3", { className: "packet-lead-title", text: lead?.label || "Провідну робочу гіпотезу не сформовано" }),
    element("p", { className: "packet-lead-copy", text: lead?.stance || bundle.case.signal || "Клінічне резюме не записано." }),
  );
  const keySignals = element("div", { className: "packet-signal-list", attrs: { "aria-label": "Ключові опорні дані" } });
  const leadDataRefs = lead?.data_refs?.length ? lead.data_refs : bundle.facts.slice(0, 4).map((fact) => fact.id);
  leadDataRefs.slice(0, 4).forEach((ref) => keySignals.append(element("span", { text: factById(ref)?.label || ref })));
  coverMain.append(keySignals);

  const decision = element("aside", { className: "packet-decision" });
  decision.append(
    element("p", { className: "packet-kicker", text: "Дослідження, що уточнює діагноз" }),
    element("h3", { text: wordClip(bundle.case.discriminating_step || "Ключовий крок не записано", 80) }),
    element("p", { text: bundle.case.discriminating_step || "Ключовий крок не записано." }),
  );
  cover.append(coverMain, decision);
  fragment.append(cover);

  const meta = element("dl", { className: "packet-meta" });
  [
    ["Кейс", bundle.case.id],
    ["Сформовано", bundle.case.generated],
    ["Первинний пакет", bundle.case.source],
    ["Знеособлення", deidentificationLabel(bundle.deidentification?.status)],
    ["Версія контракту", bundle.schema_version],
  ].forEach(([label, value]) => {
    const row = element("div");
    row.append(element("dt", { text: label }), element("dd", { text: textValue(value) }));
    meta.append(row);
  });
  fragment.append(meta);

  const clinical = element("section", { className: "packet-section" });
  clinical.append(
    element("div", { className: "packet-section-head" }, [
      element("div", {}, [element("p", { className: "packet-kicker", text: "Клінічна суть" }), element("h3", { text: "Що потрібно винести на обговорення" })]),
    ]),
    element("div", { className: "packet-clinical-grid" }, [
      element("div", {}, [element("h4", { text: "Клінічна картина" }), element("p", { text: bundle.case.demographics || "Не записано." })]),
      element("div", {}, [element("h4", { text: "Стан доказів" }), clinicalSummary(bundle.case.signal)]),
    ]),
  );
  fragment.append(clinical);

  const differential = element("section", { className: "packet-section" });
  differential.append(
    element("div", { className: "packet-section-head" }, [
      element("div", {}, [element("p", { className: "packet-kicker", text: "Ранжований диференціал" }), element("h3", { text: "Гіпотези для рішення консиліуму" })]),
      element("span", { className: "packet-count", text: `${Math.min(hypotheses.length, 3)} з ${hypotheses.length}` }),
    ]),
  );
  const differentialList = element("ol", { className: "packet-differential" });
  hypotheses.slice(0, 3).forEach((hypothesis) => {
    const tone = hypothesis.rank === 1 ? "danger" : hypothesis.status === "must-not-miss" || hypothesis.status === "must_not_miss" ? "miss" : "caution";
    const item = element("li", { attrs: { "data-tone": tone } });
    const copy = element("div");
    copy.append(
      element("p", { className: "packet-hypothesis-status", text: hypothesisStatus(hypothesis.status) }),
      element("h4", { text: hypothesis.label }),
      element("p", { text: hypothesis.stance || "Позицію не описано." }),
    );
    const refs = element("div", { className: "packet-evidence-row" });
    (hypothesis.evidence_refs || []).slice(0, 4).forEach((ref) => refs.append(evidenceChip(ref)));
    if (refs.children.length) copy.append(refs);
    item.append(element("span", { className: `packet-rank ${tone}`, text: String(hypothesis.rank).padStart(2, "0") }), copy);
    differentialList.append(item);
  });
  differential.append(differentialList);
  if (hypotheses.length > 3) {
    differential.append(
      element("p", {
        className: "packet-continuation",
        text: `Ще ${hypotheses.length - 3} позицій із повними аргументами та раундами заперечень доступні у вкладці «Консиліум».`,
      }),
    );
  }
  fragment.append(differential);

  const gapSection = element("section", { className: "packet-section packet-gaps" });
  gapSection.append(
    element("div", { className: "packet-section-head" }, [
      element("div", {}, [
        element("p", { className: "packet-kicker text-danger-700", text: "Відкриті перевірки" }),
        element("h3", { text: "Що ще потрібно з’ясувати" }),
        element("p", { className: "packet-section-copy", text: "Кожен пункт пояснює матеріал або метод, клінічне питання та доказову опору. Це порядок обговорення, а не готове призначення." }),
      ]),
      element("span", { className: "packet-count danger", text: `${recommendations.length} відкритих` }),
    ]),
  );
  if (!recommendations.length) {
    gapSection.append(emptyState("Критичних відкритих перевірок у структурованому пакеті не записано."));
  } else {
    groupedRecommendations.forEach((items, phase) => {
      const group = element("div", { className: "packet-gap-group" });
      group.append(element("h4", { text: phase }));
      const list = element("ol", { className: "packet-gap-list" });
      items.forEach((item, index) => {
        const row = element("li");
        const copy = element("div");
        copy.append(
          element("div", { className: "packet-gap-title-row" }, [
            element("h5", { text: item.title }),
            element("span", { className: `packet-gap-status ${item.tone}`, text: item.status }),
          ]),
          element("p", { className: "packet-gap-action", text: item.action }),
          element("p", { className: "packet-gap-why" }, [element("b", { text: "Клінічне питання: " }), element("span", { text: item.why })]),
        );
        const evidence = element("div", { className: "packet-evidence-row" });
        if (item.refs.length) item.refs.forEach((ref) => evidence.append(evidenceChip(ref)));
        else evidence.append(element("span", { className: "chip gap", text: "◇ Джерело не прив’язане" }));
        copy.append(evidence);
        row.append(element("span", { className: "packet-gap-index", text: String(index + 1).padStart(2, "0") }), copy);
        list.append(row);
      });
      group.append(list);
      gapSection.append(group);
    });
  }
  fragment.append(gapSection);

  const sources = element("section", { className: "packet-section packet-source-footer" });
  sources.append(
    element("div", {}, [element("p", { className: "packet-kicker", text: "Доказова опора" }), element("h3", { text: "Ключові джерела" })]),
    element("div", { className: "packet-source-list" }),
  );
  const sourceList = sources.lastElementChild;
  bundle.sources.filter((source) => source.type === "guideline" || source.type === "pmid").slice(0, 6).forEach((source) => {
    const row = element("div");
    row.append(source.type === "guideline" ? evidenceChip(source.id) : evidenceChip(source.id), element("p", { text: source.type === "guideline" ? guidelineCitation(source) : source.citation }));
    sourceList.append(row);
  });
  if (!sourceList.children.length) sourceList.append(emptyState("Прив’язані настанови або публікації PubMed відсутні."));
  sources.append(element("p", { className: "packet-boundary", text: bundle.case.governance || "Підтримка клінічного рішення. Остаточний висновок формує клінічна команда." }));
  fragment.append(sources);
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

// SVG має окремий DOM-простір: className для HTML тут не працює надійно.
// Підтримує старий короткий запис атрибутів і розширений запис як у element().
function svgElement(tag, options = {}, children = []) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  const attrs = options.attrs || options;
  if (options.className) node.setAttribute("class", options.className);
  if (options.text !== undefined) node.textContent = displayText(options.text);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "attrs" || key === "className" || key === "text" || value === undefined || value === null) return;
    node.setAttribute(key, String(value));
  });
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === undefined || child === null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
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
  const graphHeight = Math.max(520, Math.max(state.bundle.facts.length * 58, state.bundle.hypotheses.length * 86) + 118);
  const svg = svgElement("svg", { viewBox: `0 0 950 ${graphHeight}`, role: "group", "aria-label": "Граф клінічних знахідок і робочих гіпотез" });
  const height = Number(svg.getAttribute("viewBox").split(" ")[3]);
  const findingsHeading = svgElement("text", { class: "graph-column-label", x: "42", y: "38" });
  findingsHeading.textContent = "ЗНАХІДКИ";
  const hypothesesHeading = svgElement("text", { class: "graph-column-label", x: "610", y: "38" });
  hypothesesHeading.textContent = "ГІПОТЕЗИ";
  svg.append(findingsHeading, hypothesesHeading);
  const factY = new Map();
  const hypothesisY = new Map();
  state.bundle.facts.forEach((fact, index) => factY.set(fact.id, 82 + index * ((height - 128) / Math.max(1, state.bundle.facts.length - 1))));
  state.bundle.hypotheses.forEach((hypothesis, index) => hypothesisY.set(hypothesis.id, 94 + index * ((height - 150) / Math.max(1, state.bundle.hypotheses.length - 1))));

  state.bundle.relations.forEach((relation, index) => {
    const y1 = factY.get(relation.fact_id);
    const y2 = hypothesisY.get(relation.hypothesis_id);
    if (y1 === undefined || y2 === undefined) return;
    const edge = svgElement("path", {
      class: "graph-edge",
      d: `M 350 ${y1} C 455 ${y1}, 510 ${y2}, 610 ${y2}`,
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
      node.classList.toggle("is-active-node", node.dataset.id === item.id);
    });
  }

  function compactHypothesisLabel(item) {
    // Short labels live in the validated bundle (hypothesis.short_label);
    // the renderer only falls back to clipping the full clinical label.
    return item.short_label || wordClip(item.label, 38);
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
      group.append(svgElement("rect", { class: "node-shadow-layer", x: "3", y: "-23", width: "304", height: "54", rx: "15" }));
      group.append(svgElement("rect", { class: "node-surface", x: "0", y: "-28", width, height: "56", rx: "15" }));
      group.append(svgElement("rect", { class: "node-highlight", x: "1", y: "-27", width: String(width - 2), height: "27", rx: "14" }));
    }
    if (kind === "fact") {
      const labelLines = wrapLines(item.label, 34, 2);
      labelLines.forEach((line, index) => {
        const text = svgElement("text", { x: "-20", y: String((labelLines.length === 2 ? -7 : 4) + index * 16), "text-anchor": "end", class: "node-label" });
        text.textContent = line;
        group.append(text);
      });
    } else {
      const code = svgElement("text", { class: "node-rank", x: "18", y: "5" });
      code.textContent = `#${item.rank}`;
      const label = svgElement("text", { class: "node-label hypothesis-short-label", x: "58", y: "6" });
      label.textContent = compactHypothesisLabel(item);
      group.append(code, label);
    }
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

  state.bundle.facts.forEach((fact) => svg.append(interactiveGroup("fact", fact, 350, factY.get(fact.id), 0)));
  state.bundle.hypotheses.forEach((hypothesis) => svg.append(interactiveGroup("hypothesis", hypothesis, 610, hypothesisY.get(hypothesis.id), 310)));
  stage.append(svg);
  layout.append(stage, detail);
  graphSection.append(layout);
  fragment.append(graphSection);
  setDetail("hypothesis", [...state.bundle.hypotheses].sort((a, b) => a.rank - b.rank)[0]);
  return fragment;
}

function renderMultimodal() {
  const fragment = document.createDocumentFragment();
  const multimodal = state.bundle.methodology.multimodal || {};
  fragment.append(
    viewHeader(
      "Узгодженість доказів",
      "Матриця показує лише міжшарові збіги, суперечності та прогалини. Первинні значення залишаються у «Дослідженнях», а бібліографія — у «Джерелах».",
    ),
  );
  if (multimodal.summary) fragment.append(element("aside", { className: "comparison-summary", text: multimodal.summary }));

  const modalities = section("Матриця", "Що узгоджується, а що обмежує висновок");
  const matrix = element("div", { className: "comparison-matrix" });
  matrix.append(element("div", { className: "comparison-matrix-head" }, [
    element("span", { text: "Шар даних" }),
    element("span", { text: "Ключовий сигнал" }),
    element("span", { text: "Зв’язок із гіпотезами" }),
    element("span", { text: "Чого бракує" }),
  ]));
  multimodal.modalities.forEach((item) => {
    const linked = (item.supports || []).map((id) => hypothesisById(id)).filter(Boolean);
    const links = element("div", { className: "comparison-links" });
    if (linked.length) linked.forEach((hypothesis) => links.append(element("span", { text: `#${hypothesis.rank} ${wordClip(hypothesis.label, 24)}`, attrs: { title: hypothesis.label } })));
    else links.append(element("span", { className: "comparison-none", text: "Не прив’язано" }));
    const gaps = element("div", { className: "comparison-gaps" });
    if ((item.gaps || []).length) item.gaps.forEach((gap) => gaps.append(element("span", { text: gap })));
    else gaps.append(element("span", { className: "comparison-none", text: "Критичну прогалину не записано" }));
    matrix.append(element("article", { className: "comparison-row" }, [
      element("div", {}, [element("h3", { text: item.label || item.name || "Тип даних" }), statusTag(enumLabel(item.status), enumTone(item.status))]),
      element("p", { text: item.signal || item.summary || "Сигнал не описано." }),
      links,
      gaps,
    ]));
  });
  modalities.append(matrix);
  fragment.append(modalities);

  const fusion = section("Міжшаровий висновок", "Що випливає лише зі зіставлення");
  const fusionList = element("div", { className: "comparison-conclusions" });
  (multimodal.fusion || []).forEach((item) => {
    const row = element("article");
    row.append(element("p", { text: item.claim || item.summary || item.text || "Висновок не описано." }));
    const meta = element("div");
    (item.modalities || []).forEach((label) => meta.append(chip(label)));
    if (item.confidence) meta.append(statusTag(enumLabel(item.confidence), enumTone(item.confidence)));
    if (meta.children.length) row.append(meta);
    fusionList.append(row);
  });
  fusion.append(fusionList);
  fragment.append(fusion);

  if (Array.isArray(multimodal.explainability) && multimodal.explainability.length) {
    const factors = section("Вплив на оцінку", "Які фактори підсилюють або обмежують напрям");
    const directionLabels = { raises: "підсилює", weakens: "послаблює", blocks: "блокує висновок" };
    const factorList = element("div", { className: "comparison-factors" });
    multimodal.explainability.forEach((item) => {
      const targetText = String(item.target || "").replace(/\bH\d+\b/g, (id) => hypothesisById(id)?.label || id);
      factorList.append(element("article", {}, [
        element("h3", { text: item.factor || item.label || item.title || "Фактор" }),
        element("p", { text: targetText ? `Впливає на: ${targetText}` : item.claim || item.summary || "" }),
        statusTag(directionLabels[item.direction] || enumLabel(item.direction), item.direction === "blocks" ? "critical" : item.direction === "weakens" ? "candidate" : "evidence"),
      ]));
    });
    factors.append(factorList);
    fragment.append(factors);
  }
  return fragment;
}

// Typed run loading: the UI must distinguish "no run yet" from "run is
// corrupted", "pointer is broken" and "bytes do not match the pinned hash".
// Collapsing every failure into null would lie about the evidence base state.
async function sha256Hex(text) {
  if (!globalThis.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function loadLatestRun() {
  const config = CASES[state.caseKey];
  if (!config?.latest) return { status: "absent" };
  let pointerResponse;
  try {
    pointerResponse = await fetch(config.latest, { cache: "no-store" });
  } catch {
    return { status: "network-error", detail: "Немає відповіді від сервера під час читання вказівника запуску." };
  }
  if (!pointerResponse.ok) return { status: "absent" };
  let pointer;
  try {
    pointer = await pointerResponse.json();
  } catch {
    return { status: "pointer-invalid", detail: "Вказівник запуску пошкоджений: це не валідний JSON." };
  }
  if (!pointer || typeof pointer.path !== "string" || !pointer.path) {
    return { status: "pointer-invalid", detail: "Вказівник запуску не містить шляху до run.json." };
  }
  const base = config.latest.slice(0, config.latest.lastIndexOf("/") + 1);
  let runResponse;
  try {
    runResponse = await fetch(`${base}${pointer.path}`, { cache: "no-store" });
  } catch {
    return { status: "network-error", detail: "Немає відповіді від сервера під час читання run.json." };
  }
  if (!runResponse.ok) return { status: "run-missing", detail: `Файл запуску недоступний (HTTP ${runResponse.status}).` };
  const runText = await runResponse.text();
  let run;
  try {
    run = JSON.parse(runText);
  } catch {
    return { status: "run-invalid", detail: "run.json пошкоджений: це не валідний JSON." };
  }
  let hashState = "unverified";
  if (typeof pointer.run_sha256 === "string" && pointer.run_sha256) {
    const actual = await sha256Hex(runText);
    if (actual === null) hashState = "unverified";
    else if (actual !== pointer.run_sha256.toLowerCase()) {
      return { status: "hash-mismatch", detail: "Байтовий хеш run.json не збігається з вказівником. Запуск міг бути змінений після публікації.", pointer, run };
    } else hashState = "verified";
  }
  return { status: "ok", pointer, run, hashState };
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

const RUN_STATE_MESSAGES = {
  absent: "Незмінний запуск ще не створено для цього кейсу. Доступний лише статичний методологічний знімок із пакета.",
  "pointer-invalid": "Вказівник на запуск пошкоджений. Це не те саме, що відсутність запуску: перевірте цілісність runs/latest.json локальним валідатором.",
  "run-missing": "Вказівник посилається на файл запуску, який недоступний. Запуск міг бути видалений або не опублікований повністю.",
  "run-invalid": "Файл запуску пошкоджений і не може бути прочитаний. Не використовуйте цей запуск як доказову основу.",
  "network-error": "Сервер не відповів під час завантаження запуску. Стан доказової бази невідомий — перевірте локальний HTTP-сервер.",
  "hash-mismatch": "Хеш завантаженого запуску не збігається зі значенням у вказівнику. Вміст запуску міг бути змінений після публікації — протокол не показується.",
};

// Replay loading mirrors the same honesty rules as run loading: absent,
// invalid and stale are different states and are named differently.
async function loadReplay() {
  const config = CASES[state.caseKey];
  if (!config?.replay) return { status: "absent" };
  const fetchText = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return response.text();
  };
  let replayText;
  let bundleText;
  try {
    [replayText, bundleText] = await Promise.all([fetchText(config.replay), fetchText(config.bundle)]);
  } catch {
    return { status: "network-error", detail: "Немає відповіді від сервера під час читання replay-артефакту." };
  }
  if (replayText === null) return { status: "absent" };
  let replay;
  try {
    replay = JSON.parse(replayText);
  } catch {
    return { status: "replay-invalid", detail: "replay.json пошкоджений: це не валідний JSON." };
  }
  if (bundleText !== null && typeof replay.bundle_sha256 === "string") {
    const actual = await sha256Hex(bundleText);
    if (actual !== null && actual !== replay.bundle_sha256.toLowerCase()) {
      return { status: "stale", detail: "replay.json застарілий: пакет кейсу змінився після генерації артефакту. Регенеруйте scripts/replay_case.py.", replay };
    }
  }
  return { status: "ok", replay };
}

const MILESTONE_PRESENTATION = {
  first_support: ["Перший доказ на користь", "candidate"],
  first_discriminating_support: ["Початок розділення пари", "evidence"],
  first_strict_lead: ["Строге лідерство", "evidence"],
  unresolved_pair_window: ["Фінальна пара нерозділена", "candidate"],
  fault_line_window: ["Розбіжність потоків", "critical"],
  resolution: ["Фінальну відповідь зафіксовано", "evidence"],
};

function renderReplay() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Докази в часі",
      "Детерміновані часові зрізи замороженого графа доказів: що було доступне станом на кожну дату і коли докази вперше розділили фінальну пару гіпотез. Це не симуляція минулих міркувань — жодна модель не викликається, жодне минуле ранжування не вигадується.",
      "Реплей доказів",
    ),
  );
  const loaded = state.replay;
  if (!loaded || loaded.status !== "ok") {
    const messages = {
      absent: "Для цього кейсу часовий реплей не згенеровано (немає датованих фактів або replay-артефакту).",
      "replay-invalid": "Артефакт реплею пошкоджений.",
      "network-error": "Сервер не відповів під час завантаження реплею.",
      stale: "Реплей застарілий відносно поточного пакета кейсу.",
    };
    fragment.append(
      element("div", { className: loaded && loaded.status !== "absent" ? "error-panel" : "empty-state" }, [
        element("p", { text: messages[loaded?.status] || messages.absent }),
        loaded?.detail ? element("p", { text: loaded.detail }) : null,
      ]),
    );
    return fragment;
  }
  const replay = loaded.replay;
  const finalHypothesis = hypothesisById(replay.final_hypothesis);
  const runnerUp = state.bundle.hypotheses.find((h) => h.rank === 2);

  const explainer = element("aside", { className: "explainer" });
  explainer.append(
    element("p", { text: replay.method }),
    element("p", { text: replay.date_map_note || "" }),
  );
  if (replay.facts_undated?.length) {
    explainer.append(element("p", { text: `Факти без дати виключено зі зрізів: ${replay.facts_undated.join(", ")}.` }));
  }
  fragment.append(explainer);

  const milestones = section("Ключові моменти", "Коли докази змінили картину");
  const milestoneGrid = element("div", { className: "milestone-grid" });
  (replay.milestones || []).forEach((milestone) => {
    const [title, tone] = MILESTONE_PRESENTATION[milestone.kind] || [milestone.kind, "candidate"];
    const when = milestone.date || `${milestone.from} → ${milestone.to}${milestone.days != null ? ` · ${milestone.days} дн.` : ""}`;
    milestoneGrid.append(
      element("article", { className: "milestone-card", attrs: { "data-tone": tone } }, [
        element("p", { className: "milestone-when", text: when }),
        element("h3", { text: title }),
        element("p", { text: milestone.note }),
      ]),
    );
  });
  milestones.append(milestoneGrid);
  fragment.append(milestones);

  // Trajectory: support/refute bars for the final pair over the cutoffs.
  const trajectory = section(
    "Траєкторія підтримки",
    `${finalHypothesis?.short_label || finalHypothesis?.label || replay.final_hypothesis} проти ${runnerUp?.short_label || runnerUp?.label || "другої за рангом"}`,
    "Стовпці — кількість фактів «за» станом на дату; червоні риски — факти «проти». Маркер ◆ — фінальна гіпотеза строго лідирує.",
  );
  const pairIds = [replay.final_hypothesis, runnerUp?.id].filter(Boolean);
  const maxSupport = Math.max(
    4,
    ...replay.cutoffs.flatMap((c) => c.standings.filter((s) => pairIds.includes(s.id)).map((s) => s.support)),
  );
  const slot = 104;
  const chartHeight = 190;
  const baseY = 158;
  const width = slot * replay.cutoffs.length + 40;
  const svg = svgElement("svg", { class: "replay-svg", viewBox: `0 0 ${width} ${chartHeight + 56}`, role: "img", "aria-label": "Траєкторія підтримки фінальної пари гіпотез" });

  // Window shading from milestones with from/to dates.
  (replay.milestones || []).forEach((milestone) => {
    if (!milestone.from || !milestone.to) return;
    const fromIdx = replay.cutoffs.findIndex((c) => c.date >= milestone.from);
    const toIdx = replay.cutoffs.findIndex((c) => c.date >= milestone.to);
    if (fromIdx < 0) return;
    const endIdx = toIdx < 0 ? replay.cutoffs.length - 1 : toIdx;
    svg.append(svgElement("rect", {
      class: `replay-window ${milestone.kind === "fault_line_window" ? "fault" : "pair"}`,
      x: String(20 + fromIdx * slot - 8),
      y: "6",
      width: String((endIdx - fromIdx + 1) * slot - 8),
      height: String(baseY - 6),
      rx: "10",
    }));
  });

  replay.cutoffs.forEach((cutoff, index) => {
    const x = 20 + index * slot;
    pairIds.forEach((hid, pairIndex) => {
      const standing = cutoff.standings.find((s) => s.id === hid) || { support: 0, refute: 0 };
      const barHeight = Math.max(3, (standing.support / maxSupport) * (baseY - 20));
      const barX = x + pairIndex * 34;
      svg.append(svgElement("rect", {
        class: `replay-bar ${pairIndex === 0 ? "final" : "runner"}`,
        x: String(barX), y: String(baseY - barHeight), width: "26", height: String(barHeight), rx: "5",
      }));
      if (standing.refute > 0) {
        svg.append(svgElement("line", {
          class: "replay-refute-tick",
          x1: String(barX + 3), x2: String(barX + 23), y1: String(baseY + 7), y2: String(baseY + 7),
        }));
      }
    });
    if (cutoff.final_leads) {
      const marker = svgElement("text", { class: "replay-lead-marker", x: String(x + 22), y: "18", "text-anchor": "middle" });
      marker.textContent = "◆";
      svg.append(marker);
    }
    const label = svgElement("text", { class: "replay-date-label", x: String(x + 22), y: String(baseY + 30), "text-anchor": "middle" });
    label.textContent = cutoff.date.slice(2).replace(/-/g, ".");
    svg.append(label);
  });
  const baseline = svgElement("line", { class: "replay-baseline", x1: "14", x2: String(width - 14), y1: String(baseY), y2: String(baseY) });
  svg.append(baseline);
  trajectory.append(svg);
  const legend = element("div", { className: "replay-legend" });
  legend.append(
    element("span", { className: "replay-legend-item final" }, [element("i"), document.createTextNode(finalHypothesis?.short_label || replay.final_hypothesis)]),
    runnerUp ? element("span", { className: "replay-legend-item runner" }, [element("i"), document.createTextNode(runnerUp.short_label || `#${runnerUp.rank}`)]) : null,
    element("span", { className: "replay-legend-item pair" }, [element("i"), document.createTextNode("вікно нерозділеної пари")]),
    element("span", { className: "replay-legend-item fault" }, [element("i"), document.createTextNode("вікно розбіжності потоків")]),
  );
  trajectory.append(legend);
  fragment.append(trajectory);

  const cutoffsSection = section("Зрізи за датами", "Що було доступне станом на кожну дату", "Кожен зріз перераховано з тих самих заморожених зв'язків графа — без майбутніх фактів.");
  const cutoffList = element("div", { className: "protocol-list" });
  replay.cutoffs.forEach((cutoff, index) => {
    const detail = element("details", { className: "protocol-entry", attrs: index === replay.cutoffs.length - 1 ? { open: "" } : {} });
    const summary = element("summary", { className: "protocol-entry-head" });
    const summaryCopy = element("span", { className: "protocol-summary-wrap" });
    summaryCopy.append(element("span", { className: "protocol-summary", text: cutoff.label }));
    const leaderNames = cutoff.leaders.map((id) => {
      const hypothesis = hypothesisById(id);
      return hypothesis?.short_label || hypothesis?.label || id;
    });
    summary.append(
      element("span", { className: "protocol-role", text: cutoff.date }),
      summaryCopy,
      element("span", { className: "entry-toggle", attrs: { "aria-hidden": "true" }, text: "+" }),
    );
    detail.append(summary);
    const body = element("div", { className: "protocol-analysis" });
    body.append(element("p", { className: "replay-leaders-line", text: cutoff.leaders.length ? `Лідери зрізу: ${leaderNames.join(" · ")}` : "Лідера ще немає (доказів замало)." }));
    if (cutoff.facts_entered.length) {
      const entered = element("div", { className: "protocol-refs" });
      entered.append(element("span", { className: "protocol-refs-label", text: "Нові факти зрізу" }));
      cutoff.facts_entered.forEach((factId) => entered.append(dataChip(factId)));
      body.append(entered);
    }
    const rows = cutoff.standings
      .filter((s) => s.support > 0 || s.refute > 0)
      .sort((a, b) => b.support - a.support || a.refute - b.refute)
      .map((s) => {
        const hypothesis = hypothesisById(s.id);
        return [hypothesis?.short_label || hypothesis?.label || s.id, `за ${s.support}`, `проти ${s.refute}`];
      });
    if (rows.length) body.append(table(["Гіпотеза", "Підтримка", "Спростування"], rows));
    detail.append(body);
    cutoffList.append(detail);
  });
  cutoffsSection.append(cutoffList);
  fragment.append(cutoffsSection);

  if (replay.reaction_points?.length) {
    const reactions = section("Реакція команди", "Задокументовані дії, що змінили перебіг");
    const list = element("div", { className: "source-list" });
    replay.reaction_points.forEach((point) => {
      list.append(
        element("article", { className: "source-item" }, [
          element("p", { className: "milestone-when", text: point.date }),
          element("h4", { className: "src-head", text: point.label }),
          element("p", { className: "src-cite", text: point.note }),
        ]),
      );
    });
    reactions.append(list);
    fragment.append(reactions);
  }
  return fragment;
}

async function renderReplayAsync() {
  if (!state.replay) state.replay = await loadReplay();
  return renderReplay();
}

async function renderProtocol() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Протокол агентних дебатів",
      "Операторський відтворюваний запис: які підготовлені позиції, заперечення та синтез модератора закладено у прогін. У цій версії немає самостійного запуску мовної моделі.",
      "Агентні дебати",
    ),
  );
  state.latestRun = await loadLatestRun();
  const audit = section("Відтворюваність", "Дані для перевірки запуску", "Ідентифікатори й хеші прив'язують протокол до знімків входу. Повна перевірка байтових хешів виконується локальним валідатором, а не лише цим статичним переглядом.");
  if (state.latestRun.status !== "ok") {
    const message = RUN_STATE_MESSAGES[state.latestRun.status] || RUN_STATE_MESSAGES.absent;
    const detail = state.latestRun.detail;
    audit.append(
      element("div", { className: state.latestRun.status === "absent" ? "empty-state" : "error-panel" }, [
        element("p", { text: message }),
        detail ? element("p", { text: detail }) : null,
      ]),
    );
  } else {
    const { pointer, run, hashState } = state.latestRun;
    const hashLabel = hashState === "verified"
      ? "байтовий хеш run.json перевірено у браузері — збігається"
      : "хеш не перевірено в браузері (недоступний WebCrypto або відсутній очікуваний хеш) — звірте локальним валідатором";
    audit.append(
      definitionList([
        ["Ідентифікатор запуску", pointer.run_id],
        ["Режим", run.mode === "operator_offline" ? "операторський офлайн" : run.mode],
        ["Створено", run.created_at],
        ["Хеш пакета кейсу", run.input_hashes?.case_bundle_sha256?.slice(0, 16) || "—"],
        ["Хеш початкових даних дебатів", run.input_hashes?.debate_seed_sha256?.slice(0, 16) || "—"],
        ["Хеш набору ролей", run.input_hashes?.role_bundle_sha256?.slice(0, 16) || "—"],
        ["Цілісність", hashLabel],
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
  provenance: renderProvenance,
  state: renderState,
  packet: renderPacket,
  graph: renderGraph,
  bodymap: renderBodyMap,
  multimodal: renderMultimodal,
  replay: renderReplayAsync,
  protocol: renderProtocol,
};

function buildNavigation(target, views) {
  target.replaceChildren();
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

function hasMultimodalData(bundle) {
  const multimodal = bundle?.methodology?.multimodal;
  if (!multimodal || typeof multimodal !== "object") return false;
  const modalityCount = Array.isArray(multimodal.modalities) ? multimodal.modalities.length : 0;
  const hasSynthesis = [multimodal.fusion, multimodal.explainability].some((items) => Array.isArray(items) && items.length);
  return modalityCount >= 2 && hasSynthesis;
}

function availableOptionalPrimaryViews(bundle) {
  return OPTIONAL_PRIMARY_VIEWS.filter(([id]) => {
    if (id === "multimodal") return hasMultimodalData(bundle);
    if (id === "replay") return Boolean(CASES[state.caseKey]?.replay);
    if (id === "protocol") return Boolean(CASES[state.caseKey]?.latest);
    return true;
  });
}

function buildPrimaryNavigation() {
  const views = [...PRIMARY_VIEWS, ...availableOptionalPrimaryViews(state.bundle)];
  buildNavigation(primaryNav, views);
  const availableIds = new Set([...PRIMARY_VIEWS, ["packet", "Бриф для консиліуму"], ...views].map(([id]) => id));
  if (!availableIds.has(state.view)) state.view = state.view === "multimodal" ? "state" : "overview";
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
    document.title = `${overviewCaseCode(state.bundle)} · ${VIEW_LABELS[state.view]} · HematoBoard AI`;
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

let caseLoadToken = 0;
let caseLoadAbort = null;

async function loadCase(caseKey, { push = false, focus = false } = {}) {
  const token = ++caseLoadToken;
  caseLoadAbort?.abort();
  const controller = new AbortController();
  caseLoadAbort = controller;
  state.caseKey = CASES[caseKey] ? caseKey : defaultCaseKey();
  caseSelect.value = state.caseKey;
  statusLine.dataset.state = "loading";
  statusLine.textContent = "Завантаження й перевірка пакета кейсу…";
  try {
    const response = await fetch(CASES[state.caseKey].bundle, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new CaseLoadError("http", `Пакет кейсу недоступний (HTTP ${response.status}).`);
    let bundle;
    try {
      bundle = await response.json();
    } catch {
      throw new CaseLoadError("malformed", "Пакет кейсу пошкоджений: це не валідний JSON. Перевірте case_bundle.json валідатором.");
    }
    if (!["1.0.0", "1.1.0", "1.2.0"].includes(bundle.schema_version)) {
      throw new CaseLoadError("schema", `Непідтримувана версія контракту: ${bundle.schema_version}.`);
    }
    if (token !== caseLoadToken) return; // a newer case selection superseded this load
    state.bundle = bundle;
    state.latestRun = null;
    state.replay = null;
    buildPrimaryNavigation();
    statusLine.dataset.state = "ready";
    statusLine.textContent = `Пакет завантажено · контракт ${bundle.schema_version} · ${bundle.case.generated || bundle.bundle_id}`;
    const provenanceHash = bundle.provenance.legacy_sha256 || bundle.provenance.source_sha256;
    footerContract.textContent = provenanceHash
      ? `пакет ${bundle.bundle_id} · джерело ${provenanceHash.slice(0, 12)}`
      : `пакет ${bundle.bundle_id}`;
    updateUrl(push);
    await renderCurrent({ focus });
  } catch (error) {
    if (error?.name === "AbortError" || token !== caseLoadToken) return;
    statusLine.dataset.state = "error";
    const typed = error instanceof CaseLoadError ? error : new CaseLoadError("network", "Пакет кейсу не завантажено: сервер не відповідає. Запустіть локальний HTTP-сервер із кореня workbench.");
    statusLine.textContent = typed.message;
    content.replaceChildren(element("section", { className: "error-panel" }, [element("h2", { text: "Пакет кейсу недоступний" }), element("p", { text: typed.message })]));
  }
}

class CaseLoadError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

function setView(view, push = false) {
  state.view = VIEW_LABELS[view] ? view : "overview";
  updateUrl(push);
  renderCurrent({ focus: true });
}

async function boot() {
  try {
    await loadCaseManifest();
  } catch (error) {
    statusLine.dataset.state = "error";
    statusLine.textContent = error instanceof Error ? error.message : String(error);
    content.replaceChildren(
      element("section", { className: "error-panel" }, [
        element("h2", { text: "Маніфест кейсів недоступний" }),
        element("p", { text: error instanceof Error ? error.message : String(error) }),
        element("p", { text: "Перевірте methodology/active_cases.json командою validate-manifest у workbench/scripts/medai_contract.py." }),
      ]),
    );
    return;
  }
  Object.entries(CASES).forEach(([key, config]) => {
    caseSelect.append(element("option", { text: config.label, attrs: { value: key } }));
  });
  buildNavigation(primaryNav, PRIMARY_VIEWS);
  packetNavAction.addEventListener("click", () => setView("packet", true));

  function handleCaseSelection() {
    const nextCase = caseSelect.value;
    if (!CASES[nextCase] || nextCase === state.caseKey) return;
    loadCase(nextCase, { push: true, focus: true });
  }

  caseSelect.addEventListener("input", handleCaseSelection);
  caseSelect.addEventListener("change", handleCaseSelection);
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    state.view = VIEW_LABELS[params.get("view")] ? params.get("view") : "overview";
    loadCase(params.get("case") || defaultCaseKey(), { push: false, focus: true });
  });

  const initial = new URLSearchParams(window.location.search);
  state.view = VIEW_LABELS[initial.get("view")] ? initial.get("view") : "overview";
  loadCase(initial.get("case") || defaultCaseKey());
}

boot();

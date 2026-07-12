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
  ["state", "Дослідження"],
  ["graph", "Граф гіпотез"],
  ["consilium", "Консиліум"],
  ["evidence", "Джерела"],
];

const OPTIONAL_PRIMARY_VIEWS = [
  ["multimodal", "Узгодженість"],
  ["protocol", "Протокол AI дебатів"],
];

const VIEW_LABELS = Object.fromEntries([...PRIMARY_VIEWS, ...OPTIONAL_PRIMARY_VIEWS, ["packet", "Бриф для консиліуму"], ["bodymap", "Локалізація"]]);
const state = { caseKey: "case02", view: "overview", bundle: null, latestRun: null };

const DISPLAY_REPLACEMENTS = [
  [/знеособлену ручну розшифровку/gi, "знеособлену агентну розшифровку"],
  [/ручну розшифровку/gi, "агентну розшифровку"],
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

// Internal enum values → clinical Ukrainian labels (never show raw enums to a clinician).
const ENUM_LABELS = {
  declared_deidentified: "задекларовано",
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

function recommendationPlanForCase(bundle) {
  const missing = (bundle.clinical_state?.panel || []).flatMap((group) =>
    (group.items || []).filter((item) => item.present === false).map((item) => ({ ...item, group: group.group })),
  );
  if (state.caseKey === "case02") {
    return [
      {
        title: "Центральний перегляд біопсійного матеріалу",
        action: "Передати референсному гематопатологу фізичні гістологічні скельця та парафіновий блок попередньої біопсії — не фото і не PDF. Повторно оцінити архітектуру вузла та зіставити її з новою ІГХ. Якщо матеріал виснажений або не показує архітектуру, клінічна команда вирішує питання біопсії свіжого зростаючого або ПЕТ-активного вузла.",
        why: "Закриває питання, чи достатньо тканини для підтвердження TFH-лімфоми та прямого диференціалу з лімфомою Ходжкіна.",
        refs: ["E3", "E7", "E8", "G4"],
        status: "Обов’язкова перевірка",
        tone: "danger",
        phase: "Для верифікації діагнозу",
      },
      {
        title: "Розширена ІГХ-панель TFH",
        action: "На актуальній тканині оцінити PD-1/CD279, CD10, BCL6, CXCL13 та ICOS. Підтвердження TFH-фенотипу потребує щонайменше 2, бажано 3 маркерів в атиповій Т-клітинній популяції разом із відповідною морфологією.",
        why: "Уточнює, чи справді атипові клітини формують TFH-лінію, а не лише мають поодинокі неспецифічні маркери.",
        refs: ["E9", "E10", "G4", "G5"],
        status: "Обов’язкова перевірка",
        tone: "danger",
        phase: "Для верифікації діагнозу",
      },
      {
        title: "Клональність Т-клітин",
        action: "Для парафінового матеріалу використати валідований тест TRB/TRG ПЛР або секвенування нового покоління. TRBC1 методом проточної цитометрії доречний лише за наявності життєздатної клітинної суспензії та коректного виділення атипової популяції.",
        why: "Підтримує або послаблює неопластичний Т-клітинний напрям; сама клональність не встановлює злоякісність чи підтип.",
        refs: ["E11", "E12", "G4"],
        status: "Треба підтвердити",
        tone: "danger",
        phase: "Для верифікації діагнозу",
      },
      {
        title: "EBER-ISH та HHV-8/LANA-1 на тканині",
        action: "Виконати EBER-ISH на актуальній діагностичній тканині та LANA-1 для HHV-8; у висновку вказати, у яких саме клітинах виявлено сигнал.",
        why: "Закриває EBV/HHV-8 та Castleman-диференціал. Негативний LANA-1 без характерної морфології сам по собі не підтверджує iMCD.",
        refs: ["E5", "E13", "G5"],
        status: "Не пропустити",
        tone: "miss",
        phase: "Паралельна перевірка",
      },
      {
        title: "Стадіювання після тканинного підтвердження",
        action: "Після підтвердження нодальної периферичної Т-клітинної лімфоми виконати ПЕТ-КТ як вихідну візуалізацію, визначити ЛДГ, а також провести аспірацію і біопсію кісткового мозку для точного стадіювання.",
        why: "Це етап визначення поширеності вже підтвердженого захворювання, а не спосіб встановити гістологічний підтип.",
        refs: ["E8", "E14", "G6"],
        status: "Після підтвердження",
        tone: "caution",
        phase: "Після тканинного підтвердження",
      },
    ];
  }
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
      "Ключова діагностична рамка",
      "Пульт показує поточний напрям, зміну доказів, розрізняльне рішення та відкриті перевірки. Ранжування підтримує аналіз і не є встановленим діагнозом.",
      `${bundle.case.id} · Огляд`,
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
    element("p", { className: "overview-eyebrow text-danger-700", text: "Поточна оцінка · ранг 01" }),
    element("h3", { className: "overview-primary-title", text: lead?.label || "Робоча гіпотеза не сформована" }),
  );
  assessmentHead.append(element("span", { className: "overview-rank-chip danger", text: "Найбільш імовірна" }), assessmentTitle);
  assessment.append(assessmentHead, element("p", { className: "overview-primary-copy", text: lead?.stance || bundle.case.signal }));
  const signals = element("div", { className: "overview-signal-row", attrs: { "aria-label": "Опорні сигнали" } });
  const leadRefs = lead?.data_refs?.length ? lead.data_refs : bundle.facts.slice(-4).map((fact) => fact.id);
  leadRefs.slice(0, 4).forEach((ref) => signals.append(element("span", { text: factById(ref)?.label || ref })));
  assessment.append(signals);
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

function renderEvidence() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    viewHeader(
      "Джерела",
      "Каталог публікацій, настанов і первинних документів, на яких ґрунтуються гіпотези. Клінічні прогалини та потрібні дослідження зібрані окремо у вкладці «Дослідження».",
    ),
  );

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
    const caseLabels = {
      case02: {
        H1: "Нодальна TFH-лімфома / ПТКЛ", H2: "Класична лімфома Ходжкіна", H3: "Хвороба Каслмана",
        H4: "Саркоїдоз", H5: "Вірусна лімфопроліферація", H6: "Реактивний лімфаденіт",
        H7: "Метастатична карцинома", H8: "Інфекційний / ТБ-лімфаденіт",
      },
      case05: {
        H1: "LCDD / MIDD", H2: "PGNMID / MGRS-гломерулопатія", H3: "Імунокомплексний / інфекційний ГН",
        H4: "AL-амілоїдоз", H5: "Діабетичний гломерулосклероз", H6: "Мембранозна нефропатія",
        H7: "Мієломна нефропатія", H8: "Фібрилярний / імунотактоїдний ГН",
      },
    };
    return caseLabels[state.caseKey]?.[item.id] || wordClip(item.label, 38);
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
    buildPrimaryNavigation();
    statusLine.dataset.state = "ready";
    statusLine.textContent = `Пакет перевірено · ${bundle.case.generated || bundle.bundle_id}`;
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
  loadCase(params.get("case") || "case02", { push: false, focus: true });
});

const initial = new URLSearchParams(window.location.search);
state.view = VIEW_LABELS[initial.get("view")] ? initial.get("view") : "overview";
loadCase(initial.get("case") || "case02");

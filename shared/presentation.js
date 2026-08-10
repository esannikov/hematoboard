/** Shared text and label presentation helpers for every dashboard surface. */

export function meaningfulText(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return /^(?:null|undefined)$/iu.test(text) ? "" : text;
}

export function displayText(value) {
  // Clinical and source text is rendered verbatim. Localisation belongs in
  // typed UI-label maps, never in a global replacement pass over evidence.
  return meaningfulText(value);
}

export function panelText(value) {
  return displayText(value);
}

export function textValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(textValue).join(" · ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${textValue(item)}`)
      .join(" · ");
  }
  return displayText(value);
}

export function clipped(value, length = 46) {
  const text = textValue(value);
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export function wordClip(value, maxLen = 46) {
  const text = displayText(String(value));
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const index = cut.lastIndexOf(" ");
  const base = index > maxLen * 0.55 ? cut.slice(0, index) : cut;
  return `${base.replace(/[\s,;:.–—-]+$/u, "")}…`;
}

export const LABELS = {
  enum: {
    declared_deidentified: "задекларовано",
    declared_deidentified_canonical_text_only: "знеособлено в доступному тексті",
    human_source_review_pass: "джерельний шар перевірено людиною",
    technical_verified: "технічну цілісність перевірено",
    recorded_candidate: "зафіксовано в документі",
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
    laboratory: "Лабораторний документ", imaging: "Візуалізація", pathology: "Патоморфологія та ІГХ",
    consultation: "Консультація", procedure: "Процедура", hospital_record: "Клінічний запис", other: "Інший документ",
  },
  enumTone: {
    present: "evidence", audited: "evidence", discordant: "critical", high_signal_partial: "candidate",
    partial: "candidate", decisive: "critical", high: "candidate", urgent: "critical",
    candidate: "candidate", critical: "critical", gap: "critical", neoplasm: "critical",
    "non-diagnostic": "candidate", partial_refute: "candidate", reactive: "evidence",
    refute: "candidate", suspicious: "candidate",
  },
  hypothesisStatus: {
    candidate: "кандидат · потребує перевірки лікарем",
    leading: "провідна робоча гіпотеза",
    "leading-provisional": "потребує верифікації",
    critical: "провідна лінія",
    supported: "підтримано матеріалами",
    open: "потребує перевірки",
    watch: "перевірити",
    safety: "критичний диференціал",
    "must-resolve": "потребує верифікації",
    "must-not-miss": "критичний диференціал",
    weak: "можливий варіант із меншою ймовірністю",
    downgraded: "можливий варіант із меншою ймовірністю",
    possible_lower: "можливий варіант із меншою ймовірністю",
    unlikely: "малоймовірний варіант",
    attention: "потребує окремої перевірки",
    must_not_miss: "критичний диференціал",
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
    protocol: "клінічний протокол · попередній слід",
    evidence_summary: "огляд доказів · попередній слід",
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

export function enumLabel(value) {
  if (value === true) return "виконано";
  if (value === false) return "не виконано";
  if (value === null || value === undefined || value === "") return "—";
  const key = String(value);
  return LABELS.enum[key] || LABELS.enum[key.toLowerCase()] || displayText(key);
}

export function enumTone(value) {
  return LABELS.enumTone[String(value).toLowerCase()] || "";
}

export function verificationLabel(level) {
  return LABELS.verification[level] || [level || "—", ""];
}

export function wrapLines(value, maxChars, maxLines = 2) {
  const words = displayText(String(value)).split(/\s+/u);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  const shown = lines.join(" ");
  const full = displayText(String(value));
  if (shown.length < full.length && lines.length) {
    lines[lines.length - 1] = wordClip(`${lines[lines.length - 1]} ${full.slice(shown.length).trim()}`, maxChars);
  }
  return lines;
}

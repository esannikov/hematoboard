const FACT_DOMAIN_LABELS = {
  clinical: "Клінічна траєкторія",
  timeline: "Клінічна траєкторія",
  treatment_history: "Відповідь на лікування",
  imaging: "Візуалізація",
  lab: "Лабораторні дані",
  labs: "Лабораторні дані",
  marker: "Маркери",
  pathology: "Морфологія та ІГХ",
  path: "Морфологія та ІГХ",
  marrow: "Кістковий мозок",
  source_interpretation: "Висновок джерела",
  source_quality: "Якість джерела",
  gap: "Прогалини джерела",
};

const DOMAIN_ORDER = [
  "clinical",
  "timeline",
  "treatment_history",
  "imaging",
  "lab",
  "labs",
  "marker",
  "pathology",
  "path",
  "marrow",
  "source_interpretation",
  "source_quality",
  "gap",
];

const THERMAL_LABELS = {
  hot: "щільне доказове покриття",
  warm: "часткове доказове покриття",
  cool: "сигнал є, прогалини залишаються",
  cold: "відкрита прогалина",
  fracture: "суперечливі дані",
  unmapped: "зв’язок не записано",
};

function values(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeKey(value) {
  return String(value || "")
    .toLocaleLowerCase("uk-UA")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function stableId(prefix, value, index = 0) {
  const slug = normalizeKey(value).replace(/\s+/gu, "-").slice(0, 44);
  return `${prefix}-${slug || index + 1}`;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function hypotheses(bundle) {
  return values(bundle?.hypotheses).slice().sort((left, right) => {
    const a = Number.isFinite(Number(left?.rank)) ? Number(left.rank) : Number.MAX_SAFE_INTEGER;
    const b = Number.isFinite(Number(right?.rank)) ? Number(right.rank) : Number.MAX_SAFE_INTEGER;
    return a - b || String(left?.id || "").localeCompare(String(right?.id || ""));
  });
}

function fallbackColumns(bundle) {
  const grouped = new Map();
  values(bundle?.facts).forEach((fact) => {
    const domain = String(fact?.domain || "other");
    if (!grouped.has(domain)) grouped.set(domain, []);
    grouped.get(domain).push(fact);
  });
  return [...grouped.entries()]
    .sort(([a], [b]) => {
      const ai = DOMAIN_ORDER.indexOf(a);
      const bi = DOMAIN_ORDER.indexOf(b);
      return (ai < 0 ? DOMAIN_ORDER.length : ai) - (bi < 0 ? DOMAIN_ORDER.length : bi) || a.localeCompare(b);
    })
    .map(([domain, facts], index) => ({
      id: stableId("domain", domain, index),
      label: FACT_DOMAIN_LABELS[domain] || domain,
      status: "recorded",
      signal: `${facts.length} типізованих фактів у пакеті кейсу.`,
      hypothesisIds: [],
      gaps: [],
      factIds: facts.map((fact) => fact.id),
      kind: "fact_domain",
      sourceLabel: "Типізовані факти",
    }));
}

function modalityColumns(bundle) {
  return values(bundle?.methodology?.multimodal?.modalities).map((modality, index) => ({
    id: stableId("modality", modality?.label, index),
    label: String(modality?.label || `Модальність ${index + 1}`),
    status: String(modality?.status || "recorded"),
    signal: String(modality?.signal || "Сигнал не записано."),
    hypothesisIds: unique(values(modality?.supports).map(String)),
    gaps: unique(values(modality?.gaps).map(String)),
    factIds: [],
    kind: "modality",
    sourceLabel: "Узгодженість модальностей",
  }));
}

function normalizeWorkup(bundle) {
  return values(bundle?.methodology?.workup).map((item, index) => {
    const refs = values(item?.scope?.hypothesis_refs)
      .map((ref) => typeof ref === "string" ? ref : ref?.id)
      .filter((id) => /^H[\w-]+$/u.test(String(id || "")))
      .map(String);
    return {
      id: String(item?.id || `W${index + 1}`),
      title: String(item?.title || item?.action || `Крок верифікації ${index + 1}`),
      action: String(item?.action || "Дію не записано."),
      why: String(item?.why || "Клінічне питання не записано."),
      phase: String(item?.phase || "Діагностична верифікація"),
      tone: String(item?.tone || "caution"),
      evidenceRefs: unique(values(item?.evidence_refs).map(String)),
      hypothesisIds: unique(refs),
    };
  });
}

function makeBridge({ id, title, detail, action, phase, tone, evidenceRefs = [], hypothesisIds = [], domainIds = [], origin }) {
  return {
    id,
    title,
    detail,
    action,
    phase,
    tone,
    evidenceRefs: unique(evidenceRefs),
    hypothesisIds: unique(hypothesisIds),
    domainIds: unique(domainIds),
    origin,
  };
}

function mergeBridges(bridges) {
  const merged = new Map();
  bridges.forEach((bridge) => {
    const key = normalizeKey(bridge.title);
    if (!key) return;
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...bridge });
      return;
    }
    current.hypothesisIds = unique([...current.hypothesisIds, ...bridge.hypothesisIds]);
    current.domainIds = unique([...current.domainIds, ...bridge.domainIds]);
    current.evidenceRefs = unique([...current.evidenceRefs, ...bridge.evidenceRefs]);
    if (current.origin !== "workup" && bridge.origin === "workup") {
      current.id = bridge.id;
      current.detail = bridge.detail;
      current.action = bridge.action;
      current.phase = bridge.phase;
      current.tone = bridge.tone;
      current.origin = bridge.origin;
    }
  });
  return [...merged.values()];
}

function relationCounts(bundle, hypothesisId, factIds) {
  const allowedFacts = new Set(factIds);
  return values(bundle?.relations)
    .filter((relation) => relation?.hypothesis_id === hypothesisId && (!allowedFacts.size || allowedFacts.has(relation?.fact_id)))
    .reduce((counts, relation) => {
      const relationType = ["support", "refute", "neutral"].includes(relation?.relation) ? relation.relation : "neutral";
      counts[relationType] += 1;
      return counts;
    }, { support: 0, refute: 0, neutral: 0 });
}

function thermalState({ relevant, status, gapCount, counts, isVerification }) {
  const hasRelations = counts.support + counts.refute + counts.neutral > 0;
  if ((counts.support > 0 && counts.refute > 0) || (relevant && status === "discordant")) return "fracture";
  if (isVerification && gapCount > 0) return "cold";
  if (relevant && gapCount > 0) {
    if (["present", "audited", "high_signal_partial"].includes(status)) return "cool";
    return "cold";
  }
  if (gapCount > 0 && !relevant && !hasRelations) return "cold";
  if (relevant && ["present", "audited"].includes(status)) return "hot";
  if (relevant || hasRelations) return counts.support >= 2 && counts.refute === 0 ? "hot" : "warm";
  return "unmapped";
}

export function projectGapMap(bundle) {
  const orderedHypotheses = hypotheses(bundle);
  const workup = normalizeWorkup(bundle);
  const modalities = modalityColumns(bundle);
  const columns = modalities.length ? modalities : fallbackColumns(bundle);
  const scopedWorkup = workup.filter((item) => item.hypothesisIds.length);
  if (scopedWorkup.length) {
    columns.push({
      id: "verification",
      label: "Діагностична верифікація",
      status: "missing",
      signal: "Кроки, які мають розрізнити або підтвердити робочі гіпотези.",
      hypothesisIds: unique(scopedWorkup.flatMap((item) => item.hypothesisIds)),
      gaps: scopedWorkup.map((item) => item.title),
      factIds: [],
      kind: "verification",
      sourceLabel: "План верифікації",
    });
  }

  const workupBridges = workup.map((item) => makeBridge({
    id: item.id,
    title: item.title,
    detail: item.why,
    action: item.action,
    phase: item.phase,
    tone: item.tone,
    evidenceRefs: item.evidenceRefs,
    hypothesisIds: item.hypothesisIds,
    domainIds: item.hypothesisIds.length ? ["verification"] : [],
    origin: "workup",
  }));
  const modalityBridges = columns
    .filter((column) => column.kind === "modality")
    .flatMap((column) => column.gaps.map((gap, index) => makeBridge({
      id: `${column.id}-gap-${index + 1}`,
      title: gap,
      detail: column.signal,
      action: gap,
      phase: column.label,
      tone: column.status === "discordant" ? "danger" : "caution",
      hypothesisIds: column.hypothesisIds,
      domainIds: [column.id],
      origin: "modality",
    })));
  const bridges = mergeBridges([...workupBridges, ...modalityBridges]);

  const cells = orderedHypotheses.flatMap((hypothesis) => columns.map((column) => {
    const relevant = column.hypothesisIds.includes(hypothesis.id);
    const linkedWorkup = column.kind === "verification"
      ? workup.filter((item) => item.hypothesisIds.includes(hypothesis.id))
      : [];
    const gaps = column.kind === "verification"
      ? linkedWorkup.map((item) => item.title)
      : relevant ? column.gaps : [];
    const counts = column.kind === "fact_domain"
      ? relationCounts(bundle, hypothesis.id, column.factIds)
      : { support: 0, refute: 0, neutral: 0 };
    const thermal = thermalState({
      relevant,
      status: column.status,
      gapCount: gaps.length,
      counts,
      isVerification: column.kind === "verification",
    });
    return {
      id: `${hypothesis.id}--${column.id}`,
      hypothesisId: hypothesis.id,
      columnId: column.id,
      thermal,
      label: THERMAL_LABELS[thermal],
      relevant,
      status: column.status,
      signal: relevant || column.kind === "verification" || counts.support + counts.refute + counts.neutral
        ? column.signal
        : "Для цієї гіпотези типізований зв’язок із модальністю не записано.",
      gaps,
      workupIds: linkedWorkup.map((item) => item.id),
      relationCounts: counts,
    };
  }));

  const observations = values(bundle?.observations);
  const verified = observations.filter((item) => item?.verification?.human_verified === true).length;
  const sourceGaps = observations
    .filter((item) => item?.kind === "gap")
    .map((item) => ({
      id: String(item.id),
      title: String(item.display || item.value_text || "Неповний джерельний фрагмент"),
      detail: String(item.value_text || item.interpretation || "Потребує перевірки первинного документа."),
      page: item.page ?? item.source_address?.page ?? null,
      documentId: item.document_id || null,
    }));
  const unscopedModalityGaps = columns
    .filter((column) => column.kind === "modality" && !column.hypothesisIds.length)
    .flatMap((column) => column.gaps.map((gap, index) => ({
      id: `${column.id}-unscoped-${index + 1}`,
      title: gap,
      detail: `${column.label}: ${column.signal}`,
      page: null,
      documentId: null,
    })));
  const hypothesesWithoutTypedLinks = orderedHypotheses.filter((hypothesis) => {
    const hasRelation = values(bundle?.relations).some((relation) => relation?.hypothesis_id === hypothesis.id);
    const hasModality = columns.some((column) => column.hypothesisIds.includes(hypothesis.id));
    const hasWorkup = workup.some((item) => item.hypothesisIds.includes(hypothesis.id));
    return !hasRelation && !hasModality && !hasWorkup;
  });

  const metrics = cells.reduce((summary, cell) => {
    summary[cell.thermal] = (summary[cell.thermal] || 0) + 1;
    return summary;
  }, { hot: 0, warm: 0, cool: 0, cold: 0, fracture: 0, unmapped: 0 });
  metrics.sharedBridges = bridges.filter((bridge) => bridge.origin === "workup" && bridge.hypothesisIds.length > 1).length;

  return {
    hypotheses: orderedHypotheses,
    columns,
    cells,
    bridges,
    sourcePerimeter: [...sourceGaps, ...unscopedModalityGaps],
    hypothesesWithoutTypedLinks,
    sourceVerification: {
      total: observations.length,
      verified,
      pending: Math.max(0, observations.length - verified),
    },
    metrics,
  };
}

export const GAP_THERMAL_LABELS = THERMAL_LABELS;

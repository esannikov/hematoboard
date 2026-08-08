/**
 * Deterministic adapter from an immutable candidate reasoning revision to the
 * read-only dashboard surfaces. The adapter never promotes candidate content
 * into the accepted case bundle; it only creates a view-scoped projection.
 */

const OBSERVATION_DOMAINS = Object.freeze({
  measurement: "lab",
  imaging_finding: "imaging",
  pathology_finding: "path",
  diagnostic_interpretation: "source_interpretation",
  negative_finding: "source_quality",
  procedure: "clinical",
  recommendation: "gap",
  clinical_note: "clinical",
  gap: "gap",
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
}

function observationValue(observation) {
  if (observation?.value_number !== null && observation?.value_number !== undefined) {
    return compactText(`${observation.value_number}${observation.unit ? ` ${observation.unit}` : ""}`);
  }
  return compactText(observation?.value_text);
}

export function observationClinicalDetail(observation) {
  const parts = [];
  const value = observationValue(observation);
  if (value) parts.push(`Результат: ${value}`);
  if (observation?.reference_range) parts.push(`референс: ${compactText(observation.reference_range)}`);
  if (observation?.interpretation) parts.push(compactText(observation.interpretation));
  if (observation?.effective_at) parts.push(`дата: ${observation.effective_at}`);
  const page = observation?.page ?? observation?.source_address?.page;
  if (page) parts.push(`сторінка ${page}`);
  return parts.join(" · ") || "Знахідку записано у прийнятому джерельному шарі.";
}

function projectedFact(observation) {
  return {
    id: observation.id,
    label: compactText(observation.display || observation.value_text || observation.id),
    detail: observationClinicalDetail(observation),
    domain: OBSERVATION_DOMAINS[observation.kind] || "clinical",
    grounding_class: "anchored",
    source_refs: [],
    source_observation_id: observation.id,
    source_document_id: observation.document_id || null,
    source_page: observation.page ?? observation.source_address?.page ?? null,
    effective_at: observation.effective_at || null,
    linchpin: false,
  };
}

function projectedClaim(claim) {
  return {
    id: claim.id,
    label: compactText(claim.text || claim.label || claim.id),
    detail: compactText(claim.text || "Зовнішнє доказове твердження з прийнятого пакета."),
    domain: claim.kind === "gap" ? "gap" : "external_evidence",
    grounding_class: "anchored",
    source_refs: asArray(claim.source_refs),
    source_claim_id: claim.id,
    linchpin: false,
  };
}

function projectedHypothesis(hypothesis) {
  return {
    ...hypothesis,
    short_label: hypothesis.short_label || hypothesis.label,
    stance: hypothesis.rationale,
    status: Number(hypothesis.rank) === 1 ? "leading-provisional" : "candidate",
    data_refs: [
      ...asArray(hypothesis.support_refs),
      ...asArray(hypothesis.refute_refs),
      ...asArray(hypothesis.neutral_refs),
    ],
    confirms: asArray(hypothesis.discriminating_checks)[0] || "Критерій підтвердження не записано.",
    refutes: asArray(hypothesis.applicability_limits)[0] || "Критерій зміни напряму не записано.",
  };
}

function projectedWorkup(revision, hypotheses) {
  const rankById = new Map(hypotheses.map((item) => [item.id, Number(item.rank)]));
  return asArray(revision?.workup).map((item) => ({
    id: item.id,
    title: item.title,
    action: item.title,
    why: item.rationale,
    evidence_refs: [],
    status: item.priority === "critical"
      ? "Першочергова перевірка"
      : item.priority === "high" ? "Високий пріоритет" : "За клінічною потребою",
    tone: item.priority === "critical" ? "danger" : item.priority === "high" ? "caution" : "neutral",
    phase: item.priority === "critical"
      ? "Верифікація підтипу"
      : item.priority === "high" ? "Паралельні перевірки" : "Наступний етап",
    scope: {
      kind: "hypotheses",
      hypothesis_refs: asArray(item.discriminates).map((id) => ({
        id,
        role: rankById.get(id) === 1
          ? "leading"
          : rankById.get(id) === 2 ? "direct_differential" : "critical_differential",
      })),
    },
  }));
}

/**
 * Return a fail-closed candidate projection. Missing observation references
 * are surfaced as errors instead of silently producing an incomplete graph.
 */
export function projectCandidateReasoning(bundle, candidate) {
  if (candidate?.status !== "ok" || !candidate.revision) {
    return { status: "absent", errors: [], revision: null, bundle };
  }
  const revision = candidate.revision;
  const observations = asArray(bundle?.observations);
  const acceptedEvidenceById = new Map([
    ...asArray(bundle?.facts).map((item) => [item?.id, item]),
    ...asArray(bundle?.claims).map((item) => [item?.id, projectedClaim(item)]),
    ...observations.map((item) => [item?.id, projectedFact(item)]),
  ]);
  const hypotheses = asArray(revision.hypotheses)
    .slice()
    .sort((left, right) => Number(left?.rank) - Number(right?.rank))
    .map(projectedHypothesis);
  const hypothesisIds = new Set(hypotheses.map((item) => item.id));
  const errors = [];
  const relations = asArray(revision.relations).map((relation, index) => {
    const factId = relation?.evidence_ref;
    if (!acceptedEvidenceById.has(factId)) errors.push(`relations[${index}].evidence_ref=${factId || "missing"}`);
    if (!hypothesisIds.has(relation?.hypothesis_id)) errors.push(`relations[${index}].hypothesis_id=${relation?.hypothesis_id || "missing"}`);
    return {
      fact_id: factId,
      hypothesis_id: relation?.hypothesis_id,
      relation: relation?.relation,
    };
  });
  const referencedEvidenceIds = [...new Set(relations.map((item) => item.fact_id).filter(Boolean))];
  const facts = referencedEvidenceIds.map((id) => acceptedEvidenceById.get(id)).filter(Boolean);
  const workup = projectedWorkup(revision, hypotheses);
  const projectedBundle = {
    ...bundle,
    facts,
    hypotheses,
    relations,
    methodology: {
      ...(bundle?.methodology || {}),
      workup,
      candidate_revision: {
        reasoning_revision_id: revision.reasoning_revision_id,
        critical_gaps: asArray(revision.critical_gaps),
        source: "immutable_candidate_revision",
      },
    },
  };
  return {
    status: errors.length ? "invalid" : "ok",
    errors,
    revision,
    facts,
    hypotheses,
    relations,
    workup,
    bundle: projectedBundle,
  };
}

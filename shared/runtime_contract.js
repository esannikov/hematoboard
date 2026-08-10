/** Fail-closed loading of the dashboard projection contract and case registry. */

export class ManifestError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

export function projectionContractIsCompatible(contract) {
  const schemaMatch = /^hematoboard\.dashboard-projection-contract\/(\d+)\.(\d+)\.(\d+)$/u
    .exec(String(contract?.schema_version || ""));
  const supported = Array.isArray(contract?.supported_bundle_schema_versions)
    ? contract.supported_bundle_schema_versions.filter((value) => typeof value === "string" && value.length)
    : [];
  return Boolean(
    schemaMatch
    && Number(schemaMatch[1]) === 1
    && supported.length
    && typeof contract?.current_bundle_schema_version === "string"
    && supported.includes(contract.current_bundle_schema_version)
    && contract.require_post_synthesis_browser_projection_audit === true
    && contract.forbid_case_clinical_literals_in_page_code === true
  );
}

async function fetchJson(url, messages) {
  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new ManifestError("network", messages.network);
  }
  if (!response.ok) throw new ManifestError("http", `${messages.http} (HTTP ${response.status}).`);
  try {
    return await response.json();
  } catch {
    throw new ManifestError("malformed", messages.malformed);
  }
}

export async function loadProjectionContract(url) {
  const contract = await fetchJson(url, {
    network: "Контракт проєкції dashboard недоступний: немає відповіді від сервера.",
    http: "Контракт проєкції dashboard недоступний",
    malformed: "Контракт проєкції dashboard пошкоджений: це не валідний JSON.",
  });
  if (!projectionContractIsCompatible(contract)) {
    throw new ManifestError("malformed", "Контракт проєкції dashboard неповний або несумісний.");
  }
  return new Set(contract.supported_bundle_schema_versions);
}

export async function loadCaseManifest(url) {
  const manifest = await fetchJson(url, {
    network: "Маніфест кейсів недоступний: немає відповіді від сервера.",
    http: "Маніфест кейсів недоступний",
    malformed: "Маніфест кейсів пошкоджений: це не валідний JSON.",
  });
  if (!manifest || !Array.isArray(manifest.cases) || !manifest.cases.length) {
    throw new ManifestError("malformed", "Маніфест кейсів не містить жодного кейсу.");
  }
  const active = manifest.cases.filter((entry) => entry && entry.status === "active");
  if (!active.length) throw new ManifestError("malformed", "У маніфесті немає жодного активного кейсу.");
  return Object.fromEntries(
    active.map((entry) => [
      entry.key,
      {
        caseId: entry.case_id,
        label: entry.label,
        bundle: entry.bundle,
        latest: entry.latest ?? null,
        latestRole: entry.latest_role ?? null,
        replay: entry.replay ?? null,
        replayRole: entry.replay_role ?? null,
        reasoningCandidate: entry.reasoning_candidate ?? null,
        reasoningCandidateRole: entry.reasoning_candidate_role ?? null,
        review: entry.review === true,
        default: entry.default === true,
      },
    ]),
  );
}

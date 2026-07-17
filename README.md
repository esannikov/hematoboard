# HematoBoard

Public, read-only methodology viewer for prepared and de-identified
oncohaematology case bundles.

Live site: <https://esannikov.github.io/hematoboard/>

## What the viewer shows

- a source-bound case overview and document chronology;
- an explicit chain `fact → claim → source → hypothesis`, with each claim's verification level and limitation;
- ranked differential hypotheses, evidence links and unresolved checks;
- a graph of relations between findings and hypotheses;
- a deterministic evidence replay ("Докази в часі"): time slices of the frozen evidence graph for CASE-02 — when evidence first separated the final hypothesis pair, with no model calls and no invented past reasoning;
- a recorded agent-debate protocol where a run is available, with the run hash verified in the browser;
- a concise board brief.

The viewer supports review and discussion. It does not establish a diagnosis or
issue treatment instructions; clinical decisions remain with the responsible
clinician and the complete primary context. Debate records are reproducible
operator runs based on prepared role seeds; they are not live LLM executions.
The case registry is read from `active_cases.json`; case-specific clinical
content lives only in the validated bundles, never in the renderer.

## Public-data boundary

This repository intentionally contains only the static viewer, local fonts,
the HematoBoard mark, three prepared de-identified case bundles, the CASE-02
replay artifact and the two current minimal run artifacts required for the
protocol view. It excludes original clinical documents, source packets,
licensed guideline corpora, raw audit logs, local paths and credentials.

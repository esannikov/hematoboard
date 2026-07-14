# HematoBoard

Public, read-only methodology viewer for prepared and de-identified
oncohaematology case bundles.

Live site: <https://esannikov.github.io/hematoboard/>

## What the viewer shows

- a source-bound case overview and document chronology;
- an explicit chain `fact → claim → source → hypothesis`, with each claim's verification level and limitation;
- ranked differential hypotheses, evidence links and unresolved checks;
- a graph of relations between findings and hypotheses;
- a recorded agent-debate protocol where a run is available;
- a concise board brief.

The viewer supports review and discussion. It does not establish a diagnosis or
issue treatment instructions; clinical decisions remain with the responsible
clinician and the complete primary context. Debate records are reproducible
operator runs based on prepared role seeds; they are not live LLM executions.

## Public-data boundary

This repository intentionally contains only the static viewer, local fonts,
the HematoBoard mark, three prepared de-identified case bundles and the two
current minimal run artifacts required for the protocol view. It excludes original
clinical documents, source packets, licensed guideline corpora, raw audit logs,
local paths and credentials.

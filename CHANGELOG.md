# Changelog

## [0.2.7.1] - 2026-08-22

### Fixed

- Removed detached hypothesis-chip rows and duplicate divider rhythm from the compact critical-gap list.
- Restored V1-style evidence chips with semantic source colors and short source names inside each chip.
- Promoted “Підтримувальні факти” and “Що обмежує висновок” to a consistent semantic and visual H2 hierarchy.
- Normalized same-role typography inside overview infoboxes and replaced long related-hypothesis links with compact accessible chips.

### Verification

- Product Design screenshot-to-code QA passed against combined V1/V2 comparison sheets.
- The shared shell passed desktop, tablet and mobile QA for all ten public cases with 18 screenshots per case.
- Clinical JSON, candidate hashes, differential bars and `clinician_accepted=false` remain unchanged.

## [0.2.7.0] - 2026-08-22

### Changed

- Restored HematoBoard V1 as the canonical clinical-cockpit composition across overview, timeline, graph, data, gaps and reasoning surfaces.
- Rebuilt critical gaps as a compact disclosure list and diagnostic workup as a numbered, source-linked V1 card sequence.
- Restored source-aware quantitative rows with visible reference ranges, units and source addresses without inferring temporal trends.
- Added reproducible deep links for the selected view and hypothesis, a five-destination mobile navigation, and direct access to the reasoning narrative from the case strip.
- Replaced arbitrary source excerpts in the case strip with the leading candidate's concise problem representation.

### Preserved

- Differential bars and their visual encoding remain unchanged by explicit user decision.
- Clinical JSON, candidate hashes and `clinician_accepted=false` remain unchanged.

### Verification

- The shared shell passed full desktop, tablet and mobile QA for all ten public cases, with 18 screenshots per case and zero console or page-overflow findings.

## [0.2.6.2] - 2026-08-21

### Fixed

- Replaced the unloaded Roboto declaration and browser-dependent fallback with one explicit system font stack across the full dashboard.
- Normalized source typography across the overview, graph traces, critical gaps and reasoning log: 16 px titles, 14 px clinical copy and 12 px metadata, chips and actions.
- Added computed-style QA that rejects mixed font families or role-specific size drift on desktop, tablet and mobile.

### Safety

- The shared shell passed full desktop, tablet and mobile QA for all ten public cases. Clinical JSON, candidate hashes and `clinician_accepted=false` remain unchanged.

## [0.2.6.1] - 2026-08-21

### Fixed

- Restored V1-style clickable source chips and working external-source actions in the overview, graph source traces and critical gaps.
- Routed visible diagnostic-hypothesis links from supporting facts and verification surfaces directly to the selected hypothesis in the graph.
- Removed DOI, PMID, PMCID, NCBI record IDs and SHA-256 receipts from visible source headings while preserving the exact bibliographic records in the public package.

### Safety

- The shared shell passed full desktop, tablet and mobile QA for all ten public cases. Clinical JSON, candidate hashes and `clinician_accepted=false` remain unchanged.

## [0.2.6.0] - 2026-08-21

### Added

- Published `CASE011` with 41 reviewed source facts, five ranked diagnostic hypotheses and three non-ranked clinical roles.
- Added a clinician-facing reasoning history covering the splenic mass, cytopenias, marrow findings, source evidence and the tissue-verification pathway.

### Changed

- Prioritized a primary vascular or stromal splenic neoplasm while retaining splenic angiosarcoma, primary splenic lymphoma, an unconfirmed clonal myeloproliferative process and Gaucher disease as explicit alternatives.
- Added public-safe DOI, PMCID, NCBI Bookshelf and CDC source links.

### Safety

- `CASE011` passed the final independent critic with 0 unresolved critical and 0 unresolved high findings. The package remains candidate-only with `projection_verified=true` and `clinician_accepted=false`.

## [0.2.5.0] - 2026-08-21

### Added

- Published `CASE009` from `Кейс №9.docx` after a fresh V2 differential search, exact-page source review, bounded clinical repair and independent critic closure.
- Added a clinician-facing reasoning history with 19 semantic blocks and the chronology from the 2021 resected clonal plasma-cell tumor to the 2025 paracolic nodule.
- Preserved the recorded quantitative trajectories for plasma cells, M-protein and blast cells as distinct signals with their source dates.

### Changed

- Calibrated the leading candidate to a suspicion of local recurrence of the previously resected clonal plasma-cell tumor while keeping definitive recurrence attribution open for tissue verification.
- Kept plasma-cell myeloma, plasmacytic lymphomas, aggressive lymphoma, an incidental nodule and a parallel gastrointestinal process in their appropriate clinical roles.

### Safety

- `CASE009` passed the final independent critic with 0 unresolved critical and 0 unresolved high findings. The package remains candidate-only with `projection_verified=true` and `clinician_accepted=false`.

## [0.2.4.0] - 2026-08-21

### Added

- Published `CASE004` from `Кейс №4.docx` after a fresh V2 differential search, exact-page source review, bounded repair and independent critic closure.
- Added a clinician-facing reasoning history with 18 semantic blocks, 21 patient supports and all six accepted source propositions.
- Added MCV, MCH and five anemia-panel measurements to the quantitative projection; absent panel units remain explicitly unresolved.

### Changed

- Prioritized a thalassemia-spectrum or other inherited hemoglobinopathy as the working candidate while retaining isolated and combined iron deficiency as active alternatives.
- Restricted rare inherited iron-regulation, celiac, toxic and marrow investigations to their recorded clinical triggers.

### Safety

- `CASE004` passed the final independent critic with 0 unresolved critical and 0 unresolved high findings. The package remains candidate-only with `projection_verified=true` and `clinician_accepted=false`.

## [0.2.3.0] - 2026-08-21

### Added

- Published `CASE008` from `Кейс №8.docx` after fresh V2 intake, nine-candidate differential search, exact-page source review, bounded repair and independent critic closure.
- Added a 1,220-word clinician-facing investigation story with 20 semantic blocks, 34 patient supports and all eight accepted external sources.
- Added a provenance-bound clinician context for procedural feasibility: biopsy of other lymph nodes is technically difficult.

### Changed

- Prioritized complete review and amyloid typing of available tissue before considering another technically difficult tissue-acquisition route.
- Kept the biopsy-feasibility note separate from diagnostic evidence and included it in the clinical-input hash.

### Safety

- `CASE008` passed the final independent critic with 0 unresolved critical and 0 unresolved high findings. The package remains candidate-only with `projection_verified=true` and `clinician_accepted=false`.

## [0.2.2.0] - 2026-08-20

### Fixed

- Restored the established `Факти пацієнта → гіпотези` graph with ranked diagnostic hypotheses only; complications, concurrent conditions and data-quality findings remain in their own overview sections.
- Replaced reasoning-log copy in the `CASE###` strip with a short deterministic patient summary built from demographics and recorded clinical facts.
- Kept hypothesis headings to the medical diagnosis name and removed internal role rationale such as `може самостійно пояснити` from the overview and graph.
- Removed rank-placeholder dots and made every visible hypothesis reference actionable across supporting facts, source traces, critical gaps and verification steps.
- Routed diagnostic links to the graph and non-diagnostic clinical roles to their correct overview section.

### Safety

- All five published cases passed shared-shell interaction checks, full desktop/tablet/mobile projection QA, and preserved their existing clinical JSON and candidate hashes.

## [0.2.1.0] - 2026-08-20

### Changed

- Improved the vertical rhythm and typography of the leading diagnosis card, evidence columns, differential list and graph inspector.
- Diagnostic hypotheses now use consistent `H1`, `H2`, … labels in the overview and graph on desktop and mobile.

### Fixed

- Prevented long guideline and classification titles from leaving critical-gap cards.
- Restored colored source-type chips for guidelines, classifications, evidence reviews and PubMed records.

## [0.2.0.0] - 2026-08-20

### Added

- Added medically explicit clinical roles to every candidate item: diagnostic hypothesis, complication or clinical syndrome, concurrent condition, incidental finding, and data-quality limitation.
- Added Ukrainian role explanations to every clinical item and separate role-aware sections in the overview, graph, timeline, gaps and clinician reasoning story.

### Changed

- Diagnostic rank now applies only to conditions that can explain the main clinical pattern.
- CASE001 now shows ten ranked diagnoses, secondary HLH as a complication, humoral immune dysfunction as a concurrent condition, and the thyroid nodule as an incidental finding.
- CASE003 now separates five ranked diagnoses from a possible second skeletal process and an analytical/data-quality issue.
- CASE006 now shows nine ranked diagnoses; thrombus, secondary HLH and shock are complications, Castleman disease and the gastric lesion are concurrent processes, and the ovarian teratoma is an incidental finding.
- CASE007 now separates four ranked diagnoses from a concurrent hypoplastic marrow process.
- CASE002 retains five competing anterior-mediastinal diagnoses with medically explicit role rationales.

### Fixed

- Removed H-codes, evidence IDs, raw source locators and English enum values from the main clinician-facing role and workup labels.
- Replaced the generic graph heading with `Факти пацієнта → клінічні інтерпретації` and grouped every non-diagnostic item under its own medical heading.
- Corrected CASE001 and CASE002 narrative source bindings from aggregate signals to exact patient facts.

### Safety

- Every role-aware candidate passed an independent Sol critic with 0 unresolved critical and 0 unresolved high findings. All five projections remain candidate-only with `clinician_accepted=false`.

## [0.1.7.0] - 2026-08-20

### Added

- Published `CASE007` from `Кейс №7.docx` with 36 patient facts, 20 quantitative observations, five ranked hypotheses and nine exact offline source propositions.
- Added a 1,009-word clinician-facing investigation story with 16 semantic blocks, 22 patient supports and all nine accepted external sources.

### Changed

- Grounding now starts from up to three diagnosis- or workup-priority pages per clinical question and expands only for a named unresolved branch or critical gap.
- Data-only releases with an unchanged verified UI fingerprint use a desktop/mobile browser route with four representative screenshots; UI changes retain the full desktop/tablet/mobile regression route.
- Candidate prose is screened for pipeline vocabulary before critic dispatch.

### Fixed

- Active V2 CaseScope now takes precedence over a same-numbered legacy archive case throughout router read-back.
- Repair provenance records canonical candidate SHA-256 and serialized-file SHA-256 as distinct values.
- Temporal workup wording now distinguishes pretreatment material for reconstructing initial disease from post-treatment samples that assess current or residual disease.

### Safety

- `CASE007` passed the final independent critic with 0 unresolved critical and 0 unresolved high findings. The package remains a candidate for clinician review with `projection_verified=true` and `clinician_accepted=false`.

## [0.1.6.0] - 2026-08-20

### Added

- Published the new `CASE006` from `Кейс №6.docx` after a fresh V2 breadth, nine-source grounding pass, exact-page visual review, reconciliation, bounded language repair and independent critic closure.
- Added a 1,411-word clinician-facing reasoning history with 22 semantic blocks, grouped patient-source actions and nine accepted external supports.
- Added `CASE006` to the V2 selector while preserving the previous generation in the versioned legacy archive.

### Changed

- Reset active V2 CaseScope numbering so the DOCX number, internal case ID and public selector ID match exactly.
- `CASE002` and `CASE003` now expose canonical active IDs; their earlier reasoning IDs remain archived provenance.
- Extended the standard unit registry with LDH, total bilirubin and dimensionless SUVmax mappings.
- Separated clinical synthesis timing from narrative preparation, projection QA and deploy timing.

### Fixed

- Repair critic packets now include the prior candidate, exact changed-path manifest, protected-structure hashes and repair trace.
- Visual review receipts now prove all selected pages, including rejected evidence candidates, before critic dispatch.

### Safety

- `CASE006` passed the final independent critic with 0 unresolved critical and 0 unresolved high findings. The package remains a candidate for clinician review with `projection_verified=true` and `clinician_accepted=false`.

## [0.1.5.0] - 2026-08-20

### Added

- Published `CASE001` from `Кейс №1.docx` after a fresh V2 breadth, source-grounding, reconciliation, bounded repair and successful independent repeat review.
- Added a 1,310-word clinician-facing investigation story with 18 semantic blocks, grouped patient-source actions and all accepted guideline supports.
- Restored nine omitted standard Ukrainian biochemistry units with explicit inferred provenance while preserving absent dates and reference intervals.

### Changed

- The new V2 selector now starts with `CASE001`, followed by `CASE002` and `CASE003`; the archived legacy numbering remains separate.
- Review packets now carry the completed grounding and exact-page visual receipts used by the critic.
- Public timing now reports clinical synthesis and clinician-narrative preparation separately.

### Fixed

- Candidate QA now waits for the source drawer transition, verifies the current reasoning-log heading and captures overview, timeline, graph, drawer and reasoning-log screenshots on desktop, tablet and mobile.

### Safety

- `CASE001` remains a candidate for clinician review: 0 unresolved critical findings, 0 unresolved high findings, `projection_verified=true`, `clinician_accepted=false`.

## [0.1.4.1] - 2026-08-20

### Fixed

- Replaced repeated `Запис пацієнта` links with one `Показати опори` action per reasoning block.
- Updated the source drawer to open every fact used by the paragraph, group them by DOCX record, and highlight matching literal fragments.
- Replaced inactive evidence chips with plain source metadata so every visible control now performs an action.
- Preserved keyboard focus after closing the grouped source drawer.

### Safety

- Clinical projections, reasoning text, candidate hashes, source bindings, and clinician status remain unchanged.

## [0.1.4.0] - 2026-08-20

### Added

- Added seven semantic color roles to the clinical reasoning story: context, differential search, hypotheses, evidence, action, criticism, and conclusion.
- Added visible text labels to every colored block so clinical function remains clear independently of color perception.
- Added safe inline emphasis for hypothesis names, diagnoses, workup titles, and selected clinical discriminators.

### Changed

- Replaced the uninterrupted article flow with compact colored blocks while preserving the same 18-paragraph narrative and source notes.
- Kept the established Material palette, 74-character reading measure, and responsive desktop/mobile structure.

### Safety

- The update changes presentation metadata and rendering. Candidate hashes, clinical projections, hypothesis order, typed relations, evidence identity, and clinician status remain unchanged.

## [0.1.3.1] - 2026-08-19

### Changed

- Renamed the long-form surface to `Клінічна історія міркування`.
- Rephrased the complete CASE002 and CASE003 narratives with direct affirmative syntax and removed every `не … а …` and `а не` construction from the visible article.

### Safety

- Candidate hashes, clinical projections, hypothesis order, relations, evidence identities, and clinician status remain identical to v0.1.3.0.

## [0.1.3.0] - 2026-08-19

### Changed

- Replaced the eight-stage reasoning-card sequence with one continuous clinical narrative for CASE002 and CASE003.
- Integrated patient findings, differential changes, guideline propositions, independent criticism, and decision conditions into the same causal story.
- Rendered the reasoning log as a single long-form reading surface with a 74-character measure, paragraph rhythm, compact source notes, and responsive typography.
- Removed repeated interface formulas, stage labels, internal identifiers, and contrast constructions built around `не … а …` or `а не` from the clinician narrative.

### Safety

- The release changes the derived public narrative and its presentation contract. Candidate hashes, hypothesis order, typed relations, source identities, clinical readiness, and clinician-acceptance state remain unchanged.

## [0.1.2.0] - 2026-08-19

### Changed

- Expanded the clinician reasoning log for CASE002 and CASE003 into an eight-stage decision history: first reading, blind differential, source questions, accepted and rejected evidence, reconciliation, ranking, independent criticism, and the stopping rule.
- Replaced fact codes and machine statuses in the main reading path with patient findings written as clinical prose; internal archive IDs and candidate hashes are no longer displayed in the log receipt.
- Added progressive disclosure to each stage so the complete decision audit remains available without turning the initial view into an uninterrupted wall of text.
- Converted source addresses to human-readable page numbers while retaining the underlying provenance in the immutable candidate package.

### Fixed

- CASE002 now shows the first failed critic pass, all four corrections, and the successful repeat review instead of only the final result.
- CASE003 now exposes all eleven blind differential directions, six offline-guideline searches, forty-eight reviewed source fragments, their final reconciliation, and the separate language-cleaning pass.

### Safety

- This release changes only the derived public reasoning projection. It does not run a new synthesis, change hypothesis order, alter clinical relations, or record clinician acceptance.

## [0.1.1.0] - 2026-08-19

### Fixed

- Restored the accepted V1 overview composition: leading hypothesis, source-linked supporting facts, limiting evidence, and interactive differential counts.
- Restored the Clinical Spine timeline with a stable event monitor, category lanes, playhead, zoom, exact source action, dated spacing for CASE003, and document-order spacing for undated CASE002.
- Restored the V1 fact-to-hypothesis graph with typed edges, hypothesis/fact focus, source inspection, source-trace lens, and a readable hypothesis-first mobile view.
- Returned the canonical navigation labels `Огляд`, `Таймлайн`, `Граф`, `Дані`, `Прогалини`; the clinician reasoning log remains the final section.

### Safety

- The repair changes only the derived presentation and timeline capability. Candidate hashes, clinical reasoning, sources, public CASE002/CASE003 aliases, and clinician-acceptance state remain unchanged.

## [0.1.0.0] - 2026-08-19

### Added

- The public dashboard now starts with V2-clean CASE002 and CASE003, whose displayed identifiers follow the numbers recorded in the source DOCX files.
- Added a final clinician-facing “Лог міркувань” section: clinical pattern, leading working hypothesis, differential, source/critic review, and required next information.
- Added compact source-library and technical-receipt disclosures beneath the main reading path.

### Changed

- Patient facts are presented as clinical prose with source-fragment buttons; internal fact IDs and machine coverage sectors are no longer shown in the clinician reading path.
- Repeated evidence entries are grouped by publication, while exact source locations and applicability notes remain available on demand.
- The first-generation selector and release receipt are retained under `archive/v1/`; legacy case payloads remain available as archived files.

### Safety

- CASE002 and CASE003 remain candidate-only, projection-verified, language-clean packages with no clinician acceptance recorded.
- Internal CASE012/CASE013 identities and exact candidate hashes remain unchanged in provenance; public aliases do not rewrite clinical or reasoning artifacts.

## [0.0.2.0] - 2026-08-18

### Added

- CASE013 is now available in the case selector with all 33 reviewed observations, 21 quantitative measurements, six differential candidates, five evidence sources, and the verified workup projection.

### Changed

- CASE013 presents classic hairy cell leukemia as a working candidate while keeping morphology, full immunophenotyping, myeloma exclusion, numb-chin evaluation, treatment, and clinician acceptance explicitly unresolved.
- The source drawer now shows source detail or interpretation only when it adds information beyond the displayed result.

### Fixed

- Removed repeated qualitative text and the empty trailing cell from the source drawer while retaining distinct compound clinical context.
- Added public source routing for NCCN multiple-myeloma guidance and the numb-chin case series used by CASE013.

## [0.0.1.0] - 2026-08-18

### Changed

- CASE011 and CASE012 now show their complete reviewed clinical projections, including 39 and 31 source observations respectively.
- Both cases expose a responsible leading working candidate while keeping diagnosis, treatment, and clinician acceptance separate.
- Supporting facts now prioritize imaging, morphology, and quantitative results before general symptoms.
- CASE012 shows an explicit document-order sequence when calendar dates are absent instead of rendering an empty time axis.

### Fixed

- Restored quantitative data in the Data view, including dated CASE011 series and 16 CASE012 measurements or numeric clinical findings.
- Preserved corrupted or absent source units visibly without inventing replacements.
- Preserved CASE010V2, CASE011, and CASE012 in the case selector across regenerated builds.
- Replaced the intrusive source-record layout with the verified responsive drawer and kept the experimental hypergraph out of clinical navigation.

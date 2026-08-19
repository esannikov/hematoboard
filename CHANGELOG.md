# Changelog

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

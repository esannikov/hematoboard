# Changelog

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

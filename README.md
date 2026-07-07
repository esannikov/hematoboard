# MedAI · HematoBoard — clinical-reasoning support (CASE-02 demo)

**Live demo:** https://esannikov.github.io/hematoboard/

An **auditable clinical-reasoning support surface** for hemato-oncology tumor boards —
**decision support, not a diagnosis**. It turns a de-identified patient's records
(labs, imaging, pathology, consults) into a board-ready, fully traceable reasoning packet.

Built on one fully de-identified case (**CASE-02**): a 14-month lymphadenopathy workup
where four pathology reads oscillate (reactive → possible Hodgkin) while the imaging
progresses monotonically — a real anchoring risk the system is designed to surface.

### Seven surfaces (open `index.html`)
- **Timeline** — pathology reads vs imaging burden, side by side (the discordance).
- **Consilium** — the differential as a ranked debate + a structured challenge round.
- **Diagnostic Graph** — the evidence↔hypothesis network; which findings support/refute which diagnoses.
- **Evidence X-Ray** — every clinical claim → a real, resolvable PubMed ID, or a declared gap.
- **Patient State** — state by phase + the expected-workup gaps (LDH, confirmatory IHC, HHV-8, PET).
- **Board Packet** — a board-ready packet with the system's safety-critic in the margins.
- **Disease Map** — a plain-language anatomical map to explain the case to the patient.

### Non-negotiables
- **De-identified.** No personal identifiers anywhere.
- **Decision support, not a diagnosis.** The physician decides (human-in-the-loop).
- **No fabricated citations.** Provenance or an explicit gap.

Static, self-contained (no build). A research prototype from a Ukrainian oncohematology group.

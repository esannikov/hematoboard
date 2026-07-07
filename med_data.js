/* MedAI workbench — CASE-02 clinical dataset for the dashboards.
   De-identified lymphadenopathy odyssey (F ~44y, 14 months, cross-border fragmented care).
   Curated by Fable on top of tiered-agent extractions of 31 source PDFs
   (Haiku=numeric labs · Sonnet=imaging + consults · Opus=pathology crux).

   Honesty contract (carried from the storytelling engine's provenance rule):
   - every value traces to a source document + date
   - every clinical claim traces to a real, resolvable PubMed PMID, OR is marked a GAP
     ("evidence to retrieve" / "guideline — to trace"). The system never fabricates a citation.
   NOT a diagnosis — decision support for a hemato-oncologist. */
window.MED = {
case:{
 id:"CASE-02",
 title:"lymphadenopathy — reactive vs Hodgkin",
 generated:"2026-07-06",
 governance:"De-identified. No personal identifiers stored anywhere in this workbench (no name, DOB or record number — not even in provenance notes). Decision support — not a diagnosis and not a prescription. The clinical decision belongs to the hemato-oncologist with full context.",
 demographics:"Female · ~44y (age lowers prior for solid cancer, raises prior for lymphoma/inflammatory disease) · background: obesity, endometriosis, mild insulin resistance · fragmented cross-border care across several clinics/labs (PL + UA) → reference ranges and units differ per report; state is rebuilt per source, trends read cautiously.",
 source:"31 source PDFs, Aug 2025 → Jun 2026: 5 pathology reports, 11 imaging studies, 7 specialist consults + IGRA, 8 lab panels. Raw de-identified canon: data/CASE-02_source_packet.md · data/CASE-02_labs.csv",
 signal:"Two timelines disagree. The PATHOLOGY read oscillated — core (non-dx) → whole-node IHC 'reactive, sarcoid-like, NOT lymphoma' → slide review confirms reactive → paraffin re-review (Jun'26) REVERSES to 'possible mixed-cellularity Hodgkin + sarcoid-like reaction' (confirmatory IHC not yet resulted). The IMAGING moved monotonically the other way — left cervical 21 mm → generalized bilateral adenopathy, worsening splenomegaly (splenic index 504), NodeRADS 4. A benign reactive process does not progress like this. The case turns on not anchoring to the early benign read."
},

/* ── longitudinal multimodal event stream ─────────────────────────────── */
events:[
 {date:"2025-05", cat:"hx", title:"Papular rash arms/face", detail:"Unexplained, non-pruritic, afebrile; untreated.", flag:""},
 {date:"2025-08-15", cat:"marker", title:"Tumour markers", detail:"CA-125 53.4 U/mL (HIGH); CEA/CA19-9/AFP normal; creatinine 85 (mild HIGH).", flag:"attention"},
 {date:"2025-08-21", cat:"hx", title:"Left cervical lymphadenopathy", detail:"Painful, firm, matted LEFT cervical nodes (right side spared); later left inguinal too.", flag:"attention"},
 {date:"2025-08-28", cat:"imaging", title:"Neck ultrasound", detail:"Left cervical nodes up to 21×20 mm, 'pathological'; right largely spared.", flag:"attention"},
 {date:"2025-09-16", cat:"path", title:"FNA cytology + flow", detail:"Cytology: atypia, 'suspicious for lymphoproliferative' → histology advised. Flow cytometry: NO clonal population; part non-representative.", flag:"attention"},
 {date:"2025-09-19", cat:"path", title:"Core-needle biopsy", detail:"Mandibular-angle node: necrosis + reactive T-cells, cytokeratin-neg. Non-oncologic but NON-DIAGNOSTIC → whole-node excision demanded.", flag:"attention"},
 {date:"2025-09-24", cat:"imaging", title:"CT chest+ (contrast)", detail:"Multi-station left/midline adenopathy; SPLENOMEGALY 147 mm with infiltrative foci ≤16 mm.", flag:"critical"},
 {date:"2025-10-01", cat:"path", title:"Whole-node excision (→ IHC)", detail:"Left cervical node excised for full histology + IHC.", flag:""},
 {date:"2025-11-20", cat:"path", title:"IHC — whole node", detail:"Sarcoid-like granulomas (CD68+/CD4+), mixed T-cells, eosinophils, scattered CD30+/MUM1+/CD15−/EBV− immunoblasts, Ki-67 ≤40%. Read: REACTIVE, sarcoid-like — NOT lymphoma.", flag:"critical"},
 {date:"2025-12-10", cat:"lab", title:"IGRA (QuantiFERON) NEGATIVE", detail:"TB1 −0.01, TB2 −0.01 (cutoff 0.35); valid mitogen. TB unlikely.", flag:""},
 {date:"2025-12-09", cat:"imaging", title:"Ultrasound (nodal + spleen)", detail:"Left cervical conglomerate ≤4.95 cm, left inguinal 5.89 cm, left axillary; spleen 12.55 cm heterogeneous.", flag:"critical"},
 {date:"2025-12-23", cat:"path", title:"Slide re-review", detail:"CONFIRMS reactive granulomatous / sarcoid-like lymphadenitis. Asks for clinico-radiological correlation.", flag:"attention"},
 {date:"2026-03-18", cat:"lab", title:"Extended labs", detail:"sIL-2R 828 (HIGH); ACE 45 (normal); β2-microglobulin 1.89 (normal); hsCRP 12.1 (HIGH); EBV PCR + / HSV-7 PCR +; CMV PCR −; CD19 B-cells low.", flag:"attention"},
 {date:"2026-04-23", cat:"consult", title:"Pulmonology", detail:"Nodes slightly smaller, afebrile. DDx: sarcoid reaction WITHIN lymphoma vs Castleman. 'No evidence of active/latent TB.'", flag:""},
 {date:"2026-04-29", cat:"consult", title:"Infectious disease", detail:"DDx: disseminated herpesvirus infection ± hemophagocytic syndrome? Castleman? Advises HHV-8 PCR + re-biopsy with Castleman-targeted histomorphology.", flag:""},
 {date:"2026-06-03", cat:"imaging", title:"Ultrasound — generalized", detail:"GENERALIZED lymphadenopathy, now MORE on the RIGHT (distribution shift). Left inguinal 44×30 mm.", flag:"critical"},
 {date:"2026-06-10", cat:"path", title:"Paraffin-block re-review", detail:"Identifies large cells RESEMBLING HODGKIN cells → 'possible Hodgkin lymphoma, mixed-cellularity, with sarcoid-like reaction'. Recommends confirmatory IHC (CD30/CD15/PAX5/MUM1/CD45/CD20/CD3/fascin).", flag:"critical"},
 {date:"2026-06-11", cat:"imaging", title:"MSCT head→pelvis (contrast)", detail:"Bilateral cervical conglomerates ≤43 mm, axillary, iliac, inguinal — NodeRADS 4. Hepatosplenomegaly, splenic foci read as 'metastatic'. Exclude lymphoproliferative process.", flag:"critical"}],

/* ── the pathology chain — the crux (four reads over 9 months) ─────────── */
pathology:[
 {n:1, date:"2025-09-19", kind:"Core-needle biopsy", specimen:"Mandibular-angle node, 2 cores",
  finding:"Necrotic masses + scattered granulocytes; reactive CD3+ T-cells, few CD20+ B-cells; CKAE1/AE3 and Ki-67 negative on core.",
  verdict:"non-diagnostic", label:"Non-diagnostic",
  conclusion:"Non-oncologic but non-diagnostic on this small sample → whole-node excision indicated."},
 {n:2, date:"2025-11-20", kind:"IHC — whole node", specimen:"Left cervical node (excised 01.10)",
  finding:"Effaced architecture; sarcoid-like granulomas (CD68+/CD4+/S100±, ALK1−, BRAF−); numerous interfollicular T-cells; abundant CD15+ eosinophils; scattered CD30+/PAX5+/MUM1+/CD15−/EBV− immunoblasts; Ki-67 ≤40%.",
  verdict:"reactive", label:"Reactive · sarcoid-like",
  conclusion:"Atypical picture, best fits REACTIVE changes with sarcoid-like granulomas. Did NOT call the CD30+ cells Hodgkin. DDx: granulomatous diseases."},
 {n:3, date:"2025-12-23", kind:"Slide re-review", specimen:"Original slides (consultation)",
  finding:"Re-reads same slides; no new panel.",
  verdict:"reactive", label:"Reactive (confirmed)",
  conclusion:"CONFIRMS reactive granulomatous / sarcoid-like lymphadenitis. Requires clinico-radiological correlation."},
 {n:4, date:"2026-06-10", kind:"Paraffin-block re-review", specimen:"Fresh H&E from block (consultation)",
  finding:"Effaced node; epithelioid-histiocyte granulomas in a mixed infiltrate (lymphocytes, eosinophils, plasma cells) PLUS a few large cells morphologically resembling Hodgkin cells.",
  verdict:"neoplasm", label:"Possible Hodgkin (MC)",
  conclusion:"May correspond to HODGKIN LYMPHOMA, mixed-cellularity, with sarcoid-like reaction. Recommends confirmatory IHC (CD30, CD15, PAX5, MUM1, CD45, CD20, CD3, fascin). NOT YET RESULTED."}],

/* ── imaging burden trajectory (monotonic progression) ────────────────── */
imaging:[
 {date:"2025-08-28", modality:"US neck", maxNode:"21×20 mm", stations:"L cervical/supraclav", spleen:"—", noderads:"", trend:"baseline · left-sided", impression:"Left cervical nodes 'pathological'; right non-suspicious."},
 {date:"2025-09-23", modality:"US groin", maxNode:"45×19 mm", stations:"L inguinal", spleen:"—", noderads:"", trend:"new station", impression:"Two pathological left inguinal nodes."},
 {date:"2025-09-24", modality:"CT chest+", maxNode:"19 mm", stations:"L neck/axilla/epigastric/iliac/inguinal", spleen:"147 mm + foci", noderads:"", trend:"multi-station + spleen", impression:"Suspicious infiltrative splenic change + pathological nodes."},
 {date:"2025-12-09", modality:"US nodal", maxNode:"58.9×32.7 mm", stations:"L cervical conglomerate, axilla, inguinal", spleen:"125 mm", noderads:"", trend:"↑↑ marked growth", impression:"Enlarged; 'reactive (secondary?)' — sonographer hedged."},
 {date:"2026-06-03", modality:"US generalized", maxNode:"44×30 mm", stations:"generalized, now bilateral (more R)", spleen:"—", noderads:"", trend:"distribution shift", impression:"Generalized lymphadenopathy."},
 {date:"2026-06-11", modality:"MSCT head→pelvis", maxNode:"43 mm (neck IIa)", stations:"bilateral cervical/axillary/iliac/inguinal", spleen:"index 504 + enhancing foci", noderads:"4", trend:"progression + spread", impression:"NodeRADS 4; 'metastatic' splenic involvement; exclude lymphoproliferative process."}],

/* ── labs (harmonised to g/L / mg/L; per-report ref ranges preserved in CSV) ── */
dates:[
 {id:"d1", date:"2025-08-28"},{id:"d2", date:"2025-09-24"},{id:"d3", date:"2025-11-28"},
 {id:"d4", date:"2025-12-09"},{id:"d5", date:"2026-03-18"},{id:"d6", date:"2026-06-03"}],
labs:[
 {an:"WBC", unit:"10⁹/L", lo:3.9, hi:10.2, v:{d1:4.26,d2:4.41,d3:3.51,d4:3.87,d5:4.20,d6:4.40}, grp:"count", key:true, note:"mild leukopenia Nov–Dec '25, then normalised"},
 {an:"Lymph#", unit:"10⁹/L", lo:1.1, hi:4.5, v:{d1:1.20,d2:1.31,d3:0.97,d4:1.02,d5:1.36,d6:1.22}, grp:"count", key:true, note:"transient lymphopenia — nonspecific"},
 {an:"Mono#", unit:"10⁹/L", lo:0.1, hi:0.9, v:{d1:0.32,d2:0.31,d3:0.31,d4:0.40,d5:0.36,d6:0.38}, grp:"count"},
 {an:"Hgb", unit:"g/L", lo:120, hi:156, v:{d1:130,d2:125,d3:121,d4:121,d5:123,d6:133}, grp:"count", note:"never anaemic — unlike CASE-01"},
 {an:"PLT", unit:"10⁹/L", lo:150, hi:389, v:{d1:164,d2:182,d3:155,d4:147,d5:158,d6:163}, grp:"count", note:"low-normal throughout"},
 {an:"ESR", unit:"mm/h", lo:0, hi:15, v:{d1:null,d2:null,d3:null,d4:2,d5:17,d6:8}, grp:"inflammation"},
 {an:"CRP", unit:"mg/L", lo:0, hi:5, v:{d1:9.1,d2:null,d3:1.9,d4:null,d5:12.1,d6:8.5}, grp:"inflammation", key:true, note:"mild, fluctuating inflammatory signal"}],
/* one-off markers (not trended) */
markers:[
 {an:"sIL-2R (sCD25)", date:"2026-03-18", v:"828", unit:"U/mL", ref:"158–623", flag:"HIGH", note:"soluble IL-2 receptor — nonspecific activation/tumour-burden marker; ↑ in Hodgkin, Castleman, sarcoid alike (does not discriminate)"},
 {an:"ACE", date:"2026-03-19", v:"45", unit:"U/L", ref:"20–70", flag:"", note:"normal — weakens isolated sarcoidosis"},
 {an:"β2-microglobulin", date:"2026-03-18", v:"1.89", unit:"mg/L", ref:"0.8–2.4", flag:"", note:"normal"},
 {an:"CA-125", date:"2025-08-15", v:"53.4", unit:"U/mL", ref:"0–35", flag:"HIGH", note:"nonspecific (serosal inflammation); CEA/CA19-9/AFP normal — not a solid-cancer pattern"},
 {an:"EBV DNA (PCR)", date:"2026-03-18", v:"5.7×10²", unit:"IU/mL", ref:"not detected", flag:"POS", note:"but the excised NODE is EBV-negative → viral role likely bystander, not the nodal driver"},
 {an:"HSV-7 DNA (PCR)", date:"2026-03-18", v:"5.5×10²", unit:"IU/mL", ref:"not detected", flag:"POS", note:"herpesvirus reactivation; nonspecific"},
 {an:"CMV IgG", date:"2025-12-10", v:"505", unit:"AU/mL", ref:"<6", flag:"POS", note:"past exposure; CMV PCR negative"},
 {an:"LDH", date:"—", v:"NOT DONE", unit:"", ref:"", flag:"GAP", note:"absent from every panel — a key lymphoma / prognostic (IPI) marker"}],

/* ── traced evidence — real resolvable PMIDs or honest gaps ────────────── */
evidence:[
 {id:"E1", type:"pmid", ref:"19228638", cite:"Flow cytometry can diagnose classical Hodgkin lymphoma in lymph nodes… Am J Clin Pathol. 2009.",
  supports:"Hodgkin/Reed-Sternberg cells are sparse (<1% of the node) and are NOT captured by conventional flow cytometry — a specialised multicolour assay is needed. A routine 'no clonal population' flow result therefore does NOT exclude classic Hodgkin lymphoma."},
 {id:"E2", type:"pmid", ref:"3536088", cite:"Sarcoid reactions in malignant tumours. (Cancer Treat Rev, 1986.)",
  supports:"Non-caseating epithelioid (sarcoid-like) granulomas occur in nodes draining or involved by malignancy — including Hodgkin — and can dominate the picture, masking the tumour."},
 {id:"E2b", type:"pmid", ref:"7309031", cite:"Pseudosarcoid granulomas in Hodgkin's disease.",
  supports:"Sarcoid-like granulomas coexist with Hodgkin tissue and in uninvolved tissue — the exact masquerade seen here; sarcoid reactions occur in ~14% of Hodgkin cases."},
 {id:"E3", type:"pmid", ref:"27236576", cite:"Core needle biopsies and surgical excision biopsies in the diagnosis of lymphoma — Lymph Node Registry Kiel. (Virchows Arch, 2016.)",
  supports:"Excisional biopsy has the highest diagnostic yield in lymphoma; core biopsy carries a higher non-diagnostic rate, greatest in classic Hodgkin lymphoma — which is why the discriminating step here is a fresh excisional re-biopsy."},
 {id:"E4", type:"pmid", ref:"2205142", cite:"The soluble interleukin-2 receptor: biology, function, and clinical application. (J Clin Immunol, 1990.)",
  supports:"sIL-2R reflects lymphocyte activation and tumour burden but is NONSPECIFIC — elevated across lymphoproliferative, granulomatous and autoimmune disease. The 828 U/mL here supports 'active process' but does not choose between Hodgkin, Castleman and sarcoid."},
 {id:"E5", type:"pmid", ref:"28087540", cite:"International, evidence-based consensus diagnostic criteria for HHV-8-negative/idiopathic multicentric Castleman disease. (Blood, 2017.)",
  supports:"iMCD needs characteristic node histopathology + multicentric adenopathy + minor criteria (hepatosplenomegaly, ↑CRP/ESR, cytopenias) AND exclusion of malignancy/infection — mandating HHV-8 testing and Castleman-targeted histomorphology, both still outstanding here."},
 {id:"E6", type:"pmid", ref:"3756082", cite:"The sarcoidosis-lymphoma syndrome. (1986.)",
  supports:"Middle-aged patients with active sarcoidosis have ~5.5× the expected lymphoma incidence; sarcoid usually precedes the lymphoma. Sarcoid-like reaction and Hodgkin can genuinely coexist — so neither read need be 'wrong'."},
 {id:"E7", type:"pmid", ref:"14617006", cite:"The clinical impact of expert pathological review on lymphoma management: a regional experience. (Br J Haematol, 2003.)",
  supports:"Expert pathology re-review frequently revises lymphoma diagnoses and prevents treatment delay — exactly the mechanism that reversed reads 2–3 at the June block re-review."},
 {id:"G1", type:"gap", ref:"guideline — to trace (Lugano)", cite:"Lugano classification for staging & response in Hodgkin/NHL — PET-CT based.",
  supports:"If Hodgkin is confirmed, staging is by the Lugano criteria (PET-CT). To be cited from the guideline corpus, not asserted."},
 {id:"G2", type:"gap", ref:"to trace (NodeRADS)", cite:"NodeRADS — structured CT/MRI lymph-node malignancy score.",
  supports:"The MSCT 'NodeRADS 4' is a structured suspicion-of-malignancy grade; reference to be pulled into the corpus."},
 {id:"G3", type:"guideline", ref:"NCCN Hodgkin v2.2026 (HODG-1A, p.9)", cite:"Candidate local guideline trace. NCCN HODG-1A lists the typical CHL immunophenotype and the NLPHL differential immunophenotype; source QA required before clinical use.",
  guideline_id:"nccn_hodgkin_lymphoma_v2_2026", page_start:9, node_label:"HODG-1A", human_verified:false,
  supports:"The guideline concordance question is the complete confirmatory IHC pattern, not any single marker. Treat this as candidate page-level provenance until clinician/source QA verifies the extracted node."}],

/* ── THE CONSILIUM — ranked differential + structured challenge round ──── */
consilium:{
 question:"F ~44y, 14-month progressive generalized lymphadenopathy + splenomegaly; node histology shows sarcoid-like granulomas with scattered CD30+/MUM1+/CD15−/EBV− large cells; four pathology reads disagree (reactive ×3 → possible Hodgkin ×1). What is the differential, and what single step resolves it?",
 discriminating_step:"Fresh EXCISIONAL re-biopsy of an enlarging node (e.g. left inguinal 44–49 mm or a right cervical conglomerate) with the confirmatory IHC panel recommended in June — CD30, CD15, PAX5, MUM1, CD45, CD20, CD3, fascin + EBER — PLUS HHV-8 (LANA-1)/PCR and tissue flow. This one specimen separates Hodgkin from Castleman from a pure sarcoid reaction. Add the missing LDH and an sIL-2R trend; if Hodgkin is confirmed, stage by PET-CT (Lugano).",
 positions:[
 {id:"P1", label:"Classic Hodgkin lymphoma (mixed-cellularity) with sarcoid-like reaction", rank:1, primary:true, flag:"must-resolve",
  stance:"Best fit for the WHOLE picture: monotonic progressive adenopathy + worsening splenomegaly (index 504) + CD30+/PAX5+/MUM1+/CD15−/EBV− large cells + Ki-67 ≤40% + the June block re-review calling Hodgkin-like cells + elevated sIL-2R. A sarcoid-like granulomatous reaction is a well-described Hodgkin masquerade — the first reads saw the reaction, not the tumour.",
  data:["Progressive generalized adenopathy","Splenomegaly + foci (index 504)","CD30+/MUM1+/CD15−/EBV− large cells","Ki-67 ≤40%","Paraffin re-review: Hodgkin-like cells","sIL-2R 828"],
  evidence:["E1","E2","E2b","E7","G3"],
  confirms:"Confirmatory IHC: CD30+/PAX5-dim+/MUM1+ (±CD15), CD45−, CD20− large cells = Hodgkin/RS cells.",
  refutes:"Confirmatory IHC negative for Hodgkin markers AND a stable/regressing node course.",
  challenge:{
   proponent:"The clinical + imaging trajectory is neoplastic, not reactive; the large-cell immunophenotype is Hodgkin-compatible; the fourth pathology read reversed to Hodgkin on the same block.",
   opponent:"Reads 2 and 3 (IHC + slide review) explicitly concluded reactive/sarcoid-like and did NOT call Reed-Sternberg cells; classic RS markers (esp. definitive CD15/fascin) are not yet demonstrated.",
   resolver:"Confirmatory IHC panel + EBER on a fresh excisional node — settles it directly (E1, E3, G3)."}},
 {id:"P2", label:"Idiopathic / HHV-8 multicentric Castleman disease", rank:2, flag:"must-not-miss",
  stance:"Raised by both pulmonology and infectious disease: multicentric adenopathy, hepatosplenomegaly, raised CRP/ESR and sIL-2R, constitutional features fit iMCD's minor criteria. Diagnosis requires characteristic histomorphology + HHV-8 status — neither the Castleman-targeted read nor HHV-8 testing has been done.",
  data:["Multicentric adenopathy","Hepatosplenomegaly","↑ CRP/ESR, sIL-2R 828","B-symptom-adjacent fatigue"],
  evidence:["E5","E4"],
  confirms:"Castleman-pattern histology (regressed germinal centres, hypervascularity, polytypic plasmacytosis) ± HHV-8/LANA-1 positive; ↑ IL-6.",
  refutes:"Definitive Hodgkin/RS cells on IHC, or classic Castleman histology absent on targeted review.",
  challenge:{
   proponent:"iMCD explains the multicentric nodes + spleen + inflammatory markers WITHOUT a clonal tumour — and it is treatable/distinct.",
   opponent:"iMCD is a diagnosis of exclusion; malignancy (Hodgkin) must be ruled out first, and the granulomatous picture is atypical for Castleman.",
   resolver:"HHV-8 (LANA-1)/PCR + Castleman-targeted histomorphology + IL-6 on the re-biopsy (E5)."}},
 {id:"P3", label:"Sarcoidosis (nodal + splenic), ± sarcoidosis-lymphoma overlap", rank:3, flag:"supported",
  stance:"Sarcoid-like non-caseating granulomas on histology and splenic foci are compatible with sarcoidosis; but ACE is normal and the course is progressive with 'metastatic'-appearing splenic foci and atypical large cells — arguing against isolated sarcoid. Sarcoidosis and Hodgkin coexist (sarcoidosis-lymphoma syndrome), so this need not compete with P1.",
  data:["Sarcoid-like granulomas (CD68+/CD4+)","Splenic foci","ACE normal (against)","Progressive course (against isolated sarcoid)"],
  evidence:["E6","E2"],
  confirms:"Non-caseating granulomas without malignancy on adequate sampling; supportive imaging; no clonal/RS population.",
  refutes:"Demonstrated Hodgkin/RS cells (would make granulomas a reaction, not primary sarcoid).",
  challenge:{
   proponent:"Granulomas are real and dominant; sarcoidosis is common and fits a granulomatous node + spleen.",
   opponent:"Normal ACE, progression, and the large atypical cells push beyond pure sarcoid; sarcoid may be a REACTION to an underlying Hodgkin.",
   resolver:"Same confirmatory IHC — if Hodgkin cells are present, sarcoid is reclassified as the reaction (E6)."}},
 {id:"P4", label:"Viral (EBV/HHV) lymphoproliferation ± hemophagocytic syndrome", rank:4, flag:"supported",
  stance:"Infectious disease's hypothesis: EBV and HSV-7 DNA positive, CMV IgG high, with adenopathy and cytopenias raising infection-associated HLH. But the excised node is EBV-negative, which weakens an EBV-driven nodal process — the viruses look like bystanders.",
  data:["EBV PCR + / HSV-7 PCR +","CMV IgG high","transient leukopenia/lymphopenia"],
  evidence:["G3"],
  confirms:"EBER-positive tumour cells or tissue HHV DNA; HLH criteria (ferritin, triglycerides, marrow hemophagocytosis).",
  refutes:"Node is EBV-negative (already shown); normal ferritin (24) argues against active HLH.",
  challenge:{
   proponent:"Herpesviruses are demonstrably active and can drive lymphoproliferation and HLH.",
   opponent:"The NODE is EBV-negative and ferritin is normal — the viral markers are peripheral bystanders, not the nodal driver.",
   resolver:"EBER on node tissue + HLH panel (ferritin/triglycerides/marrow)."}},
 {id:"P5", label:"Reactive / benign granulomatous lymphadenitis", rank:5, flag:"refuted-by-course",
  stance:"The anchor set by pathology reads 2–3. Plausible at one timepoint — but 10 months of progressive, generalizing adenopathy with worsening splenomegaly and a NodeRADS-4 read make a purely benign reactive process untenable. Kept visible to show WHY the case moved off this anchor.",
  data:["Early 'reactive' IHC read","No cytopenias/blasts","β2-microglobulin normal"],
  evidence:["E7"],
  confirms:"Regression/stability of nodes over time on a fresh excisional biopsy.",
  refutes:"Progressive generalized adenopathy + splenic progression + Ki-67 ≤40% (all present).",
  challenge:{
   proponent:"Two independent pathology reads concluded reactive; blood counts are near-normal.",
   opponent:"Benign reactive nodes do not progress and generalize over 10 months with splenic infiltration — the imaging refutes the anchor.",
   resolver:"Re-biopsy of an enlarging node; a truly reactive node would not show this trajectory (E7)."}},
 {id:"P6", label:"Metastatic carcinoma", rank:6, flag:"largely-excluded",
  stance:"The MSCT called splenic foci 'metastatic' and CA-125 was mildly raised, so a solid primary was reasonably sought — but mammography (BI-RADS 2), gynaecology (NILM), endoscopy (benign gastric mucosa) and normal CEA/CA19-9/AFP found none. The 'metastatic' wording most likely reflects lymphomatous splenic infiltration.",
  data:["MSCT 'metastatic' splenic foci","CA-125 53 (mild)","No primary found; CEA/CA19-9/AFP normal"],
  evidence:[],
  confirms:"A demonstrable epithelial primary or cytokeratin-positive nodal metastasis.",
  refutes:"Benign breast/gynae/GI workup + cytokeratin-negative core (already shown).",
  challenge:{
   proponent:"Imaging used the word 'metastatic'; CA-125 is elevated.",
   opponent:"No primary on a thorough search; nodes are cytokeratin-negative; CA-125 is nonspecific.",
   resolver:"Cytokeratin/lymphoid IHC on re-biopsy (already trending cytokeratin-negative)."}},
 {id:"P7", label:"Tuberculous / infectious granulomatous lymphadenitis", rank:7, flag:"excluded",
  stance:"Granulomas mandate excluding TB — but IGRA is clearly negative and pulmonology documented 'no evidence of active or latent TB'. Kept visible because a granulomatous node obliges the exclusion, which was correctly performed.",
  data:["Granulomas on histology","IGRA NEGATIVE","Pulmonology: 'no TB'"],
  evidence:[],
  confirms:"AFB/culture/PCR positivity or caseating granulomas (absent — granulomas here are non-caseating).",
  refutes:"Negative IGRA + non-caseating granulomas (both present).",
  challenge:{
   proponent:"Granulomatous lymphadenitis is classically TB until proven otherwise.",
   opponent:"IGRA negative, non-caseating granulomas, no clinical TB — excluded.",
   resolver:"None needed; consider tissue AFB/PCR only if the re-biopsy shows caseation."}}]
},

/* ── evidence↔hypothesis diagnostic graph (a genuine bipartite network) ─── */
graph:{
 note:"A genuine many-to-many network: one finding bears on several hypotheses; each hypothesis rests on several findings. Green = supports · red = argues against · grey = neutral / does-not-discriminate. The linchpin is F3/F6 (the large cells) — the confirmatory IHC resolves the whole graph.",
 hypotheses:[
  {id:"H1", label:"Hodgkin + sarcoid reaction", rank:1, status:"leading"},
  {id:"H2", label:"Castleman disease", rank:2, status:"open"},
  {id:"H3", label:"Sarcoidosis", rank:3, status:"open"},
  {id:"H4", label:"Viral LPD ± HLH", rank:4, status:"weak"},
  {id:"H5", label:"Reactive / benign", rank:5, status:"refuted"},
  {id:"H6", label:"Metastatic carcinoma", rank:6, status:"excluded"},
  {id:"H7", label:"Tuberculosis", rank:7, status:"excluded"}],
 findings:[
  {id:"F1", label:"Progressive generalized adenopathy", kind:"imaging"},
  {id:"F2", label:"Sarcoid-like granulomas (histology)", kind:"path"},
  {id:"F3", label:"CD30+/MUM1+/CD15−/EBV− large cells", kind:"path", linchpin:true},
  {id:"F4", label:"Ki-67 ≤40%", kind:"path"},
  {id:"F5", label:"Splenomegaly + foci (index 504)", kind:"imaging"},
  {id:"F6", label:"Paraffin re-review: Hodgkin-like cells", kind:"path", linchpin:true},
  {id:"F7", label:"sIL-2R 828 (high)", kind:"lab"},
  {id:"F8", label:"ACE normal", kind:"lab"},
  {id:"F9", label:"EBV/HSV-7 PCR +, CMV IgG high", kind:"lab"},
  {id:"F10", label:"Node tissue EBV-negative", kind:"path"},
  {id:"F11", label:"IGRA negative / 'no TB'", kind:"lab"},
  {id:"F12", label:"Flow: no clonal B-population", kind:"path"},
  {id:"F13", label:"Benign breast/gynae/GI; CEA/CA19-9 normal", kind:"imaging"},
  {id:"F14", label:"No cytopenias/blasts; β2-M normal", kind:"lab"},
  {id:"F15", label:"CA-125 mildly high (53)", kind:"marker"}],
 edges:[
  {f:"F1", h:"H1", rel:"support"},{f:"F1", h:"H2", rel:"support"},{f:"F1", h:"H5", rel:"refute"},{f:"F1", h:"H3", rel:"support"},
  {f:"F2", h:"H3", rel:"support"},{f:"F2", h:"H1", rel:"support"},{f:"F2", h:"H7", rel:"support"},
  {f:"F3", h:"H1", rel:"support"},{f:"F3", h:"H5", rel:"refute"},
  {f:"F4", h:"H1", rel:"support"},{f:"F4", h:"H5", rel:"refute"},
  {f:"F5", h:"H1", rel:"support"},{f:"F5", h:"H2", rel:"support"},{f:"F5", h:"H3", rel:"support"},{f:"F5", h:"H6", rel:"support"},{f:"F5", h:"H5", rel:"refute"},
  {f:"F6", h:"H1", rel:"support"},{f:"F6", h:"H5", rel:"refute"},
  {f:"F7", h:"H1", rel:"support"},{f:"F7", h:"H2", rel:"support"},{f:"F7", h:"H3", rel:"support"},
  {f:"F8", h:"H3", rel:"refute"},
  {f:"F9", h:"H4", rel:"support"},
  {f:"F10", h:"H4", rel:"refute"},{f:"F10", h:"H1", rel:"neutral"},
  {f:"F11", h:"H7", rel:"refute"},
  {f:"F12", h:"H1", rel:"neutral"},{f:"F12", h:"H2", rel:"neutral"},
  {f:"F13", h:"H6", rel:"refute"},
  {f:"F14", h:"H5", rel:"support"},{f:"F14", h:"H4", rel:"refute"},
  {f:"F15", h:"H6", rel:"support"}]
},

/* ── expected lymphoma workup panel with presence (gap = first-class) ──── */
panel:[
 {grp:"Definitive tissue", items:[
  {t:"Excisional (whole-node) biopsy", present:true, why:"done Oct '25 — but early read benign; a fresh enlarging node is now indicated"},
  {t:"Confirmatory Hodgkin IHC (CD30/CD15/PAX5/MUM1/CD45/fascin)", present:false, disc:true, why:"recommended Jun '26 — NOT YET RESULTED; the single resolving test"},
  {t:"EBER in-situ hybridisation", present:false, disc:true, why:"EBV status of the large cells"},
  {t:"HHV-8 (LANA-1)/PCR on tissue", present:false, disc:true, why:"settles Castleman vs Hodgkin"}]},
 {grp:"Staging / burden", items:[
  {t:"LDH", present:false, disc:true, why:"absent from every panel — key lymphoma & IPI marker"},
  {t:"PET-CT (Lugano)", present:false, why:"staging + metabolic activity if lymphoma confirmed"},
  {t:"Bone-marrow biopsy", present:false, why:"staging / cytopenia workup"},
  {t:"sIL-2R trend", present:false, why:"single value only — a trend tracks disease activity"}]},
 {grp:"Differential-narrowing", items:[
  {t:"Castleman-targeted histomorphology + IL-6", present:false, why:"recommended by infectious disease; not done"},
  {t:"ACE", present:true, why:"normal — sarcoid marker"},
  {t:"β2-microglobulin", present:true, why:"normal"},
  {t:"IGRA (TB)", present:true, why:"negative — TB excluded"}]},
 {grp:"Constitutional / documentation", items:[
  {t:"B-symptom inventory (night sweats, weight loss, fever pattern)", present:false, why:"not systematically documented — prognostically important"},
  {t:"Ferritin / triglycerides (HLH screen)", present:true, why:"ferritin 24 normal — argues against active HLH"}]}],

/* ── open clinical questions the system surfaces (questions, not conclusions) ── */
questions:[
 {q:"Are the CD30+/MUM1+/CD15−/EBV− large cells Hodgkin cells or reactive immunoblasts?", why:"This single point splits the reactive reads from the Hodgkin read — the whole case turns on it.", tests:["confirmatory IHC panel","EBER","fascin"]},
 {q:"Why did four pathology reads disagree, and which is right?", why:"Expert re-review reverses lymphoma diagnoses often; the block re-review may have caught what the trajectory implied.", tests:["central expert review","fresh excisional re-biopsy"]},
 {q:"Is a benign reactive process compatible with 10 months of progression?", why:"Imaging is monotonic (NodeRADS 4, splenic index 504) while early path said stable-reactive — the discordance is the signal.", tests:["side-by-side imaging trend","re-biopsy of an enlarging node"]},
 {q:"Has Castleman disease been excluded?", why:"Both pulmonology and ID raised it; HHV-8 and Castleman-targeted histology were advised but not done.", tests:["HHV-8 PCR/LANA-1","IL-6","targeted histomorphology"]},
 {q:"Where is the LDH — and the staging data?", why:"LDH is missing from every panel; no PET-CT or marrow — needed the moment lymphoma is confirmed.", tests:["LDH","PET-CT (Lugano)","bone-marrow biopsy"]}]
};

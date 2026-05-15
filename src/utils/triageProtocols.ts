export type ChiefComplaint =
  | 'chest_pain'
  | 'shortness_of_breath'
  | 'headache'
  | 'abdominal_pain'
  | 'fever'
  | 'trauma_injury'
  | 'stroke_symptoms'
  | 'anaphylaxis'
  | 'diabetic_emergency'
  | 'mental_health'
  | 'seizure'
  | 'cardiac_arrest'
  | 'obstetric'
  | 'paediatric_fever'
  | 'overdose_poisoning'
  | 'other';

export interface RedFlag {
  symptom: string;
  reason: string;
  esiLevel: 1 | 2 | 3;
}

export interface ClinicalStep {
  step: string;
  detail?: string;
}

export interface DrugRecommendation {
  name: string;
  dose: string;
  route: string;
  indication: string;
  notes?: string;
}

export interface ReferralRecommendation {
  destination: string;
  reason: string;
  urgency: 'immediate' | 'urgent' | 'routine';
}

export interface TriageProtocol {
  complaint: ChiefComplaint;
  label: string;
  questions: string[];
  redFlags: RedFlag[];
  initialSteps: ClinicalStep[];
  suggestedDrugs: DrugRecommendation[];
  investigations: string[];
  referrals: ReferralRecommendation[];
  dispositionOptions: string[];
}

export const TRIAGE_PROTOCOLS: Record<ChiefComplaint, TriageProtocol> = {
  chest_pain: {
    complaint: 'chest_pain',
    label: 'Chest Pain',
    questions: [
      'Where exactly is the pain? Does it radiate to your jaw, left arm, or back?',
      'When did it start? Did it come on suddenly or gradually?',
      'How would you describe it? Crushing, burning, tearing, sharp, or pressure?',
      'Does anything make it better or worse (rest, GTN, antacids, position)?',
      'Do you have shortness of breath, sweating, nausea, or vomiting?',
      'Do you have a history of heart disease, hypertension, diabetes, or high cholesterol?',
      'Do you smoke or have a family history of heart disease?',
      'Any recent surgery, immobility, long-haul travel, or leg swelling (DVT/PE risk)?',
      'Any cocaine or stimulant use?',
    ],
    redFlags: [
      { symptom: 'Crushing / pressure chest pain with radiation', reason: 'STEMI / ACS', esiLevel: 1 },
      { symptom: 'Sudden tearing pain radiating to back', reason: 'Aortic dissection', esiLevel: 1 },
      { symptom: 'SBP < 90 mmHg with chest pain', reason: 'Cardiogenic shock', esiLevel: 1 },
      { symptom: 'SpO2 < 94% with pleuritic chest pain', reason: 'Pulmonary embolism', esiLevel: 2 },
      { symptom: 'Chest pain + new ECG changes (ST elevation/LBBB)', reason: 'STEMI', esiLevel: 1 },
      { symptom: 'Haemoptysis + pleuritic pain + tachycardia', reason: 'Pulmonary embolism', esiLevel: 2 },
    ],
    initialSteps: [
      { step: 'Attach cardiac monitor and 12-lead ECG within 10 minutes', detail: 'Compare with previous ECG if available' },
      { step: 'Continuous SpO2 monitoring; apply oxygen if SpO2 < 94%' },
      { step: 'IV access (large bore ×2) and blood tests: FBC, U&E, LFTs, glucose, troponin (repeat at 3h), D-dimer, ABG if indicated' },
      { step: 'Chest X-ray (portable if haemodynamically unstable)' },
      { step: 'Assess TIMI/HEART score for ACS risk stratification' },
      { step: 'Nil by mouth if STEMI suspected (may require PCI)' },
      { step: 'Inform on-call cardiology if ECG shows STEMI or high-risk features' },
    ],
    suggestedDrugs: [
      { name: 'Aspirin', dose: '300mg stat', route: 'Oral (chew)', indication: 'Suspected ACS / STEMI (antiplatelet)', notes: 'Unless true allergy — seek advice before omitting' },
      { name: 'GTN (Glyceryl Trinitrate)', dose: '0.5mg sublingually', route: 'Sublingual spray or tablet', indication: 'Ischaemic chest pain / angina', notes: 'Repeat every 5 min ×3. Do NOT use if BP < 90 systolic or if phosphodiesterase inhibitor taken within 24–48h' },
      { name: 'Morphine', dose: '2–10mg IV (titrated)', route: 'IV slow push', indication: 'Severe pain not responding to GTN', notes: 'With antiemetic; monitor respiratory rate' },
      { name: 'Metoclopramide', dose: '10mg IV', route: 'IV', indication: 'Nausea/vomiting with opioids' },
      { name: 'Ticagrelor', dose: '180mg stat', route: 'Oral', indication: 'NSTEMI/STEMI (P2Y12 antiplatelet — confirm with cardiology)', notes: 'P2Y12 inhibitor — await cardiology advice for STEMI if PCI planned' },
      { name: 'Enoxaparin (LMWH)', dose: '1mg/kg SC BD or as per ACS protocol', route: 'SC', indication: 'NSTEMI/UA anticoagulation', notes: 'Adjust for weight and renal function. Hold if STEMI and PCI planned.' },
      { name: 'Alteplase (thrombolysis)', dose: 'As per STEMI thrombolysis protocol', route: 'IV', indication: 'STEMI if PCI unavailable within 120 minutes', notes: 'Check absolute contraindications. Senior doctor decision only.' },
    ],
    investigations: [
      '12-lead ECG (within 10 min) + repeat 30 min', 'High-sensitivity troponin I or T (0h and 3h)',
      'FBC, U&E, creatinine, eGFR', 'LFTs, clotting screen (INR/APTT)', 'Blood glucose / HbA1c',
      'Lipid profile', 'CXR (portable / PA)', 'D-dimer (if PE suspected)',
      'ABG (if SpO2 low or tachypnoea)', 'CTPA (if PE high probability)', 'CT Aorta (if dissection suspected)',
      'Echo (bedside if available)', 'Point-of-care ultrasound (POCUS)',
    ],
    referrals: [
      { destination: 'Cardiology / Cath Lab', reason: 'STEMI or high-risk NSTEMI for PCI/angiography', urgency: 'immediate' },
      { destination: 'Cardiothoracic Surgery', reason: 'Aortic dissection (Type A)', urgency: 'immediate' },
      { destination: 'Interventional Radiology / Vascular Surgery', reason: 'Aortic dissection (Type B) or suspected aortic aneurysm', urgency: 'urgent' },
      { destination: 'Regional Cardiac Centre', reason: 'STEMI requiring primary PCI — call PPCI hotline for transfer', urgency: 'immediate' },
    ],
    dispositionOptions: [
      'Resus bay (STEMI / haemodynamic instability)',
      'CCU / Cardiology ward admission (NSTEMI / high-risk ACS)',
      'Chest Pain Unit (low-to-intermediate risk)',
      'Discharge with outpatient cardiology follow-up (low risk, normal troponins, normal ECG)',
      'Transfer to PCI-capable centre',
    ],
  },

  shortness_of_breath: {
    complaint: 'shortness_of_breath',
    label: 'Shortness of Breath / Dyspnoea',
    questions: [
      'How suddenly did this come on — sudden or gradual over hours/days?',
      'Any wheeze, stridor, or noisy breathing?',
      'Any chest pain, palpitations, or leg swelling?',
      'Any cough? If so, is it productive — what colour is the sputum?',
      'Any fever, night sweats, or weight loss?',
      'Any history of asthma, COPD, heart failure, or previous PE/DVT?',
      'Any recent immobility, long travel, or surgery (DVT/PE risk)?',
      'Any known allergic reactions or contact with a new substance?',
      'Are you a smoker or ex-smoker? For how long?',
      'Any current medications including inhalers?',
    ],
    redFlags: [
      { symptom: 'SpO2 < 92% on room air', reason: 'Respiratory failure', esiLevel: 1 },
      { symptom: 'Stridor (noisy inspiratory breathing)', reason: 'Upper airway obstruction / anaphylaxis', esiLevel: 1 },
      { symptom: 'Silent chest with severe wheeze + exhaustion', reason: 'Near-fatal asthma', esiLevel: 1 },
      { symptom: 'Respiratory rate > 30/min + accessory muscle use', reason: 'Severe respiratory distress', esiLevel: 1 },
      { symptom: 'Cyanosis (central)', reason: 'Severe hypoxia', esiLevel: 1 },
      { symptom: 'New bilateral fine inspiratory crackles + JVD', reason: 'Acute pulmonary oedema / heart failure', esiLevel: 2 },
      { symptom: 'Asymmetric breath sounds', reason: 'Pneumothorax or pleural effusion', esiLevel: 2 },
    ],
    initialSteps: [
      { step: 'Position: sit upright (high Fowler) — improves diaphragmatic excursion' },
      { step: 'Apply high-flow oxygen via non-rebreathe mask (15L/min) if SpO2 < 94% or severe distress', detail: 'In COPD: target SpO2 88–92%' },
      { step: 'Attach pulse oximeter and cardiac monitor' },
      { step: 'IV access + bloods: FBC, U&E, CRP, troponin, D-dimer, ABG' },
      { step: 'Peak flow measurement (PEFR) in asthma: compare to predicted and personal best' },
      { step: 'CXR and 12-lead ECG' },
      { step: 'Assess severity: RR, SpO2, PEFR, ability to speak in sentences' },
    ],
    suggestedDrugs: [
      { name: 'Salbutamol (back-to-back nebulisers)', dose: '5mg nebulised', route: 'Nebulisation', indication: 'Acute asthma / bronchospasm', notes: 'Repeat every 15–20 min. Continuous if life-threatening. Can drive with O2.' },
      { name: 'Ipratropium Bromide', dose: '0.5mg nebulised', route: 'Nebulisation', indication: 'Acute severe asthma or COPD exacerbation', notes: 'Add to salbutamol in severe/life-threatening asthma' },
      { name: 'Prednisolone', dose: '40–50mg oral (or IV hydrocortisone 100mg if unable to swallow)', route: 'Oral / IV', indication: 'Acute asthma or COPD exacerbation', notes: '5-day course, no taper needed for < 3 weeks' },
      { name: 'IV Magnesium Sulphate', dose: '1.2–2g IV over 20 minutes', route: 'IV infusion', indication: 'Life-threatening / severe acute asthma (not responding to salbutamol + steroids)', notes: 'Single dose. Monitor BP.' },
      { name: 'Furosemide', dose: '40–80mg IV', route: 'IV slow push', indication: 'Acute pulmonary oedema / flash pulmonary oedema', notes: 'May need to repeat. Monitor urine output and electrolytes.' },
      { name: 'GTN infusion', dose: 'Start at 2mg/h IV, titrate to BP', route: 'IV infusion', indication: 'Acute pulmonary oedema with SBP > 110 mmHg', notes: 'Venodilator — reduces preload. Stop if SBP < 90.' },
      { name: 'Adrenaline 1:1000', dose: '0.5mg IM thigh', route: 'IM', indication: 'Anaphylaxis with stridor/bronchospasm' },
    ],
    investigations: [
      'SpO2 continuous monitoring', 'ABG (room air unless unstable)', 'FBC, U&E, CRP', 'D-dimer (Wells score)',
      'CXR PA/AP', '12-lead ECG', 'CTPA (if PE likely)', 'Troponin', 'BNP / NT-proBNP (heart failure)',
      'Peak expiratory flow (PEFR)', 'Sputum culture and sensitivity', 'Blood cultures if febrile',
      'Echocardiogram (if new heart failure suspected)',
    ],
    referrals: [
      { destination: 'Respiratory / HDU / ITU', reason: 'Near-fatal asthma, type 2 respiratory failure, BiPAP/intubation need', urgency: 'immediate' },
      { destination: 'Cardiology', reason: 'Acute pulmonary oedema, suspected cardiac cause', urgency: 'urgent' },
      { destination: 'Interventional Radiology / Cardiology', reason: 'Massive PE (consider thrombolysis or surgical embolectomy)', urgency: 'immediate' },
      { destination: 'Respiratory', reason: 'COPD exacerbation, pneumonia, complex dyspnoea', urgency: 'urgent' },
    ],
    dispositionOptions: [
      'Resus / HDU (severe/life-threatening)',
      'Medical ward (moderate severity)',
      'Respiratory ward (COPD, pneumonia)',
      'CCU / Cardiology ward (cardiogenic cause)',
      'Discharge with increased inhalers + GP follow-up (mild asthma/COPD)',
    ],
  },

  headache: {
    complaint: 'headache',
    label: 'Headache',
    questions: [
      'Was the onset sudden ("thunderclap") or gradual?',
      'Is this the worst headache of your life?',
      'Where is the pain — frontal, occipital, unilateral, or all over?',
      'Any neck stiffness, photophobia, or phonophobia?',
      'Any fever, rash, or recent infection?',
      'Any neurological symptoms: visual changes, weakness, slurred speech, confusion?',
      'Any nausea or vomiting?',
      'Any recent head trauma?',
      'Any history of migraine, hypertension, blood clotting disorders, or immunosuppression?',
      'Any anticoagulant use or recent lumbar puncture?',
    ],
    redFlags: [
      { symptom: 'Thunderclap headache (onset < 1 second to maximal)', reason: 'Subarachnoid haemorrhage', esiLevel: 1 },
      { symptom: 'Headache + fever + neck stiffness + photophobia', reason: 'Meningitis / encephalitis', esiLevel: 1 },
      { symptom: 'Headache + non-blanching rash', reason: 'Meningococcal meningitis', esiLevel: 1 },
      { symptom: 'Headache + focal neurological deficit', reason: 'Intracranial bleed / space-occupying lesion', esiLevel: 1 },
      { symptom: 'Headache + papilloedema on fundoscopy', reason: 'Raised intracranial pressure', esiLevel: 2 },
      { symptom: 'Headache in immunocompromised patient (HIV, steroids, transplant)', reason: 'Cryptococcal meningitis / toxoplasma', esiLevel: 2 },
      { symptom: 'New headache in patient > 50 years (especially temporal)', reason: 'Giant cell arteritis (GCA) — check temporal tenderness/ESR', esiLevel: 2 },
    ],
    initialSteps: [
      { step: 'Assess vital signs including BP — SBP > 180 may indicate hypertensive emergency' },
      { step: 'Neurological exam: GCS, pupils, focal deficits, neck stiffness (Kernig/Brudzinski signs), fundoscopy' },
      { step: 'Perform non-contrast CT head urgently if thunderclap, new focal deficit, or papilloedema' },
      { step: 'Lumbar puncture if CT head negative and SAH still suspected (wait ≥ 6h from onset for xanthochromia)' },
      { step: 'Isolate if meningitis suspected; barrier nursing until meningococcal disease excluded' },
    ],
    suggestedDrugs: [
      { name: 'Paracetamol', dose: '1g oral or IV', route: 'Oral or IV', indication: 'Analgesia for benign headache' },
      { name: 'Ibuprofen', dose: '400mg oral with food', route: 'Oral', indication: 'Tension or mild migraine headache', notes: 'Avoid if peptic ulcer or renal impairment' },
      { name: 'Metoclopramide', dose: '10mg IV/IM/oral', route: 'IV/IM/Oral', indication: 'Migraine nausea + analgesic adjunct (IV metoclopramide also effective for migraine itself)' },
      { name: 'Sumatriptan', dose: '50–100mg oral or 6mg SC', route: 'Oral / SC', indication: 'Confirmed migraine (use early in attack)', notes: 'Avoid in haemiplegic migraine, basilar migraine, cardiovascular disease' },
      { name: 'Benzylpenicillin (Penicillin G)', dose: '2.4g IV stat', route: 'IV', indication: 'Suspected bacterial meningitis — give BEFORE CT if delays likely', notes: 'Do NOT delay treatment waiting for LP or CT' },
      { name: 'Ceftriaxone', dose: '2g IV BD', route: 'IV', indication: 'Bacterial meningitis treatment', notes: 'Empirical — adjust once sensitivities known. Add dexamethasone 10mg IV if pneumococcal meningitis suspected.' },
      { name: 'Dexamethasone', dose: '10mg IV QDS for 4 days', route: 'IV', indication: 'Bacterial meningitis adjunct — reduces neurological sequelae', notes: 'Give immediately before or with first dose of antibiotic' },
    ],
    investigations: [
      'Vital signs including BP', 'Blood glucose', 'FBC, U&E, CRP, ESR (GCA)', 'Blood cultures ×2 (before antibiotics if possible)',
      'Non-contrast CT head (urgent)', 'Lumbar puncture (if CT negative + SAH suspected)', 'MRI brain (if CT inconclusive)',
      'Fundoscopy (papilloedema)', 'Coagulation screen (if on anticoagulants)',
    ],
    referrals: [
      { destination: 'Neurosurgery', reason: 'SAH, intracranial bleed, raised ICP', urgency: 'immediate' },
      { destination: 'Neurology / Medical HDU', reason: 'Meningitis/encephalitis, complex migraine, new neurological deficit', urgency: 'urgent' },
      { destination: 'Rheumatology / Ophthalmology', reason: 'Suspected GCA (risk of blindness — start prednisolone same day)', urgency: 'urgent' },
      { destination: 'Neurology outpatient', reason: 'Recurrent migraine, tension-type HA for prophylaxis', urgency: 'routine' },
    ],
    dispositionOptions: [
      'Resus / Neurosurgical centre (SAH, ICH)',
      'Neuro HDU / Medical ward (meningitis, encephalitis)',
      'Observation unit (negative CT, LP awaited)',
      'Discharge + GP follow-up (tension HA, established migraine well-treated)',
    ],
  },

  abdominal_pain: {
    complaint: 'abdominal_pain',
    label: 'Abdominal Pain',
    questions: [
      'Where is the pain — upper, lower, central, or all over?',
      'Was onset sudden or gradual?',
      'Does the pain radiate to the back, shoulder, groin, or thigh?',
      'Any nausea, vomiting, or diarrhoea? Any blood in stool or vomit?',
      'Last bowel motion and urinary symptoms?',
      'Any fever or chills?',
      'For female patients: any chance of pregnancy? Last menstrual period? Any vaginal discharge or bleeding?',
      'Any jaundice, dark urine, or pale stools?',
      'Any previous abdominal surgeries or similar episodes?',
      'Any weight loss, change in bowel habit, or difficulty swallowing?',
    ],
    redFlags: [
      { symptom: 'Rigid boardlike abdomen (peritonism)', reason: 'Peritonitis — bowel perforation / peritonitis', esiLevel: 1 },
      { symptom: 'Pulsatile abdominal mass + tearing pain', reason: 'Ruptured aortic aneurysm', esiLevel: 1 },
      { symptom: 'Positive pregnancy test + severe lower abdominal pain + vaginal bleeding', reason: 'Ectopic pregnancy (ruptured)', esiLevel: 1 },
      { symptom: 'Abdominal pain + hypotension + tachycardia', reason: 'Haemorrhagic shock — perforation, AAA, ectopic', esiLevel: 1 },
      { symptom: 'Pain + absent bowel sounds + absolute constipation', reason: 'Bowel obstruction / volvulus', esiLevel: 2 },
      { symptom: 'Fever > 38.5 + right upper quadrant pain + jaundice (Charcot triad)', reason: 'Acute cholangitis', esiLevel: 2 },
    ],
    initialSteps: [
      { step: 'Full abdominal exam: site, guarding, rigidity, percussion, auscultation (bowel sounds)' },
      { step: 'IV access + blood tests + urine dip/MC&S + pregnancy test (females of reproductive age)' },
      { step: 'NPO (nil by mouth) until surgical cause excluded' },
      { step: 'IV fluids if evidence of dehydration or sepsis' },
      { step: 'Erect CXR (free air under diaphragm = perforation), AXR (obstruction)', detail: 'CT Abdomen/Pelvis with contrast is gold standard if clinical concern high' },
      { step: 'Surgical review if peritonism, suspected obstruction, or haemodynamic instability' },
    ],
    suggestedDrugs: [
      { name: 'Morphine', dose: '2–5mg IV titrated', route: 'IV', indication: 'Moderate-severe abdominal pain', notes: 'Analgesia does NOT delay diagnosis — do not withhold for fear of masking signs' },
      { name: 'Ondansetron', dose: '4mg IV/oral', route: 'IV/Oral', indication: 'Nausea and vomiting' },
      { name: 'Piperacillin/Tazobactam (Tazocin)', dose: '4.5g IV TDS', route: 'IV', indication: 'Intra-abdominal sepsis — empirical broad-spectrum cover', notes: 'Adjust for renal function' },
      { name: 'Metronidazole', dose: '500mg IV TDS', route: 'IV', indication: 'Anaerobic cover for abdominal infection' },
      { name: 'Omeprazole', dose: '40mg IV/oral', route: 'IV/Oral', indication: 'Peptic ulcer, GORD, GI bleed prevention' },
    ],
    investigations: [
      'FBC, U&E, LFTs, amylase, CRP', 'Blood glucose, INR', 'Blood cultures ×2 (if febrile)',
      'Urine dip + MC&S', 'Pregnancy test (female < 55 yrs)', 'Erect CXR (free air)',
      'AXR (obstruction, calculi)', 'USS abdomen/pelvis (hepatobiliary, renal, ovarian)',
      'CT abdomen/pelvis with IV contrast (surgical cause)', 'Lactate (if sepsis/ischaemia suspected)',
    ],
    referrals: [
      { destination: 'General Surgery (emergency)', reason: 'Appendicitis, obstruction, perforation, hernia', urgency: 'immediate' },
      { destination: 'Gynaecology (emergency)', reason: 'Ectopic pregnancy, ovarian torsion, PID', urgency: 'immediate' },
      { destination: 'Vascular Surgery', reason: 'AAA, mesenteric ischaemia', urgency: 'immediate' },
      { destination: 'Gastroenterology', reason: 'Inflammatory bowel disease, cholangitis, pancreatitis', urgency: 'urgent' },
    ],
    dispositionOptions: [
      'Emergency theatre (ruptured ectopic, AAA, perforation)',
      'Surgical ward (appendicitis, obstruction)',
      'Medical ward (pancreatitis, cholecystitis — conservative)',
      'Gynaecology ward',
      'Discharge with analgesia + safety net + GP review (benign cause)',
    ],
  },

  fever: {
    complaint: 'fever',
    label: 'Fever / Pyrexia',
    questions: [
      'How high is the temperature? How long have you had it?',
      'Any rigors (uncontrollable shaking) or night sweats?',
      'Any source: cough, urinary symptoms, diarrhoea, abdominal pain, skin infection, joint pain?',
      'Any recent travel abroad? Where and what activities?',
      'Any sick contacts or known infectious disease exposure?',
      'Any recent hospital admission, surgery, or procedures (including IV lines, catheters)?',
      'Any immunosuppression: HIV, chemotherapy, steroids, transplant?',
      'Any rash — blanching or non-blanching?',
      'Any change in consciousness, confusion, or neck stiffness?',
      'Vaccination history — especially meningococcal, pneumococcal, typhoid, malaria prophylaxis?',
    ],
    redFlags: [
      { symptom: 'Non-blanching petechial / purpuric rash with fever', reason: 'Meningococcal disease', esiLevel: 1 },
      { symptom: 'Fever + altered consciousness + neck stiffness', reason: 'Bacterial meningitis / encephalitis', esiLevel: 1 },
      { symptom: 'Fever + BP < 90 systolic + raised lactate', reason: 'Septic shock', esiLevel: 1 },
      { symptom: 'Fever > 38° in neutropenic patient (neutrophils < 0.5)', reason: 'Neutropenic sepsis', esiLevel: 1 },
      { symptom: 'Fever + jaundice + RUQ pain + hypotension', reason: 'Cholangitis (Reynolds pentad)', esiLevel: 1 },
      { symptom: 'Fever + confusion in returned traveller (sub-Saharan Africa)', reason: 'Cerebral malaria', esiLevel: 1 },
    ],
    initialSteps: [
      { step: 'Apply sepsis screening: NEWS score / SIRS criteria / qSOFA' },
      { step: 'Blood cultures ×2 before starting antibiotics (if possible — do not delay antibiotics in sepsis)' },
      { step: 'IV access, fluids if haemodynamically compromised' },
      { step: 'Assess source: CXR, urine dip/MC&S, skin inspection, swab any wounds' },
      { step: 'In returned travellers: thick and thin blood films, malaria RDT antigen test' },
      { step: 'Paracetamol for symptom relief; anti-shivering measures' },
    ],
    suggestedDrugs: [
      { name: 'Paracetamol', dose: '1g every 4–6 hours (max 4g/day)', route: 'Oral or IV', indication: 'Antipyresis and analgesia' },
      { name: 'Piperacillin/Tazobactam', dose: '4.5g IV 8-hourly', route: 'IV', indication: 'Sepsis, source unknown or intra-abdominal', notes: 'Adjust for renal function' },
      { name: 'Cefuroxime + Metronidazole', dose: '1.5g IV 8h + 500mg IV 8h', route: 'IV', indication: 'Surgical/abdominal sepsis' },
      { name: 'Tazocin (neutropenic sepsis)', dose: '4.5g IV 8-hourly', route: 'IV', indication: 'Neutropenic sepsis — empirical; follow local trust protocol', notes: 'Add gentamicin if severe. Seek haematology advice.' },
      { name: 'IV Artesunate / Quinine', dose: 'Per national malaria protocol', route: 'IV', indication: 'Severe / complicated malaria', notes: 'Seek specialist infectious disease advice immediately' },
      { name: 'Benzylpenicillin', dose: '2.4g IV stat', route: 'IV', indication: 'Suspected meningococcal disease (give immediately, before transfer)', notes: 'Do NOT delay for LP or CT' },
    ],
    investigations: [
      'FBC (differential), U&E, LFTs, CRP, procalcitonin, lactate', 'Blood cultures ×2', 'Blood glucose',
      'Urine MC&S', 'CXR', 'Thick/thin blood films + malaria RDT (travel)', 'HIV test (if indicated)',
      'Lumbar puncture (if meningitis suspected, CT head first)', 'MRSA screening swabs',
      'Clotting + fibrinogen (DIC screen in severe sepsis)',
    ],
    referrals: [
      { destination: 'Infectious Diseases / Tropical Medicine', reason: 'Returned traveller, unusual fever, malaria, typhoid, dengue', urgency: 'urgent' },
      { destination: 'Medical HDU / ICU', reason: 'Septic shock, multi-organ dysfunction', urgency: 'immediate' },
      { destination: 'Haematology', reason: 'Neutropenic sepsis', urgency: 'immediate' },
      { destination: 'Neurology / Neuro HDU', reason: 'Meningitis, encephalitis', urgency: 'immediate' },
    ],
    dispositionOptions: [
      'ICU/HDU (septic shock, multi-organ failure)',
      'Medical ward (non-critical sepsis, investigation of fever source)',
      'Isolation room (airborne/droplet precautions)',
      'Discharge with antibiotics + GP review (uncomplicated UTI, URTI)',
    ],
  },

  trauma_injury: {
    complaint: 'trauma_injury',
    label: 'Trauma / Injury',
    questions: [
      'What was the mechanism? (Fall, RTA, assault, sports, penetrating injury?)',
      'From what height did they fall or at what speed?',
      'Any loss of consciousness at any point?',
      'Any neck pain or back pain?',
      'Any limb deformity, inability to weight bear, or obvious wounds?',
      'Any chest pain, abdominal pain, or difficulty breathing?',
      'Any anticoagulant or antiplatelet medication use?',
      'When was the last tetanus booster?',
      'Are there safeguarding concerns? (Inconsistent history, previous injuries)',
    ],
    redFlags: [
      { symptom: 'Uncontrolled haemorrhage (massive external bleeding)', reason: 'Haemorrhagic shock', esiLevel: 1 },
      { symptom: 'Loss of consciousness / GCS ≤ 8', reason: 'Severe head injury / brain herniation', esiLevel: 1 },
      { symptom: 'Paradoxical chest movement (flail chest)', reason: 'Flail segment — respiratory compromise', esiLevel: 1 },
      { symptom: 'Absent breath sounds unilaterally + deviated trachea', reason: 'Tension pneumothorax', esiLevel: 1 },
      { symptom: 'Mechanism + haemodynamic instability', reason: 'Internal haemorrhage (intra-abdominal, thoracic)', esiLevel: 1 },
    ],
    initialSteps: [
      { step: 'Primary survey: Airway, Breathing, Circulation, Disability (AVPU/GCS), Exposure — ATLS/ABCDE approach' },
      { step: 'C-spine immobilisation if mechanism warrants it (collar + blocks if not already applied)' },
      { step: 'IV access ×2 large bore — send bloods including group & save / crossmatch' },
      { step: 'Control haemorrhage: direct pressure, tourniquet (limb), pelvic binder (pelvic fracture)' },
      { step: "Warm IV fluids: Hartmann's solution (avoid large volumes normal saline in trauma)", detail: 'Target permissive hypotension SBP 80-90 until haemostasis' },
      { step: 'Tertiary survey: head-to-toe examination, FAST scan (USS for pericardial fluid, haemoperitoneum)' },
      { step: 'Trauma team activation if high mechanism or haemodynamic instability' },
    ],
    suggestedDrugs: [
      { name: 'Tranexamic Acid', dose: '1g IV over 10 min (within 3 hours of injury)', route: 'IV', indication: 'Major trauma with significant haemorrhage — reduces mortality', notes: 'CRASH-2 trial evidence. Repeat dose: 1g over 8h. Give within 3h of injury.' },
      { name: 'Morphine', dose: '0.1mg/kg IV titrated', route: 'IV slow push', indication: 'Pain management', notes: 'Titrate carefully. Reassess after each dose.' },
      { name: 'Ketamine', dose: '0.5–1mg/kg IV or 2–4mg/kg IM', route: 'IV/IM', indication: 'Procedural sedation, pre-hospital analgesia, haemodynamically unstable patient (less respiratory depression)' },
      { name: 'Tetanus toxoid + Immunoglobulin', dose: 'Per immunisation status', route: 'IM', indication: 'Contaminated wounds, uncertain immunisation history' },
      { name: 'Co-Amoxiclav', dose: '1.2g IV 8-hourly', route: 'IV', indication: 'Open fractures, contaminated wounds — prophylactic antibiotic' },
      { name: 'Group O-negative blood', dose: 'As per massive haemorrhage protocol', route: 'IV', indication: 'Life-threatening haemorrhage while crossmatch pending' },
    ],
    investigations: [
      'Full blood count, group & save / crossmatch, U&E, clotting, fibrinogen, ABG, lactate',
      'Trauma pan-scan CT (FAST trauma CT) if mechanism warrants', 'FAST ultrasound scan',
      'CXR, pelvis X-ray', 'Long bone X-rays', 'CTPA (if PE post-trauma)', 'ECG',
    ],
    referrals: [
      { destination: 'Trauma Team / Trauma Surgery', reason: 'Major trauma — activate trauma protocol', urgency: 'immediate' },
      { destination: 'Neurosurgery', reason: 'Head injury with intracranial bleed, GCS drop', urgency: 'immediate' },
      { destination: 'Orthopaedic Surgery', reason: 'Fractures requiring fixation', urgency: 'urgent' },
      { destination: 'Level 1 Trauma Centre', reason: 'Major trauma requiring specialist care beyond local capability', urgency: 'immediate' },
    ],
    dispositionOptions: [
      'Emergency theatre (damage control surgery)',
      'Trauma / Orthopaedic ward',
      'ITU / HDU (haemodynamically unstable, head injury)',
      'Discharge with safety netting (minor trauma, NICE head injury guidance)',
    ],
  },

  stroke_symptoms: {
    complaint: 'stroke_symptoms',
    label: 'Stroke / TIA Symptoms',
    questions: [
      'What time did symptoms start exactly? (Critical for thrombolysis window)',
      'FAST: Face drooping? Arm weakness? Speech difficulty? Time to call 999?',
      'Any visual loss — one eye, one side, double vision?',
      'Any dizziness, loss of balance, or unsteady gait?',
      'Any severe headache (thunderclap)?',
      'When did symptoms resolve (TIA vs. ongoing stroke)?',
      'Any anticoagulant use (warfarin, DOAC)?',
      'Blood glucose — is the patient diabetic?',
      'Any BP-lowering medication?',
      'Any recent surgery or bleeding risk factors (thrombolysis contraindication)?',
    ],
    redFlags: [
      { symptom: 'Facial droop + unilateral limb weakness + dysphasia, onset < 4.5 hours', reason: 'Ischaemic stroke — thrombolysis candidate', esiLevel: 1 },
      { symptom: 'Sudden severe headache + neurological deficit', reason: 'SAH + stroke', esiLevel: 1 },
      { symptom: 'Posterior circulation stroke: vertigo + ataxia + diplopia + dysphagia', reason: 'Basilar artery occlusion — high mortality', esiLevel: 1 },
    ],
    initialSteps: [
      { step: 'FAST track: call stroke team / Hyperacute Stroke Unit immediately — time is brain (1.9 million neurones per minute)' },
      { step: 'Non-contrast CT head STAT to exclude haemorrhage before thrombolysis' },
      { step: 'IV access: FBC, clotting (INR/APTT), U&E, glucose, group & save' },
      { step: 'Blood glucose (capillary) — exclude hypoglycaemia as a mimic' },
      { step: 'ECG (atrial fibrillation as cardioembolic source)', detail: '12-lead ECG, continuous monitoring' },
      { step: 'Maintain airway, O2 if SpO2 < 95%, cannulate, nil by mouth pending SALT swallow assessment' },
      { step: 'Do NOT lower BP unless > 220/120 mmHg (or > 180 if thrombolysis planned)' },
    ],
    suggestedDrugs: [
      { name: 'Alteplase (rt-PA)', dose: '0.9mg/kg IV (max 90mg): 10% bolus, remainder over 60 min', route: 'IV', indication: 'Ischaemic stroke within 4.5h of symptom onset (no contraindication)', notes: 'Senior decision only. Check exclusion criteria (bleeding, recent surgery, anticoagulation, etc.)' },
      { name: 'Aspirin', dose: '300mg oral / rectal', route: 'Oral / Rectal', indication: 'Ischaemic stroke NOT receiving thrombolysis — give within 24 hours; delay 24h after alteplase', notes: 'Continues for 2 weeks then switch to clopidogrel' },
      { name: 'IV Glucose (50% dextrose 50mL)', dose: '50mL of 50% glucose', route: 'IV', indication: 'Hypoglycaemia mimicking stroke (check glucose first!)' },
    ],
    investigations: [
      'Non-contrast CT head (< 25 min from arrival if thrombolysis candidate)',
      'CT angiography head + neck (large vessel occlusion for thrombectomy)',
      'FBC, clotting, U&E, glucose, lipids, HbA1c', 'ECG + 24h cardiac monitoring',
      'Echocardiogram (cardioembolic source)', 'Carotid Doppler USS (TIA)',
      'MRI brain DWI (if CT inconclusive)', 'INR if on warfarin',
    ],
    referrals: [
      { destination: 'Hyperacute Stroke Unit (HASU)', reason: 'All strokes — immediate assessment for thrombolysis / thrombectomy', urgency: 'immediate' },
      { destination: 'Interventional Neuroradiology', reason: 'Large vessel occlusion stroke — mechanical thrombectomy (up to 24h)', urgency: 'immediate' },
      { destination: 'TIA clinic (ABCD² score ≥ 4) within 24h', reason: 'TIA with high short-term stroke risk', urgency: 'urgent' },
      { destination: 'Neurosurgery', reason: 'Haemorrhagic stroke with mass effect', urgency: 'immediate' },
    ],
    dispositionOptions: [
      'Hyperacute Stroke Unit (all strokes)',
      'Cath lab / IR suite (thrombectomy)',
      'Stroke rehab unit',
      'TIA clinic next-day review (low risk, fully resolved)',
    ],
  },

  anaphylaxis: {
    complaint: 'anaphylaxis',
    label: 'Anaphylaxis / Severe Allergic Reaction',
    questions: [
      'What was the exposure? (Food, drug, insect sting, latex, contrast media?)',
      'How quickly after exposure did symptoms start?',
      'Any previous anaphylaxis? Do they carry an EpiPen?',
      'Any wheeze, throat tightness, or stridor?',
      'Any urticaria (hives), angioedema, or flushing?',
      'Any dizziness, feeling faint, or loss of consciousness?',
      'Any known asthma or allergies?',
      'Any beta-blocker medication (may attenuate response to adrenaline)?',
    ],
    redFlags: [
      { symptom: 'Stridor (inspiratory noise) + throat tightness', reason: 'Laryngeal oedema — airway at risk', esiLevel: 1 },
      { symptom: 'BP < 90 systolic + urticaria / exposure to allergen', reason: 'Anaphylactic shock', esiLevel: 1 },
      { symptom: 'Bronchospasm with wheeze not responding to salbutamol', reason: 'Severe anaphylaxis affecting respiratory tract', esiLevel: 1 },
    ],
    initialSteps: [
      { step: 'REMOVE THE TRIGGER (stop infusion, remove sting sac)' },
      { step: 'Lay flat — raise legs if hypotensive (unless dyspnoeic — then sit up)' },
      { step: 'Call for help / resus team if severe', detail: 'Have intubation equipment and IV access ready' },
      { step: 'Adrenaline 0.5mg IM IMMEDIATELY — anterolateral thigh', detail: '0.5mL of 1:1000 — may repeat after 5 minutes' },
      { step: 'High-flow oxygen 15L/min via NRB mask' },
      { step: 'IV access + 1L IV crystalloid rapid infusion (if hypotensive)' },
      { step: 'Monitor: continuous ECG, SpO2, BP every 5 min' },
    ],
    suggestedDrugs: [
      { name: 'Adrenaline 1:1000', dose: '0.5mg IM (adult) / 0.01mg/kg IM (child)', route: 'IM (anterolateral thigh)', indication: 'FIRST-LINE treatment for anaphylaxis — give immediately', notes: 'Repeat every 5 minutes if no improvement. IV adrenaline only in refractory / cardiac arrest.' },
      { name: 'Chlorphenamine', dose: '10mg IV slow (adult)', route: 'IV / IM', indication: 'Antihistamine (H1) — adjunct, not first-line', notes: 'After adrenaline. Does NOT substitute for adrenaline.' },
      { name: 'Hydrocortisone', dose: '200mg IV slow', route: 'IV', indication: 'Reduce biphasic reaction — adjunct after adrenaline', notes: 'Not immediate effect — works over hours. Continue as oral prednisolone for 3 days.' },
      { name: 'Salbutamol', dose: '5mg nebulised', route: 'Nebulisation', indication: 'Bronchospasm not responding to adrenaline alone' },
      { name: 'Glucagon', dose: '1–2mg IV over 5 min', route: 'IV', indication: 'Anaphylaxis in patient on beta-blockers (who may not respond to adrenaline)' },
      { name: 'Normal Saline', dose: '1L IV rapid (repeat to maintain perfusion)', route: 'IV', indication: 'Hypotension / shock' },
    ],
    investigations: [
      'Serum mast cell tryptase (at 1h, 4h, and 24h after reaction onset) — essential for allergy workup',
      'ABG', 'FBC, U&E', 'ECG', 'CXR', 'Throat swab if infection trigger',
    ],
    referrals: [
      { destination: 'Anaesthetics / Airway team', reason: 'Stridor, laryngeal oedema — may need intubation', urgency: 'immediate' },
      { destination: 'Allergy clinic', reason: 'Confirmed anaphylaxis — allergy testing, EpiPen prescription, education', urgency: 'routine' },
      { destination: 'Immunology', reason: 'Recurrent anaphylaxis, complex allergy', urgency: 'routine' },
    ],
    dispositionOptions: [
      'Resus bay minimum 6–12 hours observation (biphasic reaction risk)',
      'HDU / ICU (refractory shock, airway compromise)',
      'Discharge with EpiPen ×2 + allergy avoidance leaflet + allergy clinic referral',
    ],
  },

  diabetic_emergency: {
    complaint: 'diabetic_emergency',
    label: 'Diabetic Emergency (DKA / HHS / Hypoglycaemia)',
    questions: [
      'Is the patient diabetic? Type 1 or Type 2? Insulin-dependent?',
      'What is the blood glucose now?',
      'Any nausea, vomiting, or abdominal pain?',
      'Any polyuria, polydipsia, or weight loss (suggesting new DM or ketosis)?',
      'Any infection or other precipitant (missed insulin, acute illness, trauma, steroid use)?',
      'Is the patient confused, drowsy, or unrousable?',
      'Any fruity breath odour (ketones)?',
      'Any chest pain or other trigger for DKA?',
    ],
    redFlags: [
      { symptom: 'BG > 11 + ketones > 3 mmol/L (blood) + pH < 7.3 + bicarbonate < 15', reason: 'Diabetic Ketoacidosis (DKA)', esiLevel: 2 },
      { symptom: 'BG > 30 + severe dehydration + osmolality > 320 + no/trace ketones', reason: 'Hyperosmolar Hyperglycaemic State (HHS)', esiLevel: 2 },
      { symptom: 'BG < 3.5 mmol/L + altered consciousness', reason: 'Severe hypoglycaemia', esiLevel: 1 },
    ],
    initialSteps: [
      { step: 'Capillary blood glucose + blood ketones immediately' },
      { step: 'DEFG: Dont Ever Forget Glucose — dextrose IV or buccal glucose if hypoglycaemic and unable to eat' },
      { step: 'Blood gas (venous for DKA monitoring), U&E, FBC, LFTs, blood cultures if febrile' },
      { step: 'IV access ×2, catheter (urinary) + hourly urine output measurement in DKA/HHS' },
      { step: 'Cardiac monitor + ECG (hypokalaemia = tall T waves, U waves)' },
      { step: 'Follow local DKA protocol / JBDS guidelines — fixed rate IV insulin infusion (FRIII) 0.1 units/kg/h' },
    ],
    suggestedDrugs: [
      { name: 'Dextrose (50% glucose)', dose: '150mL of 10% glucose IV (or 50mL 50%)', route: 'IV', indication: 'Severe hypoglycaemia — if unable to eat or GCS impaired', notes: 'Alternatively: Glucagon 1mg IM if no IV access' },
      { name: 'Glucagon', dose: '1mg IM / SC', route: 'IM / SC', indication: 'Hypoglycaemia without IV access', notes: 'May not work in starvation state. Follow with oral carbohydrate when conscious.' },
      { name: 'Fixed Rate IV Insulin (0.9% NaCl + Human Actrapid)', dose: '0.1 units/kg/hour IV infusion (DKA)', route: 'IV infusion', indication: 'DKA — reduces ketones and glucose', notes: 'Target: ketone reduction > 0.5 mmol/L/h; glucose reduction < 3 mmol/L/h. Add 10% glucose when glucose < 14.' },
      { name: 'Normal Saline (0.9%)', dose: '1L over 1h, then as per DKA protocol', route: 'IV infusion', indication: 'DKA / HHS fluid replacement', notes: 'Average fluid deficit in DKA is 5–8L. Replace over 24–48h in HHS (risk of cerebral oedema with rapid correction).' },
      { name: 'Potassium Chloride', dose: 'As per serum K+ level — typically 40mmol/L in bags', route: 'IV infusion', indication: 'Hypokalaemia in DKA — potassium falls further with insulin', notes: 'Recheck K+ every 2h. Do NOT give insulin if K+ < 3.5. Target K+ 4–5 mmol/L.' },
    ],
    investigations: [
      'Capillary glucose + blood ketones (stat)', 'Venous blood gas (pH, bicarbonate)', 'U&E (especially K+)', 'FBC, CRP',
      'Blood cultures (if febrile — precipitant)', 'Urine ketones + MC&S', 'ECG (hypokalaemia)',
      'Osmolality (HHS: > 320 mosm/kg)', 'HbA1c', 'Chest X-ray',
    ],
    referrals: [
      { destination: 'Medical HDU / ICU', reason: 'Severe DKA (pH < 7.0, potassium < 3.5, GCS < 12, APACHE II ≥ 15)', urgency: 'immediate' },
      { destination: 'Endocrinology / Diabetes team', reason: 'Complex DKA, new diabetes diagnosis, recurrent admissions', urgency: 'urgent' },
      { destination: 'Diabetes specialist nurse', reason: 'Discharge planning, insulin education, sick day rules', urgency: 'routine' },
    ],
    dispositionOptions: [
      'Medical HDU (severe DKA, HHS)',
      'Medical ward with hourly ketone + glucose monitoring (moderate DKA)',
      'ED observation (mild hypoglycaemia, can eat and drink, BG stable)',
      'Discharge + DSN review + GP same day (resolved mild hypo, patient educated)',
    ],
  },

  mental_health: {
    complaint: 'mental_health',
    label: 'Mental Health Emergency',
    questions: [
      'Are you or is the patient having thoughts of harming themselves or others?',
      'Have there been any self-harm attempts today or recently? What method was used?',
      'Are they currently in crisis or do they feel safe?',
      'What medications are they taking? Any recent changes or missed doses?',
      'Is there a history of schizophrenia, bipolar disorder, severe depression, or personality disorder?',
      'Any substance use (alcohol, drugs)?',
      'Any recent significant life events or stressors?',
      'Is there risk to others (violence, safeguarding)?',
    ],
    redFlags: [
      { symptom: 'Active suicidal ideation with plan or means', reason: 'Immediate risk to life', esiLevel: 1 },
      { symptom: 'Recent self-harm overdose (< 2h)', reason: 'Medical emergency — treat overdose urgently', esiLevel: 1 },
      { symptom: 'Acute psychosis with command hallucinations / risk to others', reason: 'Immediate risk to self and others', esiLevel: 1 },
      { symptom: 'Extreme agitation / violence', reason: 'Safety risk — may need restraint or rapid tranquilisation', esiLevel: 2 },
    ],
    initialSteps: [
      { step: 'Ensure the safety of the patient, staff, and others — de-escalate first' },
      { step: 'Risk assessment: Columbia Suicide Severity Rating Scale (C-SSRS) or NICE SH50 guidance' },
      { step: 'If overdose: treat medically first (activated charcoal, antidotes per toxidrome)' },
      { step: 'Remove access to potential means of self-harm in the clinical area' },
      { step: 'Psychiatric liaison / crisis team review (within 4 hours ideally)' },
      { step: 'Mental Health Act assessment if patient lacks capacity or poses risk — may require S136/5(2)' },
    ],
    suggestedDrugs: [
      { name: 'Lorazepam', dose: '1–2mg oral/IM', route: 'Oral / IM', indication: 'Acute anxiety, agitation', notes: 'Rapid tranquilisation — use in combination per NICE NG10' },
      { name: 'Haloperidol', dose: '5mg IM (adult) — reduce for elderly', route: 'IM', indication: 'Acute psychosis, severe agitation (rapid tranquilisation)', notes: 'Monitor QTc. Have procyclidine available for EPSE.' },
      { name: 'Olanzapine', dose: '10mg IM', route: 'IM', indication: 'Rapid tranquilisation for acute psychosis', notes: 'Do NOT combine with IM benzodiazepine (respiratory depression)' },
      { name: 'Procyclidine', dose: '5mg IM/IV', route: 'IM / IV', indication: 'Acute dystonia / extra-pyramidal side effects from antipsychotics' },
      { name: 'Activated Charcoal', dose: '50g oral (1g/kg in children)', route: 'Oral', indication: 'Overdose < 1–2h (if alert, no vomiting, not contraindicated)', notes: 'Most effective within 1h of ingestion' },
      { name: 'Naloxone', dose: '400mcg IM/IV repeated as needed', route: 'IV / IM', indication: 'Opioid overdose (part of mental health emergency)' },
    ],
    investigations: [
      'FBC, U&E, LFTs, glucose, TFT, urine drug screen', 'Blood alcohol level', 'ECG (QTc for antipsychotics / overdose)',
      'Paracetamol level (4h post-ingestion)', 'Salicylate level (aspirin OD)', 'ABG (respiratory depression)',
    ],
    referrals: [
      { destination: 'Psychiatric Liaison Team / Crisis Resolution Team', reason: 'Psychiatric assessment, crisis plan, place of safety', urgency: 'urgent' },
      { destination: 'CAMHS (Child & Adolescent Mental Health)', reason: 'Under 18 years with mental health emergency', urgency: 'urgent' },
      { destination: 'AMHP (Approved Mental Health Professional)', reason: 'Compulsory detention under MHA if patient lacks capacity and poses risk', urgency: 'urgent' },
      { destination: 'Toxicology / Poisons Unit (0344 892 0111)', reason: 'Complex or unknown overdose — call NPIS for advice', urgency: 'immediate' },
    ],
    dispositionOptions: [
      'Psychiatric inpatient (acute risk to life)',
      'Mental health intensive care unit (MHICU)',
      'Crisis stabilisation unit / place of safety',
      'Discharge with crisis plan + CRHT follow-up (low risk, safe plan in place)',
      'Informal admission (patient consents)',
    ],
  },

  seizure: {
    complaint: 'seizure',
    label: 'Seizure / Epilepsy',
    questions: [
      'Was this a new seizure or a known epileptic?',
      'How long did the seizure last? Has it stopped?',
      'Any aura before the seizure?',
      'Any incontinence, tongue biting, post-ictal confusion?',
      'Any prior seizures, head injury, or stroke?',
      'Any current medications? Any recent changes or missed doses?',
      'Any fever, headache, or neck stiffness (suggesting CNS infection)?',
      'Any alcohol or drug use? Any withdrawal history?',
      'Blood glucose — is the patient diabetic?',
    ],
    redFlags: [
      { symptom: 'Seizure lasting > 5 minutes or two seizures without recovery', reason: 'Status epilepticus', esiLevel: 1 },
      { symptom: 'Post-ictal focal neurological deficit persisting > 1h (Todd\'s paresis)', reason: 'Possible structural lesion', esiLevel: 2 },
      { symptom: 'Seizure + fever + neck stiffness', reason: 'Meningitis / encephalitis', esiLevel: 1 },
    ],
    initialSteps: [
      { step: 'Position: recovery position if not convulsing. Protect airway. Suction if needed.' },
      { step: 'Do NOT restrain. Remove hazards. Protect head with cushion.' },
      { step: 'Time the seizure from onset' },
      { step: 'IV access: check glucose, give dextrose if BG < 3.5', detail: 'Glucose first — exclude hypoglycaemia as cause' },
      { step: 'Lorazepam IV if seizure > 5 minutes', detail: 'Follow trust status epilepticus protocol' },
    ],
    suggestedDrugs: [
      { name: 'Lorazepam', dose: '4mg IV (2mg in children > 4y), repeat once after 10 min', route: 'IV', indication: 'First-line benzodiazepine for status epilepticus', notes: 'Buccal midazolam 10mg if IV access not available' },
      { name: 'Buccal Midazolam', dose: '10mg buccal (adult)', route: 'Buccal', indication: 'Seizure in community or where IV not yet established' },
      { name: 'Levetiracetam', dose: '60mg/kg IV (max 4.5g) over 10 min', route: 'IV', indication: 'Second-line if benzodiazepines fail (status epilepticus)', notes: 'Preferred over phenytoin in UK due to better tolerability' },
      { name: 'Sodium Valproate IV', dose: '40mg/kg IV over 10 min (max 3g)', route: 'IV', indication: 'Second-line option for status epilepticus', notes: 'Avoid in women of childbearing age (teratogenicity)' },
      { name: 'Phenobarbital', dose: '15mg/kg IV at 100mg/min', route: 'IV', indication: 'Third-line (refractory status)', notes: 'Anaesthetic on standby — risk of respiratory/cardiovascular depression' },
    ],
    investigations: [
      'Blood glucose (capillary STAT)', 'U&E (hyponatraemia, hypocalcaemia), FBC, CRP',
      'Antiepileptic drug levels (phenytoin, valproate etc)', 'Blood cultures + LP (if infection suspected)',
      'CT head (first seizure, focal deficit, prolonged post-ictal)', 'MRI brain (further investigation)',
      'EEG (post-stabilisation)', 'ECG (long QT, cardiac cause)',
    ],
    referrals: [
      { destination: 'Neurology / Medical HDU', reason: 'Status epilepticus, first seizure, complex epilepsy', urgency: 'urgent' },
      { destination: 'Neurosurgery', reason: 'Structural lesion causing seizure', urgency: 'urgent' },
      { destination: 'Neurology outpatient', reason: 'Known epilepsy, seizure breakthrough', urgency: 'routine' },
    ],
    dispositionOptions: [
      'Medical HDU (status epilepticus)',
      'Medical ward (new seizure, investigation)',
      'Discharge with neurology follow-up (known epilepsy, fully recovered, clear precipitant)',
      'DVLA notification advice (stop driving — provide patient information)',
    ],
  },

  cardiac_arrest: {
    complaint: 'cardiac_arrest',
    label: 'Cardiac Arrest / Resuscitation',
    questions: [
      'Was this a witnessed or unwitnessed arrest?',
      'How long since collapse? Any bystander CPR?',
      'Initial rhythm: shockable (VF/pulseless VT) or non-shockable (PEA/asystole)?',
      'Reversible causes present? (4Hs and 4Ts: Hypoxia, Hypovolaemia, Hypo/Hyperkalaemia, Hypothermia; Tension pneumothorax, Tamponade, Toxins, Thrombosis)?',
    ],
    redFlags: [
      { symptom: 'No pulse + not breathing', reason: 'Cardiac arrest — activate cardiac arrest call immediately', esiLevel: 1 },
    ],
    initialSteps: [
      { step: 'Call resuscitation team (2222)' },
      { step: 'Start CPR: 30 compressions : 2 breaths. 100–120/min. Depth 5–6cm.' },
      { step: 'Attach defibrillator — assess rhythm. If VF/pVT: shock at 200J biphasic.' },
      { step: 'Manage airway: LMA / ETT. Capnography. 10 breaths/min (do not hyperventilate).' },
      { step: 'IV/IO access. ALS drugs (adrenaline, amiodarone) as per ALS algorithm.' },
      { step: 'Identify and treat reversible causes (4Hs and 4Ts).' },
    ],
    suggestedDrugs: [
      { name: 'Adrenaline 1:10000', dose: '1mg IV/IO', route: 'IV / IO', indication: 'All cardiac arrest rhythms — every 3–5 minutes', notes: 'After 3rd shock in VF/pVT. Immediately in PEA/asystole.' },
      { name: 'Amiodarone', dose: '300mg IV/IO bolus', route: 'IV / IO', indication: 'Shockable rhythm (VF/pVT) after 3rd shock', notes: 'Second dose 150mg after 5th shock' },
      { name: 'Sodium Bicarbonate', dose: '50mmol IV (50mL of 8.4%)', route: 'IV', indication: 'Hyperkalaemia, TCA overdose, prolonged arrest (pH < 7.1)' },
      { name: 'Calcium Gluconate', dose: '10mL of 10% IV', route: 'IV', indication: 'Hyperkalaemia, calcium channel blocker OD' },
      { name: 'Magnesium Sulphate', dose: '2g IV', route: 'IV', indication: 'Torsades de pointes, hypomagnesaemia' },
    ],
    investigations: [
      'Continuous ECG monitoring + 12-lead post-ROSC', 'ABG', 'U&E (K+), glucose, lactate',
      'Troponin, D-dimer (PE)', 'ECHO (tamponade, LV function)', 'CT angiography (PE / aortic cause)',
      'CXR (pneumothorax, line position)', 'Temperature (hypothermia)',
    ],
    referrals: [
      { destination: 'Catheter Lab / Cardiology', reason: 'Post-ROSC STEMI or suspected cardiac cause', urgency: 'immediate' },
      { destination: 'ICU / Critical Care', reason: 'Post-cardiac arrest care, targeted temperature management', urgency: 'immediate' },
      { destination: 'Cardiothoracic Surgery / IR', reason: 'Tamponade, massive PE', urgency: 'immediate' },
    ],
    dispositionOptions: ['ICU (post-ROSC care)', 'Cath lab (STEMI)', 'Palliative care (DNAR decision)', 'ECMO centre (refractory cardiac arrest)'],
  },

  obstetric: {
    complaint: 'obstetric',
    label: 'Obstetric Emergency',
    questions: [
      'How many weeks pregnant?',
      'Any vaginal bleeding — how much and any clots?',
      'Any abdominal pain or uterine contractions?',
      'Any headache, visual disturbance, or epigastric pain?',
      'Any reduced fetal movement?',
      'Any previous pregnancy complications? GBS status?',
      'BP and urine dipstick (proteinuria)?',
    ],
    redFlags: [
      { symptom: 'Massive PPH (> 500mL after vaginal / > 1L after CS)', reason: 'Postpartum haemorrhage — immediate haemostasis', esiLevel: 1 },
      { symptom: 'BP > 160/110 + headache + seizures', reason: 'Eclampsia — give magnesium immediately', esiLevel: 1 },
      { symptom: 'Placental abruption + fetal bradycardia', reason: 'Fetal distress — urgent delivery', esiLevel: 1 },
      { symptom: 'Cord prolapse', reason: 'Emergency caesarean section', esiLevel: 1 },
    ],
    initialSteps: [
      { step: 'Continuous CTG monitoring (if ≥ 26 weeks)' },
      { step: 'IV access, FBC, group & save / crossmatch (if bleeding)' },
      { step: 'Urgent obstetric review (bleep obstetric team)' },
      { step: 'Left lateral positioning (avoid aortocaval compression from 20 weeks)' },
    ],
    suggestedDrugs: [
      { name: 'Oxytocin', dose: '10 units IM stat; 40 units in 500mL infusion', route: 'IM / IV', indication: 'Postpartum haemorrhage (uterotonic)' },
      { name: 'Magnesium Sulphate', dose: '4g IV over 5–15 min (loading), then 1g/h infusion', route: 'IV', indication: 'Eclampsia / pre-eclampsia seizure prophylaxis', notes: 'Monitor urine output, reflexes, RR. Antidote: Calcium gluconate 10mL 10% IV.' },
      { name: 'Labetalol', dose: '200mg oral or 50mg IV', route: 'Oral / IV', indication: 'Severe hypertension in pre-eclampsia', notes: 'Target SBP < 150, DBP < 100. Avoid in asthma.' },
      { name: 'Hydralazine', dose: '5mg slow IV', route: 'IV', indication: 'Hypertensive urgency in pre-eclampsia if labetalol contraindicated' },
      { name: 'Tranexamic Acid', dose: '1g IV within 3h of PPH onset', route: 'IV', indication: 'PPH — reduces mortality (WOMAN trial evidence)', notes: 'Give early alongside uterotonics' },
    ],
    investigations: [
      'FBC, clotting (DIC screen in PPH), U&E, LFTs, uric acid', 'Group & save / crossmatch',
      'Urine dip (proteinuria)', 'CTG trace', 'USS (fetal biometry, placenta, cord)',
    ],
    referrals: [
      { destination: 'Obstetric / Midwifery team (emergency bleep)', reason: 'Any obstetric emergency', urgency: 'immediate' },
      { destination: 'ITU / HDU', reason: 'Eclampsia, severe sepsis in pregnancy', urgency: 'immediate' },
      { destination: 'Neonatology / NICU', reason: 'Preterm delivery, fetal distress', urgency: 'immediate' },
    ],
    dispositionOptions: ['Delivery suite / theatre', 'HDU (pre-eclampsia / eclampsia)', 'Maternity ward', 'Obstetric unit'],
  },

  paediatric_fever: {
    complaint: 'paediatric_fever',
    label: 'Paediatric Fever',
    questions: [
      'How old is the child?',
      'How high is the temperature?',
      'Is the child alert and responsive, or lethargic / difficult to rouse?',
      'Any rash? Describe it — does it blanch?',
      'Any neck stiffness, photophobia, or unusual cry?',
      'Any respiratory distress, grunting, or nasal flaring?',
      'Any vomiting, diarrhoea, or signs of dehydration (dry mouth, no tears, sunken fontanelle)?',
      'Any source: ear pain, sore throat, urinary symptoms?',
      'Vaccination history — up to date?',
      'Any contact with chickenpox, meningitis, or TB?',
    ],
    redFlags: [
      { symptom: 'Petechial / purpuric non-blanching rash', reason: 'Meningococcal disease — give penicillin immediately', esiLevel: 1 },
      { symptom: 'Age < 1 month + fever ≥ 38°C', reason: 'Neonatal sepsis — full sepsis work-up + IV antibiotics immediately', esiLevel: 1 },
      { symptom: 'Bulging fontanelle + fever', reason: 'Meningitis', esiLevel: 1 },
      { symptom: 'Grunting respiration + recession + SpO2 < 92%', reason: 'Severe respiratory infection / sepsis', esiLevel: 1 },
      { symptom: 'Persistent crying + inconsolable + tense abdomen', reason: 'Intussusception, peritonitis, meningitis', esiLevel: 2 },
    ],
    initialSteps: [
      { step: 'Paediatric triage: AVPU, HR, RR, temperature, CRT, SpO2' },
      { step: 'Apply NICE Traffic Light System (green/amber/red) for fever in < 5 years' },
      { step: 'Assess for sepsis in children: NICE NG51 / Paediatric Early Warning Score (PEWS)' },
      { step: 'Urine dip (MC&S in children with fever, especially < 2 years)' },
    ],
    suggestedDrugs: [
      { name: 'Paracetamol', dose: '15mg/kg oral / 20mg/kg rectal (max 1g)', route: 'Oral / Rectal / IV', indication: 'Antipyresis and analgesia', notes: 'Max 4 doses/day. Weight-based dosing is essential.' },
      { name: 'Ibuprofen', dose: '5–10mg/kg (max 400mg) with food', route: 'Oral', indication: 'Pyrexia / pain (> 3 months, not hypotrophic / dehydrated)', notes: 'Alternate with paracetamol (not simultaneously) if one alone inadequate' },
      { name: 'Amoxicillin', dose: '25mg/kg TDS (max 1g TDS)', route: 'Oral / IV', indication: 'Community-acquired pneumonia, otitis media' },
      { name: 'Benzylpenicillin', dose: '50mg/kg IV (max 2.4g)', route: 'IV', indication: 'Suspected meningococcal disease — GIVE IMMEDIATELY', notes: 'Before referral if IV access available; no delay for LP' },
      { name: 'Ceftriaxone', dose: '80mg/kg IV OD (max 4g)', route: 'IV', indication: 'Bacterial meningitis treatment (empirical)' },
    ],
    investigations: [
      'FBC, CRP, U&E, blood culture', 'Urine MC&S', 'Blood glucose', 'CXR (if respiratory signs)',
      'LP (if meningitis suspected — unless signs of raised ICP)', 'Malaria film (if travel history)',
      'Throat swab (GAS)', 'Throat swab + nasal swab (flu, RSV)',
    ],
    referrals: [
      { destination: 'Paediatric HDU / PICU', reason: 'Sepsis, meningitis, severe respiratory distress', urgency: 'immediate' },
      { destination: 'Paediatrics ward', reason: 'Unexplained fever, moderate dehydration, complex infection', urgency: 'urgent' },
      { destination: 'GP / community (if discharged)', reason: 'Low-risk viral fever — safety net advice', urgency: 'routine' },
    ],
    dispositionOptions: [
      'PICU (septic shock, critical illness)',
      'Paediatric ward (moderate illness, investigation)',
      'Discharge with safety netting (low-risk, NICE traffic light green/amber)',
    ],
  },

  overdose_poisoning: {
    complaint: 'overdose_poisoning',
    label: 'Overdose / Poisoning',
    questions: [
      'What substance(s) were taken and in what quantity?',
      'When was the ingestion? Is the exposure still ongoing?',
      'Deliberate self-harm or accidental?',
      'Any vomiting since ingestion?',
      'Current GCS / level of consciousness?',
      'Any history of mental health conditions or previous overdoses?',
      'Any other medications at home?',
    ],
    redFlags: [
      { symptom: 'GCS < 8 following overdose', reason: 'Airway at risk — intubation may be needed', esiLevel: 1 },
      { symptom: 'Paracetamol overdose (> 75mg/kg or staggered)', reason: 'Potentially fatal hepatotoxicity — treat with N-acetylcysteine', esiLevel: 2 },
      { symptom: 'QTc > 500ms on ECG after TCA / antipsychotic OD', reason: 'Risk of torsades de pointes', esiLevel: 1 },
      { symptom: 'Serotonin syndrome (hyperthermia + clonus + agitation)', reason: 'Serotonin toxicity — cyproheptadine + supportive care', esiLevel: 2 },
    ],
    initialSteps: [
      { step: 'Call NPIS (National Poisons Information Service): 0344 892 0111 or www.toxbase.org' },
      { step: 'ABCDE — protect airway if GCS low. IV access. ECG (QTc).' },
      { step: 'Paracetamol level at 4h; salicylate level if aspirin suspected' },
      { step: 'Activated charcoal 50g if < 1–2h since ingestion and airway protected' },
    ],
    suggestedDrugs: [
      { name: 'N-Acetylcysteine (NAC)', dose: 'Three-bag IV regimen (150mg/kg/200mL over 1h, then 50mg/kg/500mL over 4h, then 100mg/kg/1L over 16h)', route: 'IV', indication: 'Paracetamol overdose — consult TOXBASE for exact nomogram assessment', notes: 'Start NAC if level above treatment line on Rumack-Matthew nomogram' },
      { name: 'Naloxone', dose: '400mcg–2mg IV/IM, repeat every 2–3 min', route: 'IV / IM', indication: 'Opioid overdose — pin-point pupils, respiratory depression' },
      { name: 'Flumazenil', dose: '200mcg IV over 15 sec, repeat 100mcg every 60s (max 1mg)', route: 'IV', indication: 'Benzodiazepine overdose — caution: may precipitate seizures if mixed OD or BZD-dependent', notes: 'Not routinely recommended — senior clinician decision' },
      { name: 'Sodium Bicarbonate', dose: '100mL 8.4% IV bolus', route: 'IV', indication: 'TCA overdose (broadens QRS) or salicylate poisoning (urinary alkalinisation)' },
      { name: 'Activated Charcoal', dose: '50g oral (1g/kg child)', route: 'Oral', indication: 'Multiple-drug OD < 1–2h, conscious, no airway risk, no contraindication', notes: 'Not for alcohols, metals, caustics, hydrocarbons' },
    ],
    investigations: [
      'Paracetamol level (4h post-ingestion), salicylate level', 'FBC, U&E, LFTs, INR',
      'Blood glucose', 'ABG (metabolic acidosis)', 'ECG (QTc, QRS width)',
      'Urine drug screen', 'Beta-hCG (female patients)', 'Blood alcohol level',
    ],
    referrals: [
      { destination: 'Toxicology / NPIS (0344 892 0111)', reason: 'Unknown substance or complex overdose — phone for guidance', urgency: 'immediate' },
      { destination: 'ICU', reason: 'GCS < 8, haemodynamic instability, need for antidote infusion', urgency: 'immediate' },
      { destination: 'Psychiatric Liaison', reason: 'Deliberate self-harm — mental health review before discharge', urgency: 'urgent' },
      { destination: 'Liver team', reason: 'Paracetamol-induced ALF (King\'s College criteria met)', urgency: 'urgent' },
    ],
    dispositionOptions: [
      'ICU / HDU (severe overdose, airway compromise)',
      'Medical ward (paracetamol — complete NAC, observe LFTs)',
      'Observation unit (asymptomatic, low risk)',
      'Discharge after psychiatric review + safety plan (intentional OD)',
    ],
  },

  other: {
    complaint: 'other',
    label: 'Other / General',
    questions: [
      'What is the main complaint today?',
      'When did symptoms begin?',
      'Any associated symptoms?',
      'Any relevant past medical history?',
      'What medications are you taking?',
      'Any allergies?',
    ],
    redFlags: [
      { symptom: 'Any rapidly deteriorating vital signs', reason: 'Deteriorating patient — escalate', esiLevel: 1 },
    ],
    initialSteps: [
      { step: 'Full set of observations: HR, BP, RR, SpO2, Temperature, Blood glucose' },
      { step: 'Full history and physical examination' },
      { step: 'Assess using NEWS2 score' },
    ],
    suggestedDrugs: [],
    investigations: ['As guided by clinical findings'],
    referrals: [],
    dispositionOptions: ['Depends on clinical findings'],
  },
};

import { TRIAGE_PROTOCOLS_EXTENDED, type ExtendedChiefComplaint } from './triageProtocolsExtended';

export type AllChiefComplaint = ChiefComplaint | ExtendedChiefComplaint;

// Merged registry of all triage protocols (core + extended)
export const ALL_TRIAGE_PROTOCOLS: Record<string, TriageProtocol> = {
  ...TRIAGE_PROTOCOLS,
  ...TRIAGE_PROTOCOLS_EXTENDED,
};

// Categorised options for the picker
export const COMPLAINT_CATEGORIES: { label: string; options: { value: string; label: string }[] }[] = [
  {
    label: 'Critical / Emergency',
    options: [
      { value: 'cardiac_arrest', label: 'Cardiac Arrest' }, { value: 'anaphylaxis', label: 'Anaphylaxis' },
      { value: 'stroke_symptoms', label: 'Stroke Symptoms' }, { value: 'sepsis', label: 'Sepsis' },
      { value: 'trauma_injury', label: 'Major Trauma' }, { value: 'overdose_poisoning', label: 'Overdose / Poisoning' },
    ],
  },
  {
    label: 'Cardiovascular',
    options: [
      { value: 'chest_pain', label: 'Chest Pain' }, { value: 'palpitations', label: 'Palpitations / Arrhythmia' },
      { value: 'syncope', label: 'Syncope / Collapse' }, { value: 'hypertensive_emergency', label: 'Hypertensive Emergency' },
      { value: 'heart_failure_decomp', label: 'Decompensated Heart Failure' }, { value: 'dvt_suspected', label: 'Suspected DVT' },
    ],
  },
  {
    label: 'Respiratory',
    options: [
      { value: 'shortness_of_breath', label: 'Shortness of Breath' }, { value: 'acute_asthma_exacerbation', label: 'Acute Asthma' },
      { value: 'haemoptysis', label: 'Haemoptysis' }, { value: 'pneumothorax', label: 'Pneumothorax' },
      { value: 'croup', label: 'Croup (Paediatric)' },
    ],
  },
  {
    label: 'Neurological',
    options: [
      { value: 'headache', label: 'Headache' }, { value: 'headache_thunderclap', label: 'Thunderclap Headache' },
      { value: 'seizure', label: 'Seizure' }, { value: 'focal_weakness', label: 'Focal Weakness' },
      { value: 'dizziness_vertigo', label: 'Dizziness / Vertigo' }, { value: 'acute_confusion_delirium', label: 'Acute Confusion / Delirium' },
      { value: 'meningitis_suspected', label: 'Suspected Meningitis' },
    ],
  },
  {
    label: 'Gastrointestinal',
    options: [
      { value: 'abdominal_pain', label: 'Abdominal Pain' }, { value: 'nausea_vomiting', label: 'Nausea & Vomiting' },
      { value: 'diarrhoea', label: 'Diarrhoea' }, { value: 'constipation', label: 'Constipation' },
      { value: 'upper_gi_bleed', label: 'Upper GI Bleed' }, { value: 'lower_gi_bleed', label: 'Lower GI Bleed' },
      { value: 'jaundice', label: 'Jaundice' }, { value: 'dysphagia', label: 'Dysphagia' },
      { value: 'bowel_obstruction', label: 'Bowel Obstruction' }, { value: 'pancreatitis', label: 'Pancreatitis' },
    ],
  },
  {
    label: 'Genitourinary',
    options: [
      { value: 'uti', label: 'UTI' }, { value: 'renal_colic', label: 'Renal Colic' },
      { value: 'urinary_retention', label: 'Urinary Retention' }, { value: 'haematuria', label: 'Haematuria' },
      { value: 'acute_kidney_injury', label: 'Acute Kidney Injury' }, { value: 'testicular_pain', label: 'Acute Testicular Pain' },
    ],
  },
  {
    label: 'Musculoskeletal & Skin',
    options: [
      { value: 'back_pain', label: 'Back Pain' }, { value: 'joint_swelling', label: 'Joint Swelling' },
      { value: 'limb_fracture', label: 'Limb Fracture' }, { value: 'soft_tissue_injury', label: 'Soft Tissue Injury' },
      { value: 'rash_urticaria', label: 'Rash / Urticaria' }, { value: 'cellulitis', label: 'Cellulitis' },
      { value: 'burns_scalds', label: 'Burns / Scalds' },
    ],
  },
  {
    label: 'ENT & Eyes',
    options: [
      { value: 'ear_pain', label: 'Ear Pain' }, { value: 'sore_throat', label: 'Sore Throat' },
      { value: 'epistaxis', label: 'Epistaxis' }, { value: 'dental_pain', label: 'Dental Pain' },
      { value: 'red_eye', label: 'Red Eye' }, { value: 'visual_loss', label: 'Sudden Visual Loss' },
      { value: 'eye_injury', label: 'Eye Injury' },
    ],
  },
  {
    label: 'Obstetric & Gynaecology',
    options: [
      { value: 'obstetric', label: 'Obstetric Emergency' }, { value: 'ectopic_pregnancy_suspected', label: 'Suspected Ectopic' },
      { value: 'hyperemesis_gravidarum', label: 'Hyperemesis Gravidarum' }, { value: 'vaginal_bleeding_non_pregnant', label: 'Vaginal Bleeding' },
      { value: 'pelvic_pain', label: 'Pelvic Pain' },
    ],
  },
  {
    label: 'Paediatric',
    options: [
      { value: 'paediatric_fever', label: 'Paediatric Fever' }, { value: 'paediatric_wheeze', label: 'Paediatric Wheeze' },
      { value: 'febrile_seizure', label: 'Febrile Seizure' }, { value: 'neonatal_jaundice', label: 'Neonatal Jaundice' },
      { value: 'paediatric_head_injury', label: 'Paediatric Head Injury' },
    ],
  },
  {
    label: 'Endocrine & Metabolic',
    options: [
      { value: 'diabetic_emergency', label: 'Diabetic Emergency' }, { value: 'hypoglycaemia', label: 'Hypoglycaemia' },
      { value: 'thyroid_storm', label: 'Thyroid Storm' }, { value: 'adrenal_crisis', label: 'Adrenal Crisis' },
    ],
  },
  {
    label: 'Haematology / Oncology',
    options: [
      { value: 'sickle_cell_crisis', label: 'Sickle Cell Crisis' }, { value: 'neutropenic_sepsis', label: 'Neutropenic Sepsis' },
      { value: 'anaemia_symptomatic', label: 'Symptomatic Anaemia' },
    ],
  },
  {
    label: 'Psychiatric',
    options: [
      { value: 'mental_health', label: 'Mental Health Crisis' }, { value: 'acute_psychosis', label: 'Acute Psychosis' },
      { value: 'alcohol_withdrawal', label: 'Alcohol Withdrawal' }, { value: 'self_harm', label: 'Self-harm' },
      { value: 'panic_attack', label: 'Panic Attack' },
    ],
  },
  {
    label: 'Infectious & Toxicology',
    options: [
      { value: 'fever', label: 'Fever (Adult)' }, { value: 'malaria_suspected', label: 'Suspected Malaria' },
      { value: 'carbon_monoxide', label: 'Carbon Monoxide Poisoning' }, { value: 'snake_bite', label: 'Snake Bite' },
      { value: 'electrical_injury', label: 'Electrical Injury' },
    ],
  },
  {
    label: 'Other',
    options: [{ value: 'other', label: 'Other / General' }],
  },
];

export const COMPLAINT_OPTIONS = COMPLAINT_CATEGORIES.flatMap((c) => c.options);

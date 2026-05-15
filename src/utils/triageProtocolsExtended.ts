// Extended NHS-style triage protocols covering 55+ additional presenting problems
// Organised by body system. Concise but clinically accurate per NICE/NHS pathways.

import type { TriageProtocol } from './triageProtocols';

export type ExtendedChiefComplaint =
  // Cardiovascular
  | 'palpitations' | 'syncope' | 'hypertensive_emergency' | 'heart_failure_decomp' | 'dvt_suspected'
  // Respiratory
  | 'haemoptysis' | 'croup' | 'pneumothorax' | 'acute_asthma_exacerbation'
  // Neurological
  | 'dizziness_vertigo' | 'acute_confusion_delirium' | 'focal_weakness' | 'meningitis_suspected' | 'headache_thunderclap'
  // GI
  | 'nausea_vomiting' | 'diarrhoea' | 'upper_gi_bleed' | 'lower_gi_bleed' | 'jaundice' | 'dysphagia' | 'bowel_obstruction' | 'pancreatitis' | 'constipation'
  // GU
  | 'uti' | 'renal_colic' | 'urinary_retention' | 'haematuria' | 'acute_kidney_injury' | 'testicular_pain'
  // MSK
  | 'back_pain' | 'joint_swelling' | 'limb_fracture' | 'soft_tissue_injury'
  // Skin
  | 'rash_urticaria' | 'cellulitis' | 'burns_scalds'
  // ENT
  | 'ear_pain' | 'sore_throat' | 'epistaxis' | 'dental_pain'
  // Eyes
  | 'red_eye' | 'visual_loss' | 'eye_injury'
  // Gynaecology
  | 'vaginal_bleeding_non_pregnant' | 'pelvic_pain' | 'hyperemesis_gravidarum' | 'ectopic_pregnancy_suspected'
  // Paediatric
  | 'paediatric_wheeze' | 'febrile_seizure' | 'neonatal_jaundice' | 'paediatric_head_injury'
  // Endocrine
  | 'thyroid_storm' | 'adrenal_crisis' | 'hypoglycaemia'
  // Haematology / Oncology
  | 'sickle_cell_crisis' | 'neutropenic_sepsis' | 'anaemia_symptomatic'
  // Psychiatric
  | 'acute_psychosis' | 'alcohol_withdrawal' | 'self_harm' | 'panic_attack'
  // Infectious / Toxicology
  | 'sepsis' | 'malaria_suspected' | 'carbon_monoxide' | 'snake_bite' | 'electrical_injury';

const protocol = (
  c: ExtendedChiefComplaint, l: string, q: string[],
  rf: TriageProtocol['redFlags'], is: TriageProtocol['initialSteps'],
  sd: TriageProtocol['suggestedDrugs'], inv: string[],
  ref: TriageProtocol['referrals'], dp: string[]
): TriageProtocol => ({
  complaint: c as never, label: l, questions: q, redFlags: rf,
  initialSteps: is, suggestedDrugs: sd, investigations: inv,
  referrals: ref, dispositionOptions: dp,
});

export const TRIAGE_PROTOCOLS_EXTENDED: Record<ExtendedChiefComplaint, TriageProtocol> = {
  palpitations: protocol('palpitations', 'Palpitations / Arrhythmia',
    ['When did it start — sudden or gradual?', 'Regular or irregular rhythm?', 'Associated chest pain, SOB, syncope?', 'Caffeine, alcohol, stimulant, or recreational drug use?', 'Known cardiac history or arrhythmia?', 'Family history of sudden cardiac death?'],
    [
      { symptom: 'Palpitations + chest pain + syncope', reason: 'VT / haemodynamically unstable arrhythmia', esiLevel: 1 },
      { symptom: 'HR > 150 with hypotension or LOC', reason: 'Unstable tachyarrhythmia — DC cardioversion', esiLevel: 1 },
      { symptom: 'HR < 40 with hypotension or LOC', reason: 'Symptomatic bradycardia / heart block', esiLevel: 2 },
    ],
    [{ step: '12-lead ECG within 10 min + cardiac monitor' }, { step: 'IV access, FBC, U&E, Mg, TFTs, troponin' }, { step: 'Identify rhythm: AF / SVT / VT / sinus tachy' }, { step: 'Vagal manoeuvres if SVT and stable' }],
    [
      { name: 'Adenosine', dose: '6mg rapid IV bolus → 12mg → 12mg if no response', route: 'IV (large-bore antecubital)', indication: 'Stable narrow-complex SVT', notes: 'Warn pt of transient chest discomfort. Have resus ready.' },
      { name: 'Amiodarone', dose: '300mg IV over 20–60min', route: 'IV (central preferred)', indication: 'Stable broad-complex tachycardia / refractory AF' },
      { name: 'Bisoprolol', dose: '2.5–5mg PO', route: 'Oral', indication: 'AF rate control (stable)' },
      { name: 'Atropine', dose: '500mcg IV repeat to 3mg', route: 'IV', indication: 'Symptomatic bradycardia' },
    ],
    ['12-lead ECG + rhythm strip', 'FBC, U&E, Mg, Ca, TFTs', 'Troponin (if chest pain)', 'CXR', 'Echo (outpatient)', 'Holter monitor (outpatient)'],
    [{ destination: 'Cardiology', reason: 'New AF, broad-complex tachycardia, recurrent SVT', urgency: 'urgent' }, { destination: 'Resus / Cardiology', reason: 'Unstable arrhythmia', urgency: 'immediate' }],
    ['Resus (unstable)', 'CDU monitoring', 'Cardiology admission', 'Discharge with cardiology follow-up if stable + reverted']
  ),

  syncope: protocol('syncope', 'Syncope / Collapse',
    ['What were you doing just before — exertion, standing, coughing, urinating?', 'Any warning (light-headed, palpitations, sweating)?', 'Duration of LOC and recovery?', 'Witnessed seizure activity, tongue bite, incontinence?', 'Any chest pain, SOB, or palpitations?', 'Family history of sudden cardiac death?'],
    [
      { symptom: 'Exertional syncope', reason: 'HOCM / aortic stenosis / arrhythmia — cardiac cause', esiLevel: 2 },
      { symptom: 'Syncope + new murmur or signs of HF', reason: 'Structural heart disease', esiLevel: 2 },
      { symptom: 'Syncope + chest pain or back pain', reason: 'ACS / PE / aortic dissection', esiLevel: 1 },
      { symptom: 'Family h/o sudden death + syncope', reason: 'Long QT, Brugada, HOCM', esiLevel: 2 },
    ],
    [{ step: '12-lead ECG (look for ischaemia, long QT, Brugada, HOCM, AV block)' }, { step: 'Lying & standing BP (postural drop)' }, { step: 'Blood glucose, FBC, U&E, troponin if suspected cardiac' }, { step: 'Apply San Francisco Syncope Rule / ROSE criteria' }],
    [{ name: 'IV crystalloid', dose: '500mL bolus', route: 'IV', indication: 'Hypovolaemic / vasovagal with hypotension' }],
    ['12-lead ECG', 'FBC, U&E, glucose', 'Troponin (if cardiac concern)', 'Beta-hCG (women of reproductive age)', 'CT head (if head injury or focal neurology)', 'Echo (cardiac cause suspected)', 'Tilt-table (recurrent)'],
    [{ destination: 'Cardiology', reason: 'Cardiac syncope suspected (high-risk ECG, exertional)', urgency: 'urgent' }, { destination: 'Acute medicine', reason: 'Unexplained syncope in elderly / high risk', urgency: 'urgent' }],
    ['CDU for monitored observation', 'Cardiology admission', 'Discharge with falls / syncope clinic referral (low risk)']
  ),

  hypertensive_emergency: protocol('hypertensive_emergency', 'Hypertensive Emergency',
    ['What is the BP reading?', 'Any headache, visual change, chest pain, SOB, neuro symptoms?', 'Pregnancy status?', 'Compliance with antihypertensive medication?', 'Any recent cocaine or stimulant use?'],
    [
      { symptom: 'SBP ≥ 180 / DBP ≥ 120 + end-organ damage', reason: 'Hypertensive EMERGENCY — IV antihypertensive', esiLevel: 1 },
      { symptom: 'Severe hypertension + chest pain', reason: 'Aortic dissection / ACS', esiLevel: 1 },
      { symptom: 'Severe hypertension + neuro deficit', reason: 'Stroke / hypertensive encephalopathy', esiLevel: 1 },
      { symptom: 'Pregnancy + BP > 160/110', reason: 'Severe pre-eclampsia', esiLevel: 1 },
    ],
    [{ step: 'Recheck BP both arms, manual cuff' }, { step: 'Fundoscopy (papilloedema, haemorrhages)' }, { step: 'ECG, urinalysis (proteinuria, haematuria), bloods' }, { step: 'Target BP reduction: ≤ 25% in first hour (not too fast — risk of cerebral hypoperfusion)' }],
    [
      { name: 'Labetalol', dose: '20mg IV bolus, repeat every 10min up to 300mg; or infusion 2mg/min', route: 'IV', indication: 'First-line in most hypertensive emergencies', notes: 'Avoid in severe asthma, HF, bradycardia' },
      { name: 'GTN', dose: 'Infusion 5–200mcg/min', route: 'IV', indication: 'Pulmonary oedema or aortic dissection' },
      { name: 'Hydralazine', dose: '5–10mg IV', route: 'IV', indication: 'Pre-eclampsia / eclampsia' },
      { name: 'Magnesium Sulphate', dose: '4g IV loading, 1g/h', route: 'IV', indication: 'Eclampsia' },
    ],
    ['ECG, troponin', 'U&E, creatinine, eGFR', 'Urinalysis (protein, blood)', 'CXR', 'CT head (if neuro signs)', 'CT aorta (if dissection)', 'Echo'],
    [{ destination: 'ICU / HDU', reason: 'IV antihypertensive infusion + organ damage', urgency: 'immediate' }, { destination: 'Stroke unit', reason: 'Hypertensive encephalopathy / stroke', urgency: 'immediate' }],
    ['ICU / HDU', 'CCU', 'Acute medicine', 'Discharge with GP urgent f/u (hypertensive urgency, no end-organ damage)']
  ),

  heart_failure_decomp: protocol('heart_failure_decomp', 'Acute Decompensated Heart Failure',
    ['How short of breath — at rest, on exertion, lying flat?', 'Any orthopnoea or PND?', 'Recent weight gain or ankle swelling?', 'Chest pain?', 'Known HF — recent medication change or missed doses?', 'Salt or fluid intake?'],
    [
      { symptom: 'Pink frothy sputum + acute breathlessness', reason: 'Acute pulmonary oedema', esiLevel: 1 },
      { symptom: 'SBP < 90 + signs of HF', reason: 'Cardiogenic shock', esiLevel: 1 },
      { symptom: 'SpO2 < 90% on air', reason: 'Hypoxia — needs ventilatory support', esiLevel: 1 },
    ],
    [{ step: 'Sit patient upright, high-flow O2 (target SpO2 94–98%)' }, { step: 'IV access; ABG; ECG; CXR; bloods incl BNP/NT-proBNP, troponin' }, { step: 'Catheterise to monitor urine output' }, { step: 'Consider CPAP early in pulmonary oedema' }],
    [
      { name: 'Furosemide', dose: '40–80mg IV bolus (double oral dose if on it)', route: 'IV', indication: 'Pulmonary congestion' },
      { name: 'GTN infusion', dose: '10–200 mcg/min titrated', route: 'IV', indication: 'Pulmonary oedema with SBP > 110', notes: 'Avoid if SBP < 90' },
      { name: 'Morphine', dose: '2.5–5mg IV', route: 'IV', indication: 'Severe distress (use cautiously — no longer routine)' },
      { name: 'Dobutamine', dose: '2.5–10 mcg/kg/min', route: 'IV', indication: 'Cardiogenic shock with adequate filling' },
    ],
    ['ECG', 'CXR', 'BNP / NT-proBNP', 'Troponin', 'U&E, creatinine, LFTs, TFTs', 'ABG', 'Echo (urgent if new HF)'],
    [{ destination: 'CCU / HDU', reason: 'Severe pulmonary oedema / cardiogenic shock', urgency: 'immediate' }, { destination: 'Cardiology', reason: 'New diagnosis or decompensation', urgency: 'urgent' }],
    ['ICU (intubation / CPAP)', 'CCU', 'Cardiology ward', 'Acute medicine with HF nurse follow-up']
  ),

  dvt_suspected: protocol('dvt_suspected', 'Suspected DVT',
    ['Which leg, where, since when?', 'Any swelling, redness, warmth?', 'Recent surgery, immobility, long-haul travel?', 'Cancer history, OCP, pregnancy, prior VTE?', 'Family history of clotting disorder?', 'Any chest pain / SOB / haemoptysis (PE)?'],
    [
      { symptom: 'Leg DVT + chest pain or SOB', reason: 'Concurrent PE', esiLevel: 2 },
      { symptom: 'Phlegmasia cerulea dolens (massive iliofemoral DVT)', reason: 'Limb-threatening — urgent thrombolysis / thrombectomy', esiLevel: 1 },
    ],
    [{ step: 'Apply Wells DVT score' }, { step: 'D-dimer if Wells low/moderate; USS Doppler if high or +D-dimer' }, { step: 'Measure calf circumference 10cm below tibial tuberosity' }, { step: 'Assess for PE (Wells PE, PERC)' }],
    [
      { name: 'Apixaban', dose: '10mg BD ×7d then 5mg BD', route: 'Oral', indication: 'Confirmed or pending USS confirmation of DVT' },
      { name: 'Rivaroxaban', dose: '15mg BD ×21d then 20mg OD', route: 'Oral', indication: 'Alternative DOAC' },
      { name: 'Enoxaparin (LMWH)', dose: '1.5mg/kg SC OD or 1mg/kg BD', route: 'SC', indication: 'Pregnancy, cancer, renal impairment, awaiting scan' },
    ],
    ['D-dimer (if Wells < 2)', 'USS Doppler proximal leg veins', 'FBC, U&E, LFTs, clotting', 'Pregnancy test', 'CTPA if PE suspected'],
    [{ destination: 'DVT / Ambulatory clinic', reason: 'Confirmed DVT — outpatient pathway', urgency: 'urgent' }, { destination: 'Vascular Surgery / IR', reason: 'Phlegmasia or extensive iliofemoral DVT', urgency: 'immediate' }],
    ['Discharge on DOAC with DVT clinic follow-up', 'Admission (PE concurrent, pregnancy, cancer)', 'IR for catheter-directed thrombolysis (phlegmasia)']
  ),

  haemoptysis: protocol('haemoptysis', 'Haemoptysis',
    ['How much blood — streaks, teaspoons, cupfuls?', 'How long has it been happening?', 'Any associated cough, fever, weight loss, night sweats?', 'Smoker? Pack-years?', 'TB risk (travel, contacts, prison)?', 'Anticoagulant use?', 'Any chest pain or breathlessness (PE)?'],
    [
      { symptom: 'Massive haemoptysis (> 200mL/24h or > 100mL single)', reason: 'Life-threatening — airway protection', esiLevel: 1 },
      { symptom: 'Haemoptysis + haemodynamic instability', reason: 'Massive bleed', esiLevel: 1 },
      { symptom: 'Haemoptysis + weight loss + smoker', reason: 'Lung cancer 2WW', esiLevel: 3 },
    ],
    [{ step: 'Sit upright, position bleeding side down if known' }, { step: 'Wide-bore IV access, FBC, clotting, group & save' }, { step: 'CXR; consider CT chest' }, { step: 'NPSA if anticoagulant — reverse if massive bleed' }],
    [{ name: 'Tranexamic Acid', dose: '1g IV stat, then 1g TDS', route: 'IV / oral / nebulised', indication: 'Significant haemoptysis' }, { name: 'Vitamin K', dose: '5–10mg IV', route: 'IV', indication: 'Warfarin reversal' }],
    ['CXR', 'CT chest (contrast)', 'FBC, clotting, group & save', 'Sputum AFB & culture', 'Bronchoscopy (definitive)'],
    [{ destination: 'Respiratory / IR (bronchial artery embolisation)', reason: 'Massive haemoptysis', urgency: 'immediate' }, { destination: 'Respiratory 2WW', reason: 'Suspected lung cancer', urgency: 'urgent' }],
    ['ICU (massive haemoptysis)', 'Respiratory ward', 'Discharge with 2WW CT chest']
  ),

  croup: protocol('croup', 'Croup (Paediatric)',
    ['Child age and weight?', 'Onset — barking cough, stridor, hoarseness?', 'Any drooling, inability to swallow (think epiglottitis)?', 'Recent URTI?', 'Vaccination status (Hib)?', 'Severity at rest vs on agitation?'],
    [
      { symptom: 'Stridor at rest + cyanosis + lethargy', reason: 'Severe / impending respiratory failure', esiLevel: 1 },
      { symptom: 'Drooling + tripod position + toxic appearance', reason: 'Epiglottitis — DO NOT examine throat, call anaesthetics', esiLevel: 1 },
      { symptom: 'Stridor at rest + sternal recession', reason: 'Moderate–severe croup', esiLevel: 2 },
    ],
    [{ step: 'Keep child calm — parent holding; minimise distress' }, { step: 'Apply Westley Croup Score' }, { step: 'Avoid throat examination if epiglottitis suspected' }, { step: 'Humidified O2 if SpO2 < 94%' }],
    [
      { name: 'Dexamethasone', dose: '0.15mg/kg PO single dose (max 6mg)', route: 'Oral', indication: 'All croup severities — first line' },
      { name: 'Budesonide', dose: '2mg nebulised', route: 'Nebulised', indication: 'If unable to take oral dex' },
      { name: 'Adrenaline nebulised', dose: '0.5mL/kg 1:1000 (max 5mL) nebulised', route: 'Nebulised', indication: 'Moderate–severe croup — observe 2–4h after' },
    ],
    ['Clinical diagnosis — avoid investigations unless atypical', 'CXR / lateral neck X-ray (only if alternative dx suspected)'],
    [{ destination: 'Paediatrics / PICU', reason: 'Severe croup, suspected epiglottitis', urgency: 'immediate' }, { destination: 'Paediatric ward', reason: 'Moderate croup observation', urgency: 'urgent' }],
    ['PICU (severe / impending failure)', 'Paediatric ward observation', 'Discharge after 2–4h obs post-adrenaline neb (mild croup)']
  ),

  pneumothorax: protocol('pneumothorax', 'Pneumothorax',
    ['Sudden onset chest pain or SOB?', 'Trauma history (blunt or penetrating)?', 'Tall, thin male / smoker / Marfan / known lung disease?', 'Mechanical ventilation or recent central line?'],
    [
      { symptom: 'Tension pneumothorax (tracheal deviation, distended neck veins, hypotension)', reason: 'IMMEDIATE needle decompression', esiLevel: 1 },
      { symptom: 'Large pneumothorax + hypoxia', reason: 'Significant pneumothorax requiring drain', esiLevel: 2 },
    ],
    [{ step: 'Tension PTX → immediate needle decompression: 2nd ICS midclavicular OR 5th ICS midaxillary (BTS 2023)' }, { step: 'Erect CXR (NOT lying)' }, { step: 'High-flow O2 (helps reabsorption)' }, { step: 'Apply BTS 2023 pneumothorax pathway' }],
    [{ name: 'Local anaesthetic (Lidocaine 1%)', dose: 'Up to 3mg/kg', route: 'SC', indication: 'Chest drain insertion analgesia' }, { name: 'Morphine', dose: '2.5–10mg IV', route: 'IV', indication: 'Pleuritic pain' }],
    ['Erect PA CXR', 'CT chest (small / occult PTX or recurrent)', 'ABG (if hypoxia)'],
    [{ destination: 'Respiratory / Cardiothoracics', reason: 'Chest drain insertion / recurrent PTX for VATS', urgency: 'urgent' }, { destination: 'Resus', reason: 'Tension PTX', urgency: 'immediate' }],
    ['Resus → Cardiothoracics (tension)', 'Respiratory ward (chest drain)', 'Discharge with respiratory f/u (small primary PTX, asymptomatic)']
  ),

  acute_asthma_exacerbation: protocol('acute_asthma_exacerbation', 'Acute Asthma Exacerbation',
    ['When did symptoms start?', 'Triggers (URTI, allergen, exercise)?', 'Usual peak flow vs current?', 'Inhaler use in last 24h?', 'Previous ICU admissions or intubation for asthma?', 'Steroid use recently?'],
    [
      { symptom: 'Silent chest / cyanosis / exhaustion / GCS drop', reason: 'Life-threatening / near-fatal asthma', esiLevel: 1 },
      { symptom: 'PEF < 33% predicted, SpO2 < 92%, normal/high CO2', reason: 'Life-threatening asthma — ITU referral', esiLevel: 1 },
      { symptom: 'PEF 33–50%, RR ≥ 25, HR ≥ 110, unable to complete sentence', reason: 'Severe asthma', esiLevel: 2 },
    ],
    [{ step: 'Sit upright, high-flow O2 (target 94–98%)' }, { step: 'Continuous SpO2, ECG monitor' }, { step: 'Apply BTS/SIGN asthma severity criteria' }, { step: 'ABG if SpO2 < 92% or life-threatening features' }],
    [
      { name: 'Salbutamol nebulised', dose: '5mg neb back-to-back; can also IV', route: 'Nebulised (O2-driven)', indication: 'Bronchodilation' },
      { name: 'Ipratropium', dose: '500mcg neb 4–6 hourly', route: 'Nebulised', indication: 'Add to salbutamol in severe / life-threatening' },
      { name: 'Prednisolone', dose: '40–50mg PO OD ×5 days', route: 'Oral', indication: 'All exacerbations needing ED care' },
      { name: 'Hydrocortisone', dose: '100mg IV', route: 'IV', indication: 'If unable to take oral steroid' },
      { name: 'Magnesium Sulphate', dose: '2g IV over 20min', route: 'IV', indication: 'Life-threatening / no response to nebs', notes: 'Caution if renal impairment' },
      { name: 'Aminophylline', dose: '5mg/kg IV loading then 0.5mg/kg/h', route: 'IV', indication: 'Severe/refractory — senior decision only' },
    ],
    ['Peak flow before and after Rx', 'ABG', 'CXR (atypical or no response)', 'FBC, CRP, U&E'],
    [{ destination: 'ITU / HDU', reason: 'Life-threatening or near-fatal asthma', urgency: 'immediate' }, { destination: 'Respiratory ward', reason: 'Severe asthma needing admission', urgency: 'urgent' }],
    ['ITU (intubation / NIV)', 'Respiratory ward', 'Discharge with PEF improvement > 75%, oral pred, asthma plan, GP f/u 48h']
  ),

  dizziness_vertigo: protocol('dizziness_vertigo', 'Dizziness / Vertigo',
    ['True spinning sensation (vertigo) vs light-headed (presyncope)?', 'Triggered by head movement?', 'Hearing loss or tinnitus?', 'Duration — seconds, minutes, hours, days?', 'Any neuro symptoms — diplopia, dysarthria, weakness, ataxia?', 'Recent URTI or ear infection?'],
    [
      { symptom: 'Vertigo + new headache + neurological deficit', reason: 'Posterior circulation stroke — HINTS exam', esiLevel: 1 },
      { symptom: 'Vertigo + sudden hearing loss', reason: 'Labyrinthine stroke / vestibular neuritis', esiLevel: 2 },
    ],
    [{ step: 'Apply HINTS exam (Head Impulse, Nystagmus, Test of Skew)' }, { step: 'Dix-Hallpike for BPPV (posterior canal)' }, { step: 'Full neuro exam + cerebellar exam' }, { step: 'ECG, lying/standing BP' }],
    [{ name: 'Prochlorperazine', dose: '12.5mg IM or 5mg PO TDS', route: 'IM / oral', indication: 'Acute vertigo with vomiting' }, { name: 'Cyclizine', dose: '50mg IM/IV/PO TDS', route: 'IM / IV / oral', indication: 'Antiemetic alternative' }, { name: 'Betahistine', dose: '8–16mg PO TDS', route: 'Oral', indication: 'Ménière disease' }],
    ['ECG', 'FBC, U&E, glucose', 'CT head (if stroke suspected)', 'MRI brain + brainstem (definitive for posterior stroke)'],
    [{ destination: 'Stroke unit', reason: 'Central vertigo / posterior stroke', urgency: 'immediate' }, { destination: 'ENT', reason: 'BPPV, Ménière, vestibular neuritis', urgency: 'routine' }],
    ['Stroke unit', 'Acute medicine', 'Discharge with Epley manoeuvre / ENT follow-up']
  ),

  acute_confusion_delirium: protocol('acute_confusion_delirium', 'Acute Confusion / Delirium',
    ['When did confusion start and how rapidly?', 'Baseline cognition — known dementia?', 'Recent infection symptoms (cough, urine, skin)?', 'Recent medication changes — opioids, benzos, anticholinergics?', 'Alcohol use / withdrawal?', 'Recent fall or head injury?'],
    [
      { symptom: 'Confusion + fever + neck stiffness', reason: 'Meningitis / encephalitis', esiLevel: 1 },
      { symptom: 'Confusion + focal neuro signs', reason: 'Stroke / intracranial haemorrhage', esiLevel: 1 },
      { symptom: 'GCS < 13', reason: 'Significant impairment — protect airway', esiLevel: 1 },
      { symptom: 'Confusion + glucose < 4', reason: 'Hypoglycaemia', esiLevel: 1 },
    ],
    [{ step: 'AMT-4 / 4AT screen for delirium' }, { step: 'ABCDE + glucose + temp + sats' }, { step: 'Septic screen: urine, blood cultures, CXR' }, { step: 'Medication review (anticholinergic burden, opioids)' }, { step: 'CT head if focal signs, anticoagulated, head injury, or no clear cause' }],
    [{ name: 'Lorazepam', dose: '0.5–1mg PO/IM/IV', route: 'PO / IM / IV', indication: 'Severe agitation (alcohol withdrawal / benzo withdrawal). Avoid in elderly delirium first-line.' }, { name: 'Haloperidol', dose: '0.5–1mg PO/IM (elderly), 2.5–5mg adult', route: 'PO / IM', indication: 'Hyperactive delirium with severe agitation when non-pharmacological fails. AVOID in Parkinsons / LBD.' }, { name: 'Thiamine (Pabrinex)', dose: '1 pair IV TDS ×3d', route: 'IV', indication: 'Alcohol-related delirium / Wernicke prophylaxis' }],
    ['FBC, CRP, U&E, LFTs, glucose, Ca, TFTs, B12, folate', 'Urinalysis & MSU', 'Blood cultures', 'CXR', 'ECG', 'CT head (when indicated)'],
    [{ destination: 'Acute medicine / Care of Elderly', reason: 'Investigation + management of delirium', urgency: 'urgent' }, { destination: 'Stroke unit', reason: 'Focal neurology', urgency: 'immediate' }],
    ['Medical ward (delirium care bundle)', 'HDU (severe agitation, sepsis)', 'Stroke unit']
  ),

  focal_weakness: protocol('focal_weakness', 'Focal Weakness / Neurological Deficit',
    ['When exactly did symptoms start (last known well)?', 'Which body parts affected?', 'Any speech, vision, swallowing changes?', 'Headache, neck pain, or trauma?', 'AF, prior stroke, anticoagulant use?', 'Risk factors: HTN, DM, smoking, hyperlipidaemia?'],
    [
      { symptom: 'FAST positive within 4.5h of onset', reason: 'Acute stroke — thrombolysis window', esiLevel: 1 },
      { symptom: 'Large vessel occlusion signs (NIHSS ≥ 6)', reason: 'Thrombectomy candidate', esiLevel: 1 },
      { symptom: 'Sudden severe headache + focal deficit', reason: 'Intracerebral haemorrhage / SAH', esiLevel: 1 },
    ],
    [{ step: 'Code stroke activation — call stroke team' }, { step: 'NIHSS scoring' }, { step: 'CT head + CT angiogram within 25 min of arrival' }, { step: 'BP control (do NOT lower aggressively unless > 220/120 or for thrombolysis < 185/110)' }, { step: 'Glucose check' }],
    [{ name: 'Alteplase', dose: '0.9 mg/kg IV (max 90mg); 10% bolus, 90% over 60min', route: 'IV', indication: 'Acute ischaemic stroke within 4.5h, no haemorrhage, no contraindications', notes: 'Senior stroke decision' }, { name: 'Tenecteplase', dose: '0.25mg/kg IV bolus (max 25mg)', route: 'IV', indication: 'Alternative thrombolytic (some centres)' }, { name: 'Aspirin', dose: '300mg', route: 'Oral / NG / rectal', indication: 'After haemorrhage excluded, post thrombolysis at 24h' }],
    ['CT head non-contrast', 'CT angiogram', 'CT perfusion (delayed presentation)', 'ECG (AF)', 'FBC, U&E, glucose, lipids, HbA1c, INR', 'Carotid Doppler', 'Echo'],
    [{ destination: 'Hyperacute Stroke Unit', reason: 'All acute strokes', urgency: 'immediate' }, { destination: 'Neuro-interventional / Thrombectomy centre', reason: 'LVO confirmed on CTA', urgency: 'immediate' }],
    ['HASU', 'Neurosurgery (haemorrhagic stroke)', 'Thrombectomy centre transfer']
  ),

  meningitis_suspected: protocol('meningitis_suspected', 'Suspected Meningitis',
    ['Fever, headache, neck stiffness, photophobia?', 'Rash — describe and is it blanching?', 'Recent ear infection or sinusitis?', 'Immunocompromised?', 'Vaccination history?', 'Recent close contact with meningitis?'],
    [
      { symptom: 'Non-blanching purpuric rash', reason: 'Meningococcal septicaemia — IV antibiotic NOW', esiLevel: 1 },
      { symptom: 'GCS < 12 + meningism', reason: 'Severe bacterial meningitis', esiLevel: 1 },
      { symptom: 'Seizures + meningism', reason: 'Encephalitis / meningoencephalitis', esiLevel: 1 },
    ],
    [{ step: 'Do NOT delay antibiotics for LP — give within 1h of arrival' }, { step: 'Blood cultures (before antibiotics if possible, max 30s delay)' }, { step: 'CT head if focal signs, GCS < 13, immunocompromised, papilloedema (before LP)' }, { step: 'LP if safe — opening pressure, cell count, protein, glucose, culture, PCR' }],
    [{ name: 'Ceftriaxone', dose: '2g IV BD (adult); 80mg/kg OD (child)', route: 'IV', indication: 'Empirical bacterial meningitis' }, { name: 'Amoxicillin', dose: '2g IV 4-hourly', route: 'IV', indication: 'Add for Listeria cover if > 60y, immunocompromised, pregnant' }, { name: 'Dexamethasone', dose: '0.15mg/kg (max 10mg) IV QDS ×4d', route: 'IV', indication: 'Pneumococcal meningitis (give with or before antibiotics)' }, { name: 'Aciclovir', dose: '10mg/kg IV TDS', route: 'IV', indication: 'Suspected viral encephalitis (HSV)' }],
    ['FBC, CRP, U&E, LFTs, clotting, glucose', 'Blood cultures', 'Throat swab + meningococcal PCR', 'LP (CSF cell count, protein, glucose, culture, PCR for HSV/meningococcus/pneumococcus)', 'CT head (if indicated before LP)'],
    [{ destination: 'ITU', reason: 'Septic shock / GCS < 12 / seizures', urgency: 'immediate' }, { destination: 'Infectious Diseases / Acute Medicine', reason: 'Confirmed / suspected meningitis', urgency: 'immediate' }, { destination: 'Public Health (notify)', reason: 'Statutory notification + chemoprophylaxis for contacts', urgency: 'immediate' }],
    ['ITU', 'Acute medicine / ID', 'Side room with droplet precautions for first 24h']
  ),

  headache_thunderclap: protocol('headache_thunderclap', 'Thunderclap Headache',
    ['Maximum intensity at onset (within seconds)?', 'Worst headache of life?', 'Associated neck stiffness, vomiting, photophobia?', 'Any LOC, seizure, focal deficit?', 'Triggered by exertion, sex, cough?', 'Anticoagulant use?'],
    [
      { symptom: 'Sudden onset "worst headache" peaking in seconds', reason: 'Subarachnoid haemorrhage', esiLevel: 1 },
      { symptom: 'Thunderclap + neck stiffness + photophobia', reason: 'SAH or meningitis', esiLevel: 1 },
      { symptom: 'Thunderclap + reduced GCS or focal deficit', reason: 'ICH / SAH / vertebral artery dissection', esiLevel: 1 },
    ],
    [{ step: 'Urgent non-contrast CT head within 1h (highest sensitivity within 6h of onset)' }, { step: 'If CT negative and presentation < 6h: very low SAH probability; if > 6h: consider LP at 12h (xanthochromia)' }, { step: 'BP control if hypertensive' }, { step: 'Bed rest, analgesia, antiemetic' }],
    [{ name: 'Nimodipine', dose: '60mg PO 4-hourly ×21d', route: 'Oral / NG', indication: 'Vasospasm prophylaxis in confirmed SAH' }, { name: 'Paracetamol', dose: '1g IV/PO QDS', route: 'IV / oral', indication: 'Analgesia' }, { name: 'Codeine / Morphine', dose: 'As per pain', route: 'Oral / IV', indication: 'Severe headache' }, { name: 'Ondansetron', dose: '4–8mg IV', route: 'IV', indication: 'Vomiting' }],
    ['CT head non-contrast', 'CT angiogram (cerebral)', 'LP at 12h post onset (xanthochromia)', 'FBC, U&E, clotting'],
    [{ destination: 'Neurosurgery', reason: 'Confirmed SAH, ICH, dissection', urgency: 'immediate' }, { destination: 'Stroke unit / Neurology', reason: 'Cerebral venous thrombosis, RCVS', urgency: 'urgent' }],
    ['Neurosurgery / neuro-ITU', 'HASU', 'Discharge with neurology follow-up if all negative']
  ),

  nausea_vomiting: protocol('nausea_vomiting', 'Nausea & Vomiting',
    ['Duration and frequency?', 'Blood in vomit (haematemesis vs coffee-ground)?', 'Bilious vs faeculent?', 'Abdominal pain location?', 'Recent food intake / contacts ill?', 'Pregnancy possible?', 'Medications (chemo, opioids)?'],
    [
      { symptom: 'Haematemesis or coffee-ground', reason: 'UGI bleed — separate protocol', esiLevel: 2 },
      { symptom: 'Faeculent vomiting + distension', reason: 'Bowel obstruction', esiLevel: 2 },
      { symptom: 'Severe dehydration + tachycardia + hypotension', reason: 'Hypovolaemic shock', esiLevel: 2 },
      { symptom: 'Vomiting + neuro signs + headache', reason: 'Raised ICP', esiLevel: 1 },
    ],
    [{ step: 'Assess hydration: skin turgor, mucosa, CRT, vitals' }, { step: 'Beta-hCG in women of reproductive age' }, { step: 'IV fluids if dehydrated' }, { step: 'NG tube if obstruction suspected' }],
    [{ name: 'Ondansetron', dose: '4–8mg IV/IM/PO 8-hourly', route: 'IV / oral / IM', indication: 'Most causes (avoid in long QT)' }, { name: 'Cyclizine', dose: '50mg IV/IM/PO 8-hourly', route: 'IV / IM / oral', indication: 'Motion / vestibular' }, { name: 'Metoclopramide', dose: '10mg IV/IM/PO TDS', route: 'IV / IM / oral', indication: 'Gastric stasis. Avoid in <20y, Parkinson disease, obstruction' }, { name: 'Hartmann’s / 0.9% Saline', dose: '500–1000mL IV bolus then maintenance', route: 'IV', indication: 'Rehydration' }],
    ['U&E (dehydration, AKI)', 'FBC, glucose', 'Beta-hCG', 'Abdominal X-ray if obstruction', 'CT abdomen if surgical cause'],
    [{ destination: 'Surgery', reason: 'Obstruction, peritonism', urgency: 'urgent' }, { destination: 'Acute medicine', reason: 'Severe dehydration, ongoing vomiting', urgency: 'urgent' }],
    ['Surgical admission', 'Acute medicine', 'Discharge with antiemetic + GP f/u (mild gastroenteritis)']
  ),

  diarrhoea: protocol('diarrhoea', 'Acute Diarrhoea',
    ['Duration, frequency, watery vs bloody?', 'Travel history, contacts, foodborne risk?', 'Antibiotics in last 2 months (C. difficile)?', 'Immunocompromised (HIV, chemo, transplant)?', 'Tenesmus, mucus, urgency (IBD)?', 'Hydration status, urine output?'],
    [
      { symptom: 'Bloody diarrhoea + fever + severe pain', reason: 'Severe colitis / HUS / C. diff', esiLevel: 2 },
      { symptom: 'Severe dehydration + shock', reason: 'Hypovolaemic shock', esiLevel: 2 },
      { symptom: 'Diarrhoea + abdominal distension + toxic appearance', reason: 'Toxic megacolon', esiLevel: 1 },
    ],
    [{ step: 'Assess hydration and replace IV if needed' }, { step: 'Stool sample for MC&S, ova/cysts/parasites, C. difficile toxin' }, { step: 'Isolate if infectious (side room, contact precautions)' }, { step: 'Avoid antimotility agents if bloody or febrile' }],
    [{ name: 'IV crystalloid', dose: '500–1000mL bolus', route: 'IV', indication: 'Dehydration' }, { name: 'Vancomycin', dose: '125mg PO QDS ×10d', route: 'Oral', indication: 'C. difficile (first episode)' }, { name: 'Fidaxomicin', dose: '200mg PO BD ×10d', route: 'Oral', indication: 'Severe / recurrent C. diff' }, { name: 'Loperamide', dose: '4mg then 2mg after each loose stool (max 16mg)', route: 'Oral', indication: 'Non-bloody, non-febrile diarrhoea only' }],
    ['Stool MC&S, OCP, C. diff toxin', 'FBC, U&E, CRP', 'AXR if distension', 'Flexible sig if IBD suspected'],
    [{ destination: 'Gastroenterology', reason: 'Suspected IBD / severe colitis', urgency: 'urgent' }, { destination: 'ID', reason: 'Returning traveller, persistent infectious diarrhoea', urgency: 'urgent' }],
    ['Side room with isolation', 'Gastro admission (severe IBD)', 'Discharge with oral rehydration salts + GP f/u']
  ),

  upper_gi_bleed: protocol('upper_gi_bleed', 'Upper GI Bleed',
    ['Haematemesis (bright red or coffee-ground)?', 'Melaena (black tarry stool)?', 'Known liver disease, varices, peptic ulcer?', 'NSAIDs, anticoagulants, antiplatelets?', 'Alcohol use?', 'Syncope or pre-syncope (significant blood loss)?'],
    [
      { symptom: 'Haematemesis + shock (SBP < 90, HR > 100)', reason: 'Massive UGI bleed', esiLevel: 1 },
      { symptom: 'Known varices + active haematemesis', reason: 'Variceal bleed — terlipressin + endoscopy', esiLevel: 1 },
      { symptom: 'Anticoagulated + active bleed', reason: 'Reverse anticoagulation', esiLevel: 1 },
    ],
    [{ step: 'Wide-bore IV access ×2, group & crossmatch, FBC, U&E, LFTs, clotting' }, { step: 'Glasgow-Blatchford Score / Rockall Score' }, { step: 'Activate major haemorrhage protocol if shocked' }, { step: 'Endoscopy within 24h (within 2h if variceal / unstable)' }, { step: 'Avoid NSAIDs / antiplatelets — discuss with senior' }],
    [{ name: 'IV crystalloid + blood transfusion', dose: 'Restrictive transfusion target Hb 70 g/L (90 if cardiac)', route: 'IV', indication: 'Resuscitation' }, { name: 'Terlipressin', dose: '2mg IV QDS then 1–2mg 4–6 hourly', route: 'IV', indication: 'Suspected variceal bleed' }, { name: 'Octreotide', dose: '50mcg IV bolus then 25–50mcg/h', route: 'IV', indication: 'Alternative for variceal bleed' }, { name: 'Pantoprazole', dose: '80mg IV bolus then 8mg/h infusion ×72h', route: 'IV', indication: 'Confirmed bleeding ulcer post endoscopy' }, { name: 'Tranexamic Acid', dose: '1g IV (HALT-IT shows no benefit — local protocol)', route: 'IV', indication: 'Senior decision — not routine' }, { name: 'Vitamin K + PCC', dose: 'Per warfarin reversal protocol', route: 'IV', indication: 'Warfarin reversal' }],
    ['FBC, U&E, LFTs, clotting, group & crossmatch (4–6 units)', 'VBG/ABG (lactate, base deficit)', 'ECG', 'CXR', 'OGD (within 24h)'],
    [{ destination: 'Gastroenterology / Endoscopy', reason: 'All UGI bleeds', urgency: 'immediate' }, { destination: 'ITU / HDU', reason: 'Massive haemorrhage / variceal bleed', urgency: 'immediate' }, { destination: 'Surgery / IR', reason: 'Failed endoscopic haemostasis', urgency: 'immediate' }],
    ['HDU / ITU', 'Gastroenterology', 'Discharge after low-risk OGD with PPI and GP f/u']
  ),

  lower_gi_bleed: protocol('lower_gi_bleed', 'Lower GI Bleed',
    ['Bright red blood per rectum, melaena, or maroon?', 'Volume of bleeding?', 'Pain on defecation (haemorrhoids, fissure)?', 'Change in bowel habit, weight loss (cancer)?', 'Anticoagulant use?'],
    [
      { symptom: 'Massive PR bleed + haemodynamic instability', reason: 'Severe LGI bleed — also consider brisk UGI', esiLevel: 1 },
      { symptom: 'Anticoagulated + active bleed', reason: 'Need urgent reversal', esiLevel: 2 },
    ],
    [{ step: 'IV access, FBC, U&E, clotting, group & save' }, { step: 'PR exam to identify source' }, { step: 'NG aspirate may exclude UGI source if doubt' }, { step: 'CT angiogram if ongoing bleed; colonoscopy if stable' }],
    [{ name: 'IV crystalloid + blood', dose: 'Per major haemorrhage protocol', route: 'IV', indication: 'Resuscitation' }, { name: 'Tranexamic Acid', dose: '1g IV', route: 'IV', indication: 'Active bleed (per local protocol)' }],
    ['FBC, U&E, LFTs, clotting, group & save', 'CT angiogram (active bleed)', 'Colonoscopy', 'Stool MC&S'],
    [{ destination: 'Gastroenterology / IR', reason: 'Ongoing LGI bleed', urgency: 'urgent' }, { destination: 'Colorectal Surgery', reason: 'Failed endoscopic / IR control', urgency: 'urgent' }],
    ['HDU (significant bleed)', 'Gastroenterology', 'Discharge with outpatient colonoscopy (small self-limiting)']
  ),

  jaundice: protocol('jaundice', 'Jaundice',
    ['Onset — acute or gradual?', 'Pain — RUQ colic (gallstones)?', 'Fever (cholangitis)?', 'Pale stools, dark urine?', 'Alcohol intake, paracetamol, herbal medicines?', 'Travel, IVDU, tattoos, blood transfusion?', 'Weight loss (malignancy)?'],
    [
      { symptom: 'Jaundice + RUQ pain + fever (Charcot triad) + hypotension/confusion (Reynolds pentad)', reason: 'Ascending cholangitis with sepsis', esiLevel: 1 },
      { symptom: 'Jaundice + encephalopathy + coagulopathy', reason: 'Acute liver failure', esiLevel: 1 },
      { symptom: 'Painless jaundice + weight loss', reason: 'Pancreatic / biliary malignancy 2WW', esiLevel: 3 },
    ],
    [{ step: 'FBC, U&E, LFTs (bilirubin conjugated/unconjugated, ALT, ALP, GGT), clotting, glucose, paracetamol level' }, { step: 'USS abdomen (biliary dilatation, gallstones)' }, { step: 'Septic screen if febrile' }, { step: 'NAC if paracetamol toxicity suspected' }],
    [{ name: 'Tazocin (Piperacillin-tazobactam)', dose: '4.5g IV TDS', route: 'IV', indication: 'Ascending cholangitis empirical' }, { name: 'Vitamin K', dose: '10mg IV', route: 'IV', indication: 'Coagulopathy in liver disease' }, { name: 'N-Acetylcysteine', dose: 'Per nomogram', route: 'IV', indication: 'Paracetamol toxicity' }],
    ['FBC, U&E, LFTs, clotting, glucose', 'Paracetamol & salicylate', 'Liver screen (HBV, HCV, autoimmune, copper, ferritin, alpha-1 AT)', 'USS abdomen', 'MRCP / ERCP'],
    [{ destination: 'Hepatology', reason: 'Acute liver failure', urgency: 'immediate' }, { destination: 'HPB / Gastroenterology', reason: 'Cholangitis, obstructive jaundice for ERCP', urgency: 'immediate' }, { destination: 'King’s Liver / SRRH (transplant centre)', reason: 'King’s criteria met for ALF', urgency: 'immediate' }],
    ['ITU (ALF)', 'Hepatology', 'HPB surgery / ERCP suite']
  ),

  dysphagia: protocol('dysphagia', 'Dysphagia',
    ['Solids, liquids, or both?', 'Duration and progression?', 'Weight loss?', 'Pain on swallowing (odynophagia)?', 'Regurgitation, choking, aspiration?', 'Recent stroke or neurological disease?'],
    [
      { symptom: 'Complete dysphagia / aspiration', reason: 'Bolus obstruction or stroke-related', esiLevel: 2 },
      { symptom: 'Dysphagia + weight loss + smoker', reason: 'Suspected oesophageal cancer 2WW', esiLevel: 3 },
    ],
    [{ step: 'NPO; suction available' }, { step: 'CXR if aspiration concern' }, { step: 'SALT assessment (post-stroke)' }, { step: 'OGD within 2WW for new dysphagia in adults' }],
    [{ name: 'Buscopan (Hyoscine butylbromide)', dose: '20mg IV/IM', route: 'IV / IM', indication: 'Bolus obstruction (smooth muscle relaxant)' }, { name: 'Glucagon', dose: '1mg IV', route: 'IV', indication: 'Food bolus obstruction (oesophageal)' }],
    ['FBC, U&E', 'CXR', 'OGD', 'Barium swallow / video fluoroscopy', 'CT chest (staging if cancer)'],
    [{ destination: 'Gastroenterology / ENT', reason: 'Bolus obstruction not clearing', urgency: 'immediate' }, { destination: 'Upper GI 2WW', reason: 'Cancer suspected', urgency: 'urgent' }],
    ['Endoscopy', 'ENT review', 'Discharge with 2WW OGD']
  ),

  bowel_obstruction: protocol('bowel_obstruction', 'Bowel Obstruction',
    ['Colicky abdominal pain, vomiting (bilious / faeculent)?', 'Constipation / absolute constipation (no flatus)?', 'Previous abdominal surgery (adhesions)?', 'Hernia?', 'Weight loss, change in bowel habit (malignancy)?'],
    [
      { symptom: 'Peritonism / rebound tenderness', reason: 'Strangulation or perforation', esiLevel: 1 },
      { symptom: 'Faeculent vomiting + distension + hypotension', reason: 'Established obstruction / sepsis', esiLevel: 2 },
      { symptom: 'Closed-loop obstruction signs on CT', reason: 'Emergency laparotomy', esiLevel: 1 },
    ],
    [{ step: 'NG tube — drip and suck' }, { step: 'IV fluid resuscitation' }, { step: 'Catheterise — strict input/output' }, { step: 'CT abdomen with contrast' }, { step: 'Surgical referral' }],
    [{ name: 'IV crystalloid', dose: '1L bolus then 125mL/h', route: 'IV', indication: 'Fluid resuscitation' }, { name: 'Cyclizine / Ondansetron', dose: '50mg / 4–8mg IV', route: 'IV', indication: 'Antiemetic (avoid metoclopramide — prokinetic)' }, { name: 'Morphine', dose: '2.5–10mg IV', route: 'IV', indication: 'Analgesia' }, { name: 'Co-amoxiclav', dose: '1.2g IV TDS', route: 'IV', indication: 'If perforation / sepsis' }],
    ['FBC, U&E, CRP, lactate, group & save', 'AXR (dilated loops)', 'CT abdomen with contrast (definitive)', 'VBG'],
    [{ destination: 'General Surgery', reason: 'All obstructions', urgency: 'immediate' }, { destination: 'ITU / HDU', reason: 'Septic / shocked', urgency: 'immediate' }],
    ['Surgical ward', 'Theatre (strangulation, closed-loop, peritonitis)', 'Conservative management with NG / IV fluids (adhesions)']
  ),

  pancreatitis: protocol('pancreatitis', 'Acute Pancreatitis',
    ['Severe epigastric pain radiating to back?', 'Nausea / vomiting?', 'Alcohol intake?', 'Known gallstones?', 'Drugs (azathioprine, steroids, oestrogens)?', 'Recent ERCP?'],
    [
      { symptom: 'Glasgow score ≥ 3 within 48h', reason: 'Severe pancreatitis — ITU referral', esiLevel: 2 },
      { symptom: 'Cullen sign / Grey-Turner sign', reason: 'Haemorrhagic pancreatitis', esiLevel: 1 },
      { symptom: 'Pancreatitis + shock', reason: 'SIRS / sepsis', esiLevel: 1 },
    ],
    [{ step: 'IV crystalloid resuscitation (aggressive Hartmann’s in first 24h)' }, { step: 'Amylase / lipase, FBC, U&E, LFTs, calcium, glucose, ABG, CRP' }, { step: 'USS within 24h (gallstones)' }, { step: 'Glasgow / APACHE II severity scoring at 48h' }, { step: 'NG tube only if vomiting / ileus; early enteral nutrition encouraged' }],
    [{ name: 'IV Hartmann’s', dose: '5–10mL/kg/h initially', route: 'IV', indication: 'Aggressive fluid resuscitation' }, { name: 'Morphine PCA', dose: 'Titrated', route: 'IV', indication: 'Severe pain' }, { name: 'Cyclizine / Ondansetron', dose: 'Standard antiemetic doses', route: 'IV', indication: 'Vomiting' }, { name: 'Antibiotics', dose: 'NOT routinely indicated', route: '-', indication: 'Only for confirmed infected necrosis' }],
    ['Amylase / lipase (lipase more specific)', 'FBC, U&E, LFTs, Ca, glucose, CRP, LDH, ABG', 'USS abdomen', 'CT abdomen with contrast (at 72h if severe)', 'MRCP (gallstones)'],
    [{ destination: 'Surgery / Gastroenterology', reason: 'All confirmed pancreatitis', urgency: 'immediate' }, { destination: 'ITU / HDU', reason: 'Severe pancreatitis (Glasgow ≥ 3, organ failure)', urgency: 'immediate' }],
    ['HDU / ITU', 'Surgical ward', 'ERCP within 72h if gallstone with cholangitis / obstructed CBD']
  ),

  constipation: protocol('constipation', 'Constipation',
    ['Last bowel motion?', 'Painful or hard stools?', 'Any blood (haemorrhoids, fissure)?', 'Vomiting / abdominal distension (obstruction)?', 'New onset in adult > 50 (cancer concern)?', 'Opioids or other constipating meds?'],
    [
      { symptom: 'Constipation + faeculent vomiting + distension', reason: 'Bowel obstruction', esiLevel: 2 },
      { symptom: 'New constipation + weight loss + PR bleeding (> 50y)', reason: '2WW colorectal cancer', esiLevel: 3 },
    ],
    [{ step: 'PR exam (faecal impaction, mass, blood)' }, { step: 'AXR if obstruction suspected' }, { step: 'Stop / reduce constipating medications' }, { step: 'Lifestyle advice: fibre, fluid, exercise' }],
    [{ name: 'Macrogol (Movicol)', dose: '1–3 sachets/day', route: 'Oral', indication: 'Faecal impaction / chronic constipation' }, { name: 'Senna', dose: '7.5–15mg PO at night', route: 'Oral', indication: 'Stimulant laxative' }, { name: 'Glycerol suppository', dose: '4g PR', route: 'Rectal', indication: 'Distal impaction' }, { name: 'Phosphate enema', dose: '128mL PR', route: 'Rectal', indication: 'Faecal impaction' }],
    ['FBC, U&E, TFTs, Ca (look for hypercalcaemia, hypothyroidism)', 'AXR (if concern)', 'Colonoscopy (red-flag features)'],
    [{ destination: 'Colorectal 2WW', reason: 'Suspected cancer features', urgency: 'urgent' }, { destination: 'Surgery', reason: 'Obstruction', urgency: 'immediate' }],
    ['Discharge with laxative regime and GP review', 'Colorectal clinic', 'Surgery (obstruction)']
  ),

  uti: protocol('uti', 'Urinary Tract Infection',
    ['Dysuria, frequency, urgency, suprapubic pain?', 'Fever, loin pain, rigors (pyelonephritis)?', 'Pregnancy?', 'Indwelling catheter?', 'Recurrent UTI?', 'Immunocompromised?'],
    [
      { symptom: 'UTI + fever + loin pain + sepsis features', reason: 'Pyelonephritis with sepsis', esiLevel: 2 },
      { symptom: 'UTI in pregnancy', reason: 'Risk to fetus — treat promptly', esiLevel: 3 },
      { symptom: 'Catheter-associated + sepsis', reason: 'CAUTI sepsis', esiLevel: 2 },
    ],
    [{ step: 'Urine dipstick + MSU for MC&S' }, { step: 'Apply NICE UTI guideline (lower / upper / catheter / male)' }, { step: 'Fluid encouragement' }, { step: 'Sepsis 6 if systemic features' }],
    [{ name: 'Nitrofurantoin', dose: '100mg MR BD ×3d (women) / ×7d (men)', route: 'Oral', indication: 'Lower UTI first line. Avoid if eGFR < 45.' }, { name: 'Trimethoprim', dose: '200mg BD ×3d', route: 'Oral', indication: 'Alternative — avoid in 1st trimester pregnancy / on methotrexate' }, { name: 'Cefalexin', dose: '500mg PO QDS ×7d', route: 'Oral', indication: 'UTI in pregnancy' }, { name: 'Co-amoxiclav', dose: '625mg PO TDS or 1.2g IV TDS', route: 'Oral / IV', indication: 'Pyelonephritis' }, { name: 'Gentamicin', dose: '5mg/kg IV OD', route: 'IV', indication: 'Severe sepsis / urosepsis' }],
    ['Urine dipstick + MSU MC&S', 'FBC, U&E, CRP', 'Blood cultures (if febrile)', 'USS renal tract (recurrent / obstruction)'],
    [{ destination: 'Acute medicine', reason: 'Pyelonephritis / urosepsis', urgency: 'urgent' }, { destination: 'Urology', reason: 'Obstruction / recurrent UTI / male UTI', urgency: 'routine' }],
    ['Admission for IV antibiotics (pyelonephritis)', 'Discharge with oral antibiotics', 'Pregnancy assessment unit']
  ),

  renal_colic: protocol('renal_colic', 'Renal Colic',
    ['Severe loin pain radiating to groin?', 'Haematuria (visible or non-visible)?', 'Previous renal stones?', 'Fever (infected stone)?', 'Family history of stones?', 'Dehydration risk factors?'],
    [
      { symptom: 'Renal colic + fever + sepsis', reason: 'Obstructed infected kidney — urgent decompression', esiLevel: 1 },
      { symptom: 'Solitary kidney + obstruction', reason: 'Anuric AKI risk', esiLevel: 2 },
      { symptom: 'Severe abdominal pain in > 60y', reason: 'Exclude AAA before diagnosing renal colic', esiLevel: 1 },
    ],
    [{ step: 'CT-KUB non-contrast within 24h (or immediately if febrile)' }, { step: 'Urine dip (blood, leucocytes, nitrites, pH)' }, { step: 'Strain urine to catch stone' }, { step: 'Bloods: U&E, calcium, urate, FBC, CRP' }],
    [{ name: 'Diclofenac', dose: '75mg IM/PR or 50mg PO TDS', route: 'IM / PR / oral', indication: 'First-line analgesic (NICE)' }, { name: 'Paracetamol', dose: '1g IV/PO QDS', route: 'IV / oral', indication: 'Adjunctive' }, { name: 'Morphine', dose: '2.5–10mg IV titrated', route: 'IV', indication: 'Severe pain not controlled with NSAID' }, { name: 'Tamsulosin', dose: '400mcg OD', route: 'Oral', indication: 'Medical expulsive therapy for distal stones 5–10mm' }, { name: 'Co-amoxiclav', dose: '1.2g IV TDS', route: 'IV', indication: 'Infected obstructed stone' }],
    ['CT-KUB', 'Urine dip + MSU', 'FBC, U&E, Ca, urate, CRP', 'Beta-hCG'],
    [{ destination: 'Urology', reason: 'Stone > 5mm, obstruction, infection', urgency: 'urgent' }, { destination: 'Urology / IR', reason: 'Infected obstructed kidney for nephrostomy or ureteric stent', urgency: 'immediate' }],
    ['Urology admission (sepsis, obstruction)', 'Theatre / IR (decompression)', 'Discharge with NSAID + tamsulosin + urology clinic']
  ),

  urinary_retention: protocol('urinary_retention', 'Acute Urinary Retention',
    ['Unable to pass urine?', 'Painful bladder distension?', 'BPH symptoms beforehand?', 'Recent surgery, opioids, anticholinergics?', 'Spinal symptoms (cauda equina)?', 'Constipation?'],
    [
      { symptom: 'Retention + bilateral leg weakness / saddle anaesthesia / bowel incontinence', reason: 'Cauda equina syndrome — emergency MRI', esiLevel: 1 },
      { symptom: 'Retention + AKI (post-renal)', reason: 'Obstructive nephropathy', esiLevel: 2 },
    ],
    [{ step: 'Bladder scan to confirm volume' }, { step: 'Urethral catheterisation (or suprapubic if urethral fails)' }, { step: 'Measure residual volume and document' }, { step: 'U&E to check renal function' }, { step: 'Examine for prostate / cauda equina signs' }],
    [{ name: 'Tamsulosin', dose: '400mcg OD', route: 'Oral', indication: 'BPH-related retention to facilitate TWOC' }, { name: 'Lidocaine gel', dose: '11mL (males) intra-urethral', route: 'Urethral', indication: 'Catheter insertion lubricant + anaesthetic' }],
    ['Bladder scan', 'U&E, creatinine', 'Urinalysis', 'PSA (after retention resolved — initial result spuriously elevated)', 'MRI lumbar spine (cauda equina suspected)'],
    [{ destination: 'Urology', reason: 'All male retention; TWOC plan', urgency: 'urgent' }, { destination: 'Spinal Surgery', reason: 'Cauda equina', urgency: 'immediate' }],
    ['Discharge with catheter and urology TWOC clinic', 'Admit if AKI / sepsis', 'Spinal surgery (cauda equina)']
  ),

  haematuria: protocol('haematuria', 'Haematuria',
    ['Visible (macroscopic) or non-visible?', 'Painful or painless?', 'Clots?', 'Trauma?', 'Risk factors (smoking, occupational dye exposure, age > 60)?', 'Anticoagulants?'],
    [
      { symptom: 'Visible haematuria with clot retention', reason: 'Bladder outlet obstruction', esiLevel: 2 },
      { symptom: 'Painless visible haematuria in > 45y', reason: '2WW urological cancer', esiLevel: 3 },
    ],
    [{ step: 'Three-way catheter + bladder irrigation if clots' }, { step: 'Urine MSU' }, { step: 'CT urogram + flexible cystoscopy via 2WW' }, { step: 'Stop anticoagulant if severe — discuss with senior' }],
    [{ name: 'Tranexamic Acid', dose: '1g IV/PO TDS', route: 'IV / oral', indication: 'Significant haematuria' }, { name: 'IV fluids', dose: '0.9% saline or Hartmann', route: 'IV', indication: 'Maintain renal perfusion' }],
    ['Urinalysis + MSU', 'FBC, U&E, clotting, group & save', 'CT urogram', 'Flexible cystoscopy', 'Renal USS'],
    [{ destination: 'Urology 2WW', reason: 'Visible haematuria > 45y or non-visible > 60y with risk factors', urgency: 'urgent' }, { destination: 'Urology admission', reason: 'Clot retention / heavy bleeding', urgency: 'immediate' }],
    ['Urology admission with 3-way catheter', 'Discharge with 2WW referral']
  ),

  acute_kidney_injury: protocol('acute_kidney_injury', 'Acute Kidney Injury',
    ['Reduced urine output?', 'Recent illness (D&V), dehydration?', 'NSAIDs, ACEi/ARB, gentamicin, contrast?', 'Known CKD?', 'Sepsis features?', 'Obstructive symptoms?'],
    [
      { symptom: 'Hyperkalaemia (K > 6.5) with ECG changes', reason: 'Life-threatening hyperkalaemia', esiLevel: 1 },
      { symptom: 'Anuria + bilateral obstruction', reason: 'Obstructive AKI — needs decompression', esiLevel: 1 },
      { symptom: 'Acidosis pH < 7.15 / Hyperkalaemia / Uraemic encephalopathy', reason: 'Indications for urgent dialysis', esiLevel: 1 },
    ],
    [{ step: 'KDIGO staging based on creatinine rise / urine output' }, { step: 'Identify cause: pre-renal (volume / sepsis), renal (drugs / glomerular), post-renal (obstruction)' }, { step: 'Stop nephrotoxins (NSAIDs, ACEi/ARB, metformin, gentamicin)' }, { step: 'Fluid balance, catheterise, daily weights' }, { step: 'Bladder scan / USS for obstruction' }],
    [{ name: 'IV crystalloid', dose: '500mL bolus', route: 'IV', indication: 'Pre-renal AKI' }, { name: 'Calcium Gluconate', dose: '10mL 10% IV', route: 'IV', indication: 'Cardio-protection in hyperkalaemia' }, { name: 'Insulin + dextrose', dose: '10 units actrapid in 100mL 20% dextrose', route: 'IV', indication: 'Shift K intracellularly' }, { name: 'Salbutamol nebulised', dose: '10mg neb', route: 'Nebulised', indication: 'Adjunct K shift' }, { name: 'Patiromer / Calcium Resonium', dose: 'Per protocol', route: 'Oral / PR', indication: 'Sustained K removal' }],
    ['U&E, creatinine, eGFR daily', 'Urinalysis + urine PCR/ACR', 'FBC, CRP', 'VBG (acidosis, K)', 'USS renal tract', 'ECG (hyperkalaemia)'],
    [{ destination: 'Renal team / Acute Medicine', reason: 'AKI stage 2+, unclear cause, dialysis need', urgency: 'urgent' }, { destination: 'ITU', reason: 'Dialysis-requiring AKI', urgency: 'immediate' }],
    ['ITU (RRT)', 'Renal ward', 'Acute medicine']
  ),

  testicular_pain: protocol('testicular_pain', 'Acute Testicular Pain',
    ['Sudden or gradual onset?', 'Age (teens — torsion most likely)?', 'Trauma?', 'Urinary symptoms (epididymitis)?', 'Lump or swelling?', 'STI history?'],
    [
      { symptom: 'Sudden severe testicular pain + high-riding testis + absent cremasteric reflex', reason: 'Testicular torsion — within 6h golden window', esiLevel: 1 },
      { symptom: 'Boys 12–18 years with sudden testicular pain', reason: 'Torsion until proven otherwise', esiLevel: 1 },
    ],
    [{ step: 'Immediate urology referral if torsion suspected' }, { step: 'Do NOT delay surgery for USS if clinical suspicion strong' }, { step: 'NPO from arrival' }, { step: 'USS Doppler (only if torsion unlikely or to confirm)' }, { step: 'Urinalysis + STI screen if epididymitis suspected' }],
    [{ name: 'Morphine', dose: '2.5–10mg IV', route: 'IV', indication: 'Severe pain' }, { name: 'Ceftriaxone + Doxycycline', dose: '500mg IM + 100mg PO BD ×10d', route: 'IM + oral', indication: 'Epididymo-orchitis (STI cover)' }, { name: 'Ofloxacin', dose: '200mg PO BD ×14d', route: 'Oral', indication: 'Epididymo-orchitis (enteric organisms in > 35y)' }],
    ['Urinalysis + MSU', 'STI screen + NAAT', 'USS Doppler scrotum'],
    [{ destination: 'Urology', reason: 'Suspected torsion — emergency exploration', urgency: 'immediate' }],
    ['Theatre (torsion)', 'Discharge with antibiotics + urology f/u (epididymitis)']
  ),

  back_pain: protocol('back_pain', 'Acute Back Pain',
    ['Site of pain and any radiation (sciatica)?', 'Trauma?', 'Red flags: night pain, weight loss, fever, neurological signs?', 'Bladder / bowel disturbance, saddle anaesthesia?', 'Steroid use, IVDU, immunosuppression?', 'Age < 20 or > 50 with new pain?'],
    [
      { symptom: 'Saddle anaesthesia, bilateral leg weakness, bladder dysfunction', reason: 'Cauda equina — emergency MRI', esiLevel: 1 },
      { symptom: 'Back pain + fever + IVDU', reason: 'Spinal epidural abscess', esiLevel: 2 },
      { symptom: 'Back pain + cancer history + night pain', reason: 'Metastatic spinal cord compression', esiLevel: 2 },
      { symptom: 'Sudden severe back pain in > 60y + hypotension', reason: 'Ruptured AAA', esiLevel: 1 },
    ],
    [{ step: 'Focused neuro exam: tone, power, reflexes, sensation, PR (anal tone)' }, { step: 'MRI lumbar spine within hours if red flags' }, { step: 'Basic analgesia ladder' }, { step: 'Mobilise early; avoid prolonged bed rest' }],
    [{ name: 'Paracetamol + NSAID', dose: '1g QDS + Ibuprofen 400mg TDS', route: 'Oral', indication: 'Mechanical back pain' }, { name: 'Codeine', dose: '30–60mg QDS', route: 'Oral', indication: 'Moderate pain' }, { name: 'Diazepam', dose: '2mg TDS short course', route: 'Oral', indication: 'Muscle spasm (5 days max)' }, { name: 'Dexamethasone', dose: '16mg IV', route: 'IV', indication: 'MSCC pending oncology / radiotherapy' }],
    ['MRI whole spine (red flags / MSCC / cauda equina)', 'FBC, CRP, ESR (infection, malignancy)', 'PSA / myeloma screen if elderly', 'AXR if AAA suspected'],
    [{ destination: 'Spinal Surgery', reason: 'Cauda equina / MSCC / spinal infection', urgency: 'immediate' }, { destination: 'Oncology', reason: 'MSCC + cancer history', urgency: 'immediate' }, { destination: 'Vascular Surgery', reason: 'Suspected AAA', urgency: 'immediate' }],
    ['Spinal surgery / theatre', 'Oncology admission', 'Discharge with analgesia and physio (mechanical)']
  ),

  joint_swelling: protocol('joint_swelling', 'Joint Swelling / Acute Monoarthritis',
    ['Which joint, single or multiple?', 'Onset (acute, gradual)?', 'Trauma?', 'Fever (septic arthritis)?', 'Previous gout, RA, psoriasis?', 'Recent surgery, IVDU, immunocompromised?'],
    [
      { symptom: 'Acute hot swollen joint + fever', reason: 'Septic arthritis until proven otherwise', esiLevel: 2 },
      { symptom: 'Prosthetic joint + fever + pain', reason: 'Prosthetic joint infection', esiLevel: 2 },
    ],
    [{ step: 'Urgent joint aspiration BEFORE antibiotics (gram stain, MC&S, crystals, cell count)' }, { step: 'Bloods: FBC, CRP, ESR, urate, lactate, blood cultures' }, { step: 'X-ray joint' }, { step: 'Empirical antibiotics if septic arthritis suspected after aspiration' }],
    [{ name: 'Flucloxacillin', dose: '2g IV QDS', route: 'IV', indication: 'Empirical septic arthritis (Staph aureus)' }, { name: 'Vancomycin', dose: 'Per local protocol', route: 'IV', indication: 'MRSA risk / penicillin allergy' }, { name: 'NSAID', dose: 'Ibuprofen 400mg TDS or Naproxen 500mg BD', route: 'Oral', indication: 'Gout / crystal arthropathy' }, { name: 'Colchicine', dose: '500mcg BD–QDS', route: 'Oral', indication: 'Acute gout if NSAID contraindicated' }, { name: 'Prednisolone', dose: '30mg PO ×5d', route: 'Oral', indication: 'Gout if NSAID/colchicine contraindicated' }],
    ['Joint aspirate: gram stain, MC&S, crystals, cell count', 'FBC, CRP, ESR, urate', 'Blood cultures', 'X-ray joint'],
    [{ destination: 'Orthopaedics', reason: 'Septic arthritis (washout)', urgency: 'immediate' }, { destination: 'Rheumatology', reason: 'Acute crystal arthritis / new inflammatory arthritis', urgency: 'urgent' }],
    ['Orthopaedic admission (theatre washout)', 'Rheumatology', 'Discharge with NSAID / colchicine and rheum f/u']
  ),

  limb_fracture: protocol('limb_fracture', 'Limb Fracture / Injury',
    ['Mechanism of injury?', 'Time of injury?', 'Last meal?', 'Open wound?', 'Neurovascular status distal to injury?', 'Past medical, tetanus status?'],
    [
      { symptom: 'Compound (open) fracture', reason: 'Risk of osteomyelitis — early antibiotics + debridement', esiLevel: 2 },
      { symptom: 'Compartment syndrome (severe pain on passive stretch, tense compartment)', reason: 'Limb-threatening — urgent fasciotomy', esiLevel: 1 },
      { symptom: 'Pulseless limb post fracture', reason: 'Vascular injury', esiLevel: 1 },
    ],
    [{ step: 'ABCDE; analgesia early' }, { step: 'Assess and document neurovascular status before and after splinting' }, { step: 'Realignment if pulseless or angulated open fracture' }, { step: 'X-ray AP + lateral including joint above and below' }, { step: 'Tetanus prophylaxis' }],
    [{ name: 'Paracetamol + Ibuprofen', dose: '1g + 400mg', route: 'Oral', indication: 'Mild–moderate' }, { name: 'Morphine', dose: '0.1mg/kg IV titrated', route: 'IV', indication: 'Severe pain' }, { name: 'Fentanyl', dose: '1mcg/kg intranasal', route: 'Intranasal', indication: 'Paediatric fast analgesia' }, { name: 'Co-amoxiclav', dose: '1.2g IV TDS', route: 'IV', indication: 'Open fracture within 1h of arrival' }, { name: 'Tetanus toxoid / TIG', dose: '0.5mL IM ± 250 units TIG', route: 'IM', indication: 'Open wound, status uncertain' }],
    ['X-ray plain film', 'CT (complex / intra-articular)', 'FBC, U&E, group & save (operative)', 'Compartment pressure monitoring'],
    [{ destination: 'Orthopaedics', reason: 'All fractures needing reduction / operative fixation', urgency: 'urgent' }, { destination: 'Theatre / Vascular', reason: 'Open fracture, compartment syndrome, vascular compromise', urgency: 'immediate' }],
    ['Theatre', 'Orthopaedic ward', 'Fracture clinic discharge with cast / sling']
  ),

  soft_tissue_injury: protocol('soft_tissue_injury', 'Soft Tissue Injury / Sprain',
    ['Mechanism of injury?', 'Bony tenderness or limited weight-bearing (Ottawa rules)?', 'Bruising, swelling, range of movement?', 'Any locking, giving way, instability?'],
    [
      { symptom: 'Inability to weight-bear + bony tenderness', reason: 'Possible fracture — apply Ottawa rules', esiLevel: 3 },
    ],
    [{ step: 'Apply Ottawa Ankle / Knee / Foot rules' }, { step: 'POLICE / RICE protocol: Protect, Optimal Loading, Ice, Compression, Elevation' }, { step: 'X-ray if Ottawa rules positive' }, { step: 'Early mobilisation, physio referral' }],
    [{ name: 'Paracetamol + NSAID', dose: '1g QDS + Ibuprofen 400mg TDS', route: 'Oral', indication: 'Pain and inflammation' }, { name: 'Topical NSAID', dose: 'Apply TDS', route: 'Topical', indication: 'Localised pain — preferred in elderly' }],
    ['X-ray (if Ottawa rules positive)', 'USS for soft tissue (selected cases)'],
    [{ destination: 'Physiotherapy', reason: 'Rehabilitation', urgency: 'routine' }, { destination: 'Fracture clinic', reason: 'Persistent symptoms despite normal X-ray', urgency: 'routine' }],
    ['Discharge with RICE advice, analgesia, physio referral']
  ),

  rash_urticaria: protocol('rash_urticaria', 'Rash / Urticaria',
    ['Where did rash start and how spread?', 'Itching, burning, painful?', 'Recent new medications, foods, contacts, infections?', 'Wheeze, lip / tongue / throat swelling (anaphylaxis)?', 'Fever, mucosal involvement (SJS/TEN)?'],
    [
      { symptom: 'Urticaria + angioedema + wheeze / hypotension', reason: 'Anaphylaxis — adrenaline IM NOW', esiLevel: 1 },
      { symptom: 'Mucosal involvement + skin sloughing + recent new drug', reason: 'SJS / TEN', esiLevel: 1 },
      { symptom: 'Non-blanching purpuric rash + fever', reason: 'Meningococcal disease', esiLevel: 1 },
    ],
    [{ step: 'Identify and remove trigger if known' }, { step: 'Apply NIKOLSKY sign test if SJS/TEN suspected' }, { step: 'SCORTEN scoring if TEN' }, { step: 'Photograph rash for records and dermatology' }],
    [{ name: 'Cetirizine / Loratadine', dose: '10mg PO OD (up to QDS for urticaria)', route: 'Oral', indication: 'Urticaria first line' }, { name: 'Chlorphenamine', dose: '4mg PO QDS or 10mg IM/IV', route: 'Oral / IM / IV', indication: 'Acute urticaria/allergy' }, { name: 'Prednisolone', dose: '40mg OD ×3–5d', route: 'Oral', indication: 'Severe urticaria not responding to antihistamine' }, { name: 'Adrenaline IM', dose: '500mcg (0.5mL 1:1000) IM thigh', route: 'IM', indication: 'Anaphylaxis' }],
    ['Mast cell tryptase (anaphylaxis — at 1h, 4h, 24h)', 'FBC, U&E, LFTs, CRP (severe rash)', 'Skin biopsy (SJS/TEN, vasculitis)'],
    [{ destination: 'Dermatology', reason: 'SJS/TEN — burns unit / specialist', urgency: 'immediate' }, { destination: 'Allergy clinic', reason: 'Recurrent urticaria / drug allergy clarification', urgency: 'routine' }],
    ['Burns unit / ITU (SJS/TEN)', 'Discharge with antihistamine, GP f/u', 'Allergy referral']
  ),

  cellulitis: protocol('cellulitis', 'Cellulitis / Skin Infection',
    ['Site, onset, spread?', 'Fever or systemic symptoms?', 'Wound, bite, IVDU?', 'Diabetes, peripheral vascular disease, immunosuppression?', 'Lymphoedema or previous cellulitis?'],
    [
      { symptom: 'Cellulitis + severe pain out of proportion + crepitus / skin necrosis', reason: 'Necrotising fasciitis — emergency surgery', esiLevel: 1 },
      { symptom: 'Cellulitis + sepsis', reason: 'Systemic infection', esiLevel: 2 },
      { symptom: 'Facial / periorbital cellulitis', reason: 'Cavernous sinus thrombosis / orbital cellulitis risk', esiLevel: 2 },
    ],
    [{ step: 'Mark edge of erythema with skin marker; date and time' }, { step: 'Apply Eron Classification (I–IV)' }, { step: 'Bloods: FBC, CRP, U&E; blood cultures if febrile' }, { step: 'Elevate limb; rest' }, { step: 'Consider LRINEC score if necrotising fasciitis suspected' }],
    [{ name: 'Flucloxacillin', dose: '500mg–1g QDS PO (or 1–2g IV QDS)', route: 'Oral / IV', indication: 'First-line (S. aureus, S. pyogenes)' }, { name: 'Clarithromycin', dose: '500mg BD', route: 'Oral / IV', indication: 'Penicillin allergy' }, { name: 'Co-amoxiclav', dose: '625mg TDS or 1.2g IV TDS', route: 'Oral / IV', indication: 'Animal/human bite, facial cellulitis' }, { name: 'Vancomycin', dose: 'Per local protocol', route: 'IV', indication: 'MRSA cover for severe cellulitis' }, { name: 'Meropenem + Clindamycin', dose: 'Per local protocol', route: 'IV', indication: 'Necrotising fasciitis empirical' }],
    ['FBC, CRP, U&E, glucose, lactate', 'Blood cultures', 'Wound swab', 'LRINEC score for nec fasc', 'USS / CT if abscess suspected'],
    [{ destination: 'Plastic / General Surgery', reason: 'Necrotising fasciitis — urgent debridement', urgency: 'immediate' }, { destination: 'Acute Medicine', reason: 'Cellulitis Eron III/IV needing IV antibiotics', urgency: 'urgent' }],
    ['Theatre (nec fasc / abscess drainage)', 'OPAT for IV antibiotics', 'Discharge with oral antibiotics (Eron I/II)']
  ),

  burns_scalds: protocol('burns_scalds', 'Burns / Scalds',
    ['How was the burn caused (fire, hot liquid, chemical, electrical)?', 'When did it happen?', 'Any inhalation injury (closed space, soot, hoarseness)?', 'Total body surface area (TBSA) estimate?', 'Tetanus status?'],
    [
      { symptom: 'Inhalation injury (singed nasal hair, soot, stridor)', reason: 'Airway compromise risk', esiLevel: 1 },
      { symptom: 'TBSA > 15% adult or > 10% child', reason: 'Major burn — fluid resus', esiLevel: 1 },
      { symptom: 'Full thickness burn / circumferential / face / hands / genitals', reason: 'Specialist burns referral', esiLevel: 2 },
      { symptom: 'Electrical burn (especially high voltage)', reason: 'Cardiac arrhythmia + deep tissue damage', esiLevel: 2 },
    ],
    [{ step: 'Cool burn with running water for 20 minutes (within 3h of injury)' }, { step: 'Calculate TBSA (Wallace rule of 9s or Lund-Browder)' }, { step: 'Parkland formula: 4mL Hartmann × weight (kg) × %TBSA over 24h (½ in first 8h from injury)' }, { step: 'Cover with cling film (not circumferential)' }, { step: 'Catheterise if > 15% TBSA — target UO 0.5mL/kg/h' }],
    [{ name: 'Morphine', dose: '0.1mg/kg IV titrated', route: 'IV', indication: 'Burn pain' }, { name: 'Hartmann’s solution', dose: 'Parkland formula', route: 'IV', indication: 'Fluid resuscitation > 15% TBSA' }, { name: 'Tetanus toxoid / TIG', dose: 'As indicated', route: 'IM', indication: 'Burn wounds' }, { name: 'Flamazine (silver sulfadiazine)', dose: 'Topical', route: 'Topical', indication: 'Burn wound dressing (NOT face)' }],
    ['FBC, U&E, glucose, COHb (if smoke inhalation)', 'ABG (carboxyhaemoglobin)', 'CXR', 'ECG (electrical burn)', 'CK (electrical burn — rhabdomyolysis)'],
    [{ destination: 'Burns unit', reason: 'Major burns / specialist features', urgency: 'immediate' }, { destination: 'ITU', reason: 'Airway concern, large burns', urgency: 'immediate' }, { destination: 'Plastic surgery', reason: 'Deep partial / full thickness burns', urgency: 'urgent' }],
    ['ITU + burns transfer', 'Burns unit', 'Discharge with dressing and burns OPD f/u']
  ),

  ear_pain: protocol('ear_pain', 'Ear Pain / Otalgia',
    ['Discharge from ear (otorrhoea)?', 'Hearing loss?', 'Trauma or foreign body?', 'Recent URTI?', 'Diabetes / immunocompromised (malignant otitis externa)?'],
    [
      { symptom: 'Severe otalgia + facial nerve palsy in diabetic / immunocompromised', reason: 'Malignant otitis externa', esiLevel: 2 },
      { symptom: 'Mastoid tenderness + fever + outward-displaced pinna', reason: 'Mastoiditis', esiLevel: 2 },
    ],
    [{ step: 'Otoscopy — TM appearance, mobility, discharge' }, { step: 'Examine for facial nerve function' }, { step: 'Audiogram if hearing loss' }],
    [{ name: 'Amoxicillin', dose: '500mg PO TDS ×5d (adult)', route: 'Oral', indication: 'AOM with severe symptoms or no improvement in 2–3d' }, { name: 'Co-amoxiclav', dose: '625mg TDS', route: 'Oral', indication: 'AOM not responding to amoxicillin' }, { name: 'Sofradex / Ciprofloxacin drops', dose: '3 drops BD', route: 'Otic', indication: 'Otitis externa' }, { name: 'Paracetamol + Ibuprofen', dose: 'Standard', route: 'Oral', indication: 'Analgesia' }],
    ['Clinical diagnosis usually', 'CT temporal bone if mastoiditis / malignant otitis externa'],
    [{ destination: 'ENT', reason: 'Mastoiditis, malignant otitis externa', urgency: 'immediate' }, { destination: 'ENT', reason: 'Chronic ear discharge, suspected cholesteatoma', urgency: 'urgent' }],
    ['ENT admission (mastoiditis)', 'Discharge with antibiotic / drops + GP f/u']
  ),

  sore_throat: protocol('sore_throat', 'Sore Throat / Pharyngitis',
    ['Onset and duration?', 'Drooling, stridor, dyspnoea?', 'Trismus, asymmetric tonsillar swelling (peritonsillar abscess)?', 'Fever, rash, lymphadenopathy?', 'Immunocompromised?'],
    [
      { symptom: 'Drooling + stridor + tripod position', reason: 'Epiglottitis / supraglottitis', esiLevel: 1 },
      { symptom: 'Trismus + unilateral tonsillar swelling + uvular deviation', reason: 'Peritonsillar abscess (quinsy)', esiLevel: 2 },
      { symptom: 'Sore throat + neutropenia (chemo)', reason: 'Neutropenic sepsis', esiLevel: 1 },
    ],
    [{ step: 'Apply FeverPAIN or Centor criteria' }, { step: 'Avoid throat exam if epiglottitis suspected' }, { step: 'Monospot if EBV suspected' }, { step: 'I&D / aspiration for quinsy' }],
    [{ name: 'Penicillin V', dose: '500mg PO QDS ×5–10d', route: 'Oral', indication: 'Bacterial pharyngitis (FeverPAIN ≥ 4 / Centor ≥ 3)' }, { name: 'Clarithromycin', dose: '500mg BD', route: 'Oral', indication: 'Penicillin allergy' }, { name: 'Dexamethasone', dose: '10mg single dose', route: 'PO / IV', indication: 'Severe acute tonsillitis with significant pain' }],
    ['Throat swab MC&S (selected)', 'Monospot (EBV)', 'FBC if systemic / atypical'],
    [{ destination: 'ENT', reason: 'Quinsy, recurrent tonsillitis, epiglottitis', urgency: 'immediate' }],
    ['ENT (quinsy / epiglottitis)', 'Discharge with antibiotic / analgesia']
  ),

  epistaxis: protocol('epistaxis', 'Epistaxis (Nosebleed)',
    ['Anterior or posterior bleed?', 'Duration and volume?', 'Anticoagulant / antiplatelet use?', 'Trauma, recent surgery?', 'Hypertension?', 'Coagulopathy / family bleeding history?'],
    [
      { symptom: 'Massive epistaxis with airway risk / haemodynamic instability', reason: 'Posterior bleed — needs urgent ENT', esiLevel: 1 },
      { symptom: 'Anticoagulated + heavy bleed', reason: 'Need reversal', esiLevel: 2 },
    ],
    [{ step: 'Sit forward, pinch soft part of nose firmly for 10–15 min, ice to bridge' }, { step: 'If anterior bleeding visible: cautery with silver nitrate' }, { step: 'If continues: anterior nasal pack (Rapid Rhino / Merocel)' }, { step: 'If posterior bleed suspected: posterior pack + admit ENT' }, { step: 'Check BP, FBC, clotting if heavy' }],
    [{ name: 'Tranexamic Acid', dose: '500mg–1g topically (soaked gauze) or 1g PO/IV TDS', route: 'Topical / oral / IV', indication: 'Active epistaxis' }, { name: 'Naseptin cream', dose: 'Apply QDS ×10d', route: 'Topical (intranasal)', indication: 'Discharge prevention of rebleeding' }, { name: 'Vitamin K + PCC', dose: 'Per warfarin reversal', route: 'IV', indication: 'Warfarin reversal in major bleed' }],
    ['FBC, clotting, group & save (heavy bleed)', 'BP'],
    [{ destination: 'ENT', reason: 'Persistent bleed despite anterior pack / posterior bleed', urgency: 'urgent' }],
    ['ENT admission (pack in situ / posterior)', 'Discharge with Naseptin + advice']
  ),

  dental_pain: protocol('dental_pain', 'Dental Pain / Infection',
    ['Pain duration, character?', 'Visible swelling or pus?', 'Trismus?', 'Facial / neck swelling?', 'Fever, dysphagia?'],
    [
      { symptom: 'Dental abscess + airway compromise / floor of mouth swelling', reason: 'Ludwig angina', esiLevel: 1 },
      { symptom: 'Spreading facial swelling + fever', reason: 'Spreading dental infection', esiLevel: 2 },
    ],
    [{ step: 'Examine for swelling, trismus, lymphadenopathy' }, { step: 'Drainage if pointing abscess' }, { step: 'OPG (orthopantomogram) if abscess suspected' }],
    [{ name: 'Amoxicillin', dose: '500mg TDS ×5d', route: 'Oral', indication: 'Dental abscess' }, { name: 'Metronidazole', dose: '400mg TDS ×5d', route: 'Oral', indication: 'Add for severe infection' }, { name: 'Co-amoxiclav', dose: '625mg TDS', route: 'Oral', indication: 'Spreading infection' }, { name: 'Ibuprofen + Paracetamol', dose: 'Standard', route: 'Oral', indication: 'Analgesia' }],
    ['OPG if abscess', 'FBC, CRP if systemic'],
    [{ destination: 'Maxillofacial / Dental', reason: 'Abscess needing drainage / Ludwig', urgency: 'immediate' }],
    ['Max-fax admission (Ludwig)', 'Dentist referral']
  ),

  red_eye: protocol('red_eye', 'Red Eye',
    ['Pain, photophobia, visual change?', 'Discharge — watery, purulent, mucoid?', 'Contact lens use?', 'Trauma or foreign body?', 'Headache, nausea (acute angle closure)?'],
    [
      { symptom: 'Painful red eye + reduced vision + halos around lights', reason: 'Acute angle-closure glaucoma', esiLevel: 1 },
      { symptom: 'Contact lens wearer + red painful eye + corneal infiltrate', reason: 'Microbial keratitis', esiLevel: 2 },
      { symptom: 'Red eye + photophobia + reduced vision after trauma', reason: 'Anterior uveitis / scleritis / penetrating injury', esiLevel: 2 },
    ],
    [{ step: 'Visual acuity (essential, both eyes)' }, { step: 'Fluorescein staining for corneal abrasion / ulcer' }, { step: 'Intraocular pressure if AACG suspected (target < 30 within 1h)' }, { step: 'Pupil exam, slit lamp if available' }],
    [{ name: 'Chloramphenicol drops', dose: '1 drop QDS', route: 'Ophthalmic', indication: 'Bacterial conjunctivitis' }, { name: 'Acetazolamide', dose: '500mg IV / PO', route: 'IV / oral', indication: 'AACG (reduces IOP)' }, { name: 'Pilocarpine 2% drops', dose: '1 drop every 5 min ×3', route: 'Ophthalmic', indication: 'AACG' }, { name: 'Timolol 0.5% + Apraclonidine 1%', dose: '1 drop each', route: 'Ophthalmic', indication: 'AACG topical' }, { name: 'Prednisolone 1% drops', dose: '4–8 times daily', route: 'Ophthalmic', indication: 'Uveitis — ophthalmology to initiate' }],
    ['Visual acuity', 'Fluorescein + slit lamp', 'IOP', 'Corneal swab if keratitis'],
    [{ destination: 'Ophthalmology', reason: 'AACG, keratitis, uveitis, trauma', urgency: 'immediate' }],
    ['Ophthalmology admission (AACG)', 'Discharge with topical antibiotic (simple conjunctivitis)']
  ),

  visual_loss: protocol('visual_loss', 'Sudden Visual Loss',
    ['Painful or painless?', 'Sudden or gradual?', 'Curtain descending, flashes, floaters?', 'Headache, jaw claudication, scalp tenderness (GCA)?', 'Age > 50, vascular risk factors?'],
    [
      { symptom: 'Sudden painless monocular vision loss', reason: 'Central retinal artery occlusion — stroke equivalent', esiLevel: 1 },
      { symptom: 'Sudden vision loss + jaw claudication + temporal headache (age > 50)', reason: 'GCA — high-dose steroid NOW', esiLevel: 1 },
      { symptom: 'Curtain or shadow + flashes / floaters', reason: 'Retinal detachment', esiLevel: 2 },
      { symptom: 'Visual loss + neurological symptoms', reason: 'Stroke / occipital cortex', esiLevel: 1 },
    ],
    [{ step: 'Visual acuity and fields' }, { step: 'Fundoscopy + slit lamp' }, { step: 'ESR / CRP if GCA suspected (do not delay steroid)' }, { step: 'Urgent ophthalmology + stroke workup' }],
    [{ name: 'Prednisolone', dose: '60mg PO OD (or methylpred 500mg–1g IV if visual loss)', route: 'PO / IV', indication: 'GCA — prevent contralateral involvement' }, { name: 'Aspirin', dose: '300mg', route: 'Oral', indication: 'CRAO (stroke equivalent)' }],
    ['Visual acuity / fields', 'ESR, CRP', 'CT head', 'Carotid Doppler', 'Temporal artery biopsy (GCA)'],
    [{ destination: 'Ophthalmology', reason: 'All sudden visual loss', urgency: 'immediate' }, { destination: 'Stroke unit', reason: 'CRAO / TIA equivalent', urgency: 'immediate' }],
    ['Ophthalmology / stroke unit', 'Rheumatology (GCA)']
  ),

  eye_injury: protocol('eye_injury', 'Eye Injury',
    ['Mechanism — chemical, blunt, penetrating, foreign body?', 'Pain, visual loss?', 'Tools used (high-velocity — IOFB)?', 'Eye protection worn?'],
    [
      { symptom: 'Chemical splash (especially alkali)', reason: 'Sight-threatening — copious irrigation FIRST', esiLevel: 1 },
      { symptom: 'Penetrating injury / globe rupture', reason: 'Urgent ophthalmology', esiLevel: 1 },
      { symptom: 'High-velocity injury (grinding metal)', reason: 'Intraocular foreign body', esiLevel: 2 },
    ],
    [{ step: 'Chemical injury: irrigate with 1–2L saline for at least 30 min; check pH q5min until neutral (7.0–7.5)' }, { step: 'Penetrating injury: shield (NOT pad), NPO, anti-emetic, tetanus' }, { step: 'Avoid pressure on globe' }, { step: 'Visual acuity, slit lamp, fluorescein' }],
    [{ name: 'Tetracaine drops', dose: '1 drop topical', route: 'Ophthalmic', indication: 'Analgesia for examination/irrigation only' }, { name: 'Chloramphenicol drops', dose: 'QDS', route: 'Ophthalmic', indication: 'Corneal abrasion prophylaxis' }, { name: 'Cyclopentolate 1%', dose: '1 drop BD', route: 'Ophthalmic', indication: 'Ciliary spasm relief' }, { name: 'Antiemetic (Ondansetron)', dose: '4–8mg IV', route: 'IV', indication: 'Prevent vomiting which raises IOP in penetrating injury' }],
    ['Visual acuity', 'Fluorescein + slit lamp', 'CT orbit (penetrating injury / IOFB suspected)', 'pH paper'],
    [{ destination: 'Ophthalmology', reason: 'Penetrating injury, IOFB, severe chemical', urgency: 'immediate' }],
    ['Ophthalmology theatre (penetrating)', 'Discharge with chloramphenicol + 1-day review']
  ),

  vaginal_bleeding_non_pregnant: protocol('vaginal_bleeding_non_pregnant', 'Vaginal Bleeding (non-pregnant)',
    ['Last menstrual period?', 'Pattern — heavy, irregular, intermenstrual, postcoital?', 'Pelvic pain?', 'Recent procedures, IUD?', 'Postmenopausal bleeding?'],
    [
      { symptom: 'Heavy bleeding + hypotension', reason: 'Significant blood loss', esiLevel: 2 },
      { symptom: 'Postmenopausal bleeding', reason: '2WW endometrial cancer', esiLevel: 3 },
    ],
    [{ step: 'Pregnancy test (always)' }, { step: 'Speculum exam — identify source' }, { step: 'FBC if heavy bleeding' }, { step: 'Pelvic USS if abnormal exam' }],
    [{ name: 'Tranexamic Acid', dose: '1g PO TDS during menstruation', route: 'Oral', indication: 'Heavy menstrual bleeding' }, { name: 'Mefenamic Acid', dose: '500mg TDS', route: 'Oral', indication: 'Dysmenorrhoea + reduces flow' }, { name: 'Combined oral contraceptive', dose: 'Per regimen', route: 'Oral', indication: 'Long-term cycle control' }, { name: 'Norethisterone', dose: '5mg TDS ×10 days', route: 'Oral', indication: 'Acute heavy bleeding cessation' }],
    ['Beta-hCG', 'FBC', 'Pelvic USS (transvaginal preferred)', 'Cervical smear if due', 'Endometrial biopsy if PMB'],
    [{ destination: 'Gynaecology 2WW', reason: 'PMB', urgency: 'urgent' }, { destination: 'Gynaecology', reason: 'Heavy bleeding needing admission', urgency: 'urgent' }],
    ['Admit (haemodynamically significant bleed)', 'Discharge with TXA + GP/gynae f/u']
  ),

  pelvic_pain: protocol('pelvic_pain', 'Pelvic Pain (Female)',
    ['LMP and pregnancy possibility?', 'Onset, character, radiation?', 'Vaginal discharge / bleeding?', 'Fever?', 'Sexual history, recent partners?', 'Previous PID / ectopic / endometriosis?'],
    [
      { symptom: 'Positive pregnancy + unilateral pain + adnexal tenderness', reason: 'Ectopic pregnancy', esiLevel: 1 },
      { symptom: 'Severe pain + fever + peritonism + adnexal mass', reason: 'Tubo-ovarian abscess / severe PID', esiLevel: 2 },
      { symptom: 'Sudden severe unilateral pain ± palpable mass', reason: 'Ovarian torsion / cyst rupture', esiLevel: 2 },
    ],
    [{ step: 'Beta-hCG urgent' }, { step: 'TV USS if available' }, { step: 'Triple swabs (high vag, endocervical, urethral) if PID' }, { step: 'STI screen + contact tracing' }],
    [{ name: 'Ceftriaxone + Doxycycline + Metronidazole', dose: '1g IM single + 100mg BD ×14d + 400mg BD ×14d', route: 'IM / oral', indication: 'PID outpatient regimen' }, { name: 'Co-amoxiclav', dose: '1.2g IV TDS', route: 'IV', indication: 'Severe PID inpatient' }, { name: 'Morphine', dose: '2.5–10mg IV', route: 'IV', indication: 'Severe pain' }],
    ['Beta-hCG', 'FBC, CRP', 'Urinalysis + MSU', 'Triple swabs + STI NAAT', 'TV USS', 'CT abdomen if differential broad'],
    [{ destination: 'Gynaecology / EPU', reason: 'Suspected ectopic, ovarian torsion, severe PID', urgency: 'immediate' }],
    ['Theatre (torsion / ectopic)', 'Gynaecology admission', 'Discharge with PID outpatient regimen + contact tracing']
  ),

  hyperemesis_gravidarum: protocol('hyperemesis_gravidarum', 'Hyperemesis Gravidarum',
    ['How many weeks pregnant?', 'Frequency / volume of vomiting?', 'Able to tolerate any oral intake?', 'Weight loss?', 'Previous HG?', 'Multiple pregnancy or molar pregnancy?'],
    [
      { symptom: 'Inability to tolerate any oral intake + ketonuria + weight loss > 5%', reason: 'Severe HG', esiLevel: 2 },
      { symptom: 'Vomiting + abdominal pain + bleeding in early pregnancy', reason: 'Exclude ectopic / molar', esiLevel: 2 },
      { symptom: 'HG + confusion / neurology', reason: 'Wernicke encephalopathy risk', esiLevel: 1 },
    ],
    [{ step: 'PUQE-24 score' }, { step: 'Urine dipstick (ketones, infection)' }, { step: 'IV fluid resuscitation' }, { step: 'Always give thiamine BEFORE glucose-containing fluids' }, { step: 'TV USS to confirm viability and exclude molar' }],
    [{ name: 'Cyclizine', dose: '50mg IV/IM/PO TDS', route: 'IV / IM / oral', indication: 'First-line antiemetic' }, { name: 'Promethazine', dose: '25mg PO/IV', route: 'Oral / IV', indication: 'First-line alternative' }, { name: 'Ondansetron', dose: '4–8mg PO/IV', route: 'Oral / IV', indication: 'Second-line (small risk of cleft palate in first trimester)' }, { name: 'Metoclopramide', dose: '10mg PO/IV/IM', route: 'PO / IV / IM', indication: 'Third-line (5d max)' }, { name: 'Thiamine (Pabrinex)', dose: '1 pair IV OD ×3d', route: 'IV', indication: 'Wernicke prophylaxis BEFORE dextrose' }, { name: 'Hartmann’s', dose: '1L over 1h then maintenance', route: 'IV', indication: 'Rehydration (avoid dextrose alone)' }],
    ['Urinalysis (ketones)', 'FBC, U&E, LFTs, glucose', 'TFTs', 'TV USS'],
    [{ destination: 'EPU / Gynaecology', reason: 'Severe HG, weight loss, electrolyte disturbance', urgency: 'urgent' }],
    ['Ambulatory unit for IV hydration', 'Gynaecology / obstetric admission', 'Discharge with antiemetics + GP f/u']
  ),

  ectopic_pregnancy_suspected: protocol('ectopic_pregnancy_suspected', 'Suspected Ectopic Pregnancy',
    ['LMP, positive pregnancy test?', 'Pain (unilateral, shoulder tip)?', 'Bleeding?', 'Previous ectopic, PID, IVF, IUD?', 'Haemodynamic instability?'],
    [
      { symptom: 'Positive Beta-hCG + shock + abdominal pain', reason: 'Ruptured ectopic — emergency laparoscopy', esiLevel: 1 },
      { symptom: 'Shoulder tip pain in early pregnancy', reason: 'Diaphragmatic irritation from haemoperitoneum', esiLevel: 2 },
      { symptom: 'Beta-hCG > 1500 with no IUP on TV USS', reason: 'Ectopic until proven otherwise', esiLevel: 2 },
    ],
    [{ step: 'Wide-bore IV access ×2; group & crossmatch' }, { step: 'Beta-hCG (quantitative)' }, { step: 'TV USS (PUL = pregnancy of unknown location workflow)' }, { step: 'Anti-D if Rh negative + bleeding' }, { step: 'NPO if surgery likely' }],
    [{ name: 'IV crystalloid + blood', dose: 'Per major haemorrhage protocol', route: 'IV', indication: 'Resuscitation' }, { name: 'Methotrexate', dose: '50mg/m2 IM single dose', route: 'IM', indication: 'Medical management of stable ectopic (Beta-hCG < 5000, no FH, < 35mm)' }, { name: 'Anti-D immunoglobulin', dose: '250 IU IM (< 20wks)', route: 'IM', indication: 'Rh-negative mother with bleeding' }],
    ['Beta-hCG (quant) — repeat at 48h', 'FBC, group & save / crossmatch', 'TV USS', 'Anti-D status'],
    [{ destination: 'EPU / Gynaecology', reason: 'All suspected ectopic', urgency: 'immediate' }],
    ['Theatre — laparoscopic salpingectomy / salpingostomy', 'Medical management with methotrexate (selected)', 'Expectant management with serial Beta-hCG (very early, declining)']
  ),

  paediatric_wheeze: protocol('paediatric_wheeze', 'Paediatric Wheeze',
    ['Age?', 'First or recurrent episode?', 'Recent URTI?', 'Trigger — known asthma, allergens, exercise?', 'Severity at rest vs activity?', 'Inhaler use, steroid history?'],
    [
      { symptom: 'Silent chest / cyanosis / exhaustion', reason: 'Life-threatening', esiLevel: 1 },
      { symptom: 'SpO2 < 92% on air', reason: 'Severe', esiLevel: 2 },
      { symptom: 'Tracheal tug + intercostal recession + nasal flaring', reason: 'Severe respiratory distress', esiLevel: 2 },
    ],
    [{ step: 'Apply BTS/SIGN paediatric asthma severity' }, { step: 'Continuous SpO2, HR, RR' }, { step: 'Spacer device for inhalers (more effective than nebs in mild–moderate)' }, { step: 'PEF if > 5y and cooperative' }],
    [{ name: 'Salbutamol', dose: '10 puffs via spacer or 2.5–5mg neb', route: 'Inhaled / nebulised', indication: 'Bronchodilation, repeat every 20 min' }, { name: 'Ipratropium', dose: '250mcg neb (under 12y); 500mcg (12+)', route: 'Nebulised', indication: 'Add for severe' }, { name: 'Prednisolone', dose: '1–2mg/kg PO (max 40mg) ×3–5d', route: 'Oral', indication: 'All exacerbations needing ED care' }, { name: 'Magnesium Sulphate', dose: '40mg/kg IV (max 2g) over 20min', route: 'IV', indication: 'Life-threatening or refractory' }, { name: 'Hydrocortisone', dose: '4mg/kg IV', route: 'IV', indication: 'If unable PO' }],
    ['Clinical assessment', 'SpO2', 'PEF (if cooperative)', 'CXR if atypical or no response', 'ABG (severe / not responding)'],
    [{ destination: 'Paediatric ICU', reason: 'Life-threatening asthma', urgency: 'immediate' }, { destination: 'Paediatric ward', reason: 'Moderate–severe needing admission', urgency: 'urgent' }],
    ['PICU', 'Paediatric ward', 'Discharge with spacer + oral pred + asthma plan + GP f/u 48h']
  ),

  febrile_seizure: protocol('febrile_seizure', 'Febrile Seizure',
    ['Age (typically 6m–6y)?', 'Duration of seizure?', 'Simple (generalised, < 15min, no recurrence) or complex (focal, > 15min, recurrent)?', 'Post-ictal state?', 'Source of fever?', 'Family history of febrile seizures or epilepsy?'],
    [
      { symptom: 'Seizure > 5 min duration', reason: 'Status epilepticus — emergency treatment', esiLevel: 1 },
      { symptom: 'Focal features / age < 6m or > 6y', reason: 'Likely not simple febrile seizure', esiLevel: 2 },
      { symptom: 'Petechial rash + seizure', reason: 'Meningitis', esiLevel: 1 },
    ],
    [{ step: 'Recovery position; protect from injury' }, { step: 'Time the seizure' }, { step: 'Treat fever: paracetamol / ibuprofen + cool environment' }, { step: 'Identify source: thorough exam, urine dip, swabs' }, { step: 'Consider LP only if meningitis features (NICE)' }],
    [{ name: 'Buccal midazolam', dose: '0.3mg/kg', route: 'Buccal', indication: 'Seizure > 5 min — first dose' }, { name: 'Rectal diazepam', dose: '0.5mg/kg', route: 'Rectal', indication: 'Alternative' }, { name: 'IV lorazepam', dose: '0.1mg/kg', route: 'IV', indication: 'IV access available' }, { name: 'Paracetamol', dose: '15mg/kg', route: 'Oral / PR', indication: 'Antipyresis' }],
    ['Clinical diagnosis', 'Urine dip + MSU', 'Glucose', 'Bloods only if systemic illness'],
    [{ destination: 'Paediatrics', reason: 'Complex febrile seizure / first seizure < 18m / atypical', urgency: 'urgent' }],
    ['Paediatric admission (complex)', 'Discharge with safety netting (simple febrile seizure)']
  ),

  neonatal_jaundice: protocol('neonatal_jaundice', 'Neonatal Jaundice',
    ['Age of baby (days)?', 'Onset — when did jaundice appear?', 'Feeding well? Output?', 'Mother’s blood group / Rh status?', 'Family history (G6PD, spherocytosis)?'],
    [
      { symptom: 'Jaundice < 24h of life', reason: 'Pathological — usually haemolytic', esiLevel: 2 },
      { symptom: 'Bilirubin > exchange threshold', reason: 'Risk of kernicterus', esiLevel: 1 },
      { symptom: 'Pale stools + dark urine (conjugated)', reason: 'Biliary atresia — urgent investigation', esiLevel: 2 },
      { symptom: 'Sepsis features + jaundice', reason: 'Neonatal sepsis', esiLevel: 1 },
    ],
    [{ step: 'SBR (serum bilirubin) and plot on NICE neonatal jaundice chart for gestation' }, { step: 'Split (direct/conjugated) if prolonged > 14d term / 21d preterm or unwell' }, { step: 'Phototherapy / exchange transfusion thresholds per chart' }, { step: 'Encourage feeding (no role for water/dextrose)' }],
    [{ name: 'Phototherapy', dose: 'Per NICE threshold', route: '-', indication: 'Unconjugated hyperbilirubinaemia' }, { name: 'IVIG', dose: '500mg/kg IV', route: 'IV', indication: 'Rhesus / ABO haemolytic disease' }, { name: 'IV fluids', dose: 'Per maintenance', route: 'IV', indication: 'Dehydration with phototherapy' }],
    ['SBR + split if prolonged', 'FBC, blood film, reticulocytes', 'Group & DCT', 'Blood culture (if unwell)', 'TFTs, G6PD (prolonged jaundice)'],
    [{ destination: 'Neonatology', reason: 'All babies needing phototherapy / sepsis / pathological causes', urgency: 'urgent' }, { destination: 'Paediatric hepatology', reason: 'Conjugated hyperbilirubinaemia', urgency: 'urgent' }],
    ['NICU (severe)', 'Postnatal ward + phototherapy', 'Discharge with health visitor f/u']
  ),

  paediatric_head_injury: protocol('paediatric_head_injury', 'Paediatric Head Injury',
    ['Mechanism — fall, RTC, NAI?', 'LOC, vomiting (how many times)?', 'Seizure post injury?', 'Drowsy or behavioural change?', 'Skull tenderness, scalp haematoma?', 'Bleeding disorder, anticoagulant?'],
    [
      { symptom: 'GCS < 14 (15 if < 1y)', reason: 'Significant head injury', esiLevel: 1 },
      { symptom: 'Open or depressed skull fracture / tense fontanelle', reason: 'Intracranial injury', esiLevel: 1 },
      { symptom: 'Suspected NAI', reason: 'Safeguarding', esiLevel: 2 },
      { symptom: 'Witnessed LOC > 5 min, abnormal drowsiness, 3+ vomits, age < 1y bruise > 5cm on head', reason: 'NICE CT head criteria (paeds)', esiLevel: 2 },
    ],
    [{ step: 'Apply NICE CG176 paediatric head injury criteria' }, { step: 'CT head within 1h if criteria met' }, { step: 'Cervical spine immobilisation if mechanism suggests' }, { step: 'Safeguarding consideration — speak to safeguarding lead if NAI suspected' }],
    [{ name: 'Paracetamol / Ibuprofen', dose: 'Weight-based', route: 'Oral / PR', indication: 'Analgesia (avoid sedating)' }, { name: 'Ondansetron', dose: '0.15mg/kg IV (max 4mg)', route: 'IV', indication: 'Vomiting' }],
    ['CT head (NICE criteria)', 'C-spine imaging if indicated'],
    [{ destination: 'Paediatric neurosurgery', reason: 'Intracranial injury on CT', urgency: 'immediate' }, { destination: 'Paediatric admission', reason: 'Observation for borderline cases', urgency: 'urgent' }],
    ['Neurosurgery', 'Paediatric ward observation', 'Discharge with head injury advice sheet']
  ),

  thyroid_storm: protocol('thyroid_storm', 'Thyroid Storm',
    ['Known hyperthyroidism / Graves?', 'Recent infection, surgery, contrast, RAI?', 'Stopped antithyroid meds?', 'Fever, palpitations, agitation, GI symptoms?'],
    [
      { symptom: 'Fever + tachyarrhythmia + delirium / coma + hyperthyroidism', reason: 'Thyroid storm — high mortality', esiLevel: 1 },
      { symptom: 'Burch-Wartofsky Score ≥ 45', reason: 'Highly suggestive', esiLevel: 1 },
    ],
    [{ step: 'Apply Burch-Wartofsky Point Scale' }, { step: 'IV fluids, cooling, supportive' }, { step: 'TFTs urgent' }, { step: 'Identify precipitant and treat (e.g., sepsis)' }],
    [{ name: 'Propranolol', dose: '60–80mg PO QDS or 1mg IV slow', route: 'PO / IV', indication: 'Symptom control + block T4-T3 conversion' }, { name: 'Propylthiouracil (PTU)', dose: '500–1000mg loading then 250mg 4-hourly', route: 'Oral / NG', indication: 'Blocks new thyroid hormone synthesis + peripheral conversion' }, { name: 'Hydrocortisone', dose: '100mg IV QDS', route: 'IV', indication: 'Adrenal support + blocks T4-T3 conversion' }, { name: 'Iodine (Lugol’s)', dose: '5–10 drops PO 6-hourly', route: 'Oral', indication: 'Give 1h AFTER PTU — blocks hormone release' }, { name: 'Paracetamol + cooling', dose: '1g QDS + tepid sponging', route: 'Oral / PR', indication: 'Hyperthermia (avoid aspirin)' }],
    ['TFTs (T3, T4, TSH)', 'FBC, U&E, LFTs, glucose, calcium, cortisol', 'Septic screen', 'ECG'],
    [{ destination: 'ITU / Endocrinology', reason: 'Thyroid storm', urgency: 'immediate' }],
    ['ITU', 'Endocrinology admission']
  ),

  adrenal_crisis: protocol('adrenal_crisis', 'Adrenal Crisis',
    ['Known Addison’s / on long-term steroids?', 'Recent illness, surgery, missed steroid doses?', 'Vomiting / diarrhoea?', 'Hyperpigmentation?'],
    [
      { symptom: 'Hypotension + hyponatraemia + hyperkalaemia + hypoglycaemia in known Addison’s', reason: 'Adrenal crisis — give hydrocortisone NOW', esiLevel: 1 },
      { symptom: 'Acute collapse on long-term steroids with recent illness', reason: 'Steroid withdrawal crisis', esiLevel: 1 },
    ],
    [{ step: 'Do NOT delay treatment for confirmation — clinical diagnosis' }, { step: 'IV access; blood for cortisol, ACTH, U&E, glucose BEFORE steroid' }, { step: 'IV fluids (1L 0.9% saline rapidly)' }, { step: 'IV hydrocortisone immediately' }, { step: 'Identify and treat precipitant' }],
    [{ name: 'Hydrocortisone', dose: '100mg IV stat then 100mg IV/IM QDS (or 200mg/24h infusion)', route: 'IV / IM', indication: 'Adrenal crisis — primary treatment' }, { name: '0.9% Saline', dose: '1L over 30–60 min, then 1L over 2h, then 1L over 4–6h', route: 'IV', indication: 'Fluid resuscitation' }, { name: '10% Dextrose', dose: '50–100mL IV', route: 'IV', indication: 'Hypoglycaemia' }],
    ['Cortisol + ACTH (before steroid)', 'U&E (Na low, K high)', 'Glucose', 'FBC, CRP', 'Septic screen'],
    [{ destination: 'Endocrinology / ITU', reason: 'All adrenal crises', urgency: 'immediate' }],
    ['ITU / HDU', 'Endocrinology admission']
  ),

  hypoglycaemia: protocol('hypoglycaemia', 'Hypoglycaemia',
    ['Diabetic on insulin or sulphonylureas?', 'Recent food intake?', 'Alcohol use?', 'Symptoms — sweating, tremor, confusion, LOC?'],
    [
      { symptom: 'GCS < 14 + glucose < 4', reason: 'Severe hypoglycaemia needing IV treatment', esiLevel: 1 },
      { symptom: 'Hypoglycaemia + sulphonylurea use', reason: 'Prolonged — needs admission', esiLevel: 2 },
    ],
    [{ step: 'Capillary blood glucose' }, { step: 'If conscious: 15–20g oral glucose (Lucozade, glucotabs)' }, { step: 'If unconscious / NBM: IV glucose or IM glucagon' }, { step: 'Recheck BG every 10–15min until > 4' }, { step: 'Long-acting carbohydrate once awake' }],
    [{ name: '10% Dextrose', dose: '100mL IV over 15 min (max 200mL)', route: 'IV', indication: 'Unconscious / NBM (preferred over 50% — less tissue damage)' }, { name: '50% Dextrose', dose: '20mL IV', route: 'IV', indication: 'Alternative — large vein only' }, { name: 'Glucagon', dose: '1mg IM (0.5mg if < 8y)', route: 'IM', indication: 'No IV access' }, { name: 'Octreotide', dose: '50mcg SC 8-hourly', route: 'SC', indication: 'Sulphonylurea-induced recurrent hypoglycaemia' }],
    ['Capillary BG', 'Venous glucose', 'U&E, LFTs (alcohol related)', 'Insulin, C-peptide (if cause unclear)'],
    [{ destination: 'Diabetes team', reason: 'Recurrent hypoglycaemia / sulphonylurea / unknown cause', urgency: 'urgent' }, { destination: 'ITU', reason: 'Refractory severe hypoglycaemia', urgency: 'immediate' }],
    ['Admit (sulphonylurea, alcohol, unclear cause)', 'Discharge after normal BG and meal + diabetes advice']
  ),

  sickle_cell_crisis: protocol('sickle_cell_crisis', 'Sickle Cell Crisis',
    ['Known sickle cell disease?', 'Site and severity of pain?', 'Fever (sepsis)?', 'Chest pain, breathlessness (acute chest syndrome)?', 'Stroke symptoms?', 'Priapism?'],
    [
      { symptom: 'Chest pain + new infiltrate + fever + hypoxia', reason: 'Acute chest syndrome — high mortality', esiLevel: 1 },
      { symptom: 'Acute stroke symptoms in sickle cell', reason: 'Stroke — exchange transfusion', esiLevel: 1 },
      { symptom: 'Sequestration crisis (rapid Hb drop, splenomegaly)', reason: 'Life-threatening', esiLevel: 1 },
      { symptom: 'Priapism > 4 hours', reason: 'Urological emergency', esiLevel: 1 },
    ],
    [{ step: 'Rapid analgesia within 30 min of arrival (NHS standard)' }, { step: 'IV fluids (avoid over-hydration — risk of acute chest)' }, { step: 'O2 if SpO2 < 95%' }, { step: 'Sepsis 6 if febrile (functional asplenia)' }, { step: 'Haematology contact early' }],
    [{ name: 'Morphine / Diamorphine', dose: '0.1–0.2mg/kg IV titrated', route: 'IV', indication: 'Severe pain — rapid titration' }, { name: 'Paracetamol + Ibuprofen', dose: 'Standard adjuncts', route: 'Oral / IV', indication: 'Multimodal analgesia' }, { name: 'Co-amoxiclav / Ceftriaxone', dose: '1.2g IV TDS / 2g IV OD', route: 'IV', indication: 'Febrile sickle patient — empirical' }, { name: 'O2', dose: 'Target SpO2 > 95%', route: 'Inhaled', indication: 'Acute chest syndrome' }, { name: 'Exchange transfusion', dose: 'Per haematology', route: 'IV', indication: 'Acute chest, stroke, sequestration' }],
    ['FBC + reticulocytes', 'CRP, U&E, LFTs', 'Group & crossmatch (extended phenotype)', 'Blood cultures', 'CXR (acute chest)', 'ABG'],
    [{ destination: 'Haematology', reason: 'All sickle crises', urgency: 'urgent' }, { destination: 'ITU', reason: 'Acute chest syndrome, sepsis, stroke', urgency: 'immediate' }, { destination: 'Urology', reason: 'Priapism', urgency: 'immediate' }],
    ['ITU (severe complications)', 'Haematology ward', 'Discharge with analgesia + haematology f/u']
  ),

  neutropenic_sepsis: protocol('neutropenic_sepsis', 'Neutropenic Sepsis',
    ['On chemotherapy / immunosuppression?', 'When was last cycle?', 'Fever, rigors, source of infection?', 'Indwelling central line?'],
    [
      { symptom: 'Temperature ≥ 38°C in chemotherapy patient', reason: 'Neutropenic sepsis until proven otherwise — antibiotics within 1h', esiLevel: 1 },
      { symptom: 'Hypotension + chemotherapy + fever', reason: 'Septic shock', esiLevel: 1 },
    ],
    [{ step: 'Antibiotics within 1 HOUR of arrival (NICE NG143)' }, { step: 'Sepsis 6 + blood cultures (peripheral AND from line)' }, { step: 'Apply MASCC score for risk stratification' }, { step: 'Isolation if neutropenic' }],
    [{ name: 'Piperacillin-tazobactam (Tazocin)', dose: '4.5g IV TDS', route: 'IV', indication: 'First-line empirical' }, { name: 'Meropenem', dose: '1g IV TDS', route: 'IV', indication: 'Tazocin allergy or severe sepsis' }, { name: 'Vancomycin / Teicoplanin', dose: 'Per local protocol', route: 'IV', indication: 'Add if line infection, septic shock, MRSA risk' }, { name: 'G-CSF (Filgrastim)', dose: '5mcg/kg SC OD', route: 'SC', indication: 'Per oncology — to accelerate neutrophil recovery' }],
    ['FBC + differential', 'CRP, U&E, LFTs, lactate', 'Blood cultures (peripheral + line)', 'Urine + MSU', 'CXR', 'Swabs from any source'],
    [{ destination: 'Oncology / Haematology', reason: 'All neutropenic sepsis', urgency: 'immediate' }, { destination: 'ITU', reason: 'Septic shock', urgency: 'immediate' }],
    ['ITU', 'Oncology / haematology side room']
  ),

  anaemia_symptomatic: protocol('anaemia_symptomatic', 'Symptomatic Anaemia',
    ['Onset — acute (bleeding) or chronic?', 'Source of blood loss (melaena, menorrhagia)?', 'Diet, iron / B12 / folate?', 'Family history (thalassaemia, sickle)?', 'Cardiac symptoms (angina, SOB)?'],
    [
      { symptom: 'Hb < 70 + cardiovascular compromise', reason: 'Severe anaemia needing transfusion', esiLevel: 2 },
      { symptom: 'Active GI / other bleed + anaemia', reason: 'Acute haemorrhage', esiLevel: 1 },
    ],
    [{ step: 'FBC, blood film, reticulocytes, iron studies, B12, folate' }, { step: 'Identify cause: MCV-based approach' }, { step: 'Transfusion threshold Hb 70 (90 if cardiac)' }, { step: 'IV iron if functional deficiency' }],
    [{ name: 'Packed Red Cells', dose: '1 unit IV over 2–4h', route: 'IV', indication: 'Symptomatic / Hb < 70' }, { name: 'Ferrous Sulphate', dose: '200mg PO OD or alt days', route: 'Oral', indication: 'Iron deficiency' }, { name: 'Hydroxocobalamin', dose: '1mg IM ×3/week ×2 weeks then 3-monthly', route: 'IM', indication: 'B12 deficiency' }, { name: 'Folic Acid', dose: '5mg OD', route: 'Oral', indication: 'Folate deficiency' }],
    ['FBC + reticulocytes + blood film', 'Iron studies (ferritin, TIBC, transferrin sat)', 'B12, folate', 'LDH, haptoglobin (haemolysis)', 'Coombs test', 'Hb electrophoresis if thalassaemia / sickle suspected'],
    [{ destination: 'Haematology', reason: 'Unexplained / haemolytic / bone marrow concern', urgency: 'urgent' }, { destination: 'GI 2WW', reason: 'IDA in male / postmenopausal female', urgency: 'urgent' }],
    ['Admit if Hb < 70 + symptoms', 'Day case transfusion', 'Discharge with iron + GP f/u + investigation referral']
  ),

  acute_psychosis: protocol('acute_psychosis', 'Acute Psychosis',
    ['Hallucinations / delusions / disorganised thinking?', 'Insight?', 'Risk to self or others?', 'Substance use (drugs, alcohol)?', 'Known mental illness?', 'Recent medication change?'],
    [
      { symptom: 'Active suicidal ideation with plan', reason: 'High self-harm risk', esiLevel: 2 },
      { symptom: 'Risk to others / aggression', reason: 'Risk to staff and patients', esiLevel: 2 },
      { symptom: 'New onset psychosis with neurological signs', reason: 'Organic cause (encephalitis, drugs)', esiLevel: 2 },
    ],
    [{ step: 'Calm low-stimulus environment; staff safety (de-escalation, security if needed)' }, { step: 'Rule out organic causes: glucose, U&E, CT head, urine drug screen, TFTs' }, { step: 'Psychiatric liaison referral' }, { step: 'Mental Health Act assessment if refusing care + risk' }],
    [{ name: 'Lorazepam', dose: '1–2mg PO/IM', route: 'PO / IM', indication: 'Rapid tranquillisation (first line in NICE)' }, { name: 'Olanzapine', dose: '5–10mg PO/IM', route: 'PO / IM', indication: 'Antipsychotic option' }, { name: 'Haloperidol + Promethazine', dose: '5mg + 50mg IM', route: 'IM', indication: 'Senior decision; ECG before/after' }, { name: 'Procyclidine', dose: '5mg IM', route: 'IM', indication: 'Acute dystonia from antipsychotic' }],
    ['Glucose, U&E, FBC, LFTs, TFTs', 'CT head (organic cause)', 'Urine drug screen', 'Beta-hCG'],
    [{ destination: 'Psychiatric Liaison', reason: 'All acute psychosis', urgency: 'urgent' }, { destination: 'MHA assessment', reason: 'Detention under MHA if refusing + risk', urgency: 'urgent' }],
    ['Psychiatric admission', 'Acute medical (organic cause)', 'Section 136 suite']
  ),

  alcohol_withdrawal: protocol('alcohol_withdrawal', 'Alcohol Withdrawal',
    ['Daily alcohol intake and duration?', 'Last drink?', 'Previous withdrawal seizures or DTs?', 'Tremor, sweating, nausea, hallucinations?', 'Comorbidities (liver disease, malnutrition)?'],
    [
      { symptom: 'Seizures + withdrawal', reason: 'Alcohol withdrawal seizure', esiLevel: 2 },
      { symptom: 'Delirium tremens (confusion, hallucinations, autonomic instability)', reason: 'High mortality', esiLevel: 1 },
      { symptom: 'Wernicke encephalopathy (confusion, ataxia, ophthalmoplegia)', reason: 'Thiamine NOW', esiLevel: 1 },
    ],
    [{ step: 'CIWA-Ar assessment' }, { step: 'Pabrinex BEFORE any glucose' }, { step: 'Symptom-triggered diazepam regime (chlordiazepoxide if able PO)' }, { step: 'Treat dehydration cautiously (alcoholic cardiomyopathy risk)' }],
    [{ name: 'Thiamine (Pabrinex)', dose: '1 pair IV TDS ×3d then oral', route: 'IV', indication: 'Wernicke prophylaxis / treatment' }, { name: 'Chlordiazepoxide', dose: 'Reducing regime: 20–40mg QDS day 1, taper over 7–10d', route: 'Oral', indication: 'Withdrawal symptoms' }, { name: 'Diazepam', dose: '10–20mg IV/PO repeated', route: 'IV / oral', indication: 'Severe withdrawal / seizures' }, { name: 'Lorazepam', dose: '1–2mg IV', route: 'IV', indication: 'Hepatic impairment alternative' }, { name: 'Haloperidol', dose: '2.5–5mg IM', route: 'IM', indication: 'Hallucinations in DTs (after BZDs)' }],
    ['FBC, U&E, LFTs, glucose, magnesium', 'Septic screen if febrile', 'ECG'],
    [{ destination: 'Alcohol Liaison', reason: 'All admissions for withdrawal', urgency: 'urgent' }, { destination: 'ITU', reason: 'DTs / Wernicke / seizures', urgency: 'immediate' }],
    ['ITU (DTs)', 'Medical ward with Pabrinex + CIWA monitoring', 'Discharge with chlordiazepoxide taper + AL referral']
  ),

  self_harm: protocol('self_harm', 'Self-harm / Suicidal Crisis',
    ['What did you do / take?', 'When and where?', 'Were you alone?', 'Suicidal intent at the time and now?', 'Plan? Means? Note? Final acts?', 'Mental health history, current treatment?'],
    [
      { symptom: 'Significant overdose / injury requiring medical treatment', reason: 'Medical stabilisation first', esiLevel: 2 },
      { symptom: 'Active intent + plan + means', reason: 'Very high suicide risk', esiLevel: 1 },
      { symptom: 'Severe self-injury (deep laceration, etc.)', reason: 'Trauma management', esiLevel: 2 },
    ],
    [{ step: 'Maintain safe environment, remove means, 1:1 supervision' }, { step: 'Medical stabilisation: ABCDE, treat overdose / wounds' }, { step: 'Compassionate assessment — non-judgmental' }, { step: 'Psychiatric Liaison assessment for ALL self-harm presentations (NICE)' }, { step: 'Do NOT discharge before mental health assessment' }],
    [{ name: 'See overdose / poisoning protocol', dose: '-', route: '-', indication: 'For specific overdose' }, { name: 'Tetanus toxoid', dose: '0.5mL IM', route: 'IM', indication: 'For lacerations' }],
    ['Specific to ingested substance', 'Bloods: FBC, U&E, LFTs, paracetamol, salicylate, glucose'],
    [{ destination: 'Psychiatric Liaison', reason: 'All self-harm', urgency: 'immediate' }, { destination: 'Crisis team / Community MH', reason: 'Discharge planning', urgency: 'urgent' }],
    ['Medical admission for treatment', 'Psychiatric admission (high risk)', 'Discharge with crisis plan + community MH f/u (after assessment)']
  ),

  panic_attack: protocol('panic_attack', 'Panic Attack / Acute Anxiety',
    ['Sudden onset palpitations, sweating, shortness of breath?', 'Sense of impending doom?', 'Tingling around mouth, fingers (hyperventilation)?', 'Triggers / similar episodes before?', 'Cardiac risk factors (exclude MI/PE)?'],
    [
      { symptom: 'Symptoms not fully explained by anxiety + cardiac risk factors', reason: 'Rule out ACS / PE', esiLevel: 2 },
    ],
    [{ step: 'ECG + bloods to exclude cardiac' }, { step: 'Calm environment, reassurance, controlled breathing' }, { step: 'Avoid paper bag rebreathing — risk of hypoxia' }],
    [{ name: 'Lorazepam', dose: '1mg PO/SL', route: 'PO / SL', indication: 'Severe acute panic — short-term only' }, { name: 'Propranolol', dose: '10–40mg PO', route: 'Oral', indication: 'Somatic symptoms (palpitations, tremor)' }],
    ['ECG', 'FBC, U&E, glucose, troponin (if cardiac concern)', 'TFTs (hyperthyroidism)'],
    [{ destination: 'GP / Primary care MH', reason: 'Recurrent panic — CBT', urgency: 'routine' }],
    ['Discharge with reassurance + GP MH f/u + IAPT/CBT referral']
  ),

  sepsis: protocol('sepsis', 'Sepsis',
    ['Source of infection (urine, chest, skin, abdomen)?', 'Recent surgery, indwelling line/catheter?', 'Immunocompromised, splenectomy?', 'Fever, rigors, confusion?', 'Vaccination status?'],
    [
      { symptom: 'SBP < 90 / lactate > 2 / requiring vasopressor', reason: 'Septic shock', esiLevel: 1 },
      { symptom: 'NEWS2 ≥ 7 OR SOFA ≥ 2 + infection', reason: 'Sepsis', esiLevel: 1 },
      { symptom: 'Asplenic + fever', reason: 'OPSI risk', esiLevel: 1 },
    ],
    [{ step: 'Sepsis 6 within 1 hour (BUFALO): Blood cultures, Urine output, Fluids IV, Antibiotics IV, Lactate, Oxygen' }, { step: 'NEWS2 score every 1h' }, { step: 'Identify source — septic screen' }, { step: 'Source control (drain abscess, remove infected line, debridement)' }],
    [{ name: 'Piperacillin-tazobactam', dose: '4.5g IV TDS', route: 'IV', indication: 'Empirical broad-spectrum (most ED sepsis)' }, { name: 'Co-amoxiclav + Gentamicin', dose: '1.2g IV TDS + 5mg/kg', route: 'IV', indication: 'Empirical alternative' }, { name: 'Meropenem', dose: '1g IV TDS', route: 'IV', indication: 'Severe sepsis, penicillin allergy, resistance risk' }, { name: 'Hartmann’s', dose: '500mL bolus, up to 30mL/kg in first 3h', route: 'IV', indication: 'Fluid resuscitation' }, { name: 'Noradrenaline', dose: '0.05–1mcg/kg/min', route: 'IV (central)', indication: 'Persistent hypotension despite fluids' }],
    ['FBC, CRP, U&E, LFTs, lactate, glucose, clotting', 'Blood cultures ×2', 'Urinalysis + MSU', 'CXR', 'Source-specific imaging'],
    [{ destination: 'ICU / Critical Care', reason: 'Septic shock / organ failure', urgency: 'immediate' }, { destination: 'Acute Medicine / Surgery', reason: 'Source control', urgency: 'immediate' }],
    ['ITU', 'Acute medical / surgical admission']
  ),

  malaria_suspected: protocol('malaria_suspected', 'Suspected Malaria',
    ['Travel to endemic area (where, when)?', 'Prophylaxis taken?', 'Fever pattern (paroxysmal)?', 'Headache, myalgia, jaundice?', 'Pregnancy?'],
    [
      { symptom: 'Falciparum + parasitaemia > 2% / cerebral / renal / pulmonary involvement', reason: 'Severe malaria — IV artesunate', esiLevel: 1 },
      { symptom: 'Recent travel + fever + thrombocytopenia', reason: 'Malaria until excluded', esiLevel: 2 },
    ],
    [{ step: 'Thick AND thin blood films ×3 (every 12–24h if first negative)' }, { step: 'Rapid Diagnostic Test (RDT) as adjunct' }, { step: 'FBC (thrombocytopenia), U&E, LFTs, glucose' }, { step: 'Discuss all confirmed cases with ID' }, { step: 'Notify Public Health (notifiable)' }],
    [{ name: 'IV Artesunate', dose: '2.4mg/kg IV at 0, 12, 24h then OD', route: 'IV', indication: 'Severe falciparum malaria' }, { name: 'Riamet (artemether-lumefantrine)', dose: '4 tablets BD ×3d', route: 'Oral', indication: 'Uncomplicated falciparum (post artesunate or initial)' }, { name: 'Chloroquine', dose: '600mg base then 300mg at 6,24,48h', route: 'Oral', indication: 'Non-falciparum (P. vivax, P. ovale)' }, { name: 'Primaquine', dose: '15mg OD ×14d', route: 'Oral', indication: 'P. vivax/ovale eradication (check G6PD first)' }],
    ['Thick + thin films', 'RDT', 'FBC, U&E, LFTs, glucose, lactate', 'Blood cultures (co-infection)', 'Beta-hCG'],
    [{ destination: 'Infectious Diseases', reason: 'All confirmed / suspected malaria', urgency: 'immediate' }, { destination: 'ITU', reason: 'Severe falciparum', urgency: 'immediate' }],
    ['ITU (severe)', 'ID admission']
  ),

  carbon_monoxide: protocol('carbon_monoxide', 'Carbon Monoxide Poisoning',
    ['Exposure source (faulty boiler, fire, exhaust)?', 'Duration of exposure?', 'Others in household affected?', 'Headache, dizziness, nausea, LOC?', 'Pregnant?'],
    [
      { symptom: 'GCS reduced / cardiac symptoms / pregnancy', reason: 'Severe CO poisoning — consider HBO', esiLevel: 1 },
      { symptom: 'COHb > 25% / loss of consciousness', reason: 'Severe — high oxygen, consider HBO', esiLevel: 1 },
    ],
    [{ step: 'Remove from source' }, { step: '100% oxygen via NRB until COHb < 10% and asymptomatic' }, { step: 'Co-oximetry (pulse oximetry unreliable)' }, { step: 'ECG, troponin if cardiac symptoms' }, { step: 'Contact NPIS / hyperbaric centre for severe cases' }],
    [{ name: '100% Oxygen', dose: 'Via non-rebreathe mask', route: 'Inhaled', indication: 'All CO exposures' }, { name: 'Hyperbaric oxygen', dose: 'Per HBO centre', route: 'HBO chamber', indication: 'LOC, neuro symptoms, pregnancy, COHb > 25%, cardiac symptoms' }],
    ['COHb (venous or arterial)', 'ABG', 'ECG, troponin', 'FBC, U&E, glucose'],
    [{ destination: 'Hyperbaric centre (call NPIS)', reason: 'Severe CO poisoning', urgency: 'immediate' }, { destination: 'Acute Medicine', reason: 'Observation', urgency: 'urgent' }],
    ['HBO centre', 'Acute medicine', 'Discharge once asymptomatic + COHb < 10% + safety advice']
  ),

  snake_bite: protocol('snake_bite', 'Snake Bite',
    ['Where, when, what type of snake (if known)?', 'Time of bite?', 'Local signs (swelling, blistering)?', 'Systemic symptoms (bleeding, weakness)?', 'Tetanus status?'],
    [
      { symptom: 'Systemic envenoming (bleeding, shock, paralysis)', reason: 'Antivenom needed', esiLevel: 1 },
      { symptom: 'Compartment syndrome from local envenoming', reason: 'Surgical decompression', esiLevel: 1 },
    ],
    [{ step: 'Immobilise affected limb at heart level (NOT tourniquet for vipers)' }, { step: 'Mark and time bite site; photograph snake if possible' }, { step: 'Call NPIS / Toxbase / local snake antivenom advisory service' }, { step: 'Monitor for systemic envenoming (FBC, clotting, U&E q4h)' }, { step: 'Tetanus prophylaxis' }],
    [{ name: 'Antivenom', dose: 'Per species and local protocol', route: 'IV', indication: 'Systemic envenoming or progressive local' }, { name: 'Adrenaline', dose: '0.5mg IM', route: 'IM', indication: 'Anaphylaxis from antivenom' }, { name: 'Tetanus toxoid', dose: '0.5mL IM ± TIG', route: 'IM', indication: 'Tetanus prophylaxis' }],
    ['FBC, clotting, U&E, CK, group & save', '20-min whole blood clotting test (WBCT) bedside in tropical settings', 'ECG'],
    [{ destination: 'Toxicology / NPIS', reason: 'All envenomation', urgency: 'immediate' }, { destination: 'ITU', reason: 'Severe envenoming', urgency: 'immediate' }],
    ['ITU', 'Medical admission for observation ≥ 24h']
  ),

  electrical_injury: protocol('electrical_injury', 'Electrical Injury',
    ['Voltage (high vs low)?', 'AC or DC?', 'Duration of contact?', 'LOC?', 'Burns at entry / exit?', 'Falls or trauma?'],
    [
      { symptom: 'Cardiac arrest / arrhythmia after electrocution', reason: 'Cardiac instability', esiLevel: 1 },
      { symptom: 'High voltage exposure (> 1000V)', reason: 'Risk of deep tissue damage, compartment syndrome, arrhythmia', esiLevel: 1 },
      { symptom: 'LOC + electrical injury', reason: 'CNS injury / fall', esiLevel: 2 },
    ],
    [{ step: 'Cardiac monitor for 4–6 hours minimum if any ECG abnormality / LOC / high voltage' }, { step: 'Check entry and exit wounds (may underestimate deep injury)' }, { step: 'IV fluids to maintain UO and prevent myoglobinuric AKI' }, { step: 'Tetanus prophylaxis' }, { step: 'CK + urine myoglobin for rhabdomyolysis' }],
    [{ name: 'Hartmann’s', dose: 'Maintain UO 1–2mL/kg/h', route: 'IV', indication: 'Rhabdomyolysis prophylaxis' }, { name: 'Sodium bicarbonate', dose: 'Per renal team', route: 'IV', indication: 'Urinary alkalinisation in rhabdomyolysis' }, { name: 'Morphine', dose: '0.1mg/kg IV', route: 'IV', indication: 'Burn pain' }],
    ['ECG + cardiac monitor 4–6h', 'CK, U&E, urine dip (myoglobin)', 'Troponin (if ECG changes)', 'CT head if LOC / trauma'],
    [{ destination: 'Burns / Plastics', reason: 'Significant burns', urgency: 'urgent' }, { destination: 'ITU / CCU', reason: 'Arrhythmia, high voltage, severe burns', urgency: 'immediate' }],
    ['ITU / CCU', 'Burns unit', 'Discharge after 4–6h normal cardiac monitoring (low voltage, no LOC, no ECG abnormality)']
  ),
};

export const EXTENDED_COMPLAINT_OPTIONS = Object.values(TRIAGE_PROTOCOLS_EXTENDED).map((p) => ({
  value: p.complaint as string,
  label: p.label,
}));

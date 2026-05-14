import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DrugStockItem, DrugDispenseRecord, DrugStockAdjustment } from '../types/drugStock';

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

interface DrugStore {
  drugs: DrugStockItem[];
  dispenseRecords: DrugDispenseRecord[];
  adjustments: DrugStockAdjustment[];

  addDrug: (drug: Omit<DrugStockItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDrug: (id: string, updates: Partial<DrugStockItem>) => void;
  deleteDrug: (id: string) => void;
  dispenseDrug: (record: Omit<DrugDispenseRecord, 'id' | 'dispensedAt'>) => void;
  adjustStock: (adjustment: Omit<DrugStockAdjustment, 'id' | 'performedAt'>) => void;
  restockDrug: (drugId: string, quantity: number, performedBy: string) => void;
}

const SAMPLE_DRUGS: DrugStockItem[] = [
  {
    id: 'drug-001', name: 'Paracetamol', genericName: 'Paracetamol (Acetaminophen)',
    brandNames: ['Panadol', 'Calpol', 'Tylenol'],
    category: 'analgesics', formulation: 'tablet', strength: '500mg', unit: 'tablet',
    routes: ['oral', 'rectal'], controlledStatus: 'uncontrolled', requiresPrescription: false,
    dosages: [
      { id: 'd1', indication: 'Pain / Fever', adultDose: '500mg–1g', paediatricDose: '10–15mg/kg', frequency: 'Every 4–6 hours', maxDailyDose: '4g/day', notes: 'Max 2g/day in hepatic impairment' }
    ],
    quantityInStock: 2400, reorderLevel: 500, reorderQuantity: 1000, unitCost: 0.05, currency: 'GBP',
    batchNumber: 'PCM-2024-01', expiryDate: '2026-12-31', manufacturer: 'GSK', supplier: 'NHS Supply Chain',
    contraindications: ['Hepatic impairment (severe)', 'Paracetamol allergy'],
    sideEffects: ['Hepatotoxicity (overdose)', 'Rash (rare)'],
    interactions: ['Warfarin (increased INR with regular use)', 'Alcohol'],
    storageConditions: 'Store below 25°C, dry place', location: 'Ward Pharmacy Shelf A1',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-002', name: 'Ibuprofen', genericName: 'Ibuprofen',
    brandNames: ['Nurofen', 'Advil', 'Brufen'],
    category: 'analgesics', formulation: 'tablet', strength: '400mg', unit: 'tablet',
    routes: ['oral'], controlledStatus: 'uncontrolled', requiresPrescription: false,
    dosages: [
      { id: 'd1', indication: 'Pain / Inflammation / Fever', adultDose: '400–600mg', paediatricDose: '5–10mg/kg', frequency: 'Every 6–8 hours with food', maxDailyDose: '2.4g/day', notes: 'Avoid in renal impairment, peptic ulcer, asthma' }
    ],
    quantityInStock: 1200, reorderLevel: 300, reorderQuantity: 600, unitCost: 0.08, currency: 'GBP',
    batchNumber: 'IBU-2024-02', expiryDate: '2026-06-30', manufacturer: 'Reckitt', supplier: 'Alliance Healthcare',
    contraindications: ['Active peptic ulcer', 'Severe renal/hepatic impairment', 'Aspirin-sensitive asthma', 'Pregnancy ≥ 30 weeks'],
    sideEffects: ['GI upset', 'GI bleeding', 'Renal impairment', 'Fluid retention'],
    interactions: ['Warfarin', 'Lithium', 'Methotrexate', 'Antihypertensives'],
    storageConditions: 'Below 25°C', location: 'Ward Pharmacy Shelf A2',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-003', name: 'Morphine Sulfate', genericName: 'Morphine Sulfate',
    brandNames: ['MST Continus', 'Oramorph', 'Zomorph'],
    category: 'analgesics', formulation: 'injection', strength: '10mg/mL', unit: 'ampoule',
    routes: ['intravenous', 'intramuscular', 'subcutaneous', 'oral'],
    controlledStatus: 'schedule_2', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Severe acute pain', adultDose: '2–10mg IV/IM/SC', paediatricDose: '0.05–0.2mg/kg IV/IM', frequency: 'Every 2–4 hours (titrate to effect)', maxDailyDose: 'Titrate to effect', renalAdjustment: 'Reduce dose in renal impairment', notes: 'Monitor respiratory rate, have naloxone available' }
    ],
    quantityInStock: 48, reorderLevel: 20, reorderQuantity: 50, unitCost: 1.85, currency: 'GBP',
    batchNumber: 'MORPH-2024-03', expiryDate: '2026-03-31', manufacturer: 'Hameln Pharma', supplier: 'AAH Pharmaceuticals',
    contraindications: ['Respiratory depression', 'Acute asthma attack', 'Head injury with raised ICP (use with caution)', 'MAOI use within 14 days'],
    sideEffects: ['Respiratory depression', 'Nausea/vomiting', 'Constipation', 'Sedation', 'Dependence'],
    interactions: ['CNS depressants', 'MAOIs', 'Benzodiazepines', 'Alcohol'],
    storageConditions: 'Controlled drug cupboard, locked, 15–25°C', location: 'CD Cupboard',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-004', name: 'Amoxicillin', genericName: 'Amoxicillin',
    brandNames: ['Amoxil', 'Trimox'],
    category: 'antibiotics', formulation: 'capsule', strength: '500mg', unit: 'capsule',
    routes: ['oral'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Respiratory tract infections, UTI, skin infections', adultDose: '250–500mg', paediatricDose: '25–45mg/kg/day divided 8-hourly', frequency: 'Three times daily', duration: '5–7 days', renalAdjustment: 'Reduce frequency if eGFR < 30' },
      { id: 'd2', indication: 'Community-acquired pneumonia', adultDose: '500mg–1g', frequency: 'Three times daily', duration: '5–7 days' }
    ],
    quantityInStock: 840, reorderLevel: 200, reorderQuantity: 500, unitCost: 0.12, currency: 'GBP',
    batchNumber: 'AMOX-2024-04', expiryDate: '2025-12-31', manufacturer: 'Actavis', supplier: 'Phoenix',
    contraindications: ['Penicillin allergy', 'Mononucleosis (causes rash)'],
    sideEffects: ['Diarrhoea', 'Nausea', 'Rash', 'Anaphylaxis (rare)'],
    interactions: ['Warfarin', 'Methotrexate', 'Oral contraceptives (theoretical)'],
    storageConditions: 'Below 25°C in a dry place', location: 'Ward Pharmacy Shelf B1',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-005', name: 'Co-Amoxiclav', genericName: 'Amoxicillin + Clavulanate',
    brandNames: ['Augmentin'],
    category: 'antibiotics', formulation: 'tablet', strength: '625mg (500/125)', unit: 'tablet',
    routes: ['oral', 'intravenous'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Skin & soft tissue, respiratory, dental infections', adultDose: '625mg orally / 1.2g IV', paediatricDose: '30mg/kg/day (amoxicillin component)', frequency: 'Three times daily', duration: '5–7 days', notes: 'Take with food to reduce GI effects' }
    ],
    quantityInStock: 420, reorderLevel: 100, reorderQuantity: 300, unitCost: 0.35, currency: 'GBP',
    batchNumber: 'COAMOX-2024-05', expiryDate: '2025-09-30', manufacturer: 'GSK', supplier: 'Alliance',
    contraindications: ['Penicillin allergy', 'Previous co-amoxiclav-associated jaundice'],
    sideEffects: ['Diarrhoea', 'Cholestatic jaundice', 'Rash'],
    interactions: ['Warfarin', 'Methotrexate'],
    storageConditions: 'Below 25°C', location: 'Ward Pharmacy Shelf B2',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-006', name: 'Metronidazole', genericName: 'Metronidazole',
    brandNames: ['Flagyl', 'Anabact'],
    category: 'antibiotics', formulation: 'tablet', strength: '400mg', unit: 'tablet',
    routes: ['oral', 'intravenous', 'rectal', 'topical'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Anaerobic infections, C. diff, Trichomonas, Giardia', adultDose: '400mg (oral) / 500mg IV', paediatricDose: '7.5mg/kg', frequency: 'Three times daily', duration: '7 days', notes: 'Avoid alcohol. Take with food.' },
      { id: 'd2', indication: 'Bacterial vaginosis', adultDose: '400mg twice daily for 5 days', frequency: 'Twice daily' }
    ],
    quantityInStock: 600, reorderLevel: 150, reorderQuantity: 400, unitCost: 0.10, currency: 'GBP',
    batchNumber: 'METRO-2024-06', expiryDate: '2026-05-31', manufacturer: 'Wockhardt', supplier: 'Phoenix',
    contraindications: ['First trimester pregnancy (use with caution)', 'Alcohol consumption (disulfiram reaction)'],
    sideEffects: ['Nausea', 'Metallic taste', 'Peripheral neuropathy (prolonged use)', 'Seizures (high doses)'],
    interactions: ['Warfarin', 'Lithium', 'Alcohol'],
    storageConditions: 'Below 25°C, protect from light', location: 'Ward Pharmacy Shelf B3',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-007', name: 'Ciprofloxacin', genericName: 'Ciprofloxacin',
    brandNames: ['Ciproxin'],
    category: 'antibiotics', formulation: 'tablet', strength: '500mg', unit: 'tablet',
    routes: ['oral', 'intravenous', 'ophthalmic'],
    controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'UTI (complicated), respiratory, GI infections', adultDose: '250–750mg oral / 200–400mg IV', paediatricDose: 'Avoid unless no alternative (tendon damage risk)', frequency: 'Twice daily', duration: '5–14 days', notes: 'Avoid antacids 2h before/after. Adequate hydration.' },
      { id: 'd2', indication: 'Acute pyelonephritis', adultDose: '500mg twice daily', frequency: 'Twice daily', duration: '7 days' }
    ],
    quantityInStock: 360, reorderLevel: 100, reorderQuantity: 250, unitCost: 0.22, currency: 'GBP',
    batchNumber: 'CIPRO-2024-07', expiryDate: '2026-08-31', manufacturer: 'Bayer', supplier: 'AAH',
    contraindications: ['Fluoroquinolone hypersensitivity', 'Concurrent NSAID use (seizure risk)'],
    sideEffects: ['Tendinopathy/tendon rupture', 'GI disturbance', 'CNS effects', 'QT prolongation'],
    interactions: ['Theophylline', 'Warfarin', 'Antacids', 'NSAIDs', 'Cyclosporin'],
    storageConditions: 'Below 30°C', location: 'Ward Pharmacy Shelf B4',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-008', name: 'Atenolol', genericName: 'Atenolol',
    brandNames: ['Tenormin'],
    category: 'cardiovascular', formulation: 'tablet', strength: '50mg', unit: 'tablet',
    routes: ['oral'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Hypertension, angina, post-MI, arrhythmias', adultDose: '25–100mg', frequency: 'Once daily', maxDailyDose: '100mg', renalAdjustment: 'Reduce dose if eGFR < 35', notes: 'Do not stop abruptly' }
    ],
    quantityInStock: 960, reorderLevel: 200, reorderQuantity: 500, unitCost: 0.07, currency: 'GBP',
    batchNumber: 'ATEN-2024-08', expiryDate: '2026-11-30', manufacturer: 'AstraZeneca', supplier: 'Phoenix',
    contraindications: ['Asthma/COPD', 'Bradycardia', 'Heart block (2nd/3rd degree)', 'Cardiogenic shock'],
    sideEffects: ['Bradycardia', 'Fatigue', 'Cold extremities', 'Bronchospasm'],
    interactions: ['Calcium channel blockers (verapamil, diltiazem)', 'Clonidine', 'NSAIDs'],
    storageConditions: 'Below 25°C', location: 'Ward Pharmacy Shelf C1',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-009', name: 'Amlodipine', genericName: 'Amlodipine Besilate',
    brandNames: ['Istin', 'Norvasc'],
    category: 'antihypertensives', formulation: 'tablet', strength: '5mg', unit: 'tablet',
    routes: ['oral'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Hypertension, chronic stable angina', adultDose: '5–10mg', frequency: 'Once daily', maxDailyDose: '10mg', hepaticAdjustment: 'Start at 2.5mg in hepatic impairment' }
    ],
    quantityInStock: 720, reorderLevel: 150, reorderQuantity: 400, unitCost: 0.09, currency: 'GBP',
    batchNumber: 'AMLO-2024-09', expiryDate: '2027-01-31', manufacturer: 'Pfizer', supplier: 'Alliance',
    contraindications: ['Cardiogenic shock', 'Unstable angina (except vasospastic)'],
    sideEffects: ['Peripheral oedema', 'Headache', 'Flushing', 'Dizziness'],
    interactions: ['CYP3A4 inhibitors (erythromycin, itraconazole)', 'Simvastatin (limit to 20mg)'],
    storageConditions: 'Below 30°C', location: 'Ward Pharmacy Shelf C2',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-010', name: 'Ramipril', genericName: 'Ramipril',
    brandNames: ['Tritace', 'Altace'],
    category: 'antihypertensives', formulation: 'capsule', strength: '5mg', unit: 'capsule',
    routes: ['oral'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Hypertension, heart failure, post-MI, nephroprotection', adultDose: '1.25–10mg', frequency: 'Once daily (or divided twice daily)', maxDailyDose: '10mg', renalAdjustment: 'Halve dose if eGFR 10–30. Avoid if eGFR < 10', notes: 'Monitor K+, creatinine, BP after initiation' }
    ],
    quantityInStock: 840, reorderLevel: 200, reorderQuantity: 500, unitCost: 0.11, currency: 'GBP',
    batchNumber: 'RAMI-2024-10', expiryDate: '2026-10-31', manufacturer: 'Sanofi', supplier: 'Phoenix',
    contraindications: ['Bilateral renal artery stenosis', 'Pregnancy', 'Hyperkalaemia', 'Angioedema (previous ACEi-related)'],
    sideEffects: ['Dry cough', 'Hyperkalaemia', 'First-dose hypotension', 'Renal impairment', 'Angioedema'],
    interactions: ['NSAIDs', 'Potassium-sparing diuretics', 'Lithium', 'Aliskiren'],
    storageConditions: 'Below 25°C', location: 'Ward Pharmacy Shelf C3',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-011', name: 'Metformin', genericName: 'Metformin Hydrochloride',
    brandNames: ['Glucophage', 'Glumetza'],
    category: 'antidiabetics', formulation: 'tablet', strength: '500mg', unit: 'tablet',
    routes: ['oral'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Type 2 Diabetes Mellitus', adultDose: '500mg–1g', frequency: 'Twice or three times daily with meals', maxDailyDose: '3g/day', renalAdjustment: 'Reduce to 500mg BD if eGFR 30–45; Contraindicated if eGFR < 30', notes: 'Hold 48h before/after IV contrast media' }
    ],
    quantityInStock: 1200, reorderLevel: 300, reorderQuantity: 600, unitCost: 0.06, currency: 'GBP',
    batchNumber: 'METF-2024-11', expiryDate: '2026-12-31', manufacturer: 'Merck', supplier: 'AAH',
    contraindications: ['eGFR < 30', 'Lactic acidosis risk', 'IV contrast (temporarily hold)'],
    sideEffects: ['GI upset (diarrhoea, nausea)', 'Vitamin B12 deficiency (long-term)', 'Lactic acidosis (rare)'],
    interactions: ['IV contrast', 'Alcohol', 'Cimetidine'],
    storageConditions: 'Below 25°C', location: 'Ward Pharmacy Shelf D1',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-012', name: 'Insulin (Human Actrapid)', genericName: 'Human Insulin (short-acting)',
    brandNames: ['Actrapid', 'Humulin S', 'Insuman Rapid'],
    category: 'antidiabetics', formulation: 'vial', strength: '100 units/mL', unit: 'vial (10mL)',
    routes: ['intravenous', 'subcutaneous', 'intramuscular'],
    controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Diabetic ketoacidosis (DKA)', adultDose: '0.1 units/kg/hour IV infusion', frequency: 'Continuous IV infusion', notes: 'Fixed rate insulin infusion per DKA protocol. Monitor glucose hourly.' },
      { id: 'd2', indication: 'Type 1 / Type 2 DM (meal-time)', adultDose: '4–10 units SC', paediatricDose: '0.1–0.2 units/kg SC', frequency: '15–30 minutes before meals', notes: 'Dose varies — individualise' }
    ],
    quantityInStock: 60, reorderLevel: 20, reorderQuantity: 40, unitCost: 7.48, currency: 'GBP',
    batchNumber: 'INS-2024-12', expiryDate: '2025-08-31', manufacturer: 'Novo Nordisk', supplier: 'NHS Supply Chain',
    contraindications: ['Hypoglycaemia'],
    sideEffects: ['Hypoglycaemia', 'Lipodystrophy at injection site', 'Hypokalaemia'],
    interactions: ['Beta-blockers (mask hypoglycaemia signs)', 'ACE inhibitors (enhanced hypoglycaemic effect)', 'Corticosteroids (raise glucose)'],
    storageConditions: 'Unopened: Fridge 2–8°C. In use: Below 25°C, use within 28 days', location: 'Medication Fridge',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-013', name: 'Salbutamol', genericName: 'Salbutamol (Albuterol)',
    brandNames: ['Ventolin', 'Salamol', 'Asmasal'],
    category: 'respiratory', formulation: 'inhaler', strength: '100mcg/actuation', unit: 'inhaler',
    routes: ['inhalation', 'nebulisation', 'intravenous'],
    controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Acute asthma / bronchospasm relief', adultDose: '2.5–5mg via nebuliser or 4–8 puffs MDI with spacer', paediatricDose: '2.5mg nebulised (< 5 years: 1.25mg)', frequency: 'Every 15–20 min in acute attack (titrate)', notes: 'Continuous nebulisation in life-threatening asthma' },
      { id: 'd2', indication: 'COPD exacerbation', adultDose: '2.5mg nebulised', frequency: 'Four times daily (or as required)' }
    ],
    quantityInStock: 180, reorderLevel: 50, reorderQuantity: 120, unitCost: 1.50, currency: 'GBP',
    batchNumber: 'SALB-2024-13', expiryDate: '2026-07-31', manufacturer: 'GSK', supplier: 'Phoenix',
    contraindications: ['Hypersensitivity to salbutamol'],
    sideEffects: ['Tachycardia', 'Tremor', 'Hypokalaemia (high doses)', 'Headache'],
    interactions: ['Beta-blockers (antagonise effect)', 'Theophylline', 'Diuretics'],
    storageConditions: 'Below 30°C, protect from frost and direct sunlight', location: 'Emergency Drug Cabinet / Respiratory Bay',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-014', name: 'Prednisolone', genericName: 'Prednisolone',
    brandNames: ['Deltacortril', 'Precortisyl Forte'],
    category: 'corticosteroids', formulation: 'tablet', strength: '5mg', unit: 'tablet',
    routes: ['oral'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Asthma exacerbation', adultDose: '40–50mg', paediatricDose: '1–2mg/kg (max 40mg)', frequency: 'Once daily', duration: '5 days' },
      { id: 'd2', indication: 'COPD exacerbation', adultDose: '30mg once daily', frequency: 'Once daily', duration: '5 days' },
      { id: 'd3', indication: 'Rheumatoid arthritis, inflammatory conditions', adultDose: '7.5–15mg', frequency: 'Once daily in the morning', notes: 'Taper dose — do not stop abruptly' }
    ],
    quantityInStock: 480, reorderLevel: 100, reorderQuantity: 300, unitCost: 0.04, currency: 'GBP',
    batchNumber: 'PRED-2024-14', expiryDate: '2026-09-30', manufacturer: 'RPH Pharmaceuticals', supplier: 'AAH',
    contraindications: ['Systemic infection without antibiotic cover', 'Live vaccines'],
    sideEffects: ['Hyperglycaemia', 'Osteoporosis (long-term)', 'Adrenal suppression', 'Weight gain', 'Peptic ulcer', 'Infection susceptibility'],
    interactions: ['NSAIDs (peptic ulcer risk)', 'Insulin/hypoglycaemics', 'Warfarin', 'Live vaccines'],
    storageConditions: 'Below 25°C', location: 'Ward Pharmacy Shelf E1',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-015', name: 'Adrenaline (Epinephrine)', genericName: 'Adrenaline (Epinephrine)',
    brandNames: ['EpiPen', 'Emerade', 'Jext'],
    category: 'emergency', formulation: 'injection', strength: '1mg/mL (1:1000)', unit: 'ampoule',
    routes: ['intramuscular', 'intravenous', 'subcutaneous'],
    controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Anaphylaxis', adultDose: '0.5mg IM (mid-outer thigh)', paediatricDose: '0.01mg/kg IM (max 0.5mg)', frequency: 'Repeat after 5 min if no improvement', notes: 'IM preferred in anaphylaxis. IV only under monitored conditions.' },
      { id: 'd2', indication: 'Cardiac arrest (pulseless VT/VF, asystole, PEA)', adultDose: '1mg IV/IO', frequency: 'Every 3–5 minutes during CPR', notes: 'After 3rd shock in shockable rhythms' },
      { id: 'd3', indication: 'Severe croup (nebulised)', adultDose: '5mL of 1:1000 nebulised', paediatricDose: '0.5mL/kg of 1:1000 (max 5mL)', frequency: 'Single dose', notes: 'Temporary effect — admit for observation' }
    ],
    quantityInStock: 80, reorderLevel: 30, reorderQuantity: 60, unitCost: 3.20, currency: 'GBP',
    batchNumber: 'ADR-2024-15', expiryDate: '2025-12-31', manufacturer: 'Meda Pharma', supplier: 'NHS Supply Chain',
    contraindications: ['No absolute contraindications in life-threatening anaphylaxis or cardiac arrest'],
    sideEffects: ['Tachycardia', 'Hypertension', 'Anxiety', 'Arrhythmias', 'Pallor'],
    interactions: ['Beta-blockers (anaphylaxis: may need glucagon)', 'MAOIs', 'Tricyclic antidepressants'],
    storageConditions: 'Below 25°C, protect from light. Check expiry monthly.', location: 'Resus Trolley / Emergency Drug Cabinet',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-016', name: 'Warfarin', genericName: 'Warfarin Sodium',
    brandNames: ['Coumadin', 'Warfarin WBM'],
    category: 'anticoagulants', formulation: 'tablet', strength: '5mg', unit: 'tablet',
    routes: ['oral'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'AF, DVT/PE, mechanical heart valves', adultDose: 'Loading: 10mg day 1–2; maintenance: 3–9mg', frequency: 'Once daily at same time', notes: 'Monitor INR 2–3 (3–4 for mechanical valves). Requires regular INR monitoring.' }
    ],
    quantityInStock: 540, reorderLevel: 100, reorderQuantity: 300, unitCost: 0.09, currency: 'GBP',
    batchNumber: 'WARF-2024-16', expiryDate: '2026-04-30', manufacturer: 'Actavis', supplier: 'Phoenix',
    contraindications: ['Active bleeding', 'Pregnancy (especially 1st/3rd trimester)', 'Severe hypertension'],
    sideEffects: ['Bleeding', 'Skin necrosis (rare)', 'Alopecia'],
    interactions: ['Extensive interactions — check BNF/clinical pharmacist', 'NSAIDs', 'Antibiotics', 'Amiodarone', 'Herbal (St John\'s Wort)'],
    storageConditions: 'Below 25°C, protect from light', location: 'Ward Pharmacy Shelf F1',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-017', name: 'Lorazepam', genericName: 'Lorazepam',
    brandNames: ['Ativan'],
    category: 'neurological', formulation: 'injection', strength: '4mg/mL', unit: 'ampoule',
    routes: ['intravenous', 'buccal', 'nasal'],
    controlledStatus: 'schedule_4', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Status epilepticus, acute seizures', adultDose: '4mg IV bolus', paediatricDose: '0.1mg/kg IV (max 4mg)', frequency: 'Repeat once after 10 minutes if seizures continue', notes: 'Monitor airway, breathing, circulation. Resuscitation equipment must be available.' },
      { id: 'd2', indication: 'Acute anxiety / sedation pre-procedure', adultDose: '1–2mg IV/IM', frequency: 'Single dose or PRN', notes: 'Titrate to effect' }
    ],
    quantityInStock: 36, reorderLevel: 15, reorderQuantity: 30, unitCost: 2.10, currency: 'GBP',
    batchNumber: 'LOR-2024-17', expiryDate: '2025-10-31', manufacturer: 'Pfizer', supplier: 'AAH',
    contraindications: ['Respiratory depression', 'Severe hepatic impairment', 'Myasthenia gravis', 'Acute narrow-angle glaucoma'],
    sideEffects: ['Respiratory depression', 'Sedation', 'Dependence (prolonged use)', 'Amnesia'],
    interactions: ['CNS depressants', 'Valproate (increases lorazepam levels)', 'Alcohol'],
    storageConditions: 'Fridge 2–8°C, protect from light', location: 'CD Cupboard / Resus Trolley',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-018', name: 'Normal Saline (0.9% NaCl)', genericName: 'Sodium Chloride 0.9%',
    brandNames: ['Normal Saline'],
    category: 'iv_fluids', formulation: 'bag', strength: '0.9% (9g/L)', unit: '500mL bag',
    routes: ['intravenous'], controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Fluid resuscitation, volume replacement, IV drug dilution', adultDose: '500mL–1L IV bolus for shock; maintenance 1–2L/day', paediatricDose: '10–20mL/kg IV bolus for shock', frequency: 'As prescribed', notes: 'Monitor fluid balance, electrolytes' }
    ],
    quantityInStock: 200, reorderLevel: 60, reorderQuantity: 100, unitCost: 0.88, currency: 'GBP',
    batchNumber: 'NS-2024-18', expiryDate: '2027-06-30', manufacturer: 'Baxter', supplier: 'NHS Supply Chain',
    contraindications: ['Hypernatraemia (relative)', 'Fluid overload (use with caution)'],
    sideEffects: ['Hyperchloraemic acidosis (large volumes)', 'Fluid overload'],
    interactions: [],
    storageConditions: 'Room temperature, below 25°C', location: 'IV Fluids Store',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-019', name: 'Oxytocin', genericName: 'Oxytocin',
    brandNames: ['Syntocinon', 'Pitocin'],
    category: 'obstetric', formulation: 'injection', strength: '10 units/mL', unit: 'ampoule',
    routes: ['intravenous', 'intramuscular'],
    controlledStatus: 'uncontrolled', requiresPrescription: true,
    dosages: [
      { id: 'd1', indication: 'Induction / augmentation of labour', adultDose: '2–8 milliunits/min IV infusion (titrate)', frequency: 'Continuous infusion (titrate per protocol)', notes: 'Monitor contractions & fetal heart rate continuously' },
      { id: 'd2', indication: 'Prevention/management of postpartum haemorrhage', adultDose: '10 units IM immediately after delivery', frequency: 'Single IM dose (or IV infusion: 10–40 units in 500mL)' }
    ],
    quantityInStock: 120, reorderLevel: 40, reorderQuantity: 80, unitCost: 2.50, currency: 'GBP',
    batchNumber: 'OXY-2024-19', expiryDate: '2025-11-30', manufacturer: 'Novartis', supplier: 'NHS Supply Chain',
    contraindications: ['Cephalopelvic disproportion', 'Malpresentation', 'Previous classical caesarean section', 'Fetal distress before labour'],
    sideEffects: ['Uterine hyperstimulation', 'Fetal distress', 'Water retention (hyponatraemia)', 'Nausea', 'Hypotension (IV bolus)'],
    interactions: ['Prostaglandins (risk of uterine hyperstimulation)', 'Regional anaesthesia'],
    storageConditions: 'Fridge 2–8°C, protect from light', location: 'Maternity Medication Fridge',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
  {
    id: 'drug-020', name: 'Naloxone', genericName: 'Naloxone Hydrochloride',
    brandNames: ['Narcan', 'Nyxoid', 'Prenoxad'],
    category: 'emergency', formulation: 'injection', strength: '400mcg/mL', unit: 'ampoule',
    routes: ['intravenous', 'intramuscular', 'subcutaneous', 'nasal'],
    controlledStatus: 'uncontrolled', requiresPrescription: false,
    dosages: [
      { id: 'd1', indication: 'Opioid overdose reversal', adultDose: '400mcg–2mg IV/IM/SC; 1.8mg intranasal', paediatricDose: '10mcg/kg IV/IM (can repeat)', frequency: 'Every 2–3 minutes until response; may repeat', notes: 'Short-acting — repeated doses or infusion may be needed. Monitor for re-narcotisation.' }
    ],
    quantityInStock: 60, reorderLevel: 20, reorderQuantity: 40, unitCost: 4.80, currency: 'GBP',
    batchNumber: 'NALOX-2024-20', expiryDate: '2025-12-31', manufacturer: 'Pfizer', supplier: 'AAH',
    contraindications: ['Naloxone hypersensitivity'],
    sideEffects: ['Acute opioid withdrawal (agitation, tachycardia, hypertension, pulmonary oedema)', 'Nausea', 'Seizures (rare)'],
    interactions: [],
    storageConditions: 'Below 25°C, protect from light', location: 'Resus Trolley / Emergency Drug Cabinet',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', isActive: true,
  },
];

export const useDrugStore = create<DrugStore>()(
  persist(
    (set, get) => ({
      drugs: SAMPLE_DRUGS,
      dispenseRecords: [],
      adjustments: [],

      addDrug: (drug) => {
        const now = new Date().toISOString();
        const newDrug: DrugStockItem = { ...drug, id: genId(), createdAt: now, updatedAt: now };
        set((s) => ({ drugs: [newDrug, ...s.drugs] }));
      },

      updateDrug: (id, updates) => {
        set((s) => ({
          drugs: s.drugs.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },

      deleteDrug: (id) => {
        set((s) => ({ drugs: s.drugs.filter((d) => d.id !== id) }));
      },

      dispenseDrug: (record) => {
        const drug = get().drugs.find((d) => d.id === record.drugId);
        if (!drug) return;
        const newRecord: DrugDispenseRecord = { ...record, id: genId(), dispensedAt: new Date().toISOString() };
        set((s) => ({
          dispenseRecords: [newRecord, ...s.dispenseRecords],
          drugs: s.drugs.map((d) =>
            d.id === record.drugId
              ? { ...d, quantityInStock: d.quantityInStock - record.quantity, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
        const adjustment: DrugStockAdjustment = {
          id: genId(),
          drugId: drug.id,
          drugName: drug.name,
          adjustmentType: 'dispense',
          quantity: -record.quantity,
          previousStock: drug.quantityInStock,
          newStock: drug.quantityInStock - record.quantity,
          reason: `Dispensed to patient ${record.patientName}`,
          performedBy: record.dispensedBy,
          performedAt: new Date().toISOString(),
        };
        set((s) => ({ adjustments: [adjustment, ...s.adjustments] }));
      },

      adjustStock: (adj) => {
        const adjustment: DrugStockAdjustment = { ...adj, id: genId(), performedAt: new Date().toISOString() };
        set((s) => ({
          adjustments: [adjustment, ...s.adjustments],
          drugs: s.drugs.map((d) =>
            d.id === adj.drugId
              ? { ...d, quantityInStock: adj.newStock, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },

      restockDrug: (drugId, quantity, performedBy) => {
        const drug = get().drugs.find((d) => d.id === drugId);
        if (!drug) return;
        const newStock = drug.quantityInStock + quantity;
        const adjustment: DrugStockAdjustment = {
          id: genId(),
          drugId: drug.id,
          drugName: drug.name,
          adjustmentType: 'restock',
          quantity,
          previousStock: drug.quantityInStock,
          newStock,
          reason: `Restocked +${quantity} units`,
          performedBy,
          performedAt: new Date().toISOString(),
        };
        set((s) => ({
          adjustments: [adjustment, ...s.adjustments],
          drugs: s.drugs.map((d) =>
            d.id === drugId
              ? { ...d, quantityInStock: newStock, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },
    }),
    { name: 'moromoke-drugstock' }
  )
);

// Light-weight medication safety checks: allergy cross-reference + known
// drug-drug / drug-class interactions. This is NOT a full clinical decision
// support engine — it covers the high-yield cases that real prescribers miss
// (penicillin family, NSAID + anticoagulant, etc.). Pair with the AI Clinical
// Assistant on the Triage page for full guidance.

import type { Patient, Medication } from '../types';

export type SafetyIssue = {
  severity: 'critical' | 'warning';
  type: 'allergy' | 'interaction' | 'duplicate' | 'pregnancy';
  title: string;
  detail: string;
};

// Equivalence classes — a substance name that matches anywhere triggers the
// whole class. Lower-case, no punctuation.
const ALLERGY_CLASSES: { name: string; aliases: string[] }[] = [
  { name: 'Penicillins', aliases: ['penicillin', 'amoxicillin', 'ampicillin', 'co-amoxiclav', 'augmentin', 'flucloxacillin', 'piperacillin', 'tazocin', 'pip-taz', 'benzylpenicillin'] },
  { name: 'Cephalosporins', aliases: ['cephalexin', 'cefalexin', 'cefuroxime', 'ceftriaxone', 'cefotaxime', 'cefazolin', 'ceftazidime', 'cefepime'] },
  { name: 'Sulphonamides', aliases: ['sulfa', 'sulpha', 'sulfamethoxazole', 'co-trimoxazole', 'trimethoprim-sulfamethoxazole', 'sulfadiazine', 'septrin'] },
  { name: 'Macrolides', aliases: ['erythromycin', 'clarithromycin', 'azithromycin'] },
  { name: 'NSAIDs', aliases: ['ibuprofen', 'naproxen', 'diclofenac', 'aspirin', 'celecoxib', 'mefenamic', 'indometacin', 'ketorolac'] },
  { name: 'Opioids', aliases: ['morphine', 'oxycodone', 'fentanyl', 'tramadol', 'codeine', 'hydromorphone'] },
  { name: 'Quinolones', aliases: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'ofloxacin'] },
  { name: 'Tetracyclines', aliases: ['tetracycline', 'doxycycline', 'minocycline'] },
  { name: 'ACE inhibitors', aliases: ['ramipril', 'lisinopril', 'enalapril', 'perindopril', 'captopril'] },
  { name: 'Statins', aliases: ['simvastatin', 'atorvastatin', 'rosuvastatin', 'pravastatin'] },
];

// Cross-reactions to consider for risk warnings (one class hint about another)
const CROSS_REACTIONS: Record<string, string[]> = {
  Penicillins: ['Cephalosporins'],
  Cephalosporins: ['Penicillins'],
};

// High-yield drug interactions. Each rule fires when BOTH drugs are present.
const INTERACTION_RULES: { a: string[]; b: string[]; severity: 'critical' | 'warning'; reason: string }[] = [
  {
    a: ['warfarin', 'apixaban', 'rivaroxaban', 'edoxaban', 'dabigatran', 'enoxaparin', 'heparin'],
    b: ['ibuprofen', 'naproxen', 'diclofenac', 'aspirin', 'mefenamic', 'ketorolac'],
    severity: 'critical',
    reason: 'Anticoagulant + NSAID — markedly increased GI bleed and intracranial bleed risk. Use paracetamol or short-course PPI cover.',
  },
  {
    a: ['warfarin'],
    b: ['clarithromycin', 'erythromycin', 'metronidazole', 'fluconazole', 'miconazole', 'amiodarone', 'cotrimoxazole', 'co-trimoxazole'],
    severity: 'warning',
    reason: 'Potentiates warfarin — INR will rise. Check INR within 3–5 days and reduce warfarin dose.',
  },
  {
    a: ['simvastatin', 'atorvastatin'],
    b: ['clarithromycin', 'erythromycin', 'itraconazole', 'ketoconazole', 'fluconazole', 'diltiazem', 'verapamil'],
    severity: 'warning',
    reason: 'Strong CYP3A4 inhibitor + statin — rhabdomyolysis risk. Stop statin or switch to pravastatin/rosuvastatin.',
  },
  {
    a: ['metformin'],
    b: ['contrast media', 'iodinated contrast'],
    severity: 'warning',
    reason: 'Hold metformin 48h around IV iodinated contrast in stage 3+ CKD (lactic acidosis risk).',
  },
  {
    a: ['ace inhibitor', 'ramipril', 'lisinopril', 'enalapril', 'perindopril', 'captopril', 'losartan', 'valsartan', 'irbesartan'],
    b: ['spironolactone', 'eplerenone', 'amiloride', 'potassium chloride'],
    severity: 'warning',
    reason: 'ACEi/ARB + potassium-sparing diuretic or K supplement — hyperkalaemia risk. Check U&E.',
  },
  {
    a: ['ssri', 'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram', 'tramadol', 'linezolid'],
    b: ['ssri', 'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram', 'tramadol', 'mirtazapine', 'st john'],
    severity: 'critical',
    reason: 'Multiple serotonergic agents — serotonin syndrome risk (hyperthermia, clonus, agitation).',
  },
  {
    a: ['amiodarone', 'sotalol', 'methadone', 'haloperidol', 'erythromycin', 'clarithromycin', 'citalopram', 'ondansetron'],
    b: ['amiodarone', 'sotalol', 'methadone', 'haloperidol', 'erythromycin', 'clarithromycin', 'citalopram', 'ondansetron'],
    severity: 'warning',
    reason: 'Multiple QT-prolonging drugs — torsades de pointes risk. ECG QTc check before continuing.',
  },
  {
    a: ['opioid', 'morphine', 'fentanyl', 'oxycodone', 'tramadol', 'codeine'],
    b: ['benzodiazepine', 'diazepam', 'lorazepam', 'midazolam', 'clonazepam', 'alprazolam', 'temazepam'],
    severity: 'warning',
    reason: 'Opioid + benzodiazepine — respiratory depression risk. Use lowest effective dose and have naloxone available.',
  },
  {
    a: ['nitrate', 'gtn', 'glyceryl trinitrate', 'isosorbide'],
    b: ['sildenafil', 'tadalafil', 'vardenafil'],
    severity: 'critical',
    reason: 'Nitrate + PDE5 inhibitor — profound hypotension. Contraindicated.',
  },
];

function normalize(s: string | undefined | null): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Does drug-name or generic-name match an allergen class?
function classForName(name: string): string | undefined {
  const n = normalize(name);
  for (const cls of ALLERGY_CLASSES) {
    if (cls.aliases.some((a) => n.includes(a))) return cls.name;
  }
  return undefined;
}

function classForAllergen(allergen: string): string | undefined {
  const n = normalize(allergen);
  for (const cls of ALLERGY_CLASSES) {
    if (cls.aliases.some((a) => n.includes(a)) || n.includes(cls.name.toLowerCase())) return cls.name;
  }
  return undefined;
}

function matchesAny(name: string, candidates: string[]): boolean {
  const n = normalize(name);
  return candidates.some((c) => n.includes(c));
}

export function checkPrescriptionSafety(
  patient: Patient | null | undefined,
  proposed: { name?: string; genericName?: string; route?: string },
  excludingMedicationId?: string,
): SafetyIssue[] {
  if (!patient) return [];
  const issues: SafetyIssue[] = [];
  const proposedName = proposed.name || proposed.genericName || '';
  if (!proposedName.trim()) return issues;

  // 1. Allergy class match
  const proposedClass = classForName(proposedName);
  for (const allergy of patient.allergies) {
    if (allergy.status === 'inactive') continue;
    const allergyClass = classForAllergen(allergy.allergen);
    if (proposedClass && allergyClass && proposedClass === allergyClass) {
      issues.push({
        severity: allergy.severity === 'life-threatening' ? 'critical' : 'warning',
        type: 'allergy',
        title: `ALLERGY MATCH — ${allergyClass}`,
        detail: `${patient.firstName} ${patient.lastName} has a documented ${allergy.severity ?? ''} allergy to "${allergy.allergen}" (reaction: ${allergy.reaction ?? 'unknown'}). The proposed ${proposedName} is in the same class.`,
      });
    } else if (proposedClass && allergyClass && CROSS_REACTIONS[proposedClass]?.includes(allergyClass)) {
      issues.push({
        severity: 'warning',
        type: 'allergy',
        title: `Possible cross-reactivity — ${allergyClass} → ${proposedClass}`,
        detail: `Patient is allergic to "${allergy.allergen}". Cross-reactivity between ${allergyClass} and ${proposedClass} is reported in ~5–10% of patients. Verify clinical history before proceeding.`,
      });
    } else if (proposedClass === undefined && normalize(proposedName).includes(normalize(allergy.allergen))) {
      issues.push({
        severity: 'critical',
        type: 'allergy',
        title: `ALLERGY MATCH — direct name`,
        detail: `Patient is allergic to "${allergy.allergen}". The proposed drug name contains this substance.`,
      });
    }
  }

  // 2. Drug-drug interactions with currently active meds
  const activeMeds: Medication[] = patient.currentMedications.filter(
    (m) => m.status === 'active' && m.id !== excludingMedicationId,
  );
  for (const rule of INTERACTION_RULES) {
    const proposedMatchesA = matchesAny(proposedName, rule.a);
    const proposedMatchesB = matchesAny(proposedName, rule.b);
    if (!proposedMatchesA && !proposedMatchesB) continue;
    for (const med of activeMeds) {
      const medName = `${med.name} ${med.genericName ?? ''}`;
      const medMatchesA = matchesAny(medName, rule.a);
      const medMatchesB = matchesAny(medName, rule.b);
      const fires = (proposedMatchesA && medMatchesB) || (proposedMatchesB && medMatchesA);
      if (!fires) continue;
      issues.push({
        severity: rule.severity,
        type: 'interaction',
        title: `${rule.severity === 'critical' ? 'CRITICAL' : 'Warning'} — ${proposedName} ⇄ ${med.name}`,
        detail: rule.reason,
      });
    }
  }

  // 3. Duplicate therapy (same drug class already active)
  if (proposedClass) {
    const sameClassMeds = activeMeds.filter((m) => classForName(`${m.name} ${m.genericName ?? ''}`) === proposedClass);
    for (const m of sameClassMeds) {
      issues.push({
        severity: 'warning',
        type: 'duplicate',
        title: `Duplicate therapy — ${proposedClass}`,
        detail: `Patient is already on ${m.name} ${m.dosage} (${proposedClass}). Confirm this is intentional or stop the existing prescription.`,
      });
    }
  }

  return issues;
}

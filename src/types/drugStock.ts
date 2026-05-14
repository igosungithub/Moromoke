export type DrugCategory =
  | 'analgesics'
  | 'antibiotics'
  | 'antivirals'
  | 'antifungals'
  | 'antiparasitics'
  | 'cardiovascular'
  | 'respiratory'
  | 'gastrointestinal'
  | 'endocrine'
  | 'neurological'
  | 'psychiatric'
  | 'anticoagulants'
  | 'antidiabetics'
  | 'antihypertensives'
  | 'antihistamines'
  | 'corticosteroids'
  | 'immunosuppressants'
  | 'oncology'
  | 'obstetric'
  | 'paediatric'
  | 'vaccines'
  | 'iv_fluids'
  | 'emergency'
  | 'anaesthetics'
  | 'vitamins_supplements'
  | 'other';

export type RouteOfAdministration =
  | 'oral'
  | 'sublingual'
  | 'buccal'
  | 'intravenous'
  | 'intramuscular'
  | 'subcutaneous'
  | 'intradermal'
  | 'inhalation'
  | 'nebulisation'
  | 'topical'
  | 'transdermal'
  | 'rectal'
  | 'vaginal'
  | 'ophthalmic'
  | 'otic'
  | 'nasal'
  | 'intrathecal'
  | 'epidural';

export type DrugFormulation =
  | 'tablet'
  | 'capsule'
  | 'liquid'
  | 'syrup'
  | 'suspension'
  | 'solution'
  | 'injection'
  | 'infusion'
  | 'powder'
  | 'granules'
  | 'cream'
  | 'ointment'
  | 'gel'
  | 'patch'
  | 'suppository'
  | 'pessary'
  | 'inhaler'
  | 'nebuliser_solution'
  | 'eye_drops'
  | 'ear_drops'
  | 'nasal_spray'
  | 'lozenge'
  | 'ampoule'
  | 'vial'
  | 'bag'
  | 'other';

export type ControlledStatus = 'uncontrolled' | 'schedule_2' | 'schedule_3' | 'schedule_4' | 'schedule_5';

export interface DrugDosage {
  id: string;
  indication: string;
  adultDose: string;
  paediatricDose?: string;
  renalAdjustment?: string;
  hepaticAdjustment?: string;
  maxDailyDose?: string;
  frequency: string;
  duration?: string;
  notes?: string;
}

export interface DrugStockItem {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  category: DrugCategory;
  formulation: DrugFormulation;
  strength: string;
  unit: string;
  routes: RouteOfAdministration[];
  dosages: DrugDosage[];

  // Stock management
  quantityInStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  currency: string;

  // Identifiers
  barcode?: string;
  batchNumber: string;
  expiryDate: string;
  manufacturer: string;
  supplier?: string;

  // Safety / regulatory
  controlledStatus: ControlledStatus;
  requiresPrescription: boolean;
  contraindications: string[];
  sideEffects: string[];
  interactions: string[];
  storageConditions: string;
  specialInstructions?: string;

  // Admin
  location: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface DrugDispenseRecord {
  id: string;
  drugId: string;
  drugName: string;
  patientId: string;
  patientName: string;
  quantity: number;
  unit: string;
  dispensedBy: string;
  dispensedAt: string;
  prescribedBy?: string;
  notes?: string;
}

export interface DrugStockAdjustment {
  id: string;
  drugId: string;
  drugName: string;
  adjustmentType: 'restock' | 'dispense' | 'expired' | 'damaged' | 'transfer' | 'audit';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  performedAt: string;
}

export type TriagePriority = 1 | 2 | 3 | 4 | 5;
export type PatientStatus = 'waiting' | 'in-triage' | 'in-treatment' | 'admitted' | 'discharged' | 'transferred';
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber: string;
  subscriberName: string;
  subscriberDOB: string;
  relationship: string;
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  status: 'active' | 'inactive';
  onsetDate?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  genericName?: string;
  dosage: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: 'active' | 'discontinued' | 'on-hold' | 'completed';
  indication: string;
  notes?: string;
  administrations?: MedicationAdministration[];
}

export interface MedicationAdministration {
  id: string;
  timestamp: string;
  administeredBy: string;
  dosageGiven: string;
  route: string;
  site?: string;
  notes?: string;
}

export interface Vitals {
  id: string;
  patientId: string;
  timestamp: string;
  recordedBy: string;
  temperature?: number;
  temperatureUnit?: 'C' | 'F';
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'in';
  painScore?: number;
  bmi?: number;
  glucoseLevel?: number;
  notes?: string;
}

export interface AttachedDocument {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;            // base64 data URL
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  orderedBy: string;
  orderedDate: string;
  collectedDate?: string;
  resultDate?: string;
  status: 'ordered' | 'collected' | 'processing' | 'resulted' | 'cancelled';
  category: string;
  testName: string;
  results?: LabResultItem[];
  notes?: string;
  priority: 'routine' | 'urgent' | 'stat';
  attachments?: AttachedDocument[];
}

export interface LabResultItem {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'H' | 'L' | 'HH' | 'LL' | 'A' | 'N';
}

export interface ImagingOrder {
  id: string;
  patientId: string;
  orderedBy: string;
  orderedDate: string;
  modality: string;
  bodyPart: string;
  laterality?: string;
  clinicalIndication: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  completedDate?: string;
  findings?: string;
  impression?: string;
  radiologist?: string;
  notes?: string;
  attachments?: AttachedDocument[];
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  encounterId: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  type: 'progress' | 'soap' | 'triage' | 'discharge' | 'consultation' | 'nursing';
  title: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content?: string;
  isSigned: boolean;
  signedAt?: string;
}

export interface TriageAssessment {
  id: string;
  patientId: string;
  encounterId: string;
  triageNurseId: string;
  triageNurseName: string;
  arrivalTime: string;
  triageTime: string;
  chiefComplaint: string;
  onset: string;
  duration: string;
  severity: number;
  esiLevel: TriagePriority;
  vitals: Omit<Vitals, 'id' | 'patientId' | 'timestamp' | 'recordedBy'>;
  symptoms: string[];
  allergiesConfirmed: boolean;
  medicationsConfirmed: boolean;
  mechanism?: string;
  notes?: string;
}

export interface Encounter {
  id: string;
  patientId: string;
  encounterType: 'emergency' | 'outpatient' | 'inpatient' | 'observation';
  status: 'active' | 'completed' | 'cancelled';
  admitDate: string;
  dischargeDate?: string;
  chiefComplaint: string;
  attendingPhysicianId: string;
  attendingPhysicianName: string;
  roomNumber?: string;
  bedNumber?: string;
  diagnosis?: Diagnosis[];
  dispositionPlan?: string;
  dischargeInstructions?: string;
  followUpInstructions?: string;
}

export interface Diagnosis {
  id: string;
  code: string;
  description: string;
  type: 'primary' | 'secondary' | 'differential';
  status: 'confirmed' | 'suspected' | 'ruled-out';
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: Gender;
  race?: string;
  ethnicity?: string;
  language?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: Address;
  bloodType: BloodType;
  maritalStatus?: string;
  occupation?: string;
  employer?: string;
  emergencyContacts: EmergencyContact[];
  insurance?: Insurance;
  primaryCareProvider?: string;
  referringProvider?: string;
  status: PatientStatus;
  registrationDate: string;
  lastVisitDate?: string;
  allergies: Allergy[];
  currentMedications: Medication[];
  encounters: Encounter[];
  vitalsHistory: Vitals[];
  labResults: LabResult[];
  imagingOrders: ImagingOrder[];
  clinicalNotes: ClinicalNote[];
  triageAssessments: TriageAssessment[];
  activeFlags?: string[];
  dnrStatus?: boolean;
  advanceDirective?: boolean;
}

export type StaffRole = 'physician' | 'nurse' | 'technician' | 'admin' | 'pharmacist' | 'radiologist' | 'pa' | 'np';

export interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  role: StaffRole;            // Primary role
  additionalRoles?: StaffRole[]; // Extra roles granted by admin (e.g., physician + admin)
  specialty?: string;
  department: string;
  licenseNumber?: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'on-leave';
  shift?: 'day' | 'evening' | 'night' | 'rotating';
  hireDate: string;
  npi?: string;
  username: string;
  passwordHash: string;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
}

export interface QueueEntry {
  patientId: string;
  encounterId: string;
  firstName: string;
  lastName: string;
  mrn: string;
  age: number;
  chiefComplaint: string;
  esiLevel: TriagePriority;
  arrivalTime: string;
  triageTime?: string;
  status: PatientStatus;
  assignedProvider?: string;
  roomNumber?: string;
  waitTime: number;
  flags?: string[];
}

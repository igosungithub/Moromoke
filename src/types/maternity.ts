export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export interface AntenatalBooking {
  id: string;
  patientId: string;
  bookingDate: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  eddByLmp: string;
  eddByUltrasound?: string;
  lmpDate: string;
  gravida: number;
  para: number;
  previousPregnancies: PreviousPregnancy[];
  bloodGroup: BloodGroup;
  rhesusStatus: 'positive' | 'negative' | 'unknown';
  rubella: 'immune' | 'non-immune' | 'unknown';
  hepatitisB: 'positive' | 'negative' | 'unknown';
  hepatitisC: 'positive' | 'negative' | 'unknown';
  hiv: 'positive' | 'negative' | 'declined' | 'unknown';
  syphilis: 'positive' | 'negative' | 'unknown';
  sickleCellStatus?: string;
  thalassaemiaStatus?: string;
  height: number;
  weightBooking: number;
  bmi: number;
  smokingStatus: 'never' | 'current' | 'ex-smoker';
  alcoholUse: 'none' | 'occasional' | 'regular';
  substanceUse?: string;
  medicalHistory: string;
  currentMedications: string;
  allergies: string;
  familyHistory: string;
  socialHistory: string;
  domesticViolenceScreening: 'screened-safe' | 'screened-concern' | 'declined';
  mentalHealthHistory?: string;
  bookingMidwife: string;
  carePathway: 'low-risk' | 'shared-care' | 'consultant-led';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreviousPregnancy {
  year: string;
  outcome: 'livebirth' | 'stillbirth' | 'miscarriage' | 'termination' | 'ectopic' | 'molar';
  gestation?: string;
  mode?: 'spontaneous' | 'induction' | 'elective-cs' | 'emergency-cs' | 'forceps' | 'ventouse';
  birthWeight?: string;
  complications?: string;
}

export interface AntenatalVisit {
  id: string;
  patientId: string;
  bookingId: string;
  visitDate: string;
  gestationalWeeks: number;
  gestationalDays: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  weight?: number;
  urinalysis?: string;
  fundalHeight?: number;
  fetalMovements?: 'normal' | 'reduced' | 'absent';
  fetalPresentation?: 'cephalic' | 'breech' | 'transverse' | 'oblique' | 'unknown';
  fetalHeartRate?: number;
  oedema?: 'none' | 'ankles' | 'generalised';
  investigations?: string;
  clinicalFindings?: string;
  plan?: string;
  nextAppointment?: string;
  seenBy: string;
}

export interface PostnatalAssessment {
  id: string;
  patientId: string;
  deliveryDate: string;
  deliveryMode: 'spontaneous-vaginal' | 'assisted-vaginal' | 'elective-cs' | 'emergency-cs';
  gestationAtDelivery: number;
  deliveredBy: string;
  assessmentDate: string;
  daysPostnatal: number;
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
  fundus: 'involuting-normally' | 'not-involuting' | 'not-palpable';
  lochia: 'normal-rubra' | 'normal-serosa' | 'normal-alba' | 'heavy' | 'offensive' | 'absent';
  perineum?: string;
  csWound?: string;
  urination: 'normal' | 'difficulty' | 'incontinence';
  bowels: 'opened' | 'not-opened' | 'constipated';
  breastfeeding: 'exclusively-breast' | 'mixed-feeding' | 'formula-only' | 'not-feeding';
  breastCondition?: string;
  emotionalWellbeing: 'well' | 'mildly-low' | 'moderately-low' | 'severely-low';
  edinburghScore?: number;
  contraceptionDiscussed: boolean;
  contraceptionChosen?: string;
  newbornDetails?: {
    name?: string;
    sex: 'male' | 'female' | 'undetermined';
    birthWeight: number;
    apgar1?: number;
    apgar5?: number;
    neonatalOutcome: 'normal' | 'nicu' | 'scbu';
  };
  thromboembolicRisk?: string;
  vteAssessment?: string;
  referrals?: string;
  plan: string;
  seenBy: string;
  notes?: string;
  createdAt: string;
}

export interface PaediatricRecord {
  id: string;
  patientId: string;
  assessmentDate: string;
  assessmentType: 'newborn' | '6-week' | '6-9-month' | '2-year' | 'school-entry' | 'routine-review' | 'sick-child';
  ageYears: number;
  ageMonths: number;
  weight: number;
  height?: number;
  headCircumference?: number;
  weightCentile?: string;
  heightCentile?: string;
  headCircumferenceCentile?: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  developmentalMilestones: DevelopmentalMilestones;
  immunisationsUpToDate: boolean;
  immunisationsDue?: string;
  immunisationsGivenToday?: string;
  presenting_complaint?: string;
  clinicalFindings: string;
  nutritionFeeding?: string;
  sleepPattern?: string;
  socialEmotional?: string;
  safeguardingConcerns: boolean;
  safeguardingNotes?: string;
  plan: string;
  referrals?: string;
  followUp?: string;
  seenBy: string;
  parentGuardianName?: string;
  relationship?: string;
  notes?: string;
  createdAt: string;
}

export interface DevelopmentalMilestones {
  grossMotor: 'age-appropriate' | 'delayed' | 'advanced' | 'not-assessed';
  fineMotor: 'age-appropriate' | 'delayed' | 'advanced' | 'not-assessed';
  speech: 'age-appropriate' | 'delayed' | 'advanced' | 'not-assessed';
  socialCognitive: 'age-appropriate' | 'delayed' | 'advanced' | 'not-assessed';
  notes?: string;
}

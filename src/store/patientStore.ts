import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Patient, Vitals, Medication, LabResult, ImagingOrder,
  ClinicalNote, TriageAssessment, Encounter, Allergy, Diagnosis
} from '../types';
import { samplePatients } from '../utils/sampleData';
import { generateId, generateMRN } from '../utils/helpers';

interface PatientStore {
  patients: Patient[];
  selectedPatientId: string | null;

  // Patient CRUD
  addPatient: (patient: Omit<Patient, 'id' | 'mrn' | 'registrationDate' | 'encounters' | 'vitalsHistory' | 'labResults' | 'imagingOrders' | 'clinicalNotes' | 'triageAssessments'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  selectPatient: (id: string | null) => void;
  getPatient: (id: string) => Patient | undefined;

  // Vitals
  addVitals: (patientId: string, vitals: Omit<Vitals, 'id' | 'patientId'>) => void;

  // Medications
  addMedication: (patientId: string, med: Omit<Medication, 'id' | 'patientId'>) => void;
  updateMedication: (patientId: string, medId: string, updates: Partial<Medication>) => void;
  deleteMedication: (patientId: string, medId: string) => void;

  // Allergies
  addAllergy: (patientId: string, allergy: Omit<Allergy, 'id'>) => void;
  updateAllergy: (patientId: string, allergyId: string, updates: Partial<Allergy>) => void;
  deleteAllergy: (patientId: string, allergyId: string) => void;

  // Lab Results
  addLabResult: (patientId: string, lab: Omit<LabResult, 'id' | 'patientId'>) => void;
  updateLabResult: (patientId: string, labId: string, updates: Partial<LabResult>) => void;

  // Imaging
  addImagingOrder: (patientId: string, order: Omit<ImagingOrder, 'id' | 'patientId'>) => void;
  updateImagingOrder: (patientId: string, orderId: string, updates: Partial<ImagingOrder>) => void;

  // Clinical Notes
  addClinicalNote: (patientId: string, note: Omit<ClinicalNote, 'id'>) => void;
  updateClinicalNote: (patientId: string, noteId: string, updates: Partial<ClinicalNote>) => void;

  // Triage
  addTriageAssessment: (patientId: string, triage: Omit<TriageAssessment, 'id'>) => void;
  updateTriageAssessment: (patientId: string, triageId: string, updates: Partial<TriageAssessment>) => void;

  // Encounters
  addEncounter: (patientId: string, encounter: Omit<Encounter, 'id' | 'patientId'>) => void;
  updateEncounter: (patientId: string, encounterId: string, updates: Partial<Encounter>) => void;
  addDiagnosis: (patientId: string, encounterId: string, diagnosis: Omit<Diagnosis, 'id'>) => void;
}

export const usePatientStore = create<PatientStore>()(
  persist(
    (set, get) => ({
      patients: samplePatients,
      selectedPatientId: null,

      addPatient: (patientData) => {
        const newPatient: Patient = {
          ...patientData,
          id: 'pat-' + generateId(),
          mrn: generateMRN(),
          registrationDate: new Date().toISOString(),
          encounters: [],
          vitalsHistory: [],
          labResults: [],
          imagingOrders: [],
          clinicalNotes: [],
          triageAssessments: [],
          status: 'waiting',
        };
        set((state) => ({ patients: [...state.patients, newPatient] }));
        return newPatient;
      },

      updatePatient: (id, updates) => {
        set((state) => ({
          patients: state.patients.map((p) => p.id === id ? { ...p, ...updates } : p),
        }));
      },

      deletePatient: (id) => {
        set((state) => ({
          patients: state.patients.filter((p) => p.id !== id),
          selectedPatientId: state.selectedPatientId === id ? null : state.selectedPatientId,
        }));
      },

      selectPatient: (id) => set({ selectedPatientId: id }),

      getPatient: (id) => get().patients.find((p) => p.id === id),

      addVitals: (patientId, vitals) => {
        const newVitals: Vitals = {
          ...vitals,
          id: 'vit-' + generateId(),
          patientId,
        };
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, vitalsHistory: [newVitals, ...p.vitalsHistory] }
              : p
          ),
        }));
      },

      addMedication: (patientId, med) => {
        const newMed: Medication = {
          ...med,
          id: 'med-' + generateId(),
          patientId,
        };
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, currentMedications: [...p.currentMedications, newMed] }
              : p
          ),
        }));
      },

      updateMedication: (patientId, medId, updates) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  currentMedications: p.currentMedications.map((m) =>
                    m.id === medId ? { ...m, ...updates } : m
                  ),
                }
              : p
          ),
        }));
      },

      deleteMedication: (patientId, medId) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, currentMedications: p.currentMedications.filter((m) => m.id !== medId) }
              : p
          ),
        }));
      },

      addAllergy: (patientId, allergy) => {
        const newAllergy: Allergy = {
          ...allergy,
          id: 'alg-' + generateId(),
        };
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, allergies: [...p.allergies, newAllergy] }
              : p
          ),
        }));
      },

      updateAllergy: (patientId, allergyId, updates) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  allergies: p.allergies.map((a) =>
                    a.id === allergyId ? { ...a, ...updates } : a
                  ),
                }
              : p
          ),
        }));
      },

      deleteAllergy: (patientId, allergyId) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, allergies: p.allergies.filter((a) => a.id !== allergyId) }
              : p
          ),
        }));
      },

      addLabResult: (patientId, lab) => {
        const newLab: LabResult = {
          ...lab,
          id: 'lab-' + generateId(),
          patientId,
        };
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, labResults: [newLab, ...p.labResults] }
              : p
          ),
        }));
      },

      updateLabResult: (patientId, labId, updates) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  labResults: p.labResults.map((l) =>
                    l.id === labId ? { ...l, ...updates } : l
                  ),
                }
              : p
          ),
        }));
      },

      addImagingOrder: (patientId, order) => {
        const newOrder: ImagingOrder = {
          ...order,
          id: 'img-' + generateId(),
          patientId,
        };
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, imagingOrders: [newOrder, ...p.imagingOrders] }
              : p
          ),
        }));
      },

      updateImagingOrder: (patientId, orderId, updates) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  imagingOrders: p.imagingOrders.map((o) =>
                    o.id === orderId ? { ...o, ...updates } : o
                  ),
                }
              : p
          ),
        }));
      },

      addClinicalNote: (patientId, note) => {
        const newNote: ClinicalNote = {
          ...note,
          id: 'note-' + generateId(),
        };
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, clinicalNotes: [newNote, ...p.clinicalNotes] }
              : p
          ),
        }));
      },

      updateClinicalNote: (patientId, noteId, updates) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  clinicalNotes: p.clinicalNotes.map((n) =>
                    n.id === noteId ? { ...n, ...updates } : n
                  ),
                }
              : p
          ),
        }));
      },

      addTriageAssessment: (patientId, triage) => {
        const newTriage: TriageAssessment = {
          ...triage,
          id: 'tri-' + generateId(),
        };
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, triageAssessments: [newTriage, ...p.triageAssessments] }
              : p
          ),
        }));
      },

      updateTriageAssessment: (patientId, triageId, updates) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  triageAssessments: p.triageAssessments.map((t) =>
                    t.id === triageId ? { ...t, ...updates } : t
                  ),
                }
              : p
          ),
        }));
      },

      addEncounter: (patientId, encounter) => {
        const newEncounter: Encounter = {
          ...encounter,
          id: 'enc-' + generateId(),
          patientId,
        };
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, encounters: [newEncounter, ...p.encounters] }
              : p
          ),
        }));
      },

      updateEncounter: (patientId, encounterId, updates) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  encounters: p.encounters.map((e) =>
                    e.id === encounterId ? { ...e, ...updates } : e
                  ),
                }
              : p
          ),
        }));
      },

      addDiagnosis: (patientId, encounterId, diagnosis) => {
        const newDiagnosis: Diagnosis = {
          ...diagnosis,
          id: 'diag-' + generateId(),
        };
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  encounters: p.encounters.map((e) =>
                    e.id === encounterId
                      ? { ...e, diagnosis: [...(e.diagnosis || []), newDiagnosis] }
                      : e
                  ),
                }
              : p
          ),
        }));
      },
    }),
    {
      name: 'moromoke-patients',
      version: 1,
    }
  )
);

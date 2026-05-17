import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Patient, Vitals, Medication, LabResult, ImagingOrder,
  ClinicalNote, TriageAssessment, Encounter, Allergy, Diagnosis
} from '../types';
import { samplePatients } from '../utils/sampleData';
import { generateId, generateMRN } from '../utils/helpers';
import { logAudit } from './auditStore';
import { useAlertsStore } from './alertsStore';
import { useStaffStore } from './staffStore';
import { ROLE_LABELS } from '../utils/permissions';

// Internal helper used by audit log calls. Looks up patient name/MRN at the
// time of the action so audit entries are self-contained.
function patientContext(patients: Patient[], patientId: string) {
  const p = patients.find((x) => x.id === patientId);
  return {
    patientId,
    patientName: p ? `${p.firstName} ${p.lastName} (${p.mrn})` : patientId,
  };
}

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
        logAudit({
          category: 'patient', action: 'create',
          description: `Registered new patient: ${newPatient.firstName} ${newPatient.lastName} (${newPatient.mrn})`,
          resourceType: 'patient', resourceId: newPatient.id,
          patientId: newPatient.id, patientName: `${newPatient.firstName} ${newPatient.lastName} (${newPatient.mrn})`,
        });
        return newPatient;
      },

      updatePatient: (id, updates) => {
        const before = get().patients.find((p) => p.id === id);
        set((state) => ({
          patients: state.patients.map((p) => p.id === id ? { ...p, ...updates } : p),
        }));
        if (before) {
          const fields = Object.keys(updates).slice(0, 8).join(', ');
          logAudit({
            category: 'patient', action: 'edit',
            description: `Updated patient ${before.firstName} ${before.lastName} (${before.mrn}) — fields: ${fields}`,
            resourceType: 'patient', resourceId: id,
            patientId: id, patientName: `${before.firstName} ${before.lastName} (${before.mrn})`,
          });
        }
      },

      deletePatient: (id) => {
        const removed = get().patients.find((p) => p.id === id);
        set((state) => ({
          patients: state.patients.filter((p) => p.id !== id),
          selectedPatientId: state.selectedPatientId === id ? null : state.selectedPatientId,
        }));
        if (removed) {
          logAudit({
            category: 'patient', action: 'delete', severity: 'critical',
            description: `Deleted patient: ${removed.firstName} ${removed.lastName} (${removed.mrn})`,
            resourceType: 'patient', resourceId: id,
            patientId: id, patientName: `${removed.firstName} ${removed.lastName} (${removed.mrn})`,
          });
        }
      },

      selectPatient: (id) => set({ selectedPatientId: id }),

      getPatient: (id) => get().patients.find((p) => p.id === id),

      addVitals: (patientId, vitals) => {
        const newVitals: Vitals = {
          ...vitals,
          id: 'vit-' + generateId(),
          patientId,
        };
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, vitalsHistory: [newVitals, ...p.vitalsHistory] }
              : p
          ),
        }));
        logAudit({
          category: 'vitals', action: 'create',
          description: `Recorded vitals for ${ctx.patientName} — BP ${vitals.bloodPressureSystolic ?? '?'}/${vitals.bloodPressureDiastolic ?? '?'}, HR ${vitals.heartRate ?? '?'}, Temp ${vitals.temperature ?? '?'}°${vitals.temperatureUnit ?? ''}`,
          resourceType: 'vitals', resourceId: newVitals.id, ...ctx,
        });
      },

      addMedication: (patientId, med) => {
        const newMed: Medication = {
          ...med,
          id: 'med-' + generateId(),
          patientId,
        };
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, currentMedications: [...p.currentMedications, newMed] }
              : p
          ),
        }));
        logAudit({
          category: 'medication', action: 'prescribe',
          description: `Prescribed ${newMed.name} ${newMed.dosage} ${newMed.frequency} (${newMed.route}) for ${ctx.patientName}`,
          resourceType: 'medication', resourceId: newMed.id, ...ctx,
        });

        // Push a bell alert visible to anyone who needs to act on a new
        // prescription: the pharmacist (to verify + dispense), other clinical
        // prescribers (peer awareness), and admin (oversight). On a shared
        // backend each of those users on other devices would see the alert
        // immediately; in browser-local mode the alert is visible to whoever
        // is currently signed in if their role matches the allow-list.
        const prescriber = useStaffStore.getState().currentUser;
        const prescriberRoleLabel = prescriber?.role ? ROLE_LABELS[prescriber.role] : 'Clinician';
        const prescriberName = prescriber ? `${prescriber.firstName} ${prescriber.lastName}` : 'Unknown clinician';
        useAlertsStore.getState().push({
          category: 'medication',
          severity: 'info',
          source: 'manual',
          title: `New prescription — ${newMed.name} ${newMed.dosage}`,
          message: `${prescriberRoleLabel} ${prescriberName} prescribed ${newMed.name} ${newMed.dosage} ${newMed.frequency} (${newMed.route}) for ${ctx.patientName}. ${newMed.indication ? 'Indication: ' + newMed.indication + '. ' : ''}Pharmacist: verify before dispensing.`,
          link: `/medications?patientId=${patientId}`,
          patientId,
          patientName: ctx.patientName,
          resourceId: newMed.id,
          // Visible to all clinical prescribers (so the prescriber sees their
          // own action confirmed in the bell history) and to pharmacists and
          // admins.
          visibleToRoles: ['physician', 'np', 'pa', 'pharmacist', 'admin'],
        });
      },

      updateMedication: (patientId, medId, updates) => {
        const before = get().patients.find((p) => p.id === patientId)?.currentMedications.find((m) => m.id === medId);
        const ctx = patientContext(get().patients, patientId);
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
        if (before) {
          logAudit({
            category: 'medication', action: 'edit',
            description: `Edited medication ${before.name} for ${ctx.patientName} — fields: ${Object.keys(updates).slice(0, 8).join(', ')}`,
            resourceType: 'medication', resourceId: medId, ...ctx,
          });
        }
      },

      deleteMedication: (patientId, medId) => {
        const before = get().patients.find((p) => p.id === patientId)?.currentMedications.find((m) => m.id === medId);
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, currentMedications: p.currentMedications.filter((m) => m.id !== medId) }
              : p
          ),
        }));
        if (before) {
          logAudit({
            category: 'medication', action: 'delete', severity: 'warning',
            description: `Removed medication ${before.name} from ${ctx.patientName}`,
            resourceType: 'medication', resourceId: medId, ...ctx,
          });
        }
      },

      addAllergy: (patientId, allergy) => {
        const newAllergy: Allergy = {
          ...allergy,
          id: 'alg-' + generateId(),
        };
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, allergies: [...p.allergies, newAllergy] }
              : p
          ),
        }));
        logAudit({
          category: 'clinical', action: 'add_allergy',
          description: `Added allergy ${newAllergy.allergen} for ${ctx.patientName}`,
          resourceType: 'allergy', resourceId: newAllergy.id, ...ctx,
          severity: newAllergy.severity === 'life-threatening' ? 'critical' : 'info',
        });
      },

      updateAllergy: (patientId, allergyId, updates) => {
        const before = get().patients.find((p) => p.id === patientId)?.allergies.find((a) => a.id === allergyId);
        const ctx = patientContext(get().patients, patientId);
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
        if (before) {
          logAudit({
            category: 'clinical', action: 'edit_allergy',
            description: `Updated allergy ${before.allergen} for ${ctx.patientName}`,
            resourceType: 'allergy', resourceId: allergyId, ...ctx,
            metadata: { fields: Object.keys(updates) },
          });
        }
      },

      deleteAllergy: (patientId, allergyId) => {
        const before = get().patients.find((p) => p.id === patientId)?.allergies.find((a) => a.id === allergyId);
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, allergies: p.allergies.filter((a) => a.id !== allergyId) }
              : p
          ),
        }));
        if (before) {
          logAudit({
            category: 'clinical', action: 'delete_allergy', severity: 'warning',
            description: `Deleted allergy ${before.allergen} for ${ctx.patientName}`,
            resourceType: 'allergy', resourceId: allergyId, ...ctx,
          });
        }
      },

      addLabResult: (patientId, lab) => {
        const newLab: LabResult = {
          ...lab,
          id: 'lab-' + generateId(),
          patientId,
        };
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, labResults: [newLab, ...p.labResults] }
              : p
          ),
        }));
        logAudit({
          category: 'lab', action: 'order',
          description: `Ordered lab ${newLab.testName} (${newLab.priority.toUpperCase()}) for ${ctx.patientName}${newLab.attachments?.length ? ` with ${newLab.attachments.length} attachment(s)` : ''}`,
          resourceType: 'lab', resourceId: newLab.id, ...ctx,
        });
      },

      updateLabResult: (patientId, labId, updates) => {
        const before = get().patients.find((p) => p.id === patientId)?.labResults.find((l) => l.id === labId);
        const ctx = patientContext(get().patients, patientId);
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
        if (before) {
          const enteredResults = updates.status === 'resulted' && before.status !== 'resulted';
          const addedAttachments = (updates.attachments?.length ?? 0) > (before.attachments?.length ?? 0);
          logAudit({
            category: 'lab', action: enteredResults ? 'enter_results' : 'edit',
            description: `${enteredResults ? 'Entered results' : 'Edited'} for lab ${before.testName}${addedAttachments ? ' (uploaded document)' : ''} — ${ctx.patientName}`,
            resourceType: 'lab', resourceId: labId, ...ctx,
          });
        }
      },

      addImagingOrder: (patientId, order) => {
        const newOrder: ImagingOrder = {
          ...order,
          id: 'img-' + generateId(),
          patientId,
        };
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, imagingOrders: [newOrder, ...p.imagingOrders] }
              : p
          ),
        }));
        logAudit({
          category: 'imaging', action: 'order',
          description: `Ordered ${newOrder.modality} ${newOrder.bodyPart} (${newOrder.priority.toUpperCase()}) for ${ctx.patientName}${newOrder.attachments?.length ? ` with ${newOrder.attachments.length} attachment(s)` : ''}`,
          resourceType: 'imaging', resourceId: newOrder.id, ...ctx,
        });
      },

      updateImagingOrder: (patientId, orderId, updates) => {
        const before = get().patients.find((p) => p.id === patientId)?.imagingOrders.find((o) => o.id === orderId);
        const ctx = patientContext(get().patients, patientId);
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
        if (before) {
          const newFindings = updates.findings && updates.findings !== before.findings;
          const addedAttachments = (updates.attachments?.length ?? 0) > (before.attachments?.length ?? 0);
          logAudit({
            category: 'imaging', action: newFindings ? 'report' : 'edit',
            description: `${newFindings ? 'Reported' : 'Edited'} ${before.modality} ${before.bodyPart}${addedAttachments ? ' (uploaded files)' : ''} — ${ctx.patientName}`,
            resourceType: 'imaging', resourceId: orderId, ...ctx,
          });
        }
      },

      addClinicalNote: (patientId, note) => {
        const newNote: ClinicalNote = {
          ...note,
          id: 'note-' + generateId(),
        };
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, clinicalNotes: [newNote, ...p.clinicalNotes] }
              : p
          ),
        }));
        logAudit({
          category: 'clinical', action: newNote.isSigned ? 'sign' : 'create',
          description: `${newNote.isSigned ? 'Signed' : 'Drafted'} ${newNote.type} note "${newNote.title}" for ${ctx.patientName}`,
          resourceType: 'note', resourceId: newNote.id, ...ctx,
        });
      },

      updateClinicalNote: (patientId, noteId, updates) => {
        const before = get().patients.find((p) => p.id === patientId)?.clinicalNotes.find((n) => n.id === noteId);
        const ctx = patientContext(get().patients, patientId);
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
        if (before) {
          const newlySigned = updates.isSigned && !before.isSigned;
          logAudit({
            category: 'clinical', action: newlySigned ? 'sign' : 'edit',
            description: `${newlySigned ? 'Signed' : 'Edited'} note "${before.title}" for ${ctx.patientName}`,
            resourceType: 'note', resourceId: noteId, ...ctx,
          });
        }
      },

      addTriageAssessment: (patientId, triage) => {
        const newTriage: TriageAssessment = {
          ...triage,
          id: 'tri-' + generateId(),
        };
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, triageAssessments: [newTriage, ...p.triageAssessments] }
              : p
          ),
        }));
        logAudit({
          category: 'triage', action: 'create',
          description: `Triage assessment ESI ${newTriage.esiLevel} — ${newTriage.chiefComplaint} — ${ctx.patientName}`,
          resourceType: 'triage', resourceId: newTriage.id, ...ctx,
          severity: newTriage.esiLevel <= 2 ? 'warning' : 'info',
        });
      },

      updateTriageAssessment: (patientId, triageId, updates) => {
        const ctx = patientContext(get().patients, patientId);
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
        logAudit({
          category: 'triage', action: 'edit',
          description: `Updated triage assessment for ${ctx.patientName}`,
          resourceType: 'triage', resourceId: triageId, ...ctx,
          metadata: { fields: Object.keys(updates) },
        });
      },

      addEncounter: (patientId, encounter) => {
        const newEncounter: Encounter = {
          ...encounter,
          id: 'enc-' + generateId(),
          patientId,
        };
        const ctx = patientContext(get().patients, patientId);
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, encounters: [newEncounter, ...p.encounters] }
              : p
          ),
        }));
        logAudit({
          category: 'clinical', action: 'create_encounter',
          description: `Created ${newEncounter.encounterType} encounter for ${ctx.patientName}`,
          resourceType: 'encounter', resourceId: newEncounter.id, ...ctx,
        });
      },

      updateEncounter: (patientId, encounterId, updates) => {
        const ctx = patientContext(get().patients, patientId);
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
        logAudit({
          category: 'clinical', action: 'edit_encounter',
          description: `Updated encounter for ${ctx.patientName}`,
          resourceType: 'encounter', resourceId: encounterId, ...ctx,
          metadata: { fields: Object.keys(updates) },
        });
      },

      addDiagnosis: (patientId, encounterId, diagnosis) => {
        const newDiagnosis: Diagnosis = {
          ...diagnosis,
          id: 'diag-' + generateId(),
        };
        const ctx = patientContext(get().patients, patientId);
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
        logAudit({
          category: 'clinical', action: 'add_diagnosis',
          description: `Added ${newDiagnosis.type} diagnosis ${newDiagnosis.code}: ${newDiagnosis.description} for ${ctx.patientName}`,
          resourceType: 'diagnosis', resourceId: newDiagnosis.id, ...ctx,
          metadata: { encounterId },
        });
      },
    }),
    {
      name: 'moromoke-patients',
      version: 1,
    }
  )
);

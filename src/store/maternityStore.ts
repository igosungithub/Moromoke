import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AntenatalBooking, AntenatalVisit, PostnatalAssessment, PaediatricRecord } from '../types/maternity';
import { logAudit } from './auditStore';

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

interface MaternityStore {
  bookings: AntenatalBooking[];
  antenatalVisits: AntenatalVisit[];
  postnatalAssessments: PostnatalAssessment[];
  paediatricRecords: PaediatricRecord[];

  addBooking: (b: Omit<AntenatalBooking, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBooking: (id: string, updates: Partial<AntenatalBooking>) => void;

  addAntenatalVisit: (v: Omit<AntenatalVisit, 'id'>) => string;
  updateAntenatalVisit: (id: string, updates: Partial<AntenatalVisit>) => void;

  addPostnatalAssessment: (a: Omit<PostnatalAssessment, 'id' | 'createdAt'>) => string;
  updatePostnatalAssessment: (id: string, updates: Partial<PostnatalAssessment>) => void;

  addPaediatricRecord: (r: Omit<PaediatricRecord, 'id' | 'createdAt'>) => string;
  updatePaediatricRecord: (id: string, updates: Partial<PaediatricRecord>) => void;
  deletePaediatricRecord: (id: string) => void;
}

export const useMaternityStore = create<MaternityStore>()(
  persist(
    (set) => ({
      bookings: [],
      antenatalVisits: [],
      postnatalAssessments: [],
      paediatricRecords: [],

      addBooking: (b) => {
        const id = genId();
        const now = new Date().toISOString();
        set((s) => ({ bookings: [{ ...b, id, createdAt: now, updatedAt: now }, ...s.bookings] }));
        logAudit({
          category: 'maternity', action: 'create_booking',
          description: `Created antenatal booking for patient ${b.patientId}`,
          resourceType: 'antenatal_booking', resourceId: id, patientId: b.patientId,
        });
        return id;
      },
      updateBooking: (id, updates) => {
        set((s) => ({
          bookings: s.bookings.map((b) => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b),
        }));
        logAudit({
          category: 'maternity', action: 'edit_booking',
          description: `Updated antenatal booking ${id}`,
          resourceType: 'antenatal_booking', resourceId: id,
          metadata: { fields: Object.keys(updates) },
        });
      },

      addAntenatalVisit: (v) => {
        const id = genId();
        set((s) => ({ antenatalVisits: [{ ...v, id }, ...s.antenatalVisits] }));
        logAudit({
          category: 'maternity', action: 'create_visit',
          description: `Recorded antenatal visit for patient ${v.patientId}`,
          resourceType: 'antenatal_visit', resourceId: id, patientId: v.patientId,
        });
        return id;
      },
      updateAntenatalVisit: (id, updates) => {
        set((s) => ({
          antenatalVisits: s.antenatalVisits.map((v) => v.id === id ? { ...v, ...updates } : v),
        }));
        logAudit({
          category: 'maternity', action: 'edit_visit',
          description: `Updated antenatal visit ${id}`,
          resourceType: 'antenatal_visit', resourceId: id,
          metadata: { fields: Object.keys(updates) },
        });
      },

      addPostnatalAssessment: (a) => {
        const id = genId();
        const now = new Date().toISOString();
        set((s) => ({ postnatalAssessments: [{ ...a, id, createdAt: now }, ...s.postnatalAssessments] }));
        logAudit({
          category: 'maternity', action: 'create_postnatal',
          description: `Recorded postnatal assessment for patient ${a.patientId}`,
          resourceType: 'postnatal_assessment', resourceId: id, patientId: a.patientId,
        });
        return id;
      },
      updatePostnatalAssessment: (id, updates) => {
        set((s) => ({
          postnatalAssessments: s.postnatalAssessments.map((a) => a.id === id ? { ...a, ...updates } : a),
        }));
        logAudit({
          category: 'maternity', action: 'edit_postnatal',
          description: `Updated postnatal assessment ${id}`,
          resourceType: 'postnatal_assessment', resourceId: id,
          metadata: { fields: Object.keys(updates) },
        });
      },

      addPaediatricRecord: (r) => {
        const id = genId();
        const now = new Date().toISOString();
        set((s) => ({ paediatricRecords: [{ ...r, id, createdAt: now }, ...s.paediatricRecords] }));
        logAudit({
          category: 'maternity', action: 'create_paediatric',
          description: `Recorded paediatric assessment for patient ${r.patientId}`,
          resourceType: 'paediatric_record', resourceId: id, patientId: r.patientId,
        });
        return id;
      },
      updatePaediatricRecord: (id, updates) => {
        set((s) => ({
          paediatricRecords: s.paediatricRecords.map((r) => r.id === id ? { ...r, ...updates } : r),
        }));
        logAudit({
          category: 'maternity', action: 'edit_paediatric',
          description: `Updated paediatric record ${id}`,
          resourceType: 'paediatric_record', resourceId: id,
          metadata: { fields: Object.keys(updates) },
        });
      },
      deletePaediatricRecord: (id) => {
        set((s) => ({ paediatricRecords: s.paediatricRecords.filter((r) => r.id !== id) }));
        logAudit({
          category: 'maternity', action: 'delete_paediatric', severity: 'warning',
          description: `Deleted paediatric record ${id}`,
          resourceType: 'paediatric_record', resourceId: id,
        });
      },
    }),
    { name: 'moromoke-maternity' }
  )
);

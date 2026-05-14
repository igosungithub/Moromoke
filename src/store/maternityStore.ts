import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AntenatalBooking, AntenatalVisit, PostnatalAssessment, PaediatricRecord } from '../types/maternity';

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
        return id;
      },
      updateBooking: (id, updates) => {
        set((s) => ({
          bookings: s.bookings.map((b) => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b),
        }));
      },

      addAntenatalVisit: (v) => {
        const id = genId();
        set((s) => ({ antenatalVisits: [{ ...v, id }, ...s.antenatalVisits] }));
        return id;
      },
      updateAntenatalVisit: (id, updates) => {
        set((s) => ({
          antenatalVisits: s.antenatalVisits.map((v) => v.id === id ? { ...v, ...updates } : v),
        }));
      },

      addPostnatalAssessment: (a) => {
        const id = genId();
        const now = new Date().toISOString();
        set((s) => ({ postnatalAssessments: [{ ...a, id, createdAt: now }, ...s.postnatalAssessments] }));
        return id;
      },
      updatePostnatalAssessment: (id, updates) => {
        set((s) => ({
          postnatalAssessments: s.postnatalAssessments.map((a) => a.id === id ? { ...a, ...updates } : a),
        }));
      },

      addPaediatricRecord: (r) => {
        const id = genId();
        const now = new Date().toISOString();
        set((s) => ({ paediatricRecords: [{ ...r, id, createdAt: now }, ...s.paediatricRecords] }));
        return id;
      },
      updatePaediatricRecord: (id, updates) => {
        set((s) => ({
          paediatricRecords: s.paediatricRecords.map((r) => r.id === id ? { ...r, ...updates } : r),
        }));
      },
      deletePaediatricRecord: (id) => {
        set((s) => ({ paediatricRecords: s.paediatricRecords.filter((r) => r.id !== id) }));
      },
    }),
    { name: 'moromoke-maternity' }
  )
);

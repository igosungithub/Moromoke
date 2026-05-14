import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Staff } from '../types';
import { sampleStaff } from '../utils/sampleData';
import { generateId } from '../utils/helpers';

interface StaffStore {
  staff: Staff[];
  currentUser: Staff | null;
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  setCurrentUser: (staff: Staff | null) => void;
}

export const useStaffStore = create<StaffStore>()(
  persist(
    (set) => ({
      staff: sampleStaff,
      currentUser: sampleStaff[2], // Default to nurse

      addStaff: (staffData) => {
        const newStaff: Staff = {
          ...staffData,
          id: 'staff-' + generateId(),
        };
        set((state) => ({ staff: [...state.staff, newStaff] }));
      },

      updateStaff: (id, updates) => {
        set((state) => ({
          staff: state.staff.map((s) => s.id === id ? { ...s, ...updates } : s),
        }));
      },

      deleteStaff: (id) => {
        set((state) => ({
          staff: state.staff.filter((s) => s.id !== id),
        }));
      },

      setCurrentUser: (staff) => set({ currentUser: staff }),
    }),
    {
      name: 'moromoke-staff',
    }
  )
);

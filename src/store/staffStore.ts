import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Staff } from '../types';
import { sampleStaff } from '../utils/sampleData';
import { generateId } from '../utils/helpers';
import { hashPassword, verifyPassword, DEFAULT_PASSWORD_HASH } from '../utils/auth';

export type LoginResult =
  | { ok: true; mustChangePassword: boolean }
  | { ok: false; reason: string };

interface StaffStore {
  staff: Staff[];
  currentUser: Staff | null;
  isAuthenticated: boolean;
  addStaff: (staff: Omit<Staff, 'id' | 'passwordHash' | 'username'> & { username?: string; passwordHash?: string }) => Staff;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  setCurrentUser: (staff: Staff | null) => void;
  // Auth
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  changePassword: (staffId: string, currentPassword: string, newPassword: string) => Promise<{ ok: boolean; reason?: string }>;
  resetPassword: (staffId: string, newPassword: string) => Promise<void>;       // admin-only
  setUsername: (staffId: string, username: string) => { ok: boolean; reason?: string };
}

export const useStaffStore = create<StaffStore>()(
  persist(
    (set, get) => ({
      staff: sampleStaff,
      currentUser: null,
      isAuthenticated: false,

      addStaff: (staffData) => {
        // Auto-generate username from first + last name if not provided
        const autoUsername = (staffData.firstName + '.' + staffData.lastName)
          .toLowerCase().replace(/[^a-z0-9._-]/g, '').replace(/\.+/g, '.').slice(0, 32);
        let username = (staffData.username || autoUsername).toLowerCase();
        // Ensure uniqueness
        const existing = get().staff.map((s) => s.username?.toLowerCase());
        let suffix = 1;
        const base = username;
        while (existing.includes(username)) { username = `${base}${suffix++}`; }
        const newStaff: Staff = {
          ...staffData,
          id: 'staff-' + generateId(),
          username,
          passwordHash: staffData.passwordHash ?? DEFAULT_PASSWORD_HASH,
          mustChangePassword: staffData.mustChangePassword ?? true,
        } as Staff;
        set((state) => ({ staff: [...state.staff, newStaff] }));
        return newStaff;
      },

      updateStaff: (id, updates) => {
        set((state) => ({
          staff: state.staff.map((s) => s.id === id ? { ...s, ...updates } : s),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
        }));
      },

      deleteStaff: (id) => {
        set((state) => ({
          staff: state.staff.filter((s) => s.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser,
          isAuthenticated: state.currentUser?.id === id ? false : state.isAuthenticated,
        }));
      },

      setCurrentUser: (staff) => set({ currentUser: staff, isAuthenticated: !!staff }),

      login: async (username, password) => {
        const u = username.trim().toLowerCase();
        const found = get().staff.find((s) => s.username?.toLowerCase() === u);
        if (!found) return { ok: false, reason: 'Invalid username or password' };
        if (found.status !== 'active') return { ok: false, reason: 'Account is inactive. Contact administrator.' };
        const ok = await verifyPassword(password, found.passwordHash);
        if (!ok) return { ok: false, reason: 'Invalid username or password' };
        const updated: Staff = { ...found, lastLoginAt: new Date().toISOString() };
        set((state) => ({
          staff: state.staff.map((s) => s.id === found.id ? updated : s),
          currentUser: updated,
          isAuthenticated: true,
        }));
        return { ok: true, mustChangePassword: !!found.mustChangePassword };
      },

      logout: () => set({ currentUser: null, isAuthenticated: false }),

      changePassword: async (staffId, currentPassword, newPassword) => {
        const s = get().staff.find((x) => x.id === staffId);
        if (!s) return { ok: false, reason: 'User not found' };
        const valid = await verifyPassword(currentPassword, s.passwordHash);
        if (!valid) return { ok: false, reason: 'Current password is incorrect' };
        if (newPassword === currentPassword) return { ok: false, reason: 'New password must be different' };
        const passwordHash = await hashPassword(newPassword);
        set((state) => ({
          staff: state.staff.map((x) => x.id === staffId ? { ...x, passwordHash, mustChangePassword: false } : x),
          currentUser: state.currentUser?.id === staffId
            ? { ...state.currentUser, passwordHash, mustChangePassword: false }
            : state.currentUser,
        }));
        return { ok: true };
      },

      resetPassword: async (staffId, newPassword) => {
        const passwordHash = await hashPassword(newPassword);
        set((state) => ({
          staff: state.staff.map((x) => x.id === staffId ? { ...x, passwordHash, mustChangePassword: true } : x),
        }));
      },

      setUsername: (staffId, username) => {
        const u = username.trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,32}$/.test(u)) {
          return { ok: false, reason: 'Username must be 3–32 chars: letters, numbers, . _ -' };
        }
        const dup = get().staff.find((s) => s.id !== staffId && s.username?.toLowerCase() === u);
        if (dup) return { ok: false, reason: 'Username already taken' };
        set((state) => ({
          staff: state.staff.map((x) => x.id === staffId ? { ...x, username: u } : x),
          currentUser: state.currentUser?.id === staffId ? { ...state.currentUser, username: u } : state.currentUser,
        }));
        return { ok: true };
      },
    }),
    {
      name: 'moromoke-staff',
    }
  )
);

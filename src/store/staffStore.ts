import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Staff, StaffRole } from '../types';
import { sampleStaff } from '../utils/sampleData';
import { generateId } from '../utils/helpers';
import { hashPassword, verifyPassword, DEFAULT_PASSWORD_HASH } from '../utils/auth';
import { logAudit } from './auditStore';
import { ROLE_LABELS } from '../utils/permissions';

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
  setAdditionalRoles: (staffId: string, roles: StaffRole[]) => void;            // admin-only
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
        logAudit({
          category: 'staff', action: 'create',
          description: `Created staff account: ${newStaff.firstName} ${newStaff.lastName} (@${newStaff.username}) — role: ${ROLE_LABELS[newStaff.role]}`,
          resourceType: 'staff', resourceId: newStaff.id,
        });
        return newStaff;
      },

      updateStaff: (id, updates) => {
        const before = get().staff.find((s) => s.id === id);
        set((state) => ({
          staff: state.staff.map((s) => s.id === id ? { ...s, ...updates } : s),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
        }));
        if (before) {
          const changedFields = Object.keys(updates).filter((k) => (updates as Record<string, unknown>)[k] !== (before as unknown as Record<string, unknown>)[k]);
          logAudit({
            category: 'staff', action: 'edit',
            description: `Updated staff: ${before.firstName} ${before.lastName} (@${before.username}) — fields: ${changedFields.join(', ') || 'none'}`,
            resourceType: 'staff', resourceId: id,
            metadata: { fields: changedFields },
          });
        }
      },

      deleteStaff: (id) => {
        const removed = get().staff.find((s) => s.id === id);
        set((state) => ({
          staff: state.staff.filter((s) => s.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser,
          isAuthenticated: state.currentUser?.id === id ? false : state.isAuthenticated,
        }));
        if (removed) {
          logAudit({
            category: 'staff', action: 'delete', severity: 'warning',
            description: `Deleted staff account: ${removed.firstName} ${removed.lastName} (@${removed.username})`,
            resourceType: 'staff', resourceId: id,
          });
        }
      },

      setCurrentUser: (staff) => {
        const previous = get().currentUser;
        if (staff && previous?.id !== staff.id) {
          logAudit({
            category: 'auth', action: 'switch_user', severity: 'warning',
            description: `Admin switched active session from ${previous ? `${previous.firstName} ${previous.lastName}` : 'no user'} to ${staff.firstName} ${staff.lastName} (@${staff.username})`,
            resourceType: 'staff', resourceId: staff.id,
          });
        }
        set({ currentUser: staff, isAuthenticated: !!staff });
      },

      login: async (username, password) => {
        const u = username.trim().toLowerCase();
        const found = get().staff.find((s) => s.username?.toLowerCase() === u);
        if (!found) {
          logAudit({
            category: 'auth', action: 'login', success: false, severity: 'warning',
            description: `Failed login attempt — unknown username "${username}"`,
            userId: null, userName: username || '(empty)', userRole: null,
          });
          return { ok: false, reason: 'Invalid username or password' };
        }
        if (found.status !== 'active') {
          logAudit({
            category: 'auth', action: 'login', success: false, severity: 'warning',
            description: `Failed login — account inactive (${found.firstName} ${found.lastName})`,
            userId: found.id, userName: `${found.firstName} ${found.lastName}`, userRole: found.role,
          });
          return { ok: false, reason: 'Account is inactive. Contact administrator.' };
        }
        const ok = await verifyPassword(password, found.passwordHash);
        if (!ok) {
          logAudit({
            category: 'auth', action: 'login', success: false, severity: 'warning',
            description: `Failed login — wrong password for ${found.firstName} ${found.lastName} (@${found.username})`,
            userId: found.id, userName: `${found.firstName} ${found.lastName}`, userRole: found.role,
          });
          return { ok: false, reason: 'Invalid username or password' };
        }
        const updated: Staff = { ...found, lastLoginAt: new Date().toISOString() };
        set((state) => ({
          staff: state.staff.map((s) => s.id === found.id ? updated : s),
          currentUser: updated,
          isAuthenticated: true,
        }));
        logAudit({
          category: 'auth', action: 'login',
          description: `Signed in: ${updated.firstName} ${updated.lastName} (@${updated.username}) — ${ROLE_LABELS[updated.role]}`,
          userId: updated.id, userName: `${updated.firstName} ${updated.lastName}`, userRole: updated.role,
        });
        return { ok: true, mustChangePassword: !!found.mustChangePassword };
      },

      logout: () => {
        const user = get().currentUser;
        if (user) {
          logAudit({
            category: 'auth', action: 'logout',
            description: `Signed out: ${user.firstName} ${user.lastName} (@${user.username})`,
          });
        }
        set({ currentUser: null, isAuthenticated: false });
      },

      changePassword: async (staffId, currentPassword, newPassword) => {
        const s = get().staff.find((x) => x.id === staffId);
        if (!s) return { ok: false, reason: 'User not found' };
        const valid = await verifyPassword(currentPassword, s.passwordHash);
        if (!valid) {
          logAudit({
            category: 'auth', action: 'change_password', success: false, severity: 'warning',
            description: `Failed password change — wrong current password for @${s.username}`,
            resourceType: 'staff', resourceId: s.id,
          });
          return { ok: false, reason: 'Current password is incorrect' };
        }
        if (newPassword === currentPassword) return { ok: false, reason: 'New password must be different' };
        const passwordHash = await hashPassword(newPassword);
        set((state) => ({
          staff: state.staff.map((x) => x.id === staffId ? { ...x, passwordHash, mustChangePassword: false } : x),
          currentUser: state.currentUser?.id === staffId
            ? { ...state.currentUser, passwordHash, mustChangePassword: false }
            : state.currentUser,
        }));
        logAudit({
          category: 'auth', action: 'change_password',
          description: `Changed own password: @${s.username}`,
          resourceType: 'staff', resourceId: s.id,
        });
        return { ok: true };
      },

      resetPassword: async (staffId, newPassword) => {
        const target = get().staff.find((x) => x.id === staffId);
        const passwordHash = await hashPassword(newPassword);
        set((state) => ({
          staff: state.staff.map((x) => x.id === staffId ? { ...x, passwordHash, mustChangePassword: true } : x),
        }));
        if (target) {
          logAudit({
            category: 'auth', action: 'reset_password', severity: 'warning',
            description: `Admin reset password for ${target.firstName} ${target.lastName} (@${target.username})`,
            resourceType: 'staff', resourceId: target.id,
          });
        }
      },

      setUsername: (staffId, username) => {
        const u = username.trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,32}$/.test(u)) {
          return { ok: false, reason: 'Username must be 3–32 chars: letters, numbers, . _ -' };
        }
        const dup = get().staff.find((s) => s.id !== staffId && s.username?.toLowerCase() === u);
        if (dup) return { ok: false, reason: 'Username already taken' };
        const before = get().staff.find((s) => s.id === staffId);
        set((state) => ({
          staff: state.staff.map((x) => x.id === staffId ? { ...x, username: u } : x),
          currentUser: state.currentUser?.id === staffId ? { ...state.currentUser, username: u } : state.currentUser,
        }));
        if (before) {
          logAudit({
            category: 'staff', action: 'set_username',
            description: `Username changed: @${before.username} → @${u} (${before.firstName} ${before.lastName})`,
            resourceType: 'staff', resourceId: staffId,
          });
        }
        return { ok: true };
      },

      setAdditionalRoles: (staffId, roles) => {
        const target = get().staff.find((s) => s.id === staffId);
        const deduped = Array.from(new Set(roles)).filter((r) => r !== target?.role);
        set((state) => ({
          staff: state.staff.map((x) => x.id === staffId ? { ...x, additionalRoles: deduped } : x),
          currentUser: state.currentUser?.id === staffId
            ? { ...state.currentUser, additionalRoles: deduped }
            : state.currentUser,
        }));
        if (target) {
          const labels = deduped.length ? deduped.map((r) => ROLE_LABELS[r]).join(', ') : '(none)';
          logAudit({
            category: 'staff', action: 'assign_roles', severity: 'warning',
            description: `Set additional roles for ${target.firstName} ${target.lastName} (@${target.username}) — ${ROLE_LABELS[target.role]} + ${labels}`,
            resourceType: 'staff', resourceId: staffId,
            metadata: { primary: target.role, additionalRoles: deduped },
          });
        }
      },
    }),
    {
      name: 'moromoke-staff',
      version: 3,
      // v1 -> v2: add username/passwordHash, ensure admin exists.
      // v2 -> v3: ensure additionalRoles is initialised (no behaviour change for existing users).
      migrate: (persistedState: unknown, fromVersion: number) => {
        const state = (persistedState ?? {}) as { staff?: Staff[] };
        if (fromVersion < 2) {
          const existing = state.staff ?? [];
          const used = new Set(
            existing.map((s) => s.username?.toLowerCase()).filter(Boolean) as string[]
          );
          const migrated = existing.map((s) => {
            if (s.username && s.passwordHash) return s;
            let base = ((s.firstName || 'user') + '.' + (s.lastName || ''))
              .toLowerCase().replace(/[^a-z0-9._-]/g, '').replace(/\.+/g, '.').slice(0, 32) || 'user';
            let candidate = base;
            let i = 1;
            while (used.has(candidate)) { candidate = `${base}${i++}`; }
            used.add(candidate);
            return {
              ...s,
              username: s.username || candidate,
              passwordHash: s.passwordHash || DEFAULT_PASSWORD_HASH,
              mustChangePassword: s.mustChangePassword ?? true,
            };
          });
          // Ensure admin account is present
          if (!migrated.find((s) => s.username?.toLowerCase() === 'admin')) {
            const seedAdmin = sampleStaff.find((s) => s.username === 'admin');
            if (seedAdmin) migrated.push(seedAdmin);
          }
          // Also ensure all seed accounts exist (idempotent — won't duplicate by id or username)
          for (const seed of sampleStaff) {
            if (!migrated.find((s) => s.id === seed.id || s.username?.toLowerCase() === seed.username.toLowerCase())) {
              migrated.push(seed);
            }
          }
          return {
            ...state,
            staff: migrated.map((s) => ({ ...s, additionalRoles: s.additionalRoles ?? [] })),
            currentUser: null,
            isAuthenticated: false,
          };
        }
        if (fromVersion < 3) {
          return {
            ...state,
            staff: (state.staff ?? []).map((s) => ({ ...s, additionalRoles: s.additionalRoles ?? [] })),
          };
        }
        return state;
      },
    }
  )
);

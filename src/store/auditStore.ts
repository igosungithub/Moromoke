import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditEvent, AuditCategory, AuditSeverity } from '../types/audit';
import type { StaffRole } from '../types';
import { generateId } from '../utils/helpers';
import { useStaffStore } from './staffStore';

const MAX_EVENTS = 5000; // ring buffer; oldest dropped beyond this

export interface AuditInput {
  category: AuditCategory;
  action: string;
  description: string;
  resourceType?: string;
  resourceId?: string;
  patientId?: string;
  patientName?: string;
  success?: boolean;
  severity?: AuditSeverity;
  // Identity overrides (used for failed-login events where no session exists)
  userId?: string | null;
  userName?: string;
  userRole?: StaffRole | null;
  metadata?: Record<string, unknown>;
}

interface AuditStore {
  events: AuditEvent[];
  log: (input: AuditInput) => void;
  clear: () => void;
  // For admin filtering UI
  getEvents: (filter?: {
    category?: AuditCategory;
    userId?: string;
    patientId?: string;
    from?: string;
    to?: string;
    search?: string;
    severity?: AuditSeverity;
  }) => AuditEvent[];
}

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      events: [],

      log: (input) => {
        const user = useStaffStore.getState().currentUser;
        const event: AuditEvent = {
          id: 'audit-' + generateId(),
          timestamp: new Date().toISOString(),
          userId: input.userId !== undefined ? input.userId : (user?.id ?? null),
          userName: input.userName ?? (user ? `${user.firstName} ${user.lastName}` : 'Unknown / system'),
          userRole: input.userRole !== undefined ? input.userRole : (user?.role ?? null),
          category: input.category,
          action: input.action,
          description: input.description,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          patientId: input.patientId,
          patientName: input.patientName,
          success: input.success ?? true,
          severity: input.severity ?? 'info',
          metadata: input.metadata,
        };
        set((state) => {
          const next = [event, ...state.events];
          if (next.length > MAX_EVENTS) next.length = MAX_EVENTS;
          return { events: next };
        });
      },

      clear: () => set({ events: [] }),

      getEvents: (filter) => {
        let result = get().events;
        if (!filter) return result;
        if (filter.category) result = result.filter((e) => e.category === filter.category);
        if (filter.userId) result = result.filter((e) => e.userId === filter.userId);
        if (filter.patientId) result = result.filter((e) => e.patientId === filter.patientId);
        if (filter.severity) result = result.filter((e) => e.severity === filter.severity);
        if (filter.from) result = result.filter((e) => e.timestamp >= filter.from!);
        if (filter.to) result = result.filter((e) => e.timestamp <= filter.to!);
        if (filter.search) {
          const q = filter.search.toLowerCase();
          result = result.filter((e) =>
            e.description.toLowerCase().includes(q) ||
            e.userName.toLowerCase().includes(q) ||
            (e.patientName?.toLowerCase().includes(q) ?? false) ||
            e.action.toLowerCase().includes(q) ||
            (e.resourceId?.toLowerCase().includes(q) ?? false),
          );
        }
        return result;
      },
    }),
    { name: 'moromoke-audit', version: 1 }
  )
);

// Convenience helper for non-React code (e.g. inside other stores)
export function logAudit(input: AuditInput) {
  useAuditStore.getState().log(input);
}

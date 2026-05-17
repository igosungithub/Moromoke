// Persistent alerts center. Lives separately from the transient toast
// notifications in uiStore.ts. Alerts are auto-computed from app state
// (low stock, expiring drugs, critical patients waiting, abnormal vitals,
// pending lab results, failed logins for admin) plus any custom alerts
// raised by app code.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePatientStore } from './patientStore';
import { useDrugStore } from './drugStore';
import { useAuditStore } from './auditStore';
import { useStaffStore } from './staffStore';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory =
  | 'patient'         // patient-level: critical waiting, abnormal vitals
  | 'medication'      // allergy conflict, drug interaction
  | 'lab'             // pending result, critical result
  | 'imaging'         // pending or critical
  | 'drugstock'       // low stock, expiring soon, expired
  | 'security'        // failed logins, suspicious activity
  | 'system';         // misc

export interface Alert {
  id: string;          // stable id derived from source so we don't duplicate
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  link?: string;       // route to navigate to when clicked
  patientId?: string;
  resourceId?: string;
  createdAt: string;
  read: boolean;
  dismissed: boolean;
  source: 'auto' | 'manual';
  // restricts visibility — undefined = visible to everyone; otherwise only
  // these roles see it (e.g. 'security' → admin only).
  visibleToRoles?: string[];
}

interface AlertsStore {
  alerts: Alert[];                                     // includes dismissed
  push: (alert: Omit<Alert, 'id' | 'createdAt' | 'read' | 'dismissed' | 'source'> & { id?: string; source?: 'auto' | 'manual' }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  // Re-compute derived alerts from current store state.
  recompute: () => void;
}

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;  // keep dismissed alerts 7 days

export const useAlertsStore = create<AlertsStore>()(
  persist(
    (set) => ({
      alerts: [],

      push: ({ id, source = 'manual', ...rest }) => {
        const stableId = id ?? `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        set((state) => {
          // dedupe by id
          if (state.alerts.some((a) => a.id === stableId)) return state;
          const next: Alert = {
            ...rest,
            id: stableId,
            createdAt: new Date().toISOString(),
            read: false,
            dismissed: false,
            source,
          };
          return { alerts: [next, ...state.alerts] };
        });
      },

      markRead: (id) => set((state) => ({
        alerts: state.alerts.map((a) => a.id === id ? { ...a, read: true } : a),
      })),

      markAllRead: () => set((state) => ({
        alerts: state.alerts.map((a) => ({ ...a, read: true })),
      })),

      dismiss: (id) => set((state) => ({
        alerts: state.alerts.map((a) => a.id === id ? { ...a, dismissed: true, read: true } : a),
      })),

      dismissAll: () => set((state) => ({
        alerts: state.alerts.map((a) => ({ ...a, dismissed: true, read: true })),
      })),

      recompute: () => {
        const now = Date.now();
        const computed: Alert[] = [];

        // ---- Patient alerts ----
        const { patients } = usePatientStore.getState();
        for (const p of patients) {
          if (['discharged', 'transferred'].includes(p.status)) continue;
          const triage = p.triageAssessments[0];
          if (!triage) continue;
          const arrival = new Date(triage.arrivalTime || p.encounters[0]?.admitDate || p.registrationDate).getTime();
          const waitMin = Math.round((now - arrival) / 60000);
          if (triage.esiLevel === 1) {
            computed.push({
              id: `auto-critical-${p.id}`,
              category: 'patient', severity: 'critical', source: 'auto', read: false, dismissed: false,
              title: `ESI 1 — ${p.firstName} ${p.lastName} (${p.mrn})`,
              message: `Resuscitation-level patient waiting ${waitMin} min. Chief complaint: ${triage.chiefComplaint}`,
              link: `/patients/${p.id}`,
              patientId: p.id,
              createdAt: triage.triageTime || new Date().toISOString(),
            });
          } else if (triage.esiLevel === 2 && waitMin >= 15) {
            computed.push({
              id: `auto-esi2-${p.id}`,
              category: 'patient', severity: 'warning', source: 'auto', read: false, dismissed: false,
              title: `ESI 2 wait time — ${p.firstName} ${p.lastName}`,
              message: `Waiting ${waitMin} min (target ≤ 15 min for emergent patients). ${triage.chiefComplaint}`,
              link: `/patients/${p.id}`,
              patientId: p.id,
              createdAt: new Date().toISOString(),
            });
          }
          // Abnormal recent vitals
          const v = p.vitalsHistory[0];
          if (v) {
            const issues: string[] = [];
            if (v.heartRate && (v.heartRate > 130 || v.heartRate < 45)) issues.push(`HR ${v.heartRate}`);
            if (v.bloodPressureSystolic && (v.bloodPressureSystolic > 180 || v.bloodPressureSystolic < 90)) issues.push(`SBP ${v.bloodPressureSystolic}`);
            if (v.oxygenSaturation && v.oxygenSaturation < 92) issues.push(`SpO2 ${v.oxygenSaturation}%`);
            if (v.temperature && v.temperatureUnit === 'C' && (v.temperature >= 39.0 || v.temperature < 35.0)) issues.push(`Temp ${v.temperature}°C`);
            if (v.respiratoryRate && (v.respiratoryRate >= 30 || v.respiratoryRate < 8)) issues.push(`RR ${v.respiratoryRate}`);
            if (issues.length > 0) {
              computed.push({
                id: `auto-vitals-${p.id}-${v.id}`,
                category: 'patient', severity: 'warning', source: 'auto', read: false, dismissed: false,
                title: `Abnormal vitals — ${p.firstName} ${p.lastName}`,
                message: issues.join(', '),
                link: `/patients/${p.id}`,
                patientId: p.id,
                createdAt: v.timestamp || new Date().toISOString(),
              });
            }
          }
          // Pending STAT/urgent labs > 4h
          for (const lab of p.labResults) {
            if (lab.status === 'resulted' || lab.status === 'cancelled') continue;
            if (lab.priority === 'routine') continue;
            const ageMin = (now - new Date(lab.orderedDate).getTime()) / 60000;
            if (ageMin >= 240) {
              computed.push({
                id: `auto-lab-${lab.id}`,
                category: 'lab', severity: lab.priority === 'stat' ? 'critical' : 'warning',
                source: 'auto', read: false, dismissed: false,
                title: `Lab pending ${Math.round(ageMin / 60)}h — ${lab.testName}`,
                message: `${lab.priority.toUpperCase()} ${lab.testName} for ${p.firstName} ${p.lastName} still ${lab.status}`,
                link: `/labs?patientId=${p.id}`,
                patientId: p.id,
                resourceId: lab.id,
                createdAt: lab.orderedDate,
              });
            }
          }
        }

        // ---- Drug stock alerts ----
        const { drugs } = useDrugStore.getState();
        for (const d of drugs) {
          if (!d.isActive) continue;
          if (d.quantityInStock === 0) {
            computed.push({
              id: `auto-stock-out-${d.id}`,
              category: 'drugstock', severity: 'critical', source: 'auto', read: false, dismissed: false,
              title: `Out of stock — ${d.name}`,
              message: `${d.name} ${d.strength} is at zero. Reorder ${d.reorderQuantity} ${d.unit}s.`,
              link: '/drug-stock',
              resourceId: d.id,
              createdAt: d.updatedAt || new Date().toISOString(),
            });
          } else if (d.quantityInStock <= d.reorderLevel) {
            computed.push({
              id: `auto-stock-low-${d.id}`,
              category: 'drugstock', severity: 'warning', source: 'auto', read: false, dismissed: false,
              title: `Low stock — ${d.name}`,
              message: `${d.quantityInStock} ${d.unit}s remaining (reorder level ${d.reorderLevel}).`,
              link: '/drug-stock',
              resourceId: d.id,
              createdAt: d.updatedAt || new Date().toISOString(),
            });
          }
          if (d.expiryDate) {
            const daysToExpiry = (new Date(d.expiryDate).getTime() - now) / 86400000;
            if (daysToExpiry < 0) {
              computed.push({
                id: `auto-expired-${d.id}`,
                category: 'drugstock', severity: 'critical', source: 'auto', read: false, dismissed: false,
                title: `EXPIRED — ${d.name}`,
                message: `${d.name} ${d.strength} expired ${Math.abs(Math.round(daysToExpiry))} days ago. Remove from stock.`,
                link: '/drug-stock',
                resourceId: d.id,
                createdAt: new Date().toISOString(),
              });
            } else if (daysToExpiry < 30) {
              computed.push({
                id: `auto-expiring-${d.id}`,
                category: 'drugstock', severity: 'warning', source: 'auto', read: false, dismissed: false,
                title: `Expiring soon — ${d.name}`,
                message: `${d.name} ${d.strength} expires in ${Math.round(daysToExpiry)} days.`,
                link: '/drug-stock',
                resourceId: d.id,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }

        // ---- Security alerts (admin only) ----
        const events = useAuditStore.getState().events;
        const sinceCutoff = now - 24 * 60 * 60 * 1000;       // last 24h
        const failedLogins = events.filter((e) =>
          e.category === 'auth' && e.action === 'login' && !e.success &&
          new Date(e.timestamp).getTime() >= sinceCutoff
        );
        // Group failed-login attempts by attempted-username so spam doesn't flood
        const groups = new Map<string, number>();
        for (const e of failedLogins) {
          const key = e.userName || '(empty)';
          groups.set(key, (groups.get(key) ?? 0) + 1);
        }
        for (const [user, count] of groups) {
          if (count >= 3) {
            computed.push({
              id: `auto-failed-login-${user}`,
              category: 'security', severity: 'warning', source: 'auto', read: false, dismissed: false,
              title: `${count} failed login attempts — ${user}`,
              message: `In the last 24 hours. Review the audit log for source and consider locking the account.`,
              link: '/audit',
              visibleToRoles: ['admin'],
              createdAt: new Date().toISOString(),
            });
          }
        }

        // ---- Merge: keep existing manual + non-auto, replace auto ----
        set((state) => {
          const manual = state.alerts.filter((a) => a.source === 'manual');
          // Preserve read/dismissed flags for re-computed auto alerts the user already acted on
          const previousAutoById = new Map(state.alerts.filter((a) => a.source === 'auto').map((a) => [a.id, a]));
          const mergedAuto = computed.map((a) => {
            const prev = previousAutoById.get(a.id);
            return prev ? { ...a, read: prev.read, dismissed: prev.dismissed, createdAt: prev.createdAt } : a;
          });
          // GC manual alerts older than retention if dismissed
          const cutoff = now - RETENTION_MS;
          const keptManual = manual.filter((a) => !a.dismissed || new Date(a.createdAt).getTime() > cutoff);
          return { alerts: [...mergedAuto, ...keptManual] };
        });
      },
    }),
    {
      name: 'moromoke-alerts',
      version: 1,
      // Only persist manual alerts and the read/dismissed state of auto alerts.
      partialize: (state) => ({
        alerts: state.alerts.filter((a) => a.source === 'manual' || a.read || a.dismissed),
      }),
    }
  )
);

// React-friendly hook that returns active alerts visible to the current user.
export function useVisibleAlerts(): Alert[] {
  const alerts = useAlertsStore((s) => s.alerts);
  const role = useStaffStore((s) => s.currentUser?.role);
  return alerts.filter((a) => {
    if (a.dismissed) return false;
    if (a.visibleToRoles && role && !a.visibleToRoles.includes(role)) return false;
    return true;
  });
}

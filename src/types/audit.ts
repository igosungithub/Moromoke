import type { StaffRole } from './index';

export type AuditCategory =
  | 'auth'           // login, logout, password change
  | 'patient'        // patient demographics changes
  | 'clinical'       // notes, diagnoses, encounters
  | 'triage'
  | 'vitals'
  | 'medication'     // prescriptions, administration
  | 'drugstock'      // inventory changes
  | 'lab'
  | 'imaging'
  | 'maternity'
  | 'staff'          // staff CRUD, role changes
  | 'settings'
  | 'document';      // attachment uploads

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEvent {
  id: string;
  timestamp: string;            // ISO
  userId: string | null;        // null for failed-login attempts
  userName: string;             // captured at time of action
  userRole: StaffRole | null;
  category: AuditCategory;
  action: string;               // verb: 'create', 'edit', 'delete', 'view', 'login', etc.
  description: string;          // human-readable, e.g. "Ordered lab: CBC for James Adeleke (MRN20240001)"
  resourceType?: string;        // e.g. 'patient', 'lab', 'medication'
  resourceId?: string;
  patientId?: string;           // when applicable, for filtering by patient
  patientName?: string;
  success: boolean;
  severity: AuditSeverity;
  metadata?: Record<string, unknown>;
}

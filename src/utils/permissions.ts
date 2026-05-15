import type { StaffRole } from '../types';

export type Permission =
  // Patient records
  | 'patient:view'
  | 'patient:create'
  | 'patient:edit'
  | 'patient:delete'
  // Clinical notes
  | 'notes:view'
  | 'notes:create'
  | 'notes:edit_own'
  | 'notes:edit_any'
  | 'notes:sign'
  // Triage
  | 'triage:view'
  | 'triage:create'
  | 'triage:edit'
  // Vitals
  | 'vitals:view'
  | 'vitals:create'
  // Medications
  | 'medications:view'
  | 'medications:prescribe'
  | 'medications:administer'
  | 'medications:edit'
  | 'medications:delete'
  | 'medications:verify'         // pharmacist verification
  // Drug stock
  | 'drugstock:view'
  | 'drugstock:create'
  | 'drugstock:edit'
  | 'drugstock:delete'
  | 'drugstock:dispense'
  // Lab results
  | 'labs:view'
  | 'labs:order'
  | 'labs:enter_results'
  | 'labs:edit'
  | 'labs:upload_document'
  // Imaging
  | 'imaging:view'
  | 'imaging:order'
  | 'imaging:report'
  | 'imaging:edit'
  | 'imaging:upload_document'
  // Staff management
  | 'staff:view'
  | 'staff:create'
  | 'staff:edit'
  | 'staff:delete'
  | 'staff:assign_roles'         // admin only — grant multiple roles
  | 'staff:reset_password'       // admin only
  // Diagnoses / encounter
  | 'diagnosis:view'
  | 'diagnosis:create'
  | 'diagnosis:edit'
  | 'encounter:view'
  | 'encounter:manage'
  | 'discharge:manage'
  // Maternity
  | 'maternity:view'
  | 'maternity:create'
  | 'maternity:edit'
  // Reports
  | 'reports:view'
  // Settings
  | 'settings:view'
  | 'settings:edit'
  // Audit log
  | 'audit:view';

type RolePermissions = Record<StaffRole, Permission[]>;

// Realistic hospital role-based access control.
// Each staff member only gets the permissions their role needs.
// Multiple roles aggregate (union of permissions).
export const ROLE_PERMISSIONS: RolePermissions = {
  // PHYSICIAN — full clinical authority, no patient deletion
  // (record retention rules forbid clinicians deleting records in real hospitals)
  physician: [
    'patient:view', 'patient:create', 'patient:edit',
    'notes:view', 'notes:create', 'notes:edit_own', 'notes:sign',
    'triage:view', 'triage:create', 'triage:edit',
    'vitals:view', 'vitals:create',
    'medications:view', 'medications:prescribe', 'medications:edit',
    'drugstock:view',
    'labs:view', 'labs:order', 'labs:edit', 'labs:upload_document',
    'imaging:view', 'imaging:order', 'imaging:edit', 'imaging:upload_document',
    'staff:view',
    'diagnosis:view', 'diagnosis:create', 'diagnosis:edit',
    'encounter:view', 'encounter:manage', 'discharge:manage',
    'maternity:view', 'maternity:create', 'maternity:edit',
    'reports:view',
    'settings:view',
  ],

  // NURSE PRACTITIONER — independent prescriptive authority
  np: [
    'patient:view', 'patient:create', 'patient:edit',
    'notes:view', 'notes:create', 'notes:edit_own', 'notes:sign',
    'triage:view', 'triage:create', 'triage:edit',
    'vitals:view', 'vitals:create',
    'medications:view', 'medications:prescribe', 'medications:administer', 'medications:edit',
    'drugstock:view',
    'labs:view', 'labs:order', 'labs:upload_document',
    'imaging:view', 'imaging:order', 'imaging:upload_document',
    'staff:view',
    'diagnosis:view', 'diagnosis:create', 'diagnosis:edit',
    'encounter:view', 'encounter:manage', 'discharge:manage',
    'maternity:view', 'maternity:create', 'maternity:edit',
    'reports:view',
    'settings:view',
  ],

  // PHYSICIAN ASSISTANT — works under supervising physician
  pa: [
    'patient:view', 'patient:create', 'patient:edit',
    'notes:view', 'notes:create', 'notes:edit_own',
    'triage:view', 'triage:create', 'triage:edit',
    'vitals:view', 'vitals:create',
    'medications:view', 'medications:prescribe', 'medications:administer', 'medications:edit',
    'drugstock:view',
    'labs:view', 'labs:order', 'labs:upload_document',
    'imaging:view', 'imaging:order', 'imaging:upload_document',
    'staff:view',
    'diagnosis:view', 'diagnosis:create',
    'encounter:view', 'encounter:manage', 'discharge:manage',
    'maternity:view', 'maternity:create', 'maternity:edit',
    'reports:view',
    'settings:view',
  ],

  // NURSE — bedside care, vitals, medication administration. CANNOT prescribe,
  // CANNOT edit doctor's notes, CANNOT delete records, CANNOT order labs/imaging.
  nurse: [
    'patient:view', 'patient:create',
    'notes:view', 'notes:create', 'notes:edit_own',
    'triage:view', 'triage:create',
    'vitals:view', 'vitals:create',
    'medications:view', 'medications:administer',
    'drugstock:view',
    'labs:view', 'labs:upload_document',
    'imaging:view',
    'staff:view',
    'diagnosis:view',
    'encounter:view',
    'maternity:view', 'maternity:create', 'maternity:edit',
    'reports:view',
    'settings:view',
  ],

  // PHARMACIST — drug stock + medication verification. Cannot edit patient
  // demographics, cannot write clinical notes, cannot order tests.
  pharmacist: [
    'patient:view',
    'notes:view',
    'medications:view', 'medications:verify',
    'drugstock:view', 'drugstock:create', 'drugstock:edit', 'drugstock:delete', 'drugstock:dispense',
    'labs:view',
    'staff:view',
    'reports:view',
    'settings:view',
  ],

  // RADIOLOGIST — reads & reports imaging studies. Does NOT order imaging
  // (the requesting clinician orders). Read-only on most clinical data.
  radiologist: [
    'patient:view',
    'notes:view',
    'labs:view',
    'imaging:view', 'imaging:report', 'imaging:edit', 'imaging:upload_document',
    'staff:view',
    'reports:view',
    'settings:view',
  ],

  // TECHNICIAN (lab / radiology tech) — records vitals, performs tests,
  // uploads results. No clinical interpretation, no prescribing.
  technician: [
    'patient:view',
    'notes:view',
    'vitals:view', 'vitals:create',
    'labs:view', 'labs:enter_results', 'labs:upload_document',
    'imaging:view', 'imaging:upload_document',
    'drugstock:view',
    'staff:view',
    'settings:view',
  ],

  // ADMINISTRATOR — full system access (operational AND clinical).
  // Per project requirement: admin has 100% access to everything so a single
  // super-user can perform any action when needed. Real hospitals usually
  // keep admin clinical-read-only — if you re-enable that separation later,
  // replace this with a curated list like the other roles.
  admin: [
    'patient:view', 'patient:create', 'patient:edit', 'patient:delete',
    'notes:view', 'notes:create', 'notes:edit_own', 'notes:edit_any', 'notes:sign',
    'triage:view', 'triage:create', 'triage:edit',
    'vitals:view', 'vitals:create',
    'medications:view', 'medications:prescribe', 'medications:administer',
    'medications:edit', 'medications:delete', 'medications:verify',
    'drugstock:view', 'drugstock:create', 'drugstock:edit', 'drugstock:delete', 'drugstock:dispense',
    'labs:view', 'labs:order', 'labs:enter_results', 'labs:edit', 'labs:upload_document',
    'imaging:view', 'imaging:order', 'imaging:report', 'imaging:edit', 'imaging:upload_document',
    'staff:view', 'staff:create', 'staff:edit', 'staff:delete',
    'staff:assign_roles', 'staff:reset_password',
    'diagnosis:view', 'diagnosis:create', 'diagnosis:edit',
    'encounter:view', 'encounter:manage', 'discharge:manage',
    'maternity:view', 'maternity:create', 'maternity:edit',
    'reports:view',
    'settings:view', 'settings:edit',
    'audit:view',
  ],
};

// Compute the effective role list for a user (primary + additional roles).
export function getStaffRoles(staff: { role: StaffRole; additionalRoles?: StaffRole[] } | null | undefined): StaffRole[] {
  if (!staff) return [];
  const set = new Set<StaffRole>([staff.role]);
  for (const r of staff.additionalRoles ?? []) set.add(r);
  return Array.from(set);
}

// Compute the union of permissions across multiple roles.
export function getEffectivePermissions(roles: StaffRole[]): Permission[] {
  const set = new Set<Permission>();
  for (const r of roles) {
    for (const p of ROLE_PERMISSIONS[r] ?? []) set.add(p);
  }
  return Array.from(set);
}

export function hasPermission(staff: { role?: StaffRole; additionalRoles?: StaffRole[] } | null | undefined, permission: Permission): boolean {
  if (!staff?.role) return false;
  const roles = getStaffRoles(staff as { role: StaffRole; additionalRoles?: StaffRole[] });
  for (const r of roles) {
    if ((ROLE_PERMISSIONS[r] ?? []).includes(permission)) return true;
  }
  return false;
}

export function hasAnyPermission(staff: { role?: StaffRole; additionalRoles?: StaffRole[] } | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(staff, p));
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  physician: 'Physician',
  nurse: 'Nurse',
  np: 'Nurse Practitioner',
  pa: 'Physician Assistant',
  pharmacist: 'Pharmacist',
  radiologist: 'Radiologist',
  technician: 'Lab/Radiology Technician',
  admin: 'Administrator',
};

export const ROLE_ACCESS_DESCRIPTIONS: Record<StaffRole, string> = {
  physician: 'Full clinical authority — prescribe, diagnose, write & sign notes, order labs/imaging, manage encounters.',
  nurse: 'Bedside care — record vitals, triage, nursing notes, administer medications. Cannot prescribe, cannot edit physician notes, cannot order labs/imaging.',
  np: 'Independent advanced practice — full prescriptive authority, diagnose, manage discharge. Cannot edit other clinicians\' notes.',
  pa: 'Advanced practice under supervising physician — prescribe, order labs/imaging, manage encounters.',
  pharmacist: 'Pharmacy access — drug stock management, dispensing, medication verification. View-only on clinical records.',
  radiologist: 'Reads and reports imaging studies. View-only on other clinical records. Does NOT order imaging.',
  technician: 'Records vitals, enters lab results, uploads imaging files. No clinical interpretation or prescribing.',
  admin: 'Full system access — every permission in the system. Can perform any clinical, operational, or administrative action.',
};

import type { Staff } from '../types';

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
  // Imaging
  | 'imaging:view'
  | 'imaging:order'
  | 'imaging:report'
  | 'imaging:edit'
  // Staff management
  | 'staff:view'
  | 'staff:create'
  | 'staff:edit'
  | 'staff:delete'
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
  | 'settings:edit';

type RolePermissions = Record<NonNullable<Staff['role']>, Permission[]>;

export const ROLE_PERMISSIONS: RolePermissions = {
  physician: [
    'patient:view', 'patient:create', 'patient:edit', 'patient:delete',
    'notes:view', 'notes:create', 'notes:edit_own', 'notes:edit_any', 'notes:sign',
    'triage:view', 'triage:create', 'triage:edit',
    'vitals:view', 'vitals:create',
    'medications:view', 'medications:prescribe', 'medications:administer', 'medications:edit', 'medications:delete',
    'drugstock:view', 'drugstock:dispense',
    'labs:view', 'labs:order', 'labs:enter_results', 'labs:edit',
    'imaging:view', 'imaging:order', 'imaging:report', 'imaging:edit',
    'staff:view',
    'diagnosis:view', 'diagnosis:create', 'diagnosis:edit',
    'encounter:view', 'encounter:manage', 'discharge:manage',
    'maternity:view', 'maternity:create', 'maternity:edit',
    'reports:view',
    'settings:view',
  ],

  np: [
    'patient:view', 'patient:create', 'patient:edit',
    'notes:view', 'notes:create', 'notes:edit_own', 'notes:sign',
    'triage:view', 'triage:create', 'triage:edit',
    'vitals:view', 'vitals:create',
    'medications:view', 'medications:prescribe', 'medications:administer', 'medications:edit',
    'drugstock:view', 'drugstock:dispense',
    'labs:view', 'labs:order', 'labs:enter_results',
    'imaging:view', 'imaging:order',
    'staff:view',
    'diagnosis:view', 'diagnosis:create', 'diagnosis:edit',
    'encounter:view', 'encounter:manage', 'discharge:manage',
    'maternity:view', 'maternity:create', 'maternity:edit',
    'reports:view',
    'settings:view',
  ],

  pa: [
    'patient:view', 'patient:create', 'patient:edit',
    'notes:view', 'notes:create', 'notes:edit_own', 'notes:sign',
    'triage:view', 'triage:create', 'triage:edit',
    'vitals:view', 'vitals:create',
    'medications:view', 'medications:prescribe', 'medications:administer', 'medications:edit',
    'drugstock:view', 'drugstock:dispense',
    'labs:view', 'labs:order', 'labs:enter_results',
    'imaging:view', 'imaging:order',
    'staff:view',
    'diagnosis:view', 'diagnosis:create',
    'encounter:view', 'encounter:manage', 'discharge:manage',
    'maternity:view', 'maternity:create', 'maternity:edit',
    'reports:view',
    'settings:view',
  ],

  nurse: [
    'patient:view', 'patient:create',
    'notes:view', 'notes:create', 'notes:edit_own',
    'triage:view', 'triage:create',
    'vitals:view', 'vitals:create',
    'medications:view', 'medications:administer',
    'drugstock:view',
    'labs:view',
    'imaging:view',
    'staff:view',
    'diagnosis:view',
    'encounter:view',
    'maternity:view', 'maternity:create', 'maternity:edit',
    'reports:view',
    'settings:view',
  ],

  pharmacist: [
    'patient:view',
    'notes:view',
    'medications:view', 'medications:administer',
    'drugstock:view', 'drugstock:create', 'drugstock:edit', 'drugstock:delete', 'drugstock:dispense',
    'labs:view',
    'staff:view',
    'reports:view',
    'settings:view',
  ],

  radiologist: [
    'patient:view',
    'notes:view',
    'labs:view',
    'imaging:view', 'imaging:order', 'imaging:report', 'imaging:edit',
    'staff:view',
    'reports:view',
    'settings:view',
  ],

  technician: [
    'patient:view',
    'notes:view',
    'vitals:view', 'vitals:create',
    'labs:view', 'labs:enter_results',
    'imaging:view',
    'staff:view',
    'settings:view',
  ],

  admin: [
    'patient:view', 'patient:create', 'patient:edit',
    'notes:view',
    'triage:view',
    'vitals:view',
    'medications:view',
    'drugstock:view', 'drugstock:create', 'drugstock:edit',
    'labs:view',
    'imaging:view',
    'staff:view', 'staff:create', 'staff:edit', 'staff:delete',
    'diagnosis:view',
    'encounter:view',
    'maternity:view',
    'reports:view',
    'settings:view', 'settings:edit',
  ],
};

export function hasPermission(role: Staff['role'] | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes(permission);
}

export function hasAnyPermission(role: Staff['role'] | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export const ROLE_LABELS: Record<NonNullable<Staff['role']>, string> = {
  physician: 'Physician',
  nurse: 'Nurse',
  np: 'Nurse Practitioner',
  pa: 'Physician Assistant',
  pharmacist: 'Pharmacist',
  radiologist: 'Radiologist',
  technician: 'Technician',
  admin: 'Administrator',
};

export const ROLE_ACCESS_DESCRIPTIONS: Record<NonNullable<Staff['role']>, string> = {
  physician: 'Full clinical access — can view, create, edit, and delete all records',
  nurse: 'Clinical support — can record vitals, triage, nursing notes, administer medications. Cannot prescribe or edit physician notes.',
  np: 'Advanced practice — can prescribe, write notes, order labs/imaging. Cannot edit other clinicians\' notes.',
  pa: 'Advanced practice — similar to NP. Can prescribe and manage encounters.',
  pharmacist: 'Pharmacy access — full drug stock management. View-only for patient records.',
  radiologist: 'Radiology access — can report imaging. View-only for other clinical records.',
  technician: 'Technical access — can record vitals, enter lab results. No clinical editing.',
  admin: 'Administrative access — patient registration, staff management. No clinical editing.',
};

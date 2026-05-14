import { useStaffStore } from '../store/staffStore';
import { hasPermission, hasAnyPermission, type Permission } from '../utils/permissions';

export function usePermissions() {
  const currentUser = useStaffStore((s) => s.currentUser);
  const role = currentUser?.role;

  return {
    can: (permission: Permission) => hasPermission(role, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    role,
    currentUser,
  };
}

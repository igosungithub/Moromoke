import { useStaffStore } from '../store/staffStore';
import { hasPermission, hasAnyPermission, getStaffRoles, type Permission } from '../utils/permissions';

export function usePermissions() {
  const currentUser = useStaffStore((s) => s.currentUser);
  const roles = getStaffRoles(currentUser);

  return {
    can: (permission: Permission) => hasPermission(currentUser, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(currentUser, permissions),
    role: currentUser?.role,
    roles,
    currentUser,
  };
}

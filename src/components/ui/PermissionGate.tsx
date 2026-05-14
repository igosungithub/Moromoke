import type { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../utils/permissions';

interface Props {
  permission?: Permission;
  anyOf?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ permission, anyOf, fallback = null, children }: Props) {
  const { can, canAny } = usePermissions();

  const allowed = permission ? can(permission) : anyOf ? canAny(anyOf) : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
}

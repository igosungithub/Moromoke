import { ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { logAudit } from '../../store/auditStore';
import type { Permission } from '../../utils/permissions';
import type { ReactNode } from 'react';

interface Props {
  permission?: Permission;
  anyOf?: Permission[];
  children: ReactNode;
}

export default function RequirePermission({ permission, anyOf, children }: Props) {
  const { can, canAny } = usePermissions();
  const allowed = permission ? can(permission) : anyOf ? canAny(anyOf) : true;
  const required = permission ?? anyOf?.join(' or ') ?? 'none';

  useEffect(() => {
    if (!allowed) {
      logAudit({
        category: 'settings',
        action: 'access_denied',
        success: false,
        severity: 'warning',
        description: `Denied access to protected section requiring ${required}`,
        metadata: { permission, anyOf },
      });
    }
  }, [allowed, required, permission, anyOf]);

  if (!allowed) {
    return (
      <div className="card text-center py-12">
        <ShieldAlert size={48} className="mx-auto text-gray-300 mb-3" />
        <h2 className="font-semibold text-gray-700">Access Denied</h2>
        <p className="text-sm text-gray-500 mt-1">Your current role does not allow access to this section.</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function PermissionRedirect({ permission, anyOf, children, to = '/' }: Props & { to?: string }) {
  const { can, canAny } = usePermissions();
  const allowed = permission ? can(permission) : anyOf ? canAny(anyOf) : true;
  return allowed ? <>{children}</> : <Navigate to={to} replace />;
}

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, Activity,
  Pill, FlaskConical, Scan, UserCog, BarChart3,
  Settings, Menu, X, Stethoscope, ChevronRight, Package, Baby, LogOut, ShieldCheck, HelpCircle, Bell
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useStaffStore } from '../../store/staffStore';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_LABELS } from '../../utils/permissions';

import type { Permission } from '../../utils/permissions';

const navItems: { to: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; exact?: boolean; permission?: Permission }[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/queue', icon: ClipboardList, label: 'Patient Queue' },
  { to: '/patients', icon: Users, label: 'Patients', permission: 'patient:view' },
  { to: '/triage', icon: Activity, label: 'Triage', permission: 'triage:view' },
  { to: '/vitals', icon: Stethoscope, label: 'Vitals', permission: 'vitals:view' },
  { to: '/medications', icon: Pill, label: 'Medications', permission: 'medications:view' },
  { to: '/drug-stock', icon: Package, label: 'Drug Stock', permission: 'drugstock:view' },
  { to: '/labs', icon: FlaskConical, label: 'Lab Results', permission: 'labs:view' },
  { to: '/imaging', icon: Scan, label: 'Imaging', permission: 'imaging:view' },
  { to: '/maternity', icon: Baby, label: 'Maternity & Paeds', permission: 'maternity:view' },
  { to: '/staff', icon: UserCog, label: 'Staff', permission: 'staff:view' },
  { to: '/reports', icon: BarChart3, label: 'Reports', permission: 'reports:view' },
  { to: '/audit', icon: ShieldCheck, label: 'Audit Log', permission: 'audit:view' },
  { to: '/alerts', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings', permission: 'settings:view' },
  { to: '/help', icon: HelpCircle, label: 'Help' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser, logout } = useStaffStore();
  const { can, roles } = usePermissions();
  const visibleNav = navItems.filter((item) => !item.permission || can(item.permission));

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } flex-shrink-0 bg-slate-900 text-white flex flex-col transition-all duration-300 min-h-screen`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Moromoke</h1>
              <p className="text-slate-400 text-xs">EMR System</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded"
        >
          {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {visibleNav.map(({ to, icon: Icon, label, exact }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile + Logout */}
      {currentUser && (
        <div className="p-3 border-t border-slate-700 space-y-2">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate" title={roles.map((r) => ROLE_LABELS[r]).join(', ')}>
                  {roles.map((r) => ROLE_LABELS[r]).join(' + ')}
                </p>
                {currentUser.username && (
                  <p className="text-[10px] text-slate-500 font-mono truncate">@{currentUser.username}</p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white transition-colors ${sidebarCollapsed ? 'px-2' : ''}`}
          >
            <LogOut size={14} />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

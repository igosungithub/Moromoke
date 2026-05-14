import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, Activity,
  Pill, FlaskConical, Scan, UserCog, BarChart3,
  Settings, Menu, X, Stethoscope, ChevronRight, Package, Baby
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useStaffStore } from '../../store/staffStore';
import { ROLE_LABELS } from '../../utils/permissions';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/queue', icon: ClipboardList, label: 'Patient Queue' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/triage', icon: Activity, label: 'Triage' },
  { to: '/vitals', icon: Stethoscope, label: 'Vitals' },
  { to: '/medications', icon: Pill, label: 'Medications' },
  { to: '/drug-stock', icon: Package, label: 'Drug Stock' },
  { to: '/labs', icon: FlaskConical, label: 'Lab Results' },
  { to: '/imaging', icon: Scan, label: 'Imaging' },
  { to: '/maternity', icon: Baby, label: 'Maternity & Paeds' },
  { to: '/staff', icon: UserCog, label: 'Staff' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser, staff, setCurrentUser } = useStaffStore();

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
          {navItems.map(({ to, icon: Icon, label, exact }) => (
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

      {/* User Profile + Role Switcher */}
      {currentUser && (
        <div className="p-3 border-t border-slate-700 space-y-2">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-xs text-slate-400">{currentUser.role ? ROLE_LABELS[currentUser.role] : ''}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Switch User (RBAC test)</p>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const s = staff.find((st) => st.id === e.target.value);
                  if (s) setCurrentUser(s);
                }}
                className="w-full bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.role ? ROLE_LABELS[s.role] : s.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

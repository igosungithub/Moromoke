import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, X, AlertTriangle, AlertCircle, Info, CheckCheck,
  User, Pill, Package, FlaskConical, Scan, ShieldAlert, Activity
} from 'lucide-react';
import { useAlertsStore, useVisibleAlerts, type Alert, type AlertCategory } from '../../store/alertsStore';

const CATEGORY_ICONS: Record<AlertCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  patient: User, medication: Pill, lab: FlaskConical, imaging: Scan,
  drugstock: Package, security: ShieldAlert, system: Activity,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const alerts = useVisibleAlerts();
  const { recompute, markRead, markAllRead, dismiss, dismissAll } = useAlertsStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Recompute auto-alerts on mount and every 60s while the app is open.
  useEffect(() => {
    recompute();
    const t = setInterval(() => recompute(), 60000);
    return () => clearInterval(t);
  }, [recompute]);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const critical = alerts.filter((a) => a.severity === 'critical');
  const warnings = alerts.filter((a) => a.severity === 'warning');
  const info = alerts.filter((a) => a.severity === 'info');

  function handleClick(a: Alert) {
    markRead(a.id);
    if (a.link) navigate(a.link);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) recompute(); }}
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title={unreadCount > 0 ? `${unreadCount} unread alerts` : 'Alerts'}
        aria-label="Alerts"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${
            critical.length > 0 ? 'bg-red-600 animate-pulse' : warnings.length > 0 ? 'bg-orange-500' : 'bg-blue-500'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[75vh] bg-white rounded-xl shadow-xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Alerts</h3>
              <span className="text-xs text-gray-500">
                {critical.length > 0 && <span className="text-red-600 font-medium">{critical.length} critical</span>}
                {critical.length > 0 && warnings.length > 0 && <span> · </span>}
                {warnings.length > 0 && <span className="text-orange-600">{warnings.length} warning</span>}
                {(critical.length > 0 || warnings.length > 0) && info.length > 0 && <span> · </span>}
                {info.length > 0 && <span>{info.length} info</span>}
                {alerts.length === 0 && <span>nothing right now</span>}
              </span>
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all read"
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              {alerts.length > 0 && (
                <button
                  onClick={dismissAll}
                  title="Dismiss all"
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          {alerts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400 text-sm gap-2">
              <CheckCheck size={32} className="opacity-50" />
              <p>All clear</p>
              <p className="text-xs text-gray-300 text-center px-6">
                Critical patients, low drug stock, expiring medicines, and abnormal vitals will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {[...critical, ...warnings, ...info].map((a) => {
                const Icon = CATEGORY_ICONS[a.category];
                const sevColor =
                  a.severity === 'critical' ? 'text-red-600 bg-red-50' :
                  a.severity === 'warning' ? 'text-orange-600 bg-orange-50' :
                  'text-blue-600 bg-blue-50';
                const sevIcon =
                  a.severity === 'critical' ? <AlertTriangle size={12} /> :
                  a.severity === 'warning' ? <AlertCircle size={12} /> :
                  <Info size={12} />;
                return (
                  <div
                    key={a.id}
                    className={`group p-3 hover:bg-gray-50 cursor-pointer flex gap-3 ${!a.read ? 'bg-blue-50/30' : ''}`}
                    onClick={() => handleClick(a)}
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${sevColor}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sevColor}`}>
                          {sevIcon} {a.severity}
                        </span>
                        <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{a.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(a.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismiss(a.id); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 flex-shrink-0 self-start p-1"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

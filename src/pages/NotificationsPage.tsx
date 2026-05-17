import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, AlertTriangle, AlertCircle, Info, CheckCheck, X, Search, Filter,
  User, Pill, Package, FlaskConical, Scan, ShieldAlert, Activity, ArrowLeft, ExternalLink,
} from 'lucide-react';
import { useAlertsStore, useVisibleAlerts, type AlertCategory, type AlertSeverity } from '../store/alertsStore';

const CATEGORY_ICONS: Record<AlertCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  patient: User, medication: Pill, lab: FlaskConical, imaging: Scan,
  drugstock: Package, security: ShieldAlert, system: Activity,
};

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  patient: 'Patients',
  medication: 'Medications',
  lab: 'Laboratory',
  imaging: 'Imaging',
  drugstock: 'Drug Stock',
  security: 'Security',
  system: 'System',
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const alerts = useVisibleAlerts();
  const { recompute, markRead, markAllRead, dismiss, dismissAll } = useAlertsStore();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');

  const filtered = useMemo(() => {
    let list = alerts;
    if (categoryFilter !== 'all') list = list.filter((a) => a.category === categoryFilter);
    if (severityFilter !== 'all') list = list.filter((a) => a.severity === severityFilter);
    if (readFilter === 'unread') list = list.filter((a) => !a.read);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q),
      );
    }
    // Sort: critical > warning > info, then newest first
    const severityRank: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return [...list].sort((a, b) => {
      if (severityRank[a.severity] !== severityRank[b.severity]) {
        return severityRank[a.severity] - severityRank[b.severity];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [alerts, categoryFilter, severityFilter, readFilter, query]);

  const totals = useMemo(() => ({
    total: alerts.length,
    unread: alerts.filter((a) => !a.read).length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
  }), [alerts]);

  function openAlert(alertId: string, link: string | undefined) {
    markRead(alertId);
    if (link) navigate(link);
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={22} className="text-blue-600" /> Notifications & Alerts
          </h1>
          <p className="text-sm text-gray-500">
            Every active alert visible to you. Click an item to jump straight to its source page.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => recompute()} className="btn-secondary text-xs" title="Recompute alerts from current state">
            Refresh
          </button>
          {totals.unread > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-xs">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {alerts.length > 0 && (
            <button onClick={dismissAll} className="btn-danger text-xs">
              <X size={14} /> Dismiss all
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total active', value: totals.total, color: 'text-blue-600', bg: 'bg-blue-50', icon: Bell },
          { label: 'Unread', value: totals.unread, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Bell },
          { label: 'Warning', value: totals.warning, color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle },
          { label: 'Critical', value: totals.critical, color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`rounded-xl p-3 ${bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={color} />
              <span className="text-xs font-medium text-gray-600">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Filter size={14} /> Filters
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or message..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as AlertCategory | 'all')} className="select-field text-sm">
            <option value="all">All categories</option>
            {(Object.keys(CATEGORY_LABELS) as AlertCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'all')} className="select-field text-sm">
            <option value="all">All severities</option>
            {(Object.keys(SEVERITY_LABELS) as AlertSeverity[]).map((s) => (
              <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
            ))}
          </select>
          <select value={readFilter} onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread')} className="select-field text-sm">
            <option value="all">Read + unread</option>
            <option value="unread">Unread only</option>
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-2">{filtered.length} of {alerts.length} alerts</p>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCheck size={36} className="mx-auto opacity-50 mb-2" />
            <p className="font-medium text-gray-600">No alerts match your filters</p>
            <p className="text-xs text-gray-500 mt-1">
              Critical patients, low drug stock, expiring medicines, and abnormal vitals will appear here automatically.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((a) => {
              const Icon = CATEGORY_ICONS[a.category];
              const sev = a.severity;
              const sevColor =
                sev === 'critical' ? 'text-red-600 bg-red-50' :
                sev === 'warning' ? 'text-orange-600 bg-orange-50' :
                'text-blue-600 bg-blue-50';
              const sevIcon = sev === 'critical' ? <AlertTriangle size={12} /> :
                              sev === 'warning' ? <AlertCircle size={12} /> :
                              <Info size={12} />;
              return (
                <li
                  key={a.id}
                  className={`group p-4 hover:bg-gray-50 cursor-pointer flex gap-3 ${!a.read ? 'bg-blue-50/30' : ''}`}
                  onClick={() => openAlert(a.id, a.link)}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${sevColor}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide ${sevColor}`}>
                        {sevIcon} {SEVERITY_LABELS[sev]}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide font-medium text-gray-400">
                        {CATEGORY_LABELS[a.category]}
                      </span>
                      {!a.read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Unread"></span>}
                      <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{a.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-gray-400">{timeAgo(a.createdAt)}</span>
                      {a.link && (
                        <span className="text-blue-600 inline-flex items-center gap-1">
                          <ExternalLink size={10} /> Open source page
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(a.id); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 flex-shrink-0 self-start p-1"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

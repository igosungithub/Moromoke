import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Search, Filter, Download, Trash2, AlertTriangle,
  CheckCircle, XCircle, LogIn, LogOut, KeyRound, User, FileText, FlaskConical,
  Scan, Pill, Package, Stethoscope, Activity, Baby, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useAuditStore } from '../store/auditStore';
import { useStaffStore } from '../store/staffStore';
import { usePermissions } from '../hooks/usePermissions';
import { useUIStore } from '../store/uiStore';
import { ROLE_LABELS } from '../utils/permissions';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { AuditCategory, AuditSeverity } from '../types/audit';

const CATEGORY_ICONS: Record<AuditCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  auth: LogIn, patient: User, clinical: FileText, triage: Activity,
  vitals: Stethoscope, medication: Pill, drugstock: Package,
  lab: FlaskConical, imaging: Scan, maternity: Baby, staff: User,
  settings: KeyRound, document: FileText,
};

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  auth: 'Auth & Sessions', patient: 'Patient Records', clinical: 'Clinical Notes',
  triage: 'Triage', vitals: 'Vitals', medication: 'Medications',
  drugstock: 'Drug Stock', lab: 'Lab', imaging: 'Imaging',
  maternity: 'Maternity', staff: 'Staff & Roles', settings: 'Settings',
  document: 'Documents',
};

const CATEGORY_COLORS: Record<AuditCategory, string> = {
  auth: 'text-blue-600 bg-blue-50',
  patient: 'text-emerald-600 bg-emerald-50',
  clinical: 'text-indigo-600 bg-indigo-50',
  triage: 'text-orange-600 bg-orange-50',
  vitals: 'text-green-600 bg-green-50',
  medication: 'text-purple-600 bg-purple-50',
  drugstock: 'text-amber-600 bg-amber-50',
  lab: 'text-teal-600 bg-teal-50',
  imaging: 'text-sky-600 bg-sky-50',
  maternity: 'text-pink-600 bg-pink-50',
  staff: 'text-slate-700 bg-slate-100',
  settings: 'text-gray-600 bg-gray-100',
  document: 'text-gray-600 bg-gray-100',
};

const SEVERITY_CONFIG: Record<AuditSeverity, { dot: string; ring: string; label: string }> = {
  info: { dot: 'bg-gray-300', ring: '', label: 'Info' },
  warning: { dot: 'bg-orange-400', ring: 'ring-1 ring-orange-200', label: 'Warning' },
  critical: { dot: 'bg-red-500', ring: 'ring-2 ring-red-200', label: 'Critical' },
};

const PAGE_SIZE = 100;

export default function AuditLogPage() {
  const navigate = useNavigate();
  const { events, clear } = useAuditStore();
  const { staff } = useStaffStore();
  const { addNotification } = useUIStore();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | 'all'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | 'all'>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<'all' | 'failed_only'>('all');
  const [page, setPage] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!can('audit:view')) {
    return (
      <div className="card text-center py-12">
        <ShieldCheck size={48} className="mx-auto text-gray-300 mb-3" />
        <h2 className="font-semibold text-gray-700">Access Denied</h2>
        <p className="text-sm text-gray-500 mt-1">Only administrators can view the audit log.</p>
      </div>
    );
  }

  const filtered = useMemo(() => {
    let result = events;
    if (categoryFilter !== 'all') result = result.filter((e) => e.category === categoryFilter);
    if (userFilter !== 'all') result = result.filter((e) => e.userId === userFilter);
    if (severityFilter !== 'all') result = result.filter((e) => e.severity === severityFilter);
    if (showSuccess === 'failed_only') result = result.filter((e) => !e.success);
    if (from) result = result.filter((e) => e.timestamp >= from);
    if (to) result = result.filter((e) => e.timestamp <= to);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.description.toLowerCase().includes(q) ||
        e.userName.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        (e.patientName?.toLowerCase().includes(q) ?? false) ||
        (e.resourceId?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [events, categoryFilter, userFilter, severityFilter, showSuccess, from, to, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEvents = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats summary
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    const todayCount = events.filter((e) => e.timestamp >= todayISO).length;
    const failedLogins = events.filter((e) => e.category === 'auth' && e.action === 'login' && !e.success).length;
    const criticalCount = events.filter((e) => e.severity === 'critical').length;
    const activeUsers = new Set(events.filter((e) => e.timestamp >= todayISO).map((e) => e.userId).filter(Boolean)).size;
    return { total: events.length, today: todayCount, failedLogins, criticalCount, activeUsers };
  }, [events]);

  function exportCsv() {
    const rows: string[][] = [['Timestamp', 'User', 'Role', 'Category', 'Action', 'Description', 'Patient', 'Severity', 'Success', 'ResourceType', 'ResourceID']];
    for (const e of filtered) {
      rows.push([
        e.timestamp, e.userName, e.userRole ? ROLE_LABELS[e.userRole] : '',
        e.category, e.action, e.description, e.patientName ?? '',
        e.severity, e.success ? 'yes' : 'no', e.resourceType ?? '', e.resourceId ?? '',
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moromoke-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({ type: 'success', title: 'Audit log exported', message: `${filtered.length} events to CSV.` });
  }

  function resetFilters() {
    setSearch(''); setCategoryFilter('all'); setUserFilter('all');
    setSeverityFilter('all'); setFrom(''); setTo(''); setShowSuccess('all'); setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={22} className="text-red-600" />
            Audit Log
          </h1>
          <p className="text-sm text-gray-500">Complete activity history of all staff. Admin-only view.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-secondary" title="Export filtered to CSV">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setConfirmClear(true)} className="btn-danger text-sm" title="Clear all audit events">
            <Trash2 size={14} /> Clear Log
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50', icon: ShieldCheck },
          { label: 'Today', value: stats.today, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: RefreshCw },
          { label: 'Active Users Today', value: stats.activeUsers, color: 'text-purple-600', bg: 'bg-purple-50', icon: User },
          { label: 'Failed Logins', value: stats.failedLogins, color: 'text-orange-600', bg: 'bg-orange-50', icon: XCircle },
          { label: 'Critical Events', value: stats.criticalCount, color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`rounded-xl p-3 ${bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={color} />
              <span className="text-xs font-medium text-gray-600">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter size={14} /> Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="relative col-span-1 md:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search description, user, patient, ID..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value as AuditCategory | 'all'); setPage(1); }} className="select-field text-sm">
            <option value="all">All Categories</option>
            {(Object.keys(CATEGORY_LABELS) as AuditCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <select value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }} className="select-field text-sm">
            <option value="all">All Users</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName} (@{s.username})</option>
            ))}
          </select>
          <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value as AuditSeverity | 'all'); setPage(1); }} className="select-field text-sm">
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select value={showSuccess} onChange={(e) => { setShowSuccess(e.target.value as 'all' | 'failed_only'); setPage(1); }} className="select-field text-sm">
            <option value="all">Successful + Failed</option>
            <option value="failed_only">Failed only</option>
          </select>
          <div>
            <label className="text-xs text-gray-500">From</label>
            <input type="datetime-local" value={from.slice(0, 16)} onChange={(e) => { setFrom(e.target.value ? new Date(e.target.value).toISOString() : ''); setPage(1); }} className="input-field text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">To</label>
            <input type="datetime-local" value={to.slice(0, 16)} onChange={(e) => { setTo(e.target.value ? new Date(e.target.value).toISOString() : ''); setPage(1); }} className="input-field text-sm" />
          </div>
          <button onClick={resetFilters} className="btn-secondary text-sm self-end"><RefreshCw size={14} /> Reset</button>
        </div>
        <p className="text-xs text-gray-500">{filtered.length} of {events.length} events</p>
      </div>

      {/* Events list */}
      <div className="card p-0 overflow-hidden">
        {pageEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShieldCheck size={48} className="mx-auto opacity-30 mb-2" />
            <p>No audit events match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pageEvents.map((e) => {
              const CategoryIcon = CATEGORY_ICONS[e.category];
              const sev = SEVERITY_CONFIG[e.severity];
              return (
                <div key={e.id} className={`p-3 hover:bg-gray-50 transition-colors flex gap-3 items-start ${sev.ring}`}>
                  <div className={`mt-0.5 w-2.5 h-2.5 rounded-full ${sev.dot} flex-shrink-0`} title={sev.label}></div>
                  <span className={`p-1.5 rounded-lg ${CATEGORY_COLORS[e.category]} flex-shrink-0`}>
                    <CategoryIcon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-500 uppercase">{e.action.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs font-medium text-gray-700">
                        {e.userName}
                        {e.userRole && <span className="text-gray-400"> ({ROLE_LABELS[e.userRole]})</span>}
                      </span>
                      {!e.success && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">FAILED</span>
                      )}
                      {e.success && e.category === 'auth' && e.action === 'login' && (
                        <CheckCircle size={11} className="text-green-500" />
                      )}
                      {e.category === 'auth' && e.action === 'logout' && (
                        <LogOut size={11} className="text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mt-0.5">{e.description}</p>
                    {(e.patientName || e.resourceId) && (
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        {e.patientName && <>Patient: {e.patientName} </>}
                        {e.resourceId && <>· {e.resourceType}:{e.resourceId.slice(0, 12)}</>}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-600 whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</p>
                    <p className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(e.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-gray-100 text-xs">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs disabled:opacity-50">
              ← Previous
            </button>
            <span className="text-gray-500">Page {page} of {totalPages} · {filtered.length} events</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs disabled:opacity-50">
              Next →
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { clear(); addNotification({ type: 'success', title: 'Audit log cleared' }); }}
        title="Clear audit log?"
        message="This permanently deletes all audit events. This action cannot be undone. In a real hospital, audit logs must be retained for compliance — only clear in test environments."
        confirmLabel="Clear All Events"
      />
    </div>
  );
}

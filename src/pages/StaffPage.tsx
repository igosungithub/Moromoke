import { useState } from 'react';
import { UserCog, Plus, Edit, Trash2, Save, X, Shield, LogIn } from 'lucide-react';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { PermissionGate } from '../components/ui/PermissionGate';
import { ROLE_LABELS, ROLE_ACCESS_DESCRIPTIONS, getStaffRoles } from '../utils/permissions';
import type { Staff, StaffRole } from '../types';

const ALL_ROLES: StaffRole[] = ['physician', 'np', 'pa', 'nurse', 'pharmacist', 'radiologist', 'technician', 'admin'];

const roleColors: Record<StaffRole, string> = {
  physician: 'badge-blue',
  nurse: 'badge-green',
  np: 'badge-blue',
  pa: 'badge-blue',
  technician: 'badge-gray',
  admin: 'badge-yellow',
  pharmacist: 'badge-orange',
  radiologist: 'badge-gray',
};

function roleBadges(staff: Staff) {
  return getStaffRoles(staff).map((role) => (
    <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[role] || 'badge-gray'}`}>
      {ROLE_LABELS[role]}
    </span>
  ));
}

export default function StaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff, currentUser, setCurrentUser } = useStaffStore();
  const { addNotification } = useUIStore();
  const { can } = usePermissions();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Staff>>({ role: 'nurse', status: 'active', shift: 'day', department: 'Emergency', additionalRoles: [] });
  const [filter, setFilter] = useState('all');

  const canCreate = can('staff:create');
  const canEdit = can('staff:edit');
  const canDelete = can('staff:delete');
  const canAssignRoles = can('staff:assign_roles');
  const canSwitchUser = can('audit:view');

  const filtered = staff.filter((s) => {
    if (filter === 'all') return true;
    if (filter === s.status) return true;
    return getStaffRoles(s).includes(filter as StaffRole);
  });

  function openAdd() {
    if (!canCreate) return;
    setForm({
      role: 'nurse',
      status: 'active',
      shift: 'day',
      department: 'Emergency',
      hireDate: new Date().toISOString().split('T')[0],
      additionalRoles: [],
    });
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(s: Staff) {
    if (!canEdit) return;
    setForm({ ...s, additionalRoles: s.additionalRoles ?? [] });
    setEditingId(s.id);
    setShowModal(true);
  }

  function save() {
    if (!form.firstName || !form.lastName || !form.role || !form.email) return;
    const additionalRoles = (form.additionalRoles ?? []).filter((r) => r !== form.role);

    if (editingId) {
      if (!canEdit) return;
      updateStaff(editingId, { ...form, additionalRoles });
    } else {
      if (!canCreate) return;
      addStaff({
        ...form,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        additionalRoles,
        department: form.department || 'Emergency',
        phone: form.phone || '',
        email: form.email,
        status: form.status || 'active',
        hireDate: form.hireDate || new Date().toISOString().split('T')[0],
        employeeId: 'EMP' + Date.now().toString().slice(-4),
      });
    }
    setShowModal(false);
    addNotification({ type: 'success', title: editingId ? 'Staff updated' : 'Staff added' });
  }

  function toggleAdditionalRole(role: StaffRole) {
    const current = new Set(form.additionalRoles ?? []);
    if (current.has(role)) current.delete(role);
    else current.add(role);
    current.delete(form.role as StaffRole);
    setForm({ ...form, additionalRoles: Array.from(current) });
  }

  function confirmDelete() {
    if (!deleteId || !canDelete) return;
    if (deleteId === currentUser?.id) {
      addNotification({ type: 'error', title: 'Cannot remove active user', message: 'Sign in as another administrator first.' });
      setDeleteId(null);
      return;
    }
    deleteStaff(deleteId);
    setDeleteId(null);
    addNotification({ type: 'success', title: 'Staff removed' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog size={22} className="text-gray-600" /> Staff Management
          </h1>
          <p className="text-sm text-gray-500">Role-based access control with admin-managed multi-role assignments.</p>
        </div>
        <div className="flex gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select-field w-auto text-sm">
            <option value="all">All Staff</option>
            {ALL_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on-leave">On Leave</option>
          </select>
          <PermissionGate permission="staff:create">
            <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Staff</button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {ALL_ROLES.map((role) => (
          <div key={role} className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">{ROLE_LABELS[role]}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{ROLE_ACCESS_DESCRIPTIONS[role]}</p>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Staff Member', 'Roles', 'Department', 'Contact', 'Shift', 'Last Login', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.id} className={`hover:bg-gray-50 ${currentUser?.id === s.id ? 'bg-blue-50/50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500">{s.employeeId}{s.npi ? ` · NPI: ${s.npi}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">{roleBadges(s)}</div>
                  {s.specialty && <p className="text-xs text-gray-500 mt-1">{s.specialty}</p>}
                </td>
                <td className="px-4 py-3 text-gray-700">{s.department}</td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">{s.phone}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-gray-700">{s.shift || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{s.lastLoginAt ? formatDate(s.lastLoginAt) : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'badge-green' : s.status === 'on-leave' ? 'badge-yellow' : 'badge-red'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {canSwitchUser && (
                      <button
                        onClick={() => { setCurrentUser(s); addNotification({ type: 'success', title: `Active staff: ${s.firstName} ${s.lastName}` }); }}
                        className="text-green-600 hover:text-green-700"
                        title={currentUser?.id === s.id ? 'Currently active' : 'Switch active demo user'}
                      >
                        <LogIn size={15} />
                      </button>
                    )}
                    <PermissionGate permission="staff:edit">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-700" title="Edit staff"><Edit size={15} /></button>
                    </PermissionGate>
                    <PermissionGate permission="staff:delete">
                      <button
                        onClick={() => setDeleteId(s.id)}
                        disabled={currentUser?.id === s.id}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={currentUser?.id === s.id ? 'Cannot delete active user' : 'Remove staff'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Staff' : 'Add Staff'} size="lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-field" placeholder="First name" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-field" placeholder="Last name" />
            </div>
            <div>
              <label className="label">Primary Role *</label>
              <select
                value={form.role || 'nurse'}
                onChange={(e) => {
                  const role = e.target.value as StaffRole;
                  setForm({ ...form, role, additionalRoles: (form.additionalRoles ?? []).filter((r) => r !== role) });
                }}
                className="select-field"
              >
                {ALL_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Specialty</label>
              <input value={form.specialty || ''} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="input-field" placeholder="Specialty" />
            </div>
            <div>
              <label className="label">Department</label>
              <input value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field" placeholder="Department" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="Phone" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="Email" />
            </div>
            <div>
              <label className="label">License Number</label>
              <input value={form.licenseNumber || ''} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">NPI Number</label>
              <input value={form.npi || ''} onChange={(e) => setForm({ ...form, npi: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Shift</label>
              <select value={form.shift || 'day'} onChange={(e) => setForm({ ...form, shift: e.target.value as Staff['shift'] })} className="select-field">
                <option value="day">Day</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="rotating">Rotating</option>
              </select>
            </div>
            <div>
              <label className="label">Hire Date</label>
              <input type="date" value={form.hireDate || ''} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as Staff['status'] })} className="select-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>

          <PermissionGate permission="staff:assign_roles">
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">Additional Roles</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Admin can combine roles. The user receives the union of every selected role's permissions.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_ROLES.map((role) => {
                  const isPrimary = form.role === role;
                  const checked = isPrimary || (form.additionalRoles ?? []).includes(role);
                  return (
                    <label key={role} className={`flex items-start gap-2 rounded-lg border p-2 text-sm ${isPrimary ? 'bg-white/70 border-blue-200 opacity-70' : 'bg-white border-gray-200 cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isPrimary}
                        onChange={() => toggleAdditionalRole(role)}
                        className="mt-0.5 rounded"
                      />
                      <span>
                        <span className="font-medium text-gray-800">{ROLE_LABELS[role]}{isPrimary ? ' (primary)' : ''}</span>
                        <span className="block text-xs text-gray-500">{ROLE_ACCESS_DESCRIPTIONS[role]}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </PermissionGate>

          {!canAssignRoles && (
            <p className="text-xs text-gray-500">Only administrators can grant additional roles.</p>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={save} className="btn-primary"><Save size={16} />Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Remove Staff"
        message="Are you sure you want to remove this staff member? This will be logged in the audit trail."
      />
    </div>
  );
}

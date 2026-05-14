import { useState } from 'react';
import { UserCog, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import { formatDate } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { Staff } from '../types';

export default function StaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff, currentUser, setCurrentUser } = useStaffStore();
  const { addNotification } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Staff>>({ role: 'nurse', status: 'active', shift: 'day', department: 'Emergency' });
  const [filter, setFilter] = useState('all');

  const filtered = staff.filter((s) => filter === 'all' || s.role === filter || s.status === filter);

  function openAdd() {
    setForm({ role: 'nurse', status: 'active', shift: 'day', department: 'Emergency', hireDate: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(s: Staff) {
    setForm(s);
    setEditingId(s.id);
    setShowModal(true);
  }

  function save() {
    if (!form.firstName || !form.lastName || !form.role || !form.email) return;
    if (editingId) {
      updateStaff(editingId, form);
    } else {
      addStaff({
        ...form,
        firstName: form.firstName!,
        lastName: form.lastName!,
        role: form.role!,
        department: form.department || 'Emergency',
        phone: form.phone || '',
        email: form.email!,
        status: form.status || 'active',
        hireDate: form.hireDate || new Date().toISOString().split('T')[0],
        employeeId: 'EMP' + Date.now().toString().slice(-4),
      });
    }
    setShowModal(false);
    addNotification({ type: 'success', title: editingId ? 'Staff updated' : 'Staff added' });
  }

  const roleColors: Record<string, string> = {
    physician: 'badge-blue',
    nurse: 'badge-green',
    np: 'badge-blue',
    pa: 'badge-blue',
    technician: 'badge-gray',
    admin: 'badge-yellow',
    pharmacist: 'badge-orange',
    radiologist: 'badge-gray',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UserCog size={22} className="text-gray-600" /> Staff Management
        </h1>
        <div className="flex gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select-field w-auto text-sm">
            <option value="all">All Staff</option>
            <option value="physician">Physicians</option>
            <option value="nurse">Nurses</option>
            <option value="np">Nurse Practitioners</option>
            <option value="pa">Physician Assistants</option>
            <option value="technician">Technicians</option>
            <option value="admin">Admin</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Staff</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Staff Member', 'Role', 'Department', 'Contact', 'Shift', 'Hire Date', 'Status', 'Actions'].map((h) => (
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
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[s.role] || 'badge-gray'}`}>
                    {s.role}
                  </span>
                  {s.specialty && <p className="text-xs text-gray-500 mt-0.5">{s.specialty}</p>}
                </td>
                <td className="px-4 py-3 text-gray-700">{s.department}</td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">{s.phone}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-gray-700">{s.shift || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(s.hireDate)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'badge-green' : s.status === 'on-leave' ? 'badge-yellow' : 'badge-red'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setCurrentUser(s); addNotification({ type: 'success', title: `Logged in as ${s.firstName} ${s.lastName}` }); }} className="text-xs text-green-600 hover:text-green-700 font-medium">
                      {currentUser?.id === s.id ? '✓ Active' : 'Switch'}
                    </button>
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-700"><Edit size={15} /></button>
                    <button onClick={() => setDeleteId(s.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
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
              <label className="label">Role *</label>
              <select value={form.role || 'nurse'} onChange={(e) => setForm({ ...form, role: e.target.value as Staff['role'] })} className="select-field">
                <option value="physician">Physician</option>
                <option value="nurse">Nurse</option>
                <option value="np">Nurse Practitioner</option>
                <option value="pa">Physician Assistant</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="radiologist">Radiologist</option>
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
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={save} className="btn-primary"><Save size={16} />Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteId && deleteStaff(deleteId); addNotification({ type: 'success', title: 'Staff removed' }); }}
        title="Remove Staff"
        message="Are you sure you want to remove this staff member?"
      />
    </div>
  );
}

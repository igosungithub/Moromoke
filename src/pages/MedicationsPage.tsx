import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Pill, Plus, Edit, Trash2, Save, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import { useAlertsStore } from '../store/alertsStore';
import { getPatientFullName, calculateAge, formatDate, STATUS_LABELS } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { PermissionGate } from '../components/ui/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { checkPrescriptionSafety } from '../utils/medicationSafety';
import type { Medication } from '../types';

export default function MedicationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { patients, addMedication, updateMedication, deleteMedication } = usePatientStore();
  const { currentUser } = useStaffStore();
  const { addNotification } = useUIStore();
  const { can } = usePermissions();

  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Medication>>({
    status: 'active',
    route: 'Oral',
    frequency: 'Once daily',
  });
  const [overrideReason, setOverrideReason] = useState('');

  const activePatients = patients.filter((p) => !['discharged', 'transferred'].includes(p.status));
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Real-time safety check: allergies, interactions, duplicates
  const safetyIssues = useMemo(() => {
    return checkPrescriptionSafety(selectedPatient, { name: form.name, genericName: form.genericName, route: form.route }, editingId ?? undefined);
  }, [selectedPatient, form.name, form.genericName, form.route, editingId]);
  const hasCritical = safetyIssues.some((i) => i.severity === 'critical');

  function openAdd() {
    if (!can('medications:prescribe')) return;
    setForm({ status: 'active', route: 'Oral', frequency: 'Once daily', startDate: new Date().toISOString().split('T')[0], prescribedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '' });
    setEditingId(null);
    setOverrideReason('');
    setShowModal(true);
  }

  function openEdit(med: Medication) {
    if (!can('medications:edit')) return;
    setForm(med);
    setEditingId(med.id);
    setOverrideReason('');
    setShowModal(true);
  }

  function saveMedication() {
    if (!form.name || !form.dosage || !selectedPatientId) return;
    // Critical safety issues require an override reason
    if (hasCritical && !overrideReason.trim()) {
      addNotification({
        type: 'error', title: 'Override reason required',
        message: 'A critical safety issue is flagged. Document why you are proceeding before saving.',
      });
      return;
    }
    if (editingId) {
      if (!can('medications:edit')) return;
      updateMedication(selectedPatientId, editingId, {
        ...form,
        notes: overrideReason ? `${form.notes ? form.notes + '\n' : ''}SAFETY OVERRIDE: ${overrideReason}` : form.notes,
      });
    } else {
      if (!can('medications:prescribe')) return;
      addMedication(selectedPatientId, {
        ...form,
        name: form.name!,
        dosage: form.dosage!,
        route: form.route || 'Oral',
        frequency: form.frequency || 'Once daily',
        startDate: form.startDate || new Date().toISOString().split('T')[0],
        prescribedBy: form.prescribedBy || '',
        status: form.status || 'active',
        indication: form.indication || '',
        notes: overrideReason ? `${form.notes ? form.notes + '\n' : ''}SAFETY OVERRIDE: ${overrideReason}` : form.notes,
      });
      // Raise a persistent alert if a critical issue was overridden
      if (hasCritical && selectedPatient) {
        useAlertsStore.getState().push({
          category: 'medication', severity: 'critical', source: 'manual',
          title: `Safety override — ${form.name} for ${selectedPatient.firstName} ${selectedPatient.lastName}`,
          message: `Prescribed despite ${safetyIssues.filter((i) => i.severity === 'critical').length} critical issue(s). Reason: ${overrideReason}`,
          link: `/medications?patientId=${selectedPatient.id}`,
          patientId: selectedPatient.id,
          visibleToRoles: ['admin', 'pharmacist'],
        });
      }
    }
    setShowModal(false);
    addNotification({ type: 'success', title: editingId ? 'Medication updated' : 'Medication added' });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {searchParams.get('patientId') && (
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Pill size={22} className="text-purple-600" />
          Medications
        </h1>
      </div>

      <div className="card">
        <label className="label">Select Patient</label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="select-field max-w-md"
        >
          <option value="">-- Select a patient --</option>
          {activePatients.map((p) => (
            <option key={p.id} value={p.id}>
              {getPatientFullName(p)} · {p.mrn} · Age {calculateAge(p.dateOfBirth)}
            </option>
          ))}
        </select>
      </div>

      {selectedPatient && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">{getPatientFullName(selectedPatient)}</h2>
              <p className="text-xs text-gray-500">{selectedPatient.mrn} · {STATUS_LABELS[selectedPatient.status]}</p>
            </div>
            <PermissionGate permission="medications:prescribe">
              <button onClick={openAdd} className="btn-primary">
                <Plus size={16} /> Add Medication
              </button>
            </PermissionGate>
          </div>

          {selectedPatient.currentMedications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Pill size={36} className="mx-auto mb-2 opacity-50" />
              <p>No medications recorded for this patient.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Medication', 'Dosage', 'Route', 'Frequency', 'Indication', 'Prescribed By', 'Start Date', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-600 px-3 py-2 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedPatient.currentMedications.map((med) => (
                    <tr key={med.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="font-medium">{med.name}</p>
                        {med.genericName && <p className="text-xs text-gray-500">{med.genericName}</p>}
                      </td>
                      <td className="px-3 py-2 font-medium">{med.dosage}</td>
                      <td className="px-3 py-2">{med.route}</td>
                      <td className="px-3 py-2">{med.frequency}</td>
                      <td className="px-3 py-2 text-gray-600">{med.indication}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{med.prescribedBy}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{formatDate(med.startDate)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          med.status === 'active' ? 'badge-green' :
                          med.status === 'discontinued' ? 'badge-red' :
                          med.status === 'on-hold' ? 'badge-yellow' : 'badge-gray'
                        }`}>{med.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <PermissionGate permission="medications:edit">
                            <button onClick={() => openEdit(med)} className="text-blue-600 hover:text-blue-700"><Edit size={15} /></button>
                          </PermissionGate>
                          <PermissionGate permission="medications:delete">
                            <button onClick={() => setDeleteId(med.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Medication' : 'Add Medication'} size="lg">
        <div className="p-6 space-y-4">

          {/* Safety check panel */}
          {safetyIssues.length > 0 && (
            <div className={`rounded-lg border-2 p-3 ${hasCritical ? 'border-red-400 bg-red-50' : 'border-orange-300 bg-orange-50'}`}>
              <div className={`flex items-center gap-2 font-semibold mb-2 text-sm ${hasCritical ? 'text-red-800' : 'text-orange-800'}`}>
                <AlertTriangle size={16} />
                Safety Check — {safetyIssues.length} issue{safetyIssues.length === 1 ? '' : 's'} detected
              </div>
              <ul className="space-y-2">
                {safetyIssues.map((i, idx) => (
                  <li key={idx} className={`text-xs ${i.severity === 'critical' ? 'text-red-800' : 'text-orange-800'}`}>
                    <p className="font-semibold">{i.severity === 'critical' ? '⛔ ' : '⚠ '}{i.title}</p>
                    <p className="mt-0.5 leading-relaxed">{i.detail}</p>
                  </li>
                ))}
              </ul>
              {hasCritical && (
                <div className="mt-3 pt-3 border-t border-red-300">
                  <label className="text-xs font-semibold text-red-800 mb-1 block">
                    Override reason (required to proceed) *
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-red-300 rounded bg-white text-gray-900"
                    rows={2}
                    placeholder="e.g., Penicillin reaction was mild rash 20 years ago, benefit outweighs risk; senior consultant approval obtained."
                  />
                  <p className="text-[10px] text-red-700 mt-1">This will be logged in the audit trail and visible to admin + pharmacist.</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Medication Name *</label>
              <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Brand name" />
            </div>
            <div>
              <label className="label">Generic Name</label>
              <input value={form.genericName || ''} onChange={(e) => setForm({ ...form, genericName: e.target.value })} className="input-field" placeholder="Generic name" />
            </div>
            <div>
              <label className="label">Dosage *</label>
              <input value={form.dosage || ''} onChange={(e) => setForm({ ...form, dosage: e.target.value })} className="input-field" placeholder="e.g., 500mg" />
            </div>
            <div>
              <label className="label">Route *</label>
              <select value={form.route || 'Oral'} onChange={(e) => setForm({ ...form, route: e.target.value })} className="select-field">
                {['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Sublingual', 'Rectal', 'Ophthalmic', 'Otic', 'Nasal'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Frequency *</label>
              <select value={form.frequency || 'Once daily'} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="select-field">
                {['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'PRN', 'Stat', 'Weekly', 'Monthly'].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Indication *</label>
              <input value={form.indication || ''} onChange={(e) => setForm({ ...form, indication: e.target.value })} className="input-field" placeholder="Reason for medication" />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Prescribed By</label>
              <input value={form.prescribedBy || ''} onChange={(e) => setForm({ ...form, prescribedBy: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as Medication['status'] })} className="select-field">
                <option value="active">Active</option>
                <option value="discontinued">Discontinued</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="textarea-field" rows={2} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={saveMedication} className="btn-primary"><Save size={16} />Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId && selectedPatientId && can('medications:delete')) {
            deleteMedication(selectedPatientId, deleteId);
            addNotification({ type: 'success', title: 'Medication removed' });
          }
        }}
        title="Remove Medication"
        message="Are you sure you want to remove this medication?"
      />
    </div>
  );
}

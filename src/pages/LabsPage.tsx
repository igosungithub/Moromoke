import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FlaskConical, Plus, Edit, Save, X, ArrowLeft } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import { getPatientFullName, calculateAge, formatDateTime } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import type { LabResult, LabResultItem } from '../types';

const LAB_CATEGORIES = [
  'Complete Blood Count (CBC)', 'Basic Metabolic Panel', 'Comprehensive Metabolic Panel',
  'Lipid Panel', 'Liver Function Tests', 'Thyroid Function', 'Cardiac Markers',
  'Coagulation', 'Urinalysis', 'Blood Culture', 'Toxicology', 'ABG', 'Other'
];

export default function LabsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { patients, addLabResult, updateLabResult } = usePatientStore();
  const { currentUser } = useStaffStore();
  const { addNotification } = useUIStore();

  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resultsModal, setResultsModal] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<LabResult>>({ status: 'ordered', priority: 'routine', category: '' });
  const [resultItems, setResultItems] = useState<LabResultItem[]>([]);

  const activePatients = patients.filter((p) => !['discharged', 'transferred'].includes(p.status));
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  function openOrder() {
    setForm({
      status: 'ordered',
      priority: 'routine',
      category: LAB_CATEGORIES[0],
      orderedDate: new Date().toISOString(),
      orderedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
    });
    setEditingId(null);
    setShowModal(true);
  }

  function saveOrder() {
    if (!form.testName || !selectedPatientId) return;
    if (editingId) {
      updateLabResult(selectedPatientId, editingId, form);
    } else {
      addLabResult(selectedPatientId, {
        ...form,
        testName: form.testName!,
        orderedBy: form.orderedBy || '',
        orderedDate: form.orderedDate || new Date().toISOString(),
        status: form.status || 'ordered',
        category: form.category || '',
        priority: form.priority || 'routine',
      });
    }
    setShowModal(false);
    addNotification({ type: 'success', title: editingId ? 'Lab updated' : 'Lab ordered' });
  }

  function saveResults() {
    if (!resultsModal || !selectedPatientId) return;
    updateLabResult(selectedPatientId, resultsModal, {
      results: resultItems,
      status: 'resulted',
      resultDate: new Date().toISOString(),
    });
    setResultsModal(null);
    addNotification({ type: 'success', title: 'Lab results saved' });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {searchParams.get('patientId') && (
          <button onClick={() => navigate(-1)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
        )}
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FlaskConical size={22} className="text-green-600" /> Lab Results
        </h1>
      </div>

      <div className="card">
        <label className="label">Select Patient</label>
        <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="select-field max-w-md">
          <option value="">-- Select a patient --</option>
          {activePatients.map((p) => (
            <option key={p.id} value={p.id}>{getPatientFullName(p)} · {p.mrn} · Age {calculateAge(p.dateOfBirth)}</option>
          ))}
        </select>
      </div>

      {selectedPatient && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">{getPatientFullName(selectedPatient)}</h2>
            <button onClick={openOrder} className="btn-primary"><Plus size={16} /> Order Lab</button>
          </div>
          {selectedPatient.labResults.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FlaskConical size={36} className="mx-auto mb-2 opacity-50" />
              <p>No lab orders for this patient.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPatient.labResults.map((lab) => (
                <div key={lab.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{lab.testName}</p>
                      <p className="text-xs text-gray-500">{lab.category} · Ordered: {formatDateTime(lab.orderedDate)} · By: {lab.orderedBy}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${lab.priority === 'stat' ? 'badge-red' : lab.priority === 'urgent' ? 'badge-orange' : 'badge-gray'}`}>
                        {lab.priority.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${lab.status === 'resulted' ? 'badge-green' : lab.status === 'processing' ? 'badge-blue' : 'badge-gray'}`}>
                        {lab.status}
                      </span>
                      <button onClick={() => { setForm(lab); setEditingId(lab.id); setShowModal(true); }} className="text-blue-600 hover:text-blue-700"><Edit size={15} /></button>
                      {lab.status !== 'resulted' && (
                        <button
                          onClick={() => {
                            setResultItems(lab.results || [{ name: '', value: '', unit: '', referenceRange: '' }]);
                            setResultsModal(lab.id);
                          }}
                          className="text-xs text-green-600 font-medium hover:text-green-700"
                        >
                          Enter Results
                        </button>
                      )}
                    </div>
                  </div>
                  {lab.results && lab.results.length > 0 && (
                    <table className="w-full text-xs mt-2 border-t pt-2">
                      <thead><tr className="bg-gray-50">
                        {['Test', 'Result', 'Unit', 'Reference', 'Flag'].map((h) => (
                          <th key={h} className="text-left px-2 py-1 font-semibold text-gray-600">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {lab.results.map((r, i) => (
                          <tr key={i} className={`border-t ${r.flag && r.flag !== 'N' ? 'bg-red-50' : ''}`}>
                            <td className="px-2 py-1.5">{r.name}</td>
                            <td className={`px-2 py-1.5 font-semibold ${r.flag && ['H','HH','L','LL'].includes(r.flag) ? 'text-red-600' : ''}`}>{r.value}</td>
                            <td className="px-2 py-1.5 text-gray-500">{r.unit}</td>
                            <td className="px-2 py-1.5 text-gray-500">{r.referenceRange}</td>
                            <td className={`px-2 py-1.5 font-bold ${r.flag && r.flag !== 'N' ? 'text-red-600' : 'text-gray-400'}`}>{r.flag || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Lab Order' : 'Order Lab Test'}>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Test Name *</label>
            <input value={form.testName || ''} onChange={(e) => setForm({ ...form, testName: e.target.value })} className="input-field" placeholder="e.g., CBC with differential" />
          </div>
          <div>
            <label className="label">Category</label>
            <select value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className="select-field">
              {LAB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select value={form.priority || 'routine'} onChange={(e) => setForm({ ...form, priority: e.target.value as LabResult['priority'] })} className="select-field">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status || 'ordered'} onChange={(e) => setForm({ ...form, status: e.target.value as LabResult['status'] })} className="select-field">
                <option value="ordered">Ordered</option>
                <option value="collected">Collected</option>
                <option value="processing">Processing</option>
                <option value="resulted">Resulted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Ordered By</label>
            <input value={form.orderedBy || ''} onChange={(e) => setForm({ ...form, orderedBy: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="textarea-field" rows={2} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={saveOrder} className="btn-primary"><Save size={16} />Save</button>
          </div>
        </div>
      </Modal>

      {/* Results Entry Modal */}
      <Modal isOpen={!!resultsModal} onClose={() => setResultsModal(null)} title="Enter Lab Results" size="xl">
        <div className="p-6">
          <div className="space-y-3">
            {resultItems.map((item, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center">
                <input value={item.name} onChange={(e) => { const r = [...resultItems]; r[i] = { ...r[i], name: e.target.value }; setResultItems(r); }} className="input-field" placeholder="Test name" />
                <input value={item.value} onChange={(e) => { const r = [...resultItems]; r[i] = { ...r[i], value: e.target.value }; setResultItems(r); }} className="input-field" placeholder="Value" />
                <input value={item.unit} onChange={(e) => { const r = [...resultItems]; r[i] = { ...r[i], unit: e.target.value }; setResultItems(r); }} className="input-field" placeholder="Unit" />
                <input value={item.referenceRange} onChange={(e) => { const r = [...resultItems]; r[i] = { ...r[i], referenceRange: e.target.value }; setResultItems(r); }} className="input-field" placeholder="Reference" />
                <select value={item.flag || ''} onChange={(e) => { const r = [...resultItems]; r[i] = { ...r[i], flag: e.target.value as LabResultItem['flag'] }; setResultItems(r); }} className="select-field">
                  <option value="">Normal</option>
                  <option value="H">H (High)</option>
                  <option value="HH">HH (Critical High)</option>
                  <option value="L">L (Low)</option>
                  <option value="LL">LL (Critical Low)</option>
                  <option value="A">A (Abnormal)</option>
                </select>
              </div>
            ))}
          </div>
          <button onClick={() => setResultItems([...resultItems, { name: '', value: '', unit: '', referenceRange: '' }])} className="btn-secondary mt-3 text-sm">
            <Plus size={14} /> Add Row
          </button>
          <div className="flex gap-3 justify-end mt-4">
            <button onClick={() => setResultsModal(null)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={saveResults} className="btn-primary"><Save size={16} />Save Results</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

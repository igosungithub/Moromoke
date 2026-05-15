import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Scan, Plus, Edit, Save, X, ArrowLeft, Paperclip, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import { getPatientFullName, calculateAge, formatDateTime } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import DocumentUpload from '../components/ui/DocumentUpload';
import { PermissionGate } from '../components/ui/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import type { ImagingOrder } from '../types';

const MODALITIES = ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Fluoroscopy', 'Nuclear Medicine', 'PET Scan', 'Mammography', 'DEXA'];
const BODY_PARTS = ['Head/Brain', 'Neck', 'Chest', 'Abdomen', 'Pelvis', 'Spine', 'Left Shoulder', 'Right Shoulder', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Left Knee', 'Right Knee', 'Left Hip', 'Right Hip', 'Wrist', 'Ankle', 'Hand', 'Foot'];

export default function ImagingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { patients, addImagingOrder, updateImagingOrder } = usePatientStore();
  const { currentUser } = useStaffStore();
  const { addNotification } = useUIStore();
  const { can, canAny } = usePermissions();

  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ImagingOrder>>({ status: 'ordered', priority: 'routine', modality: MODALITIES[0], bodyPart: BODY_PARTS[0], attachments: [] });

  const activePatients = patients.filter((p) => !['discharged', 'transferred'].includes(p.status));
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  function openOrder() {
    if (!can('imaging:order')) return;
    setForm({
      status: 'ordered', priority: 'routine',
      modality: MODALITIES[0], bodyPart: BODY_PARTS[0],
      orderedDate: new Date().toISOString(),
      orderedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
      attachments: [],
    });
    setEditingId(null);
    setShowModal(true);
  }

  function saveOrder() {
    if (!form.modality || !form.bodyPart || !form.clinicalIndication || !selectedPatientId) return;
    if (editingId) {
      if (!canAny(['imaging:edit', 'imaging:report', 'imaging:upload_document'])) return;
      updateImagingOrder(selectedPatientId, editingId, form);
    } else {
      if (!can('imaging:order')) return;
      addImagingOrder(selectedPatientId, {
        ...form,
        orderedBy: form.orderedBy || '',
        orderedDate: form.orderedDate || new Date().toISOString(),
        modality: form.modality!,
        bodyPart: form.bodyPart!,
        clinicalIndication: form.clinicalIndication!,
        priority: form.priority || 'routine',
        status: form.status || 'ordered',
      });
    }
    setShowModal(false);
    addNotification({ type: 'success', title: editingId ? 'Imaging updated' : 'Imaging ordered' });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {searchParams.get('patientId') && (
          <button onClick={() => navigate(-1)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
        )}
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Scan size={22} className="text-indigo-600" /> Imaging
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
            <PermissionGate permission="imaging:order">
              <button onClick={openOrder} className="btn-primary"><Plus size={16} /> Order Imaging</button>
            </PermissionGate>
          </div>
          {selectedPatient.imagingOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Scan size={36} className="mx-auto mb-2 opacity-50" />
              <p>No imaging orders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPatient.imagingOrders.map((img) => (
                <div key={img.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{img.modality} — {img.bodyPart}{img.laterality ? ` (${img.laterality})` : ''}</p>
                      <p className="text-xs text-gray-500">Ordered: {formatDateTime(img.orderedDate)} · By: {img.orderedBy}</p>
                      <p className="text-sm text-gray-700 mt-1">Indication: {img.clinicalIndication}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${img.priority === 'stat' ? 'badge-red' : img.priority === 'urgent' ? 'badge-orange' : 'badge-gray'}`}>
                        {img.priority.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${img.status === 'completed' ? 'badge-green' : img.status === 'in-progress' ? 'badge-blue' : 'badge-gray'}`}>
                        {img.status}
                      </span>
                      {img.attachments && img.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full" title="Attached images / reports">
                          <Paperclip size={12} /> {img.attachments.length}
                        </span>
                      )}
                      <PermissionGate anyOf={['imaging:edit', 'imaging:report', 'imaging:upload_document']}>
                        <button onClick={() => { setForm({ ...img, attachments: img.attachments || [] }); setEditingId(img.id); setShowModal(true); }} className="text-blue-600 hover:text-blue-700"><Edit size={15} /></button>
                      </PermissionGate>
                    </div>
                  </div>
                  {/* Attached imaging files */}
                  {img.attachments && img.attachments.length > 0 && (
                    <div className="mt-3 border-t pt-2">
                      <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Paperclip size={12} /> Imaging Files ({img.attachments.length})
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {img.attachments.map((a) => (
                          <a
                            key={a.id}
                            href={a.dataUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-gray-200 rounded overflow-hidden hover:border-indigo-400 transition-colors group"
                            title={a.filename}
                          >
                            {a.mimeType.startsWith('image/') ? (
                              <img src={a.dataUrl} alt={a.filename} className="w-full h-24 object-cover" />
                            ) : (
                              <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                                {a.mimeType === 'application/pdf' ? <FileText size={28} className="text-red-600" /> : <ImageIcon size={28} className="text-gray-500" />}
                              </div>
                            )}
                            <div className="p-1.5 text-xs bg-white">
                              <p className="font-medium text-gray-900 truncate text-[10px]">{a.filename}</p>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Download size={9} /> {(a.sizeBytes / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {img.findings && (
                    <div className="mt-3 bg-gray-50 rounded p-3 text-sm">
                      <p className="font-medium text-gray-700">Findings: <span className="font-normal text-gray-600">{img.findings}</span></p>
                      {img.impression && <p className="font-medium text-gray-700 mt-1">Impression: <span className="font-normal text-gray-600">{img.impression}</span></p>}
                      {img.radiologist && <p className="text-xs text-gray-400 mt-1">Read by: {img.radiologist}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Imaging Order' : 'Order Imaging'} size="lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Modality *</label>
              <select value={form.modality || MODALITIES[0]} onChange={(e) => setForm({ ...form, modality: e.target.value })} className="select-field">
                {MODALITIES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Body Part *</label>
              <select value={form.bodyPart || BODY_PARTS[0]} onChange={(e) => setForm({ ...form, bodyPart: e.target.value })} className="select-field">
                {BODY_PARTS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Laterality</label>
              <select value={form.laterality || ''} onChange={(e) => setForm({ ...form, laterality: e.target.value })} className="select-field">
                <option value="">N/A</option>
                <option>Left</option><option>Right</option><option>Bilateral</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority || 'routine'} onChange={(e) => setForm({ ...form, priority: e.target.value as ImagingOrder['priority'] })} className="select-field">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Clinical Indication *</label>
              <textarea value={form.clinicalIndication || ''} onChange={(e) => setForm({ ...form, clinicalIndication: e.target.value })} className="textarea-field" rows={2} placeholder="Clinical reason for imaging..." />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status || 'ordered'} onChange={(e) => setForm({ ...form, status: e.target.value as ImagingOrder['status'] })} className="select-field">
                <option value="ordered">Ordered</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Radiologist</label>
              <input value={form.radiologist || ''} onChange={(e) => setForm({ ...form, radiologist: e.target.value })} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="label">Findings</label>
              <textarea value={form.findings || ''} onChange={(e) => setForm({ ...form, findings: e.target.value })} className="textarea-field" rows={3} placeholder="Radiological findings..." />
            </div>
            <div className="col-span-2">
              <label className="label">Impression</label>
              <textarea value={form.impression || ''} onChange={(e) => setForm({ ...form, impression: e.target.value })} className="textarea-field" rows={2} placeholder="Radiologist impression..." />
            </div>
          </div>

          <div className="border-t pt-3">
            <PermissionGate permission="imaging:upload_document">
              <DocumentUpload
                attachments={form.attachments || []}
                onChange={(att) => setForm({ ...form, attachments: att })}
                label="Imaging files / radiology report"
                accept="application/pdf,image/*,.dcm"
                maxFileMB={10}
                maxTotalMB={30}
              />
            </PermissionGate>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={saveOrder} className="btn-primary"><Save size={16} />Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

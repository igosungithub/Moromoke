import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Edit, AlertTriangle, Activity, Pill, FlaskConical,
  Scan, FileText, Stethoscope, User, Phone, MapPin, Shield,
  Plus, Trash2, Save, X, CheckCircle
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import {
  calculateAge, getPatientFullName, formatDate, formatDateTime,
  ESI_COLORS, ESI_LABELS, STATUS_COLORS, STATUS_LABELS
} from '../utils/helpers';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { PermissionGate } from '../components/ui/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import type { Allergy, ClinicalNote, Diagnosis, PatientStatus } from '../types';

type TabType = 'overview' | 'vitals' | 'medications' | 'allergies' | 'labs' | 'imaging' | 'notes' | 'encounter';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, updatePatient, addAllergy, updateAllergy, deleteAllergy,
    addClinicalNote, updateClinicalNote, addDiagnosis } = usePatientStore();
  const { currentUser } = useStaffStore();
  const { addNotification } = useUIStore();
  const { can } = usePermissions();

  const [tab, setTab] = useState<TabType>('overview');
  const [allergyModal, setAllergyModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [diagnosisModal, setDiagnosisModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null);

  // Allergy form state
  const [allergyForm, setAllergyForm] = useState<Partial<Allergy>>({ status: 'active', severity: 'moderate' });
  const [editingAllergyId, setEditingAllergyId] = useState<string | null>(null);

  // Note form state
  const [noteForm, setNoteForm] = useState<Partial<ClinicalNote>>({ type: 'progress', isSigned: false });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Diagnosis form state
  const [diagForm, setDiagForm] = useState<Partial<Diagnosis>>({ type: 'primary', status: 'suspected' });

  const patient = patients.find((p) => p.id === id);
  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Patient not found.</p>
        <button onClick={() => navigate('/patients')} className="btn-primary mt-4">Back to Patients</button>
      </div>
    );
  }

  const lastTriage = patient.triageAssessments[0];
  const activeEncounter = patient.encounters.find((e) => e.status === 'active') || patient.encounters[0];

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'vitals', label: 'Vitals', icon: Stethoscope },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'allergies', label: 'Allergies', icon: AlertTriangle },
    { id: 'labs', label: 'Labs', icon: FlaskConical },
    { id: 'imaging', label: 'Imaging', icon: Scan },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'encounter', label: 'Encounter', icon: Activity },
  ];

  function saveAllergy() {
    if (!allergyForm.allergen || !allergyForm.reaction || !allergyForm.severity || !patient) return;
    if (!can('patient:edit')) return;
    if (editingAllergyId) {
      updateAllergy(patient.id, editingAllergyId, allergyForm);
    } else {
      addAllergy(patient.id, allergyForm as Omit<Allergy, 'id'>);
    }
    setAllergyModal(false);
    setAllergyForm({ status: 'active', severity: 'moderate' });
    setEditingAllergyId(null);
    addNotification({ type: 'success', title: 'Allergy saved' });
  }

  function saveNote() {
    if (!noteForm.title || !noteForm.type || !patient) return;
    const now = new Date().toISOString();
    if (editingNoteId) {
      const existing = patient.clinicalNotes.find((note) => note.id === editingNoteId);
      const canEditOwn = existing?.authorId === currentUser?.id && can('notes:edit_own');
      if (!canEditOwn && !can('notes:edit_any')) return;
      updateClinicalNote(patient.id, editingNoteId, noteForm);
    } else {
      if (!can('notes:create')) return;
      addClinicalNote(patient.id, {
        ...noteForm,
        patientId: patient.id,
        encounterId: activeEncounter?.id || '',
        authorId: currentUser?.id || '',
        authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Staff',
        timestamp: now,
        isSigned: false,
      } as Omit<ClinicalNote, 'id'>);
    }
    setNoteModal(false);
    setNoteForm({ type: 'progress', isSigned: false });
    setEditingNoteId(null);
    addNotification({ type: 'success', title: 'Note saved' });
  }

  function saveDiagnosis() {
    if (!diagForm.code || !diagForm.description || !patient) return;
    if (!can('diagnosis:create')) return;
    if (activeEncounter) {
      addDiagnosis(patient.id, activeEncounter.id, diagForm as Omit<Diagnosis, 'id'>);
      setDiagnosisModal(false);
      setDiagForm({ type: 'primary', status: 'suspected' });
      addNotification({ type: 'success', title: 'Diagnosis added' });
    }
  }

  function signNote(noteId: string) {
    if (!patient) return;
    if (!can('notes:sign')) return;
    updateClinicalNote(patient.id, noteId, {
      isSigned: true,
      signedAt: new Date().toISOString(),
    });
    addNotification({ type: 'success', title: 'Note signed' });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <button onClick={() => navigate('/patients')} className="btn-secondary">
          <ArrowLeft size={16} />
          Patients
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{getPatientFullName(patient)}</h1>
            {lastTriage && (
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${ESI_COLORS[lastTriage.esiLevel]}`}>
                ESI {lastTriage.esiLevel} — {ESI_LABELS[lastTriage.esiLevel]}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[patient.status]}`}>
              {STATUS_LABELS[patient.status]}
            </span>
            {patient.allergies.some((a) => a.severity === 'life-threatening' && a.status === 'active') && (
              <span className="badge-red flex items-center gap-1">
                <AlertTriangle size={12} />
                CRITICAL ALLERGY
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {patient.mrn} · DOB: {formatDate(patient.dateOfBirth)} · Age {calculateAge(patient.dateOfBirth)}
            · {patient.gender} · Blood: {patient.bloodType}
          </p>
        </div>
        <div className="flex gap-2">
          <PermissionGate permission="triage:create">
            <button onClick={() => navigate(`/triage?patientId=${patient.id}`)} className="btn-warning">
              <Activity size={16} />
              Triage
            </button>
          </PermissionGate>
          <PermissionGate permission="patient:edit">
            <button onClick={() => navigate(`/patients/${patient.id}/edit`)} className="btn-secondary">
              <Edit size={16} />
              Edit
            </button>
          </PermissionGate>
          <PermissionGate permission="patient:edit">
            <select
              value={patient.status}
              onChange={(e) => updatePatient(patient.id, { status: e.target.value as PatientStatus })}
              className="select-field w-auto text-sm border-gray-300"
            >
              <option value="waiting">Waiting</option>
              <option value="in-triage">In Triage</option>
              <option value="in-treatment">In Treatment</option>
              <option value="admitted">Admitted</option>
              <option value="discharged">Discharged</option>
              <option value="transferred">Transferred</option>
            </select>
          </PermissionGate>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
        <nav className="flex gap-0">
          {tabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === tabId
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {label}
              {tabId === 'allergies' && patient.allergies.filter((a) => a.status === 'active').length > 0 && (
                <span className="ml-1 bg-red-100 text-red-700 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {patient.allergies.filter((a) => a.status === 'active').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User size={16} /> Personal Information
              </h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Full Name', getPatientFullName(patient)],
                  ['Date of Birth', formatDate(patient.dateOfBirth)],
                  ['Age', `${calculateAge(patient.dateOfBirth)} years`],
                  ['Gender', patient.gender],
                  ['Blood Type', patient.bloodType],
                  ['Marital Status', patient.maritalStatus || '—'],
                  ['Language', patient.language || 'English'],
                  ['Occupation', patient.occupation || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="text-gray-500 w-32 flex-shrink-0">{k}:</dt>
                    <dd className="font-medium text-gray-900 capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Phone size={16} /> Contact Information
              </h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Phone', patient.phone],
                  ['Alt Phone', patient.alternatePhone || '—'],
                  ['Email', patient.email || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="text-gray-500 w-32 flex-shrink-0">{k}:</dt>
                    <dd className="font-medium text-gray-900">{v}</dd>
                  </div>
                ))}
              </dl>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-4 flex items-center gap-2">
                <MapPin size={16} /> Address
              </h3>
              <p className="text-sm text-gray-700">
                {patient.address.street}, {patient.address.city}, {patient.address.state} {patient.address.zip}, {patient.address.country}
              </p>
            </div>
            {patient.emergencyContacts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Emergency Contacts</h3>
                {patient.emergencyContacts.map((ec) => (
                  <div key={ec.id} className="bg-gray-50 rounded-lg p-3 mb-2 text-sm">
                    <p className="font-medium">{ec.name} <span className="text-gray-500 font-normal">({ec.relationship})</span></p>
                    <p className="text-gray-600">{ec.phone}</p>
                    {ec.email && <p className="text-gray-600">{ec.email}</p>}
                  </div>
                ))}
              </div>
            )}
            {patient.insurance && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Shield size={16} /> Insurance
                </h3>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Provider', patient.insurance.provider],
                    ['Policy #', patient.insurance.policyNumber],
                    ['Group #', patient.insurance.groupNumber],
                    ['Subscriber', patient.insurance.subscriberName],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="text-gray-500 w-24 flex-shrink-0">{k}:</dt>
                      <dd className="font-medium text-gray-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {tab === 'vitals' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Vital Signs History</h3>
              <PermissionGate permission="vitals:create">
                <button onClick={() => navigate(`/vitals?patientId=${patient.id}`)} className="btn-primary text-sm">
                  <Plus size={16} /> Record Vitals
                </button>
              </PermissionGate>
            </div>
            {patient.vitalsHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No vitals recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Date/Time', 'BP', 'HR', 'RR', 'Temp', 'SpO2', 'Pain', 'Weight', 'Recorded By'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-600 px-3 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {patient.vitalsHistory.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-gray-600">{formatDateTime(v.timestamp)}</td>
                        <td className="px-3 py-2 font-medium">
                          {v.bloodPressureSystolic && v.bloodPressureDiastolic
                            ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2">{v.heartRate ? `${v.heartRate} bpm` : '—'}</td>
                        <td className="px-3 py-2">{v.respiratoryRate ? `${v.respiratoryRate}/min` : '—'}</td>
                        <td className="px-3 py-2">
                          {v.temperature ? `${v.temperature}°${v.temperatureUnit}` : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {v.oxygenSaturation ? (
                            <span className={v.oxygenSaturation < 95 ? 'text-red-600 font-bold' : ''}>
                              {v.oxygenSaturation}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2">{v.painScore !== undefined ? `${v.painScore}/10` : '—'}</td>
                        <td className="px-3 py-2">{v.weight ? `${v.weight}${v.weightUnit}` : '—'}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{v.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'medications' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Medications</h3>
              <PermissionGate permission="medications:prescribe">
                <button onClick={() => navigate(`/medications?patientId=${patient.id}`)} className="btn-primary text-sm">
                  <Plus size={16} /> Add Medication
                </button>
              </PermissionGate>
            </div>
            {patient.currentMedications.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No medications recorded.</p>
            ) : (
              <div className="space-y-3">
                {patient.currentMedications.map((med) => (
                  <div key={med.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{med.name}</p>
                        {med.genericName && <p className="text-xs text-gray-500">Generic: {med.genericName}</p>}
                        <p className="text-sm text-gray-700 mt-1">
                          {med.dosage} · {med.route} · {med.frequency}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Indication: {med.indication} | Prescribed by: {med.prescribedBy}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        med.status === 'active' ? 'badge-green' :
                        med.status === 'discontinued' ? 'badge-red' :
                        med.status === 'on-hold' ? 'badge-yellow' : 'badge-gray'
                      }`}>
                        {med.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'allergies' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Allergies & Adverse Reactions</h3>
              <PermissionGate permission="patient:edit">
                <button onClick={() => { setAllergyForm({ status: 'active', severity: 'moderate' }); setEditingAllergyId(null); setAllergyModal(true); }} className="btn-primary text-sm">
                  <Plus size={16} /> Add Allergy
                </button>
              </PermissionGate>
            </div>
            {patient.allergies.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                <p>No allergies documented. Click "Add Allergy" to record allergies or mark as "No Known Allergies".</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patient.allergies.map((a) => (
                  <div key={a.id} className={`border rounded-lg p-4 ${a.severity === 'life-threatening' ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{a.allergen}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            a.severity === 'life-threatening' ? 'bg-red-600 text-white' :
                            a.severity === 'severe' ? 'badge-red' :
                            a.severity === 'moderate' ? 'badge-orange' : 'badge-yellow'
                          }`}>
                            {a.severity}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                            {a.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">Reaction: {a.reaction}</p>
                        {a.notes && <p className="text-xs text-gray-500 mt-1">{a.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <PermissionGate permission="patient:edit">
                          <button
                            onClick={() => {
                              setAllergyForm(a);
                              setEditingAllergyId(a.id);
                              setAllergyModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit size={15} />
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="patient:delete">
                          <button
                            onClick={() => setDeleteConfirm({ type: 'allergy', id: a.id })}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        </PermissionGate>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'labs' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Lab Results</h3>
              <PermissionGate permission="labs:order">
                <button onClick={() => navigate(`/labs?patientId=${patient.id}`)} className="btn-primary text-sm">
                  <Plus size={16} /> Order Labs
                </button>
              </PermissionGate>
            </div>
            {patient.labResults.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No lab orders.</p>
            ) : (
              <div className="space-y-4">
                {patient.labResults.map((lab) => (
                  <div key={lab.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{lab.testName}</p>
                        <p className="text-xs text-gray-500">{lab.category} · Ordered: {formatDateTime(lab.orderedDate)} · By: {lab.orderedBy}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          lab.priority === 'stat' ? 'badge-red' :
                          lab.priority === 'urgent' ? 'badge-orange' : 'badge-gray'
                        }`}>
                          {lab.priority.toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          lab.status === 'resulted' ? 'badge-green' :
                          lab.status === 'processing' ? 'badge-blue' : 'badge-gray'
                        }`}>
                          {lab.status}
                        </span>
                      </div>
                    </div>
                    {lab.results && lab.results.length > 0 && (
                      <table className="w-full text-xs mt-2">
                        <thead className="bg-gray-50">
                          <tr>
                            {['Test', 'Result', 'Unit', 'Reference', 'Flag'].map((h) => (
                              <th key={h} className="text-left px-2 py-1 font-semibold text-gray-600">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {lab.results.map((r, i) => (
                            <tr key={i} className={`border-t ${r.flag && r.flag !== 'N' ? 'bg-red-50' : ''}`}>
                              <td className="px-2 py-1.5">{r.name}</td>
                              <td className={`px-2 py-1.5 font-semibold ${r.flag && ['H','HH','L','LL'].includes(r.flag) ? 'text-red-600' : ''}`}>
                                {r.value}
                              </td>
                              <td className="px-2 py-1.5 text-gray-500">{r.unit}</td>
                              <td className="px-2 py-1.5 text-gray-500">{r.referenceRange}</td>
                              <td className={`px-2 py-1.5 font-bold ${r.flag && r.flag !== 'N' ? 'text-red-600' : 'text-gray-400'}`}>
                                {r.flag || '—'}
                              </td>
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

        {tab === 'imaging' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Imaging Orders</h3>
              <PermissionGate permission="imaging:order">
                <button onClick={() => navigate(`/imaging?patientId=${patient.id}`)} className="btn-primary text-sm">
                  <Plus size={16} /> Order Imaging
                </button>
              </PermissionGate>
            </div>
            {patient.imagingOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No imaging orders.</p>
            ) : (
              <div className="space-y-4">
                {patient.imagingOrders.map((img) => (
                  <div key={img.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{img.modality} — {img.bodyPart}{img.laterality ? ` (${img.laterality})` : ''}</p>
                        <p className="text-xs text-gray-500">
                          Ordered: {formatDateTime(img.orderedDate)} · By: {img.orderedBy}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">Indication: {img.clinicalIndication}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          img.priority === 'stat' ? 'badge-red' :
                          img.priority === 'urgent' ? 'badge-orange' : 'badge-gray'
                        }`}>
                          {img.priority.toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          img.status === 'completed' ? 'badge-green' :
                          img.status === 'in-progress' ? 'badge-blue' : 'badge-gray'
                        }`}>
                          {img.status}
                        </span>
                      </div>
                    </div>
                    {img.findings && (
                      <div className="mt-2 bg-gray-50 rounded p-3 text-sm">
                        <p className="font-medium text-gray-700 mb-1">Findings:</p>
                        <p className="text-gray-600">{img.findings}</p>
                        {img.impression && (
                          <>
                            <p className="font-medium text-gray-700 mb-1 mt-2">Impression:</p>
                            <p className="text-gray-600">{img.impression}</p>
                          </>
                        )}
                        {img.radiologist && <p className="text-xs text-gray-400 mt-2">Radiologist: {img.radiologist}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Clinical Notes</h3>
              <PermissionGate permission="notes:create">
                <button onClick={() => { setNoteForm({ type: 'progress', isSigned: false }); setEditingNoteId(null); setNoteModal(true); }} className="btn-primary text-sm">
                  <Plus size={16} /> Add Note
                </button>
              </PermissionGate>
            </div>
            {patient.clinicalNotes.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No clinical notes.</p>
            ) : (
              <div className="space-y-4">
                {patient.clinicalNotes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{note.title}</p>
                          <span className="badge-blue text-xs">{note.type}</span>
                          {note.isSigned && <span className="badge-green text-xs flex items-center gap-1"><CheckCircle size={10} /> Signed</span>}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(note.timestamp)} · {note.authorName}
                          {note.isSigned && note.signedAt && ` · Signed ${formatDateTime(note.signedAt)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!note.isSigned && (
                          <>
                            <PermissionGate permission="notes:sign">
                              <button onClick={() => signNote(note.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Sign</button>
                            </PermissionGate>
                            <PermissionGate anyOf={[
                              ...(note.authorId === currentUser?.id ? ['notes:edit_own' as const] : []),
                              'notes:edit_any' as const,
                            ]}>
                              <button
                                onClick={() => { setNoteForm(note); setEditingNoteId(note.id); setNoteModal(true); }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit size={15} />
                              </button>
                            </PermissionGate>
                          </>
                        )}
                      </div>
                    </div>
                    {note.type === 'soap' ? (
                      <div className="space-y-2 text-sm">
                        {[
                          ['Subjective', note.subjective],
                          ['Objective', note.objective],
                          ['Assessment', note.assessment],
                          ['Plan', note.plan],
                        ].map(([label, content]) => content && (
                          <div key={label}>
                            <span className="font-semibold text-gray-700">{label}: </span>
                            <span className="text-gray-600">{content}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 mt-2">{note.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'encounter' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Current Encounter</h3>
              <PermissionGate permission="diagnosis:create">
                <button onClick={() => setDiagnosisModal(true)} className="btn-primary text-sm">
                  <Plus size={16} /> Add Diagnosis
                </button>
              </PermissionGate>
            </div>
            {activeEncounter ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {[
                    ['Type', activeEncounter.encounterType],
                    ['Status', activeEncounter.status],
                    ['Admitted', formatDateTime(activeEncounter.admitDate)],
                    ['Provider', activeEncounter.attendingPhysicianName],
                    ['Room', activeEncounter.roomNumber || '—'],
                    ['Bed', activeEncounter.bedNumber || '—'],
                    ['Chief Complaint', activeEncounter.chiefComplaint],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-gray-500">{k}</p>
                      <p className="font-medium text-gray-900 capitalize">{v}</p>
                    </div>
                  ))}
                </div>

                {activeEncounter.diagnosis && activeEncounter.diagnosis.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Diagnoses</h4>
                    <div className="space-y-2">
                      {activeEncounter.diagnosis.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                          <span className="font-mono text-gray-600 text-xs">{d.code}</span>
                          <span className="flex-1">{d.description}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${d.type === 'primary' ? 'badge-blue' : 'badge-gray'}`}>{d.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'confirmed' ? 'badge-green' : d.status === 'ruled-out' ? 'badge-red' : 'badge-yellow'}`}>{d.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeEncounter.status === 'active' && can('discharge:manage') && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Discharge Planning</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Disposition Plan</label>
                        <textarea
                          className="textarea-field"
                          rows={3}
                          placeholder="Discharge plan, follow-up instructions..."
                          defaultValue={activeEncounter.dispositionPlan || ''}
                          onChange={(e) => updatePatient(patient.id, {
                            encounters: patient.encounters.map((enc) =>
                              enc.id === activeEncounter.id
                                ? { ...enc, dispositionPlan: e.target.value }
                                : enc
                            )
                          })}
                        />
                      </div>
                      <div>
                        <label className="label">Discharge Instructions</label>
                        <textarea
                          className="textarea-field"
                          rows={3}
                          placeholder="Patient instructions..."
                          defaultValue={activeEncounter.dischargeInstructions || ''}
                          onChange={(e) => updatePatient(patient.id, {
                            encounters: patient.encounters.map((enc) =>
                              enc.id === activeEncounter.id
                                ? { ...enc, dischargeInstructions: e.target.value }
                                : enc
                            )
                          })}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => {
                          updatePatient(patient.id, {
                            status: 'discharged',
                            encounters: patient.encounters.map((enc) =>
                              enc.id === activeEncounter.id
                                ? { ...enc, status: 'completed', dischargeDate: new Date().toISOString() }
                                : enc
                            )
                          });
                          addNotification({ type: 'success', title: 'Patient Discharged' });
                        }}
                        className="btn-success"
                      >
                        <CheckCircle size={16} />
                        Complete Discharge
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No active encounter.</p>
            )}
          </div>
        )}
      </div>

      {/* Allergy Modal */}
      <Modal isOpen={allergyModal} onClose={() => setAllergyModal(false)} title={editingAllergyId ? 'Edit Allergy' : 'Add Allergy'}>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Allergen *</label>
            <input
              value={allergyForm.allergen || ''}
              onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
              className="input-field" placeholder="e.g., Penicillin, Latex, Peanuts"
            />
          </div>
          <div>
            <label className="label">Reaction *</label>
            <input
              value={allergyForm.reaction || ''}
              onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
              className="input-field" placeholder="e.g., Rash, Anaphylaxis"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Severity *</label>
              <select
                value={allergyForm.severity || 'moderate'}
                onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value as Allergy['severity'] })}
                className="select-field"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="life-threatening">Life-Threatening</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={allergyForm.status || 'active'}
                onChange={(e) => setAllergyForm({ ...allergyForm, status: e.target.value as Allergy['status'] })}
                className="select-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              value={allergyForm.notes || ''}
              onChange={(e) => setAllergyForm({ ...allergyForm, notes: e.target.value })}
              className="textarea-field" rows={2} placeholder="Additional notes..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAllergyModal(false)} className="btn-secondary">
              <X size={16} /> Cancel
            </button>
            <button onClick={saveAllergy} className="btn-primary">
              <Save size={16} /> Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Clinical Note Modal */}
      <Modal isOpen={noteModal} onClose={() => setNoteModal(false)} title={editingNoteId ? 'Edit Note' : 'New Clinical Note'} size="xl">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Note Title *</label>
              <input
                value={noteForm.title || ''}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                className="input-field" placeholder="Note title"
              />
            </div>
            <div>
              <label className="label">Note Type</label>
              <select
                value={noteForm.type || 'progress'}
                onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value as ClinicalNote['type'] })}
                className="select-field"
              >
                <option value="progress">Progress Note</option>
                <option value="soap">SOAP Note</option>
                <option value="triage">Triage Note</option>
                <option value="discharge">Discharge Note</option>
                <option value="consultation">Consultation</option>
                <option value="nursing">Nursing Note</option>
              </select>
            </div>
          </div>
          {noteForm.type === 'soap' ? (
            <>
              <div>
                <label className="label">Subjective</label>
                <textarea
                  value={noteForm.subjective || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, subjective: e.target.value })}
                  className="textarea-field" rows={3} placeholder="Patient's complaints, history..."
                />
              </div>
              <div>
                <label className="label">Objective</label>
                <textarea
                  value={noteForm.objective || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, objective: e.target.value })}
                  className="textarea-field" rows={3} placeholder="Physical exam, vital signs, test results..."
                />
              </div>
              <div>
                <label className="label">Assessment</label>
                <textarea
                  value={noteForm.assessment || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, assessment: e.target.value })}
                  className="textarea-field" rows={2} placeholder="Diagnosis, differential..."
                />
              </div>
              <div>
                <label className="label">Plan</label>
                <textarea
                  value={noteForm.plan || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, plan: e.target.value })}
                  className="textarea-field" rows={3} placeholder="Treatment plan, medications, orders..."
                />
              </div>
            </>
          ) : (
            <div>
              <label className="label">Note Content</label>
              <textarea
                value={noteForm.content || ''}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                className="textarea-field" rows={8} placeholder="Enter clinical note..."
              />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setNoteModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={saveNote} className="btn-primary"><Save size={16} />Save Note</button>
          </div>
        </div>
      </Modal>

      {/* Diagnosis Modal */}
      <Modal isOpen={diagnosisModal} onClose={() => setDiagnosisModal(false)} title="Add Diagnosis">
        <div className="p-6 space-y-4">
          <div>
            <label className="label">ICD-10 Code *</label>
            <input
              value={diagForm.code || ''}
              onChange={(e) => setDiagForm({ ...diagForm, code: e.target.value })}
              className="input-field" placeholder="e.g., I21.9, J18.9"
            />
          </div>
          <div>
            <label className="label">Description *</label>
            <input
              value={diagForm.description || ''}
              onChange={(e) => setDiagForm({ ...diagForm, description: e.target.value })}
              className="input-field" placeholder="Diagnosis description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select value={diagForm.type || 'primary'} onChange={(e) => setDiagForm({ ...diagForm, type: e.target.value as Diagnosis['type'] })} className="select-field">
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="differential">Differential</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={diagForm.status || 'suspected'} onChange={(e) => setDiagForm({ ...diagForm, status: e.target.value as Diagnosis['status'] })} className="select-field">
                <option value="suspected">Suspected</option>
                <option value="confirmed">Confirmed</option>
                <option value="ruled-out">Ruled Out</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDiagnosisModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={saveDiagnosis} className="btn-primary"><Save size={16} />Add Diagnosis</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm?.type === 'allergy') {
            deleteAllergy(patient.id, deleteConfirm.id);
            addNotification({ type: 'success', title: 'Allergy removed' });
          }
        }}
        title="Confirm Delete"
        message="Are you sure you want to delete this record? This action cannot be undone."
      />
    </div>
  );
}

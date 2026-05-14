import { useState } from 'react';
import { Baby, Heart, Plus, Save, X, Edit, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useMaternityStore } from '../store/maternityStore';
import { usePatientStore } from '../store/patientStore';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import { PermissionGate } from '../components/ui/PermissionGate';
import Modal from '../components/ui/Modal';
import { getPatientFullName, formatDate } from '../utils/helpers';
import type {
  AntenatalBooking, AntenatalVisit, PostnatalAssessment, PaediatricRecord,
  PreviousPregnancy, DevelopmentalMilestones
} from '../types/maternity';

type MainTab = 'antenatal' | 'postnatal' | 'paediatric';

const emptyMilestones = (): DevelopmentalMilestones => ({
  grossMotor: 'not-assessed', fineMotor: 'not-assessed', speech: 'not-assessed', socialCognitive: 'not-assessed',
});

export default function MaternityPage() {
  const { bookings, antenatalVisits, postnatalAssessments, paediatricRecords,
    addBooking, updateBooking, addAntenatalVisit, addPostnatalAssessment,
    addPaediatricRecord, updatePaediatricRecord } = useMaternityStore();
  const { patients } = usePatientStore();
  const { currentUser } = useStaffStore();
  const { addNotification } = useUIStore();

  const [mainTab, setMainTab] = useState<MainTab>('antenatal');
  const [patientSearch, setPatientSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const staffName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Staff';

  // Booking modal
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState<Partial<AntenatalBooking>>({
    gestationalAgeWeeks: 12, gestationalAgeDays: 0, gravida: 1, para: 0,
    bloodGroup: 'Unknown', rhesusStatus: 'unknown', rubella: 'unknown',
    hepatitisB: 'unknown', hepatitisC: 'unknown', hiv: 'unknown', syphilis: 'unknown',
    smokingStatus: 'never', alcoholUse: 'none', domesticViolenceScreening: 'screened-safe',
    carePathway: 'low-risk', previousPregnancies: [], bookingMidwife: staffName,
    notes: '',
  });
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [bookingPatientId, setBookingPatientId] = useState('');
  const [prevPregForm, setPrevPregForm] = useState<Partial<PreviousPregnancy>>({ outcome: 'livebirth' });

  // Antenatal visit modal
  const [visitModal, setVisitModal] = useState(false);
  const [visitForm, setVisitForm] = useState<Partial<AntenatalVisit>>({ seenBy: staffName });
  const [visitBookingId, setVisitBookingId] = useState('');

  // Postnatal modal
  const [postnatalModal, setPostnatalModal] = useState(false);
  const [postnatalForm, setPostnatalForm] = useState<Partial<PostnatalAssessment>>({
    seenBy: staffName, fundus: 'involuting-normally', lochia: 'normal-rubra',
    urination: 'normal', bowels: 'opened', breastfeeding: 'formula-only',
    emotionalWellbeing: 'well', contraceptionDiscussed: false,
    deliveryMode: 'spontaneous-vaginal',
  });
  const [postnatalPatientId, setPostnatalPatientId] = useState('');

  // Paediatric modal
  const [paedModal, setPaedModal] = useState(false);
  const [paedForm, setPaedForm] = useState<Partial<PaediatricRecord>>({
    seenBy: staffName, assessmentType: 'routine-review', ageYears: 0, ageMonths: 0,
    weight: 0, developmentalMilestones: emptyMilestones(), immunisationsUpToDate: true,
    clinicalFindings: '', plan: '', safeguardingConcerns: false,
  });
  const [paedPatientId, setPaedPatientId] = useState('');
  const [editingPaedId, setEditingPaedId] = useState<string | null>(null);

  function getPatient(id: string) {
    return patients.find((p) => p.id === id);
  }

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch) return true;
    const q = patientSearch.toLowerCase();
    return getPatientFullName(p).toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q);
  });

  // ---- Booking save ----
  function saveBooking() {
    if (!bookingPatientId || !bookingForm.lmpDate) return;
    if (editingBookingId) {
      updateBooking(editingBookingId, { ...bookingForm });
    } else {
      addBooking({
        ...(bookingForm as Omit<AntenatalBooking, 'id' | 'createdAt' | 'updatedAt'>),
        patientId: bookingPatientId,
        bookingDate: new Date().toISOString(),
        bmi: bookingForm.height && bookingForm.weightBooking
          ? +(bookingForm.weightBooking / ((bookingForm.height / 100) ** 2)).toFixed(1)
          : 0,
      });
    }
    setBookingModal(false);
    addNotification({ type: 'success', title: 'Antenatal booking saved' });
  }

  function addPrevPreg() {
    if (!prevPregForm.outcome) return;
    setBookingForm((prev) => ({
      ...prev,
      previousPregnancies: [...(prev.previousPregnancies || []), prevPregForm as PreviousPregnancy],
    }));
    setPrevPregForm({ outcome: 'livebirth' });
  }

  // ---- Visit save ----
  function saveVisit() {
    if (!visitBookingId) return;
    const booking = bookings.find((b) => b.id === visitBookingId);
    if (!booking) return;
    addAntenatalVisit({ ...(visitForm as Omit<AntenatalVisit, 'id'>), patientId: booking.patientId, bookingId: visitBookingId, visitDate: new Date().toISOString() });
    setVisitModal(false);
    addNotification({ type: 'success', title: 'Antenatal visit recorded' });
  }

  // ---- Postnatal save ----
  function savePostnatal() {
    if (!postnatalPatientId) return;
    addPostnatalAssessment({ ...(postnatalForm as Omit<PostnatalAssessment, 'id' | 'createdAt'>), patientId: postnatalPatientId, assessmentDate: new Date().toISOString() });
    setPostnatalModal(false);
    addNotification({ type: 'success', title: 'Postnatal assessment saved' });
  }

  // ---- Paediatric save ----
  function savePaediatric() {
    if (!paedPatientId) return;
    if (editingPaedId) {
      updatePaediatricRecord(editingPaedId, paedForm);
    } else {
      addPaediatricRecord({ ...(paedForm as Omit<PaediatricRecord, 'id' | 'createdAt'>), patientId: paedPatientId, assessmentDate: new Date().toISOString() });
    }
    setPaedModal(false);
    addNotification({ type: 'success', title: 'Paediatric record saved' });
  }

  const SF = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Baby size={20} className="text-pink-600" /> Maternity & Paediatric Care
          </h1>
          <p className="text-sm text-gray-500">{bookings.length} antenatal bookings · {postnatalAssessments.length} postnatal assessments · {paediatricRecords.length} paediatric records</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
        {([
          { id: 'antenatal', label: 'Antenatal', icon: Heart },
          { id: 'postnatal', label: 'Postnatal', icon: Heart },
          { id: 'paediatric', label: 'Paediatric / Child', icon: Baby },
        ] as { id: MainTab; label: string; icon: React.ComponentType<{ size?: number }> }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMainTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${mainTab === id ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ===== ANTENATAL ===== */}
      {mainTab === 'antenatal' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Search patient..." className="input-field pl-9" />
            </div>
            <PermissionGate permission="maternity:create">
              <button onClick={() => { setEditingBookingId(null); setBookingPatientId(''); setBookingModal(true); }} className="btn-primary">
                <Plus size={16} /> New Booking
              </button>
            </PermissionGate>
            <PermissionGate permission="maternity:create">
              <button onClick={() => { setVisitBookingId(''); setVisitForm({ seenBy: staffName }); setVisitModal(true); }} className="btn-secondary">
                <Plus size={16} /> Record Visit
              </button>
            </PermissionGate>
          </div>

          {bookings.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <Heart size={48} className="mx-auto mb-2 opacity-30" />
              <p>No antenatal bookings yet. Click "New Booking" to register a pregnant patient.</p>
            </div>
          ) : bookings.map((b) => {
            const patient = getPatient(b.patientId);
            const visits = antenatalVisits.filter((v) => v.bookingId === b.id).sort((a, z) => new Date(z.visitDate).getTime() - new Date(a.visitDate).getTime());
            const isExpanded = expandedId === b.id;
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : b.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{patient ? getPatientFullName(patient) : b.patientId}</span>
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">G{b.gravida} P{b.para}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{b.gestationalAgeWeeks}+{b.gestationalAgeDays} weeks at booking</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.carePathway === 'low-risk' ? 'bg-green-100 text-green-700' : b.carePathway === 'consultant-led' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {b.carePathway}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      EDD (LMP): {formatDate(b.eddByLmp)} {b.eddByUltrasound && `· EDD (USS): ${formatDate(b.eddByUltrasound)}`} · Booked: {formatDate(b.bookingDate)} · {b.bookingMidwife}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PermissionGate permission="maternity:edit">
                      <button onClick={(e) => { e.stopPropagation(); setEditingBookingId(b.id); setBookingPatientId(b.patientId); setBookingForm(b); setBookingModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit size={15} />
                      </button>
                    </PermissionGate>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {[
                        ['Blood Group', `${b.bloodGroup} (${b.rhesusStatus})`],
                        ['Rubella', b.rubella], ['HBsAg', b.hepatitisB], ['HIV', b.hiv],
                        ['BMI', b.bmi], ['Smoking', b.smokingStatus], ['Care Pathway', b.carePathway],
                        ['DV Screening', b.domesticViolenceScreening],
                      ].map(([k, v]) => (
                        <div key={k as string}>
                          <p className="text-xs text-gray-500">{k}</p>
                          <p className="font-medium text-gray-800 capitalize">{v}</p>
                        </div>
                      ))}
                    </div>
                    {b.notes && <p className="text-sm text-gray-600 bg-white rounded p-3 border">{b.notes}</p>}
                    {b.previousPregnancies.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Previous Pregnancies</p>
                        <div className="space-y-1">
                          {b.previousPregnancies.map((pp, i) => (
                            <p key={i} className="text-xs text-gray-600 bg-white rounded p-2 border">
                              {pp.year} — {pp.outcome} {pp.gestation && `(${pp.gestation})`} {pp.mode && `· ${pp.mode}`} {pp.birthWeight && `· ${pp.birthWeight}g`} {pp.complications && `· ${pp.complications}`}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">Antenatal Visits ({visits.length})</p>
                        <PermissionGate permission="maternity:create">
                          <button onClick={() => { setVisitBookingId(b.id); setVisitForm({ seenBy: staffName, gestationalWeeks: b.gestationalAgeWeeks, gestationalDays: b.gestationalAgeDays }); setVisitModal(true); }} className="text-xs btn-secondary py-1">
                            <Plus size={12} /> Add Visit
                          </button>
                        </PermissionGate>
                      </div>
                      {visits.length === 0 ? <p className="text-xs text-gray-400">No visits recorded yet.</p> : (
                        <div className="space-y-2">
                          {visits.map((v) => (
                            <div key={v.id} className="bg-white rounded-lg p-3 border border-gray-200 text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium text-gray-800">{formatDate(v.visitDate)}</span>
                                  <span className="text-gray-500 ml-2">{v.gestationalWeeks}+{v.gestationalDays} weeks</span>
                                  <span className="text-gray-400 ml-2 text-xs">· {v.seenBy}</span>
                                </div>
                                {v.bloodPressureSystolic && (
                                  <span className={`text-xs font-medium ${v.bloodPressureSystolic >= 140 ? 'text-red-600' : 'text-gray-600'}`}>
                                    BP: {v.bloodPressureSystolic}/{v.bloodPressureDiastolic}
                                  </span>
                                )}
                              </div>
                              {v.clinicalFindings && <p className="text-xs text-gray-600 mt-1">{v.clinicalFindings}</p>}
                              {v.plan && <p className="text-xs text-blue-700 mt-1">Plan: {v.plan}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== POSTNATAL ===== */}
      {mainTab === 'postnatal' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <PermissionGate permission="maternity:create">
              <button onClick={() => { setPostnatalPatientId(''); setPostnatalForm({ seenBy: staffName, fundus: 'involuting-normally', lochia: 'normal-rubra', urination: 'normal', bowels: 'opened', breastfeeding: 'formula-only', emotionalWellbeing: 'well', contraceptionDiscussed: false, deliveryMode: 'spontaneous-vaginal', daysPostnatal: 1, deliveredBy: '', gestationAtDelivery: 40, deliveryDate: new Date().toISOString(), plan: '' }); setPostnatalModal(true); }} className="btn-primary">
                <Plus size={16} /> New Postnatal Assessment
              </button>
            </PermissionGate>
          </div>
          {postnatalAssessments.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <Heart size={48} className="mx-auto mb-2 opacity-30" />
              <p>No postnatal assessments recorded.</p>
            </div>
          ) : postnatalAssessments.map((a) => {
            const patient = getPatient(a.patientId);
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{patient ? getPatientFullName(patient) : a.patientId}</p>
                    <p className="text-sm text-gray-500">Day {a.daysPostnatal} postnatal · {a.deliveryMode.replace(/-/g, ' ')} · {formatDate(a.assessmentDate)} · {a.seenBy}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.emotionalWellbeing === 'well' ? 'bg-green-100 text-green-700' : a.emotionalWellbeing === 'mildly-low' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {a.emotionalWellbeing}
                    </span>
                    {expandedId === a.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
                {expandedId === a.id && (
                  <div className="border-t p-4 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {[
                        ['Fundus', a.fundus], ['Lochia', a.lochia], ['Urination', a.urination],
                        ['Bowels', a.bowels], ['Breastfeeding', a.breastfeeding], ['Edinburgh Score', a.edinburghScore ?? '—'],
                        ['Contraception', a.contraceptionChosen || (a.contraceptionDiscussed ? 'Discussed' : 'Not discussed')],
                      ].map(([k, v]) => (
                        <div key={k as string}>
                          <p className="text-xs text-gray-500">{k}</p>
                          <p className="font-medium text-gray-800 capitalize">{String(v).replace(/-/g, ' ')}</p>
                        </div>
                      ))}
                    </div>
                    {a.newbornDetails && (
                      <div className="bg-pink-50 rounded-lg p-3">
                        <p className="font-semibold text-pink-800 mb-1 text-sm">Newborn Details</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <p><span className="text-gray-500">Sex:</span> {a.newbornDetails.sex}</p>
                          <p><span className="text-gray-500">Birth weight:</span> {a.newbornDetails.birthWeight}g</p>
                          <p><span className="text-gray-500">Apgar 1min:</span> {a.newbornDetails.apgar1 ?? '—'}</p>
                          <p><span className="text-gray-500">Apgar 5min:</span> {a.newbornDetails.apgar5 ?? '—'}</p>
                          <p><span className="text-gray-500">Neonatal outcome:</span> {a.newbornDetails.neonatalOutcome}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-700 bg-white rounded p-3 border"><strong>Plan:</strong> {a.plan}</p>
                    {a.notes && <p className="text-sm text-gray-600">{a.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== PAEDIATRIC ===== */}
      {mainTab === 'paediatric' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <PermissionGate permission="maternity:create">
              <button onClick={() => { setPaedPatientId(''); setEditingPaedId(null); setPaedForm({ seenBy: staffName, assessmentType: 'routine-review', ageYears: 0, ageMonths: 0, weight: 0, developmentalMilestones: emptyMilestones(), immunisationsUpToDate: true, clinicalFindings: '', plan: '', safeguardingConcerns: false }); setPaedModal(true); }} className="btn-primary">
                <Plus size={16} /> New Paediatric Record
              </button>
            </PermissionGate>
          </div>
          {paediatricRecords.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <Baby size={48} className="mx-auto mb-2 opacity-30" />
              <p>No paediatric records found. Click "New Paediatric Record" to add one.</p>
            </div>
          ) : paediatricRecords.map((r) => {
            const patient = getPatient(r.patientId);
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{patient ? getPatientFullName(patient) : r.patientId}</p>
                    <p className="text-sm text-gray-500">
                      {r.ageYears}y {r.ageMonths}m · {r.assessmentType.replace(/-/g, ' ')} · {formatDate(r.assessmentDate)} · {r.seenBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.safeguardingConcerns && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Safeguarding</span>
                    )}
                    <span className="text-sm font-medium text-gray-700">{r.weight}kg</span>
                    <PermissionGate permission="maternity:edit">
                      <button onClick={(e) => { e.stopPropagation(); setPaedPatientId(r.patientId); setEditingPaedId(r.id); setPaedForm(r); setPaedModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit size={15} />
                      </button>
                    </PermissionGate>
                    {expandedId === r.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
                {expandedId === r.id && (
                  <div className="border-t p-4 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {[
                        ['Weight', `${r.weight}kg ${r.weightCentile ? `(${r.weightCentile})` : ''}`],
                        ['Height', r.height ? `${r.height}cm ${r.heightCentile ? `(${r.heightCentile})` : ''}` : '—'],
                        ['Head Circ', r.headCircumference ? `${r.headCircumference}cm` : '—'],
                        ['HR', r.heartRate ? `${r.heartRate}bpm` : '—'],
                        ['RR', r.respiratoryRate ? `${r.respiratoryRate}/min` : '—'],
                        ['SpO2', r.oxygenSaturation ? `${r.oxygenSaturation}%` : '—'],
                        ['Temp', r.temperature ? `${r.temperature}°C` : '—'],
                      ].map(([k, v]) => (
                        <div key={k as string}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-gray-800">{v}</p></div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Developmental Milestones</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {Object.entries(r.developmentalMilestones).filter(([k]) => k !== 'notes').map(([k, v]) => (
                          <span key={k} className={`px-2 py-1 rounded-full ${v === 'delayed' ? 'bg-red-100 text-red-700' : v === 'age-appropriate' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {k.replace(/([A-Z])/g, ' $1')}: {String(v).replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded-lg p-3 border"><strong>Clinical Findings:</strong> {r.clinicalFindings || '—'}</div>
                      <div className="bg-white rounded-lg p-3 border"><strong>Plan:</strong> {r.plan || '—'}</div>
                    </div>
                    {r.immunisationsGivenToday && <p className="text-xs text-blue-700">Immunisations today: {r.immunisationsGivenToday}</p>}
                    {r.safeguardingConcerns && r.safeguardingNotes && <p className="text-xs text-red-700 font-medium bg-red-50 p-2 rounded">Safeguarding: {r.safeguardingNotes}</p>}
                    {r.referrals && <p className="text-xs text-gray-600">Referrals: {r.referrals}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== ANTENATAL BOOKING MODAL ===== */}
      <Modal isOpen={bookingModal} onClose={() => setBookingModal(false)} title={editingBookingId ? 'Edit Antenatal Booking' : 'New Antenatal Booking'} size="xl">
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {!editingBookingId && (
            <SF label="Select Patient *">
              <div className="mb-2"><input placeholder="Search patient..." onChange={(e) => setPatientSearch(e.target.value)} className="input-field" /></div>
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {filteredPatients.map((p) => (
                  <button key={p.id} onClick={() => setBookingPatientId(p.id)} className={`w-full text-left p-2 text-sm hover:bg-blue-50 ${bookingPatientId === p.id ? 'bg-blue-50 font-medium text-blue-700' : ''}`}>
                    {getPatientFullName(p)} — {p.mrn}
                  </button>
                ))}
              </div>
            </SF>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SF label="LMP Date *"><input type="date" value={bookingForm.lmpDate?.slice(0, 10) || ''} onChange={(e) => setBookingForm({ ...bookingForm, lmpDate: e.target.value })} className="input-field" /></SF>
            <SF label="EDD (LMP)"><input type="date" value={bookingForm.eddByLmp?.slice(0, 10) || ''} onChange={(e) => setBookingForm({ ...bookingForm, eddByLmp: e.target.value })} className="input-field" /></SF>
            <SF label="EDD (Ultrasound)"><input type="date" value={bookingForm.eddByUltrasound?.slice(0, 10) || ''} onChange={(e) => setBookingForm({ ...bookingForm, eddByUltrasound: e.target.value })} className="input-field" /></SF>
            <SF label="Gestational Age (weeks)"><input type="number" min={4} max={42} value={bookingForm.gestationalAgeWeeks || 12} onChange={(e) => setBookingForm({ ...bookingForm, gestationalAgeWeeks: +e.target.value })} className="input-field" /></SF>
            <SF label="Gestational Age (days)"><input type="number" min={0} max={6} value={bookingForm.gestationalAgeDays || 0} onChange={(e) => setBookingForm({ ...bookingForm, gestationalAgeDays: +e.target.value })} className="input-field" /></SF>
            <SF label="Gravida"><input type="number" min={1} value={bookingForm.gravida || 1} onChange={(e) => setBookingForm({ ...bookingForm, gravida: +e.target.value })} className="input-field" /></SF>
            <SF label="Para"><input type="number" min={0} value={bookingForm.para || 0} onChange={(e) => setBookingForm({ ...bookingForm, para: +e.target.value })} className="input-field" /></SF>
            <SF label="Height (cm)"><input type="number" value={bookingForm.height || ''} onChange={(e) => setBookingForm({ ...bookingForm, height: +e.target.value })} className="input-field" placeholder="165" /></SF>
            <SF label="Weight at Booking (kg)"><input type="number" step="0.1" value={bookingForm.weightBooking || ''} onChange={(e) => setBookingForm({ ...bookingForm, weightBooking: +e.target.value })} className="input-field" placeholder="65" /></SF>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Blood Group', key: 'bloodGroup', options: ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'] },
              { label: 'Rhesus', key: 'rhesusStatus', options: ['positive','negative','unknown'] },
              { label: 'Rubella', key: 'rubella', options: ['immune','non-immune','unknown'] },
              { label: 'HBsAg', key: 'hepatitisB', options: ['positive','negative','unknown'] },
              { label: 'Hepatitis C', key: 'hepatitisC', options: ['positive','negative','unknown'] },
              { label: 'HIV', key: 'hiv', options: ['positive','negative','declined','unknown'] },
              { label: 'Syphilis', key: 'syphilis', options: ['positive','negative','unknown'] },
              { label: 'Care Pathway', key: 'carePathway', options: ['low-risk','shared-care','consultant-led'] },
            ].map(({ label, key, options }) => (
              <SF key={key} label={label}>
                <select value={(bookingForm as Record<string, unknown>)[key] as string || ''} onChange={(e) => setBookingForm({ ...bookingForm, [key]: e.target.value })} className="select-field">
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </SF>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SF label="Smoking Status">
              <select value={bookingForm.smokingStatus || 'never'} onChange={(e) => setBookingForm({ ...bookingForm, smokingStatus: e.target.value as 'never' })} className="select-field">
                <option value="never">Never</option><option value="current">Current smoker</option><option value="ex-smoker">Ex-smoker</option>
              </select>
            </SF>
            <SF label="Alcohol Use">
              <select value={bookingForm.alcoholUse || 'none'} onChange={(e) => setBookingForm({ ...bookingForm, alcoholUse: e.target.value as 'none' })} className="select-field">
                <option value="none">None</option><option value="occasional">Occasional</option><option value="regular">Regular</option>
              </select>
            </SF>
            <SF label="DV Screening">
              <select value={bookingForm.domesticViolenceScreening || 'screened-safe'} onChange={(e) => setBookingForm({ ...bookingForm, domesticViolenceScreening: e.target.value as 'screened-safe' })} className="select-field">
                <option value="screened-safe">Screened — safe</option><option value="screened-concern">Screened — concern</option><option value="declined">Declined screening</option>
              </select>
            </SF>
          </div>
          <SF label="Medical History / Past Obstetric History"><textarea value={bookingForm.medicalHistory || ''} onChange={(e) => setBookingForm({ ...bookingForm, medicalHistory: e.target.value })} className="textarea-field" rows={3} /></SF>
          <SF label="Current Medications"><textarea value={bookingForm.currentMedications || ''} onChange={(e) => setBookingForm({ ...bookingForm, currentMedications: e.target.value })} className="textarea-field" rows={2} /></SF>
          <SF label="Allergies"><input value={bookingForm.allergies || ''} onChange={(e) => setBookingForm({ ...bookingForm, allergies: e.target.value })} className="input-field" placeholder="Drug / food allergies" /></SF>
          <SF label="Family History"><textarea value={bookingForm.familyHistory || ''} onChange={(e) => setBookingForm({ ...bookingForm, familyHistory: e.target.value })} className="textarea-field" rows={2} /></SF>
          <SF label="Social History"><textarea value={bookingForm.socialHistory || ''} onChange={(e) => setBookingForm({ ...bookingForm, socialHistory: e.target.value })} className="textarea-field" rows={2} /></SF>
          <SF label="Booking Notes"><textarea value={bookingForm.notes || ''} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} className="textarea-field" rows={3} /></SF>

          {/* Previous Pregnancies */}
          <div>
            <p className="label mb-2">Previous Pregnancies</p>
            {bookingForm.previousPregnancies?.map((pp, i) => (
              <p key={i} className="text-xs bg-gray-50 rounded p-2 mb-1">{pp.year} — {pp.outcome} {pp.gestation && `(${pp.gestation})`}</p>
            ))}
            <div className="flex gap-2 mt-2 flex-wrap">
              <input placeholder="Year" value={prevPregForm.year || ''} onChange={(e) => setPrevPregForm({ ...prevPregForm, year: e.target.value })} className="input-field w-20" />
              <select value={prevPregForm.outcome || 'livebirth'} onChange={(e) => setPrevPregForm({ ...prevPregForm, outcome: e.target.value as PreviousPregnancy['outcome'] })} className="select-field w-36">
                {['livebirth','stillbirth','miscarriage','termination','ectopic','molar'].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <input placeholder="Gestation (e.g. 39+2)" value={prevPregForm.gestation || ''} onChange={(e) => setPrevPregForm({ ...prevPregForm, gestation: e.target.value })} className="input-field w-36" />
              <input placeholder="Birth weight (g)" value={prevPregForm.birthWeight || ''} onChange={(e) => setPrevPregForm({ ...prevPregForm, birthWeight: e.target.value })} className="input-field w-32" />
              <button onClick={addPrevPreg} className="btn-secondary text-xs py-1">+ Add</button>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setBookingModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={saveBooking} className="btn-primary"><Save size={16} />Save Booking</button>
          </div>
        </div>
      </Modal>

      {/* ===== ANTENATAL VISIT MODAL ===== */}
      <Modal isOpen={visitModal} onClose={() => setVisitModal(false)} title="Record Antenatal Visit" size="lg">
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <SF label="Select Booking">
            <select value={visitBookingId} onChange={(e) => setVisitBookingId(e.target.value)} className="select-field">
              <option value="">— Select Booking —</option>
              {bookings.map((b) => {
                const p = getPatient(b.patientId);
                return <option key={b.id} value={b.id}>{p ? getPatientFullName(p) : b.patientId} — EDD {formatDate(b.eddByLmp)}</option>;
              })}
            </select>
          </SF>
          <div className="grid grid-cols-2 gap-4">
            <SF label="Gestational Weeks"><input type="number" min={4} max={42} value={visitForm.gestationalWeeks || ''} onChange={(e) => setVisitForm({ ...visitForm, gestationalWeeks: +e.target.value })} className="input-field" /></SF>
            <SF label="Gestational Days"><input type="number" min={0} max={6} value={visitForm.gestationalDays || 0} onChange={(e) => setVisitForm({ ...visitForm, gestationalDays: +e.target.value })} className="input-field" /></SF>
            <SF label="BP (sys)"><input type="number" value={visitForm.bloodPressureSystolic || ''} onChange={(e) => setVisitForm({ ...visitForm, bloodPressureSystolic: +e.target.value })} className="input-field" placeholder="e.g. 120" /></SF>
            <SF label="BP (dia)"><input type="number" value={visitForm.bloodPressureDiastolic || ''} onChange={(e) => setVisitForm({ ...visitForm, bloodPressureDiastolic: +e.target.value })} className="input-field" placeholder="e.g. 80" /></SF>
            <SF label="Weight (kg)"><input type="number" step="0.1" value={visitForm.weight || ''} onChange={(e) => setVisitForm({ ...visitForm, weight: +e.target.value })} className="input-field" /></SF>
            <SF label="Fundal Height (cm)"><input type="number" value={visitForm.fundalHeight || ''} onChange={(e) => setVisitForm({ ...visitForm, fundalHeight: +e.target.value })} className="input-field" /></SF>
            <SF label="Fetal Heart Rate (bpm)"><input type="number" value={visitForm.fetalHeartRate || ''} onChange={(e) => setVisitForm({ ...visitForm, fetalHeartRate: +e.target.value })} className="input-field" placeholder="e.g. 145" /></SF>
            <SF label="Fetal Presentation">
              <select value={visitForm.fetalPresentation || 'unknown'} onChange={(e) => setVisitForm({ ...visitForm, fetalPresentation: e.target.value as AntenatalVisit['fetalPresentation'] })} className="select-field">
                <option value="unknown">Unknown</option><option value="cephalic">Cephalic</option><option value="breech">Breech</option><option value="transverse">Transverse</option><option value="oblique">Oblique</option>
              </select>
            </SF>
            <SF label="Fetal Movements">
              <select value={visitForm.fetalMovements || 'normal'} onChange={(e) => setVisitForm({ ...visitForm, fetalMovements: e.target.value as AntenatalVisit['fetalMovements'] })} className="select-field">
                <option value="normal">Normal</option><option value="reduced">Reduced</option><option value="absent">Absent</option>
              </select>
            </SF>
            <SF label="Urinalysis"><input value={visitForm.urinalysis || ''} onChange={(e) => setVisitForm({ ...visitForm, urinalysis: e.target.value })} className="input-field" placeholder="e.g. NAD, protein +1" /></SF>
            <SF label="Oedema">
              <select value={visitForm.oedema || 'none'} onChange={(e) => setVisitForm({ ...visitForm, oedema: e.target.value as AntenatalVisit['oedema'] })} className="select-field">
                <option value="none">None</option><option value="ankles">Ankles only</option><option value="generalised">Generalised</option>
              </select>
            </SF>
            <SF label="Next Appointment"><input type="date" value={visitForm.nextAppointment?.slice(0, 10) || ''} onChange={(e) => setVisitForm({ ...visitForm, nextAppointment: e.target.value })} className="input-field" /></SF>
          </div>
          <SF label="Clinical Findings"><textarea value={visitForm.clinicalFindings || ''} onChange={(e) => setVisitForm({ ...visitForm, clinicalFindings: e.target.value })} className="textarea-field" rows={3} /></SF>
          <SF label="Investigations / Results"><textarea value={visitForm.investigations || ''} onChange={(e) => setVisitForm({ ...visitForm, investigations: e.target.value })} className="textarea-field" rows={2} /></SF>
          <SF label="Plan"><textarea value={visitForm.plan || ''} onChange={(e) => setVisitForm({ ...visitForm, plan: e.target.value })} className="textarea-field" rows={3} /></SF>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setVisitModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={saveVisit} className="btn-primary"><Save size={16} />Save Visit</button>
          </div>
        </div>
      </Modal>

      {/* ===== POSTNATAL MODAL ===== */}
      <Modal isOpen={postnatalModal} onClose={() => setPostnatalModal(false)} title="Postnatal Assessment" size="xl">
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <SF label="Select Patient *">
            <div className="mb-2"><input placeholder="Search..." onChange={(e) => setPatientSearch(e.target.value)} className="input-field" /></div>
            <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
              {filteredPatients.map((p) => (
                <button key={p.id} onClick={() => setPostnatalPatientId(p.id)} className={`w-full text-left p-2 text-sm hover:bg-blue-50 ${postnatalPatientId === p.id ? 'bg-blue-50 font-medium text-blue-700' : ''}`}>
                  {getPatientFullName(p)} — {p.mrn}
                </button>
              ))}
            </div>
          </SF>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SF label="Delivery Date"><input type="date" value={postnatalForm.deliveryDate?.slice(0, 10) || ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, deliveryDate: e.target.value })} className="input-field" /></SF>
            <SF label="Days Postnatal"><input type="number" min={0} value={postnatalForm.daysPostnatal || 1} onChange={(e) => setPostnatalForm({ ...postnatalForm, daysPostnatal: +e.target.value })} className="input-field" /></SF>
            <SF label="Gestation at Delivery (weeks)"><input type="number" min={20} max={44} value={postnatalForm.gestationAtDelivery || 40} onChange={(e) => setPostnatalForm({ ...postnatalForm, gestationAtDelivery: +e.target.value })} className="input-field" /></SF>
            <SF label="Mode of Delivery">
              <select value={postnatalForm.deliveryMode || 'spontaneous-vaginal'} onChange={(e) => setPostnatalForm({ ...postnatalForm, deliveryMode: e.target.value as PostnatalAssessment['deliveryMode'] })} className="select-field">
                <option value="spontaneous-vaginal">Spontaneous Vaginal</option>
                <option value="assisted-vaginal">Assisted Vaginal (Forceps/Ventouse)</option>
                <option value="elective-cs">Elective Caesarean</option>
                <option value="emergency-cs">Emergency Caesarean</option>
              </select>
            </SF>
            <SF label="Delivered By"><input value={postnatalForm.deliveredBy || ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, deliveredBy: e.target.value })} className="input-field" placeholder="Midwife / Obstetrician name" /></SF>
            <SF label="Blood Pressure"><input value={postnatalForm.bloodPressure || ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, bloodPressure: e.target.value })} className="input-field" placeholder="120/80" /></SF>
            <SF label="Fundus">
              <select value={postnatalForm.fundus || 'involuting-normally'} onChange={(e) => setPostnatalForm({ ...postnatalForm, fundus: e.target.value as PostnatalAssessment['fundus'] })} className="select-field">
                <option value="involuting-normally">Involuting normally</option>
                <option value="not-involuting">Not involuting as expected</option>
                <option value="not-palpable">Not palpable</option>
              </select>
            </SF>
            <SF label="Lochia">
              <select value={postnatalForm.lochia || 'normal-rubra'} onChange={(e) => setPostnatalForm({ ...postnatalForm, lochia: e.target.value as PostnatalAssessment['lochia'] })} className="select-field">
                <option value="normal-rubra">Normal (rubra)</option>
                <option value="normal-serosa">Normal (serosa)</option>
                <option value="normal-alba">Normal (alba)</option>
                <option value="heavy">Heavy</option>
                <option value="offensive">Offensive odour</option>
                <option value="absent">Absent</option>
              </select>
            </SF>
            <SF label="Emotional Wellbeing">
              <select value={postnatalForm.emotionalWellbeing || 'well'} onChange={(e) => setPostnatalForm({ ...postnatalForm, emotionalWellbeing: e.target.value as PostnatalAssessment['emotionalWellbeing'] })} className="select-field">
                <option value="well">Well / Good</option>
                <option value="mildly-low">Mildly low mood</option>
                <option value="moderately-low">Moderately low mood</option>
                <option value="severely-low">Severely low mood</option>
              </select>
            </SF>
            <SF label="Edinburgh PND Score"><input type="number" min={0} max={30} value={postnatalForm.edinburghScore ?? ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, edinburghScore: +e.target.value })} className="input-field" placeholder="0–30" /></SF>
            <SF label="Breastfeeding">
              <select value={postnatalForm.breastfeeding || 'formula-only'} onChange={(e) => setPostnatalForm({ ...postnatalForm, breastfeeding: e.target.value as PostnatalAssessment['breastfeeding'] })} className="select-field">
                <option value="exclusively-breast">Exclusively breastfeeding</option>
                <option value="mixed-feeding">Mixed feeding</option>
                <option value="formula-only">Formula only</option>
                <option value="not-feeding">Not feeding</option>
              </select>
            </SF>
            <SF label="Urination">
              <select value={postnatalForm.urination || 'normal'} onChange={(e) => setPostnatalForm({ ...postnatalForm, urination: e.target.value as PostnatalAssessment['urination'] })} className="select-field">
                <option value="normal">Normal</option><option value="difficulty">Difficulty</option><option value="incontinence">Incontinence</option>
              </select>
            </SF>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={!!postnatalForm.contraceptionDiscussed} onChange={(e) => setPostnatalForm({ ...postnatalForm, contraceptionDiscussed: e.target.checked })} className="rounded" />
            <label className="text-sm font-medium text-gray-700">Contraception discussed</label>
          </div>
          {postnatalForm.contraceptionDiscussed && (
            <SF label="Contraception Chosen"><input value={postnatalForm.contraceptionChosen || ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, contraceptionChosen: e.target.value })} className="input-field" placeholder="e.g. POP, copper IUD, condoms" /></SF>
          )}
          <div className="border rounded-xl p-4">
            <p className="font-semibold text-gray-700 mb-3">Newborn Details</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <SF label="Newborn Sex">
                <select value={postnatalForm.newbornDetails?.sex || 'male'} onChange={(e) => setPostnatalForm({ ...postnatalForm, newbornDetails: { ...postnatalForm.newbornDetails, sex: e.target.value as 'male', birthWeight: postnatalForm.newbornDetails?.birthWeight || 0, neonatalOutcome: postnatalForm.newbornDetails?.neonatalOutcome || 'normal' } })} className="select-field">
                  <option value="male">Male</option><option value="female">Female</option><option value="undetermined">Undetermined</option>
                </select>
              </SF>
              <SF label="Birth Weight (g)"><input type="number" value={postnatalForm.newbornDetails?.birthWeight || ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, newbornDetails: { ...postnatalForm.newbornDetails!, birthWeight: +e.target.value } })} className="input-field" placeholder="e.g. 3400" /></SF>
              <SF label="Apgar 1 min"><input type="number" min={0} max={10} value={postnatalForm.newbornDetails?.apgar1 ?? ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, newbornDetails: { ...postnatalForm.newbornDetails!, apgar1: +e.target.value } })} className="input-field" /></SF>
              <SF label="Apgar 5 min"><input type="number" min={0} max={10} value={postnatalForm.newbornDetails?.apgar5 ?? ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, newbornDetails: { ...postnatalForm.newbornDetails!, apgar5: +e.target.value } })} className="input-field" /></SF>
              <SF label="Neonatal Outcome">
                <select value={postnatalForm.newbornDetails?.neonatalOutcome || 'normal'} onChange={(e) => setPostnatalForm({ ...postnatalForm, newbornDetails: { ...postnatalForm.newbornDetails!, neonatalOutcome: e.target.value as 'normal' } })} className="select-field">
                  <option value="normal">Normal (postnatal ward)</option><option value="scbu">SCBU</option><option value="nicu">NICU</option>
                </select>
              </SF>
            </div>
          </div>
          <SF label="Plan / Advice"><textarea value={postnatalForm.plan || ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, plan: e.target.value })} className="textarea-field" rows={4} placeholder="Discharge advice, safety netting, follow-up appointments..." /></SF>
          <SF label="Notes"><textarea value={postnatalForm.notes || ''} onChange={(e) => setPostnatalForm({ ...postnatalForm, notes: e.target.value })} className="textarea-field" rows={2} /></SF>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setPostnatalModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={savePostnatal} className="btn-primary"><Save size={16} />Save Assessment</button>
          </div>
        </div>
      </Modal>

      {/* ===== PAEDIATRIC MODAL ===== */}
      <Modal isOpen={paedModal} onClose={() => setPaedModal(false)} title={editingPaedId ? 'Edit Paediatric Record' : 'New Paediatric Record'} size="xl">
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {!editingPaedId && (
            <SF label="Select Patient *">
              <div className="mb-2"><input placeholder="Search..." onChange={(e) => setPatientSearch(e.target.value)} className="input-field" /></div>
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {filteredPatients.map((p) => (
                  <button key={p.id} onClick={() => setPaedPatientId(p.id)} className={`w-full text-left p-2 text-sm hover:bg-blue-50 ${paedPatientId === p.id ? 'bg-blue-50 font-medium text-blue-700' : ''}`}>
                    {getPatientFullName(p)} — {p.mrn}
                  </button>
                ))}
              </div>
            </SF>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SF label="Assessment Type">
              <select value={paedForm.assessmentType || 'routine-review'} onChange={(e) => setPaedForm({ ...paedForm, assessmentType: e.target.value as PaediatricRecord['assessmentType'] })} className="select-field">
                <option value="newborn">Newborn check</option>
                <option value="6-week">6-week check</option>
                <option value="6-9-month">6–9 month check</option>
                <option value="2-year">2-year check</option>
                <option value="school-entry">School entry check</option>
                <option value="routine-review">Routine review</option>
                <option value="sick-child">Sick child</option>
              </select>
            </SF>
            <SF label="Age (years)"><input type="number" min={0} max={18} value={paedForm.ageYears || 0} onChange={(e) => setPaedForm({ ...paedForm, ageYears: +e.target.value })} className="input-field" /></SF>
            <SF label="Age (months)"><input type="number" min={0} max={11} value={paedForm.ageMonths || 0} onChange={(e) => setPaedForm({ ...paedForm, ageMonths: +e.target.value })} className="input-field" /></SF>
            <SF label="Weight (kg)"><input type="number" step="0.1" value={paedForm.weight || ''} onChange={(e) => setPaedForm({ ...paedForm, weight: +e.target.value })} className="input-field" /></SF>
            <SF label="Height (cm)"><input type="number" step="0.1" value={paedForm.height || ''} onChange={(e) => setPaedForm({ ...paedForm, height: +e.target.value })} className="input-field" /></SF>
            <SF label="Head Circumference (cm)"><input type="number" step="0.1" value={paedForm.headCircumference || ''} onChange={(e) => setPaedForm({ ...paedForm, headCircumference: +e.target.value })} className="input-field" /></SF>
            <SF label="Temperature (°C)"><input type="number" step="0.1" value={paedForm.temperature || ''} onChange={(e) => setPaedForm({ ...paedForm, temperature: +e.target.value })} className="input-field" /></SF>
            <SF label="Heart Rate (bpm)"><input type="number" value={paedForm.heartRate || ''} onChange={(e) => setPaedForm({ ...paedForm, heartRate: +e.target.value })} className="input-field" /></SF>
            <SF label="Respiratory Rate (/min)"><input type="number" value={paedForm.respiratoryRate || ''} onChange={(e) => setPaedForm({ ...paedForm, respiratoryRate: +e.target.value })} className="input-field" /></SF>
            <SF label="SpO2 (%)"><input type="number" value={paedForm.oxygenSaturation || ''} onChange={(e) => setPaedForm({ ...paedForm, oxygenSaturation: +e.target.value })} className="input-field" /></SF>
            <SF label="Weight Centile"><input value={paedForm.weightCentile || ''} onChange={(e) => setPaedForm({ ...paedForm, weightCentile: e.target.value })} className="input-field" placeholder="e.g. 50th" /></SF>
            <SF label="Height Centile"><input value={paedForm.heightCentile || ''} onChange={(e) => setPaedForm({ ...paedForm, heightCentile: e.target.value })} className="input-field" placeholder="e.g. 25th" /></SF>
          </div>

          <div>
            <p className="label mb-2">Developmental Milestones</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['grossMotor', 'fineMotor', 'speech', 'socialCognitive'] as const).map((key) => (
                <SF key={key} label={key.replace(/([A-Z])/g, ' $1')}>
                  <select value={paedForm.developmentalMilestones?.[key] || 'not-assessed'} onChange={(e) => setPaedForm({ ...paedForm, developmentalMilestones: { ...(paedForm.developmentalMilestones || emptyMilestones()), [key]: e.target.value } })} className="select-field">
                    <option value="not-assessed">Not assessed</option>
                    <option value="age-appropriate">Age appropriate</option>
                    <option value="delayed">Delayed</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </SF>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!paedForm.immunisationsUpToDate} onChange={(e) => setPaedForm({ ...paedForm, immunisationsUpToDate: e.target.checked })} className="rounded accent-green-600" />
              Immunisations up to date
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!paedForm.safeguardingConcerns} onChange={(e) => setPaedForm({ ...paedForm, safeguardingConcerns: e.target.checked })} className="rounded accent-red-600" />
              Safeguarding concerns
            </label>
          </div>
          {paedForm.immunisationsDue && <SF label="Immunisations Due"><input value={paedForm.immunisationsDue || ''} onChange={(e) => setPaedForm({ ...paedForm, immunisationsDue: e.target.value })} className="input-field" /></SF>}
          <SF label="Immunisations Given Today (if any)"><input value={paedForm.immunisationsGivenToday || ''} onChange={(e) => setPaedForm({ ...paedForm, immunisationsGivenToday: e.target.value })} className="input-field" placeholder="e.g. MMR, PCV..." /></SF>
          {paedForm.safeguardingConcerns && (
            <SF label="Safeguarding Notes"><textarea value={paedForm.safeguardingNotes || ''} onChange={(e) => setPaedForm({ ...paedForm, safeguardingNotes: e.target.value })} className="textarea-field border-red-300" rows={3} /></SF>
          )}
          {paedForm.assessmentType === 'sick-child' && (
            <SF label="Presenting Complaint"><textarea value={paedForm.presenting_complaint || ''} onChange={(e) => setPaedForm({ ...paedForm, presenting_complaint: e.target.value })} className="textarea-field" rows={2} /></SF>
          )}
          <SF label="Clinical Findings *"><textarea value={paedForm.clinicalFindings || ''} onChange={(e) => setPaedForm({ ...paedForm, clinicalFindings: e.target.value })} className="textarea-field" rows={4} /></SF>
          <SF label="Nutrition / Feeding"><textarea value={paedForm.nutritionFeeding || ''} onChange={(e) => setPaedForm({ ...paedForm, nutritionFeeding: e.target.value })} className="textarea-field" rows={2} /></SF>
          <SF label="Plan *"><textarea value={paedForm.plan || ''} onChange={(e) => setPaedForm({ ...paedForm, plan: e.target.value })} className="textarea-field" rows={3} /></SF>
          <SF label="Referrals"><input value={paedForm.referrals || ''} onChange={(e) => setPaedForm({ ...paedForm, referrals: e.target.value })} className="input-field" /></SF>
          <SF label="Follow-Up"><input value={paedForm.followUp || ''} onChange={(e) => setPaedForm({ ...paedForm, followUp: e.target.value })} className="input-field" placeholder="e.g. GP in 1 week, paeds outpatient 4 weeks" /></SF>
          <SF label="Parent / Guardian Name"><input value={paedForm.parentGuardianName || ''} onChange={(e) => setPaedForm({ ...paedForm, parentGuardianName: e.target.value })} className="input-field" /></SF>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setPaedModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={savePaediatric} className="btn-primary"><Save size={16} />Save Record</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Activity, Pill, FlaskConical, ArrowRight,
  ChevronDown, ChevronUp, Phone, MapPin, Save, ArrowLeft, Info, Stethoscope, Sparkles, Loader2
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import {
  ALL_TRIAGE_PROTOCOLS, COMPLAINT_CATEGORIES, type TriageProtocol
} from '../utils/triageProtocols';
import { getPatientFullName } from '../utils/helpers';
import { PermissionGate } from '../components/ui/PermissionGate';
import { getClinicalSuggestions, type ClinicalAiResponse } from '../services/clinicalAi';

const ESI_CONFIG = {
  1: { color: 'bg-red-600 text-white', border: 'border-red-400', label: 'Level 1 — Resuscitation', description: 'Immediate life-threatening — resuscitate NOW' },
  2: { color: 'bg-orange-500 text-white', border: 'border-orange-400', label: 'Level 2 — Emergent', description: 'High risk — respond within 15 minutes' },
  3: { color: 'bg-yellow-400 text-gray-900', border: 'border-yellow-400', label: 'Level 3 — Urgent', description: 'Stable but requires intervention' },
  4: { color: 'bg-green-400 text-gray-900', border: 'border-green-400', label: 'Level 4 — Less Urgent', description: 'Minor condition — treat when possible' },
  5: { color: 'bg-blue-300 text-gray-900', border: 'border-blue-300', label: 'Level 5 — Non-Urgent', description: 'Routine — can wait' },
};

type Step = 'select-patient' | 'select-complaint' | 'assessment' | 'guidance';

export default function TriagePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { patients, addTriageAssessment } = usePatientStore();
  const { currentUser } = useStaffStore();
  const { addNotification } = useUIStore();

  const preselectedId = searchParams.get('patientId');

  const [step, setStep] = useState<Step>(preselectedId ? 'select-complaint' : 'select-patient');
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedId || '');
  const [_selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<TriageProtocol | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [redFlagsPresent, setRedFlagsPresent] = useState<Record<number, boolean>>({});
  const [esiLevel, setEsiLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [vitals, setVitals] = useState({ bp: '', hr: '', rr: '', temp: '', spo2: '', glucose: '', pain: 5 });
  const [notes, setNotes] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    redFlags: true, steps: true, drugs: true, investigations: false, referrals: false, ai: true,
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');

  // AI Clinical Assistant state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<ClinicalAiResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const detectedRedFlagCount = Object.values(redFlagsPresent).filter(Boolean).length;

  useEffect(() => {
    if (detectedRedFlagCount > 0 && protocol) {
      const minLevel = protocol.redFlags
        .filter((_, i) => redFlagsPresent[i])
        .reduce((min, rf) => Math.min(min, rf.esiLevel), 5);
      setEsiLevel(minLevel as 1 | 2 | 3 | 4 | 5);
    }
  }, [redFlagsPresent, protocol, detectedRedFlagCount]);

  function handleSelectComplaint(c: string) {
    setSelectedComplaint(c);
    setProtocol(ALL_TRIAGE_PROTOCOLS[c]);
    setAnswers({});
    setRedFlagsPresent({});
    setAiResponse(null);
    setAiError(null);
    setStep('assessment');
  }

  async function runAiAssistant() {
    if (!protocol) return;
    const apiKey = localStorage.getItem('moromoke_anthropic_key') || '';
    if (!apiKey) {
      setAiError('No Anthropic API key configured. Add one in Settings → API Keys to enable AI suggestions.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);
    try {
      const patientAnswers = protocol.questions
        .map((q, i) => answers[i] ? `Q: ${q}\nA: ${answers[i]}` : null)
        .filter(Boolean).join('\n\n');
      const vitalSigns = [
        vitals.bp && `BP ${vitals.bp}`, vitals.hr && `HR ${vitals.hr}`,
        vitals.rr && `RR ${vitals.rr}`, vitals.temp && `Temp ${vitals.temp}`,
        vitals.spo2 && `SpO2 ${vitals.spo2}`, vitals.glucose && `Glucose ${vitals.glucose}`,
        `Pain ${vitals.pain}/10`,
      ].filter(Boolean).join(', ');
      const res = await getClinicalSuggestions(apiKey, {
        chiefComplaint: protocol.label,
        patientAnswers: patientAnswers || '(No answers recorded yet)',
        vitalSigns,
        patientAge: selectedPatient?.dateOfBirth
          ? Math.floor((Date.now() - new Date(selectedPatient.dateOfBirth).getTime()) / (365.25 * 86400000))
          : undefined,
        knownAllergies: selectedPatient?.allergies?.map((a) => a.allergen).join(', '),
      });
      setAiResponse(res);
    } catch (e) {
      setAiError(`AI request failed: ${(e as Error).message}`);
    } finally {
      setAiLoading(false);
    }
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    if (!selectedPatientId || !protocol) return;
    const staffName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Staff';
    const questionAnswers = protocol.questions
      .map((q, i) => answers[i] ? `Q: ${q}\nA: ${answers[i]}` : null)
      .filter(Boolean)
      .join('\n\n');
    addTriageAssessment(selectedPatientId, {
      patientId: selectedPatientId,
      triageNurse: staffName,
      esiLevel,
      chiefComplaint: protocol.label,
      arrivalMode: 'walk-in',
      timestamp: new Date().toISOString(),
      vitalSigns: (vitals.bp || vitals.hr) ? {
        bloodPressureSystolic: vitals.bp ? parseInt(vitals.bp.split('/')[0]) : undefined,
        bloodPressureDiastolic: vitals.bp ? parseInt(vitals.bp.split('/')[1]) : undefined,
        heartRate: vitals.hr ? parseInt(vitals.hr) : undefined,
        respiratoryRate: vitals.rr ? parseInt(vitals.rr) : undefined,
        temperature: vitals.temp ? parseFloat(vitals.temp) : undefined,
        oxygenSaturation: vitals.spo2 ? parseInt(vitals.spo2) : undefined,
        painScore: vitals.pain,
      } : undefined,
      notes: [
        `NHS Triage Protocol: ${protocol.label}`,
        detectedRedFlagCount > 0 ? `Red flags detected: ${detectedRedFlagCount}` : '',
        questionAnswers,
        notes,
      ].filter(Boolean).join('\n\n'),
    } as never);
    addNotification({ type: 'success', title: 'Triage assessment saved', message: `ESI Level ${esiLevel} — ${protocol.label}` });
    navigate(selectedPatientId ? `/patients/${selectedPatientId}` : '/queue');
  }

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch) return true;
    const q = patientSearch.toLowerCase();
    return getPatientFullName(p).toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope size={20} className="text-blue-600" />
            NHS-Style Clinical Triage
          </h1>
          <p className="text-sm text-gray-500">Evidence-based triage with clinical decision support</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex gap-1 items-center text-xs font-medium flex-wrap">
        {[
          { key: 'select-patient', label: '1. Patient' },
          { key: 'select-complaint', label: '2. Chief Complaint' },
          { key: 'assessment', label: '3. Assessment' },
          { key: 'guidance', label: '4. Clinical Guidance' },
        ].map(({ key, label }, i, arr) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`px-3 py-1 rounded-full ${step === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {label}
            </span>
            {i < arr.length - 1 && <ArrowRight size={12} className="text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Patient */}
      {step === 'select-patient' && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Select Patient to Triage</h2>
          <input
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Search by name or MRN..."
            className="input-field mb-4"
          />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPatientId(p.id); setStep('select-complaint'); }}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{getPatientFullName(p)}</span>
                <span className="text-sm text-gray-500 ml-2">MRN: {p.mrn}</span>
                <span className="ml-2 text-xs text-gray-400 capitalize">{p.status}</span>
              </button>
            ))}
            {filteredPatients.length === 0 && <p className="text-gray-400 text-center py-8">No patients found.</p>}
          </div>
        </div>
      )}

      {/* Step 2: Select Chief Complaint */}
      {step === 'select-complaint' && (
        <div className="card p-6">
          {selectedPatient && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
              <Activity size={16} className="text-blue-600" />
              <span>Patient: <strong>{getPatientFullName(selectedPatient)}</strong> · MRN: {selectedPatient.mrn}</span>
            </div>
          )}
          <h2 className="font-semibold text-gray-900 mb-2">What is the chief complaint / presenting problem?</h2>
          <p className="text-xs text-gray-500 mb-4">{Object.keys(ALL_TRIAGE_PROTOCOLS).length} NHS-pathway-aligned presentations across 14 body systems.</p>
          <input
            value={complaintSearch}
            onChange={(e) => setComplaintSearch(e.target.value)}
            placeholder="Search presenting problem (e.g., chest pain, rash, jaundice)..."
            className="input-field mb-4"
            autoFocus
          />
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {COMPLAINT_CATEGORIES.map((cat) => {
              const opts = cat.options.filter((o) => !complaintSearch || o.label.toLowerCase().includes(complaintSearch.toLowerCase()));
              if (opts.length === 0) return null;
              return (
                <div key={cat.label}>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">{cat.label}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {opts.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => handleSelectComplaint(value)}
                        className="text-left p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-sm"
                      >
                        <span className="font-medium text-gray-900">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setStep('select-patient')} className="btn-secondary mt-4"><ArrowLeft size={16} />Back</button>
        </div>
      )}

      {/* Step 3: Assessment */}
      {step === 'assessment' && protocol && (
        <div className="space-y-4">
          {selectedPatient && (
            <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2 text-sm">
              <Activity size={16} className="text-blue-600" />
              <strong>{getPatientFullName(selectedPatient)}</strong>
              <span className="text-gray-500">· Chief Complaint: <strong className="text-gray-700">{protocol.label}</strong></span>
            </div>
          )}

          {/* Red Flags */}
          <div className="bg-white rounded-xl border-l-4 border-red-500 shadow-sm overflow-hidden">
            <button onClick={() => toggleSection('redFlags')} className="flex w-full items-center justify-between p-4 font-semibold text-red-700 hover:bg-red-50">
              <span className="flex items-center gap-2"><AlertTriangle size={16} /> Red Flags — Check These First</span>
              {expandedSections.redFlags ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.redFlags && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-gray-500 mb-3">Tick any red flags present in this patient:</p>
                {protocol.redFlags.map((rf, i) => (
                  <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${redFlagsPresent[i] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={!!redFlagsPresent[i]}
                      onChange={(e) => setRedFlagsPresent({ ...redFlagsPresent, [i]: e.target.checked })}
                      className="mt-0.5 accent-red-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{rf.symptom}</p>
                      <p className="text-xs text-red-600 mt-0.5">⚠ Indicates ESI {rf.esiLevel} — {rf.reason}</p>
                    </div>
                  </label>
                ))}
                {detectedRedFlagCount > 0 && (
                  <div className="mt-3 p-3 bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} />
                    {detectedRedFlagCount} red flag(s) detected — triage level auto-set to ESI {esiLevel}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Patient Questions */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info size={16} className="text-blue-600" /> Patient Assessment Questions
            </h3>
            <div className="space-y-4">
              {protocol.questions.map((q, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-blue-600 font-bold mr-1">{i + 1}.</span> {q}
                  </label>
                  <textarea
                    value={answers[i] || ''}
                    onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                    className="textarea-field"
                    rows={2}
                    placeholder="Patient's response..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Vitals */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity size={16} className="text-green-600" /> Vital Signs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Blood Pressure', key: 'bp', placeholder: '120/80 mmHg' },
                { label: 'Heart Rate', key: 'hr', placeholder: '88 bpm' },
                { label: 'Respiratory Rate', key: 'rr', placeholder: '16 /min' },
                { label: 'Temperature', key: 'temp', placeholder: '37.5 °C' },
                { label: 'SpO2', key: 'spo2', placeholder: '98 %' },
                { label: 'Blood Glucose', key: 'glucose', placeholder: '5.4 mmol/L' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    value={(vitals as Record<string, string | number>)[key] as string}
                    onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                    className="input-field"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div className="col-span-2 md:col-span-3">
                <label className="label">Pain Score: <strong>{vitals.pain}/10</strong></label>
                <input
                  type="range" min={0} max={10} value={vitals.pain}
                  onChange={(e) => setVitals({ ...vitals, pain: +e.target.value })}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 — No pain</span><span>5 — Moderate</span><span>10 — Worst possible</span>
                </div>
              </div>
            </div>
          </div>

          {/* ESI Level */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">ESI Triage Level Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5] as const).map((level) => {
                const cfg = ESI_CONFIG[level];
                return (
                  <button
                    key={level}
                    onClick={() => setEsiLevel(level)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${esiLevel === level ? `${cfg.color} ${cfg.border} shadow-md` : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <p className={`font-bold text-sm ${esiLevel === level ? '' : 'text-gray-900'}`}>ESI {level}</p>
                    <p className={`text-xs mt-0.5 ${esiLevel === level ? 'opacity-90' : 'text-gray-500'}`}>{cfg.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Additional Triage Notes</h3>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="textarea-field" rows={3} placeholder="Clinical observations, concerns, or context..." />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('select-complaint')} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
            <button onClick={() => setStep('guidance')} className="btn-primary">View Clinical Guidance <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Step 4: Clinical Guidance */}
      {step === 'guidance' && protocol && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-4 py-2 rounded-full font-bold text-sm ${ESI_CONFIG[esiLevel].color}`}>
              {ESI_CONFIG[esiLevel].label}
            </span>
            <span className="text-gray-600 text-sm font-medium">{protocol.label}</span>
            {detectedRedFlagCount > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                <AlertTriangle size={14} /> {detectedRedFlagCount} red flag(s) active
              </span>
            )}
          </div>

          {/* Immediate Steps */}
          <CollapsibleSection
            title="Immediate Clinical Steps"
            icon={<CheckCircle size={16} className="text-green-600" />}
            expanded={expandedSections.steps}
            onToggle={() => toggleSection('steps')}
          >
            <ol className="space-y-2">
              {protocol.initialSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.step}</p>
                    {s.detail && <p className="text-xs text-blue-700 mt-0.5 italic">{s.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </CollapsibleSection>

          {/* Drug Recommendations */}
          {protocol.suggestedDrugs.length > 0 && (
            <CollapsibleSection
              title="Drug & Medication Recommendations"
              icon={<Pill size={16} className="text-blue-600" />}
              expanded={expandedSections.drugs}
              onToggle={() => toggleSection('drugs')}
            >
              <div className="space-y-3">
                {protocol.suggestedDrugs.map((drug, i) => (
                  <div key={i} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-blue-900">{drug.name}</p>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full flex-shrink-0">{drug.route}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1"><span className="font-medium">Dose:</span> {drug.dose}</p>
                    <p className="text-xs text-gray-600 mt-0.5"><span className="font-medium">Indication:</span> {drug.indication}</p>
                    {drug.notes && <p className="text-xs text-amber-700 mt-1 italic">⚠ {drug.notes}</p>}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Investigations */}
          <CollapsibleSection
            title="Suggested Investigations"
            icon={<FlaskConical size={16} className="text-purple-600" />}
            expanded={expandedSections.investigations}
            onToggle={() => toggleSection('investigations')}
          >
            <div className="flex flex-wrap gap-2">
              {protocol.investigations.map((inv, i) => (
                <span key={i} className="text-xs px-3 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200">
                  {inv}
                </span>
              ))}
            </div>
          </CollapsibleSection>

          {/* Referrals */}
          {protocol.referrals.length > 0 && (
            <CollapsibleSection
              title="Referral & Transfer Recommendations"
              icon={<Phone size={16} className="text-red-600" />}
              expanded={expandedSections.referrals}
              onToggle={() => toggleSection('referrals')}
            >
              <div className="space-y-2">
                {protocol.referrals.map((ref, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    ref.urgency === 'immediate' ? 'border-red-300 bg-red-50' :
                    ref.urgency === 'urgent' ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <MapPin size={14} className={`mt-0.5 flex-shrink-0 ${ref.urgency === 'immediate' ? 'text-red-600' : 'text-orange-500'}`} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{ref.destination}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{ref.reason}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                        ref.urgency === 'immediate' ? 'bg-red-600 text-white' :
                        ref.urgency === 'urgent' ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-700'
                      }`}>
                        {ref.urgency.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* AI Clinical Assistant */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 overflow-hidden">
            <button onClick={() => toggleSection('ai')} className="flex w-full items-center justify-between p-4 font-semibold text-purple-900 hover:bg-purple-100/50">
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600" /> AI Clinical Decision Support
                <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full font-normal">Claude Haiku 4.5</span>
              </span>
              {expandedSections.ai ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.ai && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-purple-700">
                  Real-time AI clinical suggestions based on patient answers, vitals, and chief complaint. Follows NHS / NICE guidelines.
                  <strong> All AI suggestions require clinician review before action.</strong>
                </p>

                {!aiResponse && !aiLoading && (
                  <button onClick={runAiAssistant} className="btn-primary bg-purple-600 hover:bg-purple-700 border-purple-600">
                    <Sparkles size={16} /> Get AI Clinical Suggestions
                  </button>
                )}

                {aiLoading && (
                  <div className="flex items-center gap-2 text-purple-700 text-sm py-3">
                    <Loader2 size={16} className="animate-spin" /> Analysing patient data with Claude…
                  </div>
                )}

                {aiError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {aiError}
                  </div>
                )}

                {aiResponse && (
                  <div className="space-y-3 text-sm">
                    <div className={`p-3 rounded-lg font-medium ${
                      aiResponse.urgency === 'immediate' ? 'bg-red-100 text-red-800 border border-red-300' :
                      aiResponse.urgency === 'urgent' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                      'bg-green-100 text-green-800 border border-green-300'
                    }`}>
                      AI Assessed Urgency: <span className="uppercase">{aiResponse.urgency}</span>
                    </div>

                    <AiSection title="Differential Diagnoses" items={aiResponse.differentials} color="blue" />
                    <AiSection title="Red Flags to Watch" items={aiResponse.redFlags} color="red" />
                    <AiSection title="Suggested Investigations" items={aiResponse.investigations} color="purple" />

                    {aiResponse.medications.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Suggested Medications</p>
                        <div className="space-y-1">
                          {aiResponse.medications.map((m, i) => (
                            <div key={i} className="p-2 bg-white rounded border border-purple-200">
                              <p className="font-semibold text-purple-900 text-xs">{m.name} — <span className="font-normal text-gray-700">{m.dose}</span></p>
                              <p className="text-xs text-gray-500">{m.indication}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <AiSection title="Referrals" items={aiResponse.referrals} color="orange" />
                    <AiSection title="Clinical Pearls" items={aiResponse.clinicalPearls} color="green" />

                    <button onClick={runAiAssistant} className="text-xs text-purple-700 underline hover:text-purple-900">
                      Re-run AI suggestions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Disposition */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle size={16} className="text-blue-600" /> Possible Dispositions
            </h3>
            <ul className="space-y-1">
              {protocol.dispositionOptions.map((d, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span> {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('assessment')} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
            <PermissionGate permission="triage:create">
              <button onClick={handleSave} className="btn-success">
                <Save size={16} /> Save Triage Assessment
              </button>
            </PermissionGate>
          </div>
        </div>
      )}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AiSection({ title, items, color }: { title: string; items: string[]; color: 'blue' | 'red' | 'purple' | 'orange' | 'green' }) {
  if (!items?.length) return null;
  const cls = {
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
    green: 'bg-green-50 text-green-800 border-green-200',
  }[color];
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded-full border ${cls}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center justify-between p-4 font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
        <span className="flex items-center gap-2">{icon}{title}</span>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Activity, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import { getPatientFullName, calculateAge, ESI_COLORS, ESI_LABELS } from '../utils/helpers';
import type { TriagePriority } from '../types';

const triageSchema = z.object({
  patientId: z.string().min(1, 'Patient required'),
  chiefComplaint: z.string().min(1, 'Chief complaint required'),
  onset: z.string().min(1, 'Onset required'),
  duration: z.string().min(1, 'Duration required'),
  severity: z.number().min(1).max(10),
  esiLevel: z.number().min(1).max(5),
  temperature: z.number().optional(),
  temperatureUnit: z.enum(['C', 'F']).optional(),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  heartRate: z.number().optional(),
  respiratoryRate: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  weight: z.number().optional(),
  weightUnit: z.enum(['kg', 'lbs']).optional(),
  height: z.number().optional(),
  heightUnit: z.enum(['cm', 'in']).optional(),
  painScore: z.number().min(0).max(10).optional(),
  glucoseLevel: z.number().optional(),
  symptoms: z.string().optional(),
  mechanism: z.string().optional(),
  notes: z.string().optional(),
  allergiesConfirmed: z.boolean(),
  medicationsConfirmed: z.boolean(),
});

type TriageFormData = z.infer<typeof triageSchema>;

const ESI_DESCRIPTIONS = {
  1: 'Requires immediate life-saving intervention',
  2: 'High-risk situation, should not wait',
  3: 'Requires 2+ resources, stable vitals',
  4: 'Requires 1 resource',
  5: 'Requires no resources (history only)',
};

export default function TriagePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');

  const { patients, updatePatient, addTriageAssessment, addVitals, addEncounter } = usePatientStore();
  const { currentUser } = useStaffStore();
  const { addNotification } = useUIStore();
  const [selectedESI, setSelectedESI] = useState<TriagePriority>(3);

  const activePatients = patients.filter((p) => !['discharged', 'transferred'].includes(p.status));

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<TriageFormData>({
    resolver: zodResolver(triageSchema),
    defaultValues: {
      patientId: preSelectedPatientId || '',
      severity: 5,
      esiLevel: 3,
      temperatureUnit: 'C',
      weightUnit: 'kg',
      heightUnit: 'cm',
      allergiesConfirmed: false,
      medicationsConfirmed: false,
    },
  });

  const watchedPatientId = watch('patientId');
  const selectedPatient = patients.find((p) => p.id === watchedPatientId);

  function onSubmit(data: TriageFormData) {
    const now = new Date().toISOString();
    const patient = patients.find((p) => p.id === data.patientId);
    if (!patient) return;

    // Ensure patient has an active encounter
    let encounterId = patient.encounters.find((e) => e.status === 'active')?.id;
    if (!encounterId) {
      addEncounter(data.patientId, {
        encounterType: 'emergency',
        status: 'active',
        admitDate: now,
        chiefComplaint: data.chiefComplaint,
        attendingPhysicianId: currentUser?.id || '',
        attendingPhysicianName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
      });
      encounterId = 'enc-temp';
    }

    addTriageAssessment(data.patientId, {
      patientId: data.patientId,
      encounterId: encounterId,
      triageNurseId: currentUser?.id || '',
      triageNurseName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
      arrivalTime: patient.registrationDate,
      triageTime: now,
      chiefComplaint: data.chiefComplaint,
      onset: data.onset,
      duration: data.duration,
      severity: data.severity,
      esiLevel: data.esiLevel as TriagePriority,
      vitals: {
        temperature: data.temperature,
        temperatureUnit: data.temperatureUnit,
        bloodPressureSystolic: data.bloodPressureSystolic,
        bloodPressureDiastolic: data.bloodPressureDiastolic,
        heartRate: data.heartRate,
        respiratoryRate: data.respiratoryRate,
        oxygenSaturation: data.oxygenSaturation,
        weight: data.weight,
        weightUnit: data.weightUnit,
        height: data.height,
        heightUnit: data.heightUnit,
        painScore: data.painScore,
        glucoseLevel: data.glucoseLevel,
      },
      symptoms: data.symptoms ? data.symptoms.split(',').map((s) => s.trim()).filter(Boolean) : [],
      mechanism: data.mechanism,
      notes: data.notes,
      allergiesConfirmed: data.allergiesConfirmed,
      medicationsConfirmed: data.medicationsConfirmed,
    });

    addVitals(data.patientId, {
      timestamp: now,
      recordedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Triage',
      temperature: data.temperature,
      temperatureUnit: data.temperatureUnit,
      bloodPressureSystolic: data.bloodPressureSystolic,
      bloodPressureDiastolic: data.bloodPressureDiastolic,
      heartRate: data.heartRate,
      respiratoryRate: data.respiratoryRate,
      oxygenSaturation: data.oxygenSaturation,
      weight: data.weight,
      weightUnit: data.weightUnit,
      height: data.height,
      heightUnit: data.heightUnit,
      painScore: data.painScore,
      glucoseLevel: data.glucoseLevel,
    });

    updatePatient(data.patientId, { status: 'in-triage' });

    addNotification({
      type: 'success',
      title: 'Triage Completed',
      message: `Triage for ${getPatientFullName(patient)} saved (ESI ${data.esiLevel}).`,
    });
    navigate(`/patients/${data.patientId}`);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity size={22} className="text-orange-500" />
            Triage Assessment
          </h1>
          <p className="text-sm text-gray-500">Emergency Severity Index Assessment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Patient Selection</h2>
          <div>
            <label className="label">Select Patient *</label>
            <select {...register('patientId')} className="select-field">
              <option value="">-- Select a patient --</option>
              {activePatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {getPatientFullName(p)} · {p.mrn} · Age {calculateAge(p.dateOfBirth)}
                </option>
              ))}
            </select>
            {errors.patientId && <p className="form-error">{errors.patientId.message}</p>}
          </div>
          {selectedPatient && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-semibold">{getPatientFullName(selectedPatient)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">MRN</p>
                  <p className="font-semibold">{selectedPatient.mrn}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">DOB / Age</p>
                  <p className="font-semibold">{selectedPatient.dateOfBirth} ({calculateAge(selectedPatient.dateOfBirth)}y)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Blood Type</p>
                  <p className="font-semibold">{selectedPatient.bloodType}</p>
                </div>
              </div>
              {selectedPatient.allergies.filter((a) => a.status === 'active').length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-red-600">
                  <AlertCircle size={16} />
                  <span className="text-xs font-semibold">
                    ALLERGIES: {selectedPatient.allergies.filter((a) => a.status === 'active').map((a) => a.allergen).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ESI Level */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Emergency Severity Index (ESI)</h2>
          <div className="grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as TriagePriority[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => { setSelectedESI(level); setValue('esiLevel', level); }}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  selectedESI === level
                    ? `${ESI_COLORS[level]} border-transparent shadow-md`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="text-2xl font-bold mb-1">{level}</div>
                <div className="text-xs font-medium">{ESI_LABELS[level]}</div>
                <div className={`text-xs mt-1 ${selectedESI === level ? 'opacity-80' : 'text-gray-400'}`}>
                  {ESI_DESCRIPTIONS[level]}
                </div>
              </button>
            ))}
          </div>
          <input type="hidden" {...register('esiLevel', { valueAsNumber: true })} />
        </div>

        {/* Chief Complaint */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Chief Complaint & History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Chief Complaint *</label>
              <input {...register('chiefComplaint')} className="input-field" placeholder="e.g., Chest pain, shortness of breath" />
              {errors.chiefComplaint && <p className="form-error">{errors.chiefComplaint.message}</p>}
            </div>
            <div>
              <label className="label">Onset *</label>
              <select {...register('onset')} className="select-field">
                <option value="">Select onset</option>
                <option>Sudden</option>
                <option>Gradual</option>
                <option>Intermittent</option>
                <option>Progressive</option>
              </select>
              {errors.onset && <p className="form-error">{errors.onset.message}</p>}
            </div>
            <div>
              <label className="label">Duration *</label>
              <input {...register('duration')} className="input-field" placeholder="e.g., 2 hours, 3 days" />
              {errors.duration && <p className="form-error">{errors.duration.message}</p>}
            </div>
            <div>
              <label className="label">Severity (1-10)</label>
              <div className="flex items-center gap-3">
                <input
                  {...register('severity', { valueAsNumber: true })}
                  type="range" min="1" max="10"
                  className="flex-1 accent-blue-600"
                />
                <span className="w-8 text-center font-bold text-lg text-gray-900">{watch('severity')}</span>
              </div>
            </div>
            <div>
              <label className="label">Mechanism of Injury</label>
              <input {...register('mechanism')} className="input-field" placeholder="e.g., Fall, MVA, assault" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Symptoms (comma-separated)</label>
              <input {...register('symptoms')} className="input-field" placeholder="e.g., Headache, fever, nausea" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Triage Notes</label>
              <textarea {...register('notes')} rows={3} className="textarea-field" placeholder="Additional clinical notes..." />
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Vital Signs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Temperature</label>
              <div className="flex gap-2">
                <input
                  {...register('temperature', { valueAsNumber: true })}
                  type="number" step="0.1" className="input-field"
                  placeholder="36.8"
                />
                <select {...register('temperatureUnit')} className="select-field w-20">
                  <option value="C">°C</option>
                  <option value="F">°F</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Blood Pressure</label>
              <div className="flex gap-1 items-center">
                <input
                  {...register('bloodPressureSystolic', { valueAsNumber: true })}
                  type="number" className="input-field"
                  placeholder="120"
                />
                <span className="text-gray-400">/</span>
                <input
                  {...register('bloodPressureDiastolic', { valueAsNumber: true })}
                  type="number" className="input-field"
                  placeholder="80"
                />
              </div>
            </div>
            <div>
              <label className="label">Heart Rate (bpm)</label>
              <input
                {...register('heartRate', { valueAsNumber: true })}
                type="number" className="input-field"
                placeholder="72"
              />
            </div>
            <div>
              <label className="label">Resp. Rate (/min)</label>
              <input
                {...register('respiratoryRate', { valueAsNumber: true })}
                type="number" className="input-field"
                placeholder="16"
              />
            </div>
            <div>
              <label className="label">SpO2 (%)</label>
              <input
                {...register('oxygenSaturation', { valueAsNumber: true })}
                type="number" min="0" max="100" className="input-field"
                placeholder="98"
              />
            </div>
            <div>
              <label className="label">Pain Score (0-10)</label>
              <input
                {...register('painScore', { valueAsNumber: true })}
                type="number" min="0" max="10" className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Weight</label>
              <div className="flex gap-2">
                <input
                  {...register('weight', { valueAsNumber: true })}
                  type="number" step="0.1" className="input-field"
                  placeholder="70"
                />
                <select {...register('weightUnit')} className="select-field w-20">
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Height</label>
              <div className="flex gap-2">
                <input
                  {...register('height', { valueAsNumber: true })}
                  type="number" step="0.1" className="input-field"
                  placeholder="170"
                />
                <select {...register('heightUnit')} className="select-field w-20">
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Blood Glucose (mg/dL)</label>
              <input
                {...register('glucoseLevel', { valueAsNumber: true })}
                type="number" className="input-field"
                placeholder="90"
              />
            </div>
          </div>
        </div>

        {/* Confirmations */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b">Confirmations</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input {...register('allergiesConfirmed')} type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Allergies confirmed and documented</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input {...register('medicationsConfirmed')} type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Current medications confirmed and documented</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save size={16} />
            Save Triage Assessment
          </button>
        </div>
      </form>
    </div>
  );
}

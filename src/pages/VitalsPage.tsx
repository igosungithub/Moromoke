import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Stethoscope, Save, ArrowLeft } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';
import { getPatientFullName, calculateAge, calculateBMI } from '../utils/helpers';
import { usePermissions } from '../hooks/usePermissions';

const schema = z.object({
  patientId: z.string().min(1, 'Patient required'),
  temperature: z.number().optional(),
  temperatureUnit: z.enum(['C', 'F']),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  heartRate: z.number().optional(),
  respiratoryRate: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  weight: z.number().optional(),
  weightUnit: z.enum(['kg', 'lbs']),
  height: z.number().optional(),
  heightUnit: z.enum(['cm', 'in']),
  painScore: z.number().min(0).max(10).optional(),
  glucoseLevel: z.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function VitalsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { patients, addVitals } = usePatientStore();
  const { currentUser } = useStaffStore();
  const { addNotification } = useUIStore();
  const { can } = usePermissions();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: searchParams.get('patientId') || '',
      temperatureUnit: 'C',
      weightUnit: 'kg',
      heightUnit: 'cm',
    },
  });

  const watchedPatientId = watch('patientId');
  const selectedPatient = patients.find((p) => p.id === watchedPatientId);
  const weight = watch('weight');
  const height = watch('height');
  const weightUnit = watch('weightUnit');
  const heightUnit = watch('heightUnit');
  const bmi = weight && height ? calculateBMI(weight, height, weightUnit, heightUnit) : null;

  const activePatients = patients.filter((p) => !['discharged', 'transferred'].includes(p.status));

  function onSubmit(data: FormData) {
    if (!can('vitals:create')) return;
    addVitals(data.patientId, {
      timestamp: new Date().toISOString(),
      recordedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Staff',
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
      bmi: bmi || undefined,
      notes: data.notes,
    });
    const patient = patients.find((p) => p.id === data.patientId);
    addNotification({ type: 'success', title: 'Vitals recorded', message: patient ? `Vitals saved for ${getPatientFullName(patient)}` : '' });
    if (searchParams.get('patientId')) {
      navigate(`/patients/${data.patientId}`);
    }
  }

  const bp = { sys: watch('bloodPressureSystolic'), dia: watch('bloodPressureDiastolic') };
  const hr = watch('heartRate');
  const spo2 = watch('oxygenSaturation');
  const temp = watch('temperature');
  const tempUnit = watch('temperatureUnit');

  function bpStatus() {
    if (!bp.sys || !bp.dia) return null;
    if (bp.sys >= 180 || bp.dia >= 120) return { label: 'Hypertensive Crisis', color: 'text-red-600' };
    if (bp.sys >= 140 || bp.dia >= 90) return { label: 'Stage 2 Hypertension', color: 'text-red-500' };
    if (bp.sys >= 130 || bp.dia >= 80) return { label: 'Stage 1 Hypertension', color: 'text-orange-500' };
    if (bp.sys >= 120) return { label: 'Elevated', color: 'text-yellow-600' };
    if (bp.sys < 90 || bp.dia < 60) return { label: 'Hypotension', color: 'text-red-500' };
    return { label: 'Normal', color: 'text-green-600' };
  }

  function hrStatus() {
    if (!hr) return null;
    if (hr > 100) return { label: 'Tachycardia', color: 'text-red-500' };
    if (hr < 60) return { label: 'Bradycardia', color: 'text-orange-500' };
    return { label: 'Normal', color: 'text-green-600' };
  }

  function spo2Status() {
    if (!spo2) return null;
    if (spo2 < 90) return { label: 'Critical Hypoxia', color: 'text-red-600 font-bold' };
    if (spo2 < 95) return { label: 'Hypoxia', color: 'text-red-500' };
    return { label: 'Normal', color: 'text-green-600' };
  }

  function tempStatus() {
    if (!temp) return null;
    const c = tempUnit === 'F' ? (temp - 32) * 5/9 : temp;
    if (c >= 39.5) return { label: 'High Fever', color: 'text-red-600' };
    if (c >= 38) return { label: 'Fever', color: 'text-orange-500' };
    if (c < 36) return { label: 'Hypothermia', color: 'text-blue-500' };
    return { label: 'Normal', color: 'text-green-600' };
  }

  const interpretations = [bpStatus(), hrStatus(), spo2Status(), tempStatus()].filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope size={22} className="text-teal-600" />
            Record Vital Signs
          </h1>
          <p className="text-sm text-gray-500">Document patient vital signs</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-base font-semibold mb-4 pb-2 border-b">Patient</h2>
          <select {...register('patientId')} className="select-field">
            <option value="">-- Select Patient --</option>
            {activePatients.map((p) => (
              <option key={p.id} value={p.id}>
                {getPatientFullName(p)} · {p.mrn} · Age {calculateAge(p.dateOfBirth)}
              </option>
            ))}
          </select>
          {errors.patientId && <p className="form-error">{errors.patientId.message}</p>}
          {selectedPatient && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
              <span className="font-medium">{getPatientFullName(selectedPatient)}</span>
              <span className="text-gray-500 ml-2">{selectedPatient.mrn} · {selectedPatient.gender} · {calculateAge(selectedPatient.dateOfBirth)}y</span>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold mb-4 pb-2 border-b">Vital Signs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Temperature</label>
              <div className="flex gap-2">
                <input {...register('temperature', { valueAsNumber: true })} type="number" step="0.1" className="input-field" placeholder="37.0" />
                <select {...register('temperatureUnit')} className="select-field w-20">
                  <option value="C">°C</option>
                  <option value="F">°F</option>
                </select>
              </div>
              {tempStatus() && <p className={`text-xs mt-1 font-medium ${tempStatus()!.color}`}>{tempStatus()!.label}</p>}
            </div>

            <div>
              <label className="label">Blood Pressure (mmHg)</label>
              <div className="flex gap-2 items-center">
                <input {...register('bloodPressureSystolic', { valueAsNumber: true })} type="number" className="input-field" placeholder="120" />
                <span className="text-gray-400 font-bold">/</span>
                <input {...register('bloodPressureDiastolic', { valueAsNumber: true })} type="number" className="input-field" placeholder="80" />
              </div>
              {bpStatus() && <p className={`text-xs mt-1 font-medium ${bpStatus()!.color}`}>{bpStatus()!.label}</p>}
            </div>

            <div>
              <label className="label">Heart Rate (bpm)</label>
              <input {...register('heartRate', { valueAsNumber: true })} type="number" className="input-field" placeholder="72" />
              {hrStatus() && <p className={`text-xs mt-1 font-medium ${hrStatus()!.color}`}>{hrStatus()!.label}</p>}
            </div>

            <div>
              <label className="label">Respiratory Rate (/min)</label>
              <input {...register('respiratoryRate', { valueAsNumber: true })} type="number" className="input-field" placeholder="16" />
            </div>

            <div>
              <label className="label">Oxygen Saturation (%)</label>
              <input {...register('oxygenSaturation', { valueAsNumber: true })} type="number" min="0" max="100" className="input-field" placeholder="98" />
              {spo2Status() && <p className={`text-xs mt-1 font-medium ${spo2Status()!.color}`}>{spo2Status()!.label}</p>}
            </div>

            <div>
              <label className="label">Pain Score (0-10)</label>
              <input {...register('painScore', { valueAsNumber: true })} type="number" min="0" max="10" className="input-field" placeholder="0" />
            </div>

            <div>
              <label className="label">Weight</label>
              <div className="flex gap-2">
                <input {...register('weight', { valueAsNumber: true })} type="number" step="0.1" className="input-field" placeholder="70" />
                <select {...register('weightUnit')} className="select-field w-20">
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Height</label>
              <div className="flex gap-2">
                <input {...register('height', { valueAsNumber: true })} type="number" step="0.1" className="input-field" placeholder="170" />
                <select {...register('heightUnit')} className="select-field w-20">
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
              {bmi && <p className="text-xs mt-1 text-gray-600">BMI: <span className="font-bold">{bmi}</span></p>}
            </div>

            <div>
              <label className="label">Blood Glucose (mg/dL)</label>
              <input {...register('glucoseLevel', { valueAsNumber: true })} type="number" className="input-field" placeholder="90" />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea {...register('notes')} className="textarea-field" rows={2} placeholder="Additional notes..." />
            </div>
          </div>
        </div>

        {interpretations.length > 0 && (
          <div className="card bg-yellow-50 border border-yellow-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Clinical Interpretations</h3>
            <div className="space-y-1">
              {interpretations.map((interp, i) => (
                <p key={i} className={`text-sm ${interp!.color}`}>• {interp!.label}</p>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting || !can('vitals:create')} className="btn-primary">
            <Save size={16} /> Save Vitals
          </button>
        </div>
      </form>
    </div>
  );
}

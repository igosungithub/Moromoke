import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, AlertTriangle, CheckCircle, Activity,
  TrendingUp, Bed, ArrowRight, RefreshCw
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { getPatientFullName, ESI_COLORS, ESI_LABELS, formatWaitTime, getWaitTime, STATUS_LABELS, STATUS_COLORS } from '../utils/helpers';
import type { TriagePriority } from '../types';

export default function Dashboard() {
  const { patients, selectPatient } = usePatientStore();
  const navigate = useNavigate();

  const activePatients = patients.filter((p) => !['discharged', 'transferred'].includes(p.status));
  const waitingPatients = patients.filter((p) => p.status === 'waiting');
  const criticalPatients = patients.filter((p) => {
    const lastTriage = p.triageAssessments[0];
    return lastTriage && (lastTriage.esiLevel === 1 || lastTriage.esiLevel === 2) && !['discharged', 'transferred'].includes(p.status);
  });
  const todayDischarges = patients.filter((p) => p.status === 'discharged' && p.encounters[0]?.dischargeDate?.startsWith(new Date().toISOString().split('T')[0]));

  const esiDistribution = [1, 2, 3, 4, 5].map((level) => ({
    level: level as TriagePriority,
    count: patients.filter((p) => {
      const lastTriage = p.triageAssessments[0];
      return lastTriage && lastTriage.esiLevel === level && !['discharged', 'transferred'].includes(p.status);
    }).length,
  }));

  const stats = [
    {
      title: 'Active Patients',
      value: activePatients.length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      title: 'Waiting for Triage',
      value: waitingPatients.length,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
    },
    {
      title: 'Critical / Emergent',
      value: criticalPatients.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    {
      title: "Today's Discharges",
      value: todayDischarges.length,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
  ];

  function handlePatientClick(patientId: string) {
    selectPatient(patientId);
    navigate(`/patients/${patientId}`);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ title, value, icon: Icon, color, bg, border }) => (
          <div key={title} className={`card border ${border} flex items-center gap-4`}>
            <div className={`${bg} p-3 rounded-xl`}>
              <Icon className={color} size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Queue */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              Active Patient Queue
            </h2>
            <button
              onClick={() => navigate('/queue')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {activePatients.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users size={40} className="mx-auto mb-2 opacity-50" />
                <p>No active patients</p>
              </div>
            ) : (
              activePatients.slice(0, 6).map((patient) => {
                const lastTriage = patient.triageAssessments[0];
                const esiLevel = lastTriage?.esiLevel;
                const waitMins = getWaitTime(patient.encounters[0]?.admitDate || patient.registrationDate);
                return (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientClick(patient.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors text-left"
                  >
                    {esiLevel && (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${ESI_COLORS[esiLevel]}`}>
                        {esiLevel}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {getPatientFullName(patient)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {patient.encounters[0]?.chiefComplaint || 'No complaint recorded'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[patient.status]} inline-block mb-1`}>
                        {STATUS_LABELS[patient.status]}
                      </span>
                      <p className="text-xs text-gray-400">{formatWaitTime(waitMins)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* ESI Distribution */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-600" />
              ESI Distribution
            </h2>
            <div className="space-y-2">
              {esiDistribution.map(({ level, count }) => (
                <div key={level} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${ESI_COLORS[level]}`}>
                    {level}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">{ESI_LABELS[level]}</span>
                      <span className="text-xs font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          level === 1 ? 'bg-red-500' :
                          level === 2 ? 'bg-orange-500' :
                          level === 3 ? 'bg-yellow-400' :
                          level === 4 ? 'bg-green-500' : 'bg-blue-400'
                        }`}
                        style={{ width: `${Math.min(100, (count / Math.max(1, activePatients.length)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bed Status */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bed size={18} className="text-teal-600" />
              Bed Status
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Beds', value: 20, color: 'text-gray-900' },
                { label: 'Occupied', value: activePatients.length, color: 'text-blue-600' },
                { label: 'Available', value: Math.max(0, 20 - activePatients.length), color: 'text-green-600' },
                { label: 'Turnover Today', value: todayDischarges.length, color: 'text-orange-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Occupancy</span>
                <span>{Math.round((activePatients.length / 20) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (activePatients.length / 20) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <RefreshCw size={18} className="text-indigo-600" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/patients/new')} className="w-full btn-primary justify-center text-sm py-2">
                Register New Patient
              </button>
              <button onClick={() => navigate('/triage')} className="w-full btn-secondary justify-center text-sm py-2">
                Start Triage
              </button>
              <button onClick={() => navigate('/queue')} className="w-full btn-secondary justify-center text-sm py-2">
                Manage Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Filter, Search, ArrowUpDown, AlertTriangle, UserPlus, RefreshCw } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import {
  calculateAge, getPatientFullName, ESI_COLORS, ESI_LABELS,
  formatWaitTime, getWaitTime, STATUS_COLORS
} from '../utils/helpers';
import type { PatientStatus, TriagePriority } from '../types';

type SortField = 'esi' | 'wait' | 'name' | 'status';
type SortDir = 'asc' | 'desc';

export default function PatientQueue() {
  const navigate = useNavigate();
  const { patients, updatePatient, selectPatient } = usePatientStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PatientStatus | 'all'>('all');
  const [filterESI, setFilterESI] = useState<TriagePriority | 'all'>('all');
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'esi', dir: 'asc' });

  const activePatients = patients.filter((p) => !['discharged', 'transferred'].includes(p.status));

  const filtered = activePatients
    .filter((p) => {
      const name = getPatientFullName(p).toLowerCase();
      const q = search.toLowerCase();
      if (q && !name.includes(q) && !p.mrn.toLowerCase().includes(q)) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      const esi = p.triageAssessments[0]?.esiLevel;
      if (filterESI !== 'all' && esi !== filterESI) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.field === 'esi') {
        const ea = a.triageAssessments[0]?.esiLevel ?? 99;
        const eb = b.triageAssessments[0]?.esiLevel ?? 99;
        return (ea - eb) * dir;
      }
      if (sort.field === 'wait') {
        const wa = getWaitTime(a.encounters[0]?.admitDate || a.registrationDate);
        const wb = getWaitTime(b.encounters[0]?.admitDate || b.registrationDate);
        return (wb - wa) * dir;
      }
      if (sort.field === 'name') {
        return getPatientFullName(a).localeCompare(getPatientFullName(b)) * dir;
      }
      return a.status.localeCompare(b.status) * dir;
    });

  function handleSort(field: SortField) {
    setSort((prev) => ({
      field,
      dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  }

  function handleStatusChange(patientId: string, newStatus: PatientStatus) {
    updatePatient(patientId, { status: newStatus });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm outline-none flex-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PatientStatus | 'all')}
            className="select-field w-auto text-sm"
          >
            <option value="all">All Status</option>
            <option value="waiting">Waiting</option>
            <option value="in-triage">In Triage</option>
            <option value="in-treatment">In Treatment</option>
            <option value="admitted">Admitted</option>
          </select>
          <select
            value={filterESI}
            onChange={(e) => setFilterESI(e.target.value === 'all' ? 'all' : Number(e.target.value) as TriagePriority)}
            className="select-field w-auto text-sm"
          >
            <option value="all">All ESI</option>
            {[1, 2, 3, 4, 5].map((l) => (
              <option key={l} value={l}>ESI {l}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={() => navigate('/patients/new')} className="btn-primary text-sm">
            <UserPlus size={16} />
            New Patient
          </button>
          <button onClick={() => navigate('/triage')} className="btn-secondary text-sm">
            <RefreshCw size={16} />
            Triage
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide">
                <button onClick={() => handleSort('esi')} className="flex items-center gap-1 hover:text-gray-900">
                  ESI <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide">
                <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-900">
                  Patient <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide hidden md:table-cell">
                Chief Complaint
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide">
                <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-gray-900">
                  Status <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide">
                <button onClick={() => handleSort('wait')} className="flex items-center gap-1 hover:text-gray-900">
                  Wait Time <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide hidden lg:table-cell">
                Provider
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide hidden lg:table-cell">
                Room
              </th>
              <th className="text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <Clock size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No patients in queue</p>
                </td>
              </tr>
            ) : (
              filtered.map((patient) => {
                const lastTriage = patient.triageAssessments[0];
                const esiLevel = lastTriage?.esiLevel;
                const waitMins = getWaitTime(patient.encounters[0]?.admitDate || patient.registrationDate);
                const isUrgent = waitMins > 30 && patient.status === 'waiting';

                return (
                  <tr
                    key={patient.id}
                    className={`hover:bg-gray-50 transition-colors ${isUrgent ? 'bg-red-50/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      {esiLevel ? (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${ESI_COLORS[esiLevel]}`}>
                          {esiLevel}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">?</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { selectPatient(patient.id); navigate(`/patients/${patient.id}`); }}
                        className="text-left hover:text-blue-600"
                      >
                        <p className="text-sm font-semibold text-gray-900">{getPatientFullName(patient)}</p>
                        <p className="text-xs text-gray-500">{patient.mrn} · {calculateAge(patient.dateOfBirth)}y · {patient.gender}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-700 max-w-xs truncate">
                        {patient.encounters[0]?.chiefComplaint || '—'}
                      </p>
                      {esiLevel && (
                        <p className="text-xs text-gray-400">{ESI_LABELS[esiLevel]}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={patient.status}
                        onChange={(e) => handleStatusChange(patient.id, e.target.value as PatientStatus)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_COLORS[patient.status]}`}
                        style={{ appearance: 'auto' }}
                      >
                        <option value="waiting">Waiting</option>
                        <option value="in-triage">In Triage</option>
                        <option value="in-treatment">In Treatment</option>
                        <option value="admitted">Admitted</option>
                        <option value="discharged">Discharged</option>
                        <option value="transferred">Transferred</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${waitMins > 60 ? 'text-red-600' : waitMins > 30 ? 'text-orange-500' : 'text-gray-700'}`}>
                        {formatWaitTime(waitMins)}
                        {isUrgent && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-gray-700 truncate max-w-32">
                        {patient.encounters[0]?.attendingPhysicianName || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-gray-700">{patient.encounters[0]?.roomNumber || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { selectPatient(patient.id); navigate(`/triage?patientId=${patient.id}`); }}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Triage
                        </button>
                        <button
                          onClick={() => { selectPatient(patient.id); navigate(`/patients/${patient.id}`); }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filtered.length} of {activePatients.length} active patients
      </p>
    </div>
  );
}

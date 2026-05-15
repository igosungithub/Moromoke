import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Filter } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { calculateAge, getPatientFullName, formatDate, STATUS_COLORS, STATUS_LABELS, ESI_COLORS } from '../utils/helpers';
import { PermissionGate } from '../components/ui/PermissionGate';

export default function PatientList() {
  const navigate = useNavigate();
  const { patients, selectPatient } = usePatientStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const name = getPatientFullName(p).toLowerCase();
    if (q && !name.includes(q) && !p.mrn.toLowerCase().includes(q) && !p.phone.includes(q)) return false;
    if (filter !== 'all' && p.status !== filter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-64">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, MRN, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select-field w-auto text-sm">
            <option value="all">All Patients</option>
            <option value="waiting">Waiting</option>
            <option value="in-triage">In Triage</option>
            <option value="in-treatment">In Treatment</option>
            <option value="admitted">Admitted</option>
            <option value="discharged">Discharged</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>
        <PermissionGate permission="patient:create">
          <button onClick={() => navigate('/patients/new')} className="btn-primary">
            <UserPlus size={16} />
            Register Patient
          </button>
        </PermissionGate>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide">Patient</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide hidden sm:table-cell">MRN</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide hidden md:table-cell">Age / Gender</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide hidden lg:table-cell">Blood Type</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide">Status</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide hidden lg:table-cell">Last Visit</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide hidden md:table-cell">ESI</th>
              <th className="text-right text-xs font-semibold text-gray-600 px-4 py-3 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <p>No patients found</p>
                </td>
              </tr>
            ) : (
              filtered.map((patient) => {
                const lastTriage = patient.triageAssessments[0];
                return (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => { selectPatient(patient.id); navigate(`/patients/${patient.id}`); }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{getPatientFullName(patient)}</p>
                          <p className="text-xs text-gray-500">{patient.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-gray-700 font-mono">{patient.mrn}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-700">{calculateAge(patient.dateOfBirth)}y</p>
                      <p className="text-xs text-gray-500 capitalize">{patient.gender}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-medium text-gray-700">{patient.bloodType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[patient.status]}`}>
                        {STATUS_LABELS[patient.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-gray-700">
                        {patient.lastVisitDate ? formatDate(patient.lastVisitDate) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {lastTriage ? (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${ESI_COLORS[lastTriage.esiLevel]}`}>
                          {lastTriage.esiLevel}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); selectPatient(patient.id); navigate(`/patients/${patient.id}`); }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-500">{filtered.length} patient{filtered.length !== 1 ? 's' : ''} found</p>
    </div>
  );
}

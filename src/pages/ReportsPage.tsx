import { BarChart3, Users, Clock, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { usePatientStore } from '../store/patientStore';
import { calculateAge, ESI_LABELS } from '../utils/helpers';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export default function ReportsPage() {
  const { patients } = usePatientStore();

  const statusCounts = {
    waiting: patients.filter((p) => p.status === 'waiting').length,
    'in-triage': patients.filter((p) => p.status === 'in-triage').length,
    'in-treatment': patients.filter((p) => p.status === 'in-treatment').length,
    admitted: patients.filter((p) => p.status === 'admitted').length,
    discharged: patients.filter((p) => p.status === 'discharged').length,
    transferred: patients.filter((p) => p.status === 'transferred').length,
  };

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace('-', ' '),
    value,
  }));

  const esiData = [1, 2, 3, 4, 5].map((level) => ({
    name: `ESI ${level}`,
    label: ESI_LABELS[level as 1|2|3|4|5],
    count: patients.filter((p) => p.triageAssessments[0]?.esiLevel === level).length,
  }));

  const genderData = [
    { name: 'Male', value: patients.filter((p) => p.gender === 'male').length },
    { name: 'Female', value: patients.filter((p) => p.gender === 'female').length },
    { name: 'Other', value: patients.filter((p) => !['male', 'female'].includes(p.gender)).length },
  ].filter((d) => d.value > 0);

  const ageGroups = [
    { name: '0-17', min: 0, max: 17 },
    { name: '18-34', min: 18, max: 34 },
    { name: '35-49', min: 35, max: 49 },
    { name: '50-64', min: 50, max: 64 },
    { name: '65+', min: 65, max: 200 },
  ].map((g) => ({
    name: g.name,
    count: patients.filter((p) => {
      const age = calculateAge(p.dateOfBirth);
      return age >= g.min && age <= g.max;
    }).length,
  }));

  const bloodTypeData = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'].map((bt) => ({
    name: bt,
    count: patients.filter((p) => p.bloodType === bt).length,
  })).filter((d) => d.count > 0);

  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => !['discharged', 'transferred'].includes(p.status)).length;
  const totalEncounters = patients.reduce((acc, p) => acc + p.encounters.length, 0);
  const avgLabsPerPatient = totalPatients > 0 ? (patients.reduce((acc, p) => acc + p.labResults.length, 0) / totalPatients).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <BarChart3 size={22} className="text-purple-600" />
        Reports & Analytics
      </h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: totalPatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Patients', value: activePatients, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Encounters', value: totalEncounters, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Avg Labs/Patient', value: avgLabsPerPatient, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card flex items-center gap-4`}>
            <div className={`${bg} p-3 rounded-xl`}>
              <Icon className={color} size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ESI Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            ESI Level Distribution
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={esiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Patients">
                {esiData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Status */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Patient Status Distribution
          </h2>
          {totalPatients === 0 ? (
            <p className="text-gray-400 text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={['#f59e0b', '#f97316', '#3b82f6', '#8b5cf6', '#22c55e', '#6b7280'][i % 6]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Age Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Age Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageGroups}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Patients" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Gender Distribution</h2>
          {genderData.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={['#3b82f6', '#ec4899', '#6b7280'][i % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Blood Type Distribution */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Blood Type Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bloodTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={50} />
              <Tooltip />
              <Bar dataKey="count" name="Patients" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Status Summary</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {statusData.map(({ name, value }) => (
            <div key={name} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 capitalize">{name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

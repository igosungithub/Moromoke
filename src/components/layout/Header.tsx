import { Bell, Search, Clock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../store/patientStore';
import { getPatientFullName, calculateAge } from '../../utils/helpers';

export default function Header({ title }: { title: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { patients, selectPatient } = usePatientStore();
  const navigate = useNavigate();

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const searchResults = searchQuery.length >= 2
    ? patients.filter((p) =>
        getPatientFullName(p).toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery)
      ).slice(0, 5)
    : [];

  function handleSelectPatient(patientId: string) {
    selectPatient(patientId);
    navigate(`/patients/${patientId}`);
    setSearchQuery('');
    setShowResults(false);
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
            />
          </div>
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{getPatientFullName(p)}</p>
                    <p className="text-xs text-gray-500">{p.mrn} · {calculateAge(p.dateOfBirth)}y · {p.gender}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                    p.status === 'in-treatment' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status.replace('-', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date/Time */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>{timeStr}</span>
          <span className="text-gray-300">|</span>
          <span className="hidden lg:block">{dateStr}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}

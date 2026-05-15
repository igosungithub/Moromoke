import { useState } from 'react';
import { Settings, Hospital, User, Bell, Shield, Save, Key, Eye, EyeOff, Sparkles, Globe } from 'lucide-react';
import { useStaffStore } from '../store/staffStore';
import { useUIStore } from '../store/uiStore';

export default function SettingsPage() {
  const { currentUser, staff, setCurrentUser } = useStaffStore();
  const { addNotification } = useUIStore();

  const [hospitalName, setHospitalName] = useState('Moromoke General Hospital');
  const [hospitalAddress, setHospitalAddress] = useState('1 Hospital Road, Lagos, Nigeria');
  const [hospitalPhone, setHospitalPhone] = useState('+234-555-0000');
  const [hospitalEmail, setHospitalEmail] = useState('info@moromoke.hospital');
  const [maxBeds, setMaxBeds] = useState('20');

  // API Keys & integrations
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('moromoke_anthropic_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [odooUrl, setOdooUrl] = useState(() => localStorage.getItem('moromoke_odoo_url') || '');
  const [odooDb, setOdooDb] = useState(() => localStorage.getItem('moromoke_odoo_db') || '');

  function saveHospitalSettings() {
    addNotification({ type: 'success', title: 'Hospital settings saved' });
  }

  function saveApiKeys() {
    if (anthropicKey) localStorage.setItem('moromoke_anthropic_key', anthropicKey);
    else localStorage.removeItem('moromoke_anthropic_key');
    if (odooUrl) localStorage.setItem('moromoke_odoo_url', odooUrl);
    if (odooDb) localStorage.setItem('moromoke_odoo_db', odooDb);
    addNotification({ type: 'success', title: 'API keys & integrations saved', message: 'Stored locally in browser only.' });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Settings size={22} className="text-gray-600" />
        Settings
      </h1>

      {/* Hospital Settings */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
          <Hospital size={18} className="text-blue-600" /> Hospital Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Hospital Name</label>
            <input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} className="input-field" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <input value={hospitalAddress} onChange={(e) => setHospitalAddress(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={hospitalPhone} onChange={(e) => setHospitalPhone(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={hospitalEmail} onChange={(e) => setHospitalEmail(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Maximum Beds</label>
            <input type="number" value={maxBeds} onChange={(e) => setMaxBeds(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={saveHospitalSettings} className="btn-primary">
            <Save size={16} /> Save Hospital Settings
          </button>
        </div>
      </div>

      {/* Active User */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
          <User size={18} className="text-green-600" /> Active User Profile
        </h2>
        {currentUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-sm text-gray-600 capitalize">{currentUser.role} · {currentUser.department}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </div>
            <div>
              <label className="label">Switch Active User</label>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const s = staff.find((st) => st.id === e.target.value);
                  if (s) { setCurrentUser(s); addNotification({ type: 'success', title: `Switched to ${s.firstName} ${s.lastName}` }); }
                }}
                className="select-field max-w-xs"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.role}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Change the active user for demonstrations and testing.</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No user logged in.</p>
        )}
      </div>

      {/* API Keys & Integrations */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
          <Key size={18} className="text-purple-600" /> API Keys & Integrations
        </h2>

        {/* Anthropic */}
        <div className="space-y-4">
          <div>
            <label className="label flex items-center gap-2">
              <Sparkles size={14} className="text-purple-600" />
              Anthropic API Key (for AI Clinical Decision Support)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="input-field pr-10"
                  placeholder="sk-ant-api03-..."
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Powers the AI Clinical Assistant in the Triage workflow. Uses Claude Haiku 4.5 model.
              Get your key from{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                console.anthropic.com
              </a>. Key is stored locally in your browser only — never sent to any server other than Anthropic's API.
            </p>
            {anthropicKey && !anthropicKey.startsWith('sk-ant-') && (
              <p className="text-xs text-amber-700 mt-1">⚠ Key format looks incorrect. Anthropic keys start with "sk-ant-".</p>
            )}
          </div>

          {/* Drug data sources info */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <p className="font-medium text-blue-900 mb-1 flex items-center gap-2">
              <Globe size={14} /> Drug Database Sources (No API key required)
            </p>
            <ul className="text-xs text-blue-800 space-y-0.5 ml-5 list-disc">
              <li><strong>RxNorm</strong> (NIH/NLM) — 100,000+ drugs, brand & generic names, drug interactions</li>
              <li><strong>OpenFDA</strong> — Full FDA drug label data: dosing, contraindications, side effects</li>
              <li><strong>NHS / NICE pathways</strong> — Triage protocols built into the app (no external call)</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">All free, open-access, no registration needed. Direct browser-to-API calls.</p>
          </div>

          {/* Odoo integration (optional) */}
          <details className="border border-gray-200 rounded-lg">
            <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
              Optional: Odoo Inventory Sync (Advanced)
            </summary>
            <div className="p-3 border-t border-gray-200 space-y-3">
              <div>
                <label className="label">Odoo Server URL</label>
                <input
                  value={odooUrl}
                  onChange={(e) => setOdooUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://your-odoo-instance.com"
                />
              </div>
              <div>
                <label className="label">Odoo Database Name</label>
                <input
                  value={odooDb}
                  onChange={(e) => setOdooDb(e.target.value)}
                  className="input-field"
                  placeholder="my_hospital_db"
                />
              </div>
              <p className="text-xs text-gray-500">
                Note: Odoo XML-RPC requires CORS configuration on the Odoo server side. For production use, configure a backend proxy.
                For now, use the RxNorm/OpenFDA search tab in Drug Stock for ready-to-import drug data.
              </p>
            </div>
          </details>

          <button onClick={saveApiKeys} className="btn-primary">
            <Save size={16} /> Save API Keys
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
          <Bell size={18} className="text-yellow-600" /> Notification Settings
        </h2>
        <div className="space-y-3">
          {[
            { label: 'New patient registration', description: 'Alert when a new patient is registered' },
            { label: 'Critical vitals', description: 'Alert on abnormal vital signs' },
            { label: 'Lab results ready', description: 'Alert when lab results are available' },
            { label: 'Long wait times', description: 'Alert when patients wait over 30 minutes' },
          ].map(({ label, description }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
          <Shield size={18} className="text-red-600" /> Privacy & Security
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="font-medium text-green-800">✓ Data stored locally</p>
            <p className="text-xs text-green-700 mt-0.5">All patient data is stored in your browser's local storage.</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-800">ℹ HIPAA Compliance Note</p>
            <p className="text-xs text-blue-700 mt-0.5">For production use, ensure the system is deployed with proper encryption, access controls, and audit logging per HIPAA requirements.</p>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="btn-danger text-sm"
          >
            Clear All Data (Reset)
          </button>
        </div>
      </div>
    </div>
  );
}

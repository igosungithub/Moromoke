import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, Stethoscope, Users, Activity, Pill, Package,
  FlaskConical, Baby, ShieldCheck, Bell, Lock, Sparkles, ArrowRight
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { ROLE_LABELS, ROLE_ACCESS_DESCRIPTIONS } from '../utils/permissions';

interface Card {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  link?: string;
  color: string;
}

const QUICK_START: Card[] = [
  { title: 'Register a patient', description: 'Patients → Add Patient. Captures demographics, allergies, insurance, emergency contacts.', icon: Users, link: '/patients/new', color: 'text-emerald-600 bg-emerald-50' },
  { title: 'Triage with NHS / NICE protocols', description: 'Triage → choose a chief complaint from 70+ presenting problems. Built-in red-flag detection auto-sets ESI level.', icon: Stethoscope, link: '/triage', color: 'text-blue-600 bg-blue-50' },
  { title: 'Record vitals', description: 'Vitals → patient. Abnormal values automatically appear in the bell alerts.', icon: Activity, link: '/vitals', color: 'text-green-600 bg-green-50' },
  { title: 'Prescribe medication', description: 'Medications → patient. The form runs an allergy + interaction safety check on every save.', icon: Pill, link: '/medications', color: 'text-purple-600 bg-purple-50' },
  { title: 'Drug stock & catalog search', description: 'Drug Stock → "Search & Import" tab. Searches 42,000+ FDA drugs offline; imports straight into inventory.', icon: Package, link: '/drug-stock', color: 'text-amber-600 bg-amber-50' },
  { title: 'Order labs & imaging', description: 'Both pages let you upload scanned reports / DICOM files alongside the order.', icon: FlaskConical, link: '/labs', color: 'text-teal-600 bg-teal-50' },
  { title: 'Maternity & paediatrics', description: 'Antenatal booking, postnatal Edinburgh PND scoring, paediatric milestones.', icon: Baby, link: '/maternity', color: 'text-pink-600 bg-pink-50' },
];

const ADMIN_TOOLS: Card[] = [
  { title: 'Audit log', description: 'Every login, prescription, lab order, and drug dispense is recorded. Filter by user, category, severity. Export to CSV for compliance.', icon: ShieldCheck, link: '/audit', color: 'text-red-600 bg-red-50' },
  { title: 'Staff & multi-role assignment', description: 'Add staff, assign multiple roles (e.g. physician + admin), reset passwords. Permissions aggregate across roles.', icon: Users, link: '/staff', color: 'text-slate-700 bg-slate-100' },
  { title: 'API keys & integrations', description: 'Anthropic key for AI clinical assistant, optional Odoo product import path, NHS dm+d release file path.', icon: Sparkles, link: '/settings', color: 'text-indigo-600 bg-indigo-50' },
];

const SAFETY_FEATURES: Card[] = [
  { title: 'Alerts bell (top-right)', description: 'Auto-detects ESI 1 patients, ESI 2 waiting > 15 min, abnormal vitals, pending STAT labs, low / expired drug stock, failed login attempts. Click any alert to jump to the source.', icon: Bell, color: 'text-yellow-600 bg-yellow-50' },
  { title: 'Auto-logout after 30 min idle', description: 'A 1-minute warning appears first. Move the mouse to stay signed in. Protects patient data on shared workstations.', icon: Lock, color: 'text-gray-700 bg-gray-100' },
  { title: 'Medication safety checks', description: 'Cross-references the active medication list and the patient\'s documented allergies. Critical conflicts require a written override reason that is audit-logged.', icon: Pill, color: 'text-red-600 bg-red-50' },
  { title: 'AI Clinical Decision Support', description: 'On the triage guidance step, request real-time differentials and management suggestions from Claude. Always reviewed by a clinician.', icon: Sparkles, link: '/settings', color: 'text-purple-600 bg-purple-50' },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const { role, roles } = usePermissions();

  function Section({ title, icon: Icon, cards, color }: { title: string; icon: React.ComponentType<{ size?: number; className?: string }>; cards: Card[]; color: string }) {
    return (
      <div>
        <h2 className={`flex items-center gap-2 text-base font-semibold mb-3 ${color}`}>
          <Icon size={18} /> {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((c) => {
            const I = c.icon;
            const Inner = (
              <div className={`card flex items-start gap-3 ${c.link ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}>
                <div className={`p-2 rounded-lg flex-shrink-0 ${c.color}`}>
                  <I size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    {c.title}
                    {c.link && <ArrowRight size={12} className="text-gray-400" />}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{c.description}</p>
                </div>
              </div>
            );
            return c.link ? (
              <button key={c.title} onClick={() => navigate(c.link!)} className="text-left">
                {Inner}
              </button>
            ) : (
              <div key={c.title}>{Inner}</div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <HelpCircle size={24} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Help & Quick Start</h1>
          <p className="text-sm text-gray-500">Everything Moromoke EMR can do, grouped by workflow.</p>
        </div>
      </div>

      {/* Your role */}
      {role && (
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Users size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                You are signed in as: {roles.map((r) => ROLE_LABELS[r]).join(' + ')}
              </p>
              <p className="text-xs text-gray-600 mt-1">{ROLE_ACCESS_DESCRIPTIONS[role]}</p>
              {roles.length > 1 && (
                <p className="text-xs text-indigo-700 mt-1">
                  You have <strong>{roles.length} roles assigned</strong>. Your permissions are the union of all roles — the most permissive combination wins.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Section title="Quick start — clinical workflows" icon={Stethoscope} cards={QUICK_START} color="text-gray-900" />
      <Section title="Patient safety & system protection" icon={ShieldCheck} cards={SAFETY_FEATURES} color="text-gray-900" />
      {(role === 'admin' || roles.includes('admin')) && (
        <Section title="Admin tools" icon={ShieldCheck} cards={ADMIN_TOOLS} color="text-red-700" />
      )}

      {/* Keyboard / tips */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-600" /> Tips & shortcuts
        </h2>
        <ul className="text-sm text-gray-700 space-y-2">
          <li><strong>Patient search</strong> — type in the top-right search box from any page. Matches name, MRN, or phone.</li>
          <li><strong>Bell badge</strong> — number shows unread alerts. Red = at least one critical alert. Click to expand the list.</li>
          <li><strong>Multiple roles</strong> — admins can grant a single user multiple roles in Staff → edit. Useful for "doctor + admin" or "nurse + radiology tech".</li>
          <li><strong>Audit export</strong> — Audit Log → "Export CSV". Filter first to scope the export.</li>
          <li><strong>Drug catalog vs stock</strong> — Catalog is the searchable 42k-drug library. Stock is what your pharmacy physically holds. Use "Search & Import" to move from catalog → stock when you receive deliveries.</li>
          <li><strong>Document upload</strong> — Lab and Imaging order modals accept PDFs, JPGs, DICOM (.dcm), HEIC. 20–30 MB total per record.</li>
        </ul>
      </div>

      <div className="card bg-gray-50">
        <h2 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
          <ShieldCheck size={14} className="text-gray-500" /> Privacy & data location
        </h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          All patient records, audit events, drug stock, and login credentials live in your browser's local storage on this device only.
          Nothing is uploaded to Moromoke servers (there are none). The optional AI Clinical Assistant sends de-identified clinical question text to Anthropic's API when you click "Get AI suggestions"; everything else is fully offline.
          For production deployment, run behind your hospital's firewall, configure full-disk encryption, and ensure audit log retention follows your jurisdiction's requirements (typically 7–10 years).
        </p>
      </div>
    </div>
  );
}

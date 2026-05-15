import { useState, useMemo } from 'react';
import {
  Package, Plus, Search, AlertTriangle, ChevronDown, ChevronUp,
  Edit, Trash2, Save, X, ArrowUpCircle, BarChart2, FlaskConical, Info, Globe, Library
} from 'lucide-react';
import { useDrugStore } from '../store/drugStore';
import { useStaffStore } from '../store/staffStore';
import { PermissionGate } from '../components/ui/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DrugSearchImport from '../components/drugs/DrugSearchImport';
import BrowseCatalog from '../components/drugs/BrowseCatalog';
import type { DrugStockItem, DrugCategory, RouteOfAdministration, DrugFormulation, ControlledStatus } from '../types/drugStock';

const CATEGORY_LABELS: Record<DrugCategory, string> = {
  analgesics: 'Analgesics', antibiotics: 'Antibiotics', antivirals: 'Antivirals',
  antifungals: 'Antifungals', antiparasitics: 'Antiparasitics', cardiovascular: 'Cardiovascular',
  respiratory: 'Respiratory', gastrointestinal: 'Gastrointestinal', endocrine: 'Endocrine',
  neurological: 'Neurological', psychiatric: 'Psychiatric', anticoagulants: 'Anticoagulants',
  antidiabetics: 'Antidiabetics', antihypertensives: 'Antihypertensives', antihistamines: 'Antihistamines',
  corticosteroids: 'Corticosteroids', immunosuppressants: 'Immunosuppressants', oncology: 'Oncology',
  obstetric: 'Obstetric', paediatric: 'Paediatric', vaccines: 'Vaccines',
  iv_fluids: 'IV Fluids', emergency: 'Emergency', anaesthetics: 'Anaesthetics',
  vitamins_supplements: 'Vitamins & Supplements', other: 'Other',
};

const ROUTE_LABELS: Record<RouteOfAdministration, string> = {
  oral: 'Oral (PO)', sublingual: 'Sublingual (SL)', buccal: 'Buccal',
  intravenous: 'Intravenous (IV)', intramuscular: 'Intramuscular (IM)',
  subcutaneous: 'Subcutaneous (SC)', intradermal: 'Intradermal',
  inhalation: 'Inhalation', nebulisation: 'Nebulisation',
  topical: 'Topical', transdermal: 'Transdermal', rectal: 'Rectal',
  vaginal: 'Vaginal', ophthalmic: 'Ophthalmic', otic: 'Otic', nasal: 'Nasal',
  intrathecal: 'Intrathecal', epidural: 'Epidural',
};

const CONTROLLED_BADGE: Record<ControlledStatus, string> = {
  uncontrolled: '',
  schedule_2: 'bg-red-100 text-red-800',
  schedule_3: 'bg-orange-100 text-orange-800',
  schedule_4: 'bg-yellow-100 text-yellow-800',
  schedule_5: 'bg-gray-100 text-gray-700',
};

const CONTROLLED_LABEL: Record<ControlledStatus, string> = {
  uncontrolled: '', schedule_2: 'CD Sch.2', schedule_3: 'CD Sch.3',
  schedule_4: 'CD Sch.4', schedule_5: 'CD Sch.5',
};

const formatNaira = (value: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(value);

type ViewMode = 'list' | 'detail';

const emptyDrug = (): Omit<DrugStockItem, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: '', genericName: '', brandNames: [], category: 'other', formulation: 'tablet',
  strength: '', unit: 'tablet', routes: ['oral'], dosages: [], quantityInStock: 0,
  reorderLevel: 50, reorderQuantity: 100, unitCost: 0, currency: 'NGN', batchNumber: '',
  expiryDate: '', manufacturer: '', controlledStatus: 'uncontrolled', requiresPrescription: true,
  contraindications: [], sideEffects: [], interactions: [], storageConditions: '', location: '', isActive: true,
});

export default function DrugStockPage() {
  const { drugs, addDrug, updateDrug, deleteDrug, restockDrug } = useDrugStore();
  const { currentUser } = useStaffStore();
  const { can } = usePermissions();

  const [tab, setTab] = useState<'inventory' | 'browse' | 'search' | 'add'>('inventory');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DrugCategory | 'all'>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [_viewMode, _setViewMode] = useState<ViewMode>('list');
  const [selectedDrug, setSelectedDrug] = useState<DrugStockItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [restockModal, setRestockModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(100);

  const [form, setForm] = useState<Omit<DrugStockItem, 'id' | 'createdAt' | 'updatedAt'>>(emptyDrug());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<{ contraindications: string; sideEffects: string; interactions: string }>({
    contraindications: '', sideEffects: '', interactions: '',
  });

  const filtered = useMemo(() => {
    let result = drugs.filter((d) => d.isActive);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.genericName.toLowerCase().includes(q) ||
        d.brandNames.some((b) => b.toLowerCase().includes(q)) ||
        d.category.includes(q)
      );
    }
    if (categoryFilter !== 'all') result = result.filter((d) => d.category === categoryFilter);
    if (lowStockOnly) result = result.filter((d) => d.quantityInStock <= d.reorderLevel);
    return result;
  }, [drugs, search, categoryFilter, lowStockOnly]);

  const lowStockCount = drugs.filter((d) => d.isActive && d.quantityInStock <= d.reorderLevel).length;
  const expiringCount = drugs.filter((d) => {
    if (!d.isActive) return false;
    const days = (new Date(d.expiryDate).getTime() - Date.now()) / 86400000;
    return days < 90;
  }).length;
  const totalValue = drugs.filter((d) => d.isActive).reduce((s, d) => s + d.quantityInStock * d.unitCost, 0);

  function openAdd() {
    if (!can('drugstock:create')) return;
    setForm(emptyDrug());
    setTagInput({ contraindications: '', sideEffects: '', interactions: '' });
    setEditingId(null);
    setAddModal(true);
  }

  function openEdit(drug: DrugStockItem) {
    if (!can('drugstock:edit')) return;
    setForm({ ...drug });
    setTagInput({ contraindications: '', sideEffects: '', interactions: '' });
    setEditingId(drug.id);
    setEditModal(true);
  }

  function saveDrug() {
    if (!form.name || !form.genericName) return;
    if (editingId) {
      if (!can('drugstock:edit')) return;
      updateDrug(editingId, form);
      setEditModal(false);
    } else {
      if (!can('drugstock:create')) return;
      addDrug(form);
      setAddModal(false);
    }
    setForm(emptyDrug());
  }

  function doRestock() {
    if (!selectedDrug || restockQty <= 0) return;
    if (!can('drugstock:edit')) return;
    restockDrug(selectedDrug.id, restockQty, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Staff');
    setRestockModal(false);
    setRestockQty(100);
  }

  function stockColor(drug: DrugStockItem) {
    if (drug.quantityInStock === 0) return 'text-red-700 font-bold';
    if (drug.quantityInStock <= drug.reorderLevel) return 'text-orange-600 font-semibold';
    return 'text-green-700';
  }

  function expiryColor(dateStr: string) {
    const days = (new Date(dateStr).getTime() - Date.now()) / 86400000;
    if (days < 30) return 'text-red-600 font-bold';
    if (days < 90) return 'text-orange-500';
    return 'text-gray-600';
  }

  const DrugForm = () => (
    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Drug Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g., Amoxicillin" />
        </div>
        <div>
          <label className="label">Generic Name *</label>
          <input value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} className="input-field" placeholder="Generic / INN name" />
        </div>
        <div>
          <label className="label">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DrugCategory })} className="select-field">
            {(Object.keys(CATEGORY_LABELS) as DrugCategory[]).map((k) => (
              <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Formulation</label>
          <select value={form.formulation} onChange={(e) => setForm({ ...form, formulation: e.target.value as DrugFormulation })} className="select-field">
            {['tablet','capsule','liquid','syrup','suspension','solution','injection','infusion','powder','cream','ointment','gel','patch','suppository','inhaler','nebuliser_solution','eye_drops','ear_drops','nasal_spray','ampoule','vial','bag','other'].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Strength</label>
          <input value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} className="input-field" placeholder="e.g., 500mg, 10mg/mL" />
        </div>
        <div>
          <label className="label">Unit</label>
          <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field" placeholder="e.g., tablet, ampoule, vial" />
        </div>
        <div>
          <label className="label">Quantity in Stock</label>
          <input type="number" value={form.quantityInStock} onChange={(e) => setForm({ ...form, quantityInStock: +e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label">Reorder Level</label>
          <input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: +e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label">Unit Cost (NGN)</label>
          <input type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: +e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label">Expiry Date</label>
          <input type="date" value={form.expiryDate.slice(0, 10)} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label">Batch Number</label>
          <input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label">Manufacturer</label>
          <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label">Storage Location</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="e.g., Shelf A1, CD Cupboard" />
        </div>
        <div>
          <label className="label">Controlled Drug Status</label>
          <select value={form.controlledStatus} onChange={(e) => setForm({ ...form, controlledStatus: e.target.value as ControlledStatus })} className="select-field">
            <option value="uncontrolled">Uncontrolled</option>
            <option value="schedule_2">Schedule 2 (CD)</option>
            <option value="schedule_3">Schedule 3 (CD)</option>
            <option value="schedule_4">Schedule 4 (CD)</option>
            <option value="schedule_5">Schedule 5 (CD)</option>
          </select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" checked={form.requiresPrescription} onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })} className="rounded" />
          <label className="text-sm font-medium text-gray-700">Requires Prescription</label>
        </div>
      </div>
      <div>
        <label className="label">Storage Conditions</label>
        <input value={form.storageConditions} onChange={(e) => setForm({ ...form, storageConditions: e.target.value })} className="input-field" placeholder="e.g., Below 25°C, dry place" />
      </div>
      {(['contraindications', 'sideEffects', 'interactions'] as const).map((field) => (
        <div key={field}>
          <label className="label capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput[field]}
              onChange={(e) => setTagInput({ ...tagInput, [field]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput[field].trim()) {
                  setForm({ ...form, [field]: [...form[field], tagInput[field].trim()] });
                  setTagInput({ ...tagInput, [field]: '' });
                  e.preventDefault();
                }
              }}
              className="input-field flex-1"
              placeholder="Type and press Enter"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {form[field].map((item, i) => (
              <span key={i} className="badge-gray flex items-center gap-1 text-xs">
                {item}
                <button onClick={() => setForm({ ...form, [field]: form[field].filter((_, j) => j !== i) })} className="text-gray-400 hover:text-gray-600"><X size={10} /></button>
              </span>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={() => { setAddModal(false); setEditModal(false); }} className="btn-secondary"><X size={16} />Cancel</button>
        <button onClick={saveDrug} className="btn-primary"><Save size={16} />Save Drug</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Drug & Medication Stock</h1>
          <p className="text-sm text-gray-500">{drugs.filter((d) => d.isActive).length} drugs · {lowStockCount} low stock · {expiringCount} expiring soon</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'browse', label: 'Browse Catalog (42k)', icon: Library },
          { id: 'search', label: 'Search & Import Sources', icon: Globe },
          { id: 'add', label: 'Add Manually', icon: Plus },
        ].filter((item) => item.id !== 'add' || can('drugstock:create')).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { if (id === 'add') { setTab('inventory'); openAdd(); } else setTab(id as typeof tab); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Browse Catalog tab content */}
      {tab === 'browse' && <BrowseCatalog />}

      {/* Search tab content */}
      {tab === 'search' && <DrugSearchImport />}

      {/* Inventory tab content — wrap existing UI */}
      {tab === 'inventory' && (
       <>
       <div className="flex justify-end">
        <PermissionGate permission="drugstock:create">
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> Add Drug Manually
          </button>
        </PermissionGate>
       </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Drugs', value: drugs.filter((d) => d.isActive).length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Low / Out of Stock', value: lowStockCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Expiring (< 90d)', value: expiringCount, icon: FlaskConical, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Inventory Value', value: formatNaira(totalValue), icon: BarChart2, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={16} className={color} />
              <span className="text-xs font-medium text-gray-600">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, generic, brand..."
            className="input-field pl-9"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as DrugCategory | 'all')} className="select-field w-auto">
          <option value="all">All Categories</option>
          {(Object.keys(CATEGORY_LABELS) as DrugCategory[]).map((k) => (
            <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="rounded" />
          Low stock only
        </label>
      </div>

      {/* Drug List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <Package size={48} className="mx-auto mb-2 opacity-30" />
            <p>No drugs found matching your filters.</p>
          </div>
        ) : filtered.map((drug) => (
          <div key={drug.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${drug.quantityInStock === 0 ? 'border-red-300' : drug.quantityInStock <= drug.reorderLevel ? 'border-orange-300' : 'border-gray-200'}`}>
            {/* Row */}
            <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === drug.id ? null : drug.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{drug.name}</span>
                  <span className="text-xs text-gray-500">{drug.genericName}</span>
                  {drug.controlledStatus !== 'uncontrolled' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONTROLLED_BADGE[drug.controlledStatus]}`}>
                      {CONTROLLED_LABEL[drug.controlledStatus]}
                    </span>
                  )}
                  {drug.sourceMetadata?.sources?.length ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {drug.sourceMetadata.sources.join(' + ')}
                    </span>
                  ) : null}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{CATEGORY_LABELS[drug.category]}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{drug.strength} · {drug.formulation} · {drug.routes.map((r) => ROUTE_LABELS[r]).join(', ')}</p>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className={`text-lg font-bold ${stockColor(drug)}`}>{drug.quantityInStock} <span className="text-xs font-normal text-gray-500">{drug.unit}s</span></p>
                <p className="text-xs text-gray-400">Reorder ≤ {drug.reorderLevel}</p>
              </div>
              <div className="text-right flex-shrink-0 hidden md:block">
                <p className={`text-sm ${expiryColor(drug.expiryDate)}`}>Exp: {drug.expiryDate.slice(0, 10)}</p>
                <p className="text-xs text-gray-400">{drug.location}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <PermissionGate permission="drugstock:edit">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedDrug(drug); setRestockQty(drug.reorderQuantity); setRestockModal(true); }}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                    title="Restock"
                  >
                    <ArrowUpCircle size={16} />
                  </button>
                </PermissionGate>
                <PermissionGate permission="drugstock:edit">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(drug); }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                </PermissionGate>
                <PermissionGate permission="drugstock:delete">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(drug.id); }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </PermissionGate>
                {expandedId === drug.id ? <ChevronUp size={16} className="text-gray-400 ml-1" /> : <ChevronDown size={16} className="text-gray-400 ml-1" />}
              </div>
            </div>

            {/* Expanded Detail */}
            {expandedId === drug.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {/* Dosages */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1"><Info size={14} /> Dosage Guidelines</h4>
                  {drug.dosages.length === 0 ? <p className="text-gray-400">No dosage information recorded.</p> : (
                    <div className="space-y-2">
                      {drug.dosages.map((d) => (
                        <div key={d.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="font-medium text-gray-800">{d.indication}</p>
                          <div className="grid grid-cols-2 gap-x-4 mt-1 text-xs text-gray-600">
                            <p><span className="text-gray-500">Adult:</span> {d.adultDose}</p>
                            {d.paediatricDose && <p><span className="text-gray-500">Paeds:</span> {d.paediatricDose}</p>}
                            <p><span className="text-gray-500">Frequency:</span> {d.frequency}</p>
                            {d.maxDailyDose && <p><span className="text-gray-500">Max/day:</span> {d.maxDailyDose}</p>}
                            {d.duration && <p><span className="text-gray-500">Duration:</span> {d.duration}</p>}
                            {d.renalAdjustment && <p className="col-span-2 text-amber-700"><span className="font-medium">Renal:</span> {d.renalAdjustment}</p>}
                            {d.hepaticAdjustment && <p className="col-span-2 text-amber-700"><span className="font-medium">Hepatic:</span> {d.hepaticAdjustment}</p>}
                          </div>
                          {d.notes && <p className="text-xs text-blue-700 mt-1 italic">{d.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Safety */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Contraindications</h4>
                    {drug.contraindications.length ? (
                      <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                        {drug.contraindications.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    ) : <p className="text-gray-400 text-xs">None documented</p>}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Side Effects</h4>
                    <div className="flex flex-wrap gap-1">
                      {drug.sideEffects.map((s, i) => <span key={i} className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-800 rounded-full">{s}</span>)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Drug Interactions</h4>
                    <div className="flex flex-wrap gap-1">
                      {drug.interactions.length ? drug.interactions.map((i, idx) => <span key={idx} className="text-xs px-2 py-0.5 bg-red-50 text-red-800 rounded-full">{i}</span>)
                        : <span className="text-gray-400 text-xs">None documented</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Storage</h4>
                    <p className="text-xs text-gray-600">{drug.storageConditions}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Location: {drug.location}</p>
                    <p className="text-xs text-gray-500">Batch: {drug.batchNumber} · Manufacturer: {drug.manufacturer}</p>
                    {drug.sourceMetadata && (
                      <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                        {drug.sourceMetadata.rxcui && <p>RxCUI: {drug.sourceMetadata.rxcui}</p>}
                        {drug.sourceMetadata.ndcProductCode && <p>NDC product: {drug.sourceMetadata.ndcProductCode}</p>}
                        {drug.sourceMetadata.splSetId && <p>DailyMed SetID: {drug.sourceMetadata.splSetId}</p>}
                        {drug.sourceMetadata.labelUrl && (
                          <a href={drug.sourceMetadata.labelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Open DailyMed label
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
       </>
      )}

      {/* Add/Edit Modals */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New Drug" size="xl">
        <DrugForm />
      </Modal>
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Drug" size="xl">
        <DrugForm />
      </Modal>

      {/* Restock Modal */}
      <Modal isOpen={restockModal} onClose={() => setRestockModal(false)} title={`Restock: ${selectedDrug?.name}`}>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Current stock: <strong>{selectedDrug?.quantityInStock} {selectedDrug?.unit}s</strong></p>
          <div>
            <label className="label">Quantity to Add</label>
            <input
              type="number"
              value={restockQty}
              onChange={(e) => setRestockQty(+e.target.value)}
              className="input-field"
              min={1}
            />
          </div>
          <p className="text-sm text-gray-500">New stock will be: <strong>{(selectedDrug?.quantityInStock ?? 0) + restockQty} {selectedDrug?.unit}s</strong></p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setRestockModal(false)} className="btn-secondary"><X size={16} />Cancel</button>
            <button onClick={doRestock} className="btn-success"><ArrowUpCircle size={16} />Confirm Restock</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm && can('drugstock:delete')) deleteDrug(deleteConfirm); }}
        title="Delete Drug Record"
        message="Remove this drug from the stock list? Historical records will be retained."
      />
    </div>
  );
}

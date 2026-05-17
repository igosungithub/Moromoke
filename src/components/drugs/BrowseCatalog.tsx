import { useEffect, useMemo, useState } from 'react';
import {
  Library, Plus, Loader2, Search, CheckSquare, Square,
  ChevronLeft, ChevronRight, CheckCheck
} from 'lucide-react';
import {
  browseOfflineCatalog,
  loadOfflineCatalog,
  searchOfflineCatalog,
  lastOfflineCatalogError,
  type OfflineCatalogEntry,
} from '../../services/offlineDrugCatalog';
import { useDrugStore } from '../../store/drugStore';
import { useUIStore } from '../../store/uiStore';
import { usePermissions } from '../../hooks/usePermissions';
import type { DrugStockItem } from '../../types/drugStock';

const PAGE_SIZE = 50;

// Convert a catalog entry into a minimal stock item at quantity 0. Hospital
// staff will then edit the row in the Inventory tab to set real qty, batch,
// expiry, and pricing when the delivery arrives.
function entryToStockItem(e: OfflineCatalogEntry): Omit<DrugStockItem, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: e.brands[0] || e.name,
    genericName: e.generic || e.name,
    brandNames: e.brands.slice(0, 8),
    category: 'other',
    formulation: 'tablet',
    strength: '',
    unit: 'unit',
    routes: e.route ? [normalizeRoute(e.route)] : ['oral'],
    dosages: [],
    quantityInStock: 0,
    reorderLevel: 50,
    reorderQuantity: 100,
    unitCost: 0,
    currency: 'NGN',
    batchNumber: '',
    expiryDate: '',
    manufacturer: '',
    controlledStatus: 'uncontrolled',
    requiresPrescription: true,
    contraindications: [],
    sideEffects: [],
    interactions: [],
    storageConditions: '',
    location: '',
    isActive: true,
    sourceMetadata: {
      sources: e.source.includes('openfda-ndc') ? ['fda_ndc'] : ['rxnorm'],
      rxcui: e.rxcui,
      ndcProductCode: e.ndc,
      importedAt: new Date().toISOString(),
    },
  };
}

// Best-effort route mapping — FDA labels often store free text like 'oral'
// or 'intravenous'. Map common ones; default to 'oral'.
function normalizeRoute(r: string): DrugStockItem['routes'][number] {
  const v = r.toLowerCase();
  const map: Record<string, DrugStockItem['routes'][number]> = {
    oral: 'oral', po: 'oral',
    intravenous: 'intravenous', iv: 'intravenous',
    intramuscular: 'intramuscular', im: 'intramuscular',
    subcutaneous: 'subcutaneous', sc: 'subcutaneous',
    sublingual: 'sublingual', buccal: 'buccal',
    topical: 'topical', transdermal: 'transdermal',
    rectal: 'rectal', vaginal: 'vaginal',
    ophthalmic: 'ophthalmic', otic: 'otic',
    nasal: 'nasal', inhalation: 'inhalation',
    nebulisation: 'nebulisation', nebulization: 'nebulisation',
    intrathecal: 'intrathecal', epidural: 'epidural',
    intradermal: 'intradermal',
  };
  for (const [k, v2] of Object.entries(map)) {
    if (v.includes(k)) return v2;
  }
  return 'oral';
}

export default function BrowseCatalog() {
  const { drugs, addDrug } = useDrugStore();
  const { addNotification } = useUIStore();
  const { can } = usePermissions();

  // Tri-state lifecycle so "still loading" can be distinguished from
  // "load completed but failed". Previously both used `null` which made
  // the spinner run forever when the catalog failed to load on Workers.
  type CatalogState = { status: 'loading' } | { status: 'ready'; count: number } | { status: 'error'; reason: string };
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OfflineCatalogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [hideAlreadyInStock, setHideAlreadyInStock] = useState(false);

  // Detect catalog presence on mount; retriable via the Retry button.
  async function probeCatalog() {
    setCatalog({ status: 'loading' });
    const idx = await loadOfflineCatalog();
    if (idx && typeof idx.count === 'number') {
      setCatalog({ status: 'ready', count: idx.count });
    } else {
      setCatalog({ status: 'error', reason: lastOfflineCatalogError() || 'Unknown failure loading offline catalog.' });
    }
  }

  useEffect(() => {
    probeCatalog();
  }, []);

  // Debounce the filter input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(filter.trim()), 250);
    return () => clearTimeout(t);
  }, [filter]);

  // Load current page (with or without filter)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (debouncedFilter) {
          const matches = await searchOfflineCatalog(debouncedFilter, 1000);
          if (cancelled) return;
          setTotal(matches.length);
          const start = (page - 1) * PAGE_SIZE;
          setItems(matches.slice(start, start + PAGE_SIZE));
        } else {
          const { entries, total: t } = await browseOfflineCatalog(page, PAGE_SIZE);
          if (cancelled) return;
          setItems(entries);
          setTotal(t);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, debouncedFilter]);

  // When filter changes, reset to page 1
  useEffect(() => { setPage(1); }, [debouncedFilter]);

  // Build a quick lookup for in-stock entries (by rxcui / ndc / normalised name)
  const inStockKeys = useMemo(() => {
    const set = new Set<string>();
    for (const d of drugs) {
      if (d.sourceMetadata?.rxcui) set.add('rxcui:' + d.sourceMetadata.rxcui);
      if (d.sourceMetadata?.ndcProductCode) set.add('ndc:' + d.sourceMetadata.ndcProductCode);
      set.add('name:' + d.name.toLowerCase());
      set.add('gen:' + d.genericName.toLowerCase());
    }
    return set;
  }, [drugs]);

  function isInStock(e: OfflineCatalogEntry): boolean {
    if (e.rxcui && inStockKeys.has('rxcui:' + e.rxcui)) return true;
    if (e.ndc && inStockKeys.has('ndc:' + e.ndc)) return true;
    if (inStockKeys.has('name:' + e.name.toLowerCase())) return true;
    if (e.generic && inStockKeys.has('gen:' + e.generic.toLowerCase())) return true;
    return false;
  }

  const visibleItems = useMemo(() => {
    return hideAlreadyInStock ? items.filter((e) => !isInStock(e)) : items;
  }, [items, hideAlreadyInStock, inStockKeys]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      const importableOnPage = visibleItems.filter((e) => !isInStock(e));
      const allSelected = importableOnPage.every((e) => next.has(e.key));
      if (allSelected) {
        for (const e of importableOnPage) next.delete(e.key);
      } else {
        for (const e of importableOnPage) next.add(e.key);
      }
      return next;
    });
  }

  async function importSingle(e: OfflineCatalogEntry) {
    if (!can('drugstock:create')) return;
    addDrug(entryToStockItem(e));
    addNotification({
      type: 'success',
      title: 'Imported to inventory',
      message: `${e.name} added at qty 0. Edit it in Inventory to set quantity, batch, expiry, and pricing.`,
    });
  }

  async function importSelected() {
    if (!can('drugstock:create')) return;
    if (selected.size === 0) return;
    setImporting(true);
    try {
      // Resolve all selected keys to entries by paging through index in chunks
      // (we may have selections across pages).
      const idx = await loadOfflineCatalog();
      if (!idx) return;
      const map = new Map(idx.entries.map((e) => [e.key, e]));
      let added = 0;
      let skipped = 0;
      for (const key of selected) {
        const entry = map.get(key);
        if (!entry) { skipped += 1; continue; }
        if (isInStock(entry)) { skipped += 1; continue; }
        addDrug(entryToStockItem(entry));
        added += 1;
      }
      addNotification({
        type: 'success',
        title: `Imported ${added} drug${added === 1 ? '' : 's'} to inventory`,
        message: skipped > 0
          ? `${skipped} already in stock — left untouched. Edit each new row in Inventory to set quantity, batch, expiry.`
          : 'All imported at qty 0. Edit each row in Inventory to set quantity, batch, expiry.',
      });
      setSelected(new Set());
    } finally {
      setImporting(false);
    }
  }

  if (catalog.status === 'loading') {
    return (
      <div className="card text-center py-12 text-gray-500">
        <Loader2 size={28} className="mx-auto animate-spin opacity-50 mb-2" />
        <p className="text-sm">Loading offline catalog…</p>
        <p className="text-xs text-gray-400 mt-1">Fetching 14 MB index — first load takes a few seconds.</p>
      </div>
    );
  }

  if (catalog.status === 'error') {
    return (
      <div className="card text-center py-12 text-gray-500">
        <Library size={36} className="mx-auto opacity-40 mb-2" />
        <p className="font-medium text-gray-700">Offline catalog couldn't be loaded</p>
        <p className="text-xs text-red-600 mt-2 max-w-md mx-auto break-words">{catalog.reason}</p>
        <p className="text-xs text-gray-500 mt-3 max-w-md mx-auto">
          If you're running locally and the file is missing, run{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded">npm run download:drug-catalogs -- --include-large-files</code> then
          <code className="bg-gray-100 px-1 py-0.5 rounded ml-1">node scripts/normalize-drug-catalogs.mjs</code>.
          Otherwise this is usually a transient network or browser-memory issue — try again.
        </p>
        <button onClick={probeCatalog} className="btn-primary text-xs mt-4">
          Retry
        </button>
      </div>
    );
  }

  const available = catalog.count;

  return (
    <div className="space-y-3">
      <div className="card bg-emerald-50 border-emerald-200">
        <div className="flex gap-3">
          <Library size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-emerald-900 mb-1">
              Browse all {available.toLocaleString()} catalog drugs
            </p>
            <p className="text-emerald-800">
              Tick the drugs you've received a delivery for and click <strong>Import to Inventory</strong>.
              They're added at <strong>quantity 0</strong> so you can edit the actual stock, batch number, expiry date, and unit cost on the Inventory tab.
              Catalog ≠ stock — only drugs you physically have should live in Inventory.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter catalog — brand, generic, NDC, RxCUI…"
              className="input-field pl-9 text-sm"
            />
          </div>
          <label className="text-xs text-gray-600 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideAlreadyInStock}
              onChange={(e) => setHideAlreadyInStock(e.target.checked)}
              className="rounded"
            />
            Hide drugs already in stock
          </label>
          <div className="flex items-center gap-2 text-xs text-gray-500 ml-auto">
            <span>{total.toLocaleString()} match{total === 1 ? '' : 'es'}</span>
            {selected.size > 0 && (
              <span className="text-blue-700 font-medium">· {selected.size} selected</span>
            )}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="card bg-blue-50 border-blue-200 flex items-center gap-3 py-2">
          <CheckCheck size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {selected.size} drug{selected.size === 1 ? '' : 's'} selected
          </span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-600 hover:text-gray-900 ml-2"
          >
            Clear
          </button>
          <button
            onClick={importSelected}
            disabled={importing || !can('drugstock:create')}
            className="btn-primary text-xs ml-auto"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Import {selected.size} to Inventory at qty 0
          </button>
        </div>
      )}

      {/* List */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2 w-10">
                <button onClick={toggleAllOnPage} title="Select all on this page" className="text-gray-400 hover:text-blue-600">
                  {visibleItems.length > 0 && visibleItems.every((e) => isInStock(e) || selected.has(e.key)) ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Name / Generic</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Brands</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">NDC</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Form / Route</th>
              <th className="text-right text-xs font-semibold text-gray-600 px-3 py-2 w-32">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                <Loader2 size={24} className="mx-auto animate-spin opacity-50" />
              </td></tr>
            ) : visibleItems.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                {debouncedFilter ? `No catalog drugs match "${debouncedFilter}".` : 'No catalog drugs to show.'}
              </td></tr>
            ) : (
              visibleItems.map((e) => {
                const inStock = isInStock(e);
                const isSelected = selected.has(e.key);
                return (
                  <tr key={e.key} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-2">
                      <button
                        disabled={inStock}
                        onClick={() => toggle(e.key)}
                        className={`${inStock ? 'text-gray-200 cursor-not-allowed' : isSelected ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                        title={inStock ? 'Already in inventory' : isSelected ? 'Deselect' : 'Select for bulk import'}
                      >
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900 line-clamp-1">{e.name}</p>
                      {e.generic && e.generic !== e.name && (
                        <p className="text-xs text-gray-500 line-clamp-1">{e.generic}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 line-clamp-1">
                      {e.brands.length > 0 ? e.brands.slice(0, 3).join(', ') : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-500">
                      {e.ndc || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {e.dosageForm || '—'}
                      {e.route && <span className="text-gray-400"> · {e.route}</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {inStock ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">In inventory</span>
                      ) : (
                        <button
                          onClick={() => importSingle(e)}
                          disabled={!can('drugstock:create')}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 disabled:text-gray-400"
                          title="Add this drug to inventory at qty 0"
                        >
                          <Plus size={12} /> Import
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-gray-100 text-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-gray-500">
              Page {page} of {totalPages.toLocaleString()} ({(((page - 1) * PAGE_SIZE) + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, total).toLocaleString()} of {total.toLocaleString()})
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={page}
                min={1}
                max={totalPages}
                onChange={(e) => {
                  const p = Math.max(1, Math.min(totalPages, parseInt(e.target.value, 10) || 1));
                  setPage(p);
                }}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-right"
              />
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="btn-secondary text-xs disabled:opacity-50"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

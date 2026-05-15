import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink, Loader2, Pill, AlertCircle, Info, Database, FileText, Building2 } from 'lucide-react';
import {
  searchAllDrugSources,
  fetchOpenFdaLabel,
  suggestRxNorm,
  parseFdaText,
  catalogResultToStockItem,
  type DrugCatalogResult,
  type FdaDrugResult,
} from '../../services/drugApi';
import { useDrugStore } from '../../store/drugStore';
import { useUIStore } from '../../store/uiStore';
import { PermissionGate } from '../ui/PermissionGate';

const SOURCE_LABELS: Record<DrugCatalogResult['source'], string> = {
  rxnorm: 'RxNorm / RxCUI',
  fda_ndc: 'FDA NDC',
  dailymed: 'DailyMed SPL',
};

const SOURCE_STYLES: Record<DrugCatalogResult['source'], string> = {
  rxnorm: 'bg-blue-100 text-blue-700',
  fda_ndc: 'bg-emerald-100 text-emerald-700',
  dailymed: 'bg-purple-100 text-purple-700',
};

export default function DrugSearchImport() {
  const { addDrug, drugs } = useDrugStore();
  const { addNotification } = useUIStore();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<DrugCatalogResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugCatalogResult | null>(null);
  const [labelData, setLabelData] = useState<FdaDrugResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | DrugCatalogResult['source']>('all');

  const [offlineCount, setOfflineCount] = useState<number | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { loadOfflineCatalog } = await import('../../services/offlineDrugCatalog');
        const idx = await loadOfflineCatalog();
        setOfflineCount(idx?.count ?? null);
      } catch {
        setOfflineCount(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const s = await suggestRxNorm(query);
        setSuggestions(s.slice(0, 6));
      } catch {
        setSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  async function doSearch(q?: string) {
    const searchTerm = (q ?? query).trim();
    if (!searchTerm) return;
    setSearching(true);
    setError(null);
    setResults([]);
    setSelectedDrug(null);
    setLabelData(null);
    try {
      const rows = await searchAllDrugSources(searchTerm);
      setResults(rows);
      if (rows.length === 0) setError('No records found. Try brand name, generic name, RxCUI, or NDC product code.');
    } catch (e) {
      setError(`Search failed: ${(e as Error).message}. Please check your internet connection.`);
    } finally {
      setSearching(false);
    }
  }

  async function selectDrug(d: DrugCatalogResult) {
    setSelectedDrug(d);
    setLoadingDetail(true);
    setLabelData(null);
    try {
      // Offline catalog results carry id 'offline-<key>'. Try local partition first.
      if (d.id.startsWith('offline-')) {
        const { loadOfflineCatalog, loadDetail } = await import('../../services/offlineDrugCatalog');
        const idx = await loadOfflineCatalog();
        const key = d.id.replace(/^offline-/, '');
        const entry = idx?.entries.find((e) => e.key === key);
        if (entry) {
          const detail = await loadDetail(entry);
          if (detail) {
            setLabelData({
              id: `offline-${key}`,
              set_id: detail.ndc ?? key,
              openfda: {
                generic_name: entry.generic ? [entry.generic] : undefined,
                brand_name: entry.brands?.length ? entry.brands : undefined,
                manufacturer_name: detail.manufacturer ? [detail.manufacturer] : undefined,
                product_ndc: entry.ndc ? [entry.ndc] : undefined,
                route: entry.route ? [entry.route] : undefined,
                rxcui: entry.rxcui ? [entry.rxcui] : undefined,
              },
              dosage_and_administration: detail.dosage ? [detail.dosage] : undefined,
              indications_and_usage: detail.indications ? [detail.indications] : undefined,
              contraindications: detail.contraindications ? [detail.contraindications] : undefined,
              warnings: detail.warnings ? [detail.warnings] : undefined,
              adverse_reactions: detail.adverseReactions ? [detail.adverseReactions] : undefined,
              drug_interactions: detail.drugInteractions ? [detail.drugInteractions] : undefined,
              storage_and_handling: detail.storage ? [detail.storage] : undefined,
            } as unknown as FdaDrugResult);
            return;
          }
        }
      }
      // Live OpenFDA fallback
      const label = await fetchOpenFdaLabel(d.genericName || d.brandName || d.name);
      setLabelData(label);
    } catch {
      setLabelData(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  function importDrug() {
    if (!selectedDrug) return;
    const stockItem = catalogResultToStockItem(selectedDrug, labelData);
    addDrug(stockItem);
    addNotification({
      type: 'success',
      title: 'Drug imported',
      message: `${stockItem.name} added to inventory. Add local stock, Nigerian pricing, expiry, and formulary status before dispensing.`,
    });
    setSelectedDrug(null);
    setLabelData(null);
  }

  const visibleResults = sourceFilter === 'all' ? results : results.filter((r) => r.source === sourceFilter);
  const alreadyInStock = (d: DrugCatalogResult) => drugs.some((item) =>
    item.sourceMetadata?.rxcui === d.rxcui ||
    item.sourceMetadata?.ndcProductCode === d.ndcProductCode ||
    item.sourceMetadata?.splSetId === d.splSetId ||
    item.name.toLowerCase() === d.name.toLowerCase() ||
    item.genericName.toLowerCase() === (d.genericName || d.name).toLowerCase()
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <Database size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 mb-1">Authoritative drug catalog search</p>
            <p className="text-blue-800">
              {offlineCount !== null ? (
                <>Searching <strong>{offlineCount.toLocaleString()}</strong> drugs from the offline catalog (OpenFDA NDC + labels). Falls back to live RxNorm / FDA / DailyMed only when offline data is missing.</>
              ) : (
                <>Live search via RxNorm/RxCUIs, FDA NDC, DailyMed SPL. To enable offline search, run <code className="bg-blue-100 px-1 py-0.5 rounded">npm run download:drug-catalogs -- --include-large-files</code> then <code className="bg-blue-100 px-1 py-0.5 rounded">node scripts/normalize-drug-catalogs.mjs</code>.</>
              )}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              NHS dm+d requires NHS/TRUD-licensed release files; Odoo should be connected as your hospital ERP product master.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
              placeholder="Search drug name, brand, active ingredient, RxCUI, or NDC..."
              className="input-field pl-9"
            />
          </div>
          <button onClick={() => doSearch()} disabled={searching || query.length < 2} className="btn-primary">
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>

        {suggestions.length > 0 && results.length === 0 && (
          <div className="mt-3 text-xs text-gray-600">
            Did you mean: {suggestions.map((s) => (
              <button key={s} onClick={() => { setQuery(s); doSearch(s); }} className="ml-1 text-blue-600 underline hover:text-blue-800">
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Pill size={16} className="text-blue-600" />
              Source Results {results.length > 0 && <span className="text-xs text-gray-500 font-normal">({visibleResults.length})</span>}
            </h3>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)} className="select-field w-auto text-xs">
              <option value="all">All sources</option>
              <option value="rxnorm">RxNorm</option>
              <option value="fda_ndc">FDA NDC</option>
              <option value="dailymed">DailyMed</option>
            </select>
          </div>

          {searching ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 size={32} className="mx-auto animate-spin opacity-50" />
              <p className="text-sm mt-2">Searching source catalogs...</p>
            </div>
          ) : visibleResults.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Enter a drug name above to start.</p>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto">
              {visibleResults.map((d) => (
                <button
                  key={d.id}
                  onClick={() => selectDrug(d)}
                  className={`w-full text-left p-3 border rounded-lg transition-colors ${
                    selectedDrug?.id === d.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                      {d.genericName && d.genericName !== d.name && <p className="text-xs text-gray-500 mt-0.5">{d.genericName}</p>}
                      {d.manufacturer && <p className="text-xs text-gray-400">{d.manufacturer}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${SOURCE_STYLES[d.source]}`}>{SOURCE_LABELS[d.source]}</span>
                      {alreadyInStock(d) && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">In stock</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mt-2">
                    {d.rxcui && <span>RxCUI: {d.rxcui}</span>}
                    {d.ndcProductCode && <span>NDC: {d.ndcProductCode}</span>}
                    {d.splSetId && <span>SPL: {d.splSetId.slice(0, 12)}...</span>}
                    {d.tty && <span>{d.tty}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Info size={16} className="text-purple-600" />
            Label, Safety, and Source IDs
          </h3>
          {!selectedDrug ? (
            <div className="text-sm text-gray-400 text-center py-8">
              <FileText size={36} className="mx-auto opacity-40 mb-2" />
              Select a record to inspect and import it.
            </div>
          ) : loadingDetail ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 size={32} className="mx-auto animate-spin opacity-50" />
              <p className="text-sm mt-2">Fetching FDA/DailyMed label data...</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-y-auto text-sm">
              <div className="border-b pb-2">
                <p className="font-semibold text-gray-900">{selectedDrug.name}</p>
                <p className="text-xs text-gray-500">{SOURCE_LABELS[selectedDrug.source]}</p>
                {selectedDrug.rxcui && <p className="text-xs text-gray-500">RxCUI: {selectedDrug.rxcui}</p>}
                {selectedDrug.ndcProductCode && <p className="text-xs text-gray-500">NDC product: {selectedDrug.ndcProductCode}</p>}
                {selectedDrug.ndcPackageCodes?.length ? <p className="text-xs text-gray-500">Packages: {selectedDrug.ndcPackageCodes.slice(0, 3).join(', ')}</p> : null}
                {selectedDrug.splSetId && <p className="text-xs text-gray-500">DailyMed SetID: {selectedDrug.splSetId}</p>}
              </div>

              {!labelData && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  No matching openFDA label was returned. You can still import the source identifiers and complete the formulary details manually.
                </p>
              )}

              {labelData?.dosage_and_administration && <Section label="Dosage & Administration" text={parseFdaText(labelData.dosage_and_administration)} />}
              {labelData?.indications_and_usage && <Section label="Indications" text={parseFdaText(labelData.indications_and_usage)} />}
              {labelData?.contraindications && <Section label="Contraindications" text={parseFdaText(labelData.contraindications)} highlight="red" />}
              {labelData?.warnings && <Section label="Warnings" text={parseFdaText(labelData.warnings)} highlight="amber" />}
              {labelData?.adverse_reactions && <Section label="Adverse Reactions" text={parseFdaText(labelData.adverse_reactions)} />}
              {labelData?.drug_interactions && <Section label="Drug Interactions" text={parseFdaText(labelData.drug_interactions)} highlight="amber" />}
              {labelData?.storage_and_handling && <Section label="Storage" text={parseFdaText(labelData.storage_and_handling)} />}

              <div className="pt-3 border-t flex items-center gap-2 flex-wrap">
                <PermissionGate permission="drugstock:create" fallback={<p className="text-xs text-gray-400">No permission to import drugs.</p>}>
                  <button onClick={importDrug} disabled={alreadyInStock(selectedDrug)} className="btn-primary">
                    <Plus size={16} /> {alreadyInStock(selectedDrug) ? 'Already in inventory' : 'Import to Inventory'}
                  </button>
                </PermissionGate>
                {selectedDrug.rxcui && (
                  <a href={`https://rxnav.nlm.nih.gov/REST/rxcui/${selectedDrug.rxcui}/allrelated.json`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                    <ExternalLink size={14} /> RxNorm
                  </a>
                )}
                {selectedDrug.splSetId && (
                  <a href={`https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${selectedDrug.splSetId}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                    <ExternalLink size={14} /> DailyMed
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SourceNote icon={Database} title="NHS dm+d" text="Prepared for dm+d IDs on inventory records. For launch, load the NHS/TRUD release files into your backend and map VMP/AMP codes to local formulary items." />
        <SourceNote icon={Building2} title="Odoo" text="Prepared for Odoo product IDs on inventory records. Use Odoo as the hospital purchasing/stock master and sync quantities through a backend connector." />
      </div>
    </div>
  );
}

function Section({ label, text, highlight }: { label: string; text: string; highlight?: 'red' | 'amber' }) {
  if (!text) return null;
  const bg = highlight === 'red' ? 'bg-red-50 border-red-200' : highlight === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200';
  return (
    <div className={`p-2 rounded border ${bg}`}>
      <p className="font-medium text-gray-800 text-xs uppercase mb-1">{label}</p>
      <p className="text-xs text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

function SourceNote({ icon: Icon, title, text }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm flex gap-3">
      <Icon size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

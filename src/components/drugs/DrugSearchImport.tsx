import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink, Loader2, Pill, AlertCircle, Info, Globe } from 'lucide-react';
import { searchRxNorm, fetchOpenFdaLabel, suggestRxNorm, parseFdaText, type RxNormDrug, type FdaDrugResult } from '../../services/drugApi';
import { useDrugStore } from '../../store/drugStore';
import { useUIStore } from '../../store/uiStore';
import { PermissionGate } from '../ui/PermissionGate';

export default function DrugSearchImport() {
  const { addDrug, drugs } = useDrugStore();
  const { addNotification } = useUIStore();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<RxNormDrug[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<RxNormDrug | null>(null);
  const [fdaData, setFdaData] = useState<FdaDrugResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced suggestion fetch
  useEffect(() => {
    if (!query || query.length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const s = await suggestRxNorm(query);
        setSuggestions(s.slice(0, 6));
      } catch { setSuggestions([]); }
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
    setFdaData(null);
    try {
      const r = await searchRxNorm(searchTerm);
      setResults(r);
      if (r.length === 0) setError('No drugs found in RxNorm database. Try a different spelling.');
    } catch (e) {
      setError(`Search failed: ${(e as Error).message}. Please check your internet connection.`);
    } finally {
      setSearching(false);
    }
  }

  async function selectDrug(d: RxNormDrug) {
    setSelectedDrug(d);
    setLoadingDetail(true);
    setFdaData(null);
    try {
      const label = await fetchOpenFdaLabel(d.name);
      setFdaData(label);
    } catch {
      // OpenFDA may not have data for all drugs — silent
    } finally {
      setLoadingDetail(false);
    }
  }

  function importDrug() {
    if (!selectedDrug) return;
    const fda = fdaData?.openfda;
    addDrug({
      name: selectedDrug.name,
      genericName: fda?.generic_name?.[0] || selectedDrug.name,
      brandNames: fda?.brand_name ?? [],
      category: 'other',
      formulation: 'tablet',
      strength: '',
      unit: 'tablet',
      routes: (fda?.route?.[0]?.toLowerCase().includes('oral') ? ['oral'] : ['oral']) as never,
      dosages: fdaData?.dosage_and_administration?.[0]
        ? [{ population: 'Adult', dose: parseFdaText(fdaData.dosage_and_administration).slice(0, 100), frequency: 'See label', route: 'oral' as never, notes: 'Imported from OpenFDA label — verify before use' }]
        : [],
      quantityInStock: 0,
      reorderLevel: 50,
      reorderQuantity: 100,
      unitCost: 0,
      currency: 'GBP',
      batchNumber: '',
      expiryDate: '',
      manufacturer: fda?.manufacturer_name?.[0] || '',
      controlledStatus: 'uncontrolled',
      requiresPrescription: true,
      contraindications: fdaData?.contraindications ? [parseFdaText(fdaData.contraindications)] : [],
      sideEffects: fdaData?.adverse_reactions ? [parseFdaText(fdaData.adverse_reactions)] : [],
      interactions: fdaData?.drug_interactions ? [parseFdaText(fdaData.drug_interactions)] : [],
      storageConditions: parseFdaText(fdaData?.storage_and_handling) || 'Below 25°C, protect from light',
      location: '',
      isActive: true,
    });
    addNotification({
      type: 'success',
      title: 'Drug imported',
      message: `${selectedDrug.name} added to inventory. Update stock quantity and expiry before dispensing.`,
    });
    setSelectedDrug(null);
    setFdaData(null);
  }

  const alreadyInStock = (name: string) => drugs.some((d) => d.name.toLowerCase() === name.toLowerCase() || d.genericName.toLowerCase() === name.toLowerCase());

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <Globe size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 mb-1">Live drug search powered by RxNorm + OpenFDA</p>
            <p className="text-blue-800">
              Search the U.S. National Library of Medicine RxNorm database ({'>'}100,000 drugs) and import full FDA label data
              (dosing, contraindications, side effects, interactions). All data is free, open-access, and updated daily.
              No API key required — direct browser-to-API calls.
            </p>
            <p className="text-xs text-blue-700 mt-1">
              ⚠ Always verify imported data against local formulary and BNF/NICE guidelines before dispensing.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
              placeholder="Search by drug name, brand, or active ingredient (e.g., amoxicillin, paracetamol, lisinopril)..."
              className="input-field pl-9"
            />
          </div>
          <button onClick={() => doSearch()} disabled={searching || query.length < 2} className="btn-primary">
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>

        {/* Did you mean */}
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

      {/* Results + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Results list */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Pill size={16} className="text-blue-600" />
            RxNorm Results {results.length > 0 && <span className="text-xs text-gray-500 font-normal">({results.length})</span>}
          </h3>
          {searching ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 size={32} className="mx-auto animate-spin opacity-50" />
              <p className="text-sm mt-2">Searching RxNorm…</p>
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Enter a drug name above to start.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {results.map((d) => (
                <button
                  key={d.rxcui}
                  onClick={() => selectDrug(d)}
                  className={`w-full text-left p-3 border rounded-lg transition-colors ${
                    selectedDrug?.rxcui === d.rxcui
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                      {d.synonym && <p className="text-xs text-gray-500 italic mt-0.5">{d.synonym}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">{d.tty}</span>
                      {alreadyInStock(d.name) && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">In stock</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">RxCUI: {d.rxcui}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Info size={16} className="text-purple-600" />
            FDA Label Data
          </h3>
          {!selectedDrug ? (
            <p className="text-sm text-gray-400 text-center py-8">Select a drug to view full FDA label data.</p>
          ) : loadingDetail ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 size={32} className="mx-auto animate-spin opacity-50" />
              <p className="text-sm mt-2">Fetching OpenFDA label…</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto text-sm">
              <div className="border-b pb-2">
                <p className="font-semibold text-gray-900">{selectedDrug.name}</p>
                {fdaData?.openfda?.generic_name?.[0] && (
                  <p className="text-xs text-gray-500">Generic: {fdaData.openfda.generic_name.join(', ')}</p>
                )}
                {fdaData?.openfda?.brand_name && fdaData.openfda.brand_name.length > 0 && (
                  <p className="text-xs text-gray-500">Brands: {fdaData.openfda.brand_name.slice(0, 5).join(', ')}</p>
                )}
                {fdaData?.openfda?.manufacturer_name?.[0] && (
                  <p className="text-xs text-gray-500">Mfr: {fdaData.openfda.manufacturer_name[0]}</p>
                )}
              </div>

              {!fdaData && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  No FDA label data found for this drug. You can still import it and add details manually.
                </p>
              )}

              {fdaData?.dosage_and_administration && (
                <Section label="Dosage & Administration" text={parseFdaText(fdaData.dosage_and_administration)} />
              )}
              {fdaData?.indications_and_usage && (
                <Section label="Indications" text={parseFdaText(fdaData.indications_and_usage)} />
              )}
              {fdaData?.contraindications && (
                <Section label="Contraindications" text={parseFdaText(fdaData.contraindications)} highlight="red" />
              )}
              {fdaData?.warnings && (
                <Section label="Warnings" text={parseFdaText(fdaData.warnings)} highlight="amber" />
              )}
              {fdaData?.adverse_reactions && (
                <Section label="Adverse Reactions" text={parseFdaText(fdaData.adverse_reactions)} />
              )}
              {fdaData?.drug_interactions && (
                <Section label="Drug Interactions" text={parseFdaText(fdaData.drug_interactions)} highlight="amber" />
              )}
              {fdaData?.storage_and_handling && (
                <Section label="Storage" text={parseFdaText(fdaData.storage_and_handling)} />
              )}

              <div className="pt-3 border-t flex items-center gap-2">
                <PermissionGate permission="drugstock:create" fallback={<p className="text-xs text-gray-400">No permission to import drugs.</p>}>
                  <button onClick={importDrug} disabled={alreadyInStock(selectedDrug.name)} className="btn-primary">
                    <Plus size={16} /> {alreadyInStock(selectedDrug.name) ? 'Already in inventory' : 'Import to Inventory'}
                  </button>
                </PermissionGate>
                <a
                  href={`https://rxnav.nlm.nih.gov/REST/rxcui/${selectedDrug.rxcui}/allrelated.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs"
                >
                  <ExternalLink size={14} /> RxNorm
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer credits */}
      <div className="text-xs text-gray-400 text-center">
        Data sources:{' '}
        <a href="https://rxnav.nlm.nih.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">RxNorm (NIH/NLM)</a>{' '}·{' '}
        <a href="https://open.fda.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">OpenFDA</a>
      </div>
    </div>
  );
}

function Section({ label, text, highlight }: { label: string; text: string; highlight?: 'red' | 'amber' }) {
  if (!text) return null;
  const bg = highlight === 'red' ? 'bg-red-50 border-red-200' : highlight === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200';
  return (
    <div className={`p-2 rounded border ${bg}`}>
      <p className="font-medium text-gray-800 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xs text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

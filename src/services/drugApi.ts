import type { DrugStockItem, RouteOfAdministration } from '../types/drugStock';

type DrugSourceList = NonNullable<DrugStockItem['sourceMetadata']>['sources'];

export interface RxNormDrug {
  rxcui: string;
  name: string;
  synonym?: string;
  tty: string;
}

export interface OpenFdaLabel {
  brand_name?: string[];
  generic_name?: string[];
  manufacturer_name?: string[];
  route?: string[];
  dosage_and_administration?: string[];
  warnings?: string[];
  contraindications?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  description?: string[];
  purpose?: string[];
  indications_and_usage?: string[];
  storage_and_handling?: string[];
  active_ingredient?: string[];
  rxcui?: string[];
  spl_set_id?: string[];
  spl_id?: string[];
}

export interface FdaDrugResult {
  id: string;
  set_id: string;
  openfda: OpenFdaLabel;
  dosage_and_administration?: string[];
  warnings?: string[];
  contraindications?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  indications_and_usage?: string[];
  storage_and_handling?: string[];
  description?: string[];
}

export interface FdaNdcProduct {
  product_ndc?: string;
  product_type?: string;
  brand_name?: string;
  generic_name?: string;
  labeler_name?: string;
  active_ingredients?: { name?: string; strength?: string }[];
  finished?: boolean;
  packaging?: { package_ndc?: string; description?: string; marketing_start_date?: string; marketing_end_date?: string }[];
  dosage_form?: string;
  route?: string[];
  marketing_category?: string;
  listing_expiration_date?: string;
  openfda?: OpenFdaLabel;
}

export interface DailyMedDrug {
  setid: string;
  spl_version?: string;
  title: string;
  published_date?: string;
}

export type CatalogSource = 'rxnorm' | 'fda_ndc' | 'dailymed';

export interface DrugCatalogResult {
  id: string;
  source: CatalogSource;
  name: string;
  genericName?: string;
  brandName?: string;
  manufacturer?: string;
  rxcui?: string;
  ndcProductCode?: string;
  ndcPackageCodes?: string[];
  splSetId?: string;
  splId?: string;
  tty?: string;
  route?: string[];
  dosageForm?: string;
  label?: FdaDrugResult | null;
  ndc?: FdaNdcProduct;
  dailyMed?: DailyMedDrug;
}

const TTY_LABELS: Record<string, string> = {
  IN: 'Ingredient',
  BN: 'Brand Name',
  PIN: 'Precise Ingredient',
  MIN: 'Multiple Ingredients',
  SCDF: 'Clinical Drug Form',
  SCD: 'Clinical Drug',
  SBD: 'Branded Drug',
  GPCK: 'Generic Pack',
  BPCK: 'Branded Pack',
  DF: 'Dose Form',
  DFG: 'Dose Form Group',
};

const ROUTE_MAP: Record<string, RouteOfAdministration> = {
  oral: 'oral',
  intravenous: 'intravenous',
  intramuscular: 'intramuscular',
  subcutaneous: 'subcutaneous',
  topical: 'topical',
  ophthalmic: 'ophthalmic',
  otic: 'otic',
  nasal: 'nasal',
  rectal: 'rectal',
  vaginal: 'vaginal',
  inhalation: 'inhalation',
  nebulisation: 'nebulisation',
  transdermal: 'transdermal',
  sublingual: 'sublingual',
  buccal: 'buccal',
  intradermal: 'intradermal',
  intrathecal: 'intrathecal',
  epidural: 'epidural',
};

function normalizeRoute(route?: string[]): RouteOfAdministration[] {
  const found = (route ?? [])
    .map((r) => ROUTE_MAP[r.toLowerCase().replace(/_/g, ' ')] ?? ROUTE_MAP[r.toLowerCase()])
    .filter(Boolean);
  return found.length ? Array.from(new Set(found)) : ['oral'];
}

export async function searchRxNorm(query: string): Promise<RxNormDrug[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query.trim())}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('RxNorm API error');
  const data = await res.json();
  const groups: RxNormDrug[] = [];
  const conceptGroups = data?.drugGroup?.conceptGroup ?? [];
  for (const group of conceptGroups) {
    const props = group.conceptProperties ?? [];
    for (const p of props) {
      groups.push({ rxcui: p.rxcui, name: p.name, synonym: p.synonym, tty: TTY_LABELS[p.tty] || p.tty });
    }
  }
  const seen = new Set<string>();
  return groups.filter((d) => {
    const key = d.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchOpenFdaLabel(drugName: string): Promise<FdaDrugResult | null> {
  const safeQuery = encodeURIComponent(`"${drugName}"`);
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${safeQuery}+openfda.brand_name:${safeQuery}&limit=3`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const fallback = await fetch(`https://api.fda.gov/drug/label.json?search=${encodeURIComponent(drugName)}&limit=3`);
      if (!fallback.ok) return null;
      const fd = await fallback.json();
      return fd?.results?.[0] ?? null;
    }
    const data = await res.json();
    return data?.results?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function searchFdaNdc(query: string, limit = 25): Promise<FdaNdcProduct[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  const terms = [
    `brand_name:"${q}"`,
    `generic_name:"${q}"`,
    `active_ingredients.name:"${q}"`,
    `product_ndc:"${q}"`,
    `openfda.rxcui:"${q}"`,
  ].join('+');
  const url = `https://api.fda.gov/drug/ndc.json?search=${encodeURIComponent(terms)}&limit=${limit}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const fallback = await fetch(`https://api.fda.gov/drug/ndc.json?search=${encodeURIComponent(q)}&limit=${limit}`);
      if (!fallback.ok) return [];
      const fd = await fallback.json();
      return fd?.results ?? [];
    }
    const data = await res.json();
    return data?.results ?? [];
  } catch {
    return [];
  }
}

export async function searchDailyMed(query: string): Promise<DailyMedDrug[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=${encodeURIComponent(query.trim())}&pagesize=25`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchDailyMedNdcs(setid: string): Promise<string[]> {
  if (!setid) return [];
  const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${encodeURIComponent(setid)}/ndcs.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? []).map((row: { ndc?: string }) => row.ndc).filter(Boolean);
  } catch {
    return [];
  }
}

export async function suggestRxNorm(query: string): Promise<string[]> {
  if (!query || query.trim().length < 3) return [];
  const url = `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.suggestionGroup?.suggestionList?.suggestion ?? [];
}

export async function getRxNormRelated(rxcui: string): Promise<string[]> {
  const url = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=IN+BN`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const groups = data?.relatedGroup?.conceptGroup ?? [];
  const names: string[] = [];
  for (const g of groups) {
    for (const p of g.conceptProperties ?? []) names.push(p.name);
  }
  return names.slice(0, 10);
}

export async function searchAdverseEvents(drugName: string): Promise<{ term: string; count: number }[]> {
  const url = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&count=patient.reaction.reactionmeddrapt.exact&limit=10`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data?.results ?? [];
  } catch {
    return [];
  }
}

export async function searchAllDrugSources(query: string): Promise<DrugCatalogResult[]> {
  const [rxnorm, ndc, dailymed] = await Promise.all([
    searchRxNorm(query),
    searchFdaNdc(query),
    searchDailyMed(query),
  ]);

  const mappedRx = rxnorm.map((d): DrugCatalogResult => ({
    id: `rxnorm-${d.rxcui}`,
    source: 'rxnorm',
    name: d.name,
    genericName: d.name,
    rxcui: d.rxcui,
    tty: d.tty,
  }));

  const mappedNdc = ndc.map((d): DrugCatalogResult => ({
    id: `ndc-${d.product_ndc}`,
    source: 'fda_ndc',
    name: d.brand_name || d.generic_name || d.product_ndc || 'NDC product',
    brandName: d.brand_name,
    genericName: d.generic_name,
    manufacturer: d.labeler_name || d.openfda?.manufacturer_name?.[0],
    rxcui: d.openfda?.rxcui?.[0],
    ndcProductCode: d.product_ndc,
    ndcPackageCodes: d.packaging?.map((p) => p.package_ndc ?? '').filter(Boolean),
    splSetId: d.openfda?.spl_set_id?.[0],
    splId: d.openfda?.spl_id?.[0],
    route: d.route,
    dosageForm: d.dosage_form,
    ndc: d,
  }));

  const mappedDailyMed = dailymed.map((d): DrugCatalogResult => ({
    id: `dailymed-${d.setid}`,
    source: 'dailymed',
    name: d.title,
    splSetId: d.setid,
    dailyMed: d,
  }));

  const seen = new Set<string>();
  return [...mappedRx, ...mappedNdc, ...mappedDailyMed].filter((item) => {
    const key = `${item.source}:${item.rxcui || item.ndcProductCode || item.splSetId || item.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseFdaText(arr?: string[]): string {
  if (!arr?.length) return '';
  return arr.join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
}

export function catalogResultToStockItem(result: DrugCatalogResult, label?: FdaDrugResult | null): Omit<DrugStockItem, 'id' | 'createdAt' | 'updatedAt'> {
  const fda = label?.openfda;
  const ndc = result.ndc;
  const active = ndc?.active_ingredients?.[0];
  const brandNames = [result.brandName, ...(fda?.brand_name ?? [])].filter(Boolean) as string[];
  const genericName = fda?.generic_name?.[0] || result.genericName || active?.name || result.name;
  const routes = normalizeRoute(ndc?.route ?? fda?.route);
  const splSetId = result.splSetId || fda?.spl_set_id?.[0];

  return {
    name: result.brandName || result.name,
    genericName,
    brandNames: Array.from(new Set(brandNames)),
    category: 'other',
    formulation: 'tablet',
    strength: active?.strength || '',
    unit: ndc?.packaging?.[0]?.description || 'unit',
    routes,
    dosages: label?.dosage_and_administration?.[0]
      ? [{
          id: `dose-${Date.now()}`,
          indication: parseFdaText(label.indications_and_usage) || 'Imported label dosing',
          adultDose: parseFdaText(label.dosage_and_administration).slice(0, 120),
          frequency: 'See label',
          notes: 'Imported from FDA/DailyMed label - verify against local formulary before use',
        }]
      : [],
    quantityInStock: 0,
    reorderLevel: 50,
    reorderQuantity: 100,
    unitCost: 0,
    currency: 'NGN',
    batchNumber: '',
    expiryDate: '',
    manufacturer: result.manufacturer || fda?.manufacturer_name?.[0] || ndc?.labeler_name || '',
    controlledStatus: 'uncontrolled',
    requiresPrescription: true,
    contraindications: label?.contraindications ? [parseFdaText(label.contraindications)] : [],
    sideEffects: label?.adverse_reactions ? [parseFdaText(label.adverse_reactions)] : [],
    interactions: label?.drug_interactions ? [parseFdaText(label.drug_interactions)] : [],
    storageConditions: parseFdaText(label?.storage_and_handling) || '',
    location: '',
    isActive: true,
    sourceMetadata: {
      sources: Array.from(new Set([result.source, label ? 'openfda_label' : undefined].filter(Boolean))) as DrugSourceList,
      rxcui: result.rxcui || fda?.rxcui?.[0],
      ndcProductCode: result.ndcProductCode,
      ndcPackageCodes: result.ndcPackageCodes,
      splSetId,
      splId: result.splId || fda?.spl_id?.[0],
      labelUrl: splSetId ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${splSetId}` : undefined,
      sourceUpdatedAt: result.dailyMed?.published_date,
      importedAt: new Date().toISOString(),
    },
  };
}

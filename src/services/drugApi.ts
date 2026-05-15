// Drug API service: RxNorm (NIH) + OpenFDA — both free, CORS-enabled, no API key required

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

// RxNorm concept type display names
const TTY_LABELS: Record<string, string> = {
  IN: 'Ingredient', BN: 'Brand Name', PIN: 'Precise Ingredient',
  MIN: 'Multiple Ingredients', SCDF: 'Clinical Drug Form', SCD: 'Clinical Drug',
  SBD: 'Branded Drug', GPCK: 'Generic Pack', BPCK: 'Branded Pack',
  DF: 'Dose Form', DFG: 'Dose Form Group',
};

// Search RxNorm for drug names by free text
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
  // Deduplicate by name (case-insensitive)
  const seen = new Set<string>();
  return groups.filter((d) => {
    const key = d.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Fetch full drug label data from OpenFDA by drug name
export async function fetchOpenFdaLabel(drugName: string): Promise<FdaDrugResult | null> {
  const safeQuery = encodeURIComponent(`"${drugName}"`);
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${safeQuery}+openfda.brand_name:${safeQuery}&limit=3`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Try broader search
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

// Spell-suggest via RxNorm approximate matching
export async function suggestRxNorm(query: string): Promise<string[]> {
  if (!query || query.trim().length < 3) return [];
  const url = `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.suggestionGroup?.suggestionList?.suggestion ?? [];
}

// Get related drugs / drug class via RxNorm
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

// Search OpenFDA adverse events by drug name
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

// Helper: parse OpenFDA label text (arrays of HTML strings) into plain text
export function parseFdaText(arr?: string[]): string {
  if (!arr?.length) return '';
  return arr.join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
}

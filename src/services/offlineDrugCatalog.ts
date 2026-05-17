// Offline drug catalog — loads the index built by
// scripts/normalize-drug-catalogs.mjs from /drug-catalogs/index.json on demand,
// caches it in memory, and offers a fast in-browser search that works without
// any network connectivity. Falls back transparently to the live RxNorm /
// OpenFDA APIs in src/services/drugApi.ts when the catalog file is absent.

export interface OfflineCatalogEntry {
  key: string;
  name: string;
  generic: string;
  brands: string[];
  rxcui?: string;
  ndc?: string;
  route?: string;
  dosageForm?: string;
  marketingStatus?: string;
  source: string[];
  partition: number;
}

export interface OfflineCatalogIndex {
  generatedAt: string;
  count: number;
  partitionSize: number;
  sources: string[];
  entries: OfflineCatalogEntry[];
}

export interface OfflineCatalogDetail {
  key: string;
  name: string;
  // OpenFDA NDC fields
  manufacturer?: string;
  activeIngredients?: Array<{ name: string; strength: string }>;
  // OpenFDA label fields
  indications?: string;
  dosage?: string;
  contraindications?: string;
  warnings?: string;
  adverseReactions?: string;
  drugInteractions?: string;
  pregnancy?: string;
  pediatricUse?: string;
  storage?: string;
  rxcui?: string;
  tty?: string;
  ndc?: string;
  dosageForm?: string;
  route?: string | string[];
}

let indexCache: OfflineCatalogIndex | null = null;
let indexLoadPromise: Promise<OfflineCatalogIndex | null> | null = null;
const partitionCache = new Map<number, OfflineCatalogDetail[]>();

// Where to fetch the catalog index from. Defaults to the same origin as the
// SPA (so /drug-catalogs/index.json on the deployed site). Override with the
// VITE_DRUG_DETAILS_BASE_URL env var when you want to host the larger
// details bundle on a separate origin — e.g. a Cloudflare R2 public bucket
// like https://r2-moromoke.<account>.r2.dev or your custom domain.
const DETAILS_BASE = (import.meta.env.VITE_DRUG_DETAILS_BASE_URL || '').replace(/\/$/, '');
const INDEX_URL = DETAILS_BASE
  ? `${DETAILS_BASE}/index.json`
  : '/drug-catalogs/index.json';
const DETAIL_URL = (partition: number) => {
  const file = `details/part-${String(partition).padStart(4, '0')}.json`;
  return DETAILS_BASE ? `${DETAILS_BASE}/${file}` : `/drug-catalogs/${file}`;
};

export function offlineCatalogAvailable(): boolean {
  return indexCache !== null;
}

export async function loadOfflineCatalog(): Promise<OfflineCatalogIndex | null> {
  if (indexCache) return indexCache;
  if (indexLoadPromise) return indexLoadPromise;
  indexLoadPromise = (async () => {
    try {
      const res = await fetch(INDEX_URL, { cache: 'force-cache' });
      if (!res.ok) return null;
      const data = (await res.json()) as OfflineCatalogIndex;
      indexCache = data;
      return data;
    } catch {
      return null;
    } finally {
      indexLoadPromise = null;
    }
  })();
  return indexLoadPromise;
}

// Browse the whole catalog with pagination (no search query needed).
export async function browseOfflineCatalog(page: number, pageSize = 50): Promise<{ entries: OfflineCatalogEntry[]; total: number }> {
  const idx = await loadOfflineCatalog();
  if (!idx) return { entries: [], total: 0 };
  const start = (Math.max(1, page) - 1) * pageSize;
  return { entries: idx.entries.slice(start, start + pageSize), total: idx.entries.length };
}

// Lookup a single entry by stable key (used for bulk-import workflows).
export async function getOfflineEntryByKey(key: string): Promise<OfflineCatalogEntry | null> {
  const idx = await loadOfflineCatalog();
  return idx?.entries.find((e) => e.key === key) ?? null;
}

export async function searchOfflineCatalog(query: string, limit = 30): Promise<OfflineCatalogEntry[]> {
  const idx = await loadOfflineCatalog();
  if (!idx) return [];
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: OfflineCatalogEntry[] = [];
  for (const e of idx.entries) {
    if (
      e.name.toLowerCase().includes(q) ||
      e.generic.toLowerCase().includes(q) ||
      e.brands.some((b) => b.toLowerCase().includes(q)) ||
      (e.rxcui && e.rxcui === q) ||
      (e.ndc && e.ndc === q)
    ) {
      out.push(e);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export async function loadDetail(entry: OfflineCatalogEntry): Promise<OfflineCatalogDetail | null> {
  const part = entry.partition;
  if (!partitionCache.has(part)) {
    try {
      const res = await fetch(DETAIL_URL(part), { cache: 'force-cache' });
      if (!res.ok) return null;
      const arr = (await res.json()) as OfflineCatalogDetail[];
      partitionCache.set(part, arr);
    } catch {
      return null;
    }
  }
  const bucket = partitionCache.get(part);
  if (!bucket) return null;
  // Multiple detail records may exist for the same key (NDC + label); merge them.
  const matches = bucket.filter((d) => d.key === entry.key);
  if (matches.length === 0) return null;
  const mergedRecord: Record<string, unknown> = { ...(matches[0] as unknown as Record<string, unknown>) };
  for (const m of matches.slice(1)) {
    for (const [k, v] of Object.entries(m as unknown as Record<string, unknown>)) {
      if (v && !mergedRecord[k]) {
        mergedRecord[k] = v;
      }
    }
  }
  return mergedRecord as unknown as OfflineCatalogDetail;
}

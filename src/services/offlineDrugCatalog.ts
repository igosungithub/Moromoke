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

// Catalog files can live at multiple locations. The client tries each URL
// candidate in order and stops at the first one that returns a usable file.
// This makes the deployment forgiving: a misconfigured R2 base URL, a missing
// upload, or a typo in the bucket layout all transparently fall back to the
// 14 MB index that ships with the build (served same-origin from
// /drug-catalogs/index.json).
const DETAILS_BASE = (import.meta.env.VITE_DRUG_DETAILS_BASE_URL || '').replace(/\/$/, '');
const INDEX_URL_CANDIDATES: string[] = [
  // 1. R2 / external base, files at the bucket root
  ...(DETAILS_BASE ? [`${DETAILS_BASE}/index.json`] : []),
  // 2. R2 / external base, files under a drug-catalogs/ prefix (common when
  //    the local public/drug-catalogs folder was uploaded recursively)
  ...(DETAILS_BASE ? [`${DETAILS_BASE}/drug-catalogs/index.json`] : []),
  // 3. Same-origin — bundled with the build, always available
  '/drug-catalogs/index.json',
];
function detailUrlCandidates(partition: number): string[] {
  const file = `details/part-${String(partition).padStart(4, '0')}.json`;
  const list: string[] = [];
  if (DETAILS_BASE) {
    list.push(`${DETAILS_BASE}/${file}`);
    list.push(`${DETAILS_BASE}/drug-catalogs/${file}`);
  }
  list.push(`/drug-catalogs/${file}`);
  return list;
}

export function offlineCatalogAvailable(): boolean {
  return indexCache !== null;
}

// The last loading error message, so UI can show *why* the catalog is missing
// (network failure, HTTP 404, JSON parse error, etc.) instead of just
// "not built".
let lastLoadError: string | null = null;
export function lastOfflineCatalogError(): string | null {
  return lastLoadError;
}

export async function loadOfflineCatalog(): Promise<OfflineCatalogIndex | null> {
  if (indexCache) return indexCache;
  if (indexLoadPromise) return indexLoadPromise;
  indexLoadPromise = (async () => {
    const failureLog: string[] = [];
    try {
      for (const url of INDEX_URL_CANDIDATES) {
        try {
          const res = await fetch(url, { cache: 'force-cache' });
          if (!res.ok) {
            failureLog.push(`${url} → HTTP ${res.status}`);
            continue;
          }
          let data: OfflineCatalogIndex;
          try {
            data = (await res.json()) as OfflineCatalogIndex;
          } catch (parseErr) {
            failureLog.push(`${url} → JSON parse error (${(parseErr as Error).message})`);
            continue;
          }
          if (!data || typeof data.count !== 'number' || !Array.isArray(data.entries)) {
            failureLog.push(`${url} → wrong shape (missing count/entries)`);
            continue;
          }
          indexCache = data;
          lastLoadError = null;
          return data;
        } catch (err) {
          failureLog.push(`${url} → ${(err as Error).message}`);
        }
      }
      // All candidates failed
      lastLoadError = `Tried ${INDEX_URL_CANDIDATES.length} catalog source(s). All failed:\n${failureLog.join('\n')}`;
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
    // Walk the candidate URLs (R2 root → R2 with drug-catalogs/ prefix →
    // same-origin) and take the first 200 OK we can parse.
    let loaded: OfflineCatalogDetail[] | null = null;
    for (const url of detailUrlCandidates(part)) {
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) continue;
        loaded = (await res.json()) as OfflineCatalogDetail[];
        break;
      } catch {
        // try next candidate
      }
    }
    if (!loaded) return null;
    partitionCache.set(part, loaded);
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

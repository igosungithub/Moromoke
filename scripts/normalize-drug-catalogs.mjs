#!/usr/bin/env node
// Normalises raw downloaded drug catalogs (OpenFDA NDC + labels, plus optional
// RxNorm and DailyMed if you've supplied them) into a compact offline index
// that the Moromoke EMR can search without any network call.
//
// Output:
//   public/drug-catalogs/index.json      — small (~5–15 MB) name/brand index
//   public/drug-catalogs/details/*.json  — per-RxCUI / per-NDC detail records
//
// Strategy:
//   * index.json contains: [{ key, name, generic, brands, rxcui?, ndc?, route, dosageForm, detailRef }]
//   * detailRef points at a partition file under /drug-catalogs/details/<partition>.json
//   * The React app fetches index.json once on first search, then loads the matching
//     partition on demand. No network round-trip to NLM/FDA required at runtime.

import { createReadStream, existsSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, closeSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createInflateRaw } from 'node:zlib';
import { Buffer } from 'node:buffer';
// Node 22+ provides DecompressionStream globally; for ZIP we still parse manually.

// Streams JSON objects out of a (deflated) OpenFDA partition without ever
// holding the entire uncompressed file in memory. The OpenFDA bulk files are
// shaped like { "meta": {...}, "results": [ {...}, {...}, ... ] } and an
// uncompressed partition can exceed V8's ~512MB string cap, so we tokenize
// the inflate stream char-by-char and yield one record object at a time.
async function* streamRecordsFromZip(zipPath) {
  const fd = openSync(zipPath, 'r');
  const stat = statSync(zipPath);
  // Locate the End Of Central Directory (EOCD)
  const tailLen = Math.min(65557, stat.size);
  const tail = Buffer.alloc(tailLen);
  readSync(fd, tail, 0, tailLen, stat.size - tailLen);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) { closeSync(fd); throw new Error('Not a ZIP: ' + zipPath); }
  const cdOffset = tail.readUInt32LE(eocd + 16);
  const cdEntries = tail.readUInt16LE(eocd + 10);
  // Read entire central directory (small)
  const cdSize = tail.readUInt32LE(eocd + 12);
  const cd = Buffer.alloc(cdSize);
  readSync(fd, cd, 0, cdSize, cdOffset);
  let p = 0;
  let target = null;
  for (let i = 0; i < cdEntries; i++) {
    if (cd.readUInt32LE(p) !== 0x02014b50) { closeSync(fd); throw new Error('Bad CD'); }
    const method = cd.readUInt16LE(p + 10);
    const compressedSize = cd.readUInt32LE(p + 20);
    const nameLen = cd.readUInt16LE(p + 28);
    const extraLen = cd.readUInt16LE(p + 30);
    const commentLen = cd.readUInt16LE(p + 32);
    const localOffset = cd.readUInt32LE(p + 42);
    const name = cd.slice(p + 46, p + 46 + nameLen).toString('utf8');
    if (name.endsWith('.json')) { target = { method, compressedSize, localOffset, name }; break; }
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (!target) { closeSync(fd); throw new Error('No .json in ZIP'); }
  // Read local file header
  const lhBuf = Buffer.alloc(30);
  readSync(fd, lhBuf, 0, 30, target.localOffset);
  if (lhBuf.readUInt32LE(0) !== 0x04034b50) { closeSync(fd); throw new Error('Bad LH'); }
  const lhNameLen = lhBuf.readUInt16LE(26);
  const lhExtraLen = lhBuf.readUInt16LE(28);
  const dataStart = target.localOffset + 30 + lhNameLen + lhExtraLen;
  closeSync(fd);

  const compressedStream = createReadStream(zipPath, { start: dataStart, end: dataStart + target.compressedSize - 1 });
  let source;
  if (target.method === 0) {
    source = compressedStream;
  } else if (target.method === 8) {
    source = compressedStream.pipe(createInflateRaw());
  } else {
    throw new Error('Unsupported ZIP method ' + target.method);
  }

  // Tokenizer state
  let state = 'before-results';   // before-results | in-array | in-record | in-string | escape
  let depth = 0;
  let recordChunks = [];
  let lookahead = '';
  let seekedToResults = false;

  for await (const chunk of source) {
    const s = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (!seekedToResults) {
        // Look for the substring `"results":` followed by `[`
        lookahead += ch;
        if (lookahead.length > 200) lookahead = lookahead.slice(-200);
        const idx = lookahead.indexOf('"results"');
        if (idx >= 0) {
          // Continue scanning to find `[`
          if (lookahead.endsWith('[')) {
            seekedToResults = true;
            state = 'in-array';
            depth = 0;
            lookahead = '';
            continue;
          }
        }
        continue;
      }
      if (state === 'in-array') {
        if (ch === '{') { state = 'in-record'; depth = 1; recordChunks = ['{']; }
        else if (ch === ']') { return; }      // end of results
        // ignore whitespace and commas
      } else if (state === 'in-record') {
        recordChunks.push(ch);
        if (ch === '"') { state = 'in-string'; }
        else if (ch === '{') { depth++; }
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            const txt = recordChunks.join('');
            try { yield JSON.parse(txt); } catch { /* skip malformed */ }
            recordChunks = [];
            state = 'in-array';
          }
        }
      } else if (state === 'in-string') {
        recordChunks.push(ch);
        if (ch === '\\') { state = 'escape'; }
        else if (ch === '"') { state = 'in-record'; }
      } else if (state === 'escape') {
        recordChunks.push(ch);
        state = 'in-string';
      }
    }
  }
}

const root = process.cwd();
const rawDir = resolve(root, 'data/drug-catalogs/raw');
const publicOut = resolve(root, 'public/drug-catalogs');
const detailsOut = join(publicOut, 'details');
mkdirSync(detailsOut, { recursive: true });

const PARTITION_SIZE = 1000;          // 1000 drugs per detail partition
const MAX_DESC_LEN = 1000;            // truncate massive label text for compactness

function stripHtml(s) {
  if (!s) return '';
  return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function trim(s, n = MAX_DESC_LEN) {
  s = stripHtml(s);
  return s.length > n ? s.slice(0, n) + '…' : s;
}

// Minimal ZIP reader (central directory + local file headers) good enough for
// the JSON zips produced by OpenFDA. Avoids pulling in a heavy npm dep.
async function readJsonFromZip(zipPath) {
  const buf = readFileSync(zipPath);
  // Find end-of-central-directory record
  const eocdSig = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 65557; i--) {
    if (buf.readUInt32LE(i) === eocdSig) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a ZIP: ' + zipPath);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  const cdEntries = buf.readUInt16LE(eocd + 10);
  let p = cdOffset;
  const entries = [];
  for (let i = 0; i < cdEntries; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Bad central directory');
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const uncompressedSize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    entries.push({ name, method, compressedSize, uncompressedSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  // Find the first .json entry
  const entry = entries.find((e) => e.name.endsWith('.json')) ?? entries[0];
  // Local file header
  const lh = entry.localOffset;
  if (buf.readUInt32LE(lh) !== 0x04034b50) throw new Error('Bad local header');
  const lhNameLen = buf.readUInt16LE(lh + 26);
  const lhExtraLen = buf.readUInt16LE(lh + 28);
  const dataStart = lh + 30 + lhNameLen + lhExtraLen;
  const compressed = buf.slice(dataStart, dataStart + entry.compressedSize);
  let raw;
  if (entry.method === 0) {
    raw = compressed;
  } else if (entry.method === 8) {
    // raw deflate stream — use Node's inflateRaw via zlib.
    const { inflateRawSync } = await import('node:zlib');
    raw = inflateRawSync(compressed);
  } else {
    throw new Error('Unsupported ZIP method ' + entry.method);
  }
  return JSON.parse(raw.toString('utf8'));
}

const catalog = new Map();      // key -> compact entry
const detailBuckets = new Map(); // partition index -> array of detail entries
let partitionIndex = 0;
let bucketCount = 0;

function pushDetail(detail) {
  if (!detailBuckets.has(partitionIndex)) detailBuckets.set(partitionIndex, []);
  const arr = detailBuckets.get(partitionIndex);
  arr.push(detail);
  bucketCount += 1;
  if (arr.length >= PARTITION_SIZE) partitionIndex += 1;
}

function indexKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 80);
}

// === OpenFDA NDC Directory ===
async function ingestOpenFdaNdc() {
  const dir = join(rawDir, 'openfda-ndc');
  if (!existsSync(dir)) {
    console.log('No openfda-ndc/ directory — skipping (NDC source not downloaded)');
    return 0;
  }
  let count = 0;
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json.zip'))) {
    const fp = join(dir, f);
    console.log('  Reading', f);
    const data = await readJsonFromZip(fp);
    const records = data?.results ?? [];
    for (const r of records) {
      const name = r.brand_name || r.generic_name || r.proprietary_name;
      if (!name) continue;
      const key = indexKey(name);
      if (!catalog.has(key)) {
        const entry = {
          key,
          name,
          generic: r.generic_name ?? r.nonproprietary_name ?? '',
          brands: r.brand_name ? [r.brand_name] : [],
          ndc: r.product_ndc,
          rxcui: Array.isArray(r.openfda?.rxcui) ? r.openfda.rxcui[0] : undefined,
          route: Array.isArray(r.route) ? r.route[0] : r.route,
          dosageForm: r.dosage_form,
          marketingStatus: r.marketing_category,
          source: ['openfda-ndc'],
          partition: Math.floor(bucketCount / PARTITION_SIZE),
        };
        catalog.set(key, entry);
        pushDetail({
          key, name, ndc: r.product_ndc, dosageForm: r.dosage_form,
          route: r.route, manufacturer: r.labeler_name,
          activeIngredients: r.active_ingredients,
          openfda: r.openfda,
        });
      } else if (r.brand_name) {
        const e = catalog.get(key);
        if (!e.brands.includes(r.brand_name)) e.brands.push(r.brand_name);
        if (!e.source.includes('openfda-ndc')) e.source.push('openfda-ndc');
      }
      count += 1;
    }
  }
  return count;
}

// === OpenFDA Labels (subset of fields) ===
async function ingestOpenFdaLabels() {
  const dir = join(rawDir, 'openfda-labels');
  if (!existsSync(dir)) {
    console.log('No openfda-labels/ directory — skipping (labels not downloaded)');
    return 0;
  }
  let count = 0;
  const files = readdirSync(dir).filter((n) => n.endsWith('.json.zip')).sort();
  for (const f of files) {
    const fp = join(dir, f);
    console.log('  Streaming', f);
    let perFile = 0;
    try {
      for await (const r of streamRecordsFromZip(fp)) {
        const ofd = r.openfda ?? {};
        const name = ofd.brand_name?.[0] || ofd.generic_name?.[0] || ofd.substance_name?.[0];
        if (!name) continue;
        const key = indexKey(name);
        if (!catalog.has(key)) {
          catalog.set(key, {
            key,
            name,
            generic: ofd.generic_name?.[0] ?? '',
            brands: ofd.brand_name ?? [],
            rxcui: ofd.rxcui?.[0],
            ndc: ofd.product_ndc?.[0],
            route: ofd.route?.[0],
            dosageForm: ofd.dosage_form?.[0],
            source: ['openfda-labels'],
            partition: Math.floor(bucketCount / PARTITION_SIZE),
          });
        } else {
          const e = catalog.get(key);
          if (!e.source.includes('openfda-labels')) e.source.push('openfda-labels');
          if (!e.rxcui && ofd.rxcui?.[0]) e.rxcui = ofd.rxcui[0];
          if (ofd.brand_name) {
            for (const b of ofd.brand_name) {
              if (!e.brands.includes(b)) e.brands.push(b);
            }
          }
        }
        // Always upsert label details, partitioned by bucket count
        pushDetail({
          key, name,
          indications: trim(r.indications_and_usage?.[0]),
          dosage: trim(r.dosage_and_administration?.[0]),
          contraindications: trim(r.contraindications?.[0]),
          warnings: trim(r.warnings?.[0] ?? r.warnings_and_cautions?.[0]),
          adverseReactions: trim(r.adverse_reactions?.[0]),
          drugInteractions: trim(r.drug_interactions?.[0]),
          pregnancy: trim(r.pregnancy?.[0]),
          pediatricUse: trim(r.pediatric_use?.[0]),
          storage: trim(r.storage_and_handling?.[0]),
          manufacturer: ofd.manufacturer_name?.[0],
          rxcui: ofd.rxcui?.[0],
          ndc: ofd.product_ndc?.[0],
        });
        count += 1; perFile += 1;
        if (perFile % 5000 === 0) console.log('    ' + perFile + ' from this partition');
      }
    } catch (e) {
      console.log('  ! Failed', f, '(', e.message, ')');
    }
  }
  return count;
}

// === RxNorm normalised dump (if user provided it) ===
async function ingestRxNorm() {
  const fp = resolve(root, 'data/drug-catalogs/normalized/rxnorm-concepts.ndjson');
  if (!existsSync(fp)) {
    console.log('No rxnorm-concepts.ndjson — skipping. Run the downloader from a host that can reach rxnav.nlm.nih.gov.');
    return 0;
  }
  let count = 0;
  const lines = readFileSync(fp, 'utf8').split(/\r?\n/).filter(Boolean);
  for (const ln of lines) {
    const r = JSON.parse(ln);
    if (!r.name) continue;
    const key = indexKey(r.name);
    if (!catalog.has(key)) {
      catalog.set(key, {
        key,
        name: r.name,
        generic: r.name,
        brands: [],
        rxcui: r.rxcui,
        source: ['rxnorm'],
        partition: Math.floor(bucketCount / PARTITION_SIZE),
      });
      pushDetail({ key, name: r.name, rxcui: r.rxcui, tty: r.tty });
    } else {
      const e = catalog.get(key);
      if (!e.rxcui) e.rxcui = r.rxcui;
      if (!e.source.includes('rxnorm')) e.source.push('rxnorm');
    }
    count += 1;
  }
  return count;
}

// === Write out ===
function writeIndex() {
  const entries = Array.from(catalog.values()).sort((a, b) => a.name.localeCompare(b.name));
  const index = {
    generatedAt: new Date().toISOString(),
    count: entries.length,
    partitionSize: PARTITION_SIZE,
    sources: Array.from(new Set(entries.flatMap((e) => e.source))),
    entries,
  };
  writeFileSync(join(publicOut, 'index.json'), JSON.stringify(index));
  return entries.length;
}

function writeDetails() {
  for (const [idx, arr] of detailBuckets) {
    const fp = join(detailsOut, `part-${String(idx).padStart(4, '0')}.json`);
    writeFileSync(fp, JSON.stringify(arr));
  }
}

console.log('=== Normalising drug catalogs ===');
console.log('Source 1/3: RxNorm normalized NDJSON');
const rxc = await ingestRxNorm();
console.log('  ingested', rxc);
console.log('Source 2/3: OpenFDA NDC directory');
const ndc = await ingestOpenFdaNdc();
console.log('  ingested', ndc);
console.log('Source 3/3: OpenFDA labels (full label data)');
const lab = await ingestOpenFdaLabels();
console.log('  ingested', lab);
console.log('--- Writing output ---');
const total = writeIndex();
writeDetails();
console.log(`Wrote ${total} unique drugs to public/drug-catalogs/index.json`);
console.log(`Wrote ${detailBuckets.size} detail partitions to public/drug-catalogs/details/`);
console.log('Done.');

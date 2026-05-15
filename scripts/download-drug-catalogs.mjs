#!/usr/bin/env node
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

const root = process.cwd();
const outDir = resolve(root, 'data/drug-catalogs');
const rawDir = join(outDir, 'raw');
const normalizedDir = join(outDir, 'normalized');
const args = new Set(process.argv.slice(2));

const includeLargeFiles = args.has('--include-large-files');
const manifestOnly = args.has('--manifest-only') || !includeLargeFiles;

mkdirSync(rawDir, { recursive: true });
mkdirSync(normalizedDir, { recursive: true });

const RXNORM_TTYS = ['IN', 'PIN', 'MIN', 'BN', 'SCD', 'SBD', 'SCDF', 'GPCK', 'BPCK'];

const manifest = {
  generatedAt: new Date().toISOString(),
  mode: manifestOnly ? 'manifest-only' : 'download-large-files',
  sources: {},
  notes: [
    'Inventory stock is not the same as the medicine catalog. Use this catalog to search/import, then assign local stock, batch, expiry, pricing, and formulary status.',
    'NHS dm+d requires NHS/TRUD release files. Set DMD_RELEASE_PATH to a local dm+d file or folder after downloading through your licensed TRUD access.',
    'Odoo is your ERP/product master, not a public drug dictionary. Set ODOO_PRODUCTS_CSV to a product export from your Odoo instance.',
  ],
};

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

async function download(url, target) {
  mkdirSync(dirname(target), { recursive: true });
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  await pipeline(res.body, createWriteStream(target));
}

async function downloadRxNorm() {
  const records = [];
  for (const tty of RXNORM_TTYS) {
    const url = `https://rxnav.nlm.nih.gov/REST/allconcepts.json?tty=${encodeURIComponent(tty)}`;
    const data = await getJson(url);
    const rows = data?.minConceptGroup?.minConcept ?? [];
    for (const row of rows) {
      records.push({
        source: 'rxnorm',
        rxcui: row.rxcui,
        name: row.name,
        tty,
      });
    }
  }
  const seen = new Set();
  const deduped = records.filter((row) => {
    const key = `${row.rxcui}:${row.tty}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const target = join(normalizedDir, 'rxnorm-concepts.ndjson');
  writeFileSync(target, deduped.map((row) => JSON.stringify(row)).join('\n') + '\n');
  manifest.sources.rxnorm = {
    status: 'downloaded',
    records: deduped.length,
    file: target,
    ttys: RXNORM_TTYS,
  };
}

async function downloadOpenFdaManifest() {
  const data = await getJson('https://api.fda.gov/download.json');
  const target = join(rawDir, 'openfda-download-manifest.json');
  writeFileSync(target, JSON.stringify(data, null, 2));

  const ndcPartitions = data?.results?.drug?.ndc?.partitions ?? [];
  const labelPartitions = data?.results?.drug?.label?.partitions ?? [];
  manifest.sources.openfda = {
    status: includeLargeFiles ? 'downloaded archives' : 'manifest downloaded',
    manifest: target,
    ndcPartitions: ndcPartitions.length,
    labelPartitions: labelPartitions.length,
  };

  if (!includeLargeFiles) return;

  for (const [index, part] of ndcPartitions.entries()) {
    await download(part.file, join(rawDir, 'openfda-ndc', `part-${String(index + 1).padStart(3, '0')}.json.zip`));
  }
  for (const [index, part] of labelPartitions.entries()) {
    await download(part.file, join(rawDir, 'openfda-labels', `part-${String(index + 1).padStart(3, '0')}.json.zip`));
  }
}

async function downloadDailyMedLinks() {
  const pages = [
    'https://dailymed.nlm.nih.gov/dailymed/spl-resources-all-drug-labels.cfm',
    'https://dailymed.nlm.nih.gov/dailymed/spl-resources.cfm',
  ];
  const links = new Set();
  for (const page of pages) {
    try {
      const html = await (await fetch(page)).text();
      const matches = [...html.matchAll(/href=["']([^"']+\.zip(?:\?[^"']*)?)["']/gi)];
      for (const match of matches) {
        const href = match[1].replace(/&amp;/g, '&');
        links.add(new URL(href, page).href);
      }
    } catch {
      // DailyMed occasionally changes static pages; keep the manifest useful even if scraping fails.
    }
  }
  const target = join(rawDir, 'dailymed-zip-links.json');
  writeFileSync(target, JSON.stringify(Array.from(links), null, 2));
  manifest.sources.dailymed = {
    status: includeLargeFiles ? 'downloaded archives' : 'links discovered',
    links: links.size,
    manifest: target,
  };

  if (!includeLargeFiles) return;
  let index = 1;
  for (const link of links) {
    await download(link, join(rawDir, 'dailymed', `dailymed-${String(index++).padStart(3, '0')}.zip`));
  }
}

function recordDmdAndOdooInputs() {
  const dmdPath = process.env.DMD_RELEASE_PATH ? resolve(process.env.DMD_RELEASE_PATH) : '';
  const odooCsv = process.env.ODOO_PRODUCTS_CSV ? resolve(process.env.ODOO_PRODUCTS_CSV) : '';

  manifest.sources.nhsDmd = {
    status: dmdPath && existsSync(dmdPath) ? 'local release path available' : 'needs NHS/TRUD release file',
    path: dmdPath || null,
  };
  manifest.sources.odoo = {
    status: odooCsv && existsSync(odooCsv) ? 'local export available' : 'needs Odoo product export or API connector',
    path: odooCsv || null,
  };

  if (odooCsv && existsSync(odooCsv)) {
    const preview = readFileSync(odooCsv, 'utf8').split(/\r?\n/).slice(0, 5);
    writeFileSync(join(rawDir, 'odoo-products-preview.txt'), preview.join('\n'));
  }
}

for (const [name, task] of [
  ['rxnorm', downloadRxNorm],
  ['openfda', downloadOpenFdaManifest],
  ['dailymed', downloadDailyMedLinks],
]) {
  try {
    await task();
  } catch (error) {
    manifest.sources[name] = {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
recordDmdAndOdooInputs();

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`Drug catalog download manifest written to ${join(outDir, 'manifest.json')}`);
if (manifestOnly) {
  console.log('Manifest-only mode complete. Check manifest.json for each source status; large archives are not downloaded in this mode.');
  console.log('Run `npm run download:drug-catalogs -- --include-large-files` when you are ready for multi-GB source downloads.');
}

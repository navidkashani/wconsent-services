#!/usr/bin/env node
//
// Converts the Open Cookie Database into cookies/open-cookie-database.json.
//
//     npm run convert:cookies               # the commit in cookies/source.json
//     npm run convert:cookies -- <commit>   # move to another commit
//
// Each row becomes [name, wildcard (0|1), category, platform, retention,
// description]. Categories are mapped to this list's: Functional, Security and
// Necessary to essential; Personalization to functional; Analytics to
// statistics; Marketing to marketing. Whitespace is collapsed, rows without a
// name are skipped, and only the first row of each name and platform pair is
// kept. CREDITS.md records these changes, as the Apache-2.0 licence asks.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCsv } from './lib/csv.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = resolve(ROOT, 'cookies/source.json');
const OUTPUT = resolve(ROOT, 'cookies/open-cookie-database.json');
const REPO = 'jkwakman/Open-Cookie-Database';

const CATEGORIES = {
  Functional: 'essential',
  Security: 'essential',
  Necessary: 'essential',
  Personalization: 'functional',
  Analytics: 'statistics',
  Marketing: 'marketing',
};

export function convert(csv) {
  const rows = parseCsv(csv);
  const header = rows.shift() ?? [];
  const column = (label) => {
    const index = header.findIndex((h) => h.trim() === label);
    if (index < 0) throw new Error(`The CSV has no "${label}" column.`);
    return index;
  };
  const at = {
    platform: column('Platform'),
    category: column('Category'),
    name: column('Cookie / Data Key name'),
    description: column('Description'),
    retention: column('Retention period'),
    wildcard: column('Wildcard match'),
  };

  const seen = new Set();
  const cookies = [];
  for (const raw of rows) {
    const row = raw.map((field) => field.replace(/\s+/g, ' ').trim());
    const name = row[at.name] ?? '';
    const category = CATEGORIES[row[at.category]];
    const key = `${name}\u0000${row[at.platform]}`;
    if (name === '' || category === undefined || seen.has(key)) continue;
    seen.add(key);
    cookies.push([name, row[at.wildcard] === '1' ? 1 : 0, category, row[at.platform] ?? '', row[at.retention] ?? '', row[at.description] ?? '']);
  }

  const lower = (row) => row[0].toLowerCase();
  cookies.sort((a, b) => (lower(a) < lower(b) ? -1 : lower(a) > lower(b) ? 1 : a[3] < b[3] ? -1 : a[3] > b[3] ? 1 : 0));

  return cookies;
}

// One cookie per line, so a pull request shows which cookies changed.
export function render({ cookies, ...meta }) {
  const head = JSON.stringify(meta).slice(0, -1);
  return `${head},"cookies":[\n${cookies.map((row) => JSON.stringify(row)).join(',\n')}\n]}\n`;
}

async function main() {
  const source = JSON.parse(readFileSync(SOURCE, 'utf8'));
  const commit = process.argv[2] ?? source.commit;
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('Give a full 40-character commit hash.');

  const response = await fetch(`https://raw.githubusercontent.com/${REPO}/${commit}/open-cookie-database.csv`);
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);

  const cookies = convert(await response.text());
  const output = { source: `https://github.com/${REPO}`, commit, licence: 'Apache-2.0', cookies };

  writeFileSync(OUTPUT, render(output));
  writeFileSync(SOURCE, `${JSON.stringify({ ...source, commit }, null, 2)}\n`);
  console.log(`${cookies.length} cookies from ${REPO}@${commit.slice(0, 7)}`);
}

if (process.argv[1] === import.meta.filename) {
  await main();
}

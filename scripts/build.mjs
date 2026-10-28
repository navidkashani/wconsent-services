#!/usr/bin/env node
//
// Builds dist/ for the version in release.json.
//
//     npm run build
//
// dist/index.json is what sites download first. It names every other file
// with its size and sha256, so a site fetches only the files that changed and
// throws away a download that does not match. Files are fetched from the
// exact version's folder, which jsDelivr never changes once served:
//
//     https://cdn.jsdelivr.net/gh/navidkashani/wconsent-services@<version>/dist/<path>
//
// The output depends only on the repository's files, so the release workflow
// can rebuild it and prove the committed dist/ is the real thing.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { checkLogo } from './lib/rules.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');

// Raised only when a change would break a site that reads the old layout. A
// new format is served under a new major version (@2), and @1 keeps getting
// releases for a year.
export const FORMAT = 1;

const json = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const list = (dir) => readdirSync(resolve(ROOT, dir)).filter((f) => f.endsWith('.json')).sort();

export function build() {
  const { version, date } = json('release.json');
  const files = {};

  const services = list('services').map((file) => {
    const { $schema, ...service } = json(`services/${file}`);
    return service;
  });
  files['services.json'] = { format: FORMAT, version, date, services };

  const { source, commit, licence, cookies } = json('cookies/open-cookie-database.json');
  files['cookies.json'] = { format: FORMAT, version, source, commit, licence, cookies };

  for (const file of list('translations')) {
    const locale = file.replace(/\.json$/, '');
    const texts = Object.fromEntries(Object.entries(json(`translations/${file}`)).map(([id, { machine, ...entry }]) => [id, entry]));
    files[`i18n/${locale}.json`] = { format: FORMAT, version, locale, services: texts };
  }

  // Each logo's paths become one path, drawn in the site's own colour. A site
  // that knows no logos file simply skips it.
  const ids = new Set(services.map((s) => s.id));
  const logos = {};
  for (const file of existsSync(resolve(ROOT, 'logos')) ? readdirSync(resolve(ROOT, 'logos')).filter((f) => f.endsWith('.svg')).sort() : []) {
    const id = file.replace(/\.svg$/, '');
    const { problems, d } = checkLogo(id, readFileSync(resolve(ROOT, 'logos', file), 'utf8'), ids);
    if (problems.length) throw new Error(problems.join('\n'));
    logos[id] = d;
  }
  if (Object.keys(logos).length) files['logos.json'] = { format: FORMAT, version, logos };

  const out = {};
  const index = [];
  for (const [path, value] of Object.entries(files)) {
    const text = JSON.stringify(value);
    out[path] = text;
    index.push({ path, size: Buffer.byteLength(text), sha256: createHash('sha256').update(text).digest('hex') });
  }
  out['index.json'] = `${JSON.stringify({ format: FORMAT, version, date, services: services.length, files: index }, null, 2)}\n`;

  return out;
}

if (process.argv[1] === import.meta.filename) {
  const out = build();
  rmSync(DIST, { recursive: true, force: true });
  for (const [path, text] of Object.entries(out)) {
    mkdirSync(dirname(resolve(DIST, path)), { recursive: true });
    writeFileSync(resolve(DIST, path), text);
  }
  const { version } = JSON.parse(out['index.json']);
  console.log(`Built dist/ for ${version}: ${Object.keys(out).join(', ')}`);
}

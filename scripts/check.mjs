#!/usr/bin/env node
//
// Checks every service, every translation and every public file.
//
//     npm run check
//     npm run format     # rewrite services and translations in the canonical layout
//
// Runs on every pull request (.github/workflows/check.yml).

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkPublic, checkServices, checkTranslation, format } from './lib/rules.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const fix = process.argv.includes('--fix');

function read(dir) {
  const files = new Map();
  for (const name of readdirSync(resolve(ROOT, dir)).filter((f) => f.endsWith('.json')).sort()) {
    const path = resolve(ROOT, dir, name);
    let text = readFileSync(path, 'utf8');
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = { error: String(error) };
    }
    if (fix && !('error' in data)) {
      text = format(data);
      writeFileSync(path, text);
    }
    files.set(name.replace(/\.json$/, ''), { text, data });
  }

  return files;
}

const problems = [];
const services = read('services');
problems.push(...checkServices(services));

const valid = new Map([...services].filter(([, f]) => !('error' in f.data)).map(([id, f]) => [id, f.data]));
for (const [id, { data }] of services) {
  if ('error' in data) problems.push(`services/${id}.json: ${data.error}`);
}

const translations = read('translations');
for (const [locale, file] of translations) {
  problems.push(...('error' in file.data ? [`translations/${locale}.json: ${file.data.error}`] : checkTranslation(locale, file, valid)));
}

// Every file that is or would be committed. The rules file names the words it
// looks for, so it is the one file left out.
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((path) => path !== '' && path !== 'scripts/lib/rules.mjs');
for (const path of tracked) {
  let text;
  try {
    text = readFileSync(resolve(ROOT, path), 'utf8');
  } catch {
    continue;
  }
  problems.push(...checkPublic(path, text));
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}.`);
  process.exit(1);
}

console.log(`${services.size} services, ${translations.size} translations and ${tracked.length} files checked.`);

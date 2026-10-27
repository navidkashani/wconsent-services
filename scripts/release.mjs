#!/usr/bin/env node
//
// Prepares a release.
//
//     npm run release -- 1.4.0
//
// Writes the version and today's date to release.json, builds dist/, and adds
// the pull requests merged since the last release to CHANGELOG.md (using the
// GitHub CLI when it is signed in). Commit the result on a branch, open a pull
// request, and once it is merged, tag the merge commit v1.4.0. The tag starts
// .github/workflows/release.yml.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const REPO = 'navidkashani/wconsent-services';

const parse = (v) => v.split('.').map(Number);
const newer = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

const version = process.argv[2] ?? '';
if (!/^[1-9]\d*\.\d+\.\d+$/.test(version)) {
  console.error('Usage: npm run release -- <major.minor.patch>, for example 1.4.0');
  process.exit(1);
}

const current = JSON.parse(readFileSync(resolve(ROOT, 'release.json'), 'utf8'));
if (!newer(version, current.version) && !(current.version === version && !tagExists(`v${version}`))) {
  console.error(`${version} is not newer than ${current.version}. Versions only go up: sites ignore an older list.`);
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
writeFileSync(resolve(ROOT, 'release.json'), `${JSON.stringify({ version, date }, null, 2)}\n`);

execFileSync('node', ['scripts/check.mjs'], { cwd: ROOT, stdio: 'inherit' });
execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT, stdio: 'inherit' });
writeChangelog(version, date);

console.log(`\nNext: commit release.json, dist/ and CHANGELOG.md on a branch, open a pull request, merge it, then:\n  git tag v${version} <merge commit> && git push origin v${version}`);

function tagExists(tag) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function writeChangelog(version, date) {
  const path = resolve(ROOT, 'CHANGELOG.md');
  const changelog = readFileSync(path, 'utf8');
  let lines = [];

  try {
    const last = execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', 'v*'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const since = execFileSync('git', ['log', '-1', '--format=%cI', last], { cwd: ROOT, encoding: 'utf8' }).trim();
    const prs = JSON.parse(execFileSync('gh', ['pr', 'list', '--repo', REPO, '--state', 'merged', '--search', `merged:>${since}`, '--json', 'number,title', '--limit', '200'], { cwd: ROOT, encoding: 'utf8' }));
    lines = prs.map((pr) => `- ${pr.title} (#${pr.number})`);
  } catch {
    lines = ['- First release.'];
  }

  const entry = `## ${version} (${date})\n\n${lines.join('\n') || '- Maintenance.'}\n`;
  const first = changelog.indexOf('\n## ');
  writeFileSync(path, first < 0 ? `${changelog.trimEnd()}\n\n${entry}` : `${changelog.slice(0, first + 1)}${entry}\n${changelog.slice(first + 1)}`);
}

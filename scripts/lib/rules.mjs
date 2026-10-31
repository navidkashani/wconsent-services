// The rules every service and translation must pass. scripts/check.mjs runs
// them over the repository; scripts/rules.test.mjs proves each one fails when
// it should.

import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const load = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateService = ajv.compile(load('schema/service.json'));
const validateTranslation = ajv.compile(load('schema/translation.json'));

const describe = (errors) => (errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`);

// The canonical text of a JSON file. `npm run format` writes it.
export const format = (value) => `${JSON.stringify(value, null, 2)}\n`;

// The first sentence of a purpose: what a site owner sees on the service's
// card, in two lines at most.
export const firstSentence = (text) => text.match(/^.*?[.!?](?=\s|$)/s)?.[0] ?? text;
export const CARD_TEXT = 50;
// Other languages run longer than English; two card lines still hold this.
export const CARD_TEXT_TRANSLATED = 70;

// A name pattern with a trailing * matches any suffix; otherwise it must be equal.
export const nameMatches = (name, pattern) => (pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : name === pattern);

// What WooCommerce keeps in the browser for the cart and checkout. A shop must
// work before the visitor chooses, so no service may claim any of these.
const SHOP_KEYS = ['wc_fragments_0f3c', 'wc_cart_hash_0f3c', 'wc_cart_created', 'woocommerce_items_in_cart', 'woocommerce_cart_hash', 'wp_woocommerce_session_0f3c', 'storeApiNonce', 'storeApiCartHash', 'storeApiCartData', 'wc'];

// Names set by infrastructure many sites share (Cloudflare, load balancers,
// PHP, WordPress itself). A site that doesn't use a service still has these, so
// naming one would pin the site's own cookie on that service.
const SHARED_NAMES = ['__cf_bm', '_cf_bm', '_cfuvid', 'cf_clearance', '__cflb', 'cf_chl_rc_m', 'INGRESSCOOKIE', 'AWSALB', 'AWSALBCORS', 'PHPSESSID', 'wordpress_test_cookie', 'wordpress_logged_in_0f3c', 'wp-settings-1', 'wp_lang'];

/**
 * @param {Map<string, {text: string, data: unknown}>} files services/<id>.json, keyed by id
 * @returns {string[]} problems, each naming the file
 */
export function checkServices(files) {
  const problems = [];
  const hosts = new Map();
  const services = new Map();

  for (const [id, { text, data }] of files) {
    const where = `services/${id}.json`;
    if (!validateService(data)) {
      problems.push(...describe(validateService.errors).map((e) => `${where}: ${e}`));
      continue;
    }
    services.set(id, data);
    if (data.id !== id) problems.push(`${where}: the id is "${data.id}", but the file is named "${id}".`);
    if (text !== format(data)) problems.push(`${where}: not formatted. Run npm run format.`);

    for (const host of data.match.hosts ?? []) {
      if (hosts.has(host)) problems.push(`${where}: the host "${host}" is already claimed by ${hosts.get(host)}.`);
      hosts.set(host, id);
    }

    const cookieNames = data.cookies.map((c) => c.name);
    for (const name of new Set(cookieNames.filter((n, i) => cookieNames.indexOf(n) !== i))) {
      problems.push(`${where}: the cookie "${name}" is listed twice.`);
    }

    for (const pattern of [...data.storage, ...cookieNames]) {
      for (const key of SHOP_KEYS.filter((k) => nameMatches(k, pattern))) {
        problems.push(`${where}: "${pattern}" would hold back WooCommerce's "${key}", which a shop needs before any choice.`);
      }
    }

    // Storage keys live on the site's own origin, so a short one could be
    // the site's. Cookies a service sets on its own domain may be short.
    for (const key of data.storage.filter((k) => k.replace(/\*$/, '').length < 3)) problems.push(`${where}: "${key}" is too short to belong to one service.`);
    for (const pattern of [...data.storage, ...cookieNames]) {
      for (const name of SHARED_NAMES.filter((n) => nameMatches(n, pattern))) {
        problems.push(`${where}: "${pattern}" names "${name}", which many sites set without this service.`);
      }
    }

    if (data.replacedBy === id) problems.push(`${where}: replacedBy points to itself.`);
    if (firstSentence(data.purpose).length > CARD_TEXT) problems.push(`${where}: the purpose's first sentence is longer than ${CARD_TEXT} characters.`);
  }

  for (const [id, data] of services) {
    const target = data.replacedBy === undefined ? undefined : services.get(data.replacedBy);
    if (data.replacedBy !== undefined && target === undefined) problems.push(`services/${id}.json: replacedBy names "${data.replacedBy}", which does not exist.`);
    if (target?.retired) problems.push(`services/${id}.json: replacedBy names "${data.replacedBy}", which is retired.`);
  }

  return problems;
}

/**
 * common.json: the trackers a consent tool may keep on every page.
 *
 * @param {{text: string, data: unknown}} file
 * @param {Map<string, object>} services valid services, keyed by id
 * @returns {string[]}
 */
export function checkCommon({ text, data }, services) {
  const where = 'common.json';
  if (typeof data?.description !== 'string' || !Array.isArray(data?.services) || Object.keys(data).length !== 2) {
    return [`${where}: an object with only "description" and "services" (a list of ids).`];
  }
  const problems = [];
  if (text !== format(data)) problems.push(`${where}: not formatted. Run npm run format.`);
  const ids = data.services;
  if (ids.some((id, i) => typeof id !== 'string' || (i > 0 && ids[i - 1] >= id))) problems.push(`${where}: list each id once, in alphabetical order.`);
  for (const id of ids.filter((id) => typeof id === 'string')) {
    const service = services.get(id);
    if (service === undefined) problems.push(`${where}: "${id}" is not a service.`);
    else if (service.category === 'essential') problems.push(`${where}: "${id}" is essential, so nothing about it is ever held back.`);
    else if (service.retired) problems.push(`${where}: "${id}" is retired.`);
  }

  return problems;
}

/**
 * @param {string} locale
 * @param {{text: string, data: unknown}} file translations/<locale>.json
 * @param {Map<string, object>} services valid services, keyed by id
 * @returns {string[]}
 */
export function checkTranslation(locale, { text, data }, services) {
  const where = `translations/${locale}.json`;
  const problems = [];

  if (!/^[a-z]{2,3}(_[A-Z]{2})?$/.test(locale)) problems.push(`${where}: name the file after a WordPress locale, such as de or pt_BR.`);
  if (!validateTranslation(data)) return [...problems, ...describe(validateTranslation.errors).map((e) => `${where}: ${e}`)];
  if (text !== format(data)) problems.push(`${where}: not formatted. Run npm run format.`);

  for (const [id, entry] of Object.entries(data)) {
    const service = services.get(id);
    if (service === undefined) {
      problems.push(`${where}: "${id}" is not a service.`);
      continue;
    }
    if (firstSentence(entry.purpose).length > CARD_TEXT_TRANSLATED) problems.push(`${where}: ${id}'s purpose's first sentence is longer than ${CARD_TEXT_TRANSLATED} characters.`);
    const cookies = new Set(service.cookies.map((c) => c.name));
    for (const name of Object.keys(entry.cookies ?? {})) {
      if (!cookies.has(name)) problems.push(`${where}: ${id} has no cookie "${name}".`);
    }
    for (const value of [entry.purpose, ...Object.values(entry.cookies ?? {})]) {
      if (/[<>]/.test(value)) problems.push(`${where}: ${id} contains HTML: "${value}".`);
      if (/https?:\/\//.test(value)) problems.push(`${where}: ${id} contains a web address: "${value}".`);
    }
  }

  return problems;
}

// A logo is one colour on a 24×24 grid, made of path data only, so a site can
// draw it with no SVG parser and nothing in it can run.
export const LOGO_MAX = 4096;
const LOGO_PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s+-]+$/;
const LOGO_FILE = /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="([^"]*)">\s*((?:<path\b[^<>]*\/>\s*)+)<\/svg>\s*$/;

/**
 * @param {string} id the file's name without .svg
 * @param {string} text logos/<id>.svg
 * @param {Set<string>} services every service id
 * @returns {{problems: string[], d: string}} the paths joined into one
 */
export function checkLogo(id, text, services) {
  const where = `logos/${id}.svg`;
  const problems = [];
  if (!services.has(id)) problems.push(`${where}: there is no service "${id}".`);
  if (Buffer.byteLength(text) > LOGO_MAX) problems.push(`${where}: larger than ${LOGO_MAX} bytes.`);
  const file = text.match(LOGO_FILE);
  if (file === null) return { problems: [...problems, `${where}: only <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> with <path d="…"/> elements inside.`], d: '' };
  if (file[1] !== '0 0 24 24') problems.push(`${where}: the viewBox is "${file[1]}", not "0 0 24 24".`);

  const paths = [];
  const fills = new Set();
  for (const [, attributes] of file[2].matchAll(/<path\b([^<>]*)\/>/g)) {
    const pairs = [...attributes.matchAll(/\s*([a-z-]+)="([^"]*)"/g)];
    if (pairs.map((m) => m[0]).join('') !== attributes.replace(/\s+$/, '')) problems.push(`${where}: a path's attributes can't be read.`);
    for (const [, name, value] of pairs) {
      if (name === 'd') paths.push(value);
      else if (name === 'fill') fills.add(value);
      else problems.push(`${where}: a path has "${name}"; only d (and one fill colour) are allowed.`);
    }
  }
  if (fills.size > 1) problems.push(`${where}: ${fills.size} fill colours; a logo has one.`);
  if (paths.length === 0) problems.push(`${where}: no path data.`);
  for (const d of paths.filter((d) => !LOGO_PATH.test(d))) problems.push(`${where}: path data may hold only path commands and numbers: "${d.slice(0, 40)}…".`);

  const d = paths.map((p) => p.trim().replace(/\s+/g, ' ')).join(' ');
  return { problems, d: problems.length ? '' : d };
}

// Words and links that belong in no public file of this repository.
const PRIVATE = [
  [/github\.com\/navidkashani\/wconsent(?![-\w])/, 'a link to a private repository'],
  [/\bTODO\b/, 'TODO'],
  [/\bFIXME\b/, 'FIXME'],
  [/\bPro\b/, '"Pro"'],
  [/\bNexus\b/, '"Nexus"'],
  [/\bADRs?\b/, '"ADR"'],
];

/**
 * @param {string} path
 * @param {string} text
 * @returns {string[]}
 */
export function checkPublic(path, text) {
  const problems = [];
  text.split('\n').forEach((line, index) => {
    for (const [pattern, label] of PRIVATE) {
      if (pattern.test(line)) problems.push(`${path}:${index + 1}: ${label} has no place in a public file.`);
    }
  });

  return problems;
}

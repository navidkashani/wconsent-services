import assert from 'node:assert/strict';
import { test } from 'node:test';
import { convert } from './convert-cookies.mjs';
import { parseCsv } from './lib/csv.mjs';
import { checkCommon, checkLogo, checkPublic, checkServices, checkTranslation, format } from './lib/rules.mjs';

const service = (overrides = {}) => ({
  $schema: 'https://cdn.jsdelivr.net/gh/navidkashani/wconsent-services@1/schema/service.json',
  id: 'example',
  version: 1,
  name: 'Example',
  provider: 'Example Ltd.',
  category: 'statistics',
  purpose: 'Measures visits.',
  privacyUrl: 'https://example.com/privacy',
  dataCountry: 'EU (Ireland)',
  legalBasis: 'consent',
  match: { hosts: ['cdn.example.com'] },
  cookies: [{ name: '_ex', lifetime: '1 year', purpose: 'Tells visitors apart.' }],
  storage: [],
  consentMode: { google: false, advanced: false },
  placeholder: null,
  wordpress: { plugins: [], handles: [] },
  sources: ['https://example.com/docs/cookies'],
  checked: '2026-10-27',
  ...overrides,
});

const files = (...services) => new Map(services.map((s) => [s.id, { text: format(s), data: s }]));
const only = (problems, text) => problems.filter((p) => p.includes(text));

test('a valid service passes', () => {
  assert.deepEqual(checkServices(files(service())), []);
});

test('a service must say where its facts come from and when they were checked', () => {
  const { sources, checked, ...rest } = service();
  const problems = checkServices(files(rest));
  assert.equal(only(problems, "'sources'").length, 1);
  assert.equal(only(problems, "'checked'").length, 1);
});

test('the id must match the file name', () => {
  const s = service();
  assert.equal(only(checkServices(new Map([['other', { text: format(s), data: s }]])), 'named "other"').length, 1);
});

test('two services may not claim one host', () => {
  const problems = checkServices(files(service(), service({ id: 'second' })));
  assert.equal(only(problems, 'already claimed by example').length, 1);
});

test('links must be https', () => {
  assert.notDeepEqual(checkServices(files(service({ privacyUrl: 'http://example.com/privacy' }))), []);
  assert.notDeepEqual(checkServices(files(service({ sources: ['http://example.com'] }))), []);
});

test('unconfirmed facts may be empty, never invented', () => {
  assert.deepEqual(checkServices(files(service({ provider: '', privacyUrl: '', dataCountry: '' }))), []);
});

test('texts have length limits', () => {
  assert.notDeepEqual(checkServices(files(service({ purpose: 'x'.repeat(141) }))), []);
});

test('files must be in the canonical layout', () => {
  const s = service();
  assert.equal(only(checkServices(new Map([['example', { text: JSON.stringify(s), data: s }]])), 'not formatted').length, 1);
});

test('no service may hold back what a WooCommerce shop needs', () => {
  assert.equal(only(checkServices(files(service({ storage: ['wc_*'] }))), 'WooCommerce').length, 3);
});

test('no service may claim a name many sites share, or a very short one', () => {
  assert.equal(only(checkServices(files(service({ cookies: [{ name: '__cf_bm', lifetime: '30 minutes', purpose: 'Bot checks.' }] }))), 'many sites').length, 1);
  assert.equal(only(checkServices(files(service({ storage: ['zz'] }))), 'too short').length, 1);
});

test('replacedBy must name a live service', () => {
  assert.equal(only(checkServices(files(service({ replacedBy: 'missing' }))), 'does not exist').length, 1);
  const problems = checkServices(files(service({ replacedBy: 'next' }), service({ id: 'next', match: { hosts: ['next.example.com'] }, retired: true })));
  assert.equal(only(problems, 'is retired').length, 1);
});

test('common.json names live, non-essential services once, in order', () => {
  const live = new Map([
    ['a-one', service({ id: 'a-one' })],
    ['b-two', service({ id: 'b-two' })],
    ['gone', service({ id: 'gone', retired: true })],
    ['needed', service({ id: 'needed', category: 'essential' })],
  ]);
  const common = (ids) => {
    const data = { description: 'Kept on every page.', services: ids };
    return { text: format(data), data };
  };
  assert.deepEqual(checkCommon(common(['a-one', 'b-two']), live), []);
  assert.equal(only(checkCommon(common(['b-two', 'a-one']), live), 'alphabetical').length, 1);
  assert.equal(only(checkCommon(common(['a-one', 'a-one']), live), 'alphabetical').length, 1);
  assert.equal(only(checkCommon(common(['missing']), live), 'not a service').length, 1);
  assert.equal(only(checkCommon(common(['needed']), live), 'essential').length, 1);
  assert.equal(only(checkCommon(common(['gone']), live), 'retired').length, 1);
  assert.equal(checkCommon({ text: '[]', data: [] }, live).length, 1);
});

const services = new Map([['example', service()]]);
const translation = (data) => ({ text: format(data), data });

test('a valid translation passes', () => {
  assert.deepEqual(checkTranslation('de', translation({ example: { purpose: 'Misst Besuche.', cookies: { _ex: 'Unterscheidet Besucher.' }, machine: true } }), services), []);
});

test('a translation must match a real service and cookie', () => {
  assert.equal(only(checkTranslation('de', translation({ nope: { purpose: 'X.' } }), services), 'not a service').length, 1);
  assert.equal(only(checkTranslation('de', translation({ example: { purpose: 'X.', cookies: { _other: 'Y.' } } }), services), 'no cookie').length, 1);
});

test('a translation holds no HTML or links', () => {
  assert.equal(only(checkTranslation('de', translation({ example: { purpose: '<b>X</b>.' } }), services), 'HTML').length, 1);
  assert.equal(only(checkTranslation('de', translation({ example: { purpose: 'Siehe https://x.example.' } }), services), 'web address').length, 1);
});

test('a translation file is named after a WordPress locale', () => {
  assert.equal(only(checkTranslation('German', translation({}), services), 'WordPress locale').length, 1);
  assert.deepEqual(checkTranslation('pt_BR', translation({}), services), []);
});

test('public files carry no private links or internal words', () => {
  assert.equal(checkPublic('README.md', `See https://github.com/navidkashani/${'wconsent'}/issues/1`).length, 1);
  assert.equal(checkPublic('README.md', 'See https://github.com/navidkashani/wconsent-services').length, 0);
  for (const word of ['TO' + 'DO', 'FIX' + 'ME', 'P' + 'ro', 'Nex' + 'us', 'A' + 'DR']) {
    assert.equal(checkPublic('README.md', `A ${word} here.`).length, 1, word);
  }
  assert.equal(checkPublic('README.md', 'A process, a product, provider.').length, 0);
});

test('a purpose\'s first sentence fits on a card', () => {
  assert.deepEqual(checkServices(files(service({ purpose: 'Measures visits. Then says a great deal more about what it does.' }))), []);
  assert.equal(only(checkServices(files(service({ purpose: 'Measures visits, conversions, audiences and a lot more.' }))), 'first sentence').length, 1);
  const translation = { example: { purpose: `${'Mesure les visites '.repeat(4)}.` } };
  assert.equal(only(checkTranslation('fr', { text: format(translation), data: translation }, new Map([['example', service()]])), 'first sentence').length, 1);
});

const svg = (inner, viewBox = '0 0 24 24') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner}</svg>\n`;
const ids = new Set(['example']);

test('a logo is one colour of path data on a 24×24 grid', () => {
  assert.deepEqual(checkLogo('example', svg('<path d="M0 0h24v24H0z"/><path d="M1 1L2 2z"/>'), ids), { problems: [], d: 'M0 0h24v24H0z M1 1L2 2z' });
  assert.deepEqual(checkLogo('example', svg('<path fill="#000" d="M0 0h24z"/>'), ids).problems, []);
  const fails = (text, word, id = 'example') => assert.equal(only(checkLogo(id, text, ids).problems, word).length, 1, `${text} should fail on ${word}`);
  fails(svg('<path d="M0 0h24z"/>'), 'no service', 'unknown');
  fails(svg('<path d="M0 0h24z"/>', '0 0 48 48'), 'viewBox');
  fails(svg('<circle r="4"/>'), 'only <svg');
  fails(svg('<path d="M0 0h24z"/><script>alert(1)</script>'), 'only <svg');
  fails(svg('<path d="M0 0h24z" onload="x()"/>'), '"onload"');
  fails(svg('<path d="M0 0h24z" style="fill:red"/>'), '"style"');
  fails(svg('<path fill="#000" d="M0 0z"/><path fill="#fff" d="M1 1z"/>'), 'fill colours');
  fails(svg('<path d="M0 0 url(#x)"/>'), 'path commands');
  fails(svg(`<path d="M0 0${' L1 1'.repeat(1000)}"/>`), 'larger than');
});

test('the CSV reader handles quotes and line breaks', () => {
  assert.deepEqual(parseCsv('a,"b,""c""\nd",e\r\nf,g,h\n'), [['a', 'b,"c"\nd', 'e'], ['f', 'g', 'h']]);
});

test('the cookie conversion maps categories and drops duplicates', () => {
  const csv = [
    'ID,Platform,Category,Cookie / Data Key name,Domain,Description,Retention period,Data Controller,User Privacy & GDPR Rights Portals,Wildcard match',
    '1,Google,Analytics,_ga,,Tells  users apart. ,2 years,Google,,0',
    '2,Google,Analytics,_ga,,Again.,2 years,Google,,0',
    '3,Hotjar,Marketing,_hj,,Prefix.,1 year,Hotjar,,1',
    '4,Odd,Unknown,odd,,Skipped.,1 year,Odd,,0',
    '5,Site,Security,,,No name.,1 year,Site,,0',
  ].join('\n');
  assert.deepEqual(convert(csv), [
    ['_ga', 0, 'statistics', 'Google', '2 years', 'Tells users apart.'],
    ['_hj', 1, 'marketing', 'Hotjar', '1 year', 'Prefix.'],
  ]);
});

# WConsent services

An open list of third-party web services: analytics, advertising pixels,
video and map embeds, chat widgets, forms, payments. For each service it says
how to recognise it on a page, which cookies it sets, who receives the data
and where. Every entry is checked against the vendor's own pages.

The [WConsent](https://wconsent.io) cookie consent plugin for WordPress reads
this list to block services until a visitor agrees and to describe them in its
preferences window. Sites check for a new release once a week. Anyone may use
the data under the [GPL-3.0](LICENSE).

## What's here

| Folder | What it holds |
|---|---|
| `services/` | One file per service, named after its id. |
| `translations/` | The visitor-facing texts in other languages, one file per WordPress locale. |
| `logos/` | One-colour logos, one per service that has one, named after its id. |
| `cookies/` | A converted copy of the [Open Cookie Database](https://github.com/jkwakman/Open-Cookie-Database), for cookies no service names. |
| `schema/` | JSON Schemas for services and translations. |
| `scripts/` | The checks, the build and the cookie conversion. |
| `dist/` | The built files sites download, made at each release. |

## A service

```json
{
  "$schema": "https://cdn.jsdelivr.net/gh/navidkashani/wconsent-services@1/schema/service.json",
  "id": "hotjar",
  "version": 2,
  "name": "Hotjar",
  "provider": "Hotjar Ltd.",
  "category": "statistics",
  "purpose": "Heatmaps and session recordings.",
  "privacyUrl": "https://www.hotjar.com/legal/policies/privacy/",
  "dataCountry": "EU (Ireland)",
  "legalBasis": "consent",
  "match": { "hosts": ["static.hotjar.com", "script.hotjar.com"], "inline": ["_hjSettings"] },
  "cookies": [{ "name": "_hjSessionUser_*", "lifetime": "1 year", "purpose": "Tells visitors apart." }],
  "storage": ["_hjUserAttributes"],
  "consentMode": { "google": false, "advanced": false },
  "placeholder": null,
  "wordpress": { "plugins": ["hotjar/hotjar.php"], "handles": [] },
  "sources": ["https://docs.contentsquare.com/en/web/cookies/"],
  "checked": "2026-10-27"
}
```

Every field is described in [`schema/service.json`](schema/service.json). The
main ones:

- **`id`** is permanent. It is never renamed or deleted, because sites store
  it. A renamed service gets a new id, and the old entry gets `replacedBy`. A
  service that no longer exists gets `"retired": true` and stays in the list.
- **`category`** is one of `essential`, `functional`, `statistics`,
  `marketing` and `media`.
- **`match.hosts`** are the hosts (optionally with a path) its scripts,
  iframes and pixels load from. A URL matches when its host is the pattern's
  host or a subdomain of it, and its path starts with the pattern's path. The
  longest match across all services wins. **`match.inline`** are pieces of the
  vendor's snippet that identify code written into the page.
- **`cookies`** and **`storage`** list what it keeps in the browser. A
  trailing `*` matches any suffix.
- **`provider`**, **`privacyUrl`** and **`dataCountry`** are left empty when
  they could not be confirmed. They are never guessed.
- **`wordpress`** holds hints about other WordPress plugins: `plugins` that
  usually add the service, and script `handles` of another plugin that only
  work together with it.
- **`common.json`** names the trackers that tag managers and plugins often
  add by JavaScript after a page has loaded. A consent tool can keep their
  rules on every page and carry the rest only for sites that use them. The
  build puts the list in `services.json` as `common`.
- **`sources`** and **`checked`** say where the facts come from and when a
  person last checked them.

### Translations

`translations/de.json` holds German texts, keyed by service id:

```json
{
  "hotjar": {
    "purpose": "Heatmaps und Sitzungsaufzeichnungen.",
    "cookies": { "_hjSessionUser_*": "Unterscheidet Besucher." },
    "machine": true
  }
}
```

Names, cookie names and web addresses are never translated. `"machine": true`
marks a machine translation that no native speaker has confirmed yet; it is
left out of the built files.

## Using the data

Each release builds `dist/`:

| File | What it holds |
|---|---|
| `dist/index.json` | The format, version and date, and every other file with its size and sha256. |
| `dist/services.json` | All services. |
| `dist/cookies.json` | The converted Open Cookie Database: `[name, wildcard, category, platform, retention, description]` rows. |
| `dist/i18n/<locale>.json` | One language's texts. |
| `dist/logos.json` | `{ "logos": { "<id>": "<path data>" } }`: each logo as one path on a 24×24 grid, to fill with a single colour. |

Read the index from the newest release of format 1:

```
https://cdn.jsdelivr.net/gh/navidkashani/wconsent-services@1/dist/index.json
```

Then fetch the files you need from that exact version, and check each one's
sha256 against the index:

```
https://cdn.jsdelivr.net/gh/navidkashani/wconsent-services@1.4.0/dist/services.json
```

A change that would break a reader of the current layout becomes format 2,
served at `@2`. Format 1 keeps getting releases for a year after that.

Versions only go up. If you keep a copy of your own, ignore a release older
than the one you have.

## Contributing

Corrections and new services are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md),
or open an issue: [add a service](../../issues/new?template=add-service.yml),
[fix a service](../../issues/new?template=fix-service.yml) or
[improve a translation](../../issues/new?template=translation.yml).

## Licence and credits

GPL-3.0. The cookie data in `cookies/` comes from the Open Cookie Database
under Apache-2.0. The logos come from Simple Icons and other sets under their
own licences, and the brands are their owners' trademarks. See
[CREDITS.md](CREDITS.md).

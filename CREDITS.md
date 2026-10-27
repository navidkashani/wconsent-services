# Credits

The list itself is GPL-3.0 (see [LICENSE](LICENSE)). It includes or draws on
these works, under their own licences.

## Open Cookie Database

`cookies/open-cookie-database.json` and the `cookies.json` built from it are a
converted copy of the Open Cookie Database.

- Source: https://github.com/jkwakman/Open-Cookie-Database, at the commit in
  `cookies/source.json`
- Copyright the Open Cookie Database contributors
- Licensed under the Apache License, Version 2.0 (see
  [cookies/LICENSE](cookies/LICENSE))
- Changes: the columns were reduced to name, wildcard, category, platform,
  retention and description; categories were mapped to this list's
  (Functional, Security and Necessary to essential, Personalization to
  functional, Analytics to statistics, Marketing to marketing); whitespace
  was collapsed; rows without a name and repeated name and platform pairs
  were dropped; rows were sorted by name. See `scripts/convert-cookies.mjs`.

Some services' cookie lifetimes also come from it, where the vendor's own
pages give none. Their `sources` link to it.

## webappanalyzer

https://github.com/enthec/webappanalyzer, GPL-3.0. A starting point for drafting
new services, which are then checked against the vendor's own pages before
they are added.

## WhoTracks.me

https://github.com/whotracksme, statistics under CC BY 4.0. Used only to decide
which services to check first, by how common they are. No tracker data from
WhoTracks.me is copied into this list.

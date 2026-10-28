# Contributing

Thank you for helping keep the list accurate. Wrong facts mislead visitors and
site owners, so every change is checked before it is merged.

## The rules

1. **Facts come from the vendor's own pages.** Privacy policy, cookie list,
   developer docs, install guide. Put every page you used in `sources`.
2. **Don't guess.** If you can't confirm a fact, leave it empty (`""`) or
   leave the cookie out. An empty field is better than a wrong one.
3. **Never copy from lists with restrictive licences**: cookiedatabase.org,
   Cookiepedia, Ghostery's TrackerDB, DuckDuckGo's Tracker Radar, or any
   cookie or tracker database whose licence forbids commercial use or
   derivatives. Not even as a checklist.
4. **Ids are permanent.** Never rename or delete a file in `services/`. For a
   renamed service, add a new file and set `replacedBy` in the old one. For a
   service that's gone, set `"retired": true`.
5. **Every change raises `version` by one** and sets `checked` to the day you
   checked it.
6. **Plain words.** A `purpose` is one short sentence a visitor understands,
   ending with a full stop, of 50 characters at most (70 in a translation),
   so it fits on the service's card: "Measures visits and conversions." Cookie
   purposes are a few words: "Tells visitors apart."
7. **Licence.** By contributing, you agree that your contribution is licensed
   under the GPL-3.0, like the rest of the repository.

## Adding a service

1. Copy a similar file in `services/` to `services/<id>.json`. The id is
   lowercase words joined by hyphens: `google-analytics`, `tiktok-pixel`.
2. Fill in every field. [`schema/service.json`](schema/service.json)
   describes each one.
3. Add every host its scripts, iframes and pixels load from. A host already
   claimed by another service can't be claimed twice: use a longer pattern
   with a path, such as `google.com/recaptcha`.
4. Run the checks:

   ```
   npm install
   npm run format
   npm run check
   ```

5. Open a pull request and fill in the template.

## Adding a logo

A logo is optional. A service without one shows its initials.

1. Take the logo from [Simple Icons](https://simpleicons.org) (CC0) if it has
   one. Otherwise use a set under the MIT or CC0 licence, or the brand's own
   press kit, and make it one colour. Never use a logo its brand asked Simple
   Icons to remove.
2. Save it as `logos/<id>.svg`, named after the service's id, in exactly this
   form: a 24×24 viewBox and `<path>` elements with only a `d` attribute.

   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 0C5.37…"/></svg>
   ```

   No colours, styles, groups, shapes, text or links; at most 4 KB. Holes
   come from the path's direction, as in Simple Icons, since every path is
   filled the same way.
3. Check it reads well at 28 pixels, dark on light and light on dark.
4. Add a line for it to [CREDITS.md](CREDITS.md): where it came from and
   under which licence.
5. Run `npm run check`.

## Translations

Texts are in `translations/<locale>.json`, using WordPress locale names (`de`,
`fr`, `pt_BR`). They follow each language's established WordPress
terminology and its polite form where it has one (German "Sie").

Never translate a service's name, a cookie name or a web address. If you speak
the language and an entry reads well, remove its `"machine": true`; if it
doesn't, fix it and remove the flag.

## Releases

The maintainer releases when something has changed:

```
npm run release -- 1.4.0
```

This writes `release.json`, builds `dist/` and updates `CHANGELOG.md`. After
the release pull request is merged, the maintainer tags the merge commit
`v1.4.0`, and the release workflow publishes it.

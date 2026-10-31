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

## Logos

`logos/` and the `logos.json` built from it hold one-colour logos. Brand
names and logos are trademarks of their owners. They are here only to show
which service is which, and no endorsement is implied. Every logo was made one
colour and fitted to a 24×24 grid; see each source below.

### Simple Icons

https://github.com/simple-icons/simple-icons, version 16.36.0, CC0-1.0. For a
product of a larger brand (Meta Pixel, Cloudflare Turnstile, Zendesk Chat,
Acuity Scheduling),
the brand's own icon.

acuity-scheduling (`squarespace`), apple-music (`applemusic`),
apple-podcasts (`applepodcasts`), audioboom (`audioboom`),
booking-com (`bookingdotcom`), bootstrapcdn (`bootstrap`), brevo (`brevo`),
bunny-fonts (`bunnydotnet`), bunny-stream (`bunnydotnet`),
cal-com (`caldotcom`), calendly (`calendly`), cdnjs (`cloudflare`),
cloudflare-turnstile (`cloudflare`), cloudflare-web-analytics (`cloudflare`),
dailymotion (`dailymotion`), discord-widget (`discord`), disqus (`disqus`),
facebook-embed (`facebook`), fathom (`fathom`), flickr (`flickr`),
font-awesome (`fontawesome`), giphy (`giphy`), google-ads (`googleads`),
google-adsense (`googleadsense`), google-analytics (`googleanalytics`),
google-calendar (`googlecalendar`), google-fonts (`googlefonts`),
google-hosted-libraries (`google`), google-maps (`googlemaps`),
google-tag-manager (`googletagmanager`), google-translate (`googletranslate`),
gravatar (`gravatar`), help-scout (`helpscout`), hotjar (`hotjar`),
hubspot (`hubspot`), instagram-embed (`instagram`), intercom (`intercom`),
issuu (`issuu`), jquery-cdn (`jquery`), jsdelivr (`jsdelivr`),
klarna (`klarna`), klook (`klook`), komoot (`komoot`), livechat (`livechat`),
loom (`loom`), mailchimp (`mailchimp`), mapbox (`mapbox`), matomo (`matomo`),
matomo-cloud (`matomo`), matomo-tag-manager (`matomo`), meta-pixel (`meta`),
mixpanel (`mixpanel`), openstreetmap (`openstreetmap`), paddle (`paddle`),
paddle-retain (`paddle`), paypal (`paypal`), paypal-marketing (`paypal`),
pinterest-embed (`pinterest`), pinterest-tag (`pinterest`),
plausible (`plausibleanalytics`), posthog (`posthog`), quora-pixel (`quora`),
reddit-pixel (`reddit`), shopify-buy-button (`shopify`),
sketchfab (`sketchfab`), snap-pixel (`snapchat`), soundcloud (`soundcloud`),
spotify (`spotify`), strava (`strava`), stripe (`stripe`), ted (`ted`),
tiktok-embed (`tiktok`), tiktok-pixel (`tiktok`),
trusted-shops (`trustedshops`), trustpilot (`trustpilot`),
trustpilot-invitations (`trustpilot`), unpkg (`unpkg`), unsplash (`unsplash`),
vimeo (`vimeo`), wistia (`wistia`), wordpress-org (`wordpress`),
x-embed (`x`), x-pixel (`x`), youtube (`youtube`), zendesk-chat (`zendesk`),
zoho-bookings (`zoho`), zoho-forms (`zoho`),
zoho-marketing-automation (`zoho`), zoho-pagesense (`zoho`),
zoho-salesiq (`zoho`)

### gilbarbara/logos

https://github.com/gilbarbara/logos, commit d6960ed, CC0-1.0. Colours merged
into one; the reCAPTCHA logo keeps its arrows without the word.

amplitude (`logos/amplitude-icon.svg`),
google-recaptcha (`logos/recaptcha.svg`), heap (`logos/heap-icon.svg`),
optimizely (`logos/optimizely-icon.svg`), segment (`logos/segment-icon.svg`),
vwo (`logos/vwo.svg`),
woocommerce-attribution (`logos/woocommerce-icon.svg`)

### svgl

https://github.com/pheralb/svgl, commit 88467c0, MIT licence, copyright (c)
2022 Pablo Hdez. Gradients merged into one colour.

hcaptcha (`static/library/hcaptcha.svg`)

### Brands' own press kits

The symbol alone, from each brand's press or brand page, made one colour.

- activecampaign: ActiveCampaign press kit https://www.activecampaign.com/brand
- crisp: Crisp brand assets, https://crisp.chat/en/about/
- jetpack-comments, jetpack-stats, wordpress-com-cdn: Automattic brand
  materials (the Jetpack brand kit)
  https://automattic.com/press/brand-materials/. Its terms name Automattic's
  partners and editorial use; the logo is used here only to identify the
  service.
- mouseflow: Mouseflow press page https://mouseflow.com/press-releases/
- taboola: Taboola branding page https://www.taboola.com/branding
- tidio: Tidio brand PDF https://assets.tidio.com/homepage/brand/assets.pdf

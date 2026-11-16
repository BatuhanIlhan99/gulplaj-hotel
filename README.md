# Gülplaj Hotel

Website: https://www.gulplajhotel.com/ (HTTPS enforced; apex redirects to www).

The current website source is in `dist/`. Edit `site-content.json` for managed
hotel text and `index.html` for page structure,
`styles.css` for appearance, and the JavaScript files for calendar, gallery
and navigation behavior. Original hotel photographs are in `dist/assets/`.
Mobile-friendly JPEG previews are in `dist/assets/previews/`. Gallery cards
use previews and open their original photograph when selected. New images
can be prepared with `python scripts/prepare-images.py` (Pillow required).

Every push to `main` runs the validation script and publishes `dist/` to
GitHub Pages. Changes can be made and published from the Codex chat using
this checkout. The custom domain is configured in GitHub Pages settings.

Managed content comes from `dist/site-content.json`; detail-page editorial
content comes from `content/seo-pages.json`. Build generated HTML before checks:

```text
node scripts/materialize-gallery.mjs
node scripts/materialize-reviews.mjs
node scripts/build-seo.mjs
node scripts/validate-site.mjs
node --test scripts/admin.test.mjs scripts/hotelrunner.test.mjs scripts/security.test.mjs scripts/seo.test.mjs
```

The same ordered steps run in GitHub Actions for every publication, including
admin content updates. Generated HTML contains current text without requiring
JavaScript. See `SEO-PLAN.md` for the search-intent map, Google ownership setup,
measurement boundaries and 30/60/90-day maintenance plan.

The official property-specific HotelRunner search widget is installed in
`dist/hotelrunner-search.html`. The bridge handles loading, resize and a direct
HTTPS booking fallback. Live sales parameters and confirmation belong to
HotelRunner. `dist/booking-config.js` contains public URLs only. Payment and
inventory/channel synchronization have not been tested. See `PAYMENT-SETUP.md`
for the recorded handoff and remaining acceptance checks.

Booking stays on our domain: official search targets its current frame, then
opens a native dialog around that same frame. `/rezervasyon/` is an additional
first-party view, generated from `scripts/booking-page.mjs`. The official
HotelRunner engine performs reservation creation; we do not generate local
confirmations or collect card details. See `ONSITE-BOOKING.md` for current
payment settings, closed-rate limitations and remaining stock/email tests.

The source was imported from the existing Gülplaj Sites project, preserving
its original photos and history. GitHub Pages is the publishing destination
for this checkout. `.openai/hosting.json` retains the original Site identity
as provenance; it is not part of GitHub Pages deployment configuration.

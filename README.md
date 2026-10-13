# Gülplaj Hotel

Website: http://www.gulplajhotel.com/ (custom-domain HTTPS is pending).

The current website source is in `dist/`. Edit `index.html` for content,
`styles.css` for appearance, and the JavaScript files for calendar, gallery
and navigation behavior. Original hotel photographs are in `dist/assets/`.
Mobile-friendly JPEG previews are in `dist/assets/previews/`. Gallery cards
use previews and open their original photograph when selected. New images
can be prepared with `python scripts/prepare-images.py` (Pillow required).

Every push to `main` runs the validation script and publishes `dist/` to
GitHub Pages. Changes can be made and published from the Codex chat using
this checkout. The custom domain is configured in GitHub Pages settings.

Run `node scripts/validate-site.mjs` before committing changes.

The official property-specific HotelRunner search widget is installed in
`dist/hotelrunner-search.html`. The bridge handles loading, resize and a direct
HTTPS booking fallback. Live sales parameters and confirmation belong to
HotelRunner. `dist/booking-config.js` contains public URLs only. Payment and
inventory/channel synchronization have not been tested. See `PAYMENT-SETUP.md`
for the recorded handoff and remaining acceptance checks.

The source was imported from the existing Gülplaj Sites project, preserving
its original photos and history. GitHub Pages is the publishing destination
for this checkout. `.openai/hosting.json` retains the original Site identity
as provenance; it is not part of GitHub Pages deployment configuration.

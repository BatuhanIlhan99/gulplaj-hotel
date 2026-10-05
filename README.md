# Gülplaj Hotel

Website: https://batuhanilhan99.github.io/gulplaj-hotel/

The current website source is in `dist/`. Edit `index.html` for content,
`styles.css` for appearance, and the JavaScript files for calendar, gallery
and navigation behavior. Original hotel photographs are in `dist/assets/`.
Mobile-friendly JPEG previews are in `dist/assets/previews/`. Gallery cards
use previews and open their original photograph when selected. New images
can be prepared with `python scripts/prepare-images.py` (Pillow required).

Every push to `main` runs the validation script and publishes `dist/` to
GitHub Pages. Changes can be made and published from the Codex chat using
this checkout. A custom domain can be connected later in GitHub Pages settings.

Run `node scripts/validate-site.mjs` before committing changes.

Online card payment is not active. `dist/booking-config.js` accepts a verified
external booking provider URL; it must never contain merchant credentials.
See `PAYMENT-SETUP.md` for integration requirements.

The source was imported from the existing Gülplaj Sites project, preserving
its original photos and history. GitHub Pages is the publishing destination
for this checkout. `.openai/hosting.json` retains the original Site identity
as provenance; it is not part of GitHub Pages deployment configuration.

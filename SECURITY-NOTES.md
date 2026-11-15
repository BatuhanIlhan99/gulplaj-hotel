# Security maintenance — 15 November 2026

The public site is static GitHub Pages. The admin shell and its public content
are accessible to anyone; GitHub repository write permission is required to
publish. This is not a customer or reservation database.

## Protections

- HTTPS enforced; GitHub reports an approved certificate for both domain names.
- Main page and admin have a restrictive CSP, with local scripts only, no inline
  code/eval, no plugins, no base URL changes and no outgoing form submissions.
  The HotelRunner search document retains its separate provider dependencies;
  it is not covered by the main document's script policy.
- GitHub credentials remain in memory, restricted to fixed API endpoints. Closing
  a pending login, logging out or leaving the page clears the credential and
  aborts pending requests. Late responses cannot authenticate a cancelled login
  or continue a multi-step publication. A request already accepted by GitHub
  cannot be recalled; inspect publication history if logout occurs during saving.
- Existing controls retained: repository permission verification, file SHA
  conflict protection, allowlisted image paths, raster re-encoding, upload limits,
  text rendering without HTML interpretation and preview message origin checks.
- Actions use verified immutable commit references. Build has read permission;
  only the separate deployment job receives Pages/OIDC write permissions.
  Checkout does not persist its credential; jobs have a ten-minute timeout.
- Every publication runs security regression tests and scans public text files
  for known credential formats/private configuration filenames. This detects
  common mistakes, not every possible secret. No matching secrets were found.

## Remaining boundaries

GitHub Pages does not provide this repository with arbitrary HTTP response header
configuration. The HTML policy does not implement `frame-ancestors`, HSTS or WAF
rules. No inert `_headers` file or misleading meta substitute was added. Hosting
with configurable response headers is needed for additional header controls.

Use a short-lived, fine-grained GitHub token limited to this repository, with
Contents write and Actions read access; never paste it into chat. Account MFA,
account recovery and token revocation remain owner-managed account settings.

Own-site iyzico payment is not active. Before activation, implement server-side
secrets, server-calculated totals, authenticated booking operations, verified PSP
results, replay/idempotency protection, reservation/inventory reconciliation and
failure/refund handling. Card numbers and CVV must never be saved in this repo,
browser storage, site forms or logs. Use the PSP's supported card-entry flow.

References:
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- https://docs.iyzico.com/odeme-metotlari/odeme-formu/cf-entegrasyonu

Validation: `node scripts/materialize-gallery.mjs`,
`node scripts/materialize-reviews.mjs`, `node scripts/validate-site.mjs`,
`node --test scripts/admin.test.mjs scripts/hotelrunner.test.mjs scripts/security.test.mjs`.

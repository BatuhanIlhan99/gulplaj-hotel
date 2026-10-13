# HotelRunner integration — 13 October 2026 handoff

The owner supplied the official Gülplaj widget:
`https://gulplaj-hotel.hotelrunner.com/widgets/0b30149edec93d3fa336/search_widget.js?v=1.0.0`.
It is installed in `dist/hotelrunner-search.html`, isolated from the marketing page's CSS and JavaScript. Stylesheets use explicit HTTPS. The frame reports readiness and expands for calendars and room controls. The parent validates message origin/source and retains a direct HTTPS Booking Engine link if the widget cannot load.

Dates, room counts, per-room adults, children and child ages belong to the official widget. HotelRunner generates the search URL. The website does not invent query parameters, cache prices, keep separate inventory, collect card data or issue reservation confirmations. The previous local summary form has been removed from the guest flow. Prices, restrictions, packages, policies, payment and confirmation are managed in HotelRunner's website channel; they need not be identical to ETS or other OTAs.

## Verified without a booking

The Turkish/TRY widget loads, dates can be selected, child age selection appears and adding a second room preserves the first room's selections. Selected dates and guests reach the actual Gülplaj Booking Engine. A mobile-width test opens the provider's HTTPS search as a full page. The initial test dates returned “Uygun oda bulunmamaktadır”, so prices/policies could not be verified. Validation and four recovery/origin/destination tests pass.

The owner explicitly postponed date-specific acceptance testing because they needed to leave. Resume the checklist below when they return; do not request the widget again. No test reservation, payment, cancellation or OTA inventory write was made. `paymentReady` remains false. Custom-domain GitHub HTTPS is a separate pending task.

## Remaining acceptance checks

1. Owner supplies dates with rates/inventory enabled for the website channel. The public widget and guest booking URL have already been obtained and integrated.
2. Confirm room mapping, actual inventory, occupancy/child ages, current prices, meal packages and cancellation/no-show conditions in HotelRunner.
3. Activate a bank/authorised payment-provider merchant agreement. In Tesisim → Ayarlar → Ödeme Yöntemleri, configure the supported virtual POS. Enter API secrets only into the secure provider/account admin, never into chat or static JavaScript.
4. Run the provider's supported test flow, including 3-D Secure success, cancellation/failure and returned confirmation. Verify the booking is Onaylandı and the corresponding inventory changes. Do not take a real payment merely to test without the hotel's approval.
5. Verify reservation modification/cancellation, released inventory and distribution to connected channels. Mark paymentReady true only after payment acceptance succeeds. The website must not independently claim confirmation.
6. Verify mobile booking flow, guest confirmation, total amount/currency, cancellation terms and provider return path before publication.

Official documentation:
https://support.hotelrunner.com/tr/arama-modulu-ekleme/
https://support.hotelrunner.com/tr/sanal-pos-ile-online-odeme-nasil-alinir/

Validation: `node scripts/validate-site.mjs` and `node --test scripts/hotelrunner.test.mjs`.

# HotelRunner activation checklist

The current site is complete as a hotel presentation and stay-planning surface. Live availability, confirmed bookings and card collection are blocked by missing hotel account configuration. No invented prices or payment confirmations.

1. In the hotel's HotelRunner account, open Kanallar → Rezervasyon Modülü → Modüller → Arama Modülü and obtain the account-generated embed code or verified guest booking URL. Never guess the tbook slug or query parameters.
2. Confirm room mapping, actual inventory, occupancy/child ages, current prices, meal packages and cancellation/no-show conditions in HotelRunner.
3. Activate a bank/authorised payment-provider merchant agreement. In Tesisim → Ayarlar → Ödeme Yöntemleri, configure the supported virtual POS. Enter API secrets only into the secure provider/account admin, never into chat or static JavaScript.
4. Run the provider's supported test flow, including 3-D Secure success, cancellation/failure and returned confirmation. Verify the booking is Onaylandı and the corresponding inventory changes. Do not take a real payment merely to test without the hotel's approval.
5. Integrate the exact generated embed, or put the verified public booking URL into dist/booking-config.js. Mark paymentReady true only after the above test succeeds. The website must not claim confirmed reservations from its local stay summary.
6. Verify mobile booking flow, guest confirmation, total amount/currency, cancellation terms and provider return path before publication.

Official documentation:
https://support.hotelrunner.com/tr/arama-modulu-ekleme/
https://support.hotelrunner.com/tr/sanal-pos-ile-online-odeme-nasil-alinir/

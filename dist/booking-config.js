// Public guest URLs only. HotelRunner manages inventory and reservation rules.
// Do not put App Manager tokens or payment-provider secrets in this file.
window.GULPLAJ_BOOKING_CONFIG = Object.freeze({
  provider: 'hotelrunner',
  presentation: 'embedded',
  onSitePath: './rezervasyon/',
  bookingUrl: 'https://gulplaj-hotel.hotelrunner.com/bv3?locale=tr&currency=TRY',
  widgetPage: './hotelrunner-search.html?v=onsite-1',
  paymentReady: false
});

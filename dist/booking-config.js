// Public guest URLs only. HotelRunner manages inventory, policies and payments.
// Do not put App Manager tokens or payment-provider secrets in this file.
window.GULPLAJ_BOOKING_CONFIG = Object.freeze({
  provider: 'hotelrunner',
  bookingUrl: 'https://gulplaj-hotel.hotelrunner.com/bv3?locale=tr&currency=TRY',
  widgetPage: './hotelrunner-search.html?v=booking-design-2',
  paymentReady: false
});

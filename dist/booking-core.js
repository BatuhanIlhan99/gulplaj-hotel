(function(root) {
  'use strict';
  const DAY = 86400000;
  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 2000 || year > 2200) return null;
    const time = Date.UTC(year, month - 1, day);
    return new Date(time).toISOString().slice(0, 10) === value ? time : null;
  }
  function hotelToday(now = new Date()) {
    const values = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now).map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }
  function addDays(value, count) {
    const time = parseDate(value);
    return time === null ? '' : new Date(time + count * DAY).toISOString().slice(0, 10);
  }
  function validateStay(checkin, checkout, today = hotelToday()) {
    const start = parseDate(checkin), end = parseDate(checkout);
    if (start === null || end === null) return { ok: false, message: 'Geçerli giriş ve çıkış tarihlerini seçin.' };
    if (checkin < today) return { ok: false, message: 'Giriş tarihi geçmişte olamaz.' };
    if (end <= start) return { ok: false, message: 'Çıkış tarihi giriş tarihinden sonra olmalıdır.' };
    return { ok: true, nights: (end - start) / DAY };
  }
  function displayDate(value) {
    const time = parseDate(value);
    return time === null ? '' : new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(time));
  }
  const api = { parseDate, hotelToday, addDays, validateStay, displayDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GulplajBooking = api;
})(typeof window !== 'undefined' ? window : globalThis);

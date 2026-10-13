(() => {
  'use strict';
  const frame = document.getElementById('hotelrunner-frame');
  const status = document.getElementById('hotelrunner-status');
  const link = document.getElementById('provider-booking');
  const config = window.GULPLAJ_BOOKING_CONFIG;
  try {
    const url = new URL(config.bookingUrl);
    if (config.provider !== 'hotelrunner' || url.protocol !== 'https:' || url.hostname !== 'gulplaj-hotel.hotelrunner.com' || url.username || url.password) throw new Error('Invalid booking destination');
    link.href = url.href;
    link.hidden = false;
    const source = new URL(config.widgetPage, location.href);
    if (source.origin !== location.origin) throw new Error('Invalid widget origin');
    window.addEventListener('message', event => {
      if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== 'gulplaj:hotelrunner') return;
      const height = Number(event.data.height);
      if (Number.isFinite(height)) frame.style.height = `${Math.min(1800, Math.max(260, height))}px`;
      if (event.data.state === 'ready') status.hidden = true;
      if (event.data.state === 'unavailable') {
        status.hidden = false;
        status.textContent = 'Arama modülü şu anda yüklenemiyor. Rezervasyon sayfasını doğrudan açabilirsiniz.';
      }
    });
    frame.src = source.href;
    setTimeout(() => {
      if (!status.hidden) status.textContent = 'Arama modülü yükleniyorsa bekleyebilir veya rezervasyon sayfasını doğrudan açabilirsiniz.';
    }, 22000);
  } catch {
    status.textContent = 'Online rezervasyon şu anda açılamıyor. Lütfen oteli arayın.';
    frame.hidden = true;
  }
})();

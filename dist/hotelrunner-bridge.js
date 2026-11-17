(() => {
  'use strict';
  const frame = document.getElementById('hotelrunner-frame');
  const status = document.getElementById('hotelrunner-status');
  const link = document.getElementById('provider-booking');
  const config = window.GULPLAJ_BOOKING_CONFIG;
  const back = document.getElementById('booking-back');
  const layout = document.querySelector('.reservation-layout');
  const section = document.getElementById('rezervasyon');
  const shell = document.getElementById('booking-shell');
  const heading = document.getElementById('booking-card-title');
  const description = document.getElementById('booking-card-description');
  let bookingView = false;
  let modalOpen = false;
  // Keep third-party booking code out of the admin's same-origin draft preview.
  if (new URL(location.href).searchParams.get('admin-preview') === '1') {
    frame.hidden = true;
    status.textContent = 'Taslak önizlemesi · Canlı rezervasyon seçenekleri sitenizde açılır.';
    return;
  }
  try {
    const url = new URL(config.bookingUrl);
    if (config.provider !== 'hotelrunner' || url.protocol !== 'https:' || url.hostname !== 'gulplaj-hotel.hotelrunner.com' || url.username || url.password) throw new Error('Invalid booking destination');
    link.href = new URL('./rezervasyon/', location.href).href;
    link.hidden = false;
    const source = new URL(config.widgetPage, location.href);
    if (source.origin !== location.origin) throw new Error('Invalid widget origin');
    function reset() {
      bookingView = false;
      if (modalOpen) { shell.close(); modalOpen = false; }
      shell.classList.remove('is-expanded');
      if (!shell.open) shell.show();
      layout.classList.remove('is-booking');
      section.classList.remove('booking-active');
      back.hidden = true;
      heading.textContent = 'Ne zaman gelmek istersiniz?';
      description.textContent = 'Güncel fiyatları ve müsait odaları görüntüleyin.';
      status.hidden = false;
      status.textContent = 'Tarih ve misafir seçenekleri yükleniyor…';
      frame.title = 'Gülplaj Hotel — Tarih ve misafir seçimi';
      frame.style.height = '';
      frame.src = source.href;
    }
    back.addEventListener('click', reset);
    shell.addEventListener('cancel', event => { event.preventDefault(); reset(); });
    frame.addEventListener('load', () => {
      let external = false;
      try { external = frame.contentDocument === null; } catch { external = true; }
      if (!external) return;
      // A loaded provider document is not a completed reservation. Only the
      // provider's final confirmation and reference number establish that.
      if (!bookingView) window.dispatchEvent(new Event('gulplaj:booking-open'));
      bookingView = true;
      layout.classList.add('is-booking');
      section.classList.add('booking-active');
      back.hidden = false;
      frame.title = 'Gülplaj Hotel — Oda seçimi ve rezervasyon';
      if (typeof shell.showModal === 'function') {
        shell.classList.add('is-expanded');
        frame.style.height = '100%';
        if (!modalOpen) { shell.close(); shell.showModal(); modalOpen = true; }
      } else frame.style.height = '920px';
      heading.textContent = 'Konaklamanızı tamamlayın.';
      description.textContent = 'Odanızı seçin, misafir bilgilerinizi girin ve rezervasyon koşullarını inceleyin.';
      status.hidden = true;
    });
    window.addEventListener('message', event => {
      if (bookingView || event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== 'gulplaj:hotelrunner') return;
      const height = Number(event.data.height);
      if (Number.isFinite(height)) frame.style.height = `${Math.min(1800, Math.max(150, height))}px`;
      if (event.data.state === 'ready') status.hidden = true;
      if (event.data.state === 'unavailable') {
        status.hidden = false;
        status.textContent = 'Tarih modülü yüklenemedi. Rezervasyon ekranını aşağıdaki bağlantıyla bu sitede açabilirsiniz.';
      }
    });
    frame.src = source.href;
    setTimeout(() => {
      if (!bookingView && !status.hidden) status.textContent = 'Seçenekler yükleniyorsa bekleyebilir veya aşağıdaki rezervasyon ekranını açabilirsiniz.';
    }, 22000);
  } catch {
    status.textContent = 'Online rezervasyon şu anda açılamıyor. Lütfen oteli arayın.';
    frame.hidden = true;
  }
})();

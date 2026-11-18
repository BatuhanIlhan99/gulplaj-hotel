export const guestAssistantHead = prefix =>
  `<link rel="stylesheet" href="${prefix}guest-assistant.css?v=1"><script src="${prefix}guest-assistant.js?v=1" defer></script>`;

export function guestWhatsAppHref(mobile) {
  return /^\+905\d{9}$/.test(mobile) ? 'https://wa.me/' + mobile.slice(1) : '';
}

export function renderGuestAssistant(data, phoneHref, escapeHtml) {
  const mobile = data.phone2 ? phoneHref(data.phone2).slice(4) : '';
  const whatsApp = guestWhatsAppHref(mobile);
  const topics = [
    ['Otopark', 'Otopark misafirlerimiz için ücretsizdir.'],
    ['Çocuk yaşı', '0–6 yaş ücretsizdir (6 yaş dahil). 7–12 yaş için yetişkin ücretinin %50’si uygulanır. 13 yaş ve üzeri yetişkin kategorisindedir.'],
    ['Plaj', 'Otel Erdek sahilinde denize sıfır konumdadır. Plajdaki şezlong ve şemsiyeler konaklayan misafirlerimize ücretsizdir.'],
    ['Erken giriş', `Standart giriş saati ${escapeHtml(data.checkIn.replace(':', '.'))}, en geç çıkış saati ${escapeHtml(data.checkOut.replace(':', '.'))}. Erken giriş için varış saatinizi paylaşın. Otel ekibi müsaitliğe göre teyit eder.`]
  ];
  const message = encodeURIComponent('Merhaba, Gülplaj Hotel ile ilgili bilgi almak istiyorum.');
  return `<div class="guest-assistant">
  <button class="guest-assistant-launch" id="guest-assistant-launch" type="button" aria-haspopup="dialog" aria-controls="guest-assistant-panel" hidden>
    <span class="guest-assistant-icon" aria-hidden="true"></span>
    <span>Misafir asistanı<small>${whatsApp ? 'WhatsApp · ' : ''}7/24 yanıt</small></span>
  </button>
  <dialog class="guest-assistant-panel" id="guest-assistant-panel" aria-labelledby="guest-assistant-title">
    <div class="guest-assistant-header">
      <div><p>Gülplaj Hotel</p><h2 id="guest-assistant-title">Misafir asistanı</h2></div>
      <button class="guest-assistant-close" type="button" aria-label="Asistanı kapat" autofocus>×</button>
    </div>
    <div class="guest-assistant-body">
      <p>Otomatik yanıt için bir konu seçin.</p>
      ${topics.map(([title, answer]) => `<details class="guest-assistant-topic" name="guest-assistant-topics"><summary>${title}</summary><p>${answer}</p></details>`).join('\n      ')}
    </div>
    <div class="guest-assistant-contact">
      ${whatsApp ? `<a class="guest-assistant-whatsapp" href="${whatsApp}?text=${message}" target="_blank" rel="noopener noreferrer">WhatsApp’tan otele yaz <span aria-hidden="true">↗</span></a>` : ''}
      <a class="guest-assistant-call" href="${escapeHtml(phoneHref(data.phone))}">Oteli ara</a>
    </div>
  </dialog>
</div>`;
}

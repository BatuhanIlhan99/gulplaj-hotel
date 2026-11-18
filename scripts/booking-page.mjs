import {origin,policy,escapeHtml,phoneLinks,bookingWhatsAppLink,guestAssistantHead,guestAssistant} from './seo-core.mjs';
import {childPricing} from './guest-assistant.mjs';
import {metricsHead} from './report-config.mjs';

export function renderBookingPage(data){
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="robots" content="noindex,follow"><meta name="theme-color" content="#143b4a">
<title>Rezervasyon | Gülplaj Hotel</title><meta name="description" content="Gülplaj Hotel rezervasyon koşullarını, çocuk tarifesini ve giriş-çıkış saatlerini inceleyin. Fiyat ve oda müsaitliği için otelle iletişime geçin."><link rel="canonical" href="${origin}/rezervasyon/">
<link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../styles.css?v=hotelrunner-1"><link rel="stylesheet" href="../booking-section.css?v=phone-4">${metricsHead('../')}${guestAssistantHead('../')}</head>
<body><a class="skip-link" href="#booking-content">Rezervasyona geç</a>
<main id="booking-content" class="booking-contact-page section-pad">
  <a class="wordmark" href="../" aria-label="Gülplaj Hotel ana sayfa"><span>GÜLPLAJ</span><small>HOTEL · ERDEK</small></a>
  <section class="booking-contact-card">
    <h1>Rezervasyon ve müsaitlik</h1>
    <p>Konaklama tarihlerinizi ve misafir sayınızı paylaşın. Müsait odaları, fiyatı ve rezervasyon koşullarını birlikte netleştirelim.</p>
    <div class="booking-contact-actions">${phoneLinks(data,'button')}${bookingWhatsAppLink(data)}</div>
  </section>
  <section class="booking-policies" id="kosullar" aria-labelledby="booking-policies-title">
    <h2 id="booking-policies-title">Rezervasyon koşulları</h2>
    <dl>
      <div><dt>Giriş ve çıkış</dt><dd>Odalara giriş ${escapeHtml(data.checkIn)} itibarıyla, çıkış en geç ${escapeHtml(data.checkOut)}. Erken giriş ve geç çıkış için otel müsaitliği önceden teyit eder.</dd></div>
      <div><dt>Çocuk tarifesi</dt><dd>${childPricing}</dd></div>
      <div><dt>Kahvaltı ve konaklama paketi</dt><dd>Kahvaltı ve yemek hizmetleri konaklama paketine göre değişebilir. Teklif alırken fiyata nelerin dahil olduğunu teyit edin.</dd></div>
      <div><dt>Kapora ve ödeme</dt><dd>Rezervasyonu kesinleştirmeden önce toplam tutarı, kapora gerekip gerekmediğini ve geçerli ödeme yöntemlerini otel ekibiyle teyit edin.</dd></div>
      <div><dt>İptal ve tarih değişikliği</dt><dd>Süre, varsa ücret ve iade koşulları rezervasyon planına bağlıdır. İşlem yapmadan önce rezervasyon onayınızdaki koşulları kontrol edin.</dd></div>
    </dl>
  </section>
  <a class="text-link" href="../odalar/">Odaları inceleyin →</a>
</main>${guestAssistant(data)}</body></html>
`;
}

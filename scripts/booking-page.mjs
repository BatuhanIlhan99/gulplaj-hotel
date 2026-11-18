import {origin,policy,phoneLinks,guestAssistantHead,guestAssistant} from './seo-core.mjs';
import {metricsHead} from './report-config.mjs';

export function renderBookingPage(data){
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="robots" content="noindex,follow"><meta name="theme-color" content="#143b4a">
<title>Rezervasyon | Gülplaj Hotel</title><meta name="description" content="Gülplaj Hotel’de telefonla rezervasyon yapın. Güncel fiyat ve oda müsaitliği için oteli arayın."><link rel="canonical" href="${origin}/rezervasyon/">
<link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../styles.css?v=hotelrunner-1"><link rel="stylesheet" href="../booking-section.css?v=phone-2">${metricsHead('../')}${guestAssistantHead('../')}</head>
<body><a class="skip-link" href="#booking-content">Rezervasyona geç</a>
<main id="booking-content" class="booking-contact-page section-pad">
  <a class="wordmark" href="../" aria-label="Gülplaj Hotel ana sayfa"><span>GÜLPLAJ</span><small>HOTEL · ERDEK</small></a>
  <section class="booking-contact-card">
    <h1>Telefonla rezervasyon</h1>
    <p>Konaklama tarihlerinizi ve misafir sayınızı paylaşın. Müsait odaları, fiyatı ve rezervasyon koşullarını birlikte netleştirelim.</p>
    <div class="booking-contact-actions">${phoneLinks(data,'button')}</div>
  </section>
  <a class="text-link" href="../odalar/">Odaları inceleyin →</a>
</main>${guestAssistant(data)}</body></html>
`;
}

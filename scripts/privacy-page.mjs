import {origin,policy,hotelEmailLink} from './seo-core.mjs';
import {metricsHead} from './report-config.mjs';

export function renderPrivacyPage() {
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="strict-origin-when-cross-origin"><meta name="robots" content="noindex,follow">
<title>Gizlilik ve ziyaretçi ölçümü | Gülplaj Hotel</title>
<meta name="description" content="Gülplaj Hotel web sitesinin ziyaretçi ölçümü ve ölçüm tercihlerinizi yönetme yolları.">
<link rel="canonical" href="${origin}/gizlilik/"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../styles.css?v=seo-1"><link rel="stylesheet" href="../booking-section.css?v=phone-5">${metricsHead('../')}</head>
<body class="privacy-page"><a class="skip-link" href="#icerik">İçeriğe geç</a>
<main id="icerik" class="booking-contact-page section-pad">
  <a class="wordmark" href="../" aria-label="Gülplaj Hotel ana sayfa"><span>GÜLPLAJ</span><small>HOTEL · ERDEK</small></a>
  <header class="booking-contact-card">
    <h1>Gizlilik ve ziyaretçi ölçümü</h1>
    <p>Web sitesinin ziyaretleri nasıl ölçtüğünü ve tercihinizi nasıl değiştirebileceğinizi bu sayfadan öğrenebilirsiniz.</p>
  </header>
  <section class="booking-policies" aria-labelledby="olcum">
    <h2 id="olcum">İsteğe bağlı ziyaretçi ölçümü</h2>
    <dl>
      <div><dt>Ne ölçülüyor?</dt><dd>İzin verirseniz ziyaret edilen sayfanın yolu, genel geliş kaynağı (örneğin arama motoru veya sosyal medya) ve rezervasyon sayfasının açılışı ölçülür. Bu bilgiler site kullanımını anlamak ve sayfaları iyileştirmek için kullanılır.</dd></div>
      <div><dt>Bilgiler nerede saklanıyor?</dt><dd>Ölçüm tercihiniz ve izin verdiğinizde günlük rastgele tarayıcı kodu cihazınızda saklanır. Cloudflare üzerindeki rapor sunucusu bu kodun günlük türevini kaydeder. Ölçüm kayıtları 90 gün sonra silinir. Tam IP adresi, URL sorgusu, kimlik, kart ve rezervasyon bilgileri ölçüm kayıtlarına eklenmez.</dd></div>
      <div><dt>Tercihinizi nasıl değiştirirsiniz?</dt><dd>Ölçüm tercihlerini açıp “İzin verme” seçeneğini seçerek yeni ölçümü durdurabilirsiniz. Bu işlem cihazınızdaki günlük tarayıcı kodunu da kaldırır.</dd></div>
    </dl>
    <button class="metrics-preferences" id="measurement-preferences" type="button" hidden>Ölçüm tercihleri</button>
  </section>
  <section class="booking-policies" aria-labelledby="iletisim">
    <h2 id="iletisim">Dış bağlantılar ve iletişim</h2>
    <dl>
      <div><dt>Google Maps, WhatsApp ve e-posta</dt><dd>Yol tarifi Google Maps’te, WhatsApp sohbeti WhatsApp’ta, e-posta bağlantısı ise cihazınızın e-posta uygulamasında açılır. Bu servisleri kullanırken ilgili sağlayıcının gizlilik koşulları geçerlidir.</dd></div>
      <div><dt>Sorularınız için</dt><dd>Site gizliliği ve ziyaretçi ölçümü hakkında bize yazabilirsiniz. ${hotelEmailLink()}</dd></div>
    </dl>
  </section>
  <nav class="booking-page-links" aria-label="Diğer bilgiler"><a href="../">Ana sayfaya dön</a><a href="../konum-ulasim/">Konum ve iletişim</a></nav>
</main>
</body></html>
`;
}

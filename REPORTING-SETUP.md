# Gülplaj özel yönetim raporları

17 Kasım 2026. Finansal veriler `dist/` veya herkese açık GitHub dosyalarında
saklanmaz. Mevcut GitHub Pages sitesi korunur; rapor API'si otelin Cloudflare
hesabındaki Worker ve D1 veritabanında çalışır.

## Kapsam

- Admin menüsünde Raporlar & finans; sunucu tarafından doğrulanan ayrı rapor
  parolası. GitHub yayın anahtarı bu sunucuya gönderilmez.
- Bugün/dün/7 gün/30 gün/özel dönem; Türkiye saat dilimi. Günlük tekil
  tarayıcılar, görüntülemeler ve rezervasyon ekranı açılışları. Kesin kişi veya
  satış olarak yorumlanmaz; farklı günlerin ziyaretçi sayıları toplanır.
- Rezervasyon, bekleyen/onaylı/iptal sayıları; iptaller hariç rezervasyon
  toplamı ve kaynakta bildirilen tahsilat. TRY/EUR/USD/GBP tutarları çevrilmez.
- Günlük ve kanal tabloları, en fazla 500 rezervasyon ayrıntısı, kaynaklar,
  sayfalar ve günlük CSV indirme. Eksik veri çizgi/bilinmiyor olarak gösterilir.
- İsteğe bağlı CSV aktarımı: şablon sütunları zorunlu, en fazla 500 kayıt;
  sadece izin verilen alanlar gönderilir. Aynı HR rezervasyon numarası
  yinelenmez; daha eski güncellemeler geçerli son durumu ezmez.

## HotelRunner engeli

Hesabın Kanallar → Özel Uygulamalar ekranında henüz uygulama yoktu.
Muhasebe uygulaması oluşturma seçimi, uygun ve aktif üyelik gerektiği
uyarısıyla `/admin/plans?feature=dev_tools` sayfasına yönlendirdi.
Ücretli paket satın alınmadı, sözleşme veya abonelik başlatılmadı.
Bu nedenle otomatik rezervasyon/finans senkronizasyonu aktif değildir.

GET-only API bağdaştırıcısı hazırlanmıştır. Yetkilendirme açıldığında
HOTELRUNNER_TOKEN ve HOTELRUNNER_HR_ID yalnızca Worker secrets olarak eklenir.
Kod sabit resmi hosta gider; anahtar içeren URL ve rezervasyon payload'ları
loglanmaz. Acknowledge, rezervasyon oluşturma, durum değiştirme, kontenjan
veya ödeme çağrısı yapılmaz. İlk bağlayıcı son 30 günde oluşturulan kayıtları
sayfalayarak alır. Geçmiş kapsamı ve 30 günden eski kayıtların değişiklikleri
gerçek hesap yanıtlarıyla ayrıca doğrulanmadan eksiksiz senkronizasyon
iddia edilmemelidir. Website kanal kodu teyit edilmeden tüm kanalların
satışı siteden gelen satış olarak gösterilmez.

## Güvenlik ve veri anlamı

- Rapor yanıtları no-store; kesin CORS origin; token URL'de veya tarayıcı
  kalıcı depolarında tutulmaz. Oturum 1 saat, sunucuda yalnız token hash'i.
  Çıkışla iptal edilir; parola değişikliği eski oturumları da geçersiz kılar.
- Giriş ve veri alma istekleri sınırlıdır. SQL parametrelidir. CSV formül
  başlangıçları indirmede kaçışlanır. UI verileri textContent ile çizilir.
- Kart, kimlik, misafir adı, e-posta, telefon veya adres toplanmaz. Rezervasyon
  referansı, tarih, durum, kanal, tutar ve kişi/oda sayıları saklanır.
- Ziyaret ölçümü varsayılan kapalıdır; yalnız açık rızadan sonra çalışır.
  Günlük rastgele cihaz kodu HMAC ile saklanır; tam IP rapor deposunda yoktur.
  IP tabanlı rate-limit anahtarları da hash'lenir. Kaynak URL'nin sorguları,
  hash'i ve tam referrer gönderilmez. DNT/GPC tercihleri korunur.
- Ölçüm olayları 90 gün saklanır. Saklama veya ölçüm başlangıcından önceki
  günler bilinmiyor gösterilir. Geriye dönük ziyaretçi sayısı üretilemez.
- Rezervasyon toplamı tahsilat değildir. Tahsilat, seçili dönemde alınan
  rezervasyonların kaynakta bildirilen ödemeleridir; ödeme gününe göre nakit
  akışı veya banka mutabakatı değildir. İade/komisyon muhasebesi kurulmadı.

## Kurulum ve yayınlama

`reporting/wrangler.jsonc` yalnız herkese açık dağıtım bilgileri içerir.
DB binding `DB`; schema `reporting/migrations/`. API origin ve etkinlik
`reporting/deployment.json` üzerinden yönetilir. `build-seo.mjs` bununla
public config, açık CSP origin'i ve önbellek sürümünü oluşturur.

Sunucu için REPORT_SECRET rastgele bir Worker secret olmalıdır. Yönetici
ADMIN_PASSWORD değerini Cloudflare secret ekranında kendisi belirler
(en az 16 karakter); hiçbir parola sohbette istenmez veya repoya yazılmaz.
Alternatif olarak ADMIN_PASSWORD_HASH/ADMIN_PASSWORD_SALT desteklenir.
İç kurulum anahtarları ve CLI bağımlılıkları .report-runtime içinde gitignore
ile dışarıda tutulur. Cloudflare OAuth Windows güvenli kasasını kullanır.

Otomatik HotelRunner bağlantısı kurulursa Worker 15 dakikada bir GET ile
günceller. Bu, bir Codex hatırlatıcısı değildir. API kapalıyken zamanlayıcı
yalnız süresi dolmuş oturumları, rate limitlerini ve eski ölçüm verisini temizler.

Kontroller:
`node --test scripts/reporting.test.mjs`
`node scripts/validate-site.mjs`
Önceki admin/HotelRunner/güvenlik/SEO testleri de yayın öncesi çalıştırılır.

Kaynak: https://developers.hotelrunner.com/custom-apps/rest-api/reservations/
Cloudflare: https://developers.cloudflare.com/d1/get-started/

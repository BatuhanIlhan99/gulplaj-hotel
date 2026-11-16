# Gülplaj Hotel SEO uygulaması ve devam planı

16 Kasım 2026 · https://www.gulplajhotel.com/

## Amaç ve kapsam

Erdek'te otel arayan kişilerin oteli bulmasını, oda ve ulaşım bilgilerine
ulaşmasını ve rezervasyona geçmesini kolaylaştırmak. Uygulama; taranabilir
içerik, yerel işletme bilgileri, arama niyetine uygun sayfalar ve sürdürülebilir
yayın kontrollerini kapsar. Trafik veya sıralama sonucu henüz ölçülmedi.

## Başlangıç kaydı

SEO-BASELINE.json, değişiklik öncesi canlı HTTP ölçümüdür. Ana sayfa 200
dönüyordu; canonical ve Hotel JSON-LD yoktu. robots.txt, sitemap.xml ve dört
yeni sayfanın adresi 404 dönüyordu. Admin noindex taşıyordu; rezervasyonun
gömülü arama belgesinde noindex yoktu. Tek istek süreleri Core Web Vitals
ölçümü değildir. İndeks kapsamı veya mevcut sıralama için kanıt sayılmaz.

Kullanıcıda Google İşletme Profili yönetici erişimi var. Search Console henüz
kurulu değil. Google oturumu açık olmadığı için doğrulama kullanıcı girişine
bağlı; erişim olmadan doğrulama veya sitemap gönderimi tamamlandı denmemeli.

## Uygulanan site yapısı

| Sayfa | Ana arama niyeti | İçerik ve sonraki adım |
| --- | --- | --- |
| `/` | Gülplaj Hotel, Gülplaj Otel, Erdek denize sıfır otel | Oteli tanıma, fotoğraflar, iletişim ve rezervasyon |
| `/odalar/` | Gülplaj Hotel odaları, Erdek deniz manzaralı oda | Gerçek oda/banyo fotoğrafları, olanaklar ve oda seçimi |
| `/konum-ulasim/` | Gülplaj Hotel nerede, adres, telefon, ulaşım | Tutarlı adres/telefon, harita ve varış planı |
| `/erdek-gezi-rehberi/` | Erdek gezi rehberi, Kapıdağ gezi planı | Özgün gezi notları, resmî kaynaklar ve konaklama bağlantıları |
| `/sik-sorulan-sorular/` | Gülplaj Hotel giriş saati, rezervasyon soruları | Güncel admin soruları ve konaklama öncesi bilgiler |

Bu liste arama hacmi veya sıralama raporu değildir. Gerçek sorgu fırsatları
Search Console verisi geldikten sonra değerlendirilecek. Yakın anlamlı her
kelime için ayrı, kopya sayfa oluşturulmadı.

## Teknik uygulama

- Her indekslenebilir sayfada tek H1, kendisini gösteren HTTPS canonical,
  benzersiz title/description ve Türkçe dil tanımı var.
- Open Graph ve Twitter Card alanları gerçek fotoğraf, boyut ve açıklamalarla
  üretilir. Uydurma sosyal hesap veya logo eklenmedi.
- Hotel, WebSite, WebPage ve detay sayfalarında BreadcrumbList JSON-LD var.
  Telefon, adres, giriş/çıkış saatleri ve fotoğraflar mevcut doğrulanmış
  içerikten gelir. Oda sayısı, yıldız, fiyat veya stok iddiası eklenmedi.
- İşletmenin kendi sitesindeki Google yorumları AggregateRating/Review
  olarak işaretlenmedi. Otel için yıldızlı sonuç veya FAQ zengin sonucu
  vaat edilmedi. Görünür gerçek yorum bölümü korundu.
- XML sitemap yalnızca beş canonical sayfayı içerir. Görsel uzantısı gerçek,
  mevcut otel fotoğraflarına işaret eder. Tarih güncel görünsün diye her
  yayında yapay lastmod yazılmaz.
- robots.txt siteyi ve gerekli varlıkları taramaya açık tutar, sitemap'i
  bildirir. Admin ve gömülü arama belgesi noindex taşır; bunların noindex
  yönergelerini okuyabilmesi için tarayıcı robots engeliyle durdurulmaz.
- Gerçek 404 belgesi, yardımcı bağlantılar ve noindex eklendi. Ana sayfaya
  otomatik yönlendirerek hatalı URL'ler 200 gibi gösterilmez.
- Ana sayfanın düzenlenebilir başlıkları, tanıtımları, telefonu, adresi,
  saatleri ve soruları yayın sırasında HTML'e işlenir. Google veya paylaşım
  botlarının içerik için JavaScript çalıştırmasını beklemek gerekmez.
- JSON-LD içeriği HTML bağlamına güvenle kaçırılır; önceki CSP gevşetilmez.
  Admin kimlik ve dosya yükleme korumaları korunur.
- Yeni sayfalar JavaScript gerektirmez. Görsellerin boyutları ve responsive
  kaynakları korunur; ilk görsel önceliklidir, alttaki görseller lazy yüklenir.
  Ana sayfanın rezervasyon iframe'ine native lazy loading eklendi.

## Yerel işletme tutarlılığı

Referans ad: Gülplaj Hotel; alternatif yazım: Gülplaj Otel.
Telefon: 0266 835 23 07 / +90 266 835 23 07.
Adres: Sahil Mahallesi, Şehit Mehmet Sokak, 10500 Erdek, Balıkesir.
Site: https://www.gulplajhotel.com/

Google İşletme Profili'nde yapılacak kontrol:

1. Mevcut işletme profilini koru; ikinci bir profil açma.
2. Kullanıcının yönetici hesabında işletmenin web sitesi alanını bu HTTPS
   adresiyle karşılaştır. Yanlışsa yalnızca ilgili alanı düzelt.
3. Adres, telefon ve harita işaretini tesisin gerçek bilgileriyle karşılaştır.
   Dizinlerdeki çelişkili ikinci telefon, kapı numarası, yıldız veya havuz
   bilgilerini doğrulamadan kopyalama.
4. Güncel, gerçek oda/sahil/avlu fotoğrafları ve doğru hizmet bilgileri kullan.
   Kahvaltı, otopark, evcil hayvan, erişilebilirlik ve transfer gibi bilgileri
   kullanıcı teyidi olmadan değiştirme.
5. Yorumlara otel adına yanıt verme ve üçüncü taraflara düzeltme mesajı gönderme
   ancak kullanıcı ayrıca iletişim kurmamızı isterse yapılır.

Önceki araştırmada bir üçüncü taraf dizin hotelgulplaj.com gösteriyordu.
Bu bir takip maddesidir; eski alan adının sahipliği veya yönlendirme yetkisi
varsayılmadı. Google profilinin şu an yanlış olduğu sonucuna varılmadı.

## Search Console bağlantısı

1. Gülplaj Hotel'i yöneten Google hesabıyla Search Console'a giriş yap.
2. En az `https://www.gulplajhotel.com/` için URL ön eki mülkünü doğrula.
   HTML dosyası/meta etiketi yönteminde yalnızca Google'ın verdiği gerçek
   doğrulama değeri yayımlanır; örnek değer kullanılmaz.
3. Tüm alt alan adlarını kapsayan `gulplajhotel.com` Domain mülkü tercih
   edilirse GoDaddy'ye Google'ın verdiği DNS TXT kaydını ekle. Mevcut A,
   CNAME, NS veya e-posta kayıtlarını değiştirme.
4. `https://www.gulplajhotel.com/sitemap.xml` dosyasını gönder.
5. Ana sayfayı ve dört detay sayfasını URL Denetleme'de kontrol et; erişim,
   Google'ın seçtiği canonical ve indeksleme durumunu incele. Gerekiyorsa
   mevcut kota dahilinde indeksleme talep et.
6. Site haritasının bulunması veya URL'nin gönderilmesi indekslenme ve
   sıralama garantisi değildir. Google'ın raporuna göre takip et.

Google girişi, şifre ve iki adımlı doğrulama kullanıcı tarafından yapılır.
Search Console'a giriş yapılmadan gönderim/takip tamamlanmış sayılmaz.

## Ölçüm tanımları

| Ölçüm | Kaynak / yöntem | Karar |
| --- | --- | --- |
| İndekslenen hedef sayfalar | Search Console sayfa indeksleme + URL denetimi | Hedef beş sayfanın erişim/canonical sorunlarını çöz |
| Organik tıklama ve gösterim | Search Console performans, Türkiye, web arama | 28 günlük dönemleri karşılaştır |
| Marka ve marka dışı sorgular | Görünen sorgularda gulplaj/gülplaj/gül plaj varyantları; kalanlar ayrı | Marka bilinirliğiyle keşif trafiğini ayır; gizlenen sorguları unutma |
| Sayfa CTR'si | Aynı sayfa ve benzer sorgu/konumda tıklama ÷ gösterim | Başlık/açıklama ihtiyacını değerlendir |
| Rezervasyona geçiş ve telefon tıklaması | Uygun ölçüm sistemi bağlanırsa ayrı olaylar | Bunları tamamlanmış rezervasyon veya arama sayma |
| Tamamlanan satış | Doğrulanmış rezervasyon kayıtları; ileride ödeme entegrasyonu | Tıklamayla satışın farklı olduğunu koru |
| Mobil performans | PageSpeed Insights ve varsa gerçek kullanıcı CWV raporu | Laboratuvar ölçümüyle alan verisini ayır |

Başlangıçta Search Console metrikleri **bilinmiyor**; sıfır diye yazılmaz.
Analytics/izleme kimliği verilmedi, çerez veya reklam izleyicisi eklenmedi.
İleride kullanılacak analitik sistem için izin tercihleri ve veri akışı ayrıca
ele alınmalı. Şu an kurulmamış olaylar veya satış raporlaması çalışıyor denmez.

## İlk 30 / 60 / 90 gün

**0–30 gün:** Google mülkünü doğrulama, site haritasını gönderme, hedef
sayfaların indeks/canonical kontrolü, İşletme Profili tutarlılığı ve ilk
performans kayıtları. İlk veride marka sorgularını ayrı değerlendir.

**31–60 gün:** Benzer 28 günlük dönemleri karşılaştır; sorgu ve sayfa bazında
gösterim var/tıklama düşük alanları incele. Oda, ulaşım ve rehber içeriklerini
gerçek misafir sorularıyla geliştir. Tesis sahibinden oda düzeni ve paket
bilgileri doğrulanırsa sayfaları ayrıntılandır. Belirsiz hizmet ekleme.

**61–90 gün:** Anlamlı sorgu taleplerine göre yeni, özgün rehber içeriği
değerlendir. Sonuçları mevsimsellik, konum ve sayfa bazında yorumla.
Güvenilir yerel kaynaklardaki yanlış işletme bilgilerini kullanıcı onayıyla
düzelt; satın alınan backlink veya sahte yorum uygulama. Rezervasyon
altyapısı hazır olduğunda dönüşüm takibini gerçek onay kayıtlarıyla bağla.

## İçerik ve yayın bakımı

- Admin kaynak verisi: `dist/site-content.json`.
- Yeni rehberlerin metin kaynağı: `content/seo-pages.json`. Bu rehber metinleri
  henüz admin panelinde ayrı alanlar olarak sunulmuyor; kaynak dosyadan düzenlenir.
- Üretim: galeri → doğrulanmış yorumlar → `scripts/build-seo.mjs` → doğrulamalar.
- Üretilen detay HTML, sitemap ve metadata'yı elle değiştirmek yerine kaynağı
  güncelle. Admin yayınlarında güncel kaynaklardan tekrar oluşturulur.
- Yeni sayfa eklerken özgün niyet, title, açıklama, tek H1, iç bağlantılar,
  doğru Hotel verisi, canonical ve sitemap üyeliği kontrol edilir.
- Fotoğraf kaldırma, telefon/saat değişikliği veya FAQ değişikliğinden sonra
  hem kaynak HTML hem yapılandırılmış verinin güncelliğini test et.

## Doğrulama sınırları

Yerel otomatik testler HTML, bağlantı, JSON sözdizimi ve proje kurallarını
denetler; Google Rich Results Test, indeksleme veya gerçek CWV sonucunun
yerine geçmez. Search Console erişimi ve yeterli gerçek veri olmadan sıralama
artışı raporlanamaz. HTTPS ve canonical temeli kurulması sıralama garantisi değildir.

## Başvurulan resmî kaynaklar

- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/appearance/structured-data/local-business
- https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- https://schema.org/Hotel
- https://balikesir.ktb.gov.tr/TR-65868/erdek.html
- https://www.kulturportali.gov.tr/turkiye/balikesir/gezilecekyer/yukari-yapici-koyu-kirazli-manastiri

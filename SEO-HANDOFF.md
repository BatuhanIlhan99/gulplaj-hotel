# SEO çalışma notu — 15 Kasım 2026

16 Kasım güncellemesi: Çalışma yeniden başladı. Aşağıdaki notlar ilk inceleme
kaydını korur. Güncel uygulama ve takip planı SEO-PLAN.md içindedir.

Kullanıcı ayrıntılı ve profesyonel SEO kurulumu istedi. İlk incelemeden sonra
“sonra devam edicez çıkmam lazım” diyerek çalışmayı durdurdu. Bu not dışında
SEO için kod/içerik değişikliği yapılmadı, commit veya yayın yapılmadı.
Son canlı sürüm: 8e162b19041038e90b2495d6fc3a45ee6cd2ad46 (güvenlik güncellemesi).

## İlk bulgular

- Mevcut tek sayfada başlık ve açıklama var. İncelenen başlıkta canonical,
  Open Graph, Twitter Card ve Hotel JSON-LD bulunmuyor.
- Dosya taramasında robots.txt ve sitemap.xml bulunmadı; canlı HTTP durumları
  SEO incelemesi sırasında henüz ayrıca ölçülmedi.
- Admin metinleri istemcide content-renderer.js ile uygulanıyor. Yayın sırasında
  materialize-gallery.mjs yalnızca galeri/öne çıkan fotoğrafları, diğer script
  yorumları HTML'e yazar. Metin ve meta açıklamasının da statik HTML'de güncel
  üretilmesi gerekir; kullanıcı JS kapalıyken eski içerik görmemeli.
- Ana sayfa ve admin CSP yerel scriptlerle sınırlı; güvenlik testleri şu an tüm
  inline script içeriklerini reddediyor. JSON-LD eklenirse yalnızca doğru tipteki
  veri bloklarına kontrollü istisna, JSON.parse ve güvenli `<` kaçışları gerekir.
  Çalıştırılabilir inline scriptlere izin verilmemeli; CSP gevşetilmemeli.
- Doğrulanmış mevcut NAP: 0266 835 23 07, Sahil Mahallesi, Şehit Mehmet Sokak,
  10500 Erdek/Balıkesir. Google Travel sonucu da bu adres/telefonu destekliyor.
  Diğer listelerde adres/telefon/yıldız/olanak çelişkileri var; kapı numarası,
  yıldız, havuz, fiyat, evcil hayvan kabulü gibi bilgiler varsayılmamalı.
- Bir üçüncü taraf rehber eski hotelgulplaj.com alan adını gösteriyor. İşletme
  profili ve dizinlerde güncel alan adı/NAP kontrolü için takip maddesi;
  henüz bu hesaplara girilmedi veya bilgi değiştirilmedi.
- site:gulplajhotel.com araması, bu taramada doğrulanmış sonuç sağlamadı.
  Bu, indekslenmediğinin kanıtı değildir. Search Console ile kontrol edilmeli.

## Bekleyen kullanıcı sorusu

Google Search Console ve Google İşletme Profili yönetici erişimi olup olmadığı
asenkron soruldu; henüz cevap alınmadı. Şifre, API anahtarı veya OTP isteme.
Erişim/doğrulama olmadan Search Console kuruldu, sitemap gönderildi veya
Google performansı ölçülüyor denmemeli.

## Devamda yapılacaklar

1. Git durumunu ve ana dalı yeniden kontrol et; kullanıcı değişikliklerini koru.
2. Canlı taranabilirlik, yönlendirmeler, HTTP durumları, kaynak HTML, başlıklar,
   görsel boyutları ve mobil performans için ölçülebilir başlangıç kaydı oluştur.
3. Canonical, benzersiz title/description, paylaşım etiketleri, uygun robots
   yönergeleri, XML sitemap ve gerçek 404 sayfasını kur. Admin noindex korunmalı;
   robots engeli ile noindex taramasını istemeden çeliştirme.
4. Admin içeriğinden statik metin/meta üretimini yayına bağla. Tüm değişken metni
   HTML/JSON bağlamına göre kaçır. SEO verileri admin yayınlarıyla güncellensin.
5. Doğrulanmış Hotel/WebSite/WebPage bilgilerini yapılandır; kendi işletmesine
   ait Google yorumlarını yıldız kazanma amacıyla AggregateRating işaretleme.
   Otel için FAQ zengin sonucu veya garanti sıralama vaat etme.
6. Arama niyetine göre özgün oda, ulaşım ve Erdek rehberi içeriği değerlendir.
   Sırf anahtar kelime çoğaltmak için kopya/ince sayfa üretme; gerçek olmayan
   olanak, mesafe, fiyat veya rezervasyon/ödeme taahhüdü yayımlama.
7. İç bağlantılar, görsel alt metinleri, boyutlar ve yükleme önceliklerini iyileştir.
   Önceki gerçek fotoğraf kalitesi, rezervasyon akışı ve güvenlik korunmalı.
8. SEO regresyon kontrollerini CI'a ekle, mevcut 21 testi çalıştır, GitHub Pages
   üzerinden yayımla ve canlı canonical/sitemap/HTML/HTTP sonuçlarını doğrula.
9. Gerçek verilere dayalı 30/60/90 günlük içerik ve ölçüm planı hazırla.
   Analytics veya reklam izleme kodlarını kimlik/izin/onay olmadan etkinleştirme.

## Kaynaklar

- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/appearance/structured-data/local-business
- https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- https://schema.org/Hotel
- https://www.google.com/travel/hotels/entity/ChoIx7iCrPPLl9yiARoNL2cvMTFmeTFkY3ZrcBAB

Güncel FAQ dokümantasyon bağlantısı inceleme sırasında updates sayfasına yönlendi;
devamda geçerli özellik durumunu tekrar doğrula.

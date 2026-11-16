# Site içi HotelRunner rezervasyonu — 16 Kasım 2026

Kullanıcı, otel onaylı talep formu yerine HotelRunner kontenjanından düşen,
anında rezervasyon akışını seçti. Gelecek sezon tarifeleri henüz hazır
olmadığından birçok tarih kapalı. Fiyat, kontenjan veya satış tarihleri açılmadı.

## Çalışma biçimi

Ana sayfadaki mevcut, tesise özel HotelRunner arama modülü korunur. Modülün
desteklediği `_self` hedefi, resmi motorun ürettiği tarih/misafir URL'sini aynı
iframe içinde açar. Üst pencere ve yeni sekme yönlendirmesi engellenmiştir.
URL veya fiyat parametreleri yeniden kurgulanmaz; resmi modül üretir.

Oda araması başladığında mevcut iframe yeniden oluşturulmadan, native dialog
içinde ekran boyuna genişler. Böylece tarihler korunur; mobilde kişi menüsü ve
Tamam düğmesi ekranın içine sığar. Klavye/odak davranışı native dialog ile
korunur. Aramaya dön veya Escape, yerel tarih seçimine geri getirir.

`/rezervasyon/` ayrıca aynı alan adında tam sayfa bir görünüm sağlar. Bu belge
Google için noindex taşır; bilgi sayfaları ve sitemap beş canonical sayfa olarak
korunur. HTML ve telefon bilgileri build-seo adımında güncel kaynaklardan üretilir.

Oda seçimi, fiyat doğrulaması, müsaitlik kontrolü, misafir bilgileri, kayıt ve
nihai onay resmi HotelRunner motorunda yürür. Konuk üst adres çubuğunda otelin
alan adında kalır. Bu uygulama ayrı bir stok veya kendi rezervasyon veritabanı
oluşturmaz. Kayıt başarısı/numarası veya stok düşümü istemcide taklit edilmez.

## Ödeme ve hesapta görülen durum

HotelRunner hesabında, misafir ve tesis için Cash, Banka Transferi ve Mail Order
yöntemleri aktif görüldü. Hiçbiri değiştirilmedi. iyzico merchant kurulumu ve
kendi ödeme sunucusu henüz aktif değil; `paymentReady` false olarak korunur.

Misafir bilgileri veya kart alanları kendi JavaScript'imiz tarafından okunmaz,
kaydedilmez veya GitHub'a gönderilmez. Resmi motorun ödeme seçenekleri tesisin
mevcut HotelRunner ayarlarına bağlıdır; iyzico tahsilatı etkinleştirildi denmez.

## Güvenlik sınırları

- Üst sayfanın CSP frame-src listesine yalnızca gerçek tesis host'u eklenir.
- Misafir iframe'leri `allow-scripts allow-same-origin allow-forms` kullanır;
  üst pencere yönlendirme ve pop-up izinleri verilmez.
- Yerel arama mesajları yalnızca beklenen origin ve iframe kaynağından kabul
  edilir; rezervasyon görünümü açıldıktan sonra eski mesajlar yüksekliği bozmaz.
- Yüklenen iframe, başarılı rezervasyon sayılmaz. Son teyit resmi motorun onayı
  ve rezervasyon numarasıdır.
- Yönetim önizlemesi üçüncü taraf motorunu yüklemez. Gizli API anahtarı eklenmedi.
- Banka 3-D Secure gibi gelecekteki ödeme adımları ayrıca tasarlanıp test edilmeli;
  şu anki kısıtlı iframe izinleriyle iyzico çalışıyor varsayılmamalı.

## Kontroller ve kalan kabul testi

Yerel tarayıcı testinde arama, resmi oda sonuçlarına geçti ve üst sayfa URL'si
değişmedi. Fiyatların kapalı olmasıyla uyumlu şekilde uygun oda bulunamadı.
390 px mobil görünümde misafir sayıları ve Tamam düğmesi kesilmeden görüntülendi.
Telefon ve ayrı site içi rezervasyon görünümü kurtarma seçenekleridir.

Fiyatlar açıldığında kullanıcıyla tek bir gerçek/tanımlı test konaklaması seçilmeli:

1. Web kanalına açık tarih, fiyat planı, oda kapasitesi, yemek ve iptal koşulları.
2. Otelde ödeme ile onay davranışı, gerçekten Onaylandı statüsü ve referans numarası.
3. Tesis/misafir e-postası ve aynı oda stokunun HotelRunner'da azalması.
4. İptal sonrası stok iadesi ve acente kanallarına dağıtım.
5. Mobil son adım ve varsa kart garantisi gereksinimi.

Fiyatlar kapalı olduğu için bu kayıt/stok/e-posta kabul testi henüz yapılamadı.
Gerçek rezervasyon, ödeme, iptal veya stok değişikliği oluşturulmadı.

## Sonraki geliştirme öncelikleri

1. Gelecek sezon tarifeleri, oda kapasitesi ve iptal kurallarını netleştirmek.
2. Satışa açık tarihle uçtan uca rezervasyon kabul testini tamamlamak.
3. iyzico onayından sonra güvenli ödeme sunucusu ve HotelRunner bağlantısını
   tasarlamak; ödeme sonuçları, tekrar eden bildirimler ve stok tutarlılığını sınamak.
4. Tamamlanan rezervasyonu yalnızca tıklamadan ayıran dönüşüm raporlaması kurmak.
5. Oda tiplerini gerçek yatak/kapasite bilgileriyle zenginleştirmek; Search Console
   verisi biriktikçe içerik ve ikinci dil ihtiyacını değerlendirmek.

Resmi kaynaklar:
- https://support.hotelrunner.com/tr/arama-modulu-ekleme/
- https://support.hotelrunner.com/tr/otelde-odeme-nakit-pos-ile-odeme-nasil-alinir/
- https://support.hotelrunner.com/tr/rezervasyonlar-konfirme/

Bakım: `scripts/build-seo.mjs`, site doğrulaması ve tüm testler yayın akışında
çalışır. `/rezervasyon/index.html` yerine `scripts/booking-page.mjs` düzenlenir.

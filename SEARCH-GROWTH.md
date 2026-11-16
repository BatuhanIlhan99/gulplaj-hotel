# Erdek ve Gülplaj aramaları için organik görünürlük çalışması

16 Kasım 2026. Önceki teknik SEO kurulumunun üzerine yapılan içerik aşaması.
Bu çalışma bir Google Ads kampanyası değildir; reklam harcaması başlatılmadı.

## Hedef ve araştırma sınırı

Kullanıcının verdiği “Erdek otelleri”, “Gülplaj Otel” ve “Erdek konaklama”
ifadeleri farklı arama niyetleri olarak ele alındı. Kamuya açık sonuçlarda
geniş otel sorguları için acente/listeleme sayfaları ve yerel otel siteleri
görüldü. Bu araştırma Google konum raporu, anahtar kelime hacmi veya kişiye
özel sıralama ölçümü değildir. Rakip metinleri kopyalanmadı.

Kelime–sayfa eşleştirmesi `content/search-intent.json` içindedir. Marka ve
otel seçimi ana sayfada; konaklama kararı ayrı rehberde; oda, konum, çevre
gezisi ve destek soruları mevcut ilgili sayfalarda karşılanır. Benzer her
kelime için birbirinin kopyası sayfalar oluşturulmadı.

## Site üzerinde uygulama

- Ana sayfanın görünür ana başlığı Erdek ve denize sıfır konumunu açıklar.
  Fotoğraflar, mevcut tasarım ve site içi rezervasyon akışı korunur.
- Kısa tanıtım, işletme açıklaması ve arama açıklaması doğrulanmış otel
  özellikleriyle güncellendi. Gerçek olmayan fiyat, yıldız, havuz, otopark,
  ücretsiz hizmet veya başarı iddiası eklenmedi.
- `/erdek-konaklama/` özgün rehberi; otel seçimi, sahil/manzara, oda düzeni,
  misafir sayısı, yemek paketi ve rezervasyon adımlarını işler. Gülplaj Otel
  adı içerikte doğal biçimde geçer. İçerik mevcut gezi rehberinin kopyası değildir.
- Ana sayfa ve detay sayfaları yeni rehbere gerçek, takip edilebilir HTML
  bağlantıları verir. Rehber, oda/ulaşım/diğer bilgiler ve rezervasyona bağlanır.
- Canonical, paylaşım alanları, Hotel/WebPage verileri, breadcrumb ve görsel
  kaynakları mevcut üretim akışıyla oluşturulur. Sitemap altı bilgi sayfasına
  genişler. İşlemsel `/rezervasyon/` noindex olarak kalır.
- Admin içerik değişiklikleri statik HTML ve SEO verilerine yansımaya devam eder.

## Dürüst misafir değerlendirmelerine erişim

Google İşletme Profili'nin resmi “Yorum isteme” ekranından, bu tesise ait
`https://g.page/r/CUecgDVfXriiEBM/review` bağlantısı doğrulandı. Mevcut yorum
bölümüne tüm konaklayan misafirler için nötr bir değerlendirme çağrısı eklendi.
Puan seçimi yapılmaz, olumlu yorum şartı veya ödül sunulmaz. Misafir kendi
isteğiyle Google'da değerlendirir. Hiç kimseye mesaj veya e-posta gönderilmedi.
Önceki seçilmiş yorumların tarih, kaynak ve kısa alıntı açıklamaları korunur.

## Google ve yerel işletme sınırları

Mevcut Search Console mülkü kullanılır. Yeni sitemap canlıya alındıktan sonra
Google'a gönderilir; gönderim ve keşfedilen sayfa sayısı gerçek panelden
doğrulanır. Yeni rehber için URL denetimi yapılır ve uygun olduğunda bir kez
indeksleme talep edilir. Daha önce gönderilen ana sayfa için aynı isteği
tekrarlamanın öncelik kazandırdığı varsayılmaz.

İşletme Profili'ndeki site adresi güncellemesi son gözlemde Google incelemesinde.
Talep yinelenmez. “Turistik Yer” birincil, “Otel” ek kategorisi kullanıcı
isteğiyle korunur. Üçüncü kişilere mesaj, yorum cevabı veya dizin düzeltme
talebi gönderilmedi; böyle bir iletişim ayrıca açık talimat gerektirir.

## Sonuçları nasıl değerlendireceğiz?

1. İlk kontrol: altı bilgi sayfasının HTTP/canonical ve indekslenme durumu.
2. Veri oluşunca: Türkiye/web aramasında son 28 günü önceki 28 günle karşılaştır.
3. Marka sorgularını (gülplaj/gulplaj/gül plaj varyantları) ve marka dışı
   sorguları ayrı incele. Görünmeyen sorgular nedeniyle sorgu toplamları,
   genel performans toplamıyla aynı olmak zorunda değildir.
4. “Erdek otelleri” için ana sayfanın; “Erdek konaklama” için rehberin
   gösterim, tıklama, CTR ve konumunu sorgu+sayfa bazında değerlendir.
5. Görünürlük kazanıp tıklama almayan sayfalarda başlık/açıklama ve arama
   niyetini gözden geçir. Verisiz durumda keyfi olarak metinleri değiştirme.
6. Rezervasyon ekranına geçişi tamamlanmış satış olarak sayma. Gerçek satış
   sonucu HotelRunner kaydıyla doğrulanmalıdır. Sezon fiyatları henüz kapalı.

İlk sıra, belirli trafik artışı veya kesin bir süre vaat edilmez. Google'ın
yerel sonuçlarında alaka, mesafe ve bilinirlik birlikte rol oynar; sitedeki
metin değişikliği tek başına bütün aramaların sonucunu belirlemez.

## Devam içerikleri

Gerçek misafir soruları ve Search Console verisiyle oda/yatak kapasitesi,
ulaşım ayrıntıları ve sezon paketleri geliştirilmeli. İşletme sahibinden
doğrulanmış otel hikâyesi, özgün fotoğraflar ve hizmet ayrıntıları alınabilir.
Fiyatlar belirlenmeden güncel fiyat tablosu veya paket vaadi yayımlanmamalı.

## Resmî başvuru kaynakları

- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://support.google.com/business/answer/7091?hl=tr

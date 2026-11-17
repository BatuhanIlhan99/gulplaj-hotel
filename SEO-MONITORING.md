# Yayın sonrası SEO kontrolü

17 Kasım 2026.

## Google'da gözlenen durum

Search Console performans ekranında seçili dönem üç ay olsa da grafikte
yalnızca 15 Kasım 2026 bulunuyordu: 0 tıklama, 0 gösterim ve sorgu satırı
yoktu. Bu, 16–17 Kasım'da yapılan düzenlemelerin sonrasını kapsamıyor.
Üç aylık gerçek trafik sonucu veya SEO başarısızlığı olarak yorumlanamaz.
Ekrandaki ortalama konum 0, ölçülmüş bir Google sırası değildir.

Dizin kapsamı raporu hâlâ veri işlediğini belirtiyor. URL denetiminde ana
sayfa “URL Google'da mevcut” ve “Sayfa dizine eklendi” olarak göründü.
Ayrı canlı testte 17 Kasım 2026 saat 14.35'te “URL, Google tarafından
kullanılabilir” ve “Sayfa dizine eklenebilir” sonucu alındı. Bu iki sonuç
yalnızca ana sayfa için geçerlidir; yedi sayfanın tamamının indekslendiği
veya belirli bir sorguda üst sırada yer aldığı anlamına gelmez.

Fotoğraf sayfası için bugün daha önce kabul edilen dizine ekleme talebi
tekrarlanmadı; sitemap yeniden gönderilmedi.

## Canlı denetim

`scripts/audit-live-seo.mjs` yayındaki siteyi kimlik bilgisi veya çerez
kullanmadan okur. Yerel bilgi sayfası listesiyle yayımlanmış adresleri
karşılaştırır; otel bilgilerini yayındaki site-content.json'dan alır.

Kontroller HTTP durumları, canonical, tekil başlık/açıklama/H1,
yanlışlıkla noindex verilmemesi, Hotel ve WebPage verileri, iletişim ve
konaklama saatlerinin tutarlılığı, fotoğraf sayıları, sitemap, robots,
yönetim/rezervasyon sayfalarının noindex durumu ve gerçek 404 yanıtını kapsar.
HTTP, çıplak alan adı ve eski GitHub adresinin HTTPS www adresine dönüşü de
kontrol edilir. Rezervasyon veya ödeme işlemi oluşturulmaz.

Çalıştırma (proje klasöründen, Node 22+):

```
node scripts/audit-live-seo.mjs SEO-LIVE-AUDIT-2026-11-17.json
node --test scripts/live-seo-audit.test.mjs
```

Güncel canlı denetim: 98 başarılı, 0 başarısız kontrol.
Tanılama testleri: geçerli yayın ve bozuk sunucu verisinin güvenle raporlanması
için iki çevrimdışı test geçti. Kontrol hata bulursa sıfırdan farklı çıkış
kodu üretir. Tarihli JSON raporu kanıttır; arka planda çalışan bir izleme
hizmeti veya zamanlanmış görev kurulmamıştır.

## Bir sonraki karar için koşullar

1. Performans raporu SEO düzenlemelerinden sonraki tarihleri kapsamalı.
2. Önce sayfaların tek tek indeks durumunu, ardından marka ve marka dışı
   sorguları açılış sayfasıyla birlikte inceleyin.
3. Yeterli veri oluşunca karşılaştırılabilir 28 günlük dönemleri kullanın.
   Kısmi dönemleri tam dönemle karşılaştırıp artış/azalış ilan etmeyin.
4. Google'ın tarama beklemesi teknik hata kanıtı değildir. Yalnızca ölçülmüş
   sorun veya doğrulanmış yeni otel bilgisi varsa içerik/başlık değiştirin.
5. Rezervasyon ekranına geçiş, kesin rezervasyon veya ödeme olarak sayılmaz.

Bugünkü denetim sonucunda yayımdaki içerikte değişiklik gerektiren bir sorun
bulunmadı. Yeni sayfa ekleme, reklam açma veya Google işletme kategorisi
değiştirme yapılmadı.

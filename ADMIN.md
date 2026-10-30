# Gülplaj Hotel yönetim paneli

Adres: https://www.gulplajhotel.com/admin/

Panel mevcut GitHub Pages yayınına eklenmiştir; hosting ve alan adı değişmez.

## Kullanım

1. Site içerikleri, fotoğraflar, iletişim veya sık sorulan sorular bölümünü açın.
2. Düzenleyin ve **Önizle** ile kontrol edin. Taslak yalnızca açık sekmededir; sekme kapanınca kaybolur.
3. **GitHub’a bağlan** ile proje sahibi hesabın fine-grained erişim anahtarını girin. GitHub şifresi kullanılmaz.
4. **Yayımla** ve ardından **Evet, yayımla** seçin. Panel önce yeni fotoğrafları, ardından içerik dosyasını GitHub'a kaydeder; mevcut Actions yayını otomatik çalışır.
5. Genel bakıştan yayın sonucunu kontrol edin. Başarısız bir yayında içerik kaydedilmiş olsa da canlı sitenin güncellendiği söylenmez.

## İlk bağlantı

GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
Resource owner: **BatuhanIlhan99**. Repository access: **Only select repositories → gulplaj-hotel**.
Repository permissions: **Contents: Read and write**, **Actions: Read-only** (yayın durumu için).
Kısa geçerlilik süresi seçin. Anahtarı yalnızca `/admin/` bağlantı ekranına yazın; sohbette paylaşmayın.
Anahtar oluşturulması, kullanıcının GitHub hesabında tamamlayacağı tek bağlantı adımıdır. Kodda varsayılan şifre veya yayınlama anahtarı yoktur.

Panel sayfası herkese açılabilir ve yalnızca zaten kamusal olan site içeriğini gösterir. Değişiklik hazırlamak/önizlemek yetki vermez. **Gerçek yazma yetkisini GitHub sunucusu denetler**; yetkisiz ziyaretçiler siteyi değiştiremez. Bu bir gizli URL veya tarayıcıya gömülü parola koruması değildir. GitHub Pages bir sunucu oturumu sağlamadığı için klasik kullanıcı adı/parola yerine GitHub anahtarı kullanılır. Anahtar sadece JS kapanımının belleğinde tutulur; çerez, yerel depolama, kaynak kodu veya URL'ye yazılmaz. Çıkış ve sekmenin kapanması oturumu sonlandırır. Kaynak dosyasının güncel içerik dosyasının SHA değeri denetlenerek eşzamanlı değişikliklerin üzerine yazılması önlenir; 409/422 hata durumlarında taslak korunur ve otomatik tekrar denenmez.

## Kapsam

- Ana sayfa başlıkları, tanıtım, SEO açıklaması; otel ve oda metinleri.
- Galeriye JPEG/PNG/WebP yükleme, kategori ve başlık düzenleme, kaldırma/geri alma; ana sayfa, oda, rezervasyon, otel tanıtımı ve deneyim görsellerini seçme.
- Telefon, adres, giriş/çıkış saatleri.
- 1–12 sık sorulan soru ve yanıtı.
- Yayından önce taslak önizlemesi; kaydetme ve yayın durumu.
- HotelRunner yönetimine ve misafir rezervasyon ekranına bağlantılar.

Rezervasyon, misafir, ciro, stok veya fiyat verileri panele kopyalanmaz. Bunlar HotelRunner’da yönetilir; bu panelde canlı rezervasyon verisi varmış gibi örnek rakam gösterilmez. Tek seçimde 10, tek yayında 20 yeni fotoğraf; galeri en fazla 150 fotoğraf. Giriş dosyası en fazla 15 MB. Tarayıcı gerçek raster veriyi çözüp EXIF verilerini taşımadan en uzun kenarı 1600 piksel olan WebP üretir. HEIC ve SVG kabul edilmez. Kaldırma işlemi galeri ve beş öne çıkan görselden referansı kaldırır; eski dosyalar geri dönüş için korunur. Yeni fotoğraf dosyaları Contents API ile önce benzersiz yollara kaydedilir; bu hazırlık commitleri [skip ci] içerir ve yayını başlatmaz. Tüm fotoğraflar hazır olduğunda içerik dosyası SHA korumasıyla tek bir son committe güncellenir ve galeri yayına alınır. Kısmi yükleme hatasında galeri değiştirilmez; yeniden denemede aynı fotoğraf dosyaları üzerine yazılmadan tanınır. Eşzamanlı düzenlemede eski içerik üzerine yazılmaz. CI statik galeriyi de içerik dosyasından üretir; kaldırılmış fotoğraflar ilk yüklemede görünmez.

## Doğrulama

`node scripts/validate-site.mjs`

`node --test scripts/admin.test.mjs scripts/hotelrunner.test.mjs`

GitHub API kaynakları:
- https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents
- https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests

Yeni admin arayüzü harici script çalıştırmaz. Taslak önizlemesinde üçüncü taraf rezervasyon scripti yüklenmez. Kullanıcı içeriği HTML olarak enjekte edilmez; metin düğümleri ile işlenir. Fotoğraf yolları arşiv listesiyle doğrulanır. İşlem doğrulama testlerinde kullanılan anahtar yalnızca `test-only` sahte değeridir.

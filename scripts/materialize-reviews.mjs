import fs from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(fs.readFileSync('dist/reviews.json','utf8'));
const source=new URL(data.sourceUrl);
assert(source.protocol==='https:'&&source.hostname==='www.google.com'&&source.pathname.startsWith('/maps/'));
const reviewRequest=new URL(data.reviewRequestUrl);
assert(reviewRequest.protocol==='https:'&&reviewRequest.hostname==='g.page'&&!reviewRequest.username&&!reviewRequest.password&&!reviewRequest.search&&!reviewRequest.hash&&/^\/r\/[A-Za-z0-9_-]+\/review$/.test(reviewRequest.pathname),'Use the actual property review link from Google Business Profile');
assert(/^\d{4}-\d{2}-\d{2}$/.test(data.checkedAt));
assert(Number.isFinite(data.rating)&&data.rating>=1&&data.rating<=5);
assert(Number.isInteger(data.reviewCount)&&data.reviewCount>0);
assert(data.reviews.length>=2&&data.reviews.length<=8);
let words=0;
for(const review of data.reviews){assert(review.author&&review.author.length<100&&review.excerpt&&review.excerpt.length<400&&review.reviewId);assert(Number.isInteger(review.rating)&&review.rating>=1&&review.rating<=5);words+=review.excerpt.trim().split(/\s+/).length;}
assert(words<=25,'Keep the combined verbatim excerpts within the source quotation limit.');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const date=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(data.checkedAt+'T12:00:00Z'));
const cards=data.reviews.map((r,index)=>`<article class="guest-review" aria-label="${escape(r.author)}, ${r.rating}/5 Google yorumu"><div class="review-card-top"><span class="review-stars" aria-label="5 üzerinden ${r.rating}">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span><span>Google</span></div><p class="review-topic">${escape(r.topic)}</p><blockquote>“${escape(r.excerpt)}”</blockquote><div class="review-person"><span class="review-avatar" aria-hidden="true">${escape(r.author.split(' ').map(n=>n[0]).join('').toLocaleUpperCase('tr-TR'))}</span><div><strong>${escape(r.author)}</strong><span>Google yorumu · ${r.rating}/5</span></div><a href="${escape(data.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(r.author)} yorumunun kaynağı olan Google yorumlarını aç">↗</a></div></article>`).join('');
const invitation=`<div class="review-invitation"><div><h3>Gülplaj’da konakladınız mı?</h3><p>Deneyiminizi paylaşarak tatilini planlayan misafirlere yardımcı olabilirsiniz.</p></div><a class="button" href="${escape(data.reviewRequestUrl)}" target="_blank" rel="noopener noreferrer">Google’da değerlendirin ↗</a></div>`;
const section=`<!-- guest-reviews:start -->
    <section id="yorumlar" class="guest-reviews section-pad" aria-labelledby="reviews-title"><div class="reviews-heading"><div><p class="eyebrow">MİSAFİRLERİMİZDEN</p><h2 id="reviews-title">Güzel anılar,<br><em>güzel sözler.</em></h2></div><div class="reviews-intro"><p>Gülplaj’da kalan misafirlerimizin Google yorumlarından seçtiğimiz kısa alıntılar.</p><a class="google-rating" href="${escape(data.sourceUrl)}" target="_blank" rel="noopener noreferrer"><span class="google-word">Google</span><strong>${String(data.rating).replace('.',',')}<small>/5</small></strong><span class="rating-context">${data.reviewCount} değerlendirme<small>${date} tarihinde</small></span><span aria-hidden="true">↗</span></a></div></div><div class="reviews-track" id="reviews-track" tabindex="0" aria-label="Seçilmiş misafir yorumları">${cards}</div><div class="reviews-bottom"><p>Seçilmiş kısa alıntılardır. Tüm yorumları ve güncel puanı Google’da inceleyebilirsiniz.</p><a class="text-link" href="${escape(data.sourceUrl)}" target="_blank" rel="noopener noreferrer">Google’daki tüm yorumlar ↗</a></div><div class="review-controls" hidden><button type="button" id="review-prev" aria-label="Önceki yorum">←</button><span id="review-position" aria-live="off">1 / ${data.reviews.length}</span><button type="button" id="review-next" aria-label="Sonraki yorum">→</button><button type="button" id="review-pause">Otomatik geçişi durdur</button></div>${invitation}</section>
    <!-- guest-reviews:end -->`;
let html=fs.readFileSync('dist/index.html','utf8');
if(html.includes('<!-- guest-reviews:start -->'))html=html.replace(/<!-- guest-reviews:start -->[\s\S]*?<!-- guest-reviews:end -->/,()=>section);
else{assert(html.includes('<section id="rezervasyon"'));html=html.replace('<section id="rezervasyon"',()=>section+'\n    <section id="rezervasyon"');}
fs.writeFileSync('dist/index.html',html);
console.log(`Materialized ${data.reviews.length} verified Google review excerpts (${words} quoted words).`);

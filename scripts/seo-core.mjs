import {photoViewerScript,photoViewerMarkup} from './photo-viewer.mjs';
import {reportConnect,metricsHead} from './report-config.mjs';
import {guestAssistantHead,renderGuestAssistant,guestWhatsAppHref} from './guest-assistant.mjs';
export {guestAssistantHead};
export const guestAssistant = data => renderGuestAssistant(data,phoneHref,escapeHtml);
export const origin='https://www.gulplajhotel.com';
export const hotelEmail='gulplajhotel@gmail.com';
export const homeTitle='Gülplaj Hotel | Erdek’te Denize Sıfır Otel';
export const policy="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'"+reportConnect+"; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests";
export const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const jsonForHtml=value=>JSON.stringify(value).replace(/[<>&\u2028\u2029]/g,char=>'\\u'+char.charCodeAt(0).toString(16).padStart(4,'0'));
export const absolute=path=>new URL(path,origin+'/').href;
export const phoneHref=phone=>{const digits=phone.replace(/\D/g,'');return 'tel:'+(digits.startsWith('0')?'+90'+digits.slice(1):'+'+digits);};
export function phoneLinks(data,className=''){
  const attrs=className?` class="${className}"`:'';
  return [data.phone,data.phone2].filter(Boolean).map(phone=>`<a${attrs} href="${escapeHtml(phoneHref(phone))}">${escapeHtml(phone)}</a>`).join('');
}
export function bookingWhatsAppLink(data) {
  const whatsApp = data.phone2 ? guestWhatsAppHref(phoneHref(data.phone2).slice(4)) : '';
  const message = [
    'Merhaba, Gülplaj Hotel için fiyat ve oda müsaitliği öğrenmek istiyorum.',
    '',
    'Giriş tarihi:',
    'Çıkış tarihi:',
    'Yetişkin sayısı:',
    'Çocuk sayısı ve yaşları (varsa):'
  ].join('\n');
  const attrs = whatsApp ? ` href="${whatsApp}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener noreferrer"` : ' hidden';
  return `<a class="button booking-whatsapp"${attrs}>WhatsApp’tan fiyat ve müsaitlik sor</a>`;
}
export function directionsUrl(data, mapsUrl) {
  // Use the listing pin, since the map camera position can differ from the property.
  const pin = mapsUrl?.match(/^https:\/\/www\.google\.com\/maps\/place\/[^?#]*!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)(?:!|$)/);
  const destination = pin ? pin[1] + ',' + pin[2] : 'Gülplaj Hotel, ' + data.address.replace(/\n/g,', ');
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination);
}

export const hotelEmailLink = () => `<a class="hotel-email" href="mailto:${hotelEmail}">${hotelEmail}</a>`;
const sourceHosts=new Set(['balikesir.ktb.gov.tr','www.kulturportali.gov.tr','www.balikesirulasim.com.tr']);
const photoCategories={rooms:'Odalar ve balkonlar',bathrooms:'Banyolar',general:'Avlu ve ortak alanlar',exterior:'Dış cephe ve sahil'};
export const galleryGroups=data=>Object.entries(photoCategories).map(([key,label])=>({key,label,photos:data.gallery.filter(p=>p.category===key)})).filter(group=>group.photos.length);
export function validateSeoPages(pages,photoKeys){
  if(!Array.isArray(pages)||!pages.length)throw Error('Missing information pages');
  const slugs=new Set();
  for(const page of pages){
    if(!/^[a-z]+(?:-[a-z]+)*$/.test(page.slug)||slugs.has(page.slug))throw Error('Invalid or duplicate page slug');
    slugs.add(page.slug);
  }
  const targets=new Set(['/#galeri','/#rezervasyon','/#konum',...pages.map(p=>'/'+p.slug+'/')]);
  const text=value=>typeof value==='string'&&value.trim()&&value.length<=3000;
  for(const page of pages){
    for(const key of ['title','description','heading','intro','label','eyebrow'])if(!text(page[key]))throw Error('Missing page field: '+key);
    if(!photoKeys.includes(page.photoKey)||!Array.isArray(page.sections)||!page.sections.length)throw Error('Invalid detail page');
    const ids=new Set(['icerik','page-contents','contact','room-gallery','guest-questions','official-sources','room-summary',...Object.keys(photoCategories).map(key=>'photos-'+key)]);
    for(const section of page.sections){
      if(!/^[a-z]+(?:-[a-z]+)*$/.test(section.id)||ids.has(section.id))throw Error('Invalid or duplicate section ID');
      ids.add(section.id);
      if(!text(section.heading)||!Array.isArray(section.paragraphs)||!section.paragraphs.length||!section.paragraphs.every(text))throw Error('Invalid section content');
      if(section.links!==undefined&&(!Array.isArray(section.links)||section.links.length>4))throw Error('Invalid section links');
      for(const link of section.links||[])if(!text(link.label)||!targets.has(link.target))throw Error('Invalid contextual link');
    }
    for(const source of page.sources||[]){
      const url=new URL(source.url);
      if(!text(source.label)||url.protocol!=='https:'||!sourceHosts.has(url.hostname)||url.username||url.password||url.port)throw Error('Unverified source URL');
    }
  }
  return pages;
}
const imageFor=(data,key)=>data.gallery.find(photo=>photo.src===data[key]);
export const roomPhotos=data=>[...data.gallery.filter(p=>p.category==='rooms').slice(0,4),...data.gallery.filter(p=>p.category==='bathrooms').slice(0,2)];
function replaceOne(html,pattern,render){
  let count=0;const result=html.replace(pattern,(...args)=>{count++;return render(...args);});
  if(count!==1)throw Error('Expected one static content insertion point: '+pattern);
  return result;
}

export function renderStaticContent(html,data){
  const e=escapeHtml;
  for(const [id,title,accent] of [['hero-title',data.heroTitle,data.heroAccent],['booking-title',data.bookingTitle,data.bookingAccent]]){
    html=replaceOne(html,new RegExp(`(<h[12] id="${id}">)[\\s\\S]*?(</h[12]>)`),(_all,open,close)=>open+e(title)+'<br><em>'+e(accent)+'</em>'+close);
  }
  html=replaceOne(html,/(<p class="hero-description">)[\s\S]*?<\/p>/,(_all,open)=>open+e(data.heroDescription)+'</p>');
  html=replaceOne(html,/(<div class="intro-copy">)<p>[\s\S]*?<\/p><p>[\s\S]*?<\/p>/,(_all,open)=>open+'<p>'+e(data.aboutText)+'</p><p>'+e(data.aboutSecond)+'</p>');
  html=replaceOne(html,/(<div class="room-copy">[\s\S]*?<h3>)[\s\S]*?<\/h3><p>[\s\S]*?<\/p>/,(_all,open)=>open+e(data.roomTitle)+'</h3><p>'+e(data.roomDescription)+'</p>');
  html=replaceOne(html,/(<div class="reservation-heading">[\s\S]*?<\/h2>\s*<p>)[\s\S]*?<\/p>/,(_all,open)=>open+e(data.bookingIntro)+'</p>');
  html=replaceOne(html,/<p class="address">[\s\S]*?<\/p>/,()=>'<p class="address">'+e(data.address).replace(/\n/g,'<br>')+'</p>');
  html=replaceOne(html,/<div class="hotel-hours">[\s\S]*?<\/div><\/div>/,()=>`<div class="hotel-hours"><div><span>Odaya giriş</span><strong>${e(data.checkIn.replace(':','.'))}’ten itibaren</strong></div><div><span>Odadan çıkış</span><strong>En geç ${e(data.checkOut.replace(':','.'))}</strong></div></div>`);
  html=replaceOne(html,/<div class="faq-list">[\s\S]*?<\/div>/,()=>'<div class="faq-list">'+faqHtml(data)+'</div>');
  html=html.replace(/<a\b([^>]*?)href="tel:[^"]*"([^>]*)>([\s\S]*?)<\/a>/g,(_all,before,after,text)=>{
    const secondary=before.includes('data-phone="phone2"')||after.includes('data-phone="phone2"');
    const phone=secondary?data.phone2:data.phone;
    const attrs=before.replace(/\s+hidden\b/g,'').trimEnd();
    return `<a${attrs}${phone?'':' hidden'} href="${phone?e(phoneHref(phone)):'tel:'}"${after}>${text==='Oteli ara'?text:e(phone||'')}</a>`;
  });
  html=html.replace(/<a class="button booking-whatsapp"[^>]*>[\s\S]*?<\/a>/,()=>bookingWhatsAppLink(data));
  return html;
}

export function faqHtml(data){return data.faq.map(item=>`<details name="guest-faq"><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('');}

export function structuredData(data,page,mapsUrl){
  const photo=imageFor(data,page?.photoKey||'heroPhoto');
  const url=page?absolute(page.slug+'/'):origin+'/';
  const graph=[{
    '@type':'Hotel','@id':origin+'/#hotel',name:'Gülplaj Hotel',alternateName:'Gülplaj Otel',url:origin+'/',
    description:data.metaDescription,telephone:phoneHref(data.phone).slice(4),email:hotelEmail,
    ...(data.phone2?{contactPoint:[{'@type':'ContactPoint',contactType:'reservations',telephone:phoneHref(data.phone2).slice(4)}]}:{}),
    address:{'@type':'PostalAddress',streetAddress:data.address.split('\n')[0],addressLocality:'Erdek',addressRegion:'Balıkesir',postalCode:'10500',addressCountry:'TR'},
    image:[...new Set(['heroPhoto','roomPhoto','storyPhoto'].map(key=>absolute(imageFor(data,key).original)))],
    checkinTime:data.checkIn+':00',checkoutTime:data.checkOut+':00',hasMap:mapsUrl,
    amenityFeature:['Klima','Özel banyo','Restoran','Wi-Fi'].map(name=>({'@type':'LocationFeatureSpecification',name,value:true}))
  },{'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'Gülplaj Hotel',alternateName:['Gülplaj Otel','Gulplaj Hotel'],inLanguage:'tr-TR',publisher:{'@id':origin+'/#hotel'}},
  {'@type':'WebPage','@id':url+'#webpage',url,name:page?.title||homeTitle,description:page?.description||data.metaDescription,inLanguage:'tr-TR',isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#hotel'},primaryImageOfPage:{'@type':'ImageObject',url:absolute(photo.original),width:photo.width,height:photo.height},...(page?{breadcrumb:{'@id':url+'#breadcrumb'}}:{mainEntity:{'@id':origin+'/#hotel'}})}];
  if(page)graph.push({'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:[{'@type':'ListItem',position:1,name:'Ana sayfa',item:origin+'/'},{'@type':'ListItem',position:2,name:page.label,item:url}]});
  if(page?.slug==='fotograflar')graph.find(item=>item['@type']==='WebPage').mainEntity={
    '@type':'ItemList',name:'Gülplaj Hotel fotoğrafları',numberOfItems:data.gallery.length,
    itemListElement:galleryGroups(data).flatMap(group=>group.photos).map((p,index)=>({'@type':'ListItem',position:index+1,item:{'@type':'ImageObject',contentUrl:absolute(p.original),name:p.title,caption:p.alt,width:p.width,height:p.height}}))
  };
  return {'@context':'https://schema.org','@graph':graph};
}

export function metadata(data,page,mapsUrl){
  const e=escapeHtml,url=page?absolute(page.slug+'/'):origin+'/',title=page?.title||homeTitle,description=page?.description||data.metaDescription,photo=imageFor(data,page?.photoKey||'heroPhoto');
  return `<title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta property="og:locale" content="tr_TR"><meta property="og:type" content="website">
  <meta property="og:site_name" content="Gülplaj Hotel"><meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}"><meta property="og:url" content="${url}">
  <meta property="og:image" content="${e(absolute(photo.original))}"><meta property="og:image:alt" content="${e(photo.alt)}">
  <meta property="og:image:width" content="${photo.width}"><meta property="og:image:height" content="${photo.height}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}">
  <meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${e(absolute(photo.original))}">
  <meta name="twitter:image:alt" content="${e(photo.alt)}">
  <script type="application/ld+json">${jsonForHtml(structuredData(data,page,mapsUrl))}</script>`;
}

export function applyMetadata(html,data,mapsUrl){
  html=html.replace(/\s*<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/g,'')
    .replace(/\s*<title>[\s\S]*?<\/title>/g,'').replace(/\s*<meta name="description"[^>]*>/g,'');
  if(!html.includes('</head>'))throw Error('Missing document head');
  // A function replacement keeps editor text such as $&, $` and $' literal.
  return html.replace('</head>',()=> '  <!-- SEO:START -->\n  '+metadata(data,null,mapsUrl)+'\n  <!-- SEO:END -->\n</head>');
}

export function imageHtml(photo,prefix,renditions,{hero=false,sizes='(max-width:760px) 92vw, 60vw'}={}){
  const e=escapeHtml,pair=renditions[photo.src];
  return `<img src="${prefix}${e(hero?photo.original:photo.src)}"${pair&&photo.src!==photo.original?` srcset="${prefix}${e(photo.src)} ${pair.previewWidth}w, ${prefix}${e(photo.original)} ${pair.originalWidth}w" sizes="${e(sizes)}"`:''} alt="${e(photo.alt)}" width="${photo.width}" height="${photo.height}" ${hero?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
}

export function renderDetailPage(data,page,pages,mapsUrl,renditions){
  const e=escapeHtml,photo=imageFor(data,page.photoKey);
  const nav=pages.map(p=>`<a href="../${p.slug}/"${p.slug===page.slug?' aria-current="page"':''}>${e(p.label)}</a>`).join('');
  const sections=page.sections.map(section=>`<section id="${e(section.id)}" class="guide-section"><h2>${e(section.heading)}</h2>${section.paragraphs.map(p=>`<p>${e(p)}</p>`).join('')}${section.links?.length?`<nav class="guide-section-links" aria-label="${e(section.heading)}: ilgili bilgiler">${section.links.map(link=>`<a href="..${e(link.target)}">${e(link.label)} <span aria-hidden="true">↗</span></a>`).join('')}</nav>`:''}</section>`).join('');
  const roomSummary=page.slug==='odalar'?`<section id="room-summary" class="guide-section"><p class="eyebrow">KONAKLAMAYA KISA BİR BAKIŞ</p><h2>Odanız ve konaklama saatleri</h2><dl class="guide-facts"><div><dt>Oda tanıtımı</dt><dd>${e(data.roomTitle)}</dd></div><div><dt>Odaya giriş</dt><dd>${e(data.checkIn)}’ten itibaren</dd></div><div><dt>Odadan çıkış</dt><dd>En geç ${e(data.checkOut)}</dd></div></dl><p>Fotoğraflar farklı oda ve banyo görünümlerini içerir. Seçtiğiniz oda tipinin manzarasını, yatak düzenini ve kişi kapasitesini rezervasyon ekranında kontrol edin.</p></section>`:'';
  const roomExtras=page.slug==='odalar'?`<section id="room-gallery" class="guide-section"><p class="eyebrow">OTELİN GERÇEK FOTOĞRAFLARI</p><h2>Oda ve banyolara yakından bakın.</h2><p class="guide-room-description">${e(data.roomDescription)}</p><div class="guide-gallery" data-photo-gallery>${roomPhotos(data).map(p=>`<figure><a href="../${e(p.original)}" data-photo-open aria-haspopup="dialog">${imageHtml(p,'../',renditions)}</a><figcaption>${e(p.title)}</figcaption></figure>`).join('')}</div><a class="text-link" href="../#galeri">Tüm otel fotoğrafları</a></section>`:'';
  const faq=page.slug==='sik-sorulan-sorular'?`<section id="guest-questions" class="guide-section guide-faq"><h2>Konaklamayla ilgili temel bilgiler</h2>${faqHtml(data)}</section>`:'';
  const contact=page.slug==='konum-ulasim'?`<section id="contact" class="guide-section guide-contact"><h2>Gülplaj Hotel iletişim bilgileri</h2><address><strong>Gülplaj Hotel</strong><p>${e(data.address).replace(/\n/g,'<br>')}</p><div class="contact-numbers">${phoneLinks(data)}</div>${hotelEmailLink()}</address><a class="button" href="${e(directionsUrl(data,mapsUrl))}" target="_blank" rel="noopener noreferrer">Haritada yol tarifi alın ↗</a><p class="guide-note">Harita uygulamasında başlangıç noktanızı ve ulaşım biçiminizi seçin.</p></section>`:'';
  const sources=page.sources?`<section id="official-sources" class="guide-section guide-sources"><h2>Resmî kaynaklar ve güncel bilgiler</h2><ul>${page.sources.map(s=>`<li><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.label)} ↗</a></li>`).join('')}</ul></section>`:'';
  const groups=page.slug==='fotograflar'?galleryGroups(data):[];
  const photoGallery=groups.map(group=>`<section id="photos-${group.key}" class="guide-section"><p class="eyebrow">GÜLPLAJ HOTEL · ${group.photos.length} FOTOĞRAF</p><h2>${e(group.label)}</h2><div class="guide-photo-collection" data-photo-gallery>${group.photos.map(p=>`<figure><a href="../${e(p.original)}" data-photo-open aria-haspopup="dialog" aria-label="${e(p.title)}: fotoğrafı büyüt">${imageHtml(p,'../',renditions,{sizes:'(max-width:600px) 92vw, (max-width:1000px) 44vw, 28vw'})}</a><figcaption><h3>${e(p.title)}</h3><p>${e(p.alt)}</p></figcaption></figure>`).join('')}</div></section>`).join('');
  const contents=[...(contact?[{id:'contact',label:'Adres, telefon ve yol tarifi'}]:[]),...(roomSummary?[{id:'room-summary',label:'Oda ve konaklama saatleri'}]:[]),...(roomExtras?[{id:'room-gallery',label:'Gerçek oda fotoğrafları'}]:[]),...(faq?[{id:'guest-questions',label:'Konaklama soruları ve yanıtları'}]:[]),...groups.map(g=>({id:'photos-'+g.key,label:g.label+' · '+g.photos.length+' fotoğraf'})),...page.sections.map(s=>({id:s.id,label:s.heading})),...(sources?[{id:'official-sources',label:'Resmî kaynaklar'}]:[])];
  const contentsNav=`<nav id="page-contents" class="guide-contents" aria-label="Bu sayfada"><p class="eyebrow">BU SAYFADA</p><ul>${contents.map(item=>`<li><a href="#${item.id}">${e(item.label)}</a></li>`).join('')}</ul></nav>`;
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="strict-origin-when-cross-origin"><meta name="theme-color" content="#143b4a">
${metadata(data,page,mapsUrl)}
<link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../styles.css?v=seo-1"><link rel="stylesheet" href="../seo-pages.css?v=4"><link rel="stylesheet" href="../booking-section.css?v=phone-5">${metricsHead('../')}${guestAssistantHead('../')}${roomExtras||groups.length?photoViewerScript('../'):''}</head>
<body class="guide-body${groups.length?' guide-photos-page':''}"><a class="skip-link" href="#icerik">İçeriğe geç</a>
<header class="guide-header"><a class="wordmark" href="../" aria-label="Gülplaj Hotel ana sayfa"><span>GÜLPLAJ</span><small>HOTEL · ERDEK</small></a><nav aria-label="Ana menü">${nav}</nav><a class="button" href="../#rezervasyon">Rezervasyon</a></header>
<main id="icerik"><nav class="guide-breadcrumb" aria-label="İçerik yolu"><a href="../">Ana sayfa</a><span aria-hidden="true">/</span><span aria-current="page">${e(page.label)}</span></nav>
<section class="guide-hero"><div><p class="eyebrow">${e(page.eyebrow)}</p><h1>${e(page.heading)}</h1><p class="guide-intro">${e(page.intro)}</p><a class="text-link" href="../#rezervasyon">Tarih ve müsaitliği inceleyin ↗</a></div><figure>${imageHtml(photo,'../',renditions,{hero:true})}<figcaption>Gülplaj Hotel · Erdek</figcaption></figure></section>
<div class="guide-layout"><article>${contentsNav}${contact}${roomSummary}${roomExtras}${faq}${photoGallery}${sections}${sources}</article><aside class="guide-aside"><p class="eyebrow">KONAKLAMANIZI PLANLAYIN</p><h2>Erdek’te görüşmek üzere.</h2><p>Giriş: <strong>${e(data.checkIn)}</strong><br>Çıkış: <strong>${e(data.checkOut)}</strong></p><p>Müsait odaları, fiyatları ve rezervasyon koşullarını telefonla öğrenebilirsiniz.</p><a class="button" href="../#rezervasyon">Rezervasyon için arayın</a><div class="contact-numbers">${phoneLinks(data)}</div></aside></div>
<nav class="guide-related" aria-label="Diğer konaklama bilgileri"><h2>Tatilinizin diğer ayrıntıları</h2>${nav}</nav></main>
<footer class="guide-footer"><a class="wordmark" href="../"><span>GÜLPLAJ</span><small>HOTEL · ERDEK</small></a><div><p>${e(data.address).replace(/\n/g,'<br>')}</p><div class="contact-numbers">${phoneLinks(data)}</div>${hotelEmailLink()}</div><div><a href="../#rezervasyon">Konaklamanızı planlayın ↗</a><br><a href="../gizlilik/">Gizlilik ve ölçüm</a></div></footer>
<nav class="mobile-contact-bar" aria-label="Hızlı iletişim"><a href="${e(phoneHref(data.phone))}">Oteli ara</a><a href="../#rezervasyon">Rezervasyon</a></nav>${guestAssistant(data)}${roomExtras||groups.length?photoViewerMarkup:''}</body></html>\n`;
}

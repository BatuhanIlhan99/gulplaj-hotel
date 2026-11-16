import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {origin,homeTitle,escapeHtml,renderStaticContent,structuredData,metadata,renderDetailPage,applyMetadata,validateSeoPages,directionsUrl} from './seo-core.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const data=read('dist/site-content.json'),pages=read('content/seo-pages.json'),renditions=read('dist/photo-renditions.json'),mapsUrl=read('dist/reviews.json').sourceUrl;
const main=fs.readFileSync('dist/index.html','utf8');
const documents=[{url:origin+'/',file:'dist/index.html'},...pages.map(page=>({url:origin+'/'+page.slug+'/',file:'dist/'+page.slug+'/index.html'}))];
const blocks=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const decode=html=>html.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');

test('All public pages have unique titles, canonicals, descriptions, H1s and connected structured data',()=>{
  const titles=new Set(),descriptions=new Set();
  for(const {url,file} of documents){
    const html=fs.readFileSync(file,'utf8');
    assert.equal([...html.matchAll(/<h1\b/g)].length,1,file);
    assert.equal([...html.matchAll(/rel="canonical"/g)].length,1);
    assert(html.includes(`rel="canonical" href="${url}"`));
    assert(!/content="noindex/.test(html));
    const title=html.match(/<title>(.*?)<\/title>/)?.[1],description=html.match(/name="description" content="([^"]+)"/)?.[1];
    assert(title&&description);assert(!titles.has(title));assert(!descriptions.has(description));titles.add(title);descriptions.add(description);
    assert(html.includes(`property="og:url" content="${url}"`));
    const json=blocks(html);assert.equal(json.length,1);
    const graph=json[0]['@graph'];
    assert.equal(graph.find(item=>item['@type']==='WebPage').url,url);
    const hotel=graph.find(item=>item['@type']==='Hotel');
    const sourceDigits=data.phone.replace(/\D/g,'');
    assert.equal(hotel.telephone,sourceDigits.startsWith('0')?'+90'+sourceDigits.slice(1):'+'+sourceDigits);assert.equal(hotel.address.addressLocality,'Erdek');
    assert(!('aggregateRating' in hotel)&&!('starRating' in hotel)&&!('priceRange' in hotel)&&!('offers' in hotel));
    if(url!==origin+'/')assert.equal(graph.find(item=>item['@type']==='BreadcrumbList').itemListElement[1].item,url);
  }
});

test('Sitemap includes exactly the canonical public routes and only existing images',()=>{
  const xml=fs.readFileSync('dist/sitemap.xml','utf8');
  const locations=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1]));
  assert.deepEqual(locations,documents.map(d=>d.url));assert.equal(new Set(locations).size,documents.length);
  assert(!xml.includes('<lastmod>'),'Do not manufacture freshness timestamps');
  for(const [,src] of xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)){
    const url=new URL(decode(src));assert.equal(url.origin,origin);assert(fs.statSync(path.join('dist',decodeURIComponent(url.pathname))).isFile());
  }
  const robots=fs.readFileSync('dist/robots.txt','utf8');assert(robots.includes('Sitemap: '+origin+'/sitemap.xml'));
  assert(!robots.includes('Disallow: /admin'),'Allow crawlers to read the admin noindex directive');
});

test('Search intent targets resolve to indexable information pages with useful navigation',()=>{
  const intent=read('content/search-intent.json');
  const known=new Set(documents.map(d=>new URL(d.url).pathname));
  for(const group of intent.groups){assert(known.has(group.target));assert(group.queries.length>0);}
  const guide=fs.readFileSync('dist/erdek-konaklama/index.html','utf8');
  assert(guide.includes('Erdek otelleri arasında seçim yaparken'));
  assert(guide.includes('Gülplaj Otel’de konaklamayı'));
  for(const route of ['odalar','konum-ulasim','erdek-gezi-rehberi'])assert(guide.includes(`href="../${route}/"`));
  assert(main.includes('href="./erdek-konaklama/"'));
});

test('Information pages expose working section navigation and contextual next steps without JavaScript',()=>{
  for(const page of pages){
    const html=fs.readFileSync('dist/'+page.slug+'/index.html','utf8');
    const contents=html.match(/<nav id="page-contents"[\s\S]*?<\/nav>/)?.[0];assert(contents);
    for(const section of page.sections){
      assert(contents.includes(`href="#${section.id}"`));
      assert(html.includes(`id="${section.id}"`));
      for(const link of section.links||[])assert(html.includes(`href="..${link.target}"`));
    }
    assert(!html.includes('<script src='),'Information navigation must work without client scripts');
  }
});

test('Editorial validation rejects duplicate anchors, malformed text and unexpected link destinations',()=>{
  const photoKeys=['roomPhoto','storyPhoto','experiencePhoto','bookingPhoto'];
  assert.equal(validateSeoPages(pages,photoKeys),pages);
  for(const change of [
    p=>p[0].sections[0].id='room-summary',
    p=>p[0].sections[1].id=p[0].sections[0].id,
    p=>p[0].sections[0].id='x" onclick="alert(1)',
    p=>p[0].sections[0].paragraphs=[null],
    p=>p[0].sections[0].links=[{label:'Oda',target:'javascript:alert(1)'}],
    p=>p[0].sections[0].links=[{label:'Oda',target:'/missing/'}],
    p=>p[0].sources=[{label:'Kaynak',url:'https://www.balikesirulasim.com.tr.evil.example/'}],
    p=>p[0].sources=[{label:'Kaynak',url:'https://secret@www.balikesirulasim.com.tr/'}]
  ]){const changed=structuredClone(pages);change(changed);assert.throws(()=>validateSeoPages(changed,photoKeys));}
  const attack='<img src=x onerror=alert(1)>';
  const changed=structuredClone(pages[0]);changed.sections[0].heading=attack;changed.sections[0].links=[{target:'/odalar/',label:attack}];
  const html=renderDetailPage(data,changed,pages,mapsUrl,renditions);
  assert(!html.includes(attack));assert(html.includes(escapeHtml(attack)));
});

test('Directions use the current hotel address and room facts and answers follow managed content',()=>{
  const updated={...data,address:'Yeni Sokak & Sahil\nErdek, Balıkesir',checkIn:'15:30',checkOut:'10:30'};
  const destination=new URL(directionsUrl(updated));
  assert.equal(destination.origin,'https://www.google.com');assert.equal(destination.pathname,'/maps/dir/');
  assert.equal(destination.searchParams.get('api'),'1');assert.equal(destination.searchParams.get('destination'),'Gülplaj Hotel, Yeni Sokak & Sahil, Erdek, Balıkesir');
  const contact=renderDetailPage(updated,pages.find(p=>p.slug==='konum-ulasim'),pages,mapsUrl,renditions);
  assert(contact.includes(escapeHtml(directionsUrl(updated))));
  const rooms=renderDetailPage(updated,pages.find(p=>p.slug==='odalar'),pages,mapsUrl,renditions);
  assert(rooms.includes('15:30’ten itibaren')&&rooms.includes('En geç 10:30'));
  const faq=fs.readFileSync('dist/sik-sorulan-sorular/index.html','utf8');
  for(const item of data.faq)for(const html of [main,faq])assert(html.includes(escapeHtml(item.question))&&html.includes(escapeHtml(item.answer)));
});

test('Every local public link, fragment, stylesheet and image resolves within dist',()=>{
  const root=path.resolve('dist');
  for(const {file} of documents){
    const html=fs.readFileSync(file,'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
    for(const [,raw] of html.matchAll(/\b(?:src|href|data-original)="([^"]+)"/g)){
      const value=decode(raw);if(/^[a-z]+:|^\/\//i.test(value))continue;
      if(value==='#')continue;
      const [pathname,fragment]=value.split('#');
      let target=pathname?path.resolve(path.dirname(file),pathname.split('?')[0]):path.resolve(file);
      assert(target===root||target.startsWith(root+path.sep));assert(fs.existsSync(target),'Missing '+target);
      if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');
      assert(fs.statSync(target).isFile());
      if(fragment)assert(fs.readFileSync(target,'utf8').includes(`id="${fragment}"`),'Missing fragment '+value);
    }
    for(const [,alt] of html.matchAll(/<img\b[^>]*\balt="([^"]*)"/g))if(file!=='dist/index.html')assert(alt.trim());
  }
});

test('Admin updates reach static HTML, schema and detail pages without JavaScript',()=>{
  const updated={...data,heroTitle:'Güncellenmiş ana başlık',heroAccent:'Yeni bir mola',metaDescription:'Güncel otel açıklaması',phone:'0266 835 12 34',address:'Güncel adres\nErdek, Balıkesir',checkIn:'15:30',checkOut:'10:30',aboutText:'Yeni otel tanıtımı',aboutSecond:'Yeni ikinci paragraf',roomTitle:'Yeni oda adı',roomDescription:'Güncel oda açıklaması',bookingTitle:'Yeni rezervasyon başlığı',bookingAccent:'yeni vurgu',bookingIntro:'Yeni rezervasyon tanıtımı',faq:[{question:'Güncel soru?',answer:'Güncel yanıt.'}]};
  const html=renderStaticContent(main,updated);
  for(const field of ['heroTitle','heroAccent','aboutText','aboutSecond','roomTitle','roomDescription','bookingIntro','phone'])assert(html.includes(updated[field]),field);
  assert(html.includes('Güncel soru?')&&html.includes('Güncel yanıt.'));assert(html.includes('15.30’ten itibaren'));assert(html.includes('tel:+902668351234'));
  const json=structuredData(updated,null,mapsUrl);assert.equal(json['@graph'][0].telephone,'+902668351234');assert.equal(json['@graph'][0].checkinTime,'15:30:00');
  assert(metadata(updated,null,mapsUrl).includes(updated.metaDescription));
  assert(renderDetailPage(updated,pages.find(p=>p.slug==='konum-ulasim'),pages,mapsUrl,renditions).includes('Güncel adres<br>Erdek, Balıkesir'));
  assert(renderDetailPage(updated,pages.find(p=>p.slug==='sik-sorulan-sorular'),pages,mapsUrl,renditions).includes('Güncel yanıt.'));
});

test('HTML and JSON-LD escape malicious editor text without weakening CSP',()=>{
  const attack='</script><script src="https://example.com/x.js"></script><img src=x onerror=alert(1)> & $1';
  const updated={...data,heroTitle:attack,metaDescription:attack,aboutText:attack,faq:[{question:attack,answer:attack}]};
  const html=renderStaticContent(main,updated);assert(html.includes(escapeHtml(attack)));assert.equal((html.match(/<script\b/g)||[]).length,(main.match(/<script\b/g)||[]).length);
  const head=metadata(updated,null,mapsUrl);assert(!head.includes(attack));
  const json=blocks(head);assert.equal(json[0]['@graph'][0].description,attack);
  assert.equal((head.match(/<script\b/g)||[]).length,1);assert(!head.includes('unsafe-inline'));
});

test('Repeated metadata builds preserve literal replacement tokens and do not duplicate tags',()=>{
  const description='$& $` '+"$'"+' </script><img src=x onerror=alert(1)>';
  const changed={...data,metaDescription:description};
  const once=applyMetadata(main,changed,mapsUrl),twice=applyMetadata(once,changed,mapsUrl);
  assert.equal(twice,once);
  assert.equal(blocks(twice)[0]['@graph'][0].description,description);
  assert.equal((twice.match(/<title>/g)||[]).length,1);
  assert.equal((twice.match(/rel="canonical"/g)||[]).length,1);
  assert.equal((twice.match(/<\/head>/g)||[]).length,1);
  assert.equal((twice.match(/name="google-site-verification"/g)||[]).length,1,'Ownership verification survives future admin publications');
});

test('Admin, embedded search and real 404 stay out of indexing',()=>{
  for(const file of ['dist/admin/index.html','dist/hotelrunner-search.html','dist/404.html'])assert(/name="robots" content="noindex/.test(fs.readFileSync(file,'utf8')),file);
  const html=fs.readFileSync('dist/404.html','utf8');assert(!/http-equiv="refresh"|location\./.test(html));
  assert(main.includes(homeTitle));
});

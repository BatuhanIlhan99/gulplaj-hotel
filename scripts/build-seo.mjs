import fs from 'node:fs';
import path from 'node:path';
import {renderBookingPage} from './booking-page.mjs';
import {createRequire} from 'node:module';
import {origin,policy,escapeHtml as e,absolute,applyMetadata,renderStaticContent,renderDetailPage,roomPhotos} from './seo-core.mjs';
const require=createRequire(import.meta.url);
const model=require('../dist/content-model.js');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const data=model.validate(read('dist/site-content.json'),read('dist/photo-catalog.json'));
const pages=read('content/seo-pages.json'),renditions=read('dist/photo-renditions.json');
const mapsUrl=read('dist/reviews.json').sourceUrl;
const used=new Set();
for(const page of pages){
  if(!/^[a-z]+(?:-[a-z]+)*$/.test(page.slug)||used.has(page.slug))throw Error('Invalid or duplicate page slug');
  used.add(page.slug);
  for(const key of ['title','description','heading','intro','label','eyebrow'])if(typeof page[key]!=='string'||!page[key].trim())throw Error('Missing page field: '+key);
  if(!model.photoKeys.includes(page.photoKey)||!Array.isArray(page.sections)||!page.sections.length)throw Error('Invalid detail page');
  for(const source of page.sources||[]){const url=new URL(source.url);if(url.protocol!=='https:'||!['balikesir.ktb.gov.tr','www.kulturportali.gov.tr'].includes(url.hostname))throw Error('Unverified source URL');}
}
let html=renderStaticContent(fs.readFileSync('dist/index.html','utf8'),data);
html=applyMetadata(html,data,mapsUrl);
html=html.replace('GÜLPLAJ’A HOŞ GELDİNİZ','ERDEK’TE DENİZE SIFIR GÜLPLAJ HOTEL');
const links=pages.map(page=>`<a href="./${page.slug}/">${e(page.label)} <span aria-hidden="true">↗</span></a>`).join('');
const planning=`<!-- PLANNING:START --><section class="planning-links section-pad" aria-labelledby="planning-title"><div><p class="eyebrow">KONAKLAMADAN ÖNCE</p><h2 id="planning-title">Erdek’te <em>konaklama rehberiniz.</em></h2><p>Oda, konum ve konaklama paketi seçimini kolaylaştıran rehberlerimizi inceleyin.</p></div><nav aria-label="Konaklama rehberi">${links}</nav></section><!-- PLANNING:END -->`;
if(html.includes('<!-- PLANNING:START -->'))html=html.replace(/<!-- PLANNING:START -->[\s\S]*?<!-- PLANNING:END -->/,()=>planning);
else html=html.replace('  </main>',()=> '    '+planning+'\n  </main>');
html=html.replace(/href="\.\/seo-pages\.css(?:\?[^"]*)?"/, 'href="./seo-pages.css?v=2"');
if(!html.includes('seo-pages.css'))html=html.replace('</head>','  <link rel="stylesheet" href="./seo-pages.css?v=2">\n</head>');
fs.writeFileSync('dist/index.html',html);
for(const page of pages){fs.mkdirSync(path.join('dist',page.slug),{recursive:true});fs.writeFileSync(path.join('dist',page.slug,'index.html'),renderDetailPage(data,page,pages,mapsUrl,renditions));}
fs.mkdirSync('dist/rezervasyon',{recursive:true});fs.writeFileSync('dist/rezervasyon/index.html',renderBookingPage(data));
const locations=[{url:origin+'/',images:data.gallery.map(p=>p.original)},...pages.map(page=>({url:absolute(page.slug+'/'),images:page.slug==='odalar'?roomPhotos(data).map(p=>p.original):[data.gallery.find(p=>p.src===data[page.photoKey]).original]}))];
fs.writeFileSync('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+locations.map(({url,images})=>`  <url><loc>${e(url)}</loc>${[...new Set(images)].map(src=>`<image:image><image:loc>${e(absolute(src))}</image:loc></image:image>`).join('')}</url>`).join('\n')+'\n</urlset>\n');
fs.writeFileSync('dist/robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync('dist/404.html',`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="robots" content="noindex,follow"><title>Sayfa bulunamadı | Gülplaj Hotel</title><link rel="stylesheet" href="${origin}/styles.css"><link rel="stylesheet" href="${origin}/seo-pages.css"></head><body class="guide-body"><main class="not-found"><p class="eyebrow">GÜLPLAJ HOTEL · ERDEK</p><h1>Bu sayfayı bulamadık.</h1><p>Bağlantı değişmiş olabilir. Otelimizi keşfetmek veya konaklamanızı planlamak için aşağıdaki bağlantılardan devam edebilirsiniz.</p><a class="button" href="${origin}/">Ana sayfaya dön</a><nav aria-label="Yardımcı bağlantılar">${pages.map(p=>`<a href="${absolute(p.slug+'/')}">${e(p.label)}</a>`).join('')}</nav></main></body></html>\n`);
console.log('Built static text, metadata, Hotel schema, '+pages.length+' detail pages, XML sitemap, robots.txt and 404.');

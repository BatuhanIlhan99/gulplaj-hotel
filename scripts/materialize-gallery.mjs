// Generate the static gallery too, so removed images do not flash before JS runs.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),model=require('../dist/content-model.js');
const catalog=JSON.parse(fs.readFileSync('dist/photo-catalog.json','utf8'));
const content=model.validate(JSON.parse(fs.readFileSync('dist/site-content.json','utf8')),catalog);
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const image=photo=>`<img src="./${escape(photo.src)}" data-original="./${escape(photo.original)}" alt="${escape(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async">`;
let html=fs.readFileSync('dist/index.html','utf8');
const start=html.indexOf('<div id="rooms-gallery"'),end=html.indexOf('\n    </section>',start);
if(start<0||end<start)throw new Error('Gallery insertion points not found');
const panels=Object.keys(model.categories).map(category=>{
  const photos=content.gallery.filter(p=>p.category===category);
  html=html.replace(new RegExp(`(id="${category}-tab"[\\s\\S]*?<span class="gallery-count">)\\(\\d+\\)`),`$1(${photos.length})`);
  return `<div id="${category}-gallery" class="photo-grid gallery-panel" role="tabpanel" aria-labelledby="${category}-tab" tabindex="0"${category==='rooms'?'':' hidden'}>`+(photos.length?photos.map(photo=>`<figure class="photo-card"><button class="photo-open" type="button" aria-label="${escape(photo.title)}: tam boy görüntüle">${image(photo)}</button><figcaption>${escape(photo.title)}</figcaption></figure>`).join(''):'<p>Bu kategoride henüz fotoğraf yok.</p>')+'</div>';
}).join('');
// Re-find the start after count replacements, which may change string length.
const updatedStart=html.indexOf('<div id="rooms-gallery"'),updatedEnd=html.indexOf('\n    </section>',updatedStart);
html=html.slice(0,updatedStart)+panels+html.slice(updatedEnd);
html=html.replace(/(<p class="gallery-note">)[\s\S]*?<\/p>/,`$1${content.gallery.length} otel fotoğrafı · tam boy görüntülemek için seçin</p>`);
const selectors={roomPhoto:'room-photo',bookingPhoto:'reservation-photo',storyPhoto:'story-photo',experiencePhoto:'experience-photo'};
for(const [key,figure] of Object.entries(selectors)){const photo=content.gallery.find(p=>p.src===content[key]);html=html.replace(new RegExp(`(<figure class="${figure}">)<img[^>]*>`),(_all,prefix)=>prefix+image(photo));}
const hero=content.gallery.find(p=>p.src===content.heroPhoto);html=html.replace(/<img class="hero-image"[^>]*>/,()=>image(hero).replace('<img ','<img class="hero-image" ').replace('loading="lazy"','fetchpriority="high"'));
fs.writeFileSync('dist/index.html',html);
console.log(`Materialized ${content.gallery.length} gallery photographs.`);

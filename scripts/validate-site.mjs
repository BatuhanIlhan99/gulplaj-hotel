import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const root = path.resolve('dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
let assets = 0;
for (const [, reference] of html.matchAll(/\b(?:src|href|data-original)="([^"]+)"/g)) {
  if (reference.startsWith('#')) {
    if (reference.length > 1) assert(ids.includes(reference.slice(1)), `Missing section: ${reference}`);
    continue;
  }
  if (/^(?:[a-z]+:|\/\/)/i.test(reference)) continue;
  assert(!reference.startsWith('/'), `Root-relative URL breaks GitHub project hosting: ${reference}`);
  let target = path.resolve(root, reference.split(/[?#]/)[0]);
  assert(target.startsWith(root + path.sep), `Asset outside dist: ${reference}`);
  if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  assert(fs.statSync(target).isFile(), `Missing asset: ${reference}`);
  assets++;
}
for (const filename of fs.readdirSync(root).filter(name => name.endsWith('.js'))) {
  new vm.Script(fs.readFileSync(path.join(root, filename), 'utf8'), { filename });
}
for(const [,set] of html.matchAll(/\bsrcset="([^"]+)"/g)){
  const widths=new Set();
  for(const candidate of set.split(',')){
    const match=candidate.trim().match(/^\.\/([^\s]+) (\d+)w$/);
    assert(match,'Invalid responsive image candidate');
    assert(!widths.has(match[2]),'Duplicate responsive image widths');widths.add(match[2]);
    assert(fs.statSync(path.join(root,match[1])).isFile(),'Missing responsive image');
  }
}
const reviews=JSON.parse(fs.readFileSync(path.join(root,'reviews.json'),'utf8'));
assert(html.includes('id="yorumlar"'));
assert.equal((html.match(/class="guest-review"/g)||[]).length,reviews.reviews.length);
assert(html.includes('Seçilmiş kısa alıntılardır.'),'Review selection disclosure missing');
assert(html.includes('13 Kasım 2026')||html.includes('tarihinde'),'Review date disclosure missing');
const require = createRequire(import.meta.url);
const contentModel = require('../dist/content-model.js');
const catalog = JSON.parse(fs.readFileSync(path.join(root,'photo-catalog.json'),'utf8'));
const content=contentModel.validate(JSON.parse(fs.readFileSync(path.join(root,'site-content.json'),'utf8')),catalog);
for(const photo of content.gallery)for(const key of ['src','original'])assert(fs.statSync(path.join(root,photo[key])).isFile(),`Missing gallery asset: ${photo[key]}`);
assert.equal(catalog.length,36);
for(const photo of catalog){
  for(const key of ['src','original']){
    assert(/^assets\/[a-zA-Z0-9/_.-]+\.jpg$/.test(photo[key]),'Invalid photo path');
    assert(!photo[key].includes('..'),'Photo path traversal');
    assert(fs.statSync(path.join(root,photo[key])).isFile());
  }
}
const adminRoot=path.join(root,'admin');
const adminHtml=fs.readFileSync(path.join(adminRoot,'index.html'),'utf8');
for(const [,reference] of adminHtml.matchAll(/\b(?:src|href)="([^\"]+)"/g)){
  if(reference.startsWith('#')||/^[a-z]+:/i.test(reference))continue;
  assert(fs.existsSync(path.resolve(adminRoot,reference.split('?')[0])),`Missing admin asset: ${reference}`);
}
for(const file of fs.readdirSync(adminRoot).filter(name=>name.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(adminRoot,file),'utf8'),{filename:file});
const booking = require('../dist/booking-core.js');
assert.equal(booking.hotelToday(new Date('2026-10-04T22:30:00Z')), '2026-10-05');
assert.equal(booking.parseDate('2026-02-29'), null);
assert.equal(booking.validateStay('2026-10-05', '2026-10-05', '2026-10-05').ok, false);
assert.equal(booking.validateStay('2026-10-04', '2026-10-06', '2026-10-05').ok, false);
assert.equal(booking.validateStay('2026-12-31', '2027-01-02', '2026-10-05').nights, 2);
assert.equal((html.match(/class="photo-open"/g) || []).length, content.gallery.length);
const widget=fs.readFileSync(path.join(root,'hotelrunner-search.html'),'utf8');
assert(widget.includes('https://gulplaj-hotel.hotelrunner.com/widgets/0b30149edec93d3fa336/search_widget.js?v=1.0.0'));
assert(widget.includes('id="hr_search_widget"'));
assert(html.includes('id="hotelrunner-frame"'));
assert(!html.includes('id="booking-form"'),'Old local summary must not impersonate a reservation');
for(const [,reference] of widget.matchAll(/\b(?:src|href)="(\.\/[^\"]+)"/g)) assert(fs.statSync(path.join(root,reference.split('?')[0])).isFile());
console.log(`Validated ${assets} asset references, sections, JavaScript and booking date rules.`);

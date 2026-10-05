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
for (const [, reference] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  if (reference.startsWith('#')) {
    if (reference.length > 1) assert(ids.includes(reference.slice(1)), `Missing section: ${reference}`);
    continue;
  }
  if (/^(?:[a-z]+:|\/\/)/i.test(reference)) continue;
  assert(!reference.startsWith('/'), `Root-relative URL breaks GitHub project hosting: ${reference}`);
  const target = path.resolve(root, reference.split(/[?#]/)[0]);
  assert(target.startsWith(root + path.sep), `Asset outside dist: ${reference}`);
  assert(fs.statSync(target).isFile(), `Missing asset: ${reference}`);
  assets++;
}
for (const filename of fs.readdirSync(root).filter(name => name.endsWith('.js'))) {
  new vm.Script(fs.readFileSync(path.join(root, filename), 'utf8'), { filename });
}
const require = createRequire(import.meta.url);
const booking = require('../dist/booking-core.js');
assert.equal(booking.hotelToday(new Date('2026-10-04T22:30:00Z')), '2026-10-05');
assert.equal(booking.parseDate('2026-02-29'), null);
assert.equal(booking.validateStay('2026-10-05', '2026-10-05', '2026-10-05').ok, false);
assert.equal(booking.validateStay('2026-10-04', '2026-10-06', '2026-10-05').ok, false);
assert.equal(booking.validateStay('2026-12-31', '2027-01-02', '2026-10-05').nights, 2);
assert.equal((html.match(/class="photo-open"/g) || []).length, 36);
console.log(`Validated ${assets} asset references, sections, JavaScript and booking date rules.`);

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const model=require('../dist/content-model.js');
const github=require('../dist/admin/github-client.js');
const data=JSON.parse(fs.readFileSync('dist/site-content.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('dist/photo-catalog.json','utf8'));
const reply=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});

test('Content validation rejects invalid phones, hours, unknown photos and malformed FAQs',()=>{
  assert.deepEqual(model.validate(data,catalog),data);
  for(const override of [{phone:'javascript:alert(1)'},{checkIn:'25:00'},{bookingPhoto:'https://example.com/photo.jpg'},{heroPhoto:'assets/../../secret.jpg'},{faq:[]},{faq:[{question:'',answer:'No'}]},{heroTitle:'x'.repeat(101)}])assert.throws(()=>model.validate({...data,...override},catalog));
  assert.equal(model.validate({...data,unknown:'ignored'},catalog).unknown,undefined);
});
test('UTF-8 round trips preserve Turkish text',()=>{
  assert.equal(github.decode(github.encode('Gülplaj · ıİşŞğĞöÖçÇ')),'Gülplaj · ıİşŞğĞöÖçÇ');
});
test('Publishing requires authentication and the loaded file SHA',async()=>{
  let calls=0;const transport=async()=>{calls++;return reply(200,{});};
  await assert.rejects(github.create('',transport).save(data,'old-sha'),/bağlayın/);
  await assert.rejects(github.create('test-only',transport).save(data,undefined),/yükleyin/);
  assert.equal(calls,0);
});
test('Writes target only the known content file, include SHA and never send credentials in URLs or payloads',async()=>{
  let request;
  const client=github.create('test-only',async(url,options)=>{request={url,options};return reply(200,{content:{sha:'new'},commit:{sha:'commit'}});});
  assert.deepEqual(await client.save(data,'old-sha'),{sha:'new',commit:'commit'});
  assert.equal(request.url,'https://api.github.com/repos/BatuhanIlhan99/gulplaj-hotel/contents/dist/site-content.json');
  assert.equal(request.options.headers.Authorization,'Bearer test-only');
  const body=JSON.parse(request.options.body);assert.equal(body.sha,'old-sha');assert.equal(body.branch,'main');
  assert.deepEqual(JSON.parse(github.decode(body.content)),data);
  assert(!request.options.body.includes('test-only'));assert.equal(request.options.redirect,'error');assert.equal(request.options.credentials,'omit');
});
test('A stale edit is rejected without retrying or replacing the remote SHA',async()=>{
  let calls=0;const client=github.create('test-only',async()=>{calls++;return reply(409,{});});
  await assert.rejects(client.save(data,'old'),/Üzerine yazılmadı/);assert.equal(calls,1);
});
test('Unauthorized access clears the in-memory credential and logout prevents later writes',async()=>{
  const client=github.create('test-only',async()=>reply(401,{}));
  await assert.rejects(client.verify(),/geçersiz/);await assert.rejects(client.save(data,'old'),/bağlayın/);
  const other=github.create('test-only',async()=>reply(200,{}));other.logout();await assert.rejects(other.save(data,'old'),/bağlayın/);
});
test('A public repository read cannot be mistaken for edit authorization',async()=>{
  for(const body of [{full_name:'BatuhanIlhan99/gulplaj-hotel',permissions:{push:false}},{full_name:'someone/else',permissions:{push:true}}])await assert.rejects(github.create('test-only',async()=>reply(200,body)).verify(),/yetkisi yok/);
});

const head='a'.repeat(40),treeSha='b'.repeat(40),blobSha='c'.repeat(40),commitSha='d'.repeat(40);
const file={path:'assets/uploads/01234567-0123-4567-89ab-0123456789ab.webp',base64:btoa('RIFF0000WEBPtest')};
const uploaded={src:file.path,original:file.path,title:'Yeni fotoğraf',alt:'Deniz',width:1600,height:1000,category:'exterior'};

test('Gallery validation accepts a raster upload, rejects duplicates, scripts and missing highlights',()=>{
  const content={...data,gallery:[...data.gallery,uploaded]};
  assert.equal(model.validate(content,catalog).gallery.length,data.gallery.length+1);
  for(const photo of [{...uploaded,src:'https://example.com/image.webp'},{...uploaded,original:'javascript:alert(1)'},{...uploaded,category:'__proto__'},{...uploaded,width:0}])assert.throws(()=>model.validate({...data,gallery:[...data.gallery,photo]},catalog));
  assert.throws(()=>model.validate({...data,gallery:[...data.gallery,data.gallery[0]]},catalog));
  const gallery=data.gallery.filter(p=>p.src!==data.heroPhoto);
  assert.throws(()=>model.validate({...data,gallery},catalog));
});
test('Photo files are staged before the single gallery publication with content SHA protection',async()=>{
  const calls=[];
  const client=github.create('test-only',async(url,options)=>{
    const body=options.body?JSON.parse(options.body):undefined;calls.push({url,method:options.method,body});
    if(options.method==='GET'&&url.includes('/contents/dist/site-content.json'))return reply(200,{sha:'old-content'});
    if(options.method==='GET')return reply(404,{});
    if(url.includes('/assets/uploads/'))return reply(201,{content:{sha:blobSha},commit:{sha:head}});
    return reply(200,{content:{sha:blobSha},commit:{sha:commitSha}});
  });
  const content={...data,gallery:[...data.gallery,uploaded]};
  assert.equal((await client.saveMedia(content,'old-content',[file])).commit,commitSha);
  const writes=calls.filter(c=>c.method==='PUT');
  assert.equal(writes.length,2);assert(writes[0].url.endsWith('/contents/dist/'+file.path));
  assert(writes[0].body.message.includes('[skip ci]'));assert.equal(writes[1].body.sha,'old-content');
  assert(!writes[1].body.message.includes('[skip ci]'));assert.deepEqual(JSON.parse(github.decode(writes[1].body.content)),content);
  assert(writes.every(c=>c.body.branch==='main'));assert(!calls.some(c=>c.method==='PATCH'));
});
test('Partial uploads cannot publish the gallery; failed saves and stale edits are not retried',async()=>{
  let writes=0;
  const client=github.create('test-only',async(_url,options)=>{if(options.method!=='GET')writes++;return reply(200,{sha:'changed'});});
  await assert.rejects(client.saveMedia(data,'old-content',[]),/üzerine yazılmadı/);assert.equal(writes,0);
  const calls=[];
  const failing=github.create('test-only',async(url,options)=>{calls.push({url,method:options.method});if(options.method==='GET'&&url.includes('site-content.json'))return reply(200,{sha:'old'});if(options.method==='GET')return reply(404,{});return reply(500,{});});
  await assert.rejects(failing.saveMedia({...data,gallery:[...data.gallery,uploaded]},'old',[file]),/500/);
  assert(!calls.some(c=>c.method==='PUT'&&c.url.endsWith('site-content.json')));
});
test('Retrying staged files does not overwrite them or duplicate uploads',async()=>{
  const calls=[];const content={...data,gallery:[...data.gallery,uploaded]};
  const client=github.create('test-only',async(url,options)=>{calls.push({url,method:options.method});if(options.method==='GET'&&url.includes('site-content.json'))return reply(200,{sha:'old'});if(options.method==='GET')return reply(200,{content:file.base64});return reply(200,{content:{sha:blobSha},commit:{sha:commitSha}});});
  await client.saveMedia(content,'old',[file]);assert.equal(calls.filter(c=>c.method==='PUT').length,1);
});
test('Arbitrary upload paths, SVGs and unauthenticated media writes are rejected before network access',async()=>{
  let calls=0;const transport=async()=>{calls++;return reply(200,{});};
  await assert.rejects(github.create('',transport).saveMedia(data,'old',[]),/bağlayın/);
  for(const fileOverride of [{path:'../../.github/workflows/deploy.yml'}, {base64:btoa('<svg onload="bad()"/>') }])await assert.rejects(github.create('test-only',transport).saveMedia({...data,gallery:[...data.gallery,uploaded]},'old',[{...file,...fileOverride}]));
  assert.equal(calls,0);
});

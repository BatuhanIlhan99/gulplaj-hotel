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

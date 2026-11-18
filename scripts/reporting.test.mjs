import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import worker,{passwordHash,syncHotelRunner} from '../reporting/worker.mjs';
import {hotelDay,normalizeReservation,summarize,minor,dateRange} from '../reporting/core.mjs';
const origin='https://www.gulplajhotel.com';
const require=createRequire(import.meta.url),csv=require('../dist/admin/report-import.js');
const raw={reservation_id:10,hr_number:'R-10',completed_at:'2026-11-16T23:30:00Z',updated_at:'2026-11-17T10:00:00Z',checkin_date:'2026-12-01',checkout_date:'2026-12-03',state:'confirmed',channel:'online',channel_display:'Web sitesi',currency:'TRY',total:'1234.56',paid_amount:'200.00',total_rooms:1,total_guests:2,guest:'Private guest',address:{email:'private@example.com'},guest_national_id:'private'};
function database(){
  const sql=new DatabaseSync(':memory:');for(const file of fs.readdirSync('reporting/migrations').sort())sql.exec(fs.readFileSync('reporting/migrations/'+file,'utf8'));
  const prepare=(query,params=[])=>({bind(...values){return prepare(query,values);},async first(){return sql.prepare(query).get(...params)||null;},async all(){return {results:sql.prepare(query).all(...params)};},async run(){return sql.prepare(query).run(...params);}});
  return {prepare,async batch(statements){sql.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}},close(){sql.close();}};
}
async function environment(){return {DB:database(),SITE_ORIGIN:origin,REPORT_SECRET:'local-test-secret-only-not-a-live-credential',ADMIN_PASSWORD_SALT:'test-salt',ADMIN_PASSWORD_HASH:await passwordHash('local-test-password-123','test-salt')};}
const call=(env,path,method='GET',data,token,source=origin)=>worker.fetch(new Request('https://reports.example'+path,{method,headers:{Origin:source,...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:data?JSON.stringify(data):undefined}),env,{});

test('Money, Istanbul booking dates and minimal reservation normalization are exact',()=>{
  assert.equal(minor('0.01','TRY'),1);assert.equal(minor('1234.56','EUR'),123456);
  for(const input of ['-5','NaN','1,000','5.555','1e7'])assert.throws(()=>minor(input,'TRY'));
  assert.throws(()=>minor('2','ZZZ'));assert.throws(()=>dateRange('2026-02-30','2026-03-01'));
  const row=normalizeReservation(raw);assert.equal(row.booked_day,'2026-11-17');assert.equal(row.total_minor,123456);assert(!JSON.stringify(row).includes('Private'));assert(!('address' in row));assert(!('guest_national_id' in row));
  assert.equal(hotelDay(new Date('2026-11-16T22:00:00Z')),'2026-11-17');
});
test('Reports exclude canceled revenue, keep currencies separate and deduplicate daily browsers',()=>{
  const a=normalizeReservation(raw),b={...a,id:'11',state:'canceled',paid_minor:null},c={...a,id:'12',currency:'EUR',total_minor:9999};
  const report=summarize([a,b,c],[{day:'2026-11-17',visitor_key:'one',kind:'page_view',path:'/',referrer:'direct'},{day:'2026-11-17',visitor_key:'one',kind:'page_view',path:'/odalar/',referrer:'internal'},{day:'2026-11-17',visitor_key:'one',kind:'booking_open',path:'/',referrer:'direct'}],{from:'2026-11-17',to:'2026-11-17',currency:'TRY'});
  assert.equal(report.totals.gross_minor,123456);assert.equal(report.totals.canceled,1);assert.equal(report.totals.other_currency_count,1);assert.equal(report.totals.unknown_payment_count,1);assert.equal(report.traffic.daily_visitor_sum,1);assert.equal(report.traffic.page_views,2);assert.equal(report.traffic.booking_opens,1);
});
test('Reports require server-side authentication, reject untrusted origins and clear revoked sessions',async()=>{
  const env=await environment();
  try{
    let response=await call(env,'/v1/report?from=2026-11-17&to=2026-11-17');assert.equal(response.status,401);assert.match(response.headers.get('cache-control'),/no-store/);
    response=await call(env,'/v1/login','POST',{password:'local-test-password-123'},null,'https://evil.example');assert.equal(response.status,403);assert.equal(response.headers.get('access-control-allow-origin'),null);
    response=await call(env,'/v1/login','POST',{password:'wrong'});assert.equal(response.status,401);
    response=await call(env,'/v1/login','POST',{password:'local-test-password-123'});assert.equal(response.status,200);const session=await response.json();assert.match(session.token,/^[a-f0-9]{64}$/);
    response=await call(env,'/v1/report?from=2026-11-17&to=2026-11-17','GET',null,session.token);assert.equal(response.status,200);const empty=await response.json();assert(!empty.meta.last_sync&&!empty.meta.last_import&&!empty.meta.tracking_since);assert(empty.meta.traffic_window_start);
    await call(env,'/v1/logout','POST',null,session.token);response=await call(env,'/v1/report?from=2026-11-17&to=2026-11-17','GET',null,session.token);assert.equal(response.status,401);
    for(let i=0;i<4;i++)response=await call(env,'/v1/login','POST',{password:'wrong'});assert.equal(response.status,429);
  }finally{env.DB.close();}
});
test('Visitor ingestion needs explicit consent, hides raw browser IDs and deduplicates retries',async()=>{
  const env=await environment(),event={id:crypto.randomUUID(),visitorId:crypto.randomUUID(),consent:true,kind:'page_view',path:'/odalar/',referrer:'google'};
  try{
    assert.equal((await call(env,'/v1/events','POST',{...event,consent:false})).status,400);
    assert.equal((await call(env,'/v1/events','POST',{...event,path:'/admin/'})).status,400);
    assert.equal((await call(env,'/v1/events','POST',event)).status,200);assert.equal((await call(env,'/v1/events','POST',event)).status,200);
    const rows=(await env.DB.prepare('SELECT * FROM events').all()).results;assert.equal(rows.length,1);assert.notEqual(rows[0].visitor_key,event.visitorId);assert(!JSON.stringify(rows).includes(event.visitorId));
  }finally{env.DB.close();}
});
test('Contact clicks are private, counted separately, and retain existing traffic',async()=>{
  const env=await environment();
  const day=hotelDay(),base={visitorId:crypto.randomUUID(),consent:true,path:'/',referrer:'direct'};
  const make=kind=>({...base,id:crypto.randomUUID(),kind});
  try{
    assert.equal((await call(env,'/v1/events','POST',{...make('phone_click'),consent:false})).status,400);
    assert.equal((await call(env,'/v1/events','POST',{...make('page_view'),contactTracking:true})).status,200);
    const phone=make('phone_click');
    for(const item of [phone,phone,make('whatsapp_click'),make('whatsapp_click')]){
      assert.equal((await call(env,'/v1/events','POST',item)).status,200);
    }
    const path='/v1/report?from='+day+'&to='+day;
    assert.equal((await call(env,path)).status,401);
    const session=await (await call(env,'/v1/login','POST',{password:'local-test-password-123'})).json();
    const report=await (await call(env,path,'GET',null,session.token)).json();
    assert.equal(report.meta.contact_tracking_since,day);
    assert.deepEqual(report.traffic,{daily_visitor_sum:1,page_views:1,booking_opens:0,phone_clicks:1,whatsapp_clicks:2});
    assert.equal(report.daily[0].phone_clicks,1);assert.equal(report.daily[0].whatsapp_clicks,2);
  }finally{env.DB.close();}
});
test('HotelRunner sync is GET-only, idempotent, ignores stale updates and preserves data on invalid batches',async()=>{
  const env=await environment(),originalFetch=globalThis.fetch;env.HOTELRUNNER_TOKEN='test-upstream-token';env.HOTELRUNNER_HR_ID='test-property';let payload={reservations:[raw],pages:1};
  globalThis.fetch=async(url,options)=>{assert.equal(new URL(url).origin,'https://app.hotelrunner.com');assert(!options.method||options.method==='GET');assert.equal(new URL(url).searchParams.get('undelivered'),'false');return new Response(JSON.stringify(payload));};
  try{
    await syncHotelRunner(env);await syncHotelRunner(env);assert.equal((await env.DB.prepare('SELECT * FROM reservations').all()).results.length,1);
    payload={reservations:[{...raw,state:'canceled',updated_at:'2026-11-17T11:00:00Z'}],pages:1};await syncHotelRunner(env);
    payload={reservations:[raw],pages:1};await syncHotelRunner(env);assert.equal((await env.DB.prepare('SELECT * FROM reservations').first()).state,'canceled');
    payload={reservations:[{...raw,total:'not-money'}],pages:1};await assert.rejects(syncHotelRunner(env));assert.equal((await env.DB.prepare('SELECT * FROM reservations').first()).state,'canceled');
  }finally{globalThis.fetch=originalFetch;env.DB.close();}
});

test('CSV parsing preserves quoted fields and drops personal data before transmission',()=>{
  const headers=csv.columns.concat('guest','email'),values=csv.columns.map(c=>String(raw[c]??''));
  values[headers.indexOf('channel_display')]='Web; sitesi';
  const text='\ufeff'+headers.join(';')+'\r\n'+values.concat('Private name','private@example.com').map(v=>'"'+v.replace(/"/g,'""')+'"').join(';')+'\r\n';
  const records=csv.parse(text);assert.equal(records.length,1);assert.equal(records[0].channel_display,'Web; sitesi');assert.equal(records[0].total_rooms,1);assert(!JSON.stringify(records).includes('Private'));assert(!JSON.stringify(records).includes('private@example.com'));
  assert.throws(()=>csv.parse('guest;email\nPrivate;private@example.com'));
});
test('Authenticated imports reject invalid batches and retries do not duplicate financial totals',async()=>{
  const env=await environment();
  try{
    assert.equal((await call(env,'/v1/import','POST',{reservations:[raw]})).status,401);
    const session=await (await call(env,'/v1/login','POST',{password:'local-test-password-123'})).json();
    assert.equal((await call(env,'/v1/import','POST',{reservations:[raw]},session.token)).status,200);
    assert.equal((await call(env,'/v1/import','POST',{reservations:[raw]},session.token)).status,200);
    assert.equal((await env.DB.prepare('SELECT * FROM reservations').all()).results.length,1);
    assert.equal((await call(env,'/v1/import','POST',{reservations:[{...raw,total:'bad'}]},session.token)).status,400);
    assert.equal((await env.DB.prepare('SELECT * FROM reservations').first()).total_minor,123456);
  }finally{env.DB.close();}
});

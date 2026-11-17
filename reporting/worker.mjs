import {hotelDay,dateRange,normalizeReservation,summarize} from './core.mjs';
const encoder=new TextEncoder();
const hex=bytes=>[...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
const digest=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const equal=(a,b)=>{if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;};
export async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256));}
async function hmac(secret,value){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));}
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
const reservationStatement=(env,r)=>env.DB.prepare('INSERT INTO reservations(id,reference,booked_day,updated_at,checkin,checkout,state,channel,channel_label,currency,total_minor,paid_minor,rooms,guests) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET reference=excluded.reference,booked_day=excluded.booked_day,updated_at=excluded.updated_at,checkin=excluded.checkin,checkout=excluded.checkout,state=excluded.state,channel=excluded.channel,channel_label=excluded.channel_label,currency=excluded.currency,total_minor=excluded.total_minor,paid_minor=excluded.paid_minor,rooms=excluded.rooms,guests=excluded.guests WHERE excluded.updated_at>=reservations.updated_at').bind(...Object.values(r));
async function body(request,max=4096){
  if(Number(request.headers.get('Content-Length'))>max)throw new HttpError(413,'İstek çok büyük.');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'İstek okunamadı.');
  let length=0;const chunks=[];while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();throw new HttpError(413,'İstek çok büyük.');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpError(400,'İstek okunamadı.');}
}
async function rate(env,key,limit,seconds){const now=Math.floor(Date.now()/1000);const bucket=Math.floor(now/seconds);const id=await hmac(env.REPORT_SECRET,key+':'+bucket);const row=await env.DB.prepare('INSERT INTO rate_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits').bind(id,now+seconds).first();if(row.hits>limit)throw new HttpError(429,'Çok fazla istek. Biraz sonra tekrar deneyin.');}
async function authenticated(request,env){
  const authorization=request.headers.get('Authorization')||'';if(!/^Bearer [a-f0-9]{64}$/.test(authorization))throw new HttpError(401,'Raporlara erişmek için giriş yapın.');
  const hash=await digest(authorization.slice(7)),session=await env.DB.prepare('SELECT expires_at,auth_version FROM sessions WHERE token_hash=?').bind(hash).first();
  const version=await digest(env.ADMIN_PASSWORD_HASH||env.ADMIN_PASSWORD);
  if(!session||session.expires_at<Date.now()||session.auth_version!==version)throw new HttpError(401,'Oturum sona erdi. Yeniden giriş yapın.');return hash;
}
export async function syncHotelRunner(env){
  if(!env.HOTELRUNNER_TOKEN||!env.HOTELRUNNER_HR_ID)throw new HttpError(503,'HotelRunner bağlantısı henüz kurulmadı.');
  const from=new Date(Date.now()-29*86400000).toISOString().slice(0,10),records=new Map();let page=1,totalPages=1;
  do{
    const url=new URL('https://app.hotelrunner.com/api/v2/apps/reservations');
    for(const [key,value] of Object.entries({token:env.HOTELRUNNER_TOKEN,hr_id:env.HOTELRUNNER_HR_ID,undelivered:'false',from_date:from,per_page:'100',page:String(page)}))url.searchParams.set(key,value);
    let response;try{response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'application/json','Cache-Control':'no-store'}});}catch{throw new HttpError(502,'HotelRunner bağlantısı yanıt vermedi.');}
    if(!response.ok)throw new HttpError(502,'HotelRunner verileri alınamadı. Erişim izinlerini kontrol edin.');
    const result=await response.json();
    if(!Array.isArray(result.reservations)||!Number.isInteger(result.pages)||result.pages<0||result.pages>30)throw new HttpError(502,'HotelRunner veri kapsamı doğrulanamadı.');
    totalPages=Math.max(1,result.pages);for(const raw of result.reservations){let r;try{r=normalizeReservation(raw);}catch{throw new HttpError(502,'Bazı rezervasyonlar doğrulanamadı; mevcut rapor korunuyor.');}const previous=records.get(r.id);if(!previous||r.updated_at>previous.updated_at)records.set(r.id,r);}
    page++;
  }while(page<=totalPages);
  const statements=[...records.values()].map(r=>reservationStatement(env,r));
  // Apply validated rows in one transaction; no acknowledgments, state changes or inventory writes.
  const updated=new Date().toISOString();
  statements.push(env.DB.prepare('INSERT INTO report_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('last_sync',updated));
  statements.push(env.DB.prepare('INSERT INTO report_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('sync_window_start',from));
  await env.DB.batch(statements);
  return {imported:records.size,lastSync:updated,windowStart:from};
}
async function route(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/health'&&request.method==='GET')return {ok:true};
  if(!env.DB||!env.REPORT_SECRET)throw new HttpError(503,'Güvenli raporlama sunucu bağlantısı henüz tamamlanmadı.');
  if(!(env.ADMIN_PASSWORD?.length>=16||(env.ADMIN_PASSWORD_SALT&&env.ADMIN_PASSWORD_HASH)))throw new HttpError(503,'Rapor şifresi en az 16 karakter olarak kaydedilmelidir.');
  const origin=request.headers.get('Origin');
  if(origin!==env.SITE_ORIGIN)throw new HttpError(403,'Bu kaynaktan erişim desteklenmiyor.');
  if(request.method==='POST'&&path!=='/v1/logout'&&request.headers.get('Content-Type')?.split(';')[0]!=='application/json')throw new HttpError(415,'JSON isteği gerekiyor.');
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  if(path==='/v1/login'&&request.method==='POST'){
    await rate(env,'login:'+ip,5,900);await rate(env,'login-total',50,900);
    const input=await body(request);if(typeof input.password!=='string'||input.password.length>200)throw new HttpError(401,'Giriş bilgileri doğrulanamadı.');
    const salt=env.ADMIN_PASSWORD_SALT||env.REPORT_SECRET;
    const expected=env.ADMIN_PASSWORD_HASH||await passwordHash(env.ADMIN_PASSWORD,salt);
    if(!equal(await passwordHash(input.password,salt),expected))throw new HttpError(401,'Giriş bilgileri doğrulanamadı.');
    const token=hex(crypto.getRandomValues(new Uint8Array(32))),expiresAt=Date.now()+3600000;
    await env.DB.prepare('INSERT INTO sessions(token_hash,expires_at,auth_version) VALUES(?,?,?)').bind(await digest(token),expiresAt,await digest(env.ADMIN_PASSWORD_HASH||env.ADMIN_PASSWORD)).run();
    return {token,expiresAt};
  }
  if(path==='/v1/events'&&request.method==='POST'){
    await rate(env,'events:'+ip,90,60);const input=await body(request,2048);
    if(input.consent!==true||!['page_view','booking_open'].includes(input.kind)||!/^[/][a-z/-]*$/.test(input.path)||input.path.length>100||input.path.startsWith('/admin')||!/^[-a-f0-9]{36}$/.test(input.visitorId)||!/^[-a-f0-9]{36}$/.test(input.id))throw new HttpError(400,'Ölçüm verisi geçersiz.');
    const day=hotelDay(),visitor=await hmac(env.REPORT_SECRET,day+':'+input.visitorId);
    const referrer=['direct','google','bing','social','other','internal'].includes(input.referrer)?input.referrer:'other';
    await env.DB.prepare('INSERT OR IGNORE INTO events(id,day,visitor_key,kind,path,referrer) VALUES(?,?,?,?,?,?)').bind(input.id,day,visitor,input.kind,input.path,referrer).run();
    await env.DB.prepare('INSERT OR IGNORE INTO report_meta(key,value) VALUES(?,?)').bind('tracking_since',day).run();
    return {accepted:true};
  }
  const hash=await authenticated(request,env);
  if(path==='/v1/import'&&request.method==='POST'){
    await rate(env,'import',5,300);const input=await body(request,350000);
    if(!Array.isArray(input.reservations)||!input.reservations.length||input.reservations.length>500)throw new HttpError(400,'1–500 kayıt aktarabilirsiniz.');
    let rows;try{rows=input.reservations.map(normalizeReservation);}catch{throw new HttpError(400,'Kayıtlar doğrulanamadı. Tutar, tarih, durum ve para birimini şablona göre kontrol edin.');}
    if(new Set(rows.map(r=>r.id)).size!==rows.length)throw new HttpError(400,'Aynı dosyada yinelenen rezervasyon numarası var.');
    await env.DB.batch([...rows.map(r=>reservationStatement(env,r)),env.DB.prepare('INSERT INTO report_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('last_import',new Date().toISOString())]);
    return {imported:rows.length};
  }
  if(path==='/v1/logout'&&request.method==='POST'){await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(hash).run();return {ok:true};}
  if(path==='/v1/sync'&&request.method==='POST'){await rate(env,'sync',2,300);return syncHotelRunner(env);}
  if(path==='/v1/report'&&request.method==='GET'){
    let range;try{range=dateRange(url.searchParams.get('from'),url.searchParams.get('to'));}catch(error){throw new HttpError(400,error.message);}
    const reservations=(await env.DB.prepare('SELECT * FROM reservations WHERE booked_day BETWEEN ? AND ?').bind(range.from,range.to).all()).results;
    const events=(await env.DB.prepare('SELECT day,visitor_key,kind,path,referrer FROM events WHERE day BETWEEN ? AND ?').bind(range.from,range.to).all()).results;
    const meta=Object.fromEntries((await env.DB.prepare('SELECT key,value FROM report_meta').all()).results.map(r=>[r.key,r.value]));
    meta.traffic_window_start=hotelDay(new Date(Date.now()-89*86400000));
    return {...summarize(reservations,events,{...range,channel:url.searchParams.get('channel')||'all',currency:url.searchParams.get('currency')||'TRY'}),meta,connection:{hotelrunner:Boolean(env.HOTELRUNNER_TOKEN&&env.HOTELRUNNER_HR_ID),websiteChannel:env.WEBSITE_CHANNEL||null},availableChannels:(await env.DB.prepare('SELECT DISTINCT channel,channel_label FROM reservations ORDER BY channel_label').all()).results};
  }
  throw new HttpError(404,'İşlem bulunamadı.');
}
export default {
  async fetch(request,env,ctx){
    const allowed=request.headers.get('Origin')===env.SITE_ORIGIN;
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Vary':'Origin'};
    if(allowed){headers['Access-Control-Allow-Origin']=env.SITE_ORIGIN;headers['Access-Control-Allow-Methods']='GET,POST,OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type,Authorization';}
    if(request.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers});
    try{return new Response(JSON.stringify(await route(request,env,ctx)),{headers});}
    catch(error){return new Response(JSON.stringify({error:error.status?error.message:'İşlem tamamlanamadı; verileriniz korunuyor.'}),{status:error.status||500,headers});}
  },
  async scheduled(event,env,ctx){
    ctx.waitUntil((async()=>{
      await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()),env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(Math.floor(Date.now()/1000)),env.DB.prepare("DELETE FROM events WHERE day <= date('now','+3 hours','-90 days')")]);
      if(env.HOTELRUNNER_TOKEN&&env.HOTELRUNNER_HR_ID)try{await syncHotelRunner(env);}catch{/* Do not log credentials, upstream URLs or reservation payloads. */}
    })());
  }
};

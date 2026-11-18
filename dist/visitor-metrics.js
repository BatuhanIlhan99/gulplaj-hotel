(()=>{
  'use strict';
  const config=window.GULPLAJ_REPORT_CONFIG;if(!config?.enabled||!config.apiOrigin||location.pathname.startsWith('/admin')||new URL(location.href).searchParams.get('admin-preview')==='1')return;
  let endpoint;try{const url=new URL(config.apiOrigin);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/')return;endpoint=url.origin+'/v1/events';}catch{return;}
  const consentKey='gulplaj_measurement',visitorKey='gulplaj_daily_visitor';let accepted=false,visitorId='',sent=false;
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const banner=document.createElement('aside');banner.className='metrics-consent';banner.setAttribute('aria-label','Ziyaret ölçümü tercihi');
  const text=document.createElement('p');text.textContent='Sitemizi geliştirmek için isteğe bağlı ziyaret ölçümüne izin verir misiniz? Kart, kimlik veya rezervasyon bilgileriniz ölçüme alınmaz.';
  const accept=document.createElement('button'),reject=document.createElement('button');accept.textContent='İzin ver';reject.textContent='İzin verme';accept.type=reject.type='button';
  const detail=document.createElement('details'),summary=document.createElement('summary'),explanation=document.createElement('p');summary.textContent='Nasıl ölçüyoruz?';explanation.textContent='Tercihiniz ve günlük rastgele tarayıcı kodu bu cihazda saklanır. İzin verirseniz sayfa yolu, genel yönlendiren kaynak ve rezervasyon ekranı açılışı Cloudflare üzerindeki rapor sunucumuza gönderilir. Tam IP, URL sorgusu ve misafir bilgileri rapor veritabanına kaydedilmez. Günlük ölçüm kayıtları 90 gün sonra silinir. Tercihinizi aşağıdaki “Ölçüm tercihleri” düğmesinden değiştirebilirsiniz.';detail.append(summary,explanation);banner.append(text,detail,accept,reject);document.body.append(banner);
  function read(){try{const value=localStorage.getItem(consentKey);accepted=value==='accepted';banner.hidden=value==='accepted'||value==='rejected';}catch{banner.hidden=false;}}
  function identify(){const day=today();try{const saved=JSON.parse(localStorage.getItem(visitorKey)||'null');if(saved?.day===day&&/^[-a-f0-9]{36}$/.test(saved.id))return saved.id;const id=crypto.randomUUID();localStorage.setItem(visitorKey,JSON.stringify({day,id}));return id;}catch{return visitorId||(visitorId=crypto.randomUUID());}}
  function referrer(){if(!document.referrer)return 'direct';try{const u=new URL(document.referrer);if(u.origin===location.origin)return 'internal';if(/(^|\.)google\.[a-z.]+$/.test(u.hostname))return 'google';if(/(^|\.)bing\.com$/.test(u.hostname))return 'bing';if(/(^|\.)(instagram|facebook|tiktok|linkedin)\.com$/.test(u.hostname))return 'social';return 'other';}catch{return 'other';}}
  function event(kind){if(!accepted||navigator.globalPrivacyControl===true||navigator.doNotTrack==='1')return;const path=location.pathname;if(!/^[/][a-z/-]*$/.test(path)||path.length>100)return;fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',keepalive:true,body:JSON.stringify({id:crypto.randomUUID(),visitorId:identify(),consent:true,kind,path,referrer:referrer()})}).catch(()=>{});}
  function page(){if(!sent&&accepted){sent=true;event('page_view');if(location.pathname==='/rezervasyon/')event('booking_open');}}
  accept.addEventListener('click',()=>{try{localStorage.setItem(consentKey,'accepted');}catch{}accepted=true;banner.hidden=true;page();});
  reject.addEventListener('click',()=>{try{localStorage.setItem(consentKey,'rejected');localStorage.removeItem(visitorKey);}catch{}accepted=false;banner.hidden=true;});
  const inlinePreferences=document.getElementById('measurement-preferences');
  const preferences=inlinePreferences||document.createElement('button');
  preferences.className='metrics-preferences';preferences.textContent='Ölçüm tercihleri';preferences.type='button';
  preferences.addEventListener('click',()=>{banner.hidden=false;});
  if(inlinePreferences)preferences.hidden=false;
  else document.body.append(preferences);
  window.addEventListener('gulplaj:booking-open',()=>event('booking_open'));
  read();page();
})();

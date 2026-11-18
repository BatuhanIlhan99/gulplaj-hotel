(()=>{
  'use strict';
  const $=id=>document.getElementById(id),config=window.GULPLAJ_REPORT_CONFIG;
  let token='',expiresAt=0,generation=0,lastReport,controller,pendingImport;
  const day=date=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const today=()=>day(new Date()),formatDay=d=>new Date(d+'T12:00:00Z').toLocaleDateString('tr-TR');
  const contactStart=meta=>[meta.contact_tracking_since||'9999-12-31',meta.traffic_window_start||'0001-01-01'].sort().at(-1);
  const money=(value,currency)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency}).format(value/100);
  const error=text=>{$('reports-notice').textContent=text;};
  function endpoint(){const url=new URL(config.apiOrigin);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Rapor sunucusu doğrulanamadı.');return url.origin;}
  function lock(message=''){
    generation++;controller?.abort();token='';expiresAt=0;lastReport=undefined;pendingImport=undefined;
    $('reports-import-confirm').disabled=true;$('reports-import-status').textContent='';$('reports-import-file').value='';
    $('reports-quality').textContent='';$('reports-export').disabled=true;
    const channel=document.createElement('option');channel.value='all';channel.textContent='Tüm kanallar';$('reports-channel').replaceChildren(channel);$('reports-channel').value='all';
    $('reports-private').hidden=true;$('reports-login').hidden=false;$('reports-password').value='';
    for(const node of document.querySelectorAll('[data-report-value]'))node.textContent='—';
    for(const id of ['reports-daily','reports-reservations','reports-channels','reports-paths','reports-referrers'])$(id).replaceChildren();
    error(message);
  }
  async function request(path,{method='GET',data,login=false}={}){
    if(!config?.enabled||!config.apiOrigin)throw Error('Güvenli sunucu bağlantısı henüz tamamlanmadı.');
    if(!login&&(!token||Date.now()>=expiresAt)){lock();throw Error('Oturum sona erdi. Yeniden giriş yapın.');}
    const attempt=generation,headers={Accept:'application/json'};if(data)headers['Content-Type']='application/json';if(!login)headers.Authorization='Bearer '+token;
    const response=await fetch(endpoint()+path,{method,headers,body:data?JSON.stringify(data):undefined,credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller?.signal});
    const result=await response.json();if(attempt!==generation)throw Error('Oturum kapatıldı.');
    if(response.status===401&&!login)lock();if(!response.ok)throw Error(result.error||'Rapor alınamadı.');return result;
  }
  function cell(text,tag='td'){const node=document.createElement(tag);node.textContent=text;return node;}
  function table(id,rows){$(id).replaceChildren(...rows.map(values=>{const row=document.createElement('tr');row.append(...values.map(v=>cell(v)));return row;}));}
  function list(id,rows){const nodes=rows.map(r=>{const li=document.createElement('li');li.append(cell(r.label,'span'),cell(String(r.value),'strong'));return li;});if(!nodes.length){const li=document.createElement('li');li.textContent='Bu dönem için kayıt yok.';nodes.push(li);}$(id).replaceChildren(...nodes);}
  function render(report){
    lastReport=report;const t=report.totals,sourceReady=Boolean(report.meta.last_sync||report.meta.last_import);
    const trafficStart=[report.meta.tracking_since||'9999-12-31',report.meta.traffic_window_start||'0001-01-01'].sort().at(-1),tracked=report.range.to>=trafficStart;
    const values={visitors:tracked?report.traffic.daily_visitor_sum:'—',views:tracked?report.traffic.page_views:'—',bookings:sourceReady?t.reservations:'—',gross:sourceReady?money(t.gross_minor,t.currency):'—',paid:sourceReady?money(t.reported_paid_minor,t.currency):'—',canceled:sourceReady?t.canceled:'—',pending:sourceReady?t.pending:'—',bookingOpens:tracked?report.traffic.booking_opens:'—'};
    const clickStart=contactStart(report.meta),clicksTracked=report.range.to>=clickStart;
    values.phoneClicks=clicksTracked?report.traffic.phone_clicks:'—';
    values.whatsappClicks=clicksTracked?report.traffic.whatsapp_clicks:'—';
    for(const [key,value] of Object.entries(values))document.querySelector('[data-report-value="'+key+'"]').textContent=String(value);
    const notices=[];
    if(!sourceReady)notices.push('Rezervasyon kaynağı henüz bağlı değil. Çizgiler sıfır rezervasyon anlamına gelmez.');
    else if(report.meta.last_sync)notices.push('Son veri alma: '+new Date(report.meta.last_sync).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})+'. Son 30 günde alınan rezervasyonlar güncellenir; geçmiş ve daha eski iptaller için kapsam teyidi gerekir.');
    if(report.meta.last_import)notices.push('CSV aktarımı: '+new Date(report.meta.last_import).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})+'. İçe aktarılan kayıtlar tüm dönemi kapsamayabilir; dosya güncel tutulmalıdır.');
    if(!report.meta.tracking_since)notices.push('Ziyaretçi ölçümünde henüz kayıt yok. Geçmiş ziyaretler sonradan hesaplanamaz.');
    else notices.push('Ziyaretçi ölçümü başlangıcı: '+formatDay(report.meta.tracking_since)+'. Yalnızca ölçüme izin veren tarayıcılar; gün bazında tekilleştirilir.');
    if(report.range.from<trafficStart)notices.push('Ziyaret ölçümü seçilen dönemin tamamını kapsamıyor; saklanan ölçüm aralığı dışındaki günler bilinmiyor. Ölçüm kayıtları 90 gün saklanır.');
    if(!report.meta.contact_tracking_since)notices.push('Arama ve WhatsApp ölçümü ilk izinli ziyarette başlar.');
    else if(report.range.from<clickStart)notices.push('Arama ve WhatsApp tıklamaları yalnızca '+formatDay(clickStart)+' tarihinden itibaren raporlanır.');
    if(!report.connection.websiteChannel)notices.push('Web sitesi kanalı henüz doğrulanmadı; kanal filtresinden kaynağı seçin.');
    if(t.other_currency_count)notices.push('Diğer para birimlerinde '+t.other_currency_count+' rezervasyon var. Para tutarları yalnızca '+t.currency+' içindir.');
    if(t.unknown_payment_count)notices.push(t.unknown_payment_count+' rezervasyonda tahsilat bilgisi eksik.');
    $('reports-quality').textContent=notices.join(' ');
    $('reports-sync').disabled=!report.connection.hotelrunner;
    $('reports-sync').title=report.connection.hotelrunner?'Son kayıtları al':'HotelRunner API erişimi ve bağlantısı henüz açık değil';
    const current=$('reports-channel').value;$('reports-channel').replaceChildren();const all=document.createElement('option');all.value='all';all.textContent='Tüm kanallar';$('reports-channel').append(all);
    for(const channel of report.availableChannels){const option=document.createElement('option');option.value=channel.channel;option.textContent=channel.channel_label;$('reports-channel').append(option);}$('reports-channel').value=current||'all';
    table('reports-daily',report.daily.map(d=>[formatDay(d.day),d.day>=trafficStart?d.visitors:'—',d.day>=trafficStart?d.page_views:'—',d.day>=clickStart?d.phone_clicks:'—',d.day>=clickStart?d.whatsapp_clicks:'—',sourceReady?d.reservations:'—',sourceReady?d.canceled:'—',sourceReady?money(d.gross_minor,t.currency):'—']));
    table('reports-reservations',report.reservations.map(r=>[r.reference,formatDay(r.booked_day),formatDay(r.checkin)+' – '+formatDay(r.checkout),r.channel_label,({reserved:'Onay bekliyor',confirmed:'Onaylandı',canceled:'İptal'})[r.state],money(r.total_minor,r.currency),r.paid_minor===null?'Bilinmiyor':money(r.paid_minor,r.currency)]));
    table('reports-channels',report.channels.map(c=>[c.label,c.reservations,c.canceled,money(c.gross_minor,t.currency)]));
    list('reports-paths',report.paths);list('reports-referrers',report.referrers.map(r=>({...r,label:({direct:'Doğrudan / kaynak yok',google:'Google',bing:'Bing',social:'Sosyal medya',internal:'Site içi',other:'Diğer'})[r.label]||r.label})));
    $('reports-export').disabled=false;
  }
  async function load(){
    const attempt=generation;$('reports-refresh').disabled=true;error('Raporlar yükleniyor…');
    lastReport=undefined;$('reports-export').disabled=true;$('reports-quality').textContent='';
    for(const node of document.querySelectorAll('[data-report-value]'))node.textContent='—';
    for(const id of ['reports-daily','reports-reservations','reports-channels','reports-paths','reports-referrers'])$(id).replaceChildren();
    try{const query=new URLSearchParams({from:$('reports-from').value,to:$('reports-to').value,channel:$('reports-channel').value,currency:$('reports-currency').value});const result=await request('/v1/report?'+query);if(attempt!==generation)return;render(result);error('');}catch(e){if(attempt===generation)error(e.message);}finally{if(attempt===generation)$('reports-refresh').disabled=false;}
  }
  $('reports-login-form').addEventListener('submit',async event=>{
    event.preventDefault();const password=$('reports-password').value;lock();controller=new AbortController();const attempt=generation;
    $('reports-login-submit').disabled=true;error('Giriş doğrulanıyor…');
    try{const session=await request('/v1/login',{method:'POST',data:{password},login:true});if(attempt!==generation)return;token=session.token;expiresAt=session.expiresAt;$('reports-login').hidden=true;$('reports-private').hidden=false;await load();}catch(e){if(attempt===generation)error(e.message);}finally{$('reports-login-submit').disabled=false;}
  });
  $('reports-lock').addEventListener('click',async()=>{const session=token;lock();if(session&&config.enabled)try{await fetch(endpoint()+'/v1/logout',{method:'POST',headers:{Authorization:'Bearer '+session},credentials:'omit',cache:'no-store',redirect:'error'});}catch{/* Local data was already removed. */}});
  $('reports-refresh').addEventListener('click',load);
  $('reports-filter').addEventListener('submit',event=>{event.preventDefault();load();});
  for(const id of ['reports-from','reports-to'])$(id).addEventListener('change',()=>{$('reports-period').value='custom';});
  $('reports-period').addEventListener('change',()=>{const now=new Date(),period=$('reports-period').value;let from=new Date(now);if(period==='yesterday'){from.setUTCDate(from.getUTCDate()-1);$('reports-to').value=day(from);}else{$('reports-to').value=today();if(period==='week')from.setUTCDate(from.getUTCDate()-6);if(period==='month')from.setUTCDate(from.getUTCDate()-29);}if(period!=='custom')$('reports-from').value=day(from);});
  $('reports-sync').addEventListener('click',async()=>{$('reports-sync').disabled=true;error('HotelRunner verileri alınıyor…');try{await request('/v1/sync',{method:'POST',data:{}});await load();}catch(e){error(e.message);}finally{$('reports-sync').disabled=false;}});
  $('reports-export').addEventListener('click',()=>{
    if(!lastReport||!token||Date.now()>=expiresAt)return lock('Oturum sona erdi.');
    const safe=value=>'"'+String(value).replace(/^[=+@-]/,"'").replace(/"/g,'""')+'"';
    const trafficStart=[lastReport.meta.tracking_since||'9999-12-31',lastReport.meta.traffic_window_start||'0001-01-01'].sort().at(-1),synced=Boolean(lastReport.meta.last_sync||lastReport.meta.last_import);
    const clickStart=contactStart(lastReport.meta);
    const rows=[['Tarih','Ziyaretçi-gün','Sayfa görüntüleme','Arama tıklaması','WhatsApp tıklaması','Rezervasyon','İptal','Aktif rezervasyon tutarı ('+lastReport.totals.currency+')'],...lastReport.daily.map(d=>[d.day,d.day>=trafficStart?d.visitors:'Bilinmiyor',d.day>=trafficStart?d.page_views:'Bilinmiyor',d.day>=clickStart?d.phone_clicks:'Bilinmiyor',d.day>=clickStart?d.whatsapp_clicks:'Bilinmiyor',synced?d.reservations:'Bilinmiyor',synced?d.canceled:'Bilinmiyor',synced?(d.gross_minor/100).toFixed(2):'Bilinmiyor'])];
    const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(safe).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='gulplaj-rapor-'+lastReport.range.from+'-'+lastReport.range.to+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('reports-from').value=today();$('reports-to').value=today();
  $('reports-import-template').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob(['\ufeff'+window.GulplajReportImport.template()],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='gulplaj-rezervasyon-sablonu.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('reports-import-file').addEventListener('change',async()=>{
    const file=$('reports-import-file').files[0];pendingImport=undefined;$('reports-import-confirm').disabled=true;
    if(!file)return;try{if(file.size>250000)throw Error('Dosya en fazla 250 KB olabilir.');const rows=window.GulplajReportImport.parse(await file.text());if(!token)return;pendingImport=rows;$('reports-import-status').textContent=rows.length+' rezervasyon aktarılmak üzere hazır. Yalnızca rezervasyon kodu, tarihler, kanal, durum, tutar ve kişi/oda sayıları gönderilecek. Misafir iletişim ve kimlik sütunları aktarılmaz.';$('reports-import-confirm').disabled=false;}catch(e){$('reports-import-status').textContent=e.message;}
  });
  $('reports-import-confirm').addEventListener('click',async()=>{
    if(!pendingImport)return;$('reports-import-confirm').disabled=true;try{const result=await request('/v1/import',{method:'POST',data:{reservations:pendingImport}});pendingImport=undefined;$('reports-import-file').value='';$('reports-import-status').textContent=result.imported+' kayıt işlendi. Aynı rezervasyon numarası yeniden sayılmaz; yalnızca daha güncel kayıtlar uygulanır.';await load();}catch(e){$('reports-import-status').textContent=e.message;$('reports-import-confirm').disabled=!pendingImport;}
  });
  if(!config?.enabled)$('reports-setup').hidden=false;
  window.addEventListener('pagehide',()=>lock());
  document.getElementById('logout')?.addEventListener('click',()=>lock());
  setInterval(()=>{if(token&&Date.now()>=expiresAt)lock('Oturum sona erdi.');},30000);
})();

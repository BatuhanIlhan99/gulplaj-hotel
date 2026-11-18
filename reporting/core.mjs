export const hotelDay=(date=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export function validDay(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export const currencies={TRY:2,EUR:2,USD:2,GBP:2};
export function minor(value,currency){
  if(!Object.hasOwn(currencies,currency))throw Error('Desteklenmeyen para birimi');
  const text=String(value),match=text.match(/^(\d{1,12})(?:\.(\d{1,2}))?$/);
  if(!match)throw Error('Geçersiz tutar');
  const result=Number(match[1])*100+Number((match[2]||'').padEnd(2,'0'));
  if(!Number.isSafeInteger(result))throw Error('Tutar sınırı aşıldı');
  return result;
}
export function dateRange(from,to){
  if(!validDay(from)||!validDay(to)||from>to||(Date.parse(to)-Date.parse(from))/86400000>365)throw Error('En fazla 366 günlük geçerli bir tarih aralığı seçin.');
  return {from,to};
}
export function normalizeReservation(raw){
  const currency=String(raw.currency||'').toUpperCase();
  const timestamp=value=>typeof value==='string'&&validDay(value.slice(0,10))&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value));
  if(!raw.reservation_id||!timestamp(raw.completed_at)||!timestamp(raw.updated_at)||!['reserved','confirmed','canceled'].includes(raw.state)||!validDay(raw.checkin_date)||!validDay(raw.checkout_date)||raw.checkin_date>=raw.checkout_date)throw Error('Rezervasyon alanları eksik veya geçersiz');
  const bounded=(value,max)=>{const text=String(value??'');if(!text||text.length>max)throw Error('Geçersiz rezervasyon alanı');return text;};
  const count=value=>{if(!Number.isInteger(value)||value<1||value>500)throw Error('Geçersiz kişi veya oda sayısı');return value;};
  // Intentionally omit names, contacts, identity numbers, addresses and card data.
  return {id:bounded(raw.hr_number,80),reference:bounded(raw.hr_number,80),booked_day:hotelDay(new Date(raw.completed_at)),updated_at:new Date(raw.updated_at).toISOString(),checkin:raw.checkin_date,checkout:raw.checkout_date,state:raw.state,channel:bounded(raw.channel||'unknown',80),channel_label:bounded(raw.channel_display||raw.channel||'Diğer',120),currency,total_minor:minor(raw.total,currency),paid_minor:raw.paid_amount===null||raw.paid_amount===undefined?null:minor(raw.paid_amount,currency),rooms:count(raw.total_rooms),guests:count(raw.total_guests)};
}
export function summarize(reservations,events,{from,to,channel='all',currency='TRY'}){
  dateRange(from,to);if(!Object.hasOwn(currencies,currency))throw Error('Geçersiz para birimi');
  const rows=reservations.filter(r=>r.booked_day>=from&&r.booked_day<=to&&(channel==='all'||r.channel===channel));
  const selected=rows.filter(r=>r.currency===currency),active=selected.filter(r=>r.state!=='canceled');
  const add=(a,b)=>{const value=a+b;if(!Number.isSafeInteger(value))throw Error('Finansal toplam güvenli sayı sınırını aşıyor.');return value;};
  const totals={reservations:rows.length,active:rows.filter(r=>r.state!=='canceled').length,confirmed:rows.filter(r=>r.state==='confirmed').length,pending:rows.filter(r=>r.state==='reserved').length,canceled:rows.filter(r=>r.state==='canceled').length,gross_minor:active.reduce((n,r)=>add(n,r.total_minor),0),canceled_minor:selected.filter(r=>r.state==='canceled').reduce((n,r)=>add(n,r.total_minor),0),reported_paid_minor:selected.reduce((n,r)=>add(n,r.paid_minor||0),0),unknown_payment_count:selected.filter(r=>r.paid_minor===null).length,currency,other_currency_count:rows.length-selected.length};
  const daily=new Map();
  for(let date=new Date(from+'T12:00:00Z');date.toISOString().slice(0,10)<=to;date.setUTCDate(date.getUTCDate()+1)){const day=date.toISOString().slice(0,10);daily.set(day,{day,visitors:new Set(),page_views:0,booking_opens:0,phone_clicks:0,whatsapp_clicks:0,reservations:0,active:0,canceled:0,gross_minor:0});}
  const paths=new Map(),referrers=new Map();
  for(const event of events){
    const day=daily.get(event.day);if(!day)continue;
    day.visitors.add(event.visitor_key);
    if(event.kind==='page_view'){
      day.page_views++;
      paths.set(event.path,(paths.get(event.path)||0)+1);
      referrers.set(event.referrer,(referrers.get(event.referrer)||0)+1);
    }else if(event.kind==='booking_open')day.booking_opens++;
    else if(event.kind==='phone_click')day.phone_clicks++;
    else if(event.kind==='whatsapp_click')day.whatsapp_clicks++;
  }
  for(const r of rows){const day=daily.get(r.booked_day);day.reservations++;if(r.state==='canceled')day.canceled++;else{day.active++;if(r.currency===currency)day.gross_minor=add(day.gross_minor,r.total_minor);}}
  const days=[...daily.values()].map(d=>({...d,visitors:d.visitors.size}));
  const byChannel=new Map();for(const r of rows){let c=byChannel.get(r.channel);if(!c){c={channel:r.channel,label:r.channel_label,reservations:0,canceled:0,gross_minor:0};byChannel.set(r.channel,c);}c.reservations++;if(r.state==='canceled')c.canceled++;else if(r.currency===currency)c.gross_minor=add(c.gross_minor,r.total_minor);}
  const rank=map=>[...map].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,20);
  const sum=field=>days.reduce((n,d)=>n+d[field],0);
  const traffic={daily_visitor_sum:sum('visitors'),page_views:sum('page_views'),booking_opens:sum('booking_opens'),phone_clicks:sum('phone_clicks'),whatsapp_clicks:sum('whatsapp_clicks')};
  return {range:{from,to},totals,traffic,daily:days,channels:[...byChannel.values()],paths:rank(paths),referrers:rank(referrers),reservations:rows.sort((a,b)=>b.booked_day.localeCompare(a.booked_day)).slice(0,500)};
}

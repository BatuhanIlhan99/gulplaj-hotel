(()=>{'use strict';
const $=s=>document.querySelector(s),core=window.GulplajBooking;
const menu=$('.menu-toggle'), mobile=$('#mobile-menu');
const closeMenu=()=>{menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Menüyü aç');mobile.hidden=true;};
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');mobile.hidden=!open;});
mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobile.hidden){closeMenu();menu.focus();}});
window.matchMedia('(min-width: 801px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const tabs=[...document.querySelectorAll('.gallery-tab')];
function selectTab(tab){tabs.forEach(t=>{const selected=t===tab;t.classList.toggle('is-active',selected);t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById(t.dataset.gallery).hidden=!selected;});}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();selectTab(tabs[next]);tabs[next].focus();}});});
const viewer=$('#photo-viewer');let photos=[],photoIndex=0,trigger;
function showPhoto(){const img=photos[photoIndex].querySelector('img');$('#photo-full-image').src=img.src;$('#photo-full-image').alt=img.alt;$('#photo-viewer-title').textContent=img.alt;$('#photo-position').textContent=`${photoIndex+1} / ${photos.length}`;$('#photo-original').href=img.src;}
document.querySelectorAll('.photo-open').forEach(button=>button.addEventListener('click',()=>{trigger=button;photos=[...button.closest('.gallery-panel').querySelectorAll('.photo-open')];photoIndex=photos.indexOf(button);showPhoto();viewer.showModal();}));
$('#close-viewer').addEventListener('click',()=>viewer.close());viewer.addEventListener('close',()=>trigger?.focus());
function step(n){photoIndex=(photoIndex+n+photos.length)%photos.length;showPhoto();}
$('#previous-photo').addEventListener('click',()=>step(-1));$('#next-photo').addEventListener('click',()=>step(1));
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}});
const checkin=$('#checkin'),checkout=$('#checkout'),form=$('#booking-form'),status=$('#booking-status');let summary='';
function refreshDates(){checkin.min=core.hotelToday();checkout.min=core.addDays(checkin.value>=checkin.min?checkin.value:checkin.min,1);}
function invalidate(){summary='';$('#booking-result').hidden=true;status.textContent='';}
function updateStay(){refreshDates();const v=core.validateStay(checkin.value,checkout.value);$('#stay-summary').textContent=!checkin.value||!checkout.value?'Tarihleri seçin':v.ok?`${v.nights} gece`:v.message;}
checkin.addEventListener('change',()=>{refreshDates();if(checkin.value&&(!checkout.value||checkout.value<=checkin.value))checkout.value=core.addDays(checkin.value,1);updateStay();});checkout.addEventListener('change',updateStay);
function guests(){return `${$('#adults').value} yetişkin · ${$('#children').value} çocuk · ${$('#room-count').value} oda`;}
function updateGuests(){$('#guest-summary').textContent=guests();}
$('#children').addEventListener('change',()=>{const ages=[...document.querySelectorAll('.child-age')].map(s=>s.value);const area=$('#child-ages');area.replaceChildren();area.hidden=Number($('#children').value)===0;for(let i=0;i<Number($('#children').value);i++){const label=document.createElement('label');label.textContent=`${i+1}. çocuğun yaşı`;const select=document.createElement('select');select.className='child-age';select.name=`child-age-${i+1}`;select.required=true;select.append(new Option('Yaş seçin',''));for(let age=0;age<=17;age++)select.append(new Option(age===0?'0 (1 yaş altı)':String(age),String(age)));select.value=ages[i]??'';label.append(select);area.append(label);}updateGuests();});
form.addEventListener('change',()=>{invalidate();updateGuests();});
form.addEventListener('submit',e=>{e.preventDefault();refreshDates();const result=core.validateStay(checkin.value,checkout.value);if(!result.ok){status.textContent=result.message;checkin.focus();return;}if(!form.reportValidity())return;const ages=[...document.querySelectorAll('.child-age')].map(s=>s.value);summary=`Gülplaj Hotel — Konaklama özeti\nGiriş: ${core.displayDate(checkin.value)}\nÇıkış: ${core.displayDate(checkout.value)}\nSüre: ${result.nights} gece\nMisafirler: ${guests()}${ages.length?'\nÇocuk yaşları: '+ages.join(', '):''}\nOda tercihi: ${$('#room-type').value}\n\nMüsaitlik, toplam tutar ve rezervasyon otel teyidi gerektirir.\nİletişim: 0266 835 23 07`;$('#booking-result-text').textContent=summary;$('#booking-result').hidden=false;status.textContent='Özet hazır. Müsaitlik ve fiyat için oteli arayın.';});
$('#copy-summary').addEventListener('click',async()=>{if(!summary)return;try{await navigator.clipboard.writeText(summary);status.textContent='Konaklama özeti kopyalandı.';}catch{status.textContent='Kopyalama kullanılamıyor. Özeti indir düğmesini kullanabilirsiniz.';}});
$('#download-summary').addEventListener('click',()=>{if(!summary)return;const url=URL.createObjectURL(new Blob(['\uFEFF'+summary],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Gulplaj-Konaklama-Ozeti.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Konaklama özeti indirildi.';});
const config=window.GULPLAJ_BOOKING_CONFIG;
if(config?.bookingUrl){try{const u=new URL(config.bookingUrl);if(u.protocol==='https:'&&!u.username&&!u.password){const link=$('#provider-booking');link.href=u.href;link.hidden=false;link.target='_blank';link.rel='noopener';$('#payment-note').textContent=config.paymentReady?'Müsaitlik, fiyat ve güvenli kartlı ödeme için otelin rezervasyon sayfasına geçin. Tarihleri ve misafirleri bu sayfada tekrar kontrol edin.':'Online müsaitlik ve fiyat için rezervasyon sayfasını açın. Kartlı ödeme seçeneklerini otelden teyit edin.';}}catch{}}
window.addEventListener('focus',updateStay);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateStay();});refreshDates();updateGuests();$('#year').textContent=String(new Date().getFullYear());
})();

const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
function closeMenu() { menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Menüyü aç'); mobileMenu.hidden=true; }
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');mobileMenu.hidden=!open;});
mobileMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileMenu.hidden){closeMenu();menuButton.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
window.matchMedia('(min-width: 801px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const tabs=document.querySelectorAll('.gallery-tab');tabs.forEach(tab=>tab.addEventListener('click',()=>{tabs.forEach(t=>{const selected=t===tab;t.classList.toggle('is-active',selected);t.setAttribute('aria-selected',selected?'true':'false');document.getElementById(t.dataset.gallery).hidden=!selected;});}));
const checkin=document.querySelector('#checkin'), checkout=document.querySelector('#checkout'), stay=document.querySelector('#stay-summary');
const today=new Date();const iso=d=>d.toISOString().slice(0,10);checkin.min=iso(today);checkout.min=iso(new Date(today.getTime()+86400000));
checkin.addEventListener('change',()=>{const d=new Date(checkin.value+'T12:00:00');if(d instanceof Date&&!isNaN(d)){const next=new Date(d.getTime()+86400000);checkout.min=iso(next);if(!checkout.value||checkout.value<=checkin.value)checkout.value=iso(next);}updateStay();});checkout.addEventListener('change',updateStay);
function updateStay(){if(!checkin.value||!checkout.value){stay.textContent='Tarihleri seçin';return;}const nights=Math.round((new Date(checkout.value+'T12:00:00')-new Date(checkin.value+'T12:00:00'))/86400000);stay.textContent=nights>0?`${nights} gece`:'Tarihleri kontrol edin';}
document.querySelector('#booking-form').addEventListener('submit',e=>{e.preventDefault();const status=document.querySelector('#booking-status');if(!checkin.value||!checkout.value||checkout.value<=checkin.value){status.textContent='Lütfen geçerli bir giriş ve çıkış tarihi seçin.';return;}const dateText=`${checkin.value} – ${checkout.value}`;status.textContent=`Rezervasyon talebiniz hazırlandı (${dateText}). Kesin müsaitlik ve kartlı ödeme bağlantısı için 0266 835 23 07 numarasından otel teyidi gereklidir.`;status.scrollIntoView({behavior:'smooth',block:'nearest'});});
document.querySelector('#year').textContent=String(new Date().getFullYear());

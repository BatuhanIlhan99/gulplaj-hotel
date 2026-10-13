(()=>{'use strict';
const $=s=>document.querySelector(s);
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
function showPhoto(){const img=photos[photoIndex].querySelector('img'),original=img.dataset.original||img.src;$('#photo-full-image').src=original;$('#photo-full-image').alt=img.alt;$('#photo-viewer-title').textContent=img.alt;$('#photo-position').textContent=`${photoIndex+1} / ${photos.length}`;$('#photo-original').href=original;}
document.querySelectorAll('.photo-open').forEach(button=>button.addEventListener('click',()=>{trigger=button;photos=[...button.closest('.gallery-panel').querySelectorAll('.photo-open')];photoIndex=photos.indexOf(button);showPhoto();viewer.showModal();}));
$('#close-viewer').addEventListener('click',()=>viewer.close());viewer.addEventListener('close',()=>trigger?.focus());
function step(n){photoIndex=(photoIndex+n+photos.length)%photos.length;showPhoto();}
$('#previous-photo').addEventListener('click',()=>step(-1));$('#next-photo').addEventListener('click',()=>step(1));
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}});
document.getElementById('year').textContent=String(new Date().getFullYear());
})();

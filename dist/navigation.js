(()=>{'use strict';
const inset=24;
function targetFor(hash){if(!hash||hash==='#')return document.documentElement;try{return document.getElementById(decodeURIComponent(hash.slice(1)));}catch{return null;}}
function align(target,behavior,focus){const top=target===document.documentElement?0:Math.max(0,target.getBoundingClientRect().top+window.scrollY+(parseFloat(getComputedStyle(target).paddingTop)||0)-inset);window.scrollTo({top,behavior});if(focus&&target!==document.documentElement){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}}
function closeMenu(){const menu=document.getElementById('mobile-menu'),toggle=document.querySelector('.menu-toggle');if(menu)menu.hidden=true;if(toggle){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Menüyü aç');}}
document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const hash=link.getAttribute('href'),target=targetFor(hash);if(!target)return;event.preventDefault();closeMenu();if(location.hash!==hash){history.pushState(null,'',hash==='#'?location.pathname+location.search:hash);}requestAnimationFrame(()=>align(target,matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',true));});
function restore(){const target=targetFor(location.hash);if(target)requestAnimationFrame(()=>align(target,'instant',false));}
window.addEventListener('hashchange',restore);window.addEventListener('popstate',restore);window.addEventListener('load',()=>{if(location.hash)restore();});
})();

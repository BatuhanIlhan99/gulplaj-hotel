(()=>{
  'use strict';
  const track=document.getElementById('reviews-track');if(!track)return;
  const cards=[...track.children],controls=document.querySelector('.review-controls'),pause=document.getElementById('review-pause');
  const mobile=matchMedia('(max-width:600px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let index=0,paused=reduced.matches,visible=false,timer;
  function position(){const width=cards[0].getBoundingClientRect().width+16;index=Math.max(0,Math.min(cards.length-1,Math.round(track.scrollLeft/width)));document.getElementById('review-position').textContent=(index+1)+' / '+cards.length;}
  function move(step){index=(index+step+cards.length)%cards.length;track.scrollTo({left:cards[index].offsetLeft-cards[0].offsetLeft,behavior:reduced.matches?'instant':'smooth'});}
  function schedule(){clearInterval(timer);if(mobile.matches&&!paused&&visible&&!document.hidden)timer=setInterval(()=>{if(!track.matches(':hover')&&!track.contains(document.activeElement))move(1);},8000);}
  function update(){controls.hidden=!mobile.matches;pause.textContent=paused?'Otomatik geçişi başlat':'Otomatik geçişi durdur';schedule();}
  document.getElementById('review-prev').addEventListener('click',()=>{move(-1);schedule();});document.getElementById('review-next').addEventListener('click',()=>{move(1);schedule();});
  pause.addEventListener('click',()=>{paused=!paused;update();});track.addEventListener('scroll',position,{passive:true});
  track.addEventListener('keydown',event=>{if(mobile.matches&&['ArrowRight','ArrowLeft'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1);schedule();}});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.3}).observe(track);
  document.addEventListener('visibilitychange',schedule);mobile.addEventListener('change',update);reduced.addEventListener('change',()=>{paused=reduced.matches;update();});update();
})();

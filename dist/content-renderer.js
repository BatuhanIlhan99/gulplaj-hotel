(()=>{
  'use strict';
  let catalog;
  const $=s=>document.querySelector(s);
  function heading(selector,first,accent){const el=$(selector),em=document.createElement('em');em.textContent=accent;el.replaceChildren(document.createTextNode(first+' '),em);}
  function render(raw){
    const d=window.GulplajContent.validate(raw,catalog);
    heading('#hero-title',d.heroTitle,d.heroAccent);
    $('.hero-description').textContent=d.heroDescription;
    document.querySelector('meta[name="description"]').content=d.metaDescription;
    document.querySelectorAll('.intro-copy>p')[0].textContent=d.aboutText;
    document.querySelectorAll('.intro-copy>p')[1].textContent=d.aboutSecond;
    $('.room-copy h3').textContent=d.roomTitle;$('.room-copy>p').textContent=d.roomDescription;
    $('.address').replaceChildren(...d.address.split('\n').flatMap((line,i)=>i?[document.createElement('br'),document.createTextNode(line)]:[document.createTextNode(line)]));
    const digits=d.phone.replace(/\D/g,'');const tel=digits.startsWith('0')?'+90'+digits.slice(1):'+'+digits;
    document.querySelectorAll('a[href^="tel:"]').forEach(a=>{a.href='tel:'+tel;if(a.closest('.reservation-contact'))a.textContent='Bizi arayın · '+d.phone;else if(!a.closest('.mobile-contact-bar'))a.textContent=d.phone;});
    const hours=document.querySelectorAll('.hotel-hours strong');hours[0].textContent=d.checkIn.replace(':','.')+'’ten itibaren';hours[1].textContent='En geç '+d.checkOut.replace(':','.');
    heading('#booking-title',d.bookingTitle,d.bookingAccent);$('.reservation-heading>p:last-child').textContent=d.bookingIntro;
    for(const [key,selector] of [['heroPhoto','.hero-image'],['roomPhoto','.room-photo img'],['bookingPhoto','.reservation-photo img']]){
      const photo=catalog.find(p=>p.src===d[key]);const img=$(selector);img.src='./'+photo.src;img.alt=photo.alt;img.width=photo.width;img.height=photo.height;if(img.hasAttribute('data-original'))img.dataset.original='./'+photo.original;
    }
    $('.faq-list').replaceChildren(...d.faq.map(item=>{const el=document.createElement('details'),q=document.createElement('summary'),a=document.createElement('p');el.name='guest-faq';q.textContent=item.question;a.textContent=item.answer;el.append(q,a);return el;}));
  }
  Promise.all([fetch('./site-content.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error();return r.json();}),fetch('./photo-catalog.json').then(r=>r.json())]).then(([data,photos])=>{
    catalog=photos;render(data);
    if(new URLSearchParams(location.search).get('admin-preview')==='1'&&window.parent!==window){
      window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='gulplaj:preview')return;try{render(event.data.content);}catch{/* Leave the previous valid preview visible. */}});
      window.parent.postMessage({type:'gulplaj:preview-ready'},location.origin);
    }
  }).catch(()=>{/* The original HTML remains usable if content cannot be loaded. */});
})();

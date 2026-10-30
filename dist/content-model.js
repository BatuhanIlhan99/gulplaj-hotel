/* Shared validation for the public renderer, admin editor and deployment checks. */
(function(root){
  'use strict';
  const limits={heroTitle:100,heroAccent:100,heroDescription:400,metaDescription:300,aboutText:1500,aboutSecond:1500,roomTitle:120,roomDescription:1000,phone:30,address:250,bookingTitle:100,bookingAccent:100,bookingIntro:350};
  const photoKeys=['heroPhoto','roomPhoto','bookingPhoto'];
  function validate(data,catalog){
    if(!data||data.version!==1) throw new Error('İçerik dosyasının sürümü desteklenmiyor.');
    const clean={version:1};
    for(const [key,max] of Object.entries(limits)){
      if(typeof data[key]!=='string'||!data[key].trim()||data[key].length>max) throw new Error('Lütfen tüm alanları doldurun ve metin uzunluklarını kontrol edin.');
      clean[key]=data[key].trim();
    }
    if(!/^\+?[\d ()-]{10,30}$/.test(clean.phone)||clean.phone.replace(/\D/g,'').length<10) throw new Error('Geçerli bir telefon numarası girin.');
    for(const key of ['checkIn','checkOut']){
      if(typeof data[key]!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(data[key])) throw new Error('Giriş ve çıkış saatlerini kontrol edin.');
      clean[key]=data[key];
    }
    const allowed=new Set(catalog.map(p=>p.src));
    for(const key of photoKeys){if(!allowed.has(data[key])) throw new Error('Fotoğrafı otelin fotoğraf arşivinden seçin.');clean[key]=data[key];}
    if(!Array.isArray(data.faq)||data.faq.length<1||data.faq.length>12) throw new Error('1 ile 12 arasında soru ekleyebilirsiniz.');
    clean.faq=data.faq.map(item=>{
      if(!item||typeof item.question!=='string'||!item.question.trim()||item.question.length>200||typeof item.answer!=='string'||!item.answer.trim()||item.answer.length>1800) throw new Error('Soru ve yanıt alanlarını kontrol edin.');
      return {question:item.question.trim(),answer:item.answer.trim()};
    });
    return clean;
  }
  const api={validate,limits,photoKeys};
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GulplajContent=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);

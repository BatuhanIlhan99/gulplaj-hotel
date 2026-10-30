/* Shared validation for the public renderer, admin editor and deployment checks. */
(function(root){
  'use strict';
  const limits={heroTitle:100,heroAccent:100,heroDescription:400,metaDescription:300,aboutText:1500,aboutSecond:1500,roomTitle:120,roomDescription:1000,phone:30,address:250,bookingTitle:100,bookingAccent:100,bookingIntro:350};
  const photoKeys=['heroPhoto','roomPhoto','bookingPhoto','storyPhoto','experiencePhoto'];
  const categories={rooms:'Odalar & balkonlar',bathrooms:'Banyolar',general:'Ortak alanlar',exterior:'Dış cephe & sahil'};
  const uploadPath=/^assets\/uploads\/[a-f0-9-]{36}\.webp$/;
  function gallery(data,catalog){
    const items=data.gallery||catalog.map(p=>({...p,category:p.src.split('/')[2]}));
    if(!Array.isArray(items)||items.length<1||items.length>150)throw new Error('Galeride 1 ile 150 arasında fotoğraf bulunmalıdır.');
    const seen=new Set();
    return items.map(p=>{
      const original=catalog.find(item=>item.src===p?.src);
      if(!p||(!original&&!uploadPath.test(p.src))||seen.has(p.src)||!Object.hasOwn(categories,p.category))throw new Error('Galeri fotoğrafı veya kategorisi geçersiz.');
      if(p.original!==(original?original.original:p.src))throw new Error('Fotoğraf dosyası geçersiz.');
      if(typeof p.title!=='string'||!p.title.trim()||p.title.length>100||typeof p.alt!=='string'||!p.alt.trim()||p.alt.length>300)throw new Error('Fotoğraf başlığı ve açıklamasını kontrol edin.');
      if(!Number.isInteger(p.width)||!Number.isInteger(p.height)||p.width<1||p.height<1||p.width>10000||p.height>10000)throw new Error('Fotoğraf boyutları geçersiz.');
      seen.add(p.src);return {src:p.src,original:p.original,title:p.title.trim(),alt:p.alt.trim(),width:p.width,height:p.height,category:p.category};
    });
  }
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
    clean.gallery=gallery(data,catalog);
    const allowed=new Set(clean.gallery.map(p=>p.src));
    const defaults={storyPhoto:'assets/previews/general/general-courtyard-jolly-00.jpg',experiencePhoto:'assets/previews/general/general-restaurant-22.jpg'};
    for(const key of photoKeys){const value=data[key]||defaults[key];if(!allowed.has(value)) throw new Error('Öne çıkan fotoğraf galeride bulunmalıdır.');clean[key]=value;}
    if(!Array.isArray(data.faq)||data.faq.length<1||data.faq.length>12) throw new Error('1 ile 12 arasında soru ekleyebilirsiniz.');
    clean.faq=data.faq.map(item=>{
      if(!item||typeof item.question!=='string'||!item.question.trim()||item.question.length>200||typeof item.answer!=='string'||!item.answer.trim()||item.answer.length>1800) throw new Error('Soru ve yanıt alanlarını kontrol edin.');
      return {question:item.question.trim(),answer:item.answer.trim()};
    });
    return clean;
  }
  const api={validate,gallery,limits,photoKeys,categories,uploadPath};
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GulplajContent=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);

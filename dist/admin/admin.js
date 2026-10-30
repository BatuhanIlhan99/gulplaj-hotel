(()=>{
  'use strict';
  const $=s=>document.querySelector(s),form=$('#editor');
  const views={overview:['Genel bakış','Her şey bir arada.','Sitenizi güncelleyin, misafirlerinize güncel bilgiler sunun.'],content:['Site içerikleri','Hikâyenizi anlatın.','Otelinizin metinlerini düzenleyin; son hâlini önizleyin.'],photos:['Fotoğraflar','Gülplaj’ı en güzel hâliyle gösterin.','Yeni fotoğraf ekleyin, kategorisini seçin ve galerinizi düzenleyin.'],contact:['İletişim & saatler','Doğru bilgi, kolay iletişim.','Konuklarınızın size ulaşmasını kolaylaştırın.'],faq:['Sık sorulan sorular','Sorulara yerinde yanıtlar.','Konaklamadan önce merak edilenleri açıklayın.'],bookings:['Rezervasyonlar','Konaklamaları yönetin.','Rezervasyon işlemleriniz için HotelRunner’a geçin.']};
  const uploads=new Map(),removed=[];let removeTarget,head;
  let catalog=[],base,draft,sha,client=window.GulplajGitHub.create(),connected=false,busy=false,dirty=false,pollTimer,expectedCommit;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function notify(text,error=false){$('#notice').textContent=text;$('#notice').classList.toggle('error',error);}
  function switchView(view){if(!views[view])return;document.querySelectorAll('[data-panel]').forEach(el=>{el.hidden=el.dataset.panel!==view;});document.querySelectorAll('.sidebar [data-view]').forEach(el=>{el.classList.toggle('active',el.dataset.view===view);if(el.dataset.view===view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});const [label,title,description]=views[view];$('#breadcrumb').textContent=label;$('#page-title').textContent=title;$('#page-subtitle').textContent=description;}
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.view)));
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$('#'+button.dataset.close).close()));
  function state(){
    dirty=Boolean(base&&!same(draft,base));
    $('#draft-status').textContent=dirty?'Yayımlanmamış değişiklikler var':'Kaydedilmemiş değişiklik yok';
    $('#save-label').textContent=busy?'Yayın isteği gönderiliyor…':dirty?'Taslağınız bu sekmede. Henüz yayımlanmadı.':'Değişikliklerinizi önizleyin.';
    $('#preview').disabled=!base||busy;$('#publish').disabled=!base||!dirty||busy;$('#confirm-publish').disabled=busy;
    $('#publish').textContent=connected?'Yayımla ↗':'Bağlan ve yayımla ↗';
    $('#connect').hidden=connected;$('#logout').hidden=!connected;
    $('#connection-note').hidden=connected;
  }
  function readForm(){if(!draft)return;for(const key of [...Object.keys(window.GulplajContent.limits),'checkIn','checkOut',...window.GulplajContent.photoKeys])draft[key]=form.elements.namedItem(key).value;draft.faq=[...document.querySelectorAll('.faq-item')].map(el=>({question:el.querySelector('[data-question]').value,answer:el.querySelector('[data-answer]').value}));state();}
  function field(label,value,kind,max){const wrapper=document.createElement('label');wrapper.textContent=label;const input=document.createElement(kind==='answer'?'textarea':'input');input.value=value;input.required=true;input.maxLength=max;input.setAttribute('data-'+kind,'');if(kind==='answer')input.rows=3;wrapper.append(input);return wrapper;}
  function renderFaq(){const items=draft.faq.map((item,index)=>{const card=document.createElement('div');card.className='editor-card faq-item';const title=document.createElement('h2');title.textContent='Soru '+(index+1);const fields=document.createElement('div');fields.className='fields';for(const label of [field('Soru',item.question,'question',200),field('Yanıt',item.answer,'answer',1800)]){label.className='wide';fields.append(label);}const actions=document.createElement('div');actions.className='faq-actions';const remove=document.createElement('button');remove.type='button';remove.className='remove-faq';remove.textContent='Soruyu kaldır';remove.disabled=draft.faq.length===1;remove.addEventListener('click',()=>{readForm();draft.faq.splice(index,1);renderFaq();state();});actions.append(remove);card.append(title,fields,actions);return card;});$('#faq-fields').replaceChildren(...items);$('#add-faq').disabled=draft.faq.length>=12;}
  $('#add-faq').addEventListener('click',()=>{readForm();if(draft.faq.length>=12)return;draft.faq.push({question:'',answer:''});renderFaq();state();$('#faq-fields').lastElementChild.querySelector('input').focus();});
  function photoUrl(photo){return uploads.get(photo.src)?.dataUrl||'../'+photo.src;}
  function renderPhotos(){
    const slots=[['heroPhoto','Ana sayfa'],['roomPhoto','Oda tanıtımı'],['bookingPhoto','Rezervasyon bölümü'],['storyPhoto','Otel tanıtımı'],['experiencePhoto','Deniz ve lezzet']].map(([key,title])=>{
      const card=document.createElement('div');card.className='photo-slot';const img=document.createElement('img');img.alt=title;const label=document.createElement('label');label.textContent=title;const select=document.createElement('select');select.name=key;select.setAttribute('aria-label',title);
      for(const photo of draft.gallery){const option=document.createElement('option');option.value=photo.src;option.textContent=photo.title;select.append(option);}select.value=draft[key];
      const update=()=>{img.src=photoUrl(draft.gallery.find(p=>p.src===select.value));};select.addEventListener('change',update);update();label.append(select);card.append(img,label);return card;
    });
    $('#photo-slots').replaceChildren(...slots);
    $('#photo-library').replaceChildren(...draft.gallery.map(photo=>{
      const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=photoUrl(photo);img.alt=photo.alt;img.loading='lazy';
      const title=document.createElement('input');title.type='text';title.value=photo.title;title.required=true;title.maxLength=100;title.setAttribute('aria-label',photo.title+' fotoğraf başlığı');title.addEventListener('input',()=>{if(photo.alt===photo.title)photo.alt=title.value;photo.title=title.value;});
      const category=document.createElement('select');category.setAttribute('aria-label',photo.title+' kategorisi');for(const [value,text] of Object.entries(window.GulplajContent.categories)){const option=document.createElement('option');option.value=value;option.textContent=text;category.append(option);}category.value=photo.category;category.addEventListener('change',()=>{photo.category=category.value;});
      const remove=document.createElement('button');remove.type='button';remove.className='remove-photo';remove.textContent='Galeriden kaldır';remove.setAttribute('aria-label',photo.title+' fotoğrafını kaldır');remove.addEventListener('click',()=>{readForm();if(draft.gallery.length===1){notify('Galeride en az bir fotoğraf kalmalıdır.',true);return;}removeTarget=photo.src;$('#remove-photo-description').textContent='“'+photo.title+'” kaldırılacak. Bu fotoğraf ana görsellerden biriyse yerine galerideki ilk fotoğraf seçilecek.';$('#remove-photo-dialog').showModal();});
      caption.append(title,category,remove);if(uploads.has(photo.src)&&!uploads.get(photo.src).saved){const badge=document.createElement('small');badge.textContent='Yeni · Henüz yayımlanmadı';caption.append(badge);}figure.append(img,caption);return figure;
    }));
    $('#photo-count').textContent=String(draft.gallery.length);$('#library-count').textContent=draft.gallery.length+' fotoğraf';
  }
  $('#choose-photos').addEventListener('click',()=>$('#photo-files').click());
  $('#photo-files').addEventListener('change',async()=>{
    const files=[...$('#photo-files').files];$('#photo-files').value='';if(!files.length)return;readForm();
    if(files.length>10||[...uploads.values()].filter(file=>!file.saved).length+files.length>20||draft.gallery.length+files.length>150){notify('Bir seçimde en fazla 10, tek yayında en fazla 20 yeni fotoğraf ekleyebilirsiniz. Galeri sınırı 150 fotoğraftır.',true);return;}
    const category=$('#upload-category').value;busy=true;form.inert=true;state();let added=0;const errors=[];
    try{for(let i=0;i<files.length;i++){$('#upload-status').textContent='Fotoğraflar hazırlanıyor… '+(i+1)+' / '+files.length;try{const result=await window.GulplajUpload.prepare(files[i],category);draft.gallery.push(result.photo);uploads.set(result.photo.src,result.file);added++;}catch(error){errors.push(files[i].name+': '+error.message);}}renderPhotos();$('#upload-status').textContent=added+' fotoğraf taslağa eklendi. Siteye aktarmak için Yayımla düğmesini kullanın.';notify(errors.length?errors.join(' '):added+' fotoğraf eklendi. Önizleyip yayımlayabilirsiniz.',Boolean(errors.length));}finally{busy=false;form.inert=false;state();}
  });
  $('#confirm-remove-photo').addEventListener('click',()=>{
    if(!removeTarget)return;readForm();const index=draft.gallery.findIndex(p=>p.src===removeTarget);if(index<0||draft.gallery.length===1)return;
    const selected=Object.fromEntries(window.GulplajContent.photoKeys.filter(k=>draft[k]===removeTarget).map(k=>[k,draft[k]]));const [photo]=draft.gallery.splice(index,1);removed.push({photo,index,selected});
    for(const key of window.GulplajContent.photoKeys)if(draft[key]===photo.src)draft[key]=draft.gallery[0].src;
    $('#remove-photo-dialog').close();renderPhotos();state();notify('Fotoğraf taslaktan kaldırıldı. Değişiklik henüz canlı siteye yansımadı.');$('#undo-remove').hidden=false;
  });
  $('#undo-remove').addEventListener('click',()=>{const item=removed.pop();if(!item)return;readForm();draft.gallery.splice(item.index,0,item.photo);Object.assign(draft,item.selected);renderPhotos();state();$('#undo-remove').hidden=!removed.length;notify('Fotoğraf geri alındı.');});
  function populate(){for(const key of [...Object.keys(window.GulplajContent.limits),'checkIn','checkOut'])form.elements.namedItem(key).value=draft[key];renderFaq();renderPhotos();state();}
  form.addEventListener('input',readForm);form.addEventListener('change',readForm);form.addEventListener('submit',event=>event.preventDefault());
  function validated(){readForm();for(const el of form.elements){if(typeof el.checkValidity==='function'&&!el.checkValidity()){switchView(el.closest('[data-panel]').dataset.panel);el.reportValidity();return null;}}try{return window.GulplajContent.validate(draft,catalog);}catch(error){notify(error.message,true);return null;}}
  $('#connect').addEventListener('click',()=>{$('#login-error').textContent='';$('#login-dialog').showModal();});
  $('#login-dialog').addEventListener('close',()=>{$('#token').value='';});
  $('#login-form').addEventListener('submit',async event=>{
    event.preventDefault();const token=$('#token').value.trim();$('#token').value='';if(!token)return;
    const candidate=window.GulplajGitHub.create(token);$('#login-submit').disabled=true;$('#login-error').textContent='';
    try{await candidate.verify();const remote=await candidate.read();const content=window.GulplajContent.validate(remote.content,catalog);if(dirty&&!same(content,base))throw new Error('Sitenin içeriği siz düzenlerken değişmiş. Taslağınız korunuyor; güncel içerikle devam etmek için sayfayı yeniden açın.');client.logout();client=candidate;connected=true;sha=remote.sha;head=remote.head;base=clone(content);if(!dirty)draft=clone(content);populate();$('#login-dialog').close();notify('Hesabınız bağlandı. Hazır olduğunuzda değişiklikleri yayımlayabilirsiniz.');refreshStatus();}catch(error){candidate.logout();$('#login-error').textContent=error.message;}finally{$('#login-submit').disabled=false;state();}
  });
  $('#logout').addEventListener('click',()=>{client.logout();client=window.GulplajGitHub.create();connected=false;sha=undefined;clearTimeout(pollTimer);state();notify('Çıkış yapıldı. Erişim anahtarı sekmenin belleğinden silindi.');});
  window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
  $('#preview').addEventListener('click',()=>{const content=validated();if(!content)return;const frame=$('#preview-frame');$('#preview-dialog').showModal();frame.src='../?admin-preview=1#'+({photos:'galeri',contact:'konum',faq:'sorular'}[currentView()]||'icerik');});
  function currentView(){return [...document.querySelectorAll('[data-panel]')].find(el=>!el.hidden)?.dataset.panel;}
  window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===$('#preview-frame').contentWindow&&event.data?.type==='gulplaj:preview-ready'&&$('#preview-dialog').open){try{$('#preview-frame').contentWindow.postMessage({type:'gulplaj:preview',content:window.GulplajContent.validate(draft,catalog),images:Object.fromEntries([...uploads].map(([path,file])=>[path,file.dataUrl]))},location.origin);}catch{/* Invalid drafts remain unpublished. */}}});
  $('#preview-dialog').addEventListener('close',()=>{$('#preview-frame').removeAttribute('src');});
  function changeGroups(){return [['Ana sayfa ve otel metinleri',[...Object.keys(window.GulplajContent.limits)].filter(k=>!['phone','address'].includes(k))],['Telefon, adres ve konaklama saatleri',['phone','address','checkIn','checkOut']],['Galeri ve öne çıkan fotoğraflar',[...window.GulplajContent.photoKeys,'gallery']],['Sık sorulan sorular',['faq']]].filter(([,keys])=>keys.some(key=>!same(draft[key],base[key]))).map(([title])=>title);}
  $('#publish').addEventListener('click',()=>{if(!validated())return;if(!connected){$('#login-dialog').showModal();return;}$('#change-list').replaceChildren(...changeGroups().map(group=>{const li=document.createElement('li');li.textContent=group;return li;}));$('#publish-dialog').showModal();});
  $('#confirm-publish').addEventListener('click',async()=>{
    if(busy||!connected)return;const content=validated();if(!content)return;busy=true;form.inert=true;state();
    try{const pending=[...uploads.values()].filter(file=>!file.saved&&content.gallery.some(p=>p.src===file.path));const result=await client.saveMedia(content,sha,pending,(current,total)=>notify('Fotoğraflar aktarılıyor… '+current+' / '+total));sha=result.sha;head=result.commit;expectedCommit=result.commit;base=clone(content);draft=clone(content);for(const file of pending)file.saved=true;removed.length=0;$('#undo-remove').hidden=true;renderPhotos();$('#publish-dialog').close();notify('İçerik kaydedildi. Site yayını hazırlanıyor; tamamlandığında durum burada güncellenecek.');pollCount=0;refreshStatus();}catch(error){$('#publish-dialog').close();if(error.status===401){connected=false;sha=undefined;}notify(error.message,true);}finally{busy=false;form.inert=false;state();}
  });
  let pollCount=0;
  async function refreshStatus(){clearTimeout(pollTimer);$('#refresh-status').disabled=true;try{const runs=await client.runs();const run=expectedCommit?runs.find(r=>r.head_sha===expectedCommit):runs[0];if(!run){$('#deploy-state').textContent='Yayın bekleniyor';$('#deploy-detail').textContent='Yeni yayın henüz başlamadı.';}else if(run.status==='completed'){if(run.conclusion==='success'){$('#deploy-state').textContent='Yayımlandı';$('#deploy-detail').textContent=new Date(run.updated_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'});if(expectedCommit){notify('Yayın tamamlandı. Değişiklikleriniz canlı sitenizde görünür.');for(const [path,file] of uploads)if(file.saved)uploads.delete(path);renderPhotos();expectedCommit=undefined;}}else{$('#deploy-state').textContent='Yayın tamamlanamadı';$('#deploy-detail').textContent='GitHub yayın geçmişini kontrol edin.';if(expectedCommit){notify('İçerik kaydedildi, ancak site yayını tamamlanamadı. GitHub Actions sayfasını kontrol edin.',true);expectedCommit=undefined;}}}else{$('#deploy-state').textContent='Yayın hazırlanıyor';$('#deploy-detail').textContent='GitHub siteyi güncelliyor.';}
    if(expectedCommit&&pollCount++<24)pollTimer=setTimeout(refreshStatus,10000);else if(expectedCommit)notify('Yayın henüz tamamlanmadı. Biraz sonra “Durumu yenile” ile kontrol edin.');}catch(error){$('#deploy-state').textContent='Durum alınamadı';$('#deploy-detail').textContent='Bağlantı veya proje izni gerekli olabilir.';if(error.status===401){connected=false;sha=undefined;state();}}finally{$('#refresh-status').disabled=false;}}
  $('#refresh-status').addEventListener('click',refreshStatus);
  Promise.all([fetch('../site-content.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json();}),fetch('../photo-catalog.json').then(r=>{if(!r.ok)throw new Error();return r.json();})]).then(([data,photos])=>{catalog=photos;base=window.GulplajContent.validate(data,catalog);draft=clone(base);populate();notify('');refreshStatus();}).catch(()=>{notify('İçerik yüklenemedi. Sayfayı yenileyin; devam ederse site yöneticisiyle görüşün.',true);state();});
})();

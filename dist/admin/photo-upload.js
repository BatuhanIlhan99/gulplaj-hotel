(()=>{
  'use strict';
  async function prepare(file,category){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('JPEG, PNG veya WebP fotoğraf seçin. HEIC fotoğrafları önce JPEG olarak kaydedin.');
    if(file.size>15*1024*1024)throw new Error('Fotoğraf en fazla 15 MB olabilir.');
    let bitmap;
    try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw new Error('Fotoğraf açılamadı; başka bir JPEG, PNG veya WebP dosyası seçin.');}
    try{
      if(bitmap.width*bitmap.height>50000000)throw new Error('Fotoğraf çözünürlüğü çok yüksek. Daha küçük bir kopyasını seçin.');
      const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const context=canvas.getContext('2d');if(!context)throw new Error('Tarayıcınız fotoğraf işleyemiyor.');context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      let blob;for(const quality of [.84,.72,.6]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(blob&&blob.size<=900000)break;}
      if(!blob||blob.type!=='image/webp'||blob.size>900000)throw new Error('Fotoğraf küçültülemedi. Daha küçük bir dosya seçin.');
      const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Fotoğraf okunamadı.'));reader.readAsDataURL(blob);});
      const src='assets/uploads/'+crypto.randomUUID()+'.webp',title=file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim().slice(0,100)||'Otel fotoğrafı';
      return {photo:{src,original:src,title,alt:title,width:canvas.width,height:canvas.height,category},file:{path:src,base64:dataUrl.split(',')[1],dataUrl}};
    }finally{bitmap.close();}
  }
  window.GulplajUpload=Object.freeze({prepare});
})();

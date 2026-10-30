(function(root){
  'use strict';
  const repo='/repos/BatuhanIlhan99/gulplaj-hotel';
  const contentPath=repo+'/contents/dist/site-content.json';
  const runsPath=repo+'/actions/workflows/deploy-pages.yml/runs?branch=main&per_page=5';
  const headPath=repo+'/git/ref/heads/main';
  const uploadPath=/^assets\/uploads\/[a-f0-9-]{36}\.webp$/;
  function encode(value){return btoa(Array.from(new TextEncoder().encode(value),b=>String.fromCharCode(b)).join(''));}
  function decode(value){return new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
  function create(token='',transport=fetch){
    let credential=token;
    async function request(path,method='GET',body){
      // Only these fixed GitHub endpoints may ever receive the in-memory credential.
      const photoEndpoint=path.startsWith(repo+'/contents/dist/')&&uploadPath.test(path.slice((repo+'/contents/dist/').length).split('?')[0]);
      const allowed=(method==='GET'&&([repo,contentPath+'?ref=main',runsPath,headPath].includes(path)||new RegExp('^'+contentPath+'\\?ref=[a-f0-9]{40}$').test(path)||photoEndpoint))||(method==='PUT'&&(path===contentPath||photoEndpoint));
      if(!allowed) throw new Error('Bu işlem desteklenmiyor.');
      if(method!=='GET'&&!credential) throw new Error('Önce GitHub hesabınızı bağlayın.');
      const headers={Accept:'application/vnd.github+json'};
      if(credential)headers.Authorization='Bearer '+credential;
      if(body)headers['Content-Type']='application/json';
      let response;
      try{response=await transport('https://api.github.com'+path,{method,headers,body:body?JSON.stringify(body):undefined,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(20000)});}catch{throw new Error('GitHub’a ulaşılamadı. Bağlantınızı kontrol edip yeniden deneyin.');}
      if(response.status===401){credential='';throw Object.assign(new Error('Erişim anahtarınız geçersiz veya süresi dolmuş. Yeniden bağlanın.'),{status:401});}
      if(response.status===403)throw Object.assign(new Error('Bu işlem için yetki yok veya GitHub istek sınırına ulaşıldı. Anahtarın proje izinlerini kontrol edin.'),{status:403});
      if(response.status===409||response.status===422)throw Object.assign(new Error('İçerik başka bir yerden değiştirildi veya yayın engellendi. Üzerine yazılmadı; sayfayı yenileyip güncel sürümle devam edin.'),{status:response.status});
      if(!response.ok)throw Object.assign(new Error('GitHub işlemi tamamlanamadı ('+response.status+'). Proje erişimini kontrol edin.'),{status:response.status});
      return response.json();
    }
    return Object.freeze({
      async verify(){const data=await request(repo);if(data.full_name?.toLowerCase()!=='batuhanilhan99/gulplaj-hotel'||!data.permissions?.push)throw new Error('Bu hesabın Gülplaj sitesi için düzenleme yetkisi yok.');return true;},
      async read(){const head=(await request(headPath)).object.sha;if(!/^[a-f0-9]{40}$/.test(head))throw new Error('Güncel sürüm okunamadı.');const file=await request(contentPath+'?ref='+head);if(file.type!=='file'||file.encoding!=='base64'||!file.sha)throw new Error('İçerik dosyası okunamadı.');return {content:JSON.parse(decode(file.content)),sha:file.sha,head};},
      async save(content,sha){if(!sha)throw new Error('Önce güncel içerik dosyasını yükleyin.');const result=await request(contentPath,'PUT',{message:'Update hotel website content from admin panel',content:encode(JSON.stringify(content,null,2)+'\n'),sha,branch:'main'});return {sha:result.content.sha,commit:result.commit.sha};},
      async saveMedia(content,sha,uploads=[],progress=()=>{}){
        if(!credential)throw new Error('Önce GitHub hesabınızı bağlayın.');
        if(!sha)throw new Error('Önce güncel içerik dosyasını yükleyin.');
        if(uploads.length>20)throw new Error('Tek yayında en fazla 20 yeni fotoğraf ekleyebilirsiniz.');
        const seen=new Set();
        for(const file of uploads){
          if(!uploadPath.test(file.path)||seen.has(file.path)||!content.gallery?.some(p=>p.src===file.path)||typeof file.base64!=='string'||file.base64.length>1200000||!/^[A-Za-z0-9+/]+={0,2}$/.test(file.base64))throw new Error('Yükleme dosyası geçersiz.');
          const binary=atob(file.base64);if(binary.slice(0,4)!=='RIFF'||binary.slice(8,12)!=='WEBP')throw new Error('Yalnızca işlenmiş WebP fotoğrafları yayımlanabilir.');seen.add(file.path);
        }
        if((await request(contentPath+'?ref=main')).sha!==sha)throw Object.assign(new Error('Site siz düzenlerken değişti. Taslağınız korunuyor; üzerine yazılmadı. Güncel sürümle devam edin.'),{status:409});
        for(let i=0;i<uploads.length;i++){
          const file=uploads[i],path=repo+'/contents/dist/'+file.path;progress(i+1,uploads.length);
          let existing;
          try{existing=await request(path+'?ref=main');}catch(error){if(error.status!==404)throw error;}
          if(existing){if(existing.content?.replace(/\s/g,'')!==file.base64)throw new Error('Bu fotoğraf dosyası başka bir içerikle kayıtlı. Üzerine yazılmadı.');continue;}
          // Staged files are not referenced by the live gallery. Only the final
          // content commit starts deployment, after every photo is available.
          await request(path,'PUT',{message:'Stage hotel photo [skip ci]',content:file.base64,branch:'main'});
        }
        const result=await request(contentPath,'PUT',{message:'Update hotel gallery and content from admin panel',content:encode(JSON.stringify(content,null,2)+'\n'),sha,branch:'main'});
        return {sha:result.content.sha,commit:result.commit.sha};
      },
      async runs(){return (await request(runsPath)).workflow_runs||[];},
      logout(){credential='';}
    });
  }
  const api={create,encode,decode};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.GulplajGitHub=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);

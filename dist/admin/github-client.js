(function(root){
  'use strict';
  const repo='/repos/BatuhanIlhan99/gulplaj-hotel';
  const contentPath=repo+'/contents/dist/site-content.json';
  const runsPath=repo+'/actions/workflows/deploy-pages.yml/runs?branch=main&per_page=5';
  function encode(value){return btoa(Array.from(new TextEncoder().encode(value),b=>String.fromCharCode(b)).join(''));}
  function decode(value){return new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
  function create(token='',transport=fetch){
    let credential=token;
    async function request(path,method='GET',body){
      // Only these fixed GitHub endpoints may ever receive the in-memory credential.
      const allowed=(method==='GET'&&[repo,contentPath+'?ref=main',runsPath].includes(path))||(method==='PUT'&&path===contentPath);
      if(!allowed) throw new Error('Bu işlem desteklenmiyor.');
      if(method==='PUT'&&!credential) throw new Error('Önce GitHub hesabınızı bağlayın.');
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
      async read(){const file=await request(contentPath+'?ref=main');if(file.type!=='file'||file.encoding!=='base64'||!file.sha)throw new Error('İçerik dosyası okunamadı.');return {content:JSON.parse(decode(file.content)),sha:file.sha};},
      async save(content,sha){if(!sha)throw new Error('Önce güncel içerik dosyasını yükleyin.');const result=await request(contentPath,'PUT',{message:'Update hotel website content from admin panel',content:encode(JSON.stringify(content,null,2)+'\n'),sha,branch:'main'});return {sha:result.content.sha,commit:result.commit.sha};},
      async runs(){return (await request(runsPath)).workflow_runs||[];},
      logout(){credential='';}
    });
  }
  const api={create,encode,decode};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.GulplajGitHub=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);

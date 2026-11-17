import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const expectedPages=JSON.parse(fs.readFileSync('content/seo-pages.json','utf8')).length+1;

function runAudit(mode){
  const code=`
    import fs from 'node:fs';
    import path from 'node:path';
    globalThis.fetch=async input=>{
      const url=new URL(input),canonical='https://www.gulplajhotel.com';
      const alias=url.origin!==canonical;
      let file=path.join('dist',url.pathname);
      if(alias)file='dist/index.html';
      else if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      const missing=!fs.existsSync(file);
      let body=fs.readFileSync(missing?'dist/404.html':file,'utf8');
      if(${JSON.stringify(mode)}==='malformed'&&url.pathname==='/')body=body.replace(/<script type="application\\/ld\\+json">[\\s\\S]*?<\\/script>/,'<script type="application/ld+json">{"@graph":{}}</script>');
      if(${JSON.stringify(mode)}==='content-error'&&url.pathname==='/site-content.json')body='{}';
      return {status:missing?404:200,url:alias?canonical+'/':String(url),redirected:alias,headers:new Headers(),text:async()=>body};
    };
    await import('./scripts/audit-live-seo.mjs');
  `;
  const result=spawnSync(process.execPath,['--input-type=module','--eval',code],{encoding:'utf8'});
  assert.equal(result.stderr,'');
  return {status:result.status,report:JSON.parse(result.stdout)};
}

test('Live audit accepts a valid deployment including utility noindex pages and canonical redirects',()=>{
  const {status,report}=runAudit('valid');assert.equal(status,0);assert.equal(report.failed,0);assert.equal(report.informationPages,expectedPages);
});
test('Live audit reports malformed server responses as failures without crashing or hiding them',()=>{
  for(const mode of ['malformed','content-error']){
    const {status,report}=runAudit(mode);assert.equal(status,1);assert(report.failed>0);
    assert(report.failures.some(f=>mode==='malformed'?f.name==='Hotel and page structured data resolve':f.name==='Published managed content is readable'));
  }
});

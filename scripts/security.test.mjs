import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const github=require('../dist/admin/github-client.js');
const reply=body=>({ok:true,status:200,json:async()=>body});

test('Closing the login dialog cannot be undone by a late successful response',async()=>{
  const elements=new Map();
  function element(selector){
    if(!elements.has(selector))elements.set(selector,{value:'',open:false,events:{},addEventListener(type,fn){this.events[type]=fn;}});
    return elements.get(selector);
  }
  let finish,cleared=0,validations=0;
  const checking=new Promise(resolve=>{finish=resolve;});
  const context={
    document:{querySelector:element,querySelectorAll:()=>[]},
    window:{addEventListener(){},GulplajGitHub:{create:token=>token?{verify:()=>checking,read:async()=>({content:{}}),logout(){cleared++;}}:{logout(){}}},GulplajContent:{validate(){validations++;throw Error('Cancelled login must not reach content processing');}}},
    fetch:()=>new Promise(()=>{}),clearTimeout,setTimeout
  };
  vm.runInNewContext(fs.readFileSync('dist/admin/admin.js','utf8'),context);
  element('#login-dialog').open=true;element('#token').value='test-only';
  const login=element('#login-form').events.submit({preventDefault(){}});
  element('#login-dialog').open=false;element('#login-dialog').events.close();
  finish(true);await login;
  assert.equal(validations,0);
  assert(cleared>=1);
  assert.equal(element('#token').value,'');
  assert.equal(element('#login-submit').disabled,false);
});

test('Logout aborts an outstanding login, even if the transport ignores cancellation',async()=>{
  let finish,signal;
  const client=github.create('test-only',async(url,options)=>{signal=options.signal;return new Promise(resolve=>{finish=resolve;});});
  const checking=client.verify();
  client.logout();
  assert.equal(signal.aborted,true);
  finish(reply({full_name:'BatuhanIlhan99/gulplaj-hotel',permissions:{push:true}}));
  await assert.rejects(checking,{code:'SESSION_CLOSED'});
  await assert.rejects(client.save({},'sha'),/bağlayın/);
});

test('Logout during response parsing prevents later steps of a publication',async()=>{
  let parse,calls=0;
  const parsing=new Promise(resolve=>{parse=resolve;});
  const client=github.create('test-only',async()=>{calls++;return {ok:true,status:200,json:()=>parsing};});
  const publishing=client.saveMedia({gallery:[]},'current');
  await Promise.resolve();
  client.logout();parse({sha:'current'});
  await assert.rejects(publishing,{code:'SESSION_CLOSED'});
  assert.equal(calls,1,'No subsequent PUT may be sent');
});

test('Main and admin pages restrict injected code without allowing inline scripts',()=>{
  for(const name of ['index.html','admin/index.html']){
    const html=fs.readFileSync('dist/'+name,'utf8');
    const policy=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
    assert(policy, name+' needs CSP');
    for(const rule of ["default-src 'self'","script-src 'self'","object-src 'none'","base-uri 'none'","form-action 'none'"])assert(policy.split(';').map(v=>v.trim()).includes(rule));
    assert(!/unsafe-inline|unsafe-eval|frame-ancestors/.test(policy));
    assert(html.indexOf('Content-Security-Policy')<html.indexOf('<script'));
    for(const tag of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
      assert(!tag[2].trim(),'Inline executable scripts are blocked');
      const src=tag[1].match(/src="([^"]+)"/)?.[1];
      assert(src&&!/^(?:[a-z]+:|\/\/)/i.test(src),'Only local scripts are permitted');
    }
    assert(!/\son\w+\s*=|\sstyle\s*=|<style\b/i.test(html),'Inline handlers and styles must remain blocked');
  }
});

test('Published files contain no known credential formats or private configuration files',()=>{
  const patterns=[/github_pat_[A-Za-z0-9_]{20,}/,/gh[pousr]_[A-Za-z0-9]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\b(?:sk|rk)_live_[A-Za-z0-9]{16,}/,/AKIA[0-9A-Z]{16}/];
  function walk(directory){
    for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
      const file=path.join(directory,entry.name);
      assert(!/^(?:\.env(?:\..*)?|\.git|\.aws|credentials|id_rsa|id_ed25519)$/i.test(entry.name),'Private configuration must not be published: '+file);
      assert(!/\.(?:pem|key|p12|pfx|sqlite|bak)$/i.test(entry.name),'Private data file: '+file);
      if(entry.isDirectory())walk(file);
      else if(/\.(?:html|js|css|json|txt|xml|md|map)$/i.test(entry.name)){
        const text=fs.readFileSync(file,'utf8');
        assert(!patterns.some(pattern=>pattern.test(text)),'Possible credential in '+file);
      }
    }
  }
  walk('dist');
});

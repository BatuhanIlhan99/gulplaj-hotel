import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function element(){return {textContent:'',value:'',hidden:false,disabled:false,children:[],handlers:{},append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=[...nodes];},setAttribute(){},addEventListener(type,fn){this.handlers[type]=fn;}};}
test('Visitor measurement sends nothing before consent, respects rejection and omits query and personal referrer details',()=>{
  const nodes=[],storage=new Map(),sent=[],events={};
  const document={body:element(),referrer:'https://www.google.com/search?q=private+question',createElement(){const node=element();nodes.push(node);return node;}};
  const window={GULPLAJ_REPORT_CONFIG:{enabled:true,apiOrigin:'https://gulplaj-reports.test.workers.dev'},addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(fs.readFileSync('dist/visitor-metrics.js','utf8'),{window,document,URL,crypto,Date,navigator:{},location:{href:'https://www.gulplajhotel.com/odalar/?email=private@example.com',pathname:'/odalar/',origin:'https://www.gulplajhotel.com'},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},fetch:(url,options)=>{sent.push({url,options});return Promise.resolve({});}});
  assert.equal(sent.length,0);const accept=nodes.find(n=>n.textContent==='İzin ver'),reject=nodes.find(n=>n.textContent==='İzin verme');
  reject.handlers.click();events['gulplaj:booking-open']();assert.equal(sent.length,0);
  accept.handlers.click();assert.equal(sent.length,1);const payload=JSON.parse(sent[0].options.body);assert.equal(payload.path,'/odalar/');assert.equal(payload.referrer,'google');assert.equal(payload.kind,'page_view');assert(!sent[0].options.body.includes('private'));assert.equal(sent[0].options.credentials,'omit');
  events['gulplaj:booking-open']();assert.equal(JSON.parse(sent[1].options.body).kind,'booking_open');
  reject.handlers.click();events['gulplaj:booking-open']();assert.equal(sent.length,2);assert(!storage.has('gulplaj_daily_visitor'));
});

test('Logout clears report values and late server responses cannot reopen private reports',async()=>{
  const elements=new Map(),values=Array.from({length:8},element),callbacks={},calls=[];
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const document={getElementById:get,querySelectorAll:()=>values,createElement:element};
  let resolveReport;
  const transport=async(url,options)=>{calls.push({url,options});if(url.endsWith('/v1/login'))return {ok:true,status:200,json:async()=>({token:'a'.repeat(64),expiresAt:Date.now()+3600000})};if(url.includes('/v1/report?'))return new Promise(resolve=>{resolveReport=resolve;});return {ok:true,status:200,json:async()=>({ok:true})};};
  vm.runInNewContext(fs.readFileSync('dist/admin/reports.js','utf8'),{window:{GULPLAJ_REPORT_CONFIG:{enabled:true,apiOrigin:'https://gulplaj-reports.test.workers.dev'},addEventListener:(type,fn)=>callbacks[type]=fn},document,URL,URLSearchParams,Date,Intl,AbortController,fetch:transport,setInterval(){},setTimeout(){}});
  assert.equal(calls.length,0,'Financial data is not fetched before login');
  get('reports-password').value='test-password-for-ui-only';get('reports-channel').value='all';get('reports-currency').value='TRY';
  const pending=get('reports-login-form').handlers.submit({preventDefault(){}});
  for(let i=0;i<12&&!resolveReport;i++)await Promise.resolve();assert(resolveReport);assert.equal(get('reports-password').value,'');
  values[0].textContent='Sensitive value';get('reports-quality').textContent='Private metadata';
  await get('reports-lock').handlers.click();
  resolveReport({ok:true,status:200,json:async()=>({totals:{gross_minor:999999}})});await pending;
  assert(get('reports-private').hidden);assert(values.every(v=>v.textContent==='—'));assert.equal(get('reports-quality').textContent,'');assert(get('reports-export').disabled);
  assert(calls.filter(c=>c.options.headers.Authorization).every(c=>c.options.headers.Authorization==='Bearer '+'a'.repeat(64)));
});

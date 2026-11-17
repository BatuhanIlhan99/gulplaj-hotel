import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const bridge = fs.readFileSync('dist/hotelrunner-bridge.js', 'utf8');
function mount(overrides = {},preview=false) {
  const frameEvents={},backEvents={},classes=new Set();
  const frame = {contentWindow:{},contentDocument:{},style:{},hidden:false,addEventListener:(type,fn)=>{frameEvents[type]=fn;}};
  const status = {hidden:false,textContent:''};
  const link = {hidden:true};
  const back={hidden:true,addEventListener:(type,fn)=>{backEvents[type]=fn;}};
  const heading={},description={};
  const layout={classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)},scrollIntoView(){}};
  const section={classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)}};
  const shell={open:true,classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)},close(){this.open=false;},show(){this.open=true;},showModal(){this.open=true;},addEventListener(){}};
  const timers = [],measurements=[];
  let listener;
  const context = {
    URL,Event, location:{href:'https://www.gulplajhotel.com/'+(preview?'?admin-preview=1':''),origin:'https://www.gulplajhotel.com'},
    document:{getElementById:id=>({'hotelrunner-frame':frame,'hotelrunner-status':status,'provider-booking':link,'booking-back':back,'booking-card-title':heading,'booking-card-description':description,'rezervasyon':section,'booking-shell':shell}[id]),querySelector:()=>layout},
    window:{GULPLAJ_BOOKING_CONFIG:{provider:'hotelrunner',bookingUrl:'https://gulplaj-hotel.hotelrunner.com/bv3?locale=tr&currency=TRY',widgetPage:'./hotelrunner-search.html',...overrides},addEventListener:(_type,fn)=>{listener=fn;},dispatchEvent:event=>measurements.push(event.type)},
    setTimeout:fn=>timers.push(fn)
  };
  vm.runInNewContext(bridge, context);
  return {frame,status,link,timers,back,heading,description,classes,measurements,load:()=>frameEvents.load(),reset:()=>backEvents.click(),send:message=>listener?.({source:frame.contentWindow,origin:context.location.origin,data:message}),raw:event=>listener?.(event)};
}
test('Loads the official search and keeps the fallback on our own website',()=>{
  const app=mount();
  assert.equal(app.frame.src,'https://www.gulplajhotel.com/hotelrunner-search.html');
  assert.equal(app.link.href,'https://www.gulplajhotel.com/rezervasyon/');
  assert.equal(app.link.hidden,false);
  app.timers.forEach(fn=>fn());
  assert.match(app.status.textContent,/rezervasyon ekranını/);
});

test('Provider navigation expands the existing frame without claiming confirmation and reset restores search',()=>{
  const app=mount();app.load();assert.equal(app.classes.has('is-booking'),false);
  app.frame.contentDocument=null;app.load();
  app.load();assert.deepEqual(app.measurements,['gulplaj:booking-open'],'An engine opening is measured once, never as a completed reservation');
  assert.equal(app.classes.has('is-booking'),true);assert.equal(app.classes.has('is-expanded'),true);assert.equal(app.frame.style.height,'100%');assert.equal(app.back.hidden,false);
  assert(!/onaylandı|kesinleşti/i.test(app.heading.textContent+' '+app.description.textContent));
  app.send({type:'gulplaj:hotelrunner',state:'ready',height:195});assert.equal(app.frame.style.height,'100%','Stale search messages must not shrink the checkout');
  app.reset();assert.equal(app.classes.has('is-booking'),false);assert.equal(app.back.hidden,true);assert.equal(app.frame.src,'https://www.gulplajhotel.com/hotelrunner-search.html');
});

test('Guest booking cannot navigate the top window or open a new booking tab',()=>{
  const html=fs.readFileSync('dist/index.html','utf8'),page=fs.readFileSync('dist/rezervasyon/index.html','utf8');
  for(const document of [html,page]){
    const sandbox=document.match(/<iframe[^>]*sandbox="([^"]+)"/)?.[1];assert(sandbox?.includes('allow-forms'));
    assert(!/allow-top-navigation|allow-popups/.test(sandbox));
    assert(document.includes('https://gulplaj-hotel.hotelrunner.com'),'Only the property engine is allowed by CSP');
  }
  const search=fs.readFileSync('dist/hotelrunner-frame.js','utf8');
  assert(search.includes("window.open_how = '_self'"));assert(!search.includes('window.top.location'));
  const fallback=html.match(/<a id="provider-booking"[^>]+>/)?.[0];assert(fallback.includes('href="./rezervasyon/"'));assert(!fallback.includes('target='));
});

test('Admin draft previews never load the live search or booking engine',()=>{
  const app=mount({},true);assert.equal(app.frame.hidden,true);assert.equal(app.frame.src,undefined);assert.match(app.status.textContent,/Taslak/);
});

test('Standalone booking only embeds the verified HTTPS property and never invents a confirmation',()=>{
  const source=fs.readFileSync('dist/booking-page.js','utf8');
  function run(url){
    const status={hidden:false,textContent:''},frame={hidden:false,addEventListener(type,fn){this[type]=fn;}};
    vm.runInNewContext(source,{URL,window:{GULPLAJ_BOOKING_CONFIG:{bookingUrl:url}},document:{getElementById:id=>id==='booking-engine'?frame:status}});
    return {frame,status};
  }
  for(const url of ['http://gulplaj-hotel.hotelrunner.com/bv3','https://example.com/','https://gulplaj-hotel.hotelrunner.com.evil.example/','https://user:pass@gulplaj-hotel.hotelrunner.com/','javascript:alert(1)']){
    const app=run(url);assert.equal(app.frame.src,undefined);assert.equal(app.frame.hidden,true);assert.match(app.status.textContent,/açılamıyor/);
  }
  const url='https://gulplaj-hotel.hotelrunner.com/bv3?locale=tr&currency=TRY',app=run(url);
  assert.equal(app.frame.src,url);app.frame.load();assert.equal(app.status.hidden,true);assert(!/onaylandı|kesinleşti/i.test(app.status.textContent));
});
test('Rejects insecure, credential-bearing or different-property booking destinations',()=>{
  for(const bookingUrl of ['http://gulplaj-hotel.hotelrunner.com/bv3','https://user:password@gulplaj-hotel.hotelrunner.com/','https://example.com/','https://gulplaj-hotel.hotelrunner.com.example.com/']) {
    const app=mount({bookingUrl});
    assert.equal(app.frame.hidden,true);
    assert.equal(app.link.hidden,true);
  }
});
test('Ignores messages from other windows and origins',()=>{
  const app=mount();
  app.raw({source:{},origin:'https://www.gulplajhotel.com',data:{type:'gulplaj:hotelrunner',state:'ready',height:600}});
  app.raw({source:app.frame.contentWindow,origin:'https://example.com',data:{type:'gulplaj:hotelrunner',state:'ready',height:600}});
  assert.equal(app.status.hidden,false);
  assert.equal(app.frame.style.height,undefined);
});
test('Expands for calendars, bounds frame size and keeps failure recovery visible',()=>{
  const app=mount();
  app.send({type:'gulplaj:hotelrunner',state:'ready',height:640});
  assert.equal(app.status.hidden,true);
  assert.equal(app.frame.style.height,'640px');
  app.send({type:'gulplaj:hotelrunner',state:'ready',height:100000});
  assert.equal(app.frame.style.height,'1800px');
  app.send({type:'gulplaj:hotelrunner',state:'unavailable',height:0});
  assert.equal(app.frame.style.height,'150px');
  assert.equal(app.status.hidden,false);
  assert.equal(app.link.hidden,false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const bridge = fs.readFileSync('dist/hotelrunner-bridge.js', 'utf8');
function mount(overrides = {}) {
  const frame = {contentWindow:{},style:{},hidden:false};
  const status = {hidden:false,textContent:''};
  const link = {hidden:true};
  const timers = [];
  let listener;
  const context = {
    URL, location:{href:'https://www.gulplajhotel.com/',origin:'https://www.gulplajhotel.com'},
    document:{getElementById:id=>({'hotelrunner-frame':frame,'hotelrunner-status':status,'provider-booking':link}[id])},
    window:{GULPLAJ_BOOKING_CONFIG:{provider:'hotelrunner',bookingUrl:'https://gulplaj-hotel.hotelrunner.com/bv3?locale=tr&currency=TRY',widgetPage:'./hotelrunner-search.html',...overrides},addEventListener:(_type,fn)=>{listener=fn;}},
    setTimeout:fn=>timers.push(fn)
  };
  vm.runInNewContext(bridge, context);
  return {frame,status,link,timers,send:message=>listener?.({source:frame.contentWindow,origin:context.location.origin,data:message}),raw:event=>listener?.(event)};
}
test('Loads the property-specific frame and retains a direct secure fallback',()=>{
  const app=mount();
  assert.equal(app.frame.src,'https://www.gulplajhotel.com/hotelrunner-search.html');
  assert.equal(new URL(app.link.href).hostname,'gulplaj-hotel.hotelrunner.com');
  assert.equal(app.link.hidden,false);
  app.timers.forEach(fn=>fn());
  assert.match(app.status.textContent,/doğrudan/);
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
  assert.equal(app.frame.style.height,'260px');
  assert.equal(app.status.hidden,false);
  assert.equal(app.link.hidden,false);
});

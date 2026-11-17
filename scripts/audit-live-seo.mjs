// Read-only audit of the deployed site. Run from the repository root with Node 22+.
// An optional output filename records the result; no credentials or cookies are used.
import fs from 'node:fs';
import {origin,phoneHref} from './seo-core.mjs';

const pages=JSON.parse(fs.readFileSync('content/seo-pages.json','utf8'));
const paths=['/',...pages.map(p=>'/'+p.slug+'/')];
const checks=[];
const check=(scope,name,passed,detail='')=>checks.push({scope,name,passed:Boolean(passed),...(detail?{detail}: {})});
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const requests=new Map();
async function get(url){
  if(!requests.has(url))requests.set(url,(async()=>{
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'GulplajSiteAudit/1.0'}});
      return {status:response.status,url:response.url,redirected:response.redirected,headers:response.headers,body:await response.text()};
    }catch(error){return {status:0,url,body:'',headers:new Headers(),error:error.message};}
  })());
  return requests.get(url);
}
async function batch(items,fn){
  for(let i=0;i<items.length;i+=4)await Promise.all(items.slice(i,i+4).map(fn));
}
const contentResponse=await get(origin+'/site-content.json');
let data;
try{
  const candidate=JSON.parse(contentResponse.body);
  if(Array.isArray(candidate.gallery)&&['phone','address','checkIn','checkOut'].every(key=>typeof candidate[key]==='string'))data=candidate;
}catch{}
check('/site-content.json','Published managed content is readable',contentResponse.status===200&&Array.isArray(data?.gallery));
const titles=new Set(),descriptions=new Set();
await batch(paths,async route=>{
  const response=await get(origin+route),html=response.body;
  check(route,'HTTP 200',response.status===200,response.error||String(response.status));
  check(route,'Final address uses canonical HTTPS URL',response.url===origin+route);
  const canonicals=[...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/g)];
  check(route,'One matching canonical',canonicals.length===1&&decode(canonicals[0][1])===origin+route);
  const title=html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const description=html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/)?.[1];
  check(route,'Unique nonempty title',title?.trim()&&!titles.has(title));titles.add(title);
  check(route,'Unique nonempty search description',description?.trim()&&!descriptions.has(description));descriptions.add(description);
  check(route,'Exactly one H1',[...html.matchAll(/<h1\b/g)].length===1);
  check(route,'No accidental noindex',!/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html)&&!/noindex/i.test(response.headers.get('x-robots-tag')||''));
  let graph;
  try{
    const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if(blocks.length===1)graph=JSON.parse(blocks[0][1])['@graph'];
    if(!Array.isArray(graph))graph=undefined;
  }catch{}
  const hotel=graph?.find(item=>item['@type']==='Hotel');
  check(route,'Hotel and page structured data resolve',hotel&&graph?.some(item=>item['@type']==='WebPage'&&item.url===origin+route));
  if(data&&hotel){
    check(route,'Phone matches published hotel content',hotel.telephone===phoneHref(data.phone).slice(4));
    check(route,'Address matches published hotel content',hotel.address?.streetAddress===data.address.split('\n')[0]);
    check(route,'Check-in and check-out match published content',hotel.checkinTime===data.checkIn+':00'&&hotel.checkoutTime===data.checkOut+':00');
  }
  if(route==='/')check(route,'Google ownership verification preserved',/name="google-site-verification" content="[^\"]+"/.test(html));
  else check(route,'Information navigation rendered in HTML',html.includes('id="page-contents"'));
  if(route==='/fotograflar/'&&data){
    const list=graph?.find(item=>item['@type']==='WebPage')?.mainEntity;
    check(route,'Visible photo cards match managed gallery',[...html.matchAll(/<figure><a href=/g)].length===data.gallery.length);
    check(route,'Image list matches managed gallery',list?.numberOfItems===data.gallery.length&&list?.itemListElement?.length===data.gallery.length);
  }
});
await batch(['/admin/','/hotelrunner-search.html','/rezervasyon/'],async route=>{
  const response=await get(origin+route);
  check(route,'Utility page is reachable and excluded from indexing',response.status===200&&/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(response.body));
});
const missing=await get(origin+'/_seo-audit-missing-page/');
check('404','Unknown URL returns a real 404',missing.status===404,String(missing.status));
check('404','Error page has noindex',/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(missing.body));
const sitemap=await get(origin+'/sitemap.xml');
const locations=[...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1]));
check('sitemap','Exactly the expected canonical information pages',sitemap.status===200&&JSON.stringify([...locations].sort())===JSON.stringify(paths.map(p=>origin+p).sort()));
const robots=await get(origin+'/robots.txt');
check('robots','Robots references canonical sitemap',robots.status===200&&robots.body.includes('Sitemap: '+origin+'/sitemap.xml'));
check('robots','No site-wide robots exclusion',!/^Disallow:\s*\/\*?\s*$/mi.test(robots.body));
await batch(['http://www.gulplajhotel.com/','https://gulplajhotel.com/','https://batuhanilhan99.github.io/gulplaj-hotel/'],async url=>{
  const response=await get(url);
  check(url,'Alternate address redirects to the HTTPS home page',response.status===200&&response.redirected&&response.url===origin+'/',response.url);
});
checks.sort((a,b)=>(a.scope+' '+a.name).localeCompare(b.scope+' '+b.name));
const failed=checks.filter(item=>!item.passed);
const report={checkedAt:new Date().toISOString(),site:origin,informationPages:paths.length,requests:requests.size,passed:checks.length-failed.length,failed:failed.length,checks,limitations:['HTTP and HTML checks do not prove Google indexing or ranking.','This audit does not create reservations or test payment transactions.']};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({site:origin,informationPages:paths.length,passed:report.passed,failed:report.failed,failures:failed},null,2));
process.exitCode=failed.length?1:0;

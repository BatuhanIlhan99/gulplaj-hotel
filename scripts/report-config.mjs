import fs from 'node:fs';
import {createHash} from 'node:crypto';
export const reportConfig=JSON.parse(fs.readFileSync(new URL('../reporting/deployment.json',import.meta.url),'utf8'));
if(reportConfig.apiOrigin){const url=new URL(reportConfig.apiOrigin);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash||!(/^gulplaj-reports\.[a-z0-9-]+\.workers\.dev$/.test(url.hostname)||url.hostname==='api.gulplajhotel.com'))throw Error('Unexpected reporting origin');reportConfig.apiOrigin=url.origin;}
if(reportConfig.enabled&&!reportConfig.apiOrigin)throw Error('Reporting requires a deployed backend');
export const reportConnect=reportConfig.apiOrigin?' '+reportConfig.apiOrigin:'';
export const configVersion=createHash('sha256').update(JSON.stringify(reportConfig)).digest('hex').slice(0,8);
export const metricsHead=prefix=>`<link rel="stylesheet" href="${prefix}visitor-metrics.css?v=2"><script src="${prefix}report-config.js?v=${configVersion}" defer></script><script src="${prefix}visitor-metrics.js?v=1" defer></script>`;
export function prepareReportConfig(){
  fs.writeFileSync('dist/report-config.js','window.GULPLAJ_REPORT_CONFIG=Object.freeze('+JSON.stringify(reportConfig)+');\n');
  let admin=fs.readFileSync('dist/admin/index.html','utf8');
  admin=admin.replace(/connect-src 'self' https:\/\/api\.github\.com[^;]*/,"connect-src 'self' https://api.github.com"+reportConnect);
  admin=admin.replace(/src="\.\.\/report-config\.js\?v=[^"]*"/,`src="../report-config.js?v=${configVersion}"`);
  fs.writeFileSync('dist/admin/index.html',admin);
}

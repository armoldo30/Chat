import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AD_CONFIG, validAdSenseClient } from '../src/ad-config.js';
import BUILTIN_1192 from '../src/builtin1192.js';
import { applyPerformancePatch } from './performance-patch-v2.mjs';
import { materializedRuntimePackModule, rewriteMainForMaterializedPack } from './materialize-runtime-pack.mjs';

const root=resolve(import.meta.dirname,'..');
const dist=resolve(root,'dist');
const buildToken=String(process.env.GITHUB_SHA||process.env.GITHUB_RUN_ID||'dev').slice(0,16);
const publicFiles=['index.html','division-counter.html','tank-designer.html','air-lab.html','division-gauntlet.html','guides.html','methodology.html','about.html','privacy.html','ads.txt'];
const publicHtmlFiles=publicFiles.filter(file=>file.endsWith('.html'));
const GOOGLE_ANALYTICS_ID='G-QYF9SQFM4V';
const googleAnalyticsSnippet=`  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GOOGLE_ANALYTICS_ID}', { send_page_view: false });
    function hoi4AnalyticsPageView(){
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search + window.location.hash
      });
    }
    hoi4AnalyticsPageView();
    window.addEventListener('hashchange', hoi4AnalyticsPageView);
  </script>`;

await rm(dist,{recursive:true,force:true});
await mkdir(resolve(dist,'src'),{recursive:true});
for(const file of publicFiles){
  await cp(resolve(root,file),resolve(dist,file));
}
await cp(resolve(root,'src'),resolve(dist,'src'),{recursive:true});
for(const file of ['CNAME','robots.txt']){
  try{await cp(resolve(root,file),resolve(dist,file));}
  catch(err){if(err?.code!=='ENOENT')throw err;}
}
try{await cp(resolve(root,'sitemap.xml'),resolve(dist,'sitemap.xml'));}
catch(err){if(err?.code!=='ENOENT')throw err;}

for(const file of publicHtmlFiles){
  const pagePath=resolve(dist,file);
  let page=await readFile(pagePath,'utf8');
  if(!page.includes(GOOGLE_ANALYTICS_ID)){
    if(!page.includes('</head>'))throw new Error(`Cannot install Google Analytics: ${file} has no </head>`);
    page=page.replace('</head>',`${googleAnalyticsSnippet}\n</head>`);
  }
  await writeFile(pagePath,page);
}

const mainPath=resolve(dist,'src','main.js');
const runtimePackPath=resolve(dist,'src','builtin1192-runtime.js');
const runtimePackModule=materializedRuntimePackModule(BUILTIN_1192);
await writeFile(runtimePackPath,runtimePackModule);
const runtimeMain=rewriteMainForMaterializedPack(await readFile(mainPath,'utf8'));
await writeFile(mainPath,applyPerformancePatch(runtimeMain));

const configuredClient=validAdSenseClient(AD_CONFIG.client)?AD_CONFIG.client:'';
if(configuredClient){
  const publisher=configuredClient.replace(/^ca-/, '');
  await writeFile(resolve(dist,'ads.txt'),`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`);
}

const indexPath=resolve(dist,'index.html');
let html=await readFile(indexPath,'utf8');
const accountMeta=configuredClient?`<meta name="google-adsense-account" content="${configuredClient}">`:'';
html=html.replace('<!-- ADSENSE_ACCOUNT_META -->',accountMeta);
await writeFile(indexPath,html);

function addVersion(url){
  return `${url}${url.includes('?')?'&':'?'}v=${buildToken}`;
}
function versionHtmlAssets(text){
  return text.replace(/((?:src|href)=["'])(\.\/src\/[^"'?#]+\.(?:js|css))(["'])/g,(_,lead,url,tail)=>`${lead}${addVersion(url)}${tail}`);
}
function versionModuleImports(text){
  const rewrite=(match,lead,url,tail)=>`${lead}${addVersion(url)}${tail}`;
  return text
    .replace(/(\bfrom\s*["'])(\.{1,2}\/[^"'?#]+\.js)(["'])/g,rewrite)
    .replace(/(\bimport\s*["'])(\.{1,2}\/[^"'?#]+\.js)(["'])/g,rewrite)
    .replace(/(\bimport\s*\(\s*["'])(\.{1,2}\/[^"'?#]+\.js)(["']\s*\))/g,rewrite);
}
async function walk(dir){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=resolve(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(path));else out.push(path);
  }
  return out;
}

for(const path of await walk(dist)){
  if(path.endsWith('.html'))await writeFile(path,versionHtmlAssets(await readFile(path,'utf8')));
  else if(path.endsWith('.js'))await writeFile(path,versionModuleImports(await readFile(path,'utf8')));
}

const builtIndex=await readFile(indexPath,'utf8');
const builtMain=await readFile(mainPath,'utf8');
const builtRuntimePack=await readFile(runtimePackPath,'utf8');
if(!builtIndex.includes(`./src/main.js?v=${buildToken}`))throw new Error('Build cache-busting did not version main.js');
if(!builtIndex.includes(`./src/counter-analysis-ui.js?v=${buildToken}`))throw new Error('Build cache-busting did not version Counter Analysis UI');
if(!builtIndex.includes(`googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`))throw new Error('Build did not install Google Analytics');
for(const file of publicHtmlFiles){
  const page=await readFile(resolve(dist,file),'utf8');
  if(!page.includes(GOOGLE_ANALYTICS_ID))throw new Error(`Google Analytics missing from ${file}`);
}
if(!builtMain.includes(`./builtin1192-runtime.js?v=${buildToken}`))throw new Error('Build did not route main.js through the materialized 1.19.2 runtime pack');
if(builtMain.includes("./builtin1192.js"))throw new Error('Build still references the source-time 1.19.2 reconstruction module');
if(builtRuntimePack.includes('builtin1192raw/')||builtRuntimePack.includes('JSON.parse(text)'))throw new Error('Materialized runtime pack unexpectedly contains the raw reconstruction path');
console.log(`Built static site in dist/ with asset token ${buildToken}; materialized 1.19.2 runtime pack ${Buffer.byteLength(runtimePackModule)} bytes; GA4 ${GOOGLE_ANALYTICS_ID} installed on ${publicHtmlFiles.length} pages.`);

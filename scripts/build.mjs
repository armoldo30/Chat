import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AD_CONFIG, validAdSenseClient } from '../src/ad-config.js';
import { applyPerformancePatch } from './performance-patch-v2.mjs';

const root=resolve(import.meta.dirname,'..');
const dist=resolve(root,'dist');
const buildToken=String(process.env.GITHUB_SHA||process.env.GITHUB_RUN_ID||'dev').slice(0,16);
await rm(dist,{recursive:true,force:true});
await mkdir(resolve(dist,'src'),{recursive:true});
for(const file of ['index.html','guides.html','methodology.html','about.html','privacy.html','ads.txt']){
  await cp(resolve(root,file),resolve(dist,file));
}
await cp(resolve(root,'src'),resolve(dist,'src'),{recursive:true});
for(const file of ['CNAME','robots.txt']){
  try{await cp(resolve(root,file),resolve(dist,file));}
  catch(err){if(err?.code!=='ENOENT')throw err;}
}
try{await cp(resolve(root,'sitemap.xml'),resolve(dist,'sitemap.xml'));}
catch(err){if(err?.code!=='ENOENT')throw err;}

const mainPath=resolve(dist,'src','main.js');
await writeFile(mainPath,applyPerformancePatch(await readFile(mainPath,'utf8')));

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
if(!builtIndex.includes(`./src/main.js?v=${buildToken}`))throw new Error('Build cache-busting did not version main.js');
if(!builtIndex.includes(`./src/counter-analysis-ui.js?v=${buildToken}`))throw new Error('Build cache-busting did not version Counter Analysis UI');
console.log(`Built static site in dist/ with asset token ${buildToken}.`);

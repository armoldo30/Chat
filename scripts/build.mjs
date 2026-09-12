import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AD_CONFIG, validAdSenseClient } from '../src/ad-config.js';
import { applyPerformancePatch } from './performance-patch-v2.mjs';

const root=resolve(import.meta.dirname,'..');
const dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});
await mkdir(resolve(dist,'src'),{recursive:true});
await cp(resolve(root,'index.html'),resolve(dist,'index.html'));
await cp(resolve(root,'privacy.html'),resolve(dist,'privacy.html'));
await cp(resolve(root,'ads.txt'),resolve(dist,'ads.txt'));
await cp(resolve(root,'src'),resolve(dist,'src'),{recursive:true});
for(const file of ['CNAME','robots.txt']){
  try{await cp(resolve(root,file),resolve(dist,file));}
  catch(err){if(err?.code!=='ENOENT')throw err;}
}

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
const verificationScript=configuredClient?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${configuredClient}" crossorigin="anonymous"></script>`:'';
html=html.replace('<!-- ADSENSE_ACCOUNT_META -->',[accountMeta,verificationScript].filter(Boolean).join('\n  '));
await writeFile(indexPath,html);
console.log('Built static site in dist/');

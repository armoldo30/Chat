import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AD_CONFIG, validAdSenseClient } from '../src/ad-config.js';

const root=resolve(import.meta.dirname,'..');
const dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});
await mkdir(resolve(dist,'src'),{recursive:true});
await cp(resolve(root,'index.html'),resolve(dist,'index.html'));
await cp(resolve(root,'privacy.html'),resolve(dist,'privacy.html'));
await cp(resolve(root,'ads.txt'),resolve(dist,'ads.txt'));
await cp(resolve(root,'src'),resolve(dist,'src'),{recursive:true});

const indexPath=resolve(dist,'index.html');
let html=await readFile(indexPath,'utf8');
const accountMeta=validAdSenseClient(AD_CONFIG.client)?`<meta name="google-adsense-account" content="${AD_CONFIG.client}">`:'';
html=html.replace('<!-- ADSENSE_ACCOUNT_META -->',accountMeta);
await writeFile(indexPath,html);
console.log('Built static site in dist/');

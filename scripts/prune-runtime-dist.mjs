import { readFile, readdir, rm } from 'node:fs/promises';
import { dirname, extname, posix, relative, resolve, sep } from 'node:path';

function toPosix(path){return path.split(sep).join('/');}
function stripQueryHash(url){return String(url||'').split('#',1)[0].split('?',1)[0];}
function resolveRelative(fromFile,spec){
  const clean=stripQueryHash(spec);
  if(!clean.endsWith('.js'))return null;
  if(clean.startsWith('/'))return clean.replace(/^\/+/, '');
  if(!clean.startsWith('./')&&!clean.startsWith('../'))return null;
  return posix.normalize(posix.join(posix.dirname(fromFile),clean));
}
async function walk(dir){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=resolve(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(path));
    else out.push(path);
  }
  return out;
}
function jsRefs(text){
  const refs=new Set();
  const patterns=[
    /(?:src|href)=["']([^"']+\.js(?:[?#][^"']*)?)["']/g,
    /["']((?:\.{1,2}\/|\/)[^"'\n\r]+\.js(?:[?#][^"'\n\r]*)?)["']/g
  ];
  for(const pattern of patterns){
    for(const match of text.matchAll(pattern))refs.add(match[1]);
  }
  return refs;
}

export async function pruneUnreachableRuntimeJs(distRoot){
  const all=await walk(distRoot);
  const htmlFiles=all.filter(path=>extname(path)==='.html');
  const allJs=all.filter(path=>extname(path)==='.js');
  const existing=new Set(allJs.map(path=>toPosix(relative(distRoot,path))));
  const keep=new Set();
  const queue=[];

  for(const htmlPath of htmlFiles){
    const rel=toPosix(relative(distRoot,htmlPath));
    const text=await readFile(htmlPath,'utf8');
    for(const ref of jsRefs(text)){
      const resolved=resolveRelative(rel,ref);
      if(resolved&&existing.has(resolved)&&!keep.has(resolved)){
        keep.add(resolved);queue.push(resolved);
      }
    }
  }

  while(queue.length){
    const rel=queue.shift();
    const path=resolve(distRoot,rel);
    const text=await readFile(path,'utf8');
    for(const ref of jsRefs(text)){
      const resolved=resolveRelative(rel,ref);
      if(!resolved)continue;
      if(!existing.has(resolved))throw new Error(`Runtime JS reference missing from dist: ${rel} -> ${ref}`);
      if(!keep.has(resolved)){keep.add(resolved);queue.push(resolved);}
    }
  }

  if(!keep.has('src/main.js'))throw new Error('Runtime prune graph did not retain src/main.js');
  if(!keep.has('src/builtin1193-runtime.js'))throw new Error('Runtime prune graph did not retain the materialized 1.19.3 pack');

  const removed=[];
  for(const path of allJs){
    const rel=toPosix(relative(distRoot,path));
    if(keep.has(rel))continue;
    await rm(path,{force:true});
    removed.push(rel);
  }

  if(existing.has('src/builtin1192raw/r01.js')&&!removed.includes('src/builtin1192raw/r01.js')){
    throw new Error('Runtime prune unexpectedly retained raw 1.19.2 source chunks');
  }

  return {before:allJs.length,after:keep.size,removed};
}

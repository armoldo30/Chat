const SOURCE_IMPORT="import BUILTIN_1192 from './builtin1192.js';";
const RUNTIME_IMPORT="import BUILTIN_1192 from './builtin1192-runtime.js';";

function replaceExactlyOnce(source,needle,replacement,label){
  const text=String(source),first=text.indexOf(needle);
  if(first<0)throw new Error(`Runtime-pack materialization could not find ${label}.`);
  if(text.indexOf(needle,first+needle.length)>=0)throw new Error(`Runtime-pack materialization found ${label} more than once.`);
  return text.slice(0,first)+replacement+text.slice(first+needle.length);
}

function assertJsonSafe(value){
  const seen=new Set();
  const visit=(item,path)=>{
    if(item===null||typeof item==='string'||typeof item==='boolean')return;
    if(typeof item==='number'){
      if(!Number.isFinite(item))throw new Error(`Runtime pack contains a non-finite number at ${path}.`);
      return;
    }
    if(typeof item!=='object')throw new Error(`Runtime pack contains unsupported ${typeof item} at ${path}.`);
    if(seen.has(item))throw new Error(`Runtime pack contains a circular reference at ${path}.`);
    seen.add(item);
    if(Array.isArray(item))item.forEach((entry,index)=>visit(entry,`${path}[${index}]`));
    else for(const [key,entry] of Object.entries(item))visit(entry,`${path}.${key}`);
    seen.delete(item);
  };
  visit(value,'BUILTIN_1192');
}

export function materializedRuntimePackModule(pack){
  assertJsonSafe(pack);
  const serialized=JSON.stringify(pack).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return `// Generated at build time from the certified source pack. Do not edit.\nexport const RUNTIME_PACK_FORMAT=1;\nconst BUILTIN_1192=${serialized};\nexport default BUILTIN_1192;\n`;
}

export function rewriteMainForMaterializedPack(source){
  return replaceExactlyOnce(source,SOURCE_IMPORT,RUNTIME_IMPORT,'BUILTIN_1192 source import');
}

export const RUNTIME_PACK_SOURCE_IMPORT=SOURCE_IMPORT;
export const RUNTIME_PACK_DIST_IMPORT=RUNTIME_IMPORT;

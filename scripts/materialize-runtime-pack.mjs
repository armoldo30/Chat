const SOURCE_IMPORT="import BUILTIN_1192 from './builtin1192.js';";
const RUNTIME_IMPORT="import BUILTIN_1192 from './builtin1192-runtime.js';";

function replaceExactlyOnce(source,needle,replacement,label){
  const text=String(source),first=text.indexOf(needle);
  if(first<0)throw new Error(`Runtime-pack materialization could not find ${label}.`);
  if(text.indexOf(needle,first+needle.length)>=0)throw new Error(`Runtime-pack materialization found ${label} more than once.`);
  return text.slice(0,first)+replacement+text.slice(first+needle.length);
}

function stringLiteral(value){
  return JSON.stringify(value).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
}

function serializeLiteral(value,path='BUILTIN_1192',seen=new Set()){
  if(value===undefined)return 'undefined';
  if(value===null)return 'null';
  if(typeof value==='string')return stringLiteral(value);
  if(typeof value==='boolean')return value?'true':'false';
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new Error(`Runtime pack contains a non-finite number at ${path}.`);
    return Object.is(value,-0)?'-0':String(value);
  }
  if(typeof value!=='object')throw new Error(`Runtime pack contains unsupported ${typeof value} at ${path}.`);
  if(seen.has(value))throw new Error(`Runtime pack contains a circular reference at ${path}.`);
  if(Object.getOwnPropertySymbols(value).length)throw new Error(`Runtime pack contains symbol properties at ${path}.`);
  seen.add(value);
  try{
    if(Array.isArray(value)){
      const extraKeys=Object.keys(value).filter(key=>!(/^(?:0|[1-9]\d*)$/.test(key)&&Number(key)<value.length));
      if(extraKeys.length)throw new Error(`Runtime pack array contains extra properties at ${path}: ${extraKeys.join(', ')}.`);
      const parts=Array.from({length:value.length},(_,index)=>Object.prototype.hasOwnProperty.call(value,index)?serializeLiteral(value[index],`${path}[${index}]`,seen):'');
      let body=parts.join(',');
      if(value.length&&!Object.prototype.hasOwnProperty.call(value,value.length-1))body+=',';
      return `[${body}]`;
    }
    const proto=Object.getPrototypeOf(value);
    if(proto!==Object.prototype&&proto!==null)throw new Error(`Runtime pack contains unsupported object prototype at ${path}.`);
    const entries=Object.entries(value).map(([key,item])=>{
      const property=key==='__proto__'?`[${stringLiteral(key)}]`:stringLiteral(key);
      return `${property}:${serializeLiteral(item,`${path}.${key}`,seen)}`;
    });
    const literal=`{${entries.join(',')}}`;
    return proto===null?`Object.assign(Object.create(null),${literal})`:literal;
  }finally{
    seen.delete(value);
  }
}

export function materializedRuntimePackModule(pack){
  const serialized=serializeLiteral(pack);
  return `// Generated at build time from the certified source pack. Do not edit.\nexport const RUNTIME_PACK_FORMAT=1;\nconst BUILTIN_1192=${serialized};\nexport default BUILTIN_1192;\n`;
}

export function rewriteMainForMaterializedPack(source){
  return replaceExactlyOnce(source,SOURCE_IMPORT,RUNTIME_IMPORT,'BUILTIN_1192 source import');
}

export const RUNTIME_PACK_SOURCE_IMPORT=SOURCE_IMPORT;
export const RUNTIME_PACK_DIST_IMPORT=RUNTIME_IMPORT;

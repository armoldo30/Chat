import BASE_1192 from '../builtin1192/localization-english-1192.js';
import p01 from './localization-relevant-01.js';
import p02 from './localization-relevant-02.js';
import p03 from './localization-relevant-03.js';
import p04 from './localization-relevant-04.js';
import p05 from './localization-relevant-05.js';
import p06 from './localization-relevant-06.js';

const raw=Object.assign({},BASE_1192,p01,p02,p03,p04,p05,p06);
const TOKEN=/\$([^$]+)\$/g;
const memo=new Map();

function resolveKey(key,stack=new Set()){
  if(memo.has(key))return memo.get(key);
  const source=raw[key];
  if(typeof source!=='string')return source;
  if(stack.has(key))return source;
  const next=new Set(stack);next.add(key);
  const resolved=source.replace(TOKEN,(token,ref)=>{
    const value=resolveKey(ref,next);
    return typeof value==='string'&&value!==token?value:token;
  });
  memo.set(key,resolved);
  return resolved;
}

const resolved={};
for(const key of Object.keys(raw))resolved[key]=resolveKey(key);

export const BUILTIN_ENGLISH_LOCALIZATION_1193=Object.freeze(resolved);
export const BUILTIN_ENGLISH_LOCALIZATION_1193_META=Object.freeze({
  gameVersion:'1.19.3',
  language:'english',
  source:'user-provided HOI4 1.19.3 localisation/english plus source-identical retained 1.19.2 labels',
  generated:true,
  sourceFileCount:207,
  sourceDigestSha256:'0383787c595625289dbbd1d69dc243eb2dc16c5beec4a2dbf3e0f11dbf1e2603',
  sourceArchiveSha256:'5d63fe3a04f31992c1ebf8da56afe6a58b94a089055e0267fc14beb3c9ee5ede',
  changedSourceOverlayCount:Object.keys(Object.assign({},p01,p02,p03,p04,p05,p06)).length,
  resolvedCount:Object.keys(resolved).length,
  referenceTokensResolved:true,
  scope:'planner-facing labels with a 1.19.3 changed-source overlay and retained source-identical baseline labels'
});

export default BUILTIN_ENGLISH_LOCALIZATION_1193;

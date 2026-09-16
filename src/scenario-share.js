export const SCENARIO_SHARE_VERSION=1;
export const MAX_SHARE_TOKEN_LENGTH=12000;

const BLOCKED_KEYS=new Set(['__proto__','prototype','constructor']);
const SAME=Symbol('same');
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function cloneSafe(value,depth=0,budget={nodes:0}){
  if(depth>32)throw new Error('Scenario share state is nested too deeply.');
  if(++budget.nodes>10000)throw new Error('Scenario share state is too complex.');
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new Error('Scenario share state contains a non-finite number.');
    return value;
  }
  if(Array.isArray(value))return value.map(item=>cloneSafe(item,depth+1,budget));
  if(isObject(value)){
    const out={};
    for(const [key,item] of Object.entries(value)){
      if(BLOCKED_KEYS.has(key)||item===undefined)continue;
      out[key]=cloneSafe(item,depth+1,budget);
    }
    return out;
  }
  throw new Error('Scenario share state contains an unsupported value.');
}

function diffValue(current,baseline){
  if(current===baseline)return SAME;
  if(Array.isArray(current)&&Array.isArray(baseline)){
    if(current.length===baseline.length&&current.every((value,index)=>diffValue(value,baseline[index])===SAME))return SAME;
    return cloneSafe(current);
  }
  if(isObject(current)&&isObject(baseline)){
    const out={};let changed=false;
    for(const [key,value] of Object.entries(current)){
      if(BLOCKED_KEYS.has(key))continue;
      const diff=diffValue(value,baseline[key]);
      if(diff!==SAME){out[key]=diff;changed=true;}
    }
    return changed?out:SAME;
  }
  return cloneSafe(current);
}

function mergeSafe(base,incoming){
  if(incoming===undefined)return cloneSafe(base);
  if(Array.isArray(base))return Array.isArray(incoming)?cloneSafe(incoming):cloneSafe(base);
  if(isObject(base)&&isObject(incoming)){
    const out=cloneSafe(base);
    for(const [key,value] of Object.entries(incoming)){
      if(BLOCKED_KEYS.has(key))continue;
      out[key]=Object.prototype.hasOwnProperty.call(base,key)?mergeSafe(base[key],value):cloneSafe(value);
    }
    return out;
  }
  return cloneSafe(incoming);
}

function bytesToBase64(bytes){
  let binary='';
  for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToBytes(base64){
  const binary=atob(base64),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}
function toBase64Url(text){
  return bytesToBase64(new TextEncoder().encode(text)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromBase64Url(token){
  if(!/^[A-Za-z0-9_-]+$/.test(token))throw new Error('Scenario share token contains invalid characters.');
  const base64=token.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(token.length/4)*4,'=');
  return new TextDecoder().decode(base64ToBytes(base64));
}

export function shareableScenarioState(state){
  const root={...(state||{}),dataPack:null,lastBattle:null};
  return cloneSafe(root);
}

export function scenarioShareDelta(state,defaults){
  const current=shareableScenarioState(state),baseline=shareableScenarioState(defaults||{}),diff=diffValue(current,baseline);
  return diff===SAME?{}:diff;
}

export function encodeScenarioShare(state,defaults,{gameVersion=''}={}){
  const payload={
    version:SCENARIO_SHARE_VERSION,
    gameVersion:String(gameVersion||''),
    schema:Number(state?.schema??defaults?.schema)||null,
    state:scenarioShareDelta(state,defaults)
  };
  if(!payload.gameVersion)throw new Error('Scenario share game version is required.');
  const token=toBase64Url(JSON.stringify(payload));
  if(token.length>MAX_SHARE_TOKEN_LENGTH)throw new Error('Scenario is too large for a reliable share link. Export the scenario JSON instead.');
  return token;
}

export function decodeScenarioShare(token){
  const raw=String(token||'');
  if(!raw)throw new Error('Scenario share token is empty.');
  if(raw.length>MAX_SHARE_TOKEN_LENGTH)throw new Error('Scenario share token is too large.');
  let parsed;
  try{parsed=JSON.parse(fromBase64Url(raw));}catch(error){throw new Error(`Invalid scenario share token: ${error?.message||error}`);}
  if(!isObject(parsed))throw new Error('Scenario share payload must be an object.');
  if(Number(parsed.version)!==SCENARIO_SHARE_VERSION)throw new Error(`Unsupported scenario share version: ${parsed.version??'missing'}.`);
  if(typeof parsed.gameVersion!=='string'||!parsed.gameVersion)throw new Error('Scenario share payload is missing its game version.');
  if(!isObject(parsed.state))throw new Error('Scenario share payload is missing state.');
  const state=cloneSafe(parsed.state);
  delete state.dataPack;
  delete state.lastBattle;
  return {version:SCENARIO_SHARE_VERSION,gameVersion:parsed.gameVersion,schema:Number(parsed.schema)||null,state};
}

export function materializeScenarioShare(defaults,payload){
  if(!payload||!isObject(payload.state))throw new Error('Scenario share payload is invalid.');
  const next=mergeSafe(defaults||{},payload.state);
  next.dataPack=null;
  next.lastBattle=null;
  if(defaults?.schema!==undefined)next.schema=defaults.schema;
  return next;
}

export function buildScenarioShareUrl(href,token,route='battle'){
  const url=new URL(href);
  url.searchParams.set('scenario',token);
  url.hash=`#${String(route||'battle').replace(/^#/,'')}`;
  return url.toString();
}

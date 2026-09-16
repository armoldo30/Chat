import {decodeScenarioShare} from './scenario-share.js';

export const MAX_SAVED_MATCHUPS=20;
export const MAX_SAVED_MATCHUP_NAME=80;

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const cleanName=value=>String(value??'').replace(/\s+/g,' ').trim().slice(0,MAX_SAVED_MATCHUP_NAME);
const cleanId=value=>String(value??'').trim().slice(0,64);
const validId=value=>/^[A-Za-z0-9_-]{1,64}$/.test(value);
const validIso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));

function normalizeEntry(raw,{gameVersion='' }={}){
  if(!isObject(raw))return null;
  const id=cleanId(raw.id),name=cleanName(raw.name),token=String(raw.token??'');
  if(!validId(id)||!name||!token)return null;
  let decoded;
  try{decoded=decodeScenarioShare(token);}catch{return null;}
  const version=String(raw.gameVersion||decoded.gameVersion||'');
  if(!version||decoded.gameVersion!==version)return null;
  if(gameVersion&&version!==gameVersion)return null;
  const createdAt=validIso(raw.createdAt)?new Date(raw.createdAt).toISOString():null;
  const updatedAt=validIso(raw.updatedAt)?new Date(raw.updatedAt).toISOString():createdAt;
  if(!createdAt||!updatedAt)return null;
  return {id,name,token,gameVersion:version,createdAt,updatedAt};
}

export function normalizeSavedMatchups(raw,options={}){
  const rows=Array.isArray(raw)?raw:[];
  const seen=new Set(),out=[];
  for(const item of rows){
    const entry=normalizeEntry(item,options);
    if(!entry||seen.has(entry.id))continue;
    seen.add(entry.id);out.push(entry);
  }
  return out.sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)).slice(0,MAX_SAVED_MATCHUPS);
}

export function upsertSavedMatchup(entries,{id,name,token,gameVersion,now=new Date().toISOString()}={}){
  const normalized=normalizeSavedMatchups(entries,{gameVersion}),safeId=cleanId(id),safeName=cleanName(name),stamp=new Date(now).toISOString();
  if(!validId(safeId))throw new Error('Saved matchup id is invalid.');
  if(!safeName)throw new Error('Saved matchup name is required.');
  let decoded;
  try{decoded=decodeScenarioShare(String(token||''));}catch(error){throw new Error(`Saved matchup token is invalid: ${error?.message||error}`);}
  if(decoded.gameVersion!==String(gameVersion||''))throw new Error('Saved matchup game version does not match the token.');
  const existing=normalized.find(x=>x.id===safeId),entry={id:safeId,name:safeName,token:String(token),gameVersion:String(gameVersion),createdAt:existing?.createdAt||stamp,updatedAt:stamp};
  return [entry,...normalized.filter(x=>x.id!==safeId)].slice(0,MAX_SAVED_MATCHUPS);
}

export function removeSavedMatchup(entries,id,{gameVersion=''}={}){
  const safeId=cleanId(id);
  return normalizeSavedMatchups(entries,{gameVersion}).filter(x=>x.id!==safeId);
}

export function savedMatchupById(entries,id,{gameVersion=''}={}){
  const safeId=cleanId(id);
  return normalizeSavedMatchups(entries,{gameVersion}).find(x=>x.id===safeId)||null;
}

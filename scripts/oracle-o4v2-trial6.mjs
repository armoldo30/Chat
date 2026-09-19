import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O4V2_PREFIX='WPO4V2';
export const O4V2_SCENARIO='o4-guaranteed-hit-sub10-v2';
export const O4V2_HOURS=Object.freeze([0,1,2,3,4,5,6]);
export const O4V2_GAME_VERSION='1.19.3.0.c01a';
export const O4V2_BASE_CHECKSUM='5632';
export const O4V2_DEFINE='BASE_CHANCE_TO_AVOID_HIT:0';

function finite(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
function kv(text){const out={};for(const m of String(text).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))out[m[1]]=m[2];return out;}
function payload(line){const i=line.indexOf(O4V2_PREFIX);return i<0?null:line.slice(i+O4V2_PREFIX.length).trim();}
function measure(fields,line){
  const out={};
  for(const name of ['orgLow','orgHigh','strengthLow','strengthHigh']){
    const n=finite(fields[name]);if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${name}`);out[name]=n;
  }
  if(out.orgLow>out.orgHigh||out.strengthLow>out.strengthHigh)throw new Error(`line ${line}: reversed bounds`);
  return out;
}
function same(a,b){return ['orgLow','orgHigh','strengthLow','strengthHigh'].every(k=>a[k]===b[k]);}
function strictDecrease(prev,cur,low,high){return cur[high]<prev[low];}

export function parseO4V2Runs(text){
  const runs=[];let run=null,current=null;
  for(const [i,lineText] of String(text??'').split(/\r?\n/).entries()){
    const p=payload(lineText);if(p===null)continue;
    const j=p.indexOf(' '),type=j<0?p:p.slice(0,j),rest=j<0?'':p.slice(j+1),fields=kv(rest),line=i+1;
    if(type==='BEGIN'){run={begin:fields,samples:[],end:null,line};runs.push(run);current=null;continue;}
    if(!run)continue;
    if(type==='SAMPLE'){const hour=finite(fields.hour);if(hour===null)throw new Error(`line ${line}: invalid hour`);current={hour,attackers:[],defenders:[]};run.samples.push(current);continue;}
    if(type==='ATTACKER'||type==='DEFENDER'){if(!current)throw new Error(`line ${line}: measurement before sample`);(type==='ATTACKER'?current.attackers:current.defenders).push(measure(fields,line));continue;}
    if(type==='END'){run.end={...fields,line};current=null;}
  }
  return runs;
}

export function captureO4V2Run(run){
  const b=run?.begin||{};
  if(!run?.end)throw new Error('missing END');
  if(Number(b.schema)!==1||b.scenario!==O4V2_SCENARIO)throw new Error('unexpected schema/scenario');
  if(!['control','probe'].includes(b.mode))throw new Error('unexpected mode');
  if(b.gameVersion!==O4V2_GAME_VERSION||b.checksum!==O4V2_BASE_CHECKSUM||b.checksumScope!=='base-game-reference')throw new Error('unexpected version/checksum');
  if(b.method!=='bisection14'||b.runMode!=='trial6'||b.tacticMode!=='neutral-basic-only')throw new Error('unexpected method/run/tactic mode');
  if(b.defineOverride!==O4V2_DEFINE)throw new Error('unexpected define override');
  if(b.prepared!=='yes'||b.modifierPresent!=='yes')throw new Error('run not prepared');
  const expectedMod=b.mode==='control'?'army_infantry_attack_factor:-0.84':'army_infantry_attack_factor:-0.97';
  if(b.attackModifier!==expectedMod)throw new Error('unexpected attack modifier');
  if(run.end.reason!=='trial6-complete'||Number(run.end.hour)!==6||run.end.modifiersRemoved!=='yes'||run.end.cleanupFailure==='yes')throw new Error('bad END/cleanup');
  if(JSON.stringify(run.samples.map(s=>s.hour))!==JSON.stringify(O4V2_HOURS))throw new Error('expected hours 0..6');
  for(const s of run.samples){if(s.attackers.length!==1||s.defenders.length!==1)throw new Error(`hour ${s.hour}: expected one attacker and defender`);}
  const h0=run.samples[0],h1=run.samples[1];
  for(const [m,label] of [[h0.attackers[0],'attacker'],[h0.defenders[0],'defender']]){
    if(m.orgLow<0.9999||m.strengthLow<0.9999)throw new Error(`h0 ${label} not fresh`);
  }
  if(!same(h0.attackers[0],h1.attackers[0])||!same(h0.defenders[0],h1.defenders[0]))throw new Error('h0->h1 startup changed');

  const intervals=[];
  for(let i=2;i<run.samples.length;i++){
    const prev=run.samples[i-1].defenders[0],cur=run.samples[i].defenders[0];
    const org=strictDecrease(prev,cur,'orgLow','orgHigh');
    const strength=strictDecrease(prev,cur,'strengthLow','strengthHigh');
    intervals.push({fromHour:i-1,toHour:i,orgDamageObserved:org,strengthDamageObserved:strength,anyDamageObserved:org||strength});
  }
  return {mode:b.mode,positiveIntervals:intervals.filter(x=>x.anyDamageObserved).length,intervals,samples:run.samples,metadata:{defineOverride:b.defineOverride,attackModifier:b.attackModifier}};
}

export function parseO4V2Batch(text){
  const candidates=parseO4V2Runs(text),accepted=[],rejected=[];
  candidates.forEach((r,i)=>{try{accepted.push({runNumber:i+1,capture:captureO4V2Run(r)});}catch(error){rejected.push({runNumber:i+1,reason:error.message});}});
  const byMode={control:accepted.filter(x=>x.capture.mode==='control'),probe:accepted.filter(x=>x.capture.mode==='probe')};
  return {scenario:O4V2_SCENARIO,totalRuns:candidates.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,byMode,runs:accepted};
}

async function cli(){
  const [,,input]=process.argv;if(!input){console.error('Usage: node scripts/oracle-o4v2-trial6.mjs <game.log>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(parseO4V2Batch(await fs.readFile(input,'utf8')),null,2)+'\n');}
  catch(error){console.error(`O4 v2 parse failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

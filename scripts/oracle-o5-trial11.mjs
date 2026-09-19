import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O5_HOURS=Object.freeze(Array.from({length:12},(_,i)=>i));
export const O5_SCENARIO='o5-fixed-damage-integerization-v1';
export const O5_GAME_VERSION='1.19.3.0.c01a';
export const O5_BASE_CHECKSUM='5632';
export const O5_METHOD='bisection14';
export const O5_ATTACK_MODIFIER='army_infantry_attack_factor:-0.79';

function finite(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
function kv(text){const out={};for(const m of String(text).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))out[m[1]]=m[2];return out;}
function payload(line){const i=line.indexOf('WPO5');return i<0?null:line.slice(i+4).trim();}
function measure(fields,line){
  const out={};
  for(const name of ['orgLow','orgHigh','strengthLow','strengthHigh']){
    const n=finite(fields[name]);
    if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${name}`);
    out[name]=n;
  }
  if(out.orgLow>out.orgHigh||out.strengthLow>out.strengthHigh)throw new Error(`line ${line}: reversed bounds`);
  return out;
}
function same(a,b){return ['orgLow','orgHigh','strengthLow','strengthHigh'].every(k=>a[k]===b[k]);}
function midpoint(low,high){return (low+high)/2;}
function round(x,d=6){const p=10**d;return Math.round((x+Number.EPSILON)*p)/p;}
function strictOrgLoss(prev,cur){return cur.orgHigh<prev.orgLow;}
function orgLossPp(prev,cur){return round((midpoint(prev.orgLow,prev.orgHigh)-midpoint(cur.orgLow,cur.orgHigh))*100,6);}

export function parseO5Runs(text){
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

export function captureO5Run(run){
  const b=run?.begin||{};
  if(!run?.end)throw new Error('missing END');
  if(Number(b.schema)!==1||b.scenario!==O5_SCENARIO)throw new Error('unexpected schema/scenario');
  if(b.gameVersion!==O5_GAME_VERSION||b.checksum!==O5_BASE_CHECKSUM||b.checksumScope!=='base-game-reference')throw new Error('unexpected version/checksum');
  if(b.method!==O5_METHOD||b.runMode!=='trial11'||b.tacticMode!=='neutral-basic-only')throw new Error('unexpected method/run/tactic mode');
  if(b.attackModifier!==O5_ATTACK_MODIFIER)throw new Error('unexpected attack modifier');
  if(b.defineOverrides!=='BASE_CHANCE_TO_AVOID_HIT:0,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0')throw new Error('unexpected define overrides');
  if(b.prepared!=='yes'||b.modifierPresent!=='yes')throw new Error('run not prepared');
  if(run.end.reason!=='trial11-complete'||Number(run.end.hour)!==11||run.end.modifierRemoved!=='yes'||run.end.cleanupFailure==='yes')throw new Error('bad END/cleanup');
  if(JSON.stringify(run.samples.map(s=>s.hour))!==JSON.stringify(O5_HOURS))throw new Error('expected hours 0..11');
  for(const s of run.samples){if(s.attackers.length!==1||s.defenders.length!==1)throw new Error(`hour ${s.hour}: expected one attacker and defender`);}

  const h0=run.samples[0],h1=run.samples[1];
  if(h0.attackers[0].orgLow<0.9999||h0.attackers[0].strengthLow<0.9999||h0.defenders[0].orgLow<0.9999||h0.defenders[0].strengthLow<0.9999)throw new Error('h0 not fresh');
  if(!same(h0.attackers[0],h1.attackers[0])||!same(h0.defenders[0],h1.defenders[0]))throw new Error('h0->h1 startup changed');

  const aStrength0={low:h0.attackers[0].strengthLow,high:h0.attackers[0].strengthHigh};
  const dStrength0={low:h0.defenders[0].strengthLow,high:h0.defenders[0].strengthHigh};
  for(const s of run.samples){
    if(s.attackers[0].strengthLow!==aStrength0.low||s.attackers[0].strengthHigh!==aStrength0.high)throw new Error(`hour ${s.hour}: attacker strength changed despite STR_DAMAGE:0`);
    if(s.defenders[0].strengthLow!==dStrength0.low||s.defenders[0].strengthHigh!==dStrength0.high)throw new Error(`hour ${s.hour}: defender strength changed despite STR_DAMAGE:0`);
  }

  const intervals=[];
  for(let i=2;i<run.samples.length;i++){
    const prev=run.samples[i-1].defenders[0],cur=run.samples[i].defenders[0];
    intervals.push({fromHour:i-1,toHour:i,positiveOrgLoss:strictOrgLoss(prev,cur),orgLossPp:orgLossPp(prev,cur)});
  }
  return {intervals,positiveIntervals:intervals.filter(x=>x.positiveOrgLoss).length,metadata:{attackModifier:b.attackModifier,defineOverrides:b.defineOverrides}};
}

export function parseO5Batch(text){
  const candidates=parseO5Runs(text),accepted=[],rejected=[];
  candidates.forEach((r,i)=>{try{accepted.push({runNumber:i+1,capture:captureO5Run(r)});}catch(error){rejected.push({runNumber:i+1,reason:error.message});}});
  return {scenario:O5_SCENARIO,totalRuns:candidates.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,runs:accepted};
}

async function cli(){
  const [,,input]=process.argv;if(!input){console.error('Usage: node scripts/oracle-o5-trial11.mjs <game.log>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(parseO5Batch(await fs.readFile(input,'utf8')),null,2)+'\n');}
  catch(error){console.error(`O5 parse failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

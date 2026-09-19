import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O6_HOURS=Object.freeze(Array.from({length:42},(_,i)=>i));
export const O6_SCENARIO='o6-two-point-probability-law-v1';
export const O6_THRESHOLD_PP=0.13;

function finite(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
function kv(text){const out={};for(const m of String(text).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))out[m[1]]=m[2];return out;}
function payload(line){const i=line.indexOf('WPO6');return i<0?null:line.slice(i+4).trim();}
function measure(fields,line){
  const out={};
  for(const name of ['orgLow','orgHigh','strengthLow','strengthHigh']){
    const n=finite(fields[name]);if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${name}`);out[name]=n;
  }
  if(out.orgLow>out.orgHigh||out.strengthLow>out.strengthHigh)throw new Error(`line ${line}: reversed bounds`);
  return out;
}
function same(a,b){return ['orgLow','orgHigh','strengthLow','strengthHigh'].every(k=>a[k]===b[k]);}
function mid(a,b){return (a+b)/2;}
function lossPp(prev,cur){return (mid(prev.orgLow,prev.orgHigh)-mid(cur.orgLow,cur.orgHigh))*100;}
function strictLoss(prev,cur){return cur.orgHigh<prev.orgLow;}

export function parseO6Runs(text){
  const runs=[];let run=null,current=null;
  for(const [i,lineText] of String(text??'').split(/\r?\n/).entries()){
    const p=payload(lineText);if(p===null)continue;
    const j=p.indexOf(' '),type=j<0?p:p.slice(0,j),rest=j<0?'':p.slice(j+1),fields=kv(rest),line=i+1;
    if(type==='BEGIN'){run={begin:fields,samples:[],end:null};runs.push(run);current=null;continue;}
    if(!run)continue;
    if(type==='SAMPLE'){const hour=finite(fields.hour);if(hour===null)throw new Error(`line ${line}: bad hour`);current={hour,attackers:[],defenders:[]};run.samples.push(current);continue;}
    if(type==='ATTACKER'||type==='DEFENDER'){if(!current)throw new Error(`line ${line}: measurement before sample`);(type==='ATTACKER'?current.attackers:current.defenders).push(measure(fields,line));continue;}
    if(type==='END'){run.end={...fields,line};current=null;}
  }
  return runs;
}

export function captureO6Run(run){
  const b=run?.begin||{};
  if(!run?.end)throw new Error('missing END');
  if(Number(b.schema)!==1||b.scenario!==O6_SCENARIO)throw new Error('bad schema/scenario');
  if(!['low','high'].includes(b.mode))throw new Error('bad mode');
  if(b.gameVersion!=='1.19.3.0.c01a'||b.checksum!=='5632'||b.checksumScope!=='base-game-reference')throw new Error('bad version/checksum');
  if(b.method!=='bisection14'||b.runMode!=='trial41'||b.tacticMode!=='neutral-basic-only')throw new Error('bad method/run/tactics');
  if(b.defineOverrides!=='BASE_CHANCE_TO_AVOID_HIT:0,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0')throw new Error('bad defines');
  const expected=b.mode==='low'?'army_infantry_attack_factor:-0.83':'army_infantry_attack_factor:-0.748';
  if(b.attackModifier!==expected||b.prepared!=='yes'||b.modifierPresent!=='yes')throw new Error('bad modifier/preparation');
  if(run.end.reason!=='trial41-complete'||Number(run.end.hour)!==41||run.end.modifiersRemoved!=='yes'||run.end.cleanupFailure==='yes')throw new Error('bad END/cleanup');
  if(JSON.stringify(run.samples.map(s=>s.hour))!==JSON.stringify(O6_HOURS))throw new Error('expected hours 0..41');
  for(const s of run.samples){if(s.attackers.length!==1||s.defenders.length!==1)throw new Error(`hour ${s.hour}: expected one attacker and defender`);}
  const h0=run.samples[0],h1=run.samples[1];
  if(h0.attackers[0].orgLow<0.9999||h0.defenders[0].orgLow<0.9999)throw new Error('h0 not fresh');
  if(!same(h0.attackers[0],h1.attackers[0])||!same(h0.defenders[0],h1.defenders[0]))throw new Error('startup changed');
  for(const s of run.samples){
    if(s.attackers[0].strengthLow!==h0.attackers[0].strengthLow||s.attackers[0].strengthHigh!==h0.attackers[0].strengthHigh)throw new Error(`hour ${s.hour}: attacker strength changed`);
    if(s.defenders[0].strengthLow!==h0.defenders[0].strengthLow||s.defenders[0].strengthHigh!==h0.defenders[0].strengthHigh)throw new Error(`hour ${s.hour}: defender strength changed`);
  }
  const intervals=[];
  for(let i=2;i<run.samples.length;i++){
    const prev=run.samples[i-1].defenders[0],cur=run.samples[i].defenders[0];
    const loss=lossPp(prev,cur);
    intervals.push({fromHour:i-1,toHour:i,orgLossPp:loss,positive:strictLoss(prev,cur),cluster:loss>=O6_THRESHOLD_PP?'high':'low'});
  }
  return {mode:b.mode,intervals,positiveIntervals:intervals.filter(x=>x.positive).length,highCount:intervals.filter(x=>x.cluster==='high').length,lowCount:intervals.filter(x=>x.cluster==='low').length};
}

export function parseO6Batch(text){
  const candidates=parseO6Runs(text),accepted=[],rejected=[];
  candidates.forEach((r,i)=>{try{accepted.push({runNumber:i+1,capture:captureO6Run(r)});}catch(error){rejected.push({runNumber:i+1,reason:error.message});}});
  return {scenario:O6_SCENARIO,totalRuns:candidates.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,
    byMode:{low:accepted.filter(x=>x.capture.mode==='low'),high:accepted.filter(x=>x.capture.mode==='high')},runs:accepted};
}

async function cli(){
  const [,,input]=process.argv;if(!input){console.error('Usage: node scripts/oracle-o6-trial41.mjs <game.log>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(parseO6Batch(await fs.readFile(input,'utf8')),null,2)+'\n');}
  catch(error){console.error(`O6 parse failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

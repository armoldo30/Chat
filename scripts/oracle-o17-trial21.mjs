import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O17_HOURS=Object.freeze(Array.from({length:22},(_,i)=>i));
export const O17_SCENARIO='o17-fixed-strength-unit-v1';

function finite(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
function kv(s){const o={};for(const m of String(s).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))o[m[1]]=m[2];return o;}
function payload(line){const i=line.indexOf('WPO17');return i<0?null:line.slice(i+5).trim();}
function measure(f,line){const o={};for(const k of ['orgLow','orgHigh','strengthLow','strengthHigh']){const n=finite(f[k]);if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${k}`);o[k]=n;}if(o.orgLow>o.orgHigh||o.strengthLow>o.strengthHigh)throw new Error(`line ${line}: reversed bounds`);return o;}
function sameOrg(a,b){return a.orgLow===b.orgLow&&a.orgHigh===b.orgHigh;}
function sameAll(a,b){return sameOrg(a,b)&&a.strengthLow===b.strengthLow&&a.strengthHigh===b.strengthHigh;}
function midStrength(m){return (m.strengthLow+m.strengthHigh)/2;}

export function parseO17Runs(text){
  const runs=[];let run=null,current=null;
  for(const [i,line] of String(text??'').split(/\r?\n/).entries()){
    const p=payload(line);if(p===null)continue;const j=p.indexOf(' '),type=j<0?p:p.slice(0,j),f=kv(j<0?'':p.slice(j+1)),lineNo=i+1;
    if(type==='BEGIN'){run={begin:f,samples:[],end:null};runs.push(run);current=null;continue;}
    if(!run)continue;
    if(type==='SAMPLE'){const hour=finite(f.hour);if(hour===null)throw new Error(`line ${lineNo}: bad hour`);current={hour,attackers:[],defenders:[]};run.samples.push(current);continue;}
    if(type==='ATTACKER'||type==='DEFENDER'){if(!current)throw new Error(`line ${lineNo}: measurement before sample`);(type==='ATTACKER'?current.attackers:current.defenders).push(measure(f,lineNo));continue;}
    if(type==='END'){run.end={...f,line:lineNo};current=null;}
  }
  return runs;
}

export function captureO17Run(run){
  const b=run?.begin||{};if(!run?.end)throw new Error('missing END');
  if(Number(b.schema)!==1||b.scenario!==O17_SCENARIO)throw new Error('bad schema/scenario');
  if(b.gameVersion!=='1.19.3.0.c01a'||b.checksum!=='5632'||b.checksumScope!=='base-game-reference')throw new Error('bad version/checksum');
  if(b.method!=='bisection14'||b.runMode!=='trial21'||b.tacticMode!=='neutral-basic-only')throw new Error('bad method/run/tactics');
  if(b.defineOverrides!=='BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DAMAGE_MODIFIER:0,ORG_DICE:1,STR_DAMAGE_MODIFIER:0.060,STR_DICE:1,STR_ARMOR_SOFT_DICE:1,NIGHT_PENALTY:0')throw new Error('bad defines');
  if(b.attackModifier!=='army_infantry_attack_factor:-0.721'||b.defenseModifier!=='army_infantry_defence_factor:-0.9923784016'||b.prepared!=='yes'||b.modifiersPresent!=='yes')throw new Error('bad modifiers/preparation');
  if(run.end.reason!=='trial21-complete'||Number(run.end.hour)!==21||run.end.modifiersRemoved!=='yes'||run.end.cleanupFailure==='yes')throw new Error('bad END/cleanup');
  if(JSON.stringify(run.samples.map(s=>s.hour))!==JSON.stringify(O17_HOURS))throw new Error('expected hours 0..21');
  for(const s of run.samples)if(s.attackers.length!==1||s.defenders.length!==1)throw new Error(`hour ${s.hour}: expected one attacker and defender`);
  const h0=run.samples[0],h1=run.samples[1];
  if(h0.attackers[0].orgLow<0.9999||h0.defenders[0].orgLow<0.9999||h0.attackers[0].strengthLow<0.9999||h0.defenders[0].strengthLow<0.9999)throw new Error('h0 not fresh');
  if(!sameAll(h0.attackers[0],h1.attackers[0])||!sameAll(h0.defenders[0],h1.defenders[0]))throw new Error('startup changed');
  for(const s of run.samples){
    if(!sameOrg(s.attackers[0],h0.attackers[0])||!sameOrg(s.defenders[0],h0.defenders[0]))throw new Error(`hour ${s.hour}: organization changed despite ORG damage zero`);
  }
  const intervals=[];
  for(let h=2;h<=21;h++){
    const prev=run.samples[h-1].defenders[0],cur=run.samples[h].defenders[0];
    const loss=(midStrength(prev)-midStrength(cur))*100;
    const strict=cur.strengthHigh<prev.strengthLow;
    intervals.push({fromHour:h-1,toHour:h,strengthLossPp:loss,strict});
  }
  return {intervals};
}

export function parseO17Batch(text){const candidates=parseO17Runs(text),accepted=[],rejected=[];candidates.forEach((r,i)=>{try{accepted.push({runNumber:i+1,capture:captureO17Run(r)});}catch(error){rejected.push({runNumber:i+1,reason:error.message});}});return {scenario:O17_SCENARIO,totalRuns:candidates.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,runs:accepted};}

async function cli(){const [,,input]=process.argv;if(!input){console.error('Usage: node scripts/oracle-o17-trial21.mjs <game.log>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(parseO17Batch(await fs.readFile(input,'utf8')),null,2)+'\n');}catch(error){console.error(`O17 parse failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

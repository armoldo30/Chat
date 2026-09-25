import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O13_HOURS=Object.freeze(Array.from({length:82},(_,i)=>i));
export const O13_SCENARIO='o13-defended-only-defense18-v1';

function finite(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
function kv(s){const o={};for(const m of String(s).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))o[m[1]]=m[2];return o;}
function payload(line){const i=line.indexOf('WPO13');return i<0?null:line.slice(i+5).trim();}
function measure(fields,line){const out={};for(const k of ['orgLow','orgHigh','strengthLow','strengthHigh']){const n=finite(fields[k]);if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${k}`);out[k]=n;}if(out.orgLow>out.orgHigh||out.strengthLow>out.strengthHigh)throw new Error(`line ${line}: reversed bounds`);return out;}
function same(a,b){return ['orgLow','orgHigh','strengthLow','strengthHigh'].every(k=>a[k]===b[k]);}
function mid(m){return (m.orgLow+m.orgHigh)/2;}
function classify(prev,cur){const loss=(mid(prev)-mid(cur))*100;if(!(cur.orgHigh<prev.orgLow))return {multiplicity:0,loss};if(loss<.13)return {multiplicity:1,loss};if(loss<.225)return {multiplicity:2,loss};if(loss<.315)return {multiplicity:3,loss};return {multiplicity:4,loss};}

export function parseO13Runs(text){
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

export function captureO13Run(run){
  const b=run?.begin||{};if(!run?.end)throw new Error('missing END');
  if(Number(b.schema)!==1||b.scenario!==O13_SCENARIO)throw new Error('bad schema/scenario');
  if(b.gameVersion!=='1.19.3.0.c01a'||b.checksum!=='5632'||b.checksumScope!=='base-game-reference')throw new Error('bad version/checksum');
  if(b.method!=='bisection14'||b.runMode!=='trial81'||b.tacticMode!=='neutral-basic-only')throw new Error('bad method/run/tactics');
  if(b.defineOverrides!=='BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0')throw new Error('bad defines');
  if(b.attackModifier!=='army_infantry_attack_factor:-0.721'||b.defenseModifier!=='army_infantry_defence_factor:-0.9599742088'||b.prepared!=='yes'||b.modifiersPresent!=='yes')throw new Error('bad modifiers/preparation');
  if(run.end.reason!=='trial81-complete'||Number(run.end.hour)!==81||run.end.modifiersRemoved!=='yes'||run.end.cleanupFailure==='yes')throw new Error('bad END/cleanup');
  if(JSON.stringify(run.samples.map(s=>s.hour))!==JSON.stringify(O13_HOURS))throw new Error('expected hours 0..81');
  for(const s of run.samples){if(s.attackers.length!==1||s.defenders.length!==1)throw new Error(`hour ${s.hour}: expected one attacker and defender`);}
  const h0=run.samples[0],h1=run.samples[1];if(!same(h0.attackers[0],h1.attackers[0])||!same(h0.defenders[0],h1.defenders[0]))throw new Error('startup changed');
  for(const s of run.samples){
    if(s.attackers[0].strengthLow!==h0.attackers[0].strengthLow||s.attackers[0].strengthHigh!==h0.attackers[0].strengthHigh)throw new Error(`hour ${s.hour}: attacker strength changed`);
    if(s.defenders[0].strengthLow!==h0.defenders[0].strengthLow||s.defenders[0].strengthHigh!==h0.defenders[0].strengthHigh)throw new Error(`hour ${s.hour}: defender strength changed`);
  }
  const counts={zero:0,one:0,two:0,three:0,fourPlus:0},intervals=[];
  for(let h=2;h<=81;h++){const x=classify(run.samples[h-1].defenders[0],run.samples[h].defenders[0]);intervals.push({fromHour:h-1,toHour:h,...x});if(x.multiplicity===0)counts.zero++;else if(x.multiplicity===1)counts.one++;else if(x.multiplicity===2)counts.two++;else if(x.multiplicity===3)counts.three++;else counts.fourPlus++;}
  return {counts,intervals};
}
export function parseO13Batch(text){const candidates=parseO13Runs(text),accepted=[],rejected=[];candidates.forEach((r,i)=>{try{accepted.push({runNumber:i+1,capture:captureO13Run(r)});}catch(error){rejected.push({runNumber:i+1,reason:error.message});}});return {scenario:O13_SCENARIO,totalRuns:candidates.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,runs:accepted};}

async function cli(){const [,,input]=process.argv;if(!input){console.error('Usage: node scripts/oracle-o13-trial81.mjs <game.log>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(parseO13Batch(await fs.readFile(input,'utf8')),null,2)+'\n');}catch(error){console.error(`O13 parse failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

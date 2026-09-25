import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O16_HOURS=Object.freeze(Array.from({length:82},(_,i)=>i));
export const O16_SCENARIO='o16-normal-org-die-v1';

function finite(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
function kv(s){const o={};for(const m of String(s).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))o[m[1]]=m[2];return o;}
function payload(line){const i=line.indexOf('WPO16');return i<0?null:line.slice(i+5).trim();}
function measure(f,line){const o={};for(const k of ['orgLow','orgHigh','strengthLow','strengthHigh']){const n=finite(f[k]);if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${k}`);o[k]=n;}if(o.orgLow>o.orgHigh||o.strengthLow>o.strengthHigh)throw new Error(`line ${line}: reversed bounds`);return o;}
function same(a,b){return ['orgLow','orgHigh','strengthLow','strengthHigh'].every(k=>a[k]===b[k]);}
function mid(m){return (m.orgLow+m.orgHigh)/2;}
function classify(prev,cur){
  const loss=(mid(prev)-mid(cur))*100;
  if(!(cur.orgHigh<prev.orgLow))return {die:0,loss};
  if(loss<0.13)return {die:1,loss};
  if(loss<0.225)return {die:2,loss};
  if(loss<0.315)return {die:3,loss};
  if(loss<0.405)return {die:4,loss};
  return {die:5,loss};
}

export function parseO16Runs(text){
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

export function captureO16Run(run){
  const b=run?.begin||{};if(!run?.end)throw new Error('missing END');
  if(Number(b.schema)!==1||b.scenario!==O16_SCENARIO)throw new Error('bad schema/scenario');
  if(b.gameVersion!=='1.19.3.0.c01a'||b.checksum!=='5632'||b.checksumScope!=='base-game-reference')throw new Error('bad version/checksum');
  if(b.method!=='bisection14'||b.runMode!=='trial81'||b.tacticMode!=='neutral-basic-only')throw new Error('bad method/run/tactics');
  if(b.defineOverrides!=='BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DAMAGE_MODIFIER:0.053,ORG_DICE:4,ORG_ARMOR_SOFT_DICE:6,STR_DAMAGE:0,NIGHT_PENALTY:0')throw new Error('bad defines');
  if(b.attackModifier!=='army_infantry_attack_factor:-0.721'||b.defenseModifier!=='army_infantry_defence_factor:-0.9923784016'||b.prepared!=='yes'||b.modifiersPresent!=='yes')throw new Error('bad modifiers/preparation');
  if(run.end.reason!=='trial81-complete'||Number(run.end.hour)!==81||run.end.modifiersRemoved!=='yes'||run.end.cleanupFailure==='yes')throw new Error('bad END/cleanup');
  if(JSON.stringify(run.samples.map(s=>s.hour))!==JSON.stringify(O16_HOURS))throw new Error('expected hours 0..81');
  for(const s of run.samples)if(s.attackers.length!==1||s.defenders.length!==1)throw new Error(`hour ${s.hour}: expected one attacker and defender`);
  const h0=run.samples[0],h1=run.samples[1];
  if(h0.attackers[0].orgLow<0.9999||h0.defenders[0].orgLow<0.9999)throw new Error('h0 not fresh');
  if(!same(h0.attackers[0],h1.attackers[0])||!same(h0.defenders[0],h1.defenders[0]))throw new Error('startup changed');
  for(const s of run.samples){
    if(s.attackers[0].strengthLow!==h0.attackers[0].strengthLow||s.attackers[0].strengthHigh!==h0.attackers[0].strengthHigh)throw new Error(`hour ${s.hour}: attacker strength changed`);
    if(s.defenders[0].strengthLow!==h0.defenders[0].strengthLow||s.defenders[0].strengthHigh!==h0.defenders[0].strengthHigh)throw new Error(`hour ${s.hour}: defender strength changed`);
  }
  const counts={zero:0,one:0,two:0,three:0,four:0,outOfRange:0},intervals=[];
  for(let h=2;h<=81;h++){
    const x=classify(run.samples[h-1].defenders[0],run.samples[h].defenders[0]);
    intervals.push({fromHour:h-1,toHour:h,...x});
    if(x.die===0)counts.zero++;else if(x.die===1)counts.one++;else if(x.die===2)counts.two++;else if(x.die===3)counts.three++;else if(x.die===4)counts.four++;else counts.outOfRange++;
  }
  return {counts,intervals};
}
export function parseO16Batch(text){const candidates=parseO16Runs(text),accepted=[],rejected=[];candidates.forEach((r,i)=>{try{accepted.push({runNumber:i+1,capture:captureO16Run(r)});}catch(error){rejected.push({runNumber:i+1,reason:error.message});}});return {scenario:O16_SCENARIO,totalRuns:candidates.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,runs:accepted};}

async function cli(){const [,,input]=process.argv;if(!input){console.error('Usage: node scripts/oracle-o16-trial81.mjs <game.log>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(parseO16Batch(await fs.readFile(input,'utf8')),null,2)+'\n');}catch(error){console.error(`O16 parse failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O23_SCENARIO='o23-armored-org-die-v1';
export const O23_HOURS=Object.freeze(Array.from({length:122},(_,i)=>i));

function finite(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
function kv(s){const o={};for(const m of String(s).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))o[m[1]]=m[2];return o;}
function payload(line){const i=line.indexOf('WPO23');return i<0?null:line.slice(i+5).trim();}
function measure(f,line){
  const o={};
  for(const k of ['orgLow','orgHigh','strengthLow','strengthHigh']){
    const n=finite(f[k]);if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${k}`);o[k]=n;
  }
  if(o.orgLow>o.orgHigh||o.strengthLow>o.strengthHigh)throw new Error(`line ${line}: reversed bounds`);
  return o;
}
function sameAll(a,b){return ['orgLow','orgHigh','strengthLow','strengthHigh'].every(k=>a[k]===b[k]);}
function midOrg(m){return (m.orgLow+m.orgHigh)/2;}
function classify(loss,strict){
  if(!strict)return 0;
  if(loss<.13)return 1;
  if(loss<.225)return 2;
  if(loss<.315)return 3;
  if(loss<.405)return 4;
  if(loss<.495)return 5;
  if(loss<.585)return 6;
  return 7;
}

export function parseO23Runs(text){
  const runs=[];let run=null,current=null;
  for(const [i,line] of String(text??'').split(/\r?\n/).entries()){
    const p=payload(line);if(p===null)continue;
    const j=p.indexOf(' '),type=j<0?p:p.slice(0,j),f=kv(j<0?'':p.slice(j+1)),lineNo=i+1;
    if(type==='BEGIN'){run={begin:f,samples:[],end:null};runs.push(run);current=null;continue;}
    if(!run)continue;
    if(type==='SAMPLE'){
      const hour=finite(f.hour);if(hour===null)throw new Error(`line ${lineNo}: bad hour`);
      current={hour,attackers:[],defenders:[]};run.samples.push(current);continue;
    }
    if(type==='ATTACKER'||type==='DEFENDER'){
      if(!current)throw new Error(`line ${lineNo}: measurement before sample`);
      (type==='ATTACKER'?current.attackers:current.defenders).push(measure(f,lineNo));continue;
    }
    if(type==='END'){run.end=f;current=null;}
  }
  return runs;
}

export function captureO23Run(run){
  const b=run?.begin||{};if(!run?.end)throw new Error('missing END');
  if(Number(b.schema)!==1||b.scenario!==O23_SCENARIO)throw new Error('bad schema/scenario');
  if(b.gameVersion!=='1.19.3.0.c01a'||b.checksum!=='5632'||b.checksumScope!=='base-game-reference')throw new Error('bad version/checksum');
  if(b.method!=='bisection14'||b.runMode!=='trial121'||b.tacticMode!=='neutral-basic-only')throw new Error('bad method/run/tactics');
  if(b.defineOverrides!=='DEFENDED_HIT:100,UNDEFENDED_HIT:0,ORG_MOD:0.053,ORG_DICE:4,ORG_ARMOR_DICE:6,STR_DAMAGE:0,NIGHT:0')throw new Error('bad defines');
  if(b.attackModifier!=='-0.721'||b.defenseModifier!=='-0.9923784016'||b.attackerArmor!=='20'||b.attackerPiercing!=='20'||b.defenderArmor!=='20'||b.defenderPiercing!=='4'||b.prepared!=='yes')throw new Error('bad modifiers/armor metadata');
  if(run.end.reason!=='trial121-complete'||Number(run.end.hour)!==121||run.end.modifiersRemoved!=='yes'||run.end.cleanupFailure==='yes')throw new Error('bad cleanup');
  if(JSON.stringify(run.samples.map(s=>s.hour))!==JSON.stringify(O23_HOURS))throw new Error('expected hours 0..121');
  for(const s of run.samples)if(s.attackers.length!==1||s.defenders.length!==1)throw new Error('expected one attacker and defender');
  const h0=run.samples[0],h1=run.samples[1];
  if(!sameAll(h0.attackers[0],h1.attackers[0])||!sameAll(h0.defenders[0],h1.defenders[0]))throw new Error('startup changed');
  for(const s of run.samples){
    if(s.attackers[0].strengthLow!==h1.attackers[0].strengthLow||s.attackers[0].strengthHigh!==h1.attackers[0].strengthHigh)throw new Error('attacker strength changed');
    if(s.defenders[0].strengthLow!==h1.defenders[0].strengthLow||s.defenders[0].strengthHigh!==h1.defenders[0].strengthHigh)throw new Error('defender strength changed');
  }
  const counts={zero:0,one:0,two:0,three:0,four:0,five:0,six:0,outOfSupport:0},intervals=[];
  const labels=['zero','one','two','three','four','five','six','outOfSupport'];
  for(let h=2;h<=121;h++){
    const prev=run.samples[h-1].defenders[0],cur=run.samples[h].defenders[0];
    const loss=(midOrg(prev)-midOrg(cur))*100;
    const strict=cur.orgHigh<prev.orgLow;
    const die=classify(loss,strict);
    counts[labels[die]]++;
    intervals.push({fromHour:h-1,toHour:h,orgLossPp:loss,strict,die});
  }
  return {counts,intervals};
}

export function parseO23Batch(text){
  const candidates=parseO23Runs(text),accepted=[],rejected=[];
  candidates.forEach((r,i)=>{try{accepted.push({runNumber:i+1,capture:captureO23Run(r)});}catch(error){rejected.push({runNumber:i+1,reason:error.message});}});
  return {scenario:O23_SCENARIO,totalRuns:candidates.length,acceptedRuns:accepted.length,rejectedRuns:rejected.length,rejected,runs:accepted};
}

async function cli(){
  const [,,input]=process.argv;if(!input){console.error('Usage: node scripts/oracle-o23-trial121.mjs <game.log>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(parseO23Batch(await fs.readFile(input,'utf8')),null,2)+'\n');}
  catch(error){console.error(`O23 parse failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

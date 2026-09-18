import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O2_HOURS=Object.freeze(Array.from({length:7},(_,i)=>i));
export const O2_SCENARIO='o2-defended-amplified-v1';
export const O2_AMPLIFIER='army_infantry_attack_factor:+2.0';

function finite(value){
  const n=Number(String(value??'').replace(',','.'));
  return Number.isFinite(n)?n:null;
}
function kv(text){
  const out={};
  for(const m of String(text).matchAll(/([A-Za-z][A-Za-z0-9_]*)=([^\s]+)/g))out[m[1]]=m[2];
  return out;
}
function payload(line){
  const i=line.indexOf('WPO2');
  return i<0?null:line.slice(i+4).trim();
}
function measure(fields,line){
  const names=['orgLow','orgHigh','strengthLow','strengthHigh'];
  const out={};
  for(const name of names){
    const n=finite(fields[name]);
    if(n===null||n<0||n>1)throw new Error(`line ${line}: invalid ${name}`);
    out[name]=n;
  }
  if(out.orgLow>out.orgHigh)throw new Error(`line ${line}: org bounds reversed`);
  if(out.strengthLow>out.strengthHigh)throw new Error(`line ${line}: strength bounds reversed`);
  return out;
}
function midpoint(low,high){return (low+high)*50;}
function round(x,d=6){const p=10**d;return Math.round((x+Number.EPSILON)*p)/p;}

export function parseO2Runs(text){
  const runs=[];let run=null,current=null;
  const lines=String(text??'').split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const p=payload(lines[i]);if(p===null)continue;
    const space=p.indexOf(' '),type=(space<0?p:p.slice(0,space)),rest=space<0?'':p.slice(space+1);
    const fields=kv(rest),line=i+1;
    if(type==='BEGIN'){
      run={begin:fields,beginLine:line,samples:[],end:null};runs.push(run);current=null;continue;
    }
    if(!run)continue;
    if(type==='SAMPLE'){
      const hour=finite(fields.hour);if(hour===null)throw new Error(`line ${line}: non-finite hour`);
      current={hour,attackers:[],defenders:[],line};run.samples.push(current);continue;
    }
    if(type==='ATTACKER'||type==='DEFENDER'){
      if(!current)throw new Error(`line ${line}: ${type} before SAMPLE`);
      const m=measure(fields,line);
      (type==='ATTACKER'?current.attackers:current.defenders).push(m);continue;
    }
    if(type==='END'){run.end={...fields,line};current=null;continue;}
    if(type==='STATUS')run.status={...fields,line};
  }
  return runs;
}

export function captureO2Run(run){
  if(!run?.end)throw new Error('END marker is missing');
  if(Number(run.begin?.schema)!==1)throw new Error('unsupported WPO2 schema');
  if(run.begin.scenario!==O2_SCENARIO)throw new Error(`unexpected scenario ${run.begin.scenario||'missing'}`);
  if(run.begin.runMode!=='trial6')throw new Error(`unexpected runMode ${run.begin.runMode||'missing'}`);
  if(run.begin.tacticMode!=='neutral-basic-only')throw new Error(`unexpected tacticMode ${run.begin.tacticMode||'missing'}`);
  if(run.begin.amplifier!==O2_AMPLIFIER)throw new Error(`unexpected amplifier ${run.begin.amplifier||'missing'}`);
  if(run.end.reason!=='trial6-complete')throw new Error(`unexpected end reason ${run.end.reason||'missing'}`);
  if(run.end.amplifierRemoved!=='yes')throw new Error('amplifier removal was not logged');

  const samples=run.samples.map(s=>{
    if(s.attackers.length!==1)throw new Error(`hour ${s.hour}: expected 1 attacker, got ${s.attackers.length}`);
    if(s.defenders.length!==1)throw new Error(`hour ${s.hour}: expected 1 defender, got ${s.defenders.length}`);
    const a=s.attackers[0],d=s.defenders[0];
    return {
      hour:s.hour,
      attacker:{org:midpoint(a.orgLow,a.orgHigh),strength:midpoint(a.strengthLow,a.strengthHigh)},
      defender:{org:midpoint(d.orgLow,d.orgHigh),strength:midpoint(d.strengthLow,d.strengthHigh)}
    };
  });
  const hours=samples.map(s=>s.hour);
  if(JSON.stringify(hours)!==JSON.stringify(O2_HOURS))throw new Error(`expected hours 0..6, got ${hours.join(',')}`);
  const h0=samples[0],h6=samples.at(-1);
  return {
    metadata:{
      gameVersion:run.begin.gameVersion,
      checksum:run.begin.checksum,
      checksumScope:run.begin.checksumScope||null,
      scenarioId:run.begin.scenario,
      runMode:run.begin.runMode,
      tacticMode:run.begin.tacticMode,
      amplifier:run.begin.amplifier,
      endReason:run.end.reason
    },
    samples,
    deltas:{
      attackerOrgLoss:round(h0.attacker.org-h6.attacker.org),
      attackerStrengthLoss:round(h0.attacker.strength-h6.attacker.strength),
      defenderOrgLoss:round(h0.defender.org-h6.defender.org),
      defenderStrengthLoss:round(h0.defender.strength-h6.defender.strength)
    }
  };
}
function stats(xs){
  const n=xs.length;if(!n)return {n:0,mean:null,sd:null,min:null,max:null};
  const mean=xs.reduce((a,b)=>a+b,0)/n;
  const sd=n>1?Math.sqrt(xs.reduce((s,x)=>s+(x-mean)**2,0)/(n-1)):0;
  return {n,mean:round(mean),sd:round(sd),min:round(Math.min(...xs)),max:round(Math.max(...xs))};
}
export function parseO2Batch(text){
  const candidates=parseO2Runs(text).filter(r=>r.begin?.runMode==='trial6'||r.begin?.scenario===O2_SCENARIO);
  const accepted=[],rejected=[];
  candidates.forEach((r,i)=>{
    try{accepted.push({runNumber:i+1,capture:captureO2Run(r)});}
    catch(error){rejected.push({runNumber:i+1,reason:error.message});}
  });
  const signatures=new Map();
  for(const r of accepted){
    const sig=JSON.stringify(r.capture.samples);
    const group=signatures.get(sig)||[];group.push(r.runNumber);signatures.set(sig,group);
  }
  const duplicateTraceGroups=[...signatures.values()].filter(g=>g.length>1);
  return {
    scenario:O2_SCENARIO,
    totalRuns:candidates.length,
    acceptedRuns:accepted.length,
    rejectedRuns:rejected.length,
    rejected,
    uniqueTraceCount:signatures.size,
    duplicateTraceGroups,
    independentSampleWarning:duplicateTraceGroups.length?'Exact duplicate O2 traces detected; do not treat them as independent.':null,
    primaryMetric:'defenderStrengthLoss',
    metrics:{
      attackerStrengthLoss:stats(accepted.map(r=>r.capture.deltas.attackerStrengthLoss)),
      defenderStrengthLoss:stats(accepted.map(r=>r.capture.deltas.defenderStrengthLoss))
    },
    runs:accepted
  };
}

async function cli(){
  const [,,input,output]=process.argv;
  if(!input){console.error('Usage: node scripts/oracle-o2-trial6.mjs <game.log> [output.json]');process.exitCode=2;return;}
  try{
    const result=parseO2Batch(await fs.readFile(input,'utf8'));
    const json=JSON.stringify(result,null,2)+'\n';
    if(output){await fs.writeFile(output,json,'utf8');console.log(`Wrote O2 summary for ${result.acceptedRuns} accepted trial(s) to ${output}`);}
    else process.stdout.write(json);
  }catch(error){console.error(`O2 parsing failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();

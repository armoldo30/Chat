import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const O2_HOURS=Object.freeze(Array.from({length:7},(_,i)=>i));
export const O2_SCENARIO='o2-defended-amplified-v1';
export const O2_AMPLIFIER='army_infantry_attack_factor:+2.0';
export const O2_GAME_VERSION='1.19.3.0.c01a';
export const O2_BASE_CHECKSUM='5632';
export const O2_CHECKSUM_SCOPE='base-game-reference';
export const O2_METHOD='bisection14';
export const O2_TACTIC_MODE='neutral-basic-only';
export const O2_H0_MIN_BOUND=0.9999;
export const O2_BISECTION_STEPS=14;
export const O2_MEASUREMENT_INTERVAL=1/(2**O2_BISECTION_STEPS);
export const O2_MEASUREMENT_MIDPOINT_MAX_ERROR_PP=100*O2_MEASUREMENT_INTERVAL/2;
export const O2_LOSS_DELTA_MAX_ERROR_PP=100*O2_MEASUREMENT_INTERVAL;

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
function assertFreshH0(measurement,label){
  for(const [lowKey,highKey,name] of [
    ['orgLow','orgHigh','organization'],
    ['strengthLow','strengthHigh','strength']
  ]){
    if(measurement[lowKey]<O2_H0_MIN_BOUND||measurement[highKey]<0.99999){
      throw new Error(`hour 0: ${label} ${name} is not effectively 100%`);
    }
  }
}
function sameMeasurement(a,b){
  return ['orgLow','orgHigh','strengthLow','strengthHigh'].every(key=>a[key]===b[key]);
}
function assertNoStartupDamage(rawH0,rawH1){
  if(!sameMeasurement(rawH0.attackers[0],rawH1.attackers[0])){
    throw new Error('h0->h1 attacker measurement changed; O2 one-hour startup-delay control failed');
  }
  if(!sameMeasurement(rawH0.defenders[0],rawH1.defenders[0])){
    throw new Error('h0->h1 defender measurement changed; O2 one-hour startup-delay control failed');
  }
}

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
  if(run.begin.gameVersion!==O2_GAME_VERSION)throw new Error(`unexpected gameVersion ${run.begin.gameVersion||'missing'}`);
  if(run.begin.checksum!==O2_BASE_CHECKSUM)throw new Error(`unexpected base checksum ${run.begin.checksum||'missing'}`);
  if(run.begin.checksumScope!==O2_CHECKSUM_SCOPE)throw new Error(`unexpected checksumScope ${run.begin.checksumScope||'missing'}`);
  if(run.begin.method!==O2_METHOD)throw new Error(`unexpected measurement method ${run.begin.method||'missing'}`);
  if(run.begin.scenario!==O2_SCENARIO)throw new Error(`unexpected scenario ${run.begin.scenario||'missing'}`);
  if(run.begin.runMode!=='trial6')throw new Error(`unexpected runMode ${run.begin.runMode||'missing'}`);
  if(run.begin.tacticMode!==O2_TACTIC_MODE)throw new Error(`unexpected tacticMode ${run.begin.tacticMode||'missing'}`);
  if(run.begin.amplifier!==O2_AMPLIFIER)throw new Error(`unexpected amplifier ${run.begin.amplifier||'missing'}`);
  if(run.begin.prepared!=='yes')throw new Error('O2 BEGIN did not confirm prepared=yes');
  if(run.end.reason!=='trial6-complete')throw new Error(`unexpected end reason ${run.end.reason||'missing'}`);
  if(Number(run.end.hour)!==6)throw new Error(`unexpected END hour ${run.end.hour||'missing'}`);
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

  const rawH0=run.samples[0],rawH1=run.samples[1];
  assertFreshH0(rawH0.attackers[0],'attacker');
  assertFreshH0(rawH0.defenders[0],'defender');
  assertNoStartupDamage(rawH0,rawH1);

  const h0=samples[0],h6=samples.at(-1);
  return {
    metadata:{
      gameVersion:run.begin.gameVersion,
      checksum:run.begin.checksum,
      checksumScope:run.begin.checksumScope,
      measurementMethod:run.begin.method,
      scenarioId:run.begin.scenario,
      runMode:run.begin.runMode,
      tacticMode:run.begin.tacticMode,
      amplifier:run.begin.amplifier,
      prepared:true,
      endReason:run.end.reason,
      endHour:Number(run.end.hour),
      amplifierRemoved:true
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
  const candidates=parseO2Runs(text);
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
    target:{
      gameVersion:O2_GAME_VERSION,
      baseChecksum:O2_BASE_CHECKSUM,
      checksumScope:O2_CHECKSUM_SCOPE,
      measurementMethod:O2_METHOD,
      tacticMode:O2_TACTIC_MODE,
      amplifier:O2_AMPLIFIER,
      requiredHours:O2_HOURS,
      freshH0MinimumLowerBound:O2_H0_MIN_BOUND,
      requiredStartupNoDamageHours:[0,1],
      bisectionSteps:O2_BISECTION_STEPS,
      measurementMidpointMaxErrorPp:O2_MEASUREMENT_MIDPOINT_MAX_ERROR_PP,
      lossDeltaMaxErrorPp:O2_LOSS_DELTA_MAX_ERROR_PP
    },
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
    runs:accepted,
    acceptanceBoundary:'Parser acceptance verifies every WPO2 BEGIN, exact metadata, fresh h0, no measurable h0->h1 damage, cardinality, hours 0..6, completion, and amplifier cleanup. UI combat stats, exact 11:00-17:00 daylight timing, terrain, supply, planning, entrenchment, commander/reserve state, and use of random_seed remain external scenario controls.'
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

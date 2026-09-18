import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseOracleRuns,oracleCaptureFromRun} from './oracle-log-to-capture.mjs';

export const TRIAL6_HOURS=Object.freeze([0,1,2,3,4,5,6]);

function round(value,digits=6){
  const p=10**digits;
  return Math.round((Number(value)+Number.EPSILON)*p)/p;
}

function metricStats(values){
  const xs=values.map(Number).filter(Number.isFinite);
  if(!xs.length)return {n:0,mean:null,sd:null,min:null,max:null,ci95:null};
  const mean=xs.reduce((a,b)=>a+b,0)/xs.length;
  const variance=xs.length>1?xs.reduce((s,x)=>s+(x-mean)**2,0)/(xs.length-1):0;
  const sd=Math.sqrt(variance);
  const se=sd/Math.sqrt(xs.length);
  const half=1.96*se;
  return {
    n:xs.length,
    mean:round(mean),
    sd:round(sd),
    min:round(Math.min(...xs)),
    max:round(Math.max(...xs)),
    ci95:xs.length>1?{low:round(mean-half),high:round(mean+half),method:'normal-approx'}:null,
  };
}

export function summarizeTrial6Capture(capture){
  const samples=capture.samples||[];
  const first=samples[0],last=samples.at(-1);
  if(!first||!last)throw new Error('trial capture requires samples');
  let zeroDamageIntervals=0;
  let attackerDamageIntervals=0;
  let defenderDamageIntervals=0;
  for(let i=1;i<samples.length;i++){
    const prev=samples[i-1],cur=samples[i];
    const aDamaged=cur.attacker.org<prev.attacker.org||cur.attacker.strength<prev.attacker.strength;
    const dDamaged=cur.defender.org<prev.defender.org||cur.defender.strength<prev.defender.strength;
    if(aDamaged)attackerDamageIntervals++;
    if(dDamaged)defenderDamageIntervals++;
    if(!aDamaged&&!dDamaged)zeroDamageIntervals++;
  }
  return {
    h0:first,
    h6:last,
    deltas:{
      attackerOrgLoss:round(first.attacker.org-last.attacker.org),
      attackerStrengthLoss:round(first.attacker.strength-last.attacker.strength),
      defenderOrgLoss:round(first.defender.org-last.defender.org),
      defenderStrengthLoss:round(first.defender.strength-last.defender.strength),
    },
    attackerDamageIntervals,
    defenderDamageIntervals,
    zeroDamageIntervals,
  };
}

export function parseTrial6Batch(text){
  const parsed=parseOracleRuns(text);
  const trialRuns=parsed.filter(run=>run.begin?.runMode==='trial6');
  const runs=[],rejected=[];
  trialRuns.forEach((run,index)=>{
    try{
      if(!run.end)throw new Error('END marker is missing');
      if(run.end.reason!=='trial6-complete')throw new Error(`unexpected end reason ${run.end.reason||'missing'}`);
      const capture=oracleCaptureFromRun(run);
      const hours=capture.samples.map(sample=>sample.hour);
      if(JSON.stringify(hours)!==JSON.stringify(TRIAL6_HOURS))throw new Error(`expected hours 0..6, got ${hours.join(',')}`);
      runs.push({runNumber:index+1,capture,summary:summarizeTrial6Capture(capture)});
    }catch(error){
      rejected.push({runNumber:index+1,reason:error.message});
    }
  });
  const traceGroups=new Map();
  for(const run of runs){
    const signature=JSON.stringify(run.capture.samples.map(sample=>({
      hour:sample.hour,
      attacker:sample.attacker,
      defender:sample.defender,
    })));
    const group=traceGroups.get(signature)||[];
    group.push(run.runNumber);
    traceGroups.set(signature,group);
  }
  const duplicateTraceGroups=[...traceGroups.values()].filter(group=>group.length>1);
  const uniqueTraceCount=traceGroups.size;
  const independentSampleWarning=duplicateTraceGroups.length
    ? `Detected exact duplicate trial traces: ${duplicateTraceGroups.map(group=>group.join(',')).join(' | ')}. Reloading the same save may be restoring RNG state; do not treat duplicate traces as independent stochastic samples.`
    : null;

  const metrics={
    attackerOrgLoss:metricStats(runs.map(r=>r.summary.deltas.attackerOrgLoss)),
    attackerStrengthLoss:metricStats(runs.map(r=>r.summary.deltas.attackerStrengthLoss)),
    defenderOrgLoss:metricStats(runs.map(r=>r.summary.deltas.defenderOrgLoss)),
    defenderStrengthLoss:metricStats(runs.map(r=>r.summary.deltas.defenderStrengthLoss)),
  };
  const intervals=runs.length*6;
  return {
    totalTrial6Runs:trialRuns.length,
    acceptedRuns:runs.length,
    rejectedRuns:rejected.length,
    rejected,
    uniqueTraceCount,
    duplicateTraceGroups,
    independentSampleWarning,
    metrics,
    zeroDamageIntervalRate:intervals?round(runs.reduce((s,r)=>s+r.summary.zeroDamageIntervals,0)/intervals):null,
    runs,
  };
}

async function cli(){
  const [,,input,output]=process.argv;
  if(!input){
    console.error('Usage: node scripts/oracle-trial6-batch.mjs <game.log> [output.json]');
    process.exitCode=2;return;
  }
  try{
    const result=parseTrial6Batch(await fs.readFile(input,'utf8'));
    const json=JSON.stringify(result,null,2)+'\n';
    if(output){
      await fs.writeFile(output,json,'utf8');
      console.log(`Wrote Oracle batch summary for ${result.acceptedRuns} accepted trial(s) to ${output}`);
    }else process.stdout.write(json);
  }catch(error){
    console.error(`Oracle trial6 batch parsing failed: ${error.message}`);
    process.exitCode=1;
  }
}

const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();

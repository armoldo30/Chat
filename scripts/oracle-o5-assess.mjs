import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO5Batch} from './oracle-o5-trial11.mjs';

const SINGLE_LEVEL_RANGE_PP=0.02;
const CLUSTER_RANGE_PP=0.02;
const MIN_CLUSTER_SEPARATION_PP=0.04;
const RATIO_LOW=1.8;
const RATIO_HIGH=2.2;
const WORST_SINGLE_CLUSTER_PROBABILITY=0.7**10+0.3**10;

function mean(xs){return xs.reduce((a,b)=>a+b,0)/xs.length;}
function range(xs){return Math.max(...xs)-Math.min(...xs);}
function bestSplit(values){
  const xs=[...values].sort((a,b)=>a-b);
  let best=null;
  for(let k=1;k<xs.length;k++){
    const low=xs.slice(0,k),high=xs.slice(k),lm=mean(low),hm=mean(high);
    const sse=low.reduce((s,x)=>s+(x-lm)**2,0)+high.reduce((s,x)=>s+(x-hm)**2,0);
    const candidate={k,low,high,lowMean:lm,highMean:hm,lowRange:range(low),highRange:range(high),separation:Math.min(...high)-Math.max(...low),ratio:hm/lm,sse};
    if(!best||candidate.sse<best.sse)best=candidate;
  }
  return best;
}
function validateStats(stats){
  const a=Number(stats?.attackerSoft),d=Number(stats?.defenderDefense);
  if(!Number.isFinite(a)||a<14||a>16)throw new Error(`O5 requires displayed GER Soft Attack in [14,16], got ${stats?.attackerSoft}`);
  if(!Number.isFinite(d)||d<200)throw new Error(`O5 requires high POL Defense >=200, got ${stats?.defenderDefense}`);
  if(a>=d)throw new Error('O5 requires the GER path to remain fully defended');
  return {attackerSoft:a,defenderDefense:d};
}

export function assessO5({batch,observedStats}){
  const stats=validateStats(observedStats);
  const base={schemaVersion:1,scenario:'o5-fixed-damage-integerization-v1',evidenceStatus:'unvalidated',observedCombatPanel:stats,worstCaseSingleClusterProbability:WORST_SINGLE_CLUSTER_PROBABILITY};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const run=batch.runs[0].capture;
  if(run.intervals.length!==10)return {...base,stage:'invalid-interval-count',action:'review-control'};
  if(run.positiveIntervals!==10)return {...base,stage:'unexpected-zero-damage-interval',action:'current-model-mismatch-or-control-review',positiveIntervals:run.positiveIntervals};

  const losses=run.intervals.map(x=>x.orgLossPp);
  const globalRange=range(losses);
  if(globalRange<=SINGLE_LEVEL_RANGE_PP){
    return {...base,stage:'complete',action:'single-level-mismatch-candidate',losses,globalRange,
      interpretation:'All ten fixed-damage intervals collapse to one magnitude. Under the predeclared current stochastic 1-or-2 point model, the worst-case probability of observing only one multiplicity across ten intervals is about 2.83%.'};
  }

  const split=bestSplit(losses);
  const stable=split.lowRange<=CLUSTER_RANGE_PP&&split.highRange<=CLUSTER_RANGE_PP&&split.separation>=MIN_CLUSTER_SEPARATION_PP;
  const ratioOk=split.ratio>=RATIO_LOW&&split.ratio<=RATIO_HIGH;
  if(stable&&ratioOk){
    return {...base,stage:'complete',action:'stochastic-discrete-multiplicity-supported',losses,cluster:{
      lowCount:split.low.length,highCount:split.high.length,lowMean:split.lowMean,highMean:split.highMean,
      lowRange:split.lowRange,highRange:split.highRange,separation:split.separation,ratio:split.ratio
    },interpretation:'The ten fixed-damage intervals form two stable organization-loss levels with an approximately 2:1 magnitude ratio. This is strong executable evidence for stochastic discrete damage multiplicity at the controlled O5 boundary, while exact internal integerization placement remains unvalidated.'};
  }
  return {...base,stage:'complete',action:'unexpected-damage-pattern-review',losses,cluster:split,
    interpretation:'The fixed-damage trace does not match either the predeclared single-level or clean two-level 2:1 pattern. Review diagnostic controls before changing the planner.'};
}

export function assessO5Log({text,attackerSoft,defenderDefense}){const batch=parseO5Batch(text);return {assessment:assessO5({batch,observedStats:{attackerSoft,defenderDefense}}),batch};}

async function cli(){
  const [,,input,aSoft,dDef]=process.argv;
  if([input,aSoft,dDef].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o5-assess.mjs <game.log> <GER soft> <POL defense>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(assessO5Log({text:await fs.readFile(input,'utf8'),attackerSoft:Number(aSoft),defenderDefense:Number(dDef)}),null,2)+'\n');}
  catch(error){console.error(`O5 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

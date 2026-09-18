import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {simulateOnce} from '../src/engine.js';
import {terrain} from '../src/data.js';

function seededRng(seed=0x02){
  let a=seed>>>0;
  return ()=>{
    a|=0;a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
function quantile(sorted,p){
  const x=(sorted.length-1)*p,lo=Math.floor(x),hi=Math.ceil(x);
  return lo===hi?sorted[lo]:sorted[lo]+(sorted[hi]-sorted[lo])*(x-lo);
}
function stats(xs){
  const n=xs.length,mean=xs.reduce((a,b)=>a+b,0)/n;
  const sd=n>1?Math.sqrt(xs.reduce((s,x)=>s+(x-mean)**2,0)/(n-1)):0;
  const sorted=[...xs].sort((a,b)=>a-b);
  return {
    n,mean,sd,min:sorted[0],max:sorted.at(-1),
    q05:quantile(sorted,.05),q25:quantile(sorted,.25),median:quantile(sorted,.5),
    q75:quantile(sorted,.75),q95:quantile(sorted,.95),
    zeroLossProbability:xs.filter(x=>Math.abs(x)<1e-12).length/n
  };
}
function side(){
  return {
    divisionCount:1,singleWidth:18,width:18,manpower:9000,
    org:60,hp:225,supply:.54,
    hard:0,hardness:0,armor:0,piercing:0,airAttack:0,
    terrainAttack:{},terrainDefense:{},need:{}
  };
}
function plannerO2Draws({
  attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense,
  runs=100000,seed=0x021193
}){
  for(const [name,value] of Object.entries({attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense})){
    if(!Number.isFinite(value)||value<0)throw new Error(`${name} must be a finite nonnegative number`);
  }
  if(!Number.isInteger(runs)||runs<100)throw new Error('runs must be an integer >= 100');
  if(attackerSoft>=defenderDefense){
    throw new Error(`O2 fully-defended control violated: attacker soft attack ${attackerSoft} must remain below defender defense ${defenderDefense}`);
  }
  const a={...side(),soft:attackerSoft,breakthrough:attackerBreakthrough,def:0};
  const d={...side(),soft:defenderSoft,def:defenderDefense,breakthrough:0};
  const opts={
    terrain:'plains',terrainData:terrain,directions:0,
    entrench:0,fort:0,river:0,asupply:1,dsupply:1,
    air:0,cas:0,planning:0,night:0,maxHours:6,
    initialFireDelayHours:1
  };
  const rng=seededRng(seed),attackerStrengthLoss=[],defenderStrengthLoss=[];
  for(let i=0;i<runs;i++){
    const r=simulateOnce(a,d,opts,rng);
    attackerStrengthLoss.push(r.attackerCasualtyRate*100);
    defenderStrengthLoss.push(r.defenderCasualtyRate*100);
  }
  return {
    inputs:{attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense},
    attackerStrengthLoss,
    defenderStrengthLoss
  };
}
function summarizeDraws(draws,label=null){
  return {
    ...(label?{label}:{}),
    inputs:draws.inputs,
    attackerStrengthLoss:stats(draws.attackerStrengthLoss),
    defenderStrengthLoss:stats(draws.defenderStrengthLoss)
  };
}
export function plannerO2Sample(args){
  return summarizeDraws(plannerO2Draws(args));
}
function empiricalSampleMeanInterval(samples,n,{replicates=50000,seed=0x02,centralProbability=0.99}={}){
  if(!Array.isArray(samples)||!samples.length)throw new Error('planner samples required');
  if(!Number.isInteger(n)||n<1)throw new Error('sample-mean n must be a positive integer');
  if(!Number.isInteger(replicates)||replicates<1000)throw new Error('sample-mean replicates must be at least 1000');
  if(!(centralProbability>0&&centralProbability<1))throw new Error('centralProbability must be between 0 and 1');
  const rng=seededRng(seed),means=new Array(replicates);
  for(let r=0;r<replicates;r++){
    let sum=0;
    for(let i=0;i<n;i++)sum+=samples[Math.floor(rng()*samples.length)];
    means[r]=sum/n;
  }
  means.sort((a,b)=>a-b);
  const tail=(1-centralProbability)/2;
  return {
    n,
    method:'empirical-bootstrap-from-planner-monte-carlo',
    centralProbability,
    replicates,
    low:quantile(means,tail),
    high:quantile(means,1-tail)
  };
}
function sensitivityInputs(mid,halfWidth){
  if(!Number.isFinite(halfWidth)||halfWidth<0)throw new Error('displayHalfWidth must be finite and nonnegative');
  const keys=['attackerSoft','attackerBreakthrough','defenderSoft','defenderDefense'];
  const points=[{label:'midpoint',inputs:{...mid}}];
  for(let mask=0;mask<16;mask++){
    const inputs={};
    const signs=[];
    keys.forEach((key,index)=>{
      const sign=(mask&(1<<index))?1:-1;
      signs.push(sign>0?'+':'-');
      inputs[key]=Math.max(0,mid[key]+sign*halfWidth);
    });
    points.push({label:`corner-${signs.join('')}`,inputs});
  }
  return points;
}

export function buildO2Reference({
  attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense,
  runs=100000,displayHalfWidth=1,sampleMeanReplicates=50000
}){
  const mid={attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense};
  const pointDefs=sensitivityInputs(mid,displayHalfWidth);
  for(const point of pointDefs){
    if(point.inputs.attackerSoft>=point.inputs.defenderDefense){
      throw new Error('O2 displayed-stat sensitivity crosses the fully-defended threshold; reject this scenario rather than comparing it.');
    }
  }

  const drawSets=pointDefs.map((point,index)=>({
    label:point.label,
    draws:plannerO2Draws({...point.inputs,runs,seed:0x020001+index})
  }));
  const sensitivityPoints=drawSets.map(x=>summarizeDraws(x.draws,x.label));
  const midpoint=sensitivityPoints.find(x=>x.label==='midpoint');
  const ordered=[...sensitivityPoints].sort((a,b)=>a.defenderStrengthLoss.mean-b.defenderStrengthLoss.mean);
  const primaryMinPoint=ordered[0],primaryMaxPoint=ordered.at(-1);

  const sampleMeanEnvelope=(n,centralProbability)=>{
    const bounds=drawSets.map((entry,index)=>({
      label:entry.label,
      ...empiricalSampleMeanInterval(
        entry.draws.defenderStrengthLoss,n,
        {replicates:sampleMeanReplicates,seed:0x022000+n*32+index,centralProbability}
      )
    }));
    return {
      n,
      method:'empirical-bootstrap-union-across-full-planner-input-sensitivity',
      centralProbability,
      replicatesPerSensitivityPoint:sampleMeanReplicates,
      sensitivityPointCount:bounds.length,
      low:Math.min(...bounds.map(x=>x.low)),
      high:Math.max(...bounds.map(x=>x.high)),
      sensitivityIntervals:bounds
    };
  };

  return {
    schemaVersion:2,
    scenario:'o2-defended-amplified-v1',
    evidenceStatus:'unvalidated',
    referenceClassification:'planner analytical',
    sourceObservationClassification:'executable inferred',
    primaryMetric:'defenderStrengthLoss',
    runsPerSensitivityPoint:runs,
    displayHalfWidth,
    sensitivityPointCount:sensitivityPoints.length,
    sensitivityDesign:'midpoint plus all 16 corners of the four-dimensional ±displayHalfWidth input box',
    controls:{
      template:'9 infantry, no support',
      hp:225,
      width:18,
      daylightWindow:'11:00-17:00',
      initialFireDelayHours:1,
      tacticMode:'neutral-basic-only',
      targetHardness:0,
      supply:1,
      planning:0,
      entrenchment:0,
      commanders:'none'
    },
    fullyDefendedAcrossSensitivity:true,
    midpoint,
    primaryMinPoint,
    primaryMaxPoint,
    sensitivityPoints,
    primaryMeanSensitivity:{
      min:primaryMinPoint.defenderStrengthLoss.mean,
      midpoint:midpoint.defenderStrengthLoss.mean,
      max:primaryMaxPoint.defenderStrengthLoss.mean
    },
    predeclaredSamplingPlan:{
      preliminaryUniqueRuns:6,
      confirmatoryTotalUniqueRuns:12,
      intervalMethod:'empirical planner Monte Carlo sample-mean bootstrap; union across midpoint plus all 16 corners of the displayed-input sensitivity box',
      preliminaryMeanInterval95:sampleMeanEnvelope(6,0.95),
      confirmatoryMeanInterval99:sampleMeanEnvelope(12,0.99),
      interpretation:[
        'If the 6-run executable primary-metric mean is outside the conservative planner 95% sample-mean interval, collect 6 more independent runs before any divergence classification.',
        'If the 12-run executable primary-metric mean remains outside the conservative planner 99% sample-mean interval, treat that as confirmatory evidence of a material O2 resolver mismatch subject to scenario-control review.',
        'If the executable mean is inside either interval, O2 remains unvalidated; interval inclusion is not an Oracle validation criterion.'
      ]
    },
    note:'Use directly observed O2 combat-panel values. This report tests the current planner resolver; it does not validate the O2 modifier or executable modifier ordering.'
  };
}

function usage(){
  console.error('Usage: node scripts/oracle-o2-planner-reference.mjs <GER soft attack> <GER breakthrough> <POL soft attack> <POL defense> [runs]');
}
async function cli(){
  const [,,aSoftRaw,aBreakRaw,dSoftRaw,dDefRaw,runsRaw]=process.argv;
  if([aSoftRaw,aBreakRaw,dSoftRaw,dDefRaw].some(v=>v===undefined)){usage();process.exitCode=2;return;}
  const values=[aSoftRaw,aBreakRaw,dSoftRaw,dDefRaw].map(Number);
  const runs=runsRaw===undefined?100000:Number(runsRaw);
  if(values.some(v=>!Number.isFinite(v))||!Number.isInteger(runs)||runs<100){usage();process.exitCode=2;return;}
  try{
    const report=buildO2Reference({
      attackerSoft:values[0],attackerBreakthrough:values[1],
      defenderSoft:values[2],defenderDefense:values[3],
      runs
    });
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
  }catch(error){console.error(`O2 planner reference failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();

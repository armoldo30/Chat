import fs from 'node:fs/promises';
import {simulateOnce} from '../src/engine.js';
import {terrain} from '../src/data.js';

const DEFAULT_EXECUTABLE='oracle-lab/captures/o1-base-neutral-tactics-batch-10-summary.json';

function seededRng(seed=0x193){
  let a=seed>>>0;
  return ()=>{
    a|=0;a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
function stats(xs){
  const n=xs.length,mean=xs.reduce((a,b)=>a+b,0)/n;
  const sd=n>1?Math.sqrt(xs.reduce((s,x)=>s+(x-mean)**2,0)/(n-1)):0;
  return {n,mean,sd,min:Math.min(...xs),max:Math.max(...xs)};
}
function t95(mean,sd,n){
  // t(0.975,9)=2.262; sufficient for the fixed n=10 executable preliminary batch.
  const t=n===10?2.262:1.96;
  const h=t*sd/Math.sqrt(n);
  return [mean-h,mean+h];
}
function side(){
  return {
    divisionCount:1,singleWidth:18,width:18,manpower:9000,
    org:60,hp:225,supply:.54,
    hard:0,hardness:0,armor:0,piercing:0,airAttack:0,
    terrainAttack:{},terrainDefense:{},need:{}
  };
}

async function plannerSample({runs=100000,delayHours=1,seed=0x1193}={}){
  // The pre-neutralization combat screenshot showed Basic Attack/Basic Defend at
  // displayed soft attack 75 / 73. Those vanilla basic tactics are +5% tactic
  // damage; the O1-base mod neutralizes them. Integer UI display adds small
  // rounding uncertainty, handled separately in the report.
  const a={...side(),soft:75/1.05,breakthrough:35,def:0};
  const d={...side(),soft:73/1.05,def:255,breakthrough:0};
  const opts={
    terrain:'plains',terrainData:terrain,directions:0,
    entrench:0,fort:0,river:0,asupply:1,dsupply:1,
    air:0,cas:0,planning:0,night:0,maxHours:6,
    initialFireDelayHours:delayHours
  };
  const rng=seededRng(seed),aStr=[],dStr=[];
  for(let i=0;i<runs;i++){
    const r=simulateOnce(a,d,opts,rng);
    aStr.push(r.attackerCasualtyRate*100);
    dStr.push(r.defenderCasualtyRate*100);
  }
  return {attackerStrengthLoss:stats(aStr),defenderStrengthLoss:stats(dStr)};
}

const input=process.argv[2]||DEFAULT_EXECUTABLE;
const executable=JSON.parse(await fs.readFile(input,'utf8'));
const xA=executable.runs.map(r=>Number(r.attackerStrengthLoss));
const xD=executable.runs.map(r=>Number(r.defenderStrengthLoss));
const exec={
  attackerStrengthLoss:{...stats(xA)},
  defenderStrengthLoss:{...stats(xD)}
};
exec.attackerStrengthLoss.ci95Mean=t95(exec.attackerStrengthLoss.mean,exec.attackerStrengthLoss.sd,exec.attackerStrengthLoss.n);
exec.defenderStrengthLoss.ci95Mean=t95(exec.defenderStrengthLoss.mean,exec.defenderStrengthLoss.sd,exec.defenderStrengthLoss.n);

const [legacy,delayed]=await Promise.all([
  plannerSample({delayHours:0,seed:0x119300}),
  plannerSample({delayHours:1,seed:0x119301})
]);

function assessment(planner,observed){
  const [lo,hi]=observed.ci95Mean;
  return {
    plannerMean:planner.mean,
    executableMean:observed.mean,
    delta:planner.mean-observed.mean,
    insideExecutableMeanCI:planner.mean>=lo&&planner.mean<=hi
  };
}

const report={
  schemaVersion:1,
  scenario:'o1-base-neutral-tactics-v1',
  evidenceBoundary:'strength-only preliminary comparison; organization deferred until exact doctrine/org state is extracted',
  executable,
  plannerInputs:{
    template:'9 infantry, no support',
    width:18,
    hp:225,
    attackerSoftAttackApprox:75/1.05,
    defenderSoftAttackApprox:73/1.05,
    attackerBreakthroughDisplayed:35,
    defenderDefenseDisplayed:255,
    targetHardness:0,
    daylight:true,
    supply:1,
    planning:0,
    entrenchment:0,
    commanders:'none',
    note:'Soft-attack inputs are derived from the pre-neutralization combat UI after removing Basic Attack/Basic Defend +5% tactic damage; integer UI rounding remains bounded uncertainty.'
  },
  currentPlannerNoStartupDelay:legacy,
  oraclePatchedOneHourDelay:delayed,
  assessment:{
    noDelay:{
      attackerStrengthLoss:assessment(legacy.attackerStrengthLoss,exec.attackerStrengthLoss),
      defenderStrengthLoss:assessment(legacy.defenderStrengthLoss,exec.defenderStrengthLoss)
    },
    oneHourDelay:{
      attackerStrengthLoss:assessment(delayed.attackerStrengthLoss,exec.attackerStrengthLoss),
      defenderStrengthLoss:assessment(delayed.defenderStrengthLoss,exec.defenderStrengthLoss)
    }
  }
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');

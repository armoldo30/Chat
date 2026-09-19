import fs from 'node:fs/promises';
import {simulateOnce} from '../src/engine.js';
import {terrain} from '../src/data.js';

const DEFAULT_EXECUTABLE='oracle-lab/captures/o1-base-neutral-tactics-batch-10-summary.json';
const DEFAULT_RUNS=100000;
const runsFromEnv=Number(process.env.ORACLE_COMPARE_RUNS);
const PLANNER_RUNS=Number.isFinite(runsFromEnv)&&runsFromEnv>=100?Math.floor(runsFromEnv):DEFAULT_RUNS;

// Controlled O1 facts recovered from the executable setup/history. These are not
// a reconstruction of HOI4 modifier ordering. The effective combat-panel values
// below remain the stronger input for the hit/damage resolver.
const O1_CONTROLLED=Object.freeze({
  sharedBaseSoftAttack:54,
  sharedExperienceAttackFactor:0.25,
  vanillaBasicTacticFactor:0.05,
  displayed:Object.freeze({
    attackerSoftAttack:75,
    defenderSoftAttack:73,
    attackerBreakthrough:35,
    defenderDefense:255
  }),
  // The handoff records the combat-panel numbers as approximate integer values.
  // +/-1 is therefore a deliberately conservative sensitivity width, not a claim
  // about HOI4 UI rounding semantics and not an executable confidence interval.
  displayedSensitivityHalfWidth:1
});

function seededRng(seed=0x193){
  let a=seed>>>0;
  return ()=>{
    a|=0;a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
function quantile(sorted,p){
  if(!sorted.length)return 0;
  const x=(sorted.length-1)*p;
  const lo=Math.floor(x),hi=Math.ceil(x);
  if(lo===hi)return sorted[lo];
  return sorted[lo]+(sorted[hi]-sorted[lo])*(x-lo);
}
function stats(xs){
  const n=xs.length,mean=xs.reduce((a,b)=>a+b,0)/n;
  const sd=n>1?Math.sqrt(xs.reduce((s,x)=>s+(x-mean)**2,0)/(n-1)):0;
  const sorted=[...xs].sort((a,b)=>a-b);
  return {
    n,mean,sd,min:sorted[0],max:sorted[sorted.length-1],
    q05:quantile(sorted,.05),q25:quantile(sorted,.25),median:quantile(sorted,.5),
    q75:quantile(sorted,.75),q95:quantile(sorted,.95),
    zeroLossProbability:xs.filter(x=>Math.abs(x)<1e-12).length/n
  };
}
function t95(mean,sd,n){
  // t(0.975,9)=2.262 for the fixed n=10 executable preliminary batch.
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
function displayRange(value){
  const u=O1_CONTROLLED.displayedSensitivityHalfWidth;
  return [value-u,value+u];
}
function removeBasicTactic(range){
  const f=1+O1_CONTROLLED.vanillaBasicTacticFactor;
  return [range[0]/f,range[1]/f];
}
function midpoint([lo,hi]){return (lo+hi)/2;}
function residualRange(effectiveRange){
  const afterExperience=O1_CONTROLLED.sharedBaseSoftAttack*(1+O1_CONTROLLED.sharedExperienceAttackFactor);
  return effectiveRange.map(x=>x/afterExperience);
}

const ranges=Object.freeze({
  attackerSoftAttack:removeBasicTactic(displayRange(O1_CONTROLLED.displayed.attackerSoftAttack)),
  defenderSoftAttack:removeBasicTactic(displayRange(O1_CONTROLLED.displayed.defenderSoftAttack)),
  attackerBreakthrough:displayRange(O1_CONTROLLED.displayed.attackerBreakthrough),
  defenderDefense:displayRange(O1_CONTROLLED.displayed.defenderDefense)
});

function plannerSample({
  runs=PLANNER_RUNS,delayHours=1,seed=0x1193,
  attackerSoft=midpoint(ranges.attackerSoftAttack),
  defenderSoft=midpoint(ranges.defenderSoftAttack),
  attackerBreakthrough=midpoint(ranges.attackerBreakthrough),
  defenderDefense=midpoint(ranges.defenderDefense)
}={}){
  const a={...side(),soft:attackerSoft,breakthrough:attackerBreakthrough,def:0};
  const d={...side(),soft:defenderSoft,def:defenderDefense,breakthrough:0};
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
  return {
    inputs:{attackerSoft,defenderSoft,attackerBreakthrough,defenderDefense},
    attackerStrengthLoss:stats(aStr),
    defenderStrengthLoss:stats(dStr)
  };
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

const midpointInputs={
  attackerSoft:midpoint(ranges.attackerSoftAttack),
  defenderSoft:midpoint(ranges.defenderSoftAttack),
  attackerBreakthrough:midpoint(ranges.attackerBreakthrough),
  defenderDefense:midpoint(ranges.defenderDefense)
};
const lowDamageInputs={
  attackerSoft:ranges.attackerSoftAttack[0],
  defenderSoft:ranges.defenderSoftAttack[0],
  attackerBreakthrough:ranges.attackerBreakthrough[1],
  defenderDefense:ranges.defenderDefense[1]
};
const highDamageInputs={
  attackerSoft:ranges.attackerSoftAttack[1],
  defenderSoft:ranges.defenderSoftAttack[1],
  attackerBreakthrough:ranges.attackerBreakthrough[0],
  defenderDefense:ranges.defenderDefense[0]
};

const [legacyMidpoint,delayedLow,delayedMidpoint,delayedHigh]=await Promise.all([
  plannerSample({...midpointInputs,delayHours:0,seed:0x119300}),
  plannerSample({...lowDamageInputs,delayHours:1,seed:0x119301}),
  plannerSample({...midpointInputs,delayHours:1,seed:0x119302}),
  plannerSample({...highDamageInputs,delayHours:1,seed:0x119303})
]);

function meanEnvelope(low,mid,high,key){
  const means=[low[key].mean,mid[key].mean,high[key].mean];
  return {min:Math.min(...means),midpoint:mid[key].mean,max:Math.max(...means)};
}
function descriptiveComparison(envelope,observed){
  return {
    plannerMeanSensitivity:envelope,
    executableMean:observed.mean,
    executableMeanCi95Exploratory:observed.ci95Mean,
    observedMeanInsidePlannerSensitivityEnvelope:
      observed.mean>=envelope.min&&observed.mean<=envelope.max,
    note:'Descriptive only. Envelope overlap or CI overlap is not an Oracle validation criterion.'
  };
}

const attackerMeanEnvelope=meanEnvelope(delayedLow,delayedMidpoint,delayedHigh,'attackerStrengthLoss');
const defenderMeanEnvelope=meanEnvelope(delayedLow,delayedMidpoint,delayedHigh,'defenderStrengthLoss');
const afterExperience=O1_CONTROLLED.sharedBaseSoftAttack*(1+O1_CONTROLLED.sharedExperienceAttackFactor);

const report={
  schemaVersion:2,
  scenario:'o1-base-neutral-tactics-v1',
  evidenceBoundary:'strength-only exploratory distribution comparison; organization remains deferred until final executable organization/doctrine state is exact',
  evidenceStatus:'unvalidated',
  plannerRunsPerSensitivityPoint:PLANNER_RUNS,
  executable,
  plannerInputs:{
    exactControlled:{
      template:'9 infantry, no support',
      width:18,
      hp:225,
      manpower:9000,
      sharedBaseSoftAttack:O1_CONTROLLED.sharedBaseSoftAttack,
      sharedExperienceAttackFactor:O1_CONTROLLED.sharedExperienceAttackFactor,
      sharedSoftAttackAfterExperience:afterExperience,
      targetHardness:0,
      daylight:true,
      supply:1,
      planning:0,
      entrenchment:0,
      commanders:'none',
      evidenceByField:{
        template:'game-file exact',
        width:'game-file exact',
        hp:'game-file exact',
        manpower:'game-file exact',
        sharedBaseSoftAttack:'executable inferred',
        sharedExperienceAttackFactor:'executable inferred',
        scenarioControls:'executable inferred'
      }
    },
    uiDerivedSensitivity:{
      vanillaBasicTacticFactorRemoved:O1_CONTROLLED.vanillaBasicTacticFactor,
      displayedSensitivityHalfWidth:O1_CONTROLLED.displayedSensitivityHalfWidth,
      attackerSoftAttackNeutralRange:ranges.attackerSoftAttack,
      defenderSoftAttackNeutralRange:ranges.defenderSoftAttack,
      attackerBreakthroughRange:ranges.attackerBreakthrough,
      defenderDefenseRange:ranges.defenderDefense,
      attackerResidualEffectiveMultiplierRange:residualRange(ranges.attackerSoftAttack),
      defenderResidualEffectiveMultiplierRange:residualRange(ranges.defenderSoftAttack),
      evidenceClass:'planner analytical',
      sourceObservationClass:'executable inferred',
      note:'The +/-1 display envelope is intentionally conservative because the retained evidence records these UI values as approximate integers. It is not a claim about HOI4 UI rounding. Soft attack removes the known vanilla Basic tactic +5% before comparison; exact country/doctrine modifier ordering remains unvalidated.'
    }
  },
  hitRegimeAcrossSensitivity:{
    attackerIntoDefender:{
      allAttackPointsRemainDefended:ranges.attackerSoftAttack[1]<ranges.defenderDefense[0],
      maximumNeutralAttack:ranges.attackerSoftAttack[1],
      minimumDefenderDefense:ranges.defenderDefense[0]
    },
    defenderIntoAttacker:{
      undefendedAttackPointsRemainPossible:ranges.defenderSoftAttack[0]>ranges.attackerBreakthrough[1],
      minimumNeutralAttack:ranges.defenderSoftAttack[0],
      maximumAttackerBreakthrough:ranges.attackerBreakthrough[1]
    },
    note:'This is a threshold-regime check only; it does not validate combat-point scale, stochastic rounding, or hit probability.'
  },
  historicalNoStartupDelayMidpoint:legacyMidpoint,
  oraclePatchedOneHourDelay:{
    lowDamage:delayedLow,
    midpoint:delayedMidpoint,
    highDamage:delayedHigh,
    meanSensitivity:{
      attackerStrengthLoss:attackerMeanEnvelope,
      defenderStrengthLoss:defenderMeanEnvelope
    }
  },
  descriptiveComparison:{
    attackerStrengthLoss:descriptiveComparison(attackerMeanEnvelope,exec.attackerStrengthLoss),
    defenderStrengthLoss:descriptiveComparison(defenderMeanEnvelope,exec.defenderStrengthLoss)
  },
  limitations:[
    'n=10 executable runs is preliminary and too small for strong equivalence claims',
    'effective attack/defense/breakthrough are still bounded from retained UI evidence rather than directly logged under the neutral harness',
    'organization comparison remains deferred',
    'combat-point scale, hit-roll distribution, damage dice, RNG ordering, and modifier ordering remain unvalidated',
    'no overlap result in this report is a pass/fail Oracle promotion criterion'
  ]
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');

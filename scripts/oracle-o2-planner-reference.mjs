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
export function plannerO2Sample({
  attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense,
  runs=100000,seed=0x021193
}){
  for(const [name,value] of Object.entries({attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense})){
    if(!Number.isFinite(value)||value<0)throw new Error(`${name} must be a finite nonnegative number`);
  }
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
    attackerStrengthLoss:stats(attackerStrengthLoss),
    defenderStrengthLoss:stats(defenderStrengthLoss)
  };
}

export function buildO2Reference({
  attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense,
  runs=100000,displayHalfWidth=1
}){
  const mid={attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense};
  const low={
    attackerSoft:Math.max(0,attackerSoft-displayHalfWidth),
    attackerBreakthrough:attackerBreakthrough+displayHalfWidth,
    defenderSoft:Math.max(0,defenderSoft-displayHalfWidth),
    defenderDefense:defenderDefense+displayHalfWidth
  };
  const high={
    attackerSoft:attackerSoft+displayHalfWidth,
    attackerBreakthrough:Math.max(0,attackerBreakthrough-displayHalfWidth),
    defenderSoft:defenderSoft+displayHalfWidth,
    defenderDefense:Math.max(0,defenderDefense-displayHalfWidth)
  };
  for(const point of [low,mid,high]){
    if(point.attackerSoft>=point.defenderDefense){
      throw new Error('O2 displayed-stat sensitivity crosses the fully-defended threshold; reject this scenario rather than comparing it.');
    }
  }
  const lowResult=plannerO2Sample({...low,runs,seed:0x020001});
  const midResult=plannerO2Sample({...mid,runs,seed:0x020002});
  const highResult=plannerO2Sample({...high,runs,seed:0x020003});
  const points=[lowResult,midResult,highResult];
  const primaryMeans=points.map(r=>r.defenderStrengthLoss.mean);
  const sampleMeanEnvelope=(n,z)=>{
    const bounds=points.map(r=>{
      const s=r.defenderStrengthLoss;
      const half=z*s.sd/Math.sqrt(n);
      return {low:s.mean-half,high:s.mean+half};
    });
    return {
      n,
      method:'normal-approx-across-planner-input-sensitivity',
      low:Math.min(...bounds.map(x=>x.low)),
      high:Math.max(...bounds.map(x=>x.high))
    };
  };
  return {
    schemaVersion:1,
    scenario:'o2-defended-amplified-v1',
    evidenceStatus:'unvalidated',
    referenceClassification:'planner analytical',
    sourceObservationClassification:'executable inferred',
    primaryMetric:'defenderStrengthLoss',
    runsPerSensitivityPoint:runs,
    displayHalfWidth,
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
    lowDamage:lowResult,
    midpoint:midResult,
    highDamage:highResult,
    primaryMeanSensitivity:{
      min:Math.min(...primaryMeans),
      midpoint:midResult.defenderStrengthLoss.mean,
      max:Math.max(...primaryMeans)
    },
    predeclaredSamplingPlan:{
      preliminaryUniqueRuns:6,
      confirmatoryTotalUniqueRuns:12,
      preliminaryMeanInterval99:sampleMeanEnvelope(6,2.576),
      confirmatoryMeanInterval99:sampleMeanEnvelope(12,2.576),
      interpretation:[
        'If the 6-run executable primary-metric mean is outside the conservative planner 99% sample-mean interval, collect 6 more independent runs before any divergence classification.',
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
  if(values.some(v=>!Number.isFinite(v))||!Number.isFinite(runs)||runs<100){usage();process.exitCode=2;return;}
  try{
    const report=buildO2Reference({
      attackerSoft:values[0],attackerBreakthrough:values[1],
      defenderSoft:values[2],defenderDefense:values[3],
      runs:Math.floor(runs)
    });
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
  }catch(error){console.error(`O2 planner reference failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();

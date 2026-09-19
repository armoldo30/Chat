import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CURRENT_COMBAT_POINT_SCALE=0.1;
const DEFENDED_HIT_CHANCE=0.10;
const FIRING_HOURS=5;

function noHitProbabilityOneHour(attackerSoft,{combatPointScale=CURRENT_COMBAT_POINT_SCALE,defendedHitChance=DEFENDED_HIT_CHANCE}={}){
  const x=Math.max(0,Number(attackerSoft)||0)*combatPointScale;
  const lo=Math.floor(x),fraction=x-lo;
  const q=1-defendedHitChance;
  return (1-fraction)*(q**lo)+fraction*(q**(lo+1));
}
function point(attackerSoft){
  const noHitHour=noHitProbabilityOneHour(attackerSoft);
  const zeroDamageRun=noHitHour**FIRING_HOURS;
  return {
    attackerSoft,
    combatPointExpectation:attackerSoft*CURRENT_COMBAT_POINT_SCALE,
    noHitProbabilityPerFiringHour:noHitHour,
    anyStrengthDamageProbabilityPerRun:1-zeroDamageRun,
    zeroStrengthDamageProbabilityPerRun:zeroDamageRun,
    allZeroProbabilityAt6:zeroDamageRun**6,
    allZeroProbabilityAt10:zeroDamageRun**10
  };
}

export function buildO3Reference({attackerSoft,displayHalfWidth=1}={}){
  const observed=Number(attackerSoft);
  if(!Number.isFinite(observed))throw new Error('attackerSoft must be finite');
  if(observed<7||observed>8)throw new Error('O3 accepts displayed GER Soft Attack only in [7,8]');
  if(!Number.isFinite(displayHalfWidth)||displayHalfWidth<0)throw new Error('displayHalfWidth must be finite and nonnegative');
  const low=observed-displayHalfWidth,high=observed+displayHalfWidth;
  if(low<0||high>=10)throw new Error('O3 displayed-stat sensitivity must remain strictly below 10 Soft Attack');
  const sensitivity=[point(low),point(observed),point(high)];
  return {
    schemaVersion:1,
    scenario:'o3-sub10-defended-incidence-v1',
    evidenceStatus:'unvalidated',
    referenceClassification:'planner analytical',
    sourceObservationClassification:'executable inferred',
    primaryMetric:'runsWithDefenderStrengthDamage',
    currentPlannerHypothesis:{
      combatPointScale:CURRENT_COMBAT_POINT_SCALE,
      attackPointIntegerization:'stochastic-round-before-hit-resolution',
      defendedHitChance:DEFENDED_HIT_CHANCE,
      initialFireDelayHours:1,
      firingHours:FIRING_HOURS
    },
    competingGateHypothesis:{
      label:'simple-floor-after-stat-div-10',
      prediction:'zero GER combat points and therefore zero POL strength damage when true GER Soft Attack remains below 10'
    },
    displayHalfWidth,
    sensitivity,
    probabilityEnvelope:{
      anyDamagePerRunMin:Math.min(...sensitivity.map(x=>x.anyStrengthDamageProbabilityPerRun)),
      anyDamagePerRunMid:sensitivity[1].anyStrengthDamageProbabilityPerRun,
      anyDamagePerRunMax:Math.max(...sensitivity.map(x=>x.anyStrengthDamageProbabilityPerRun)),
      allZeroAt6Max:Math.max(...sensitivity.map(x=>x.allZeroProbabilityAt6)),
      allZeroAt10Max:Math.max(...sensitivity.map(x=>x.allZeroProbabilityAt10))
    },
    predeclaredSamplingPlan:{
      preliminaryUniqueRuns:6,
      confirmatoryTotalUniqueRuns:10,
      rules:[
        'If any accepted run shows strict bound-separated POL strength loss after h1, stop: the simple floor(stat/10) zero-transmission hypothesis is contradicted for this controlled boundary. O3 remains unvalidated and does not by itself validate stochastic rounding.',
        'If all first 6 accepted runs show zero POL strength damage, collect exactly 4 more independent runs.',
        'If all 10 accepted runs show zero POL strength damage, create a narrow mismatch candidate against the current stochastic-rounding planner hypothesis because the worst-case all-zero probability across the accepted displayed-stat sensitivity is below 5%.',
        'Any mismatch candidate still requires full external scenario-control review before assigning oracle-divergent.'
      ],
      confirmatoryWorstCaseAllZeroProbabilityThreshold:0.05
    },
    note:'The primary metric is binary incidence, not loss magnitude. Strict raw-bound separation is used as the executable damage detector; an all-zero result remains a composite test of the current planner transmission path rather than proof of a specific alternative integerization rule.'
  };
}

function usage(){console.error('Usage: node scripts/oracle-o3-sub10-reference.mjs <GER Soft Attack>');}
async function cli(){
  const value=Number(process.argv[2]);
  if(!Number.isFinite(value)){usage();process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(buildO3Reference({attackerSoft:value}),null,2)+'\n');}
  catch(error){console.error(`O3 reference failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();

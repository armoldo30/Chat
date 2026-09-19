import path from 'node:path';
import {fileURLToPath} from 'node:url';

function choose(n,k){
  if(k<0||k>n)return 0;
  let r=1;
  for(let i=1;i<=k;i++)r=r*(n-k+i)/i;
  return r;
}
function binomialCdf(k,n,p){
  let s=0;
  for(let i=0;i<=k;i++)s+=choose(n,i)*(p**i)*((1-p)**(n-i));
  return s;
}
function binomialSf(kMinusOne,n,p){return 1-binomialCdf(kMinusOne,n,p);}

export function buildO4Reference({attackerSoft=2,displayHalfWidth=1,totalIntervals=20}={}){
  const observed=Number(attackerSoft);
  if(observed!==2)throw new Error('O4 requires displayed GER Soft Attack exactly 2');
  if(displayHalfWidth!==1)throw new Error('O4 predeclared displayHalfWidth is exactly 1');
  if(totalIntervals!==20)throw new Error('O4 predeclared totalIntervals is exactly 20');

  const softValues=[1,2,3];
  const plannerPoints=softValues.map(soft=>({
    attackerSoft:soft,
    attackPointProbability:soft*0.1,
    undefendedHitChance:0.4,
    damageIncidencePerFiringHour:soft*0.1*0.4
  }));
  const pMin=plannerPoints[0].damageIncidencePerFiringHour;
  const pMid=plannerPoints[1].damageIncidencePerFiringHour;
  const pMax=plannerPoints[2].damageIncidencePerFiringHour;
  const minimumOneP=0.4;

  return {
    schemaVersion:1,
    scenario:'o4-sub10-undefended-incidence-v1',
    evidenceStatus:'unvalidated',
    referenceClassification:'planner analytical',
    sourceObservationClassification:'executable inferred',
    primaryMetric:'positiveDefenderDamageIntervals',
    totalAcceptedRuns:4,
    firingIntervalsPerRun:5,
    totalIntervals,
    currentPlannerHypothesis:{
      combatPointScale:0.1,
      attackPointIntegerization:'stochastic-round-before-hit-resolution',
      undefendedHitChance:0.4,
      displayedSoftAttack:2,
      displayHalfWidth,
      sensitivity:plannerPoints
    },
    competingHypothesis:{
      label:'minimum-one-full-attack-point-for-positive-sub10-attack',
      damageIncidencePerFiringHour:minimumOneP
    },
    exactDecisionProbabilities:{
      minimumOneHypothesis_P_K_le_3:binomialCdf(3,totalIntervals,minimumOneP),
      plannerWorstSensitivity_P_K_le_3:binomialCdf(3,totalIntervals,pMax),
      plannerWorstSensitivity_P_K_ge_6:binomialSf(5,totalIntervals,pMax)
    },
    predeclaredDecision:{
      lowThresholdInclusive:3,
      highThresholdInclusive:6,
      interpretations:{
        low:'K <= 3: narrow mismatch candidate against minimum-one-point hypothesis',
        middle:'K = 4 or 5: inconclusive; stop at four runs',
        high:'K >= 6: narrow mismatch candidate against current stochastic-rounding planner hypothesis'
      }
    },
    note:'O4 counts strict interval-level defender damage incidence. No outcome alone validates the broad resolver.'
  };
}

function usage(){console.error('Usage: node scripts/oracle-o4-reference.mjs');}
async function cli(){
  if(process.argv.length>2){usage();process.exitCode=2;return;}
  process.stdout.write(JSON.stringify(buildO4Reference(),null,2)+'\n');
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();

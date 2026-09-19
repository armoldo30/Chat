import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO3Batch} from './oracle-o3-sub10-trial6.mjs';
import {buildO3Reference} from './oracle-o3-sub10-reference.mjs';

export const O3_EXTERNAL_CONTROLS=Object.freeze([
  'exact clean 11:00 baseline save',
  'neutral tactic Oracle build active',
  'd_oracle_o3_prepare completed before combat creation',
  'built-in random_seed executed before the attack',
  'same one-GER-vs-one-POL 18-width Plains battle',
  'no commanders and no reserves',
  'full starting supply, zero planning, zero POL entrenchment',
  'combat-panel values captured after the trial starts, during the h0->h1 startup interval, before the first firing opportunity',
  'displayed GER Soft Attack is 7 or 8',
  'displayed GER Soft Attack remains at least 10 points below displayed POL Defense',
  'GER Breakthrough and POL offensive/defensive context remain consistent with the controlled baseline apart from the intended GER attack attenuation',
  '11:00->17:00 daylight window'
]);

function finiteStats(stats){
  const names=['attackerSoft','attackerBreakthrough','defenderSoft','defenderDefense'];
  const out={};
  for(const name of names){
    const value=Number(stats?.[name]);
    if(!Number.isFinite(value)||value<0)throw new Error(`${name} must be a finite nonnegative number`);
    out[name]=value;
  }
  if(out.attackerSoft<7||out.attackerSoft>8)throw new Error(`O3 requires displayed GER Soft Attack in [7,8], got ${out.attackerSoft}`);
  if(out.defenderDefense-out.attackerSoft<10){
    throw new Error(`O3 defended-margin control violated: POL Defense - GER Soft Attack must be at least 10, got ${out.defenderDefense-out.attackerSoft}`);
  }
  return out;
}

export function assessO3Decision({batch,reference,observedStats}){
  const stats=finiteStats(observedStats);
  const damageRuns=batch.incidence?.damageRuns??0;
  const base={
    schemaVersion:1,
    scenario:'o3-sub10-defended-incidence-v1',
    evidenceStatus:'unvalidated',
    executableClassification:'executable inferred',
    plannerClassification:'planner analytical',
    observedCombatPanel:stats,
    primaryMetric:'runsWithDefenderStrengthDamage',
    batch:{
      totalRuns:batch.totalRuns,
      acceptedRuns:batch.acceptedRuns,
      rejectedRuns:batch.rejectedRuns,
      uniqueTraceCount:batch.uniqueTraceCount,
      duplicateTraceGroups:batch.duplicateTraceGroups||[],
      damageRuns,
      zeroDamageRuns:batch.incidence?.zeroDamageRuns??0
    },
    referenceProbabilityEnvelope:reference.probabilityEnvelope,
    externalScenarioControlsRequired:O3_EXTERNAL_CONTROLS,
    externalScenarioControlStatus:'requires-manual-evidence-review',
    classificationGate:[
      'Positive sub-10 damage contradicts only the simple floor(stat/10) zero-transmission hypothesis; it does not validate the planner stochastic-rounding implementation.',
      'Ten all-zero runs create only a narrow mismatch candidate against the current planner hypothesis until every external scenario control is reviewed.',
      'Do not promote the broad hit/damage resolver from O3 alone.'
    ]
  };
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-traces'};
  if(batch.acceptedRuns!==batch.uniqueTraceCount)return {...base,stage:'invalid-batch',action:'review-duplicate-full-traces'};
  const n=batch.uniqueTraceCount;
  if(n===0)return {...base,stage:'empty',action:'collect-o3-smoke'};
  if(damageRuns>0){
    return {
      ...base,
      stage:n<6?'early-positive-incidence':(n<10?'preliminary-positive-incidence':'confirmatory-positive-incidence'),
      action:'stop-floor-zero-hypothesis-contradicted',
      interpretation:'At least one accepted run shows measurable POL strength damage while displayed GER Soft Attack remains conservatively sub-10. This contradicts the simple floor(stat/10) zero-transmission hypothesis at the controlled O3 boundary. O3 remains unvalidated and this does not uniquely establish stochastic rounding.'
    };
  }
  if(n<6)return {...base,stage:'preliminary-incomplete',action:'collect-to-6-unique-runs'};
  if(n===6){
    return {
      ...base,
      stage:'preliminary-6-all-zero',
      action:'collect-confirmatory-to-10',
      interpretation:'All first six accepted runs are zero-damage. This remains plausible under the current stochastic-rounding model, so collect exactly four more independent runs.'
    };
  }
  if(n>6&&n<10)return {...base,stage:'confirmatory-incomplete',action:'collect-to-10-unique-runs'};
  if(n>10)return {...base,stage:'non-predeclared-sample-size',action:'do-not-interpret-automatically'};
  const worst=reference.probabilityEnvelope.allZeroAt10Max;
  const miss=worst<reference.predeclaredSamplingPlan.confirmatoryWorstCaseAllZeroProbabilityThreshold;
  return {
    ...base,
    stage:'confirmatory-10-all-zero',
    worstCasePlannerAllZeroProbability:worst,
    action:miss?'stochastic-rounding-mismatch-candidate':'no-confirmatory-mismatch-trigger',
    interpretation:miss
      ? 'All ten accepted O3 runs are zero-damage even though the current planner stochastic-rounding hypothesis assigns less than 5% probability to that outcome across the full accepted displayed-stat sensitivity. This is a narrow mismatch candidate pending complete scenario-control review.'
      : 'The all-zero outcome is not rare enough under the predeclared planner sensitivity to trigger a mismatch candidate.'
  };
}

export function assessO3Log({text,attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense}){
  const observedStats=finiteStats({attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense});
  const batch=parseO3Batch(text);
  const reference=buildO3Reference({attackerSoft:observedStats.attackerSoft,displayHalfWidth:1});
  return {assessment:assessO3Decision({batch,reference,observedStats}),batch,reference};
}

function usage(){console.error('Usage: node scripts/oracle-o3-assess.mjs <game.log> <GER soft> <GER breakthrough> <POL soft> <POL defense>');}
async function cli(){
  const [,,input,aSoftRaw,aBreakRaw,dSoftRaw,dDefRaw]=process.argv;
  if([input,aSoftRaw,aBreakRaw,dSoftRaw,dDefRaw].some(v=>v===undefined)){usage();process.exitCode=2;return;}
  try{
    const result=assessO3Log({text:await fs.readFile(input,'utf8'),attackerSoft:Number(aSoftRaw),attackerBreakthrough:Number(aBreakRaw),defenderSoft:Number(dSoftRaw),defenderDefense:Number(dDefRaw)});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  }catch(error){console.error(`O3 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();

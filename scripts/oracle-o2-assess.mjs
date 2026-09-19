import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO2Batch} from './oracle-o2-trial6.mjs';
import {buildO2Reference} from './oracle-o2-planner-reference.mjs';

export const O2_EXTERNAL_CONTROLS=Object.freeze([
  'exact clean 11:00 baseline save',
  'neutral tactic Oracle build active',
  'd_oracle_o2_prepare completed before combat creation',
  'built-in random_seed executed before the attack',
  'same one-GER-vs-one-POL 18-width Plains battle',
  'no commanders and no reserves',
  'full starting supply, zero planning, zero POL entrenchment',
  'combat-panel values captured after the trial starts, after combat instantiates, no later than the h1 boundary and before advancing into the h1->h2 firing interval',
  'displayed GER Soft Attack at least 10 points below displayed POL Defense',
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
  if(out.defenderDefense-out.attackerSoft<10){
    throw new Error(`O2 defended-margin control violated: POL Defense - GER Soft Attack must be at least 10, got ${out.defenderDefense-out.attackerSoft}`);
  }
  return out;
}
function outside(value,interval){return value<interval.low||value>interval.high;}

export function assessO2Decision({batch,reference,observedStats}){
  const stats=finiteStats(observedStats);
  const base={
    schemaVersion:1,
    scenario:'o2-defended-amplified-v1',
    evidenceStatus:'unvalidated',
    executableClassification:'executable inferred',
    plannerClassification:'planner analytical',
    observedCombatPanel:stats,
    primaryMetric:'defenderStrengthLoss',
    batch:{
      totalRuns:batch.totalRuns,
      acceptedRuns:batch.acceptedRuns,
      rejectedRuns:batch.rejectedRuns,
      uniqueTraceCount:batch.uniqueTraceCount,
      duplicateTraceGroups:batch.duplicateTraceGroups||[],
      mean:batch.metrics?.defenderStrengthLoss?.mean??null
    },
    externalScenarioControlsRequired:O2_EXTERNAL_CONTROLS,
    externalScenarioControlStatus:'requires-manual-evidence-review',
    classificationGate:[
      'Interval inclusion never promotes O2 to oracle-validated.',
      'A confirmatory interval miss is only a mismatch candidate until every external scenario control is reviewed.',
      'Assign oracle-divergent only after that final control review confirms the predeclared O2 scenario.'
    ]
  };

  if(batch.rejectedRuns>0){
    return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-traces',reason:'At least one WPO2 run failed machine acceptance.'};
  }
  if(batch.acceptedRuns!==batch.uniqueTraceCount){
    return {...base,stage:'invalid-batch',action:'replace-duplicate-traces',reason:'Exact duplicate traces cannot be treated as independent samples.'};
  }
  const n=batch.uniqueTraceCount;
  const mean=base.batch.mean;
  if(n===0)return {...base,stage:'empty',action:'collect-o2-smoke'};
  if(n===1)return {...base,stage:'smoke-only',action:'review-smoke-controls-before-collecting-more'};
  if(n<6)return {...base,stage:'preliminary-incomplete',action:'collect-to-6-unique-runs'};
  if(n>6&&n<12)return {...base,stage:'confirmatory-incomplete',action:'collect-to-12-unique-runs'};
  if(n>12)return {...base,stage:'non-predeclared-sample-size',action:'do-not-interpret-automatically',reason:'Predeclared decision points are exactly 6 and 12 unique runs.'};

  if(n===6){
    const interval=reference?.predeclaredSamplingPlan?.preliminaryMeanInterval95;
    if(!interval)throw new Error('planner reference missing preliminaryMeanInterval95');
    const miss=outside(mean,interval);
    return {
      ...base,
      stage:'preliminary-6',
      referenceInterval:interval,
      outsideReferenceInterval:miss,
      action:miss?'collect-confirmatory-to-12':'no-preliminary-mismatch-trigger',
      interpretation:miss
        ? 'The six-run mean is outside the predeclared measurement-adjusted empirical planner 95% interval. Collect exactly six more independent runs before any divergence interpretation.'
        : 'The six-run mean is inside the predeclared measurement-adjusted empirical planner 95% interval. O2 remains unvalidated; do not promote the resolver.'
    };
  }

  const interval=reference?.predeclaredSamplingPlan?.confirmatoryMeanInterval99;
  if(!interval)throw new Error('planner reference missing confirmatoryMeanInterval99');
  const miss=outside(mean,interval);
  return {
    ...base,
    stage:'confirmatory-12',
    referenceInterval:interval,
    outsideReferenceInterval:miss,
    action:miss?'confirmatory-mismatch-candidate':'no-confirmatory-mismatch-trigger',
    interpretation:miss
      ? 'The 12-run mean remains outside the predeclared measurement-adjusted empirical planner 99% interval. This is a material mismatch candidate, not yet oracle-divergent until external controls are reviewed.'
      : 'The 12-run mean is inside the predeclared measurement-adjusted empirical planner 99% interval. O2 remains unvalidated; interval inclusion is not validation.'
  };
}

export function assessO2Log({
  text,attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense,
  plannerRuns=100000,sampleMeanReplicates=50000
}){
  const observedStats=finiteStats({attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense});
  const batch=parseO2Batch(text);
  const reference=buildO2Reference({
    ...observedStats,
    runs:plannerRuns,
    displayHalfWidth:1,
    sampleMeanReplicates
  });
  return {
    assessment:assessO2Decision({batch,reference,observedStats}),
    batch,
    reference
  };
}

function usage(){
  console.error('Usage: node scripts/oracle-o2-assess.mjs <game.log> <GER soft> <GER breakthrough> <POL soft> <POL defense> [plannerRuns] [bootstrapReplicates]');
}
async function cli(){
  const [,,input,aSoftRaw,aBreakRaw,dSoftRaw,dDefRaw,runsRaw,repsRaw]=process.argv;
  if([input,aSoftRaw,aBreakRaw,dSoftRaw,dDefRaw].some(v=>v===undefined)){usage();process.exitCode=2;return;}
  const plannerRuns=runsRaw===undefined?100000:Number(runsRaw);
  const sampleMeanReplicates=repsRaw===undefined?50000:Number(repsRaw);
  if(!Number.isInteger(plannerRuns)||plannerRuns<100||!Number.isInteger(sampleMeanReplicates)||sampleMeanReplicates<1000){
    usage();process.exitCode=2;return;
  }
  try{
    const result=assessO2Log({
      text:await fs.readFile(input,'utf8'),
      attackerSoft:Number(aSoftRaw),
      attackerBreakthrough:Number(aBreakRaw),
      defenderSoft:Number(dSoftRaw),
      defenderDefense:Number(dDefRaw),
      plannerRuns,
      sampleMeanReplicates
    });
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  }catch(error){
    console.error(`O2 assessment failed: ${error.message}`);
    process.exitCode=1;
  }
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO4Batch} from './oracle-o4-trial6.mjs';
import {buildO4Reference} from './oracle-o4-reference.mjs';

export const O4_EXTERNAL_CONTROLS=Object.freeze([
  'exact clean 11:00 baseline save',
  'neutral tactic Oracle build active',
  'd_oracle_o4_prepare completed before combat creation',
  'built-in random_seed executed before the attack',
  'same one-GER-vs-one-POL 18-width Plains battle',
  'no commanders and no reserves',
  'full starting supply, zero planning, zero POL entrenchment',
  'combat-panel values captured after the trial starts, during the h0->h1 startup interval, before the first firing opportunity',
  'displayed GER Soft Attack exactly 2',
  'displayed POL Defense exactly 0',
  'GER Breakthrough and POL Soft Attack remain baseline-like apart from intended O4 interventions',
  '11:00->17:00 daylight window'
]);

function finiteStats(stats){
  const names=['attackerSoft','attackerBreakthrough','defenderSoft','defenderDefense'],out={};
  for(const name of names){
    const value=Number(stats?.[name]);
    if(!Number.isFinite(value)||value<0)throw new Error(`${name} must be finite and nonnegative`);
    out[name]=value;
  }
  if(out.attackerSoft!==2)throw new Error(`O4 requires displayed GER Soft Attack exactly 2, got ${out.attackerSoft}`);
  if(out.defenderDefense!==0)throw new Error(`O4 requires displayed POL Defense exactly 0, got ${out.defenderDefense}`);
  return out;
}

export function assessO4Decision({batch,reference,observedStats}){
  const stats=finiteStats(observedStats);
  const base={
    schemaVersion:1,scenario:'o4-sub10-undefended-incidence-v1',evidenceStatus:'unvalidated',
    executableClassification:'executable inferred',plannerClassification:'planner analytical',
    observedCombatPanel:stats,primaryMetric:'positiveDefenderDamageIntervals',
    batch:{
      totalRuns:batch.totalRuns,acceptedRuns:batch.acceptedRuns,rejectedRuns:batch.rejectedRuns,
      uniqueTraceCount:batch.uniqueTraceCount,duplicateTraceGroups:batch.duplicateTraceGroups||[],
      positiveIntervals:batch.incidence?.positiveIntervals??0,totalFiringIntervals:batch.incidence?.totalFiringIntervals??0
    },
    reference:reference.exactDecisionProbabilities,
    externalScenarioControlsRequired:O4_EXTERNAL_CONTROLS,
    externalScenarioControlStatus:'requires-manual-evidence-review'
  };
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-traces'};
  if(batch.acceptedRuns!==batch.uniqueTraceCount)return {...base,stage:'invalid-batch',action:'review-duplicate-full-traces'};
  const n=batch.uniqueTraceCount;
  if(n===0)return {...base,stage:'empty',action:'collect-o4-smoke'};
  if(n<4)return {...base,stage:'fixed-sample-incomplete',action:'collect-to-4-unique-runs'};
  if(n>4)return {...base,stage:'non-predeclared-sample-size',action:'do-not-interpret-automatically'};
  if(batch.incidence.totalFiringIntervals!==20)throw new Error(`expected 20 firing intervals, got ${batch.incidence.totalFiringIntervals}`);

  const k=batch.incidence.positiveIntervals;
  if(k<=3){
    return {...base,stage:'fixed-4-complete',action:'minimum-one-point-mismatch-candidate',
      interpretation:'K <= 3. This outcome has about 1.60% probability under the predeclared minimum-one-point p=0.40 model, while remaining common across the current planner sensitivity. This is a narrow mismatch candidate pending complete external-control review.'};
  }
  if(k>=6){
    return {...base,stage:'fixed-4-complete',action:'stochastic-rounding-mismatch-candidate',
      interpretation:'K >= 6. At the most damage-favoring current planner sensitivity p=0.12, this tail has about 2.60% probability. This is a narrow mismatch candidate pending complete external-control review.'};
  }
  return {...base,stage:'fixed-4-complete',action:'inconclusive-stop',
    interpretation:'K is 4 or 5. O4 is inconclusive between the predeclared hypotheses. Stop at four runs and design a different experiment rather than extending this batch after seeing the result.'};
}

export function assessO4Log({text,attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense}){
  const observedStats=finiteStats({attackerSoft,attackerBreakthrough,defenderSoft,defenderDefense});
  const batch=parseO4Batch(text),reference=buildO4Reference();
  return {assessment:assessO4Decision({batch,reference,observedStats}),batch,reference};
}

function usage(){console.error('Usage: node scripts/oracle-o4-assess.mjs <game.log> <GER soft> <GER breakthrough> <POL soft> <POL defense>');}
async function cli(){
  const [,,input,aSoft,aBreak,dSoft,dDef]=process.argv;
  if([input,aSoft,aBreak,dSoft,dDef].some(v=>v===undefined)){usage();process.exitCode=2;return;}
  try{
    const result=assessO4Log({text:await fs.readFile(input,'utf8'),attackerSoft:Number(aSoft),attackerBreakthrough:Number(aBreak),defenderSoft:Number(dSoft),defenderDefense:Number(dDef)});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  }catch(error){console.error(`O4 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(invoked)await cli();

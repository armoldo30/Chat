import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO14Batch} from './oracle-o14-trial81.mjs';

export const O14_ACCEPTED_ONE_MIN=2;
export const O14_ACCEPTED_ONE_MAX=16;

function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);if(ds!==20||ts!==20)throw new Error(`O14 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);if(dd!==10||td!==10)throw new Error(`O14 requires POL Defense exactly 10.0, got displayed=${dd} tooltip=${td}`);return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};}

export function assessO14({batch,panel}){
  const observed=validatePanel(panel),base={schemaVersion:1,scenario:'o14-normal-defended-hit-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const counts=batch.runs[0].capture.counts,n=counts.zero+counts.one+counts.twoPlus;
  if(n!==80)return {...base,stage:'bad-interval-count',action:'review-control',counts};
  if(counts.twoPlus>0)return {...base,stage:'complete',action:'defended-hit-semantics-mismatch',counts,interpretation:'A firing interval produced two-or-more fixed-damage defended hits even though O11 established one defended attack point per interval at the same panel.'};
  const supported=counts.one>=O14_ACCEPTED_ONE_MIN&&counts.one<=O14_ACCEPTED_ONE_MAX;
  return {...base,stage:'complete',action:supported?'defended-hit-10pct-supported':'defended-hit-semantics-mismatch',counts,expectedHitProbability:.10,exactCentral99Acceptance:Object.freeze({min:O14_ACCEPTED_ONE_MIN,max:O14_ACCEPTED_ONE_MAX}),interpretation:supported?'The observed successful defended-hit count lies inside the predeclared exact central 99% Binomial(80,0.10) acceptance region.':'The observed successful defended-hit count lies outside the predeclared Binomial(80,0.10) acceptance region.'};
}
export function assessO14Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO14Batch(text);return {assessment:assessO14({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}

async function cli(){const [,,input,ds,ts,dd,td]=process.argv;if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o14-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(assessO14Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}catch(error){console.error(`O14 assessment failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

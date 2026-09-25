import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO16Batch} from './oracle-o16-trial81.mjs';

export const O16_CHI2_CRITICAL_1PCT_DF3=11.34487;
function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);if(ds!==20||ts!==20)throw new Error(`O16 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);if(dd!==10||td!==10)throw new Error(`O16 requires POL Defense exactly 10.0, got displayed=${dd} tooltip=${td}`);return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};}
function chi2(c){return ((c.one-20)**2/20)+((c.two-20)**2/20)+((c.three-20)**2/20)+((c.four-20)**2/20);}

export function assessO16({batch,panel}){
  const observed=validatePanel(panel),base={schemaVersion:1,scenario:'o16-normal-org-die-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const counts=batch.runs[0].capture.counts,n=counts.zero+counts.one+counts.two+counts.three+counts.four+counts.outOfRange;
  if(n!==80)return {...base,stage:'bad-interval-count',action:'review-control',counts};
  if(counts.zero>0||counts.outOfRange>0)return {...base,stage:'complete',action:'org-die-semantics-mismatch',counts,interpretation:'Observed organization damage support includes zero or a value outside the predeclared 1-through-4 die family.'};
  const stat=chi2(counts),allObserved=counts.one>0&&counts.two>0&&counts.three>0&&counts.four>0;
  const supported=stat<=O16_CHI2_CRITICAL_1PCT_DF3&&allObserved;
  return {...base,stage:'complete',action:supported?'org-die-uniform-1-through-4-supported':'org-die-semantics-mismatch',counts,expectedProbabilities:{one:.25,two:.25,three:.25,four:.25},pearsonChiSquare:stat,criticalValue:O16_CHI2_CRITICAL_1PCT_DF3,interpretation:supported?'The one-hit organization-damage distribution matches a uniform integer die on 1 through 4 at the controlled O16 boundary.':'The one-hit organization-damage distribution does not match the predeclared uniform 1-through-4 die.'};
}
export function assessO16Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO16Batch(text);return {assessment:assessO16({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}

async function cli(){const [,,input,ds,ts,dd,td]=process.argv;if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o16-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(assessO16Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}catch(error){console.error(`O16 assessment failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

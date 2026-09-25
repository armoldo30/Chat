import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO9Batch} from './oracle-o9-trial61.mjs';

export const O9_CHI2_CRITICAL_1PCT_DF2=9.21034;
function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){
  const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);
  if(ds!==20||ts!==20)throw new Error(`O9 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);
  if(dd!==10||td!==10)throw new Error(`O9 requires POL Defense exactly 10.0, got displayed=${dd} tooltip=${td}`);
  return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};
}
function chi2(c){
  return ((c.one-15)**2/15)+((c.two-30)**2/30)+((c.three-15)**2/15);
}
export function assessO9({batch,panel}){
  const observed=validatePanel(panel);
  const base={schemaVersion:1,scenario:'o9-o8-all-hit-transport-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const counts=batch.runs[0].capture.counts;
  const n=counts.zero+counts.one+counts.two+counts.three+counts.fourPlus;
  if(n!==60)return {...base,stage:'bad-interval-count',action:'review-control',counts};
  if(counts.zero>0||counts.fourPlus>0){
    return {...base,stage:'complete',action:'o7-attack-law-does-not-transport',counts,
      interpretation:'Observed all-hit multiplicity lies outside the O7 1x/2x/3x support.'};
  }
  const stat=chi2(counts);
  const supported=stat<=O9_CHI2_CRITICAL_1PCT_DF2&&counts.one>0&&counts.three>0;
  return {...base,stage:'complete',action:supported?'o7-attack-law-transports':'o7-attack-law-does-not-transport',
    counts,candidateProbabilities:{one:0.25,two:0.5,three:0.25},pearsonChiSquare:stat,criticalValue:O9_CHI2_CRITICAL_1PCT_DF2,
    interpretation:supported
      ? 'The O7 wider attack-point distribution transports to the exact O8 20-attack/10-defense scenario when both defended and undefended points are forced to hit. This localizes the O8 mismatch downstream to the defended-vs-undefended split or hit-resolution ordering.'
      : 'The O7 wider attack-point distribution does not transport cleanly to the O8 low-defense scenario even when all points are forced to hit.'};
}
export function assessO9Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO9Batch(text);return {assessment:assessO9({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}
async function cli(){
  const [,,input,ds,ts,dd,td]=process.argv;
  if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o9-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(assessO9Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}
  catch(error){console.error(`O9 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

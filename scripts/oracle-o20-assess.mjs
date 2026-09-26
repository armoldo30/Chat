import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO20Batch} from './oracle-o20-trial161.mjs';

export const O20_PROBS=Object.freeze({zero:.7164,one:.2488,twoPlus:.0348});
export const O20_CHI2_CRITICAL_1PCT_DF2=9.21034;

function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);if(ds!==20||ts!==20)throw new Error(`O20 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);if(dd!==18||td!==18)throw new Error(`O20 requires POL Defense exactly 18.0, got displayed=${dd} tooltip=${td}`);return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};}
function chi2(c){const exp={zero:160*O20_PROBS.zero,one:160*O20_PROBS.one,twoPlus:160*O20_PROBS.twoPlus};return ((c.zero-exp.zero)**2/exp.zero)+((c.one-exp.one)**2/exp.one)+((c.twoPlus-exp.twoPlus)**2/exp.twoPlus);}

export function assessO20({batch,panel}){
  const observed=validatePanel(panel),base={schemaVersion:1,scenario:'o20-normal-hit-transport-defense18-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const raw=batch.runs[0].capture.counts,n=raw.zero+raw.one+raw.two+raw.three+raw.fourPlus;
  if(n!==160)return {...base,stage:'bad-interval-count',action:'review-control',counts:raw};
  if(raw.fourPlus>0)return {...base,stage:'complete',action:'normal-hit-transport-mismatch',counts:raw,interpretation:'Observed 4+ fixed-damage hits even though the predeclared 20/18 point family has support only through 3 hits.'};
  const grouped={zero:raw.zero,one:raw.one,twoPlus:raw.two+raw.three};
  const stat=chi2(grouped),supported=stat<=O20_CHI2_CRITICAL_1PCT_DF2&&grouped.twoPlus>0;
  return {...base,stage:'complete',action:supported?'normal-hit-transport-defense18-supported':'normal-hit-transport-mismatch',counts:raw,grouped,expectedProbabilities:O20_PROBS,pearsonChiSquare:stat,criticalValue:O20_CHI2_CRITICAL_1PCT_DF2,interpretation:supported?'The full normal defended/undefended hit-gate mixture transports to the independently validated Defense-18 point-partition boundary.':'The observed grouped hit multiplicities do not match the predeclared normal 20/18 transport distribution.'};
}

export function assessO20Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO20Batch(text);return {assessment:assessO20({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}
async function cli(){const [,,input,ds,ts,dd,td]=process.argv;if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o20-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(assessO20Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}catch(error){console.error(`O20 assessment failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

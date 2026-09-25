import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO15Batch} from './oracle-o15-trial161.mjs';

export const O15_CHI2_CRITICAL_1PCT_DF2=9.21034;
const PROBS=Object.freeze({zero:.64,one:.32,two:.04});

function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);if(ds!==20||ts!==20)throw new Error(`O15 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);if(dd!==10||td!==10)throw new Error(`O15 requires POL Defense exactly 10.0, got displayed=${dd} tooltip=${td}`);return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};}
function chi2(c){return ((c.zero-102.4)**2/102.4)+((c.one-51.2)**2/51.2)+((c.two-6.4)**2/6.4);}

export function assessO15({batch,panel}){
  const observed=validatePanel(panel),base={schemaVersion:1,scenario:'o15-normal-undefended-hit-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const counts=batch.runs[0].capture.counts,n=counts.zero+counts.one+counts.two+counts.threePlus;
  if(n!==160)return {...base,stage:'bad-interval-count',action:'review-control',counts};
  if(counts.threePlus>0)return {...base,stage:'complete',action:'undefended-hit-semantics-mismatch',counts,interpretation:'Observed fixed-damage undefended hit support exceeded the predeclared 0x/1x/2x family.'};
  const stat=chi2(counts),supported=stat<=O15_CHI2_CRITICAL_1PCT_DF2&&counts.two>0;
  return {...base,stage:'complete',action:supported?'undefended-hit-40pct-supported':'undefended-hit-semantics-mismatch',counts,expectedProbabilities:PROBS,pearsonChiSquare:stat,criticalValue:O15_CHI2_CRITICAL_1PCT_DF2,interpretation:supported?'The normal undefended hit-count distribution matches the predeclared 40% gate at the controlled 20/10 boundary.':'The normal undefended hit-count distribution does not match the predeclared 40% gate.'};
}
export function assessO15Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO15Batch(text);return {assessment:assessO15({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}

async function cli(){const [,,input,ds,ts,dd,td]=process.argv;if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o15-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(assessO15Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}catch(error){console.error(`O15 assessment failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

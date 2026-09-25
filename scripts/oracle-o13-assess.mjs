import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO13Batch} from './oracle-o13-trial81.mjs';

export const O13_CHI2_CRITICAL_1PCT_DF1=6.634897;

function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);if(ds!==20||ts!==20)throw new Error(`O13 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);if(dd!==18||td!==18)throw new Error(`O13 requires POL Defense exactly 18.0, got displayed=${dd} tooltip=${td}`);return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};}
function chi2(c){return ((c.one-32)**2/32)+((c.two-48)**2/48);}

export function assessO13({batch,panel}){
  const observed=validatePanel(panel),base={schemaVersion:1,scenario:'o13-defended-only-defense18-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const counts=batch.runs[0].capture.counts,n=counts.zero+counts.one+counts.two+counts.three+counts.fourPlus;
  if(n!==80)return {...base,stage:'bad-interval-count',action:'review-control',counts};
  if(counts.zero>0||counts.three>0||counts.fourPlus>0)return {...base,stage:'complete',action:'single-Bernoulli-bounded-does-not-transport',counts,interpretation:'Observed defended-only support lies outside the predeclared O13 1x/2x family.'};
  const stat=chi2(counts),supported=stat<=O13_CHI2_CRITICAL_1PCT_DF1&&counts.one>0&&counts.two>0;
  return {...base,stage:'complete',action:supported?'single-Bernoulli-bounded-transports':'single-Bernoulli-bounded-does-not-transport',counts,candidateProbabilities:{one:.4,two:.6},pearsonChiSquare:stat,criticalValue:O13_CHI2_CRITICAL_1PCT_DF1,interpretation:supported?'The O12-supported single-Bernoulli Defense/10 sampler bounded by total attack points transports to the Defense-18 confirmation boundary.':'The O12-supported defense sampler does not transport to Defense 18.'};
}
export function assessO13Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO13Batch(text);return {assessment:assessO13({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}

async function cli(){const [,,input,ds,ts,dd,td]=process.argv;if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o13-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(assessO13Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}catch(error){console.error(`O13 assessment failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

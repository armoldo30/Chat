import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO17Batch} from './oracle-o17-trial21.mjs';

export const O17_EXPECTED_STRENGTH_LOSS_PP=0.060/225*100;
export const O17_MIN_LOSS_PP=0.0195;
export const O17_MAX_LOSS_PP=0.0340;

function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);if(ds!==20||ts!==20)throw new Error(`O17 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);if(dd!==10||td!==10)throw new Error(`O17 requires POL Defense exactly 10.0, got displayed=${dd} tooltip=${td}`);return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};}

export function assessO17({batch,panel}){
  const observed=validatePanel(panel),base={schemaVersion:1,scenario:'o17-fixed-strength-unit-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const intervals=batch.runs[0].capture.intervals;
  if(intervals.length!==20)return {...base,stage:'bad-interval-count',action:'review-control'};
  const bad=intervals.filter(x=>!x.strict||x.strengthLossPp<O17_MIN_LOSS_PP||x.strengthLossPp>O17_MAX_LOSS_PP);
  const losses=intervals.map(x=>x.strengthLossPp),mean=losses.reduce((a,b)=>a+b,0)/losses.length;
  const min=Math.min(...losses),max=Math.max(...losses);
  const supported=bad.length===0;
  return {...base,stage:'complete',action:supported?'fixed-strength-unit-supported':'fixed-strength-unit-mismatch-or-feedback',expectedStrengthLossPp:O17_EXPECTED_STRENGTH_LOSS_PP,acceptedBandPp:{min:O17_MIN_LOSS_PP,max:O17_MAX_LOSS_PP},observed:{count:losses.length,mean,min,max,badIntervals:bad},interpretation:supported?'All 20 one-hit defender strength losses fall inside the predeclared bisection-aware band around 0.060/225 of baseline HP.':'At least one interval failed the predeclared one-hit fixed-strength-unit band or strict-loss requirement.'};
}
export function assessO17Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO17Batch(text);return {assessment:assessO17({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}

async function cli(){const [,,input,ds,ts,dd,td]=process.argv;if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o17-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(assessO17Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}catch(error){console.error(`O17 assessment failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

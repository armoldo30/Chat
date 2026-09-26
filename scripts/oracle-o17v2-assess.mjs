import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO17v2Batch} from './oracle-o17v2-trial61.mjs';

function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);if(ds!==20||ts!==20)throw new Error(`O17v2 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);if(dd!==10||td!==10)throw new Error(`O17v2 requires POL Defense exactly 10.0, got displayed=${dd} tooltip=${td}`);return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};}

export function assessO17v2({batch,panel}){
  const observed=validatePanel(panel),base={schemaVersion:1,scenario:'o17v2-all-hit-strength-scale-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const capture=batch.runs[0].capture,counts=capture.counts;
  if(capture.intervals.length!==60)return {...base,stage:'bad-interval-count',action:'review-control'};
  if(counts.outOfSupport>0||counts.one===0||counts.two===0||counts.three===0)return {...base,stage:'complete',action:'strength-scale-family-mismatch',counts};
  const normalized=capture.intervals.map(x=>x.strengthLossPp/x.multiplicity);
  const mean=normalized.reduce((a,b)=>a+b,0)/normalized.length;
  let action='strength-scale-family-mismatch';
  if(mean>=0.0230&&mean<=0.0250)action='point-nine-strength-scale-supported';
  else if(mean>=0.0257&&mean<=0.0277)action='naive-hp-strength-scale-supported';
  return {...base,stage:'complete',action,counts,normalizedUnitPp:{mean,min:Math.min(...normalized),max:Math.max(...normalized)},candidateCenters:{pointNine:0.024,naiveHpOnly:0.0266667},interpretation:action==='point-nine-strength-scale-supported'?'The normalized one-unit strength loss supports the predeclared additional 0.9 scalar candidate.':action==='naive-hp-strength-scale-supported'?'The normalized one-unit strength loss supports the naive HP-only scale.':'The normalized unit falls outside both predeclared candidate bands.'};
}
export function assessO17v2Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO17v2Batch(text);return {assessment:assessO17v2({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}

async function cli(){const [,,input,ds,ts,dd,td]=process.argv;if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o17v2-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(assessO17v2Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}catch(error){console.error(`O17v2 assessment failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

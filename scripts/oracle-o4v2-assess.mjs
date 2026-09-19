import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO4V2Batch} from './oracle-o4v2-trial6.mjs';
import {buildO4V2Reference} from './oracle-o4v2-reference.mjs';

function validateStats(control,probe){
  if(control.attackerSoft<10||control.attackerSoft>19)throw new Error('control GER Soft Attack must be 10-19');
  if(control.defenderDefense<100)throw new Error('control POL Defense must remain high');
  if(probe.attackerSoft!==2)throw new Error('probe GER Soft Attack must equal 2');
  if(probe.defenderDefense<100)throw new Error('probe POL Defense must remain high');
}
export function assessO4V2({batch,controlStats,probeStats}){
  validateStats(controlStats,probeStats);
  if(batch.rejectedRuns>0)return {stage:'invalid-batch',action:'repair-or-rerun-rejected-traces',evidenceStatus:'unvalidated'};
  const controls=batch.byMode.control,probes=batch.byMode.probe;
  if(controls.length!==1||probes.length!==1)return {stage:'incomplete-or-nonpredeclared',action:'require-exactly-one-control-and-one-probe',evidenceStatus:'unvalidated'};
  const c=controls[0].capture.positiveIntervals,p=probes[0].capture.positiveIntervals;
  if(c!==5)return {stage:'invalid-control',action:'do-not-interpret-probe',controlPositiveIntervals:c,probePositiveIntervals:p,evidenceStatus:'unvalidated'};
  if(p<=4)return {stage:'complete',action:'minimum-one-hypothesis-contradicted',controlPositiveIntervals:c,probePositiveIntervals:p,evidenceStatus:'unvalidated',
    interpretation:'The guaranteed-hit control is 5/5, while the Soft-Attack-2 probe contains at least one zero-damage firing interval. A minimum-one/ceiling-style positive sub-10 attack point every hour is contradicted at this controlled boundary.'};
  return {stage:'complete',action:'stochastic-rounding-mismatch-candidate',controlPositiveIntervals:c,probePositiveIntervals:p,evidenceStatus:'unvalidated',
    worstCasePlannerProbability:0.3**5,
    interpretation:'The guaranteed-hit control is 5/5 and the Soft-Attack-2 probe is also 5/5. Under the current stochastic-rounding planner with ±1 displayed-stat sensitivity, the most favorable probability is 0.30^5 = 0.243%, creating a narrow mismatch candidate pending control review.'};
}
export function assessO4V2Log({text,controlStats,probeStats}){const batch=parseO4V2Batch(text);return {assessment:assessO4V2({batch,controlStats,probeStats}),batch,reference:buildO4V2Reference()};}

async function cli(){
  const [,,input,cSoft,cDef,pSoft,pDef]=process.argv;
  if([input,cSoft,cDef,pSoft,pDef].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o4v2-assess.mjs <game.log> <control GER soft> <control POL def> <probe GER soft> <probe POL def>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(assessO4V2Log({text:await fs.readFile(input,'utf8'),controlStats:{attackerSoft:Number(cSoft),defenderDefense:Number(cDef)},probeStats:{attackerSoft:Number(pSoft),defenderDefense:Number(pDef)}}),null,2)+'\n');}
  catch(error){console.error(`O4 v2 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

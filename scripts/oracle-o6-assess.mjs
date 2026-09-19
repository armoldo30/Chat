import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO6Batch} from './oracle-o6-trial41.mjs';

export function assessO6({batch,lowStats,highStats}){
  const ls=Number(lowStats?.attackerSoft),ld=Number(lowStats?.defenderDefense),hs=Number(highStats?.attackerSoft),hd=Number(highStats?.defenderDefense);
  if(ls!==12||ld<200)throw new Error('O6 low panel must be Soft Attack 12 and Defense >=200');
  if(hs!==18||hd<200)throw new Error('O6 high panel must be Soft Attack 18 and Defense >=200');
  const base={scenario:'o6-two-point-probability-law-v1',evidenceStatus:'unvalidated',lowPanel:{attackerSoft:ls,defenderDefense:ld},highPanel:{attackerSoft:hs,defenderDefense:hd}};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-traces',rejected:batch.rejected};
  if(batch.byMode.low.length!==1||batch.byMode.high.length!==1)return {...base,stage:'incomplete-or-nonpredeclared',action:'require-one-low-and-one-high-run'};
  const low=batch.byMode.low[0].capture,high=batch.byMode.high[0].capture;
  if(low.intervals.length!==40||high.intervals.length!==40||low.positiveIntervals!==40||high.positiveIntervals!==40){
    return {...base,stage:'control-failure',action:'review-fixed-damage-controls'};
  }
  const kLow=low.highCount,kHigh=high.highCount,difference=kHigh-kLow;
  const result={...base,stage:'complete',kLow,kHigh,difference,lowRate:kLow/40,highRate:kHigh/40,
    predeclaredTailProbabilities:{lowKGe21AtP03:0.0024193598971335886,highKLe19AtP07:0.002419359897133598,jointDifferenceLe4AtP03P07:0.003246793685283695}};
  if(kLow>=21||kHigh<=19||difference<=4){
    return {...result,action:'attack-div10-probability-law-mismatch-candidate',
      interpretation:'At least one predeclared O6 mismatch trigger fired against the current /10 stochastic probability envelope. Review controls before changing the planner.'};
  }
  return {...result,action:'attack-div10-probability-gradient-consistent',
    interpretation:'The high-loss multiplicity rate rises strongly between Soft Attack 12 and 18 without firing a predeclared mismatch trigger. This is probability-gradient evidence consistent with attack/10 stochastic rounding, but not broad resolver validation.'};
}
export function assessO6Log({text,lowStats,highStats}){const batch=parseO6Batch(text);return {assessment:assessO6({batch,lowStats,highStats}),batch};}
async function cli(){
  const [,,input,ls,ld,hs,hd]=process.argv;
  if([input,ls,ld,hs,hd].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o6-assess.mjs <game.log> <low soft> <low def> <high soft> <high def>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(assessO6Log({text:await fs.readFile(input,'utf8'),lowStats:{attackerSoft:Number(ls),defenderDefense:Number(ld)},highStats:{attackerSoft:Number(hs),defenderDefense:Number(hd)}}),null,2)+'\n');}
  catch(error){console.error(`O6 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

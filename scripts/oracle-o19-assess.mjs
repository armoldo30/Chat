import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO19Batch} from './oracle-o19-trial161.mjs';

export const O19_HIT_ACCEPTANCE=Object.freeze({min:7,max:26});

function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){
  const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);
  if(ds!==20||ts!==20)throw new Error(`O19 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);
  if(dd!==10||td!==10)throw new Error(`O19 requires POL Defense exactly 10.0, got displayed=${dd} tooltip=${td}`);
  return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};
}

export function assessO19({batch,panel}){
  const observed=validatePanel(panel),base={schemaVersion:1,scenario:'o19-combined-normal-damage-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const cap=batch.runs[0].capture,c=cap.counts,n=c.miss+c.hit+c.mixedChannel+c.supportViolation;
  if(n!==160)return {...base,stage:'bad-interval-count',action:'review-control',counts:c};
  if(c.mixedChannel>0||c.supportViolation>0)return {...base,stage:'complete',action:'combined-normal-damage-mismatch',counts:c,orgDice:cap.orgDice,strengthDice:cap.strengthDice,interpretation:'At least one interval broke channel coherence or a previously validated damage support band.'};
  const supported=c.hit>=O19_HIT_ACCEPTANCE.min&&c.hit<=O19_HIT_ACCEPTANCE.max;
  return {...base,stage:'complete',action:supported?'combined-normal-damage-coherent':'combined-normal-damage-mismatch',counts:c,orgDice:cap.orgDice,strengthDice:cap.strengthDice,hitAcceptance:O19_HIT_ACCEPTANCE,interpretation:supported?'The ordinary defended hit gate and both normal unarmored damage channels compose coherently at the controlled 20/10 boundary.':'The coherent hit count lies outside the predeclared central 99% Binomial(160,0.10) region.'};
}

export function assessO19Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO19Batch(text);return {assessment:assessO19({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}

async function cli(){
  const [,,input,ds,ts,dd,td]=process.argv;
  if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o19-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(assessO19Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}
  catch(error){console.error(`O19 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

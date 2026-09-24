import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO8Batch} from './oracle-o8-trial81.mjs';

export const O8_CHI2_CRITICAL_1PCT_DF3=11.34487;

function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){
  const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);
  if(ds!==20)throw new Error(`O8 requires displayed GER Soft Attack exactly 20, got ${ds}`);
  if(ts!==20)throw new Error(`O8 requires tooltip/effective GER Soft Attack exactly 20.0, got ${ts}`);
  if(dd!==10)throw new Error(`O8 requires displayed POL Defense exactly 10, got ${dd}`);
  if(td!==10)throw new Error(`O8 requires tooltip/effective POL Defense exactly 10.0, got ${td}`);
  return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};
}
function chi2(counts,p){
  const bins=[['zero','zero'],['one','one'],['two','two'],['three','three']];
  const n=bins.reduce((s,[k])=>s+counts[k],0);
  return bins.reduce((s,[k,pk])=>{const e=n*p[pk];return s+((counts[k]-e)**2)/e;},0);
}

export function assessO8({batch,panel}){
  const observed=validatePanel(panel);
  const base={schemaVersion:1,scenario:'o8-defense-wide-rounding-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const counts=batch.runs[0].capture.counts;
  const n=counts.zero+counts.one+counts.two+counts.three+counts.fourPlus;
  if(n!==80)return {...base,stage:'bad-interval-count',action:'review-control',counts};
  if(counts.fourPlus>0){
    return {...base,stage:'complete',action:'wide-defense-candidate-mismatch',counts,
      interpretation:'Observed multiplicity lies above the predeclared 0x/1x/2x/3x support.'};
  }

  // With attack x=2 and defense x=1 under independent round(x + U[-1,+1]):
  // A={1:.25,2:.5,3:.25}; D={0:.25,1:.5,2:.25};
  // max(A-D,0) => {0:.3125,1:.375,2:.25,3:.0625}.
  const p={zero:0.3125,one:0.375,two:0.25,three:0.0625};
  const stat=chi2(counts,p);
  const supported=stat<=O8_CHI2_CRITICAL_1PCT_DF3&&counts.three>0;
  return {...base,stage:'complete',action:supported?'wide-defense-candidate-supported':'wide-defense-candidate-mismatch',
    counts,candidateProbabilities:p,pearsonChiSquare:stat,criticalValue:O8_CHI2_CRITICAL_1PCT_DF3,
    oldPlannerAtExactCenter:Object.freeze({defensePoints:1,threeMultiplicityProbability:0}),
    interpretation:supported
      ? 'The 80-interval undefended-point distribution is consistent at the predeclared 1% level with applying the O7 wider random-rounding law to defense points, and the 3x tail required by the candidate is observed. This supports the wider defense-point law at the controlled O8 boundary, not source-code identity.'
      : 'The 80-interval multiplicity distribution fails the predeclared wider defense-point candidate test.'};
}
export function assessO8Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO8Batch(text);return {assessment:assessO8({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}

async function cli(){
  const [,,input,ds,ts,dd,td]=process.argv;
  if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o8-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(assessO8Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}
  catch(error){console.error(`O8 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

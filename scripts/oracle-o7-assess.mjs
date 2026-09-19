import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO7Batch} from './oracle-o7-trial61.mjs';

export const O7_CHI2_CRITICAL_1PCT_DF2=9.21034;

function validatePanel({displayedSoft,tooltipSoft,defenderDefense}){
  const d=Number(displayedSoft),t=Number(tooltipSoft),def=Number(defenderDefense);
  if(d!==20)throw new Error(`O7 requires displayed Soft Attack exactly 20, got ${d}`);
  if(!Number.isFinite(t)||t<19.8||t>20.2)throw new Error(`O7 requires tooltip Soft Attack in [19.8,20.2], got ${t}`);
  if(!Number.isFinite(def)||def<200)throw new Error(`O7 requires POL Defense >=200, got ${def}`);
  return {displayedSoft:d,tooltipSoft:t,defenderDefense:def};
}
function probabilities(tooltipSoft){
  const x=tooltipSoft/10;
  return {one:(2.5-x)/2,two:0.5,three:(x-1.5)/2};
}
function chi2(counts,p){
  const n=counts.one+counts.two+counts.three;
  return ((counts.one-n*p.one)**2)/(n*p.one)+((counts.two-n*p.two)**2)/(n*p.two)+((counts.three-n*p.three)**2)/(n*p.three);
}

export function assessO7({batch,panel}){
  const observed=validatePanel(panel);
  const base={schemaVersion:1,scenario:'o7-wide-random-rounding-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const counts=batch.runs[0].capture.counts;
  const n=counts.zero+counts.one+counts.two+counts.three+counts.fourPlus;
  if(n!==60)return {...base,stage:'bad-interval-count',action:'review-control',counts};
  if(counts.zero>0||counts.fourPlus>0){
    return {...base,stage:'complete',action:'wide-rounding-candidate-mismatch',counts,
      interpretation:'Observed multiplicity lies outside the predeclared 1x/2x/3x support of the wide-rounding candidate.'};
  }
  const p=probabilities(observed.tooltipSoft),stat=chi2(counts,p);
  const supported=stat<=O7_CHI2_CRITICAL_1PCT_DF2&&counts.one>0&&counts.three>0;
  return {...base,stage:'complete',action:supported?'wide-rounding-candidate-supported':'wide-rounding-candidate-mismatch',
    counts,candidateProbabilities:p,pearsonChiSquare:stat,criticalValue:O7_CHI2_CRITICAL_1PCT_DF2,
    interpretation:supported
      ? 'The 60-interval 1x/2x/3x distribution is consistent at the predeclared 1% level with round(attack/10 + U[-1,+1]) and both outer tails are observed. This supports an executable-inferred wider rounding law, not source-code identity.'
      : 'The 60-interval multiplicity distribution fails the predeclared wide-rounding candidate test.'};
}
export function assessO7Log({text,displayedSoft,tooltipSoft,defenderDefense}){const batch=parseO7Batch(text);return {assessment:assessO7({batch,panel:{displayedSoft,tooltipSoft,defenderDefense}}),batch};}

async function cli(){
  const [,,input,d,t,def]=process.argv;
  if([input,d,t,def].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o7-assess.mjs <game.log> <displayed soft> <tooltip soft> <POL defense>');process.exitCode=2;return;}
  try{process.stdout.write(JSON.stringify(assessO7Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(d),tooltipSoft:Number(t),defenderDefense:Number(def)}),null,2)+'\n');}
  catch(error){console.error(`O7 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

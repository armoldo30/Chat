import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO11Batch} from './oracle-o11-trial81.mjs';

export const O11_Z_CRITICAL_1PCT=2.575829;
export const O8_UNDEF=Object.freeze({n:80,mean:0.7625,variance:0.33528481012658234});
export const O9_TOTAL=Object.freeze({n:60,mean:1.9333333333333333,variance:0.47005649717514125});

function validatePanel({displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){
  const ds=Number(displayedSoft),ts=Number(tooltipSoft),dd=Number(displayedDefense),td=Number(tooltipDefense);
  if(ds!==20||ts!==20)throw new Error(`O11 requires GER Soft Attack exactly 20.0, got displayed=${ds} tooltip=${ts}`);
  if(dd!==10||td!==10)throw new Error(`O11 requires POL Defense exactly 10.0, got displayed=${dd} tooltip=${td}`);
  return {displayedSoft:ds,tooltipSoft:ts,displayedDefense:dd,tooltipDefense:td};
}
function moments(counts){
  const vals=[];for(const [k,n] of [[0,counts.zero],[1,counts.one],[2,counts.two],[3,counts.three]])for(let i=0;i<n;i++)vals.push(k);
  const n=vals.length,mean=vals.reduce((a,b)=>a+b,0)/n;
  const variance=vals.reduce((s,x)=>s+(x-mean)**2,0)/(n-1);
  return {n,mean,variance};
}

export function assessO11({batch,panel}){
  const observed=validatePanel(panel),base={schemaVersion:1,scenario:'o11-defended-only-partition-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const counts=batch.runs[0].capture.counts;
  const n=counts.zero+counts.one+counts.two+counts.three+counts.fourPlus;
  if(n!==80)return {...base,stage:'bad-interval-count',action:'review-control',counts};
  if(counts.fourPlus>0)return {...base,stage:'complete',action:'partition-mean-mismatch',counts,interpretation:'Defended-only multiplicity exceeded the predeclared 0x-3x support.'};
  const defended=moments(counts);
  const delta=O9_TOTAL.mean-O8_UNDEF.mean-defended.mean;
  const standardError=Math.sqrt(O9_TOTAL.variance/O9_TOTAL.n+O8_UNDEF.variance/O8_UNDEF.n+defended.variance/defended.n);
  const z=Math.abs(delta)/standardError;
  const compatible=z<=O11_Z_CRITICAL_1PCT;
  return {...base,stage:'complete',action:compatible?'partition-mean-compatible':'partition-mean-mismatch',counts,defendedMoments:defended,
    frozenO8Undefended:O8_UNDEF,frozenO9Total:O9_TOTAL,impliedDefendedMean:O9_TOTAL.mean-O8_UNDEF.mean,
    delta,standardError,zStatistic:z,criticalValue:O11_Z_CRITICAL_1PCT,
    interpretation:compatible
      ? 'The defended-only O11 mean is compatible at the predeclared 1% level with O8 undefended plus O11 defended partitioning the O9 total attack process in expectation.'
      : 'The defended-only O11 mean is incompatible at the predeclared 1% level with a simple mean partition of the frozen O8 and O9 processes.'};
}
export function assessO11Log({text,displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}){const batch=parseO11Batch(text);return {assessment:assessO11({batch,panel:{displayedSoft,tooltipSoft,displayedDefense,tooltipDefense}}),batch};}

async function cli(){const [,,input,ds,ts,dd,td]=process.argv;if([input,ds,ts,dd,td].some(v=>v===undefined)){console.error('Usage: node scripts/oracle-o11-assess.mjs <game.log> <displayed soft> <tooltip soft> <displayed defense> <tooltip defense>');process.exitCode=2;return;}try{process.stdout.write(JSON.stringify(assessO11Log({text:await fs.readFile(input,'utf8'),displayedSoft:Number(ds),tooltipSoft:Number(ts),displayedDefense:Number(dd),tooltipDefense:Number(td)}),null,2)+'\n');}catch(error){console.error(`O11 assessment failed: ${error.message}`);process.exitCode=1;}}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

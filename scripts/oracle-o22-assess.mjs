import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO22Batch,O22_MODES} from './oracle-o22-trial21.mjs';

export const O22_EXPECTED=Object.freeze({
  p20:{piercing:20,armor:20,factor:1.00},
  p15:{piercing:15,armor:20,factor:0.80},
  p14:{piercing:14,armor:20,factor:0.65},
  p10:{piercing:10,armor:20,factor:0.65},
  p9:{piercing:9,armor:20,factor:0.50}
});
export const O22_RATIO_TOLERANCE=0.04;

function exact(v,target,label){const n=Number(v);if(!Number.isFinite(n)||n!==target)throw new Error(`O22 requires ${label} exactly ${target.toFixed(1)}, got ${v}`);return n;}
function validatePanels(panels){
  const out={};
  for(const mode of O22_MODES){
    const p=panels?.[mode];if(!p)throw new Error(`O22 missing panel for ${mode}`);
    const e=O22_EXPECTED[mode];
    out[mode]={
      displayedSoft:exact(p.displayedSoft,20,`${mode} GER Soft Attack displayed`),
      tooltipSoft:exact(p.tooltipSoft,20,`${mode} GER Soft Attack tooltip`),
      displayedDefense:exact(p.displayedDefense,10,`${mode} POL Defense displayed`),
      tooltipDefense:exact(p.tooltipDefense,10,`${mode} POL Defense tooltip`),
      displayedPiercing:exact(p.displayedPiercing,e.piercing,`${mode} GER Piercing displayed`),
      tooltipPiercing:exact(p.tooltipPiercing,e.piercing,`${mode} GER Piercing tooltip`),
      displayedArmor:exact(p.displayedArmor,20,`${mode} POL Armor displayed`),
      tooltipArmor:exact(p.tooltipArmor,20,`${mode} POL Armor tooltip`)
    };
  }
  return out;
}

export function assessO22({batch,panels}){
  const observedCombatPanels=validatePanels(panels);
  const base={schemaVersion:1,scenario:'o22-piercing-damage-tier-v1',evidenceStatus:'unvalidated',ratioTolerance:O22_RATIO_TOLERANCE,observedCombatPanels};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==5)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-five-accepted-runs'};
  const byMode={};
  for(const r of batch.runs){
    const c=r.capture;
    if(byMode[c.mode])return {...base,stage:'duplicate-mode',action:'require-one-run-per-mode',mode:c.mode};
    byMode[c.mode]=c;
  }
  for(const mode of O22_MODES)if(!byMode[mode])return {...base,stage:'missing-mode',action:'require-one-run-per-mode',mode};
  for(const mode of O22_MODES){
    const c=byMode[mode];
    if(c.strictIntervals!==20||!(c.cumulativeOrgLossPp>0))return {...base,stage:'control-failure',action:'one-defended-hit-control-broke',mode,capture:c};
  }
  const full=byMode.p20.cumulativeOrgLossPp;
  const ratios={},checks={};
  let supported=true;
  for(const mode of O22_MODES){
    const ratio=byMode[mode].cumulativeOrgLossPp/full;
    const expected=O22_EXPECTED[mode].factor;
    const error=Math.abs(ratio-expected);
    ratios[mode]=ratio;
    checks[mode]={expected,error,withinTolerance:error<=O22_RATIO_TOLERANCE,cumulativeOrgLossPp:byMode[mode].cumulativeOrgLossPp};
    if(error>O22_RATIO_TOLERANCE)supported=false;
  }
  return {
    ...base,
    stage:'complete',
    action:supported?'piercing-damage-tiers-supported':'piercing-damage-tiers-mismatch',
    fullPiercingCumulativeOrgLossPp:full,
    ratios,
    checks,
    interpretation:supported
      ?'Relative executable organization damage matches the predeclared 100% / 80% / 65% / 65% / 50% piercing-tier family across the 1.00, 0.75, 0.70, 0.50 and 0.45 piercing-to-armor boundaries.'
      :'At least one controlled executable damage ratio falls outside the predeclared piercing-tier tolerance.'
  };
}

export function assessO22Log({text,panels}){const batch=parseO22Batch(text);return {assessment:assessO22({batch,panels}),batch};}

async function cli(){
  const [,,input,panelFile]=process.argv;
  if(!input||!panelFile){console.error('Usage: node scripts/oracle-o22-assess.mjs <game.log> <panels.json>');process.exitCode=2;return;}
  try{
    const [text,panelText]=await Promise.all([fs.readFile(input,'utf8'),fs.readFile(panelFile,'utf8')]);
    process.stdout.write(JSON.stringify(assessO22Log({text,panels:JSON.parse(panelText)}),null,2)+'\n');
  }catch(error){console.error(`O22 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

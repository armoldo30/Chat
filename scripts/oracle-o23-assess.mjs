import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO23Batch} from './oracle-o23-trial121.mjs';

export const O23_CHI2_CRITICAL_1PCT_DF5=15.086272;

function exact(v,target,label){const n=Number(v);if(!Number.isFinite(n)||n!==target)throw new Error(`O23 requires ${label} exactly ${target.toFixed(1)}, got ${v}`);return n;}
function panel(p){
  return {
    gerSoftDisplayed:exact(p.gerSoftDisplayed,20,'GER Soft Attack displayed'),
    gerSoftTooltip:exact(p.gerSoftTooltip,20,'GER Soft Attack tooltip'),
    polDefenseDisplayed:exact(p.polDefenseDisplayed,10,'POL Defense displayed'),
    polDefenseTooltip:exact(p.polDefenseTooltip,10,'POL Defense tooltip'),
    gerPiercingDisplayed:exact(p.gerPiercingDisplayed,20,'GER Piercing displayed'),
    gerPiercingTooltip:exact(p.gerPiercingTooltip,20,'GER Piercing tooltip'),
    gerArmorDisplayed:exact(p.gerArmorDisplayed,20,'GER Armor displayed'),
    gerArmorTooltip:exact(p.gerArmorTooltip,20,'GER Armor tooltip'),
    polPiercingDisplayed:exact(p.polPiercingDisplayed,4,'POL Piercing displayed'),
    polPiercingTooltip:exact(p.polPiercingTooltip,4,'POL Piercing tooltip'),
    polArmorDisplayed:exact(p.polArmorDisplayed,20,'POL Armor displayed'),
    polArmorTooltip:exact(p.polArmorTooltip,20,'POL Armor tooltip')
  };
}
function chi2(c){
  const exp=20;
  return ['one','two','three','four','five','six'].reduce((s,k)=>s+((c[k]-exp)**2/exp),0);
}
export function assessO23({batch,panel:live}){
  const observedCombatPanel=panel(live);
  const base={schemaVersion:1,scenario:'o23-armored-org-die-v1',evidenceStatus:'unvalidated',observedCombatPanel};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const c=batch.runs[0].capture.counts;
  const n=Object.values(c).reduce((a,b)=>a+b,0);
  if(n!==120)return {...base,stage:'bad-interval-count',action:'armored-org-die-mismatch',counts:c};
  if(c.zero>0||c.outOfSupport>0)return {...base,stage:'complete',action:'armored-org-die-mismatch',counts:c,interpretation:'At least one guaranteed-hit interval had zero or out-of-support organization loss.'};
  const stat=chi2(c);
  const supported=stat<=O23_CHI2_CRITICAL_1PCT_DF5&&c.five>0&&c.six>0;
  return {
    ...base,
    stage:'complete',
    action:supported?'armored-org-die-uniform-1-through-6-supported':'armored-org-die-mismatch',
    counts:c,
    expectedPerFace:20,
    pearsonChiSquare:stat,
    criticalValue1PctDf5:O23_CHI2_CRITICAL_1PCT_DF5,
    interpretation:supported
      ?'The unpierced armored attacker produced organization-damage outcomes compatible with UniformInteger(1,6), including direct support for die faces 5 and 6.'
      :'The controlled armored organization-damage distribution does not match the predeclared UniformInteger(1,6) family.'
  };
}
export function assessO23Log({text,...panelArgs}){const batch=parseO23Batch(text);return {assessment:assessO23({batch,panel:panelArgs}),batch};}

async function cli(){
  const [,,input,...vals]=process.argv;
  if(!input||vals.length!==12){console.error('Usage: node scripts/oracle-o23-assess.mjs <game.log> <GER SA d> <GER SA t> <POL DEF d> <POL DEF t> <GER P d> <GER P t> <GER A d> <GER A t> <POL P d> <POL P t> <POL A d> <POL A t>');process.exitCode=2;return;}
  const nums=vals.map(Number);
  try{
    process.stdout.write(JSON.stringify(assessO23Log({
      text:await fs.readFile(input,'utf8'),
      gerSoftDisplayed:nums[0],gerSoftTooltip:nums[1],polDefenseDisplayed:nums[2],polDefenseTooltip:nums[3],
      gerPiercingDisplayed:nums[4],gerPiercingTooltip:nums[5],gerArmorDisplayed:nums[6],gerArmorTooltip:nums[7],
      polPiercingDisplayed:nums[8],polPiercingTooltip:nums[9],polArmorDisplayed:nums[10],polArmorTooltip:nums[11]
    }),null,2)+'\n');
  }catch(error){console.error(`O23 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

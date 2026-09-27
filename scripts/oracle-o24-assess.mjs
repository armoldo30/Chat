import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseO24Batch} from './oracle-o24-trial161.mjs';

export const O24_HIT_ACCEPTANCE=Object.freeze({min:7,max:26});

function exact(v,target,label){const n=Number(v);if(!Number.isFinite(n)||n!==target)throw new Error(`O24 requires ${label} exactly ${target.toFixed(1)}, got ${v}`);return n;}
function validatePanel(p){
  return {
    gerSoftDisplayed:exact(p.gerSoftDisplayed,20,'GER Soft Attack displayed'),
    gerSoftTooltip:exact(p.gerSoftTooltip,20,'GER Soft Attack tooltip'),
    polDefenseDisplayed:exact(p.polDefenseDisplayed,10,'POL Defense displayed'),
    polDefenseTooltip:exact(p.polDefenseTooltip,10,'POL Defense tooltip'),
    gerPiercingDisplayed:exact(p.gerPiercingDisplayed,9,'GER Piercing displayed'),
    gerPiercingTooltip:exact(p.gerPiercingTooltip,9,'GER Piercing tooltip'),
    gerArmorDisplayed:exact(p.gerArmorDisplayed,20,'GER Armor displayed'),
    gerArmorTooltip:exact(p.gerArmorTooltip,20,'GER Armor tooltip'),
    polPiercingDisplayed:exact(p.polPiercingDisplayed,4,'POL Piercing displayed'),
    polPiercingTooltip:exact(p.polPiercingTooltip,4,'POL Piercing tooltip'),
    polArmorDisplayed:exact(p.polArmorDisplayed,20,'POL Armor displayed'),
    polArmorTooltip:exact(p.polArmorTooltip,20,'POL Armor tooltip')
  };
}
export function assessO24({batch,panel}){
  const observed=validatePanel(panel);
  const base={schemaVersion:1,scenario:'o24-combined-armored-damage-v1',evidenceStatus:'unvalidated',observedCombatPanel:observed};
  if(batch.rejectedRuns>0)return {...base,stage:'invalid-batch',action:'repair-or-rerun-rejected-trace',rejected:batch.rejected};
  if(batch.acceptedRuns!==1)return {...base,stage:'nonpredeclared-sample-size',action:'require-exactly-one-accepted-run'};
  const cap=batch.runs[0].capture,c=cap.counts,n=c.miss+c.hit+c.mixedChannel+c.supportViolation;
  if(n!==160)return {...base,stage:'bad-interval-count',action:'review-control',counts:c};
  if(c.mixedChannel>0||c.supportViolation>0)return {
    ...base,stage:'complete',action:'combined-armored-damage-mismatch',counts:c,orgDice:cap.orgDice,strengthDice:cap.strengthDice,
    interpretation:'At least one interval broke ORG/strength channel coherence or fell outside the predeclared 50%-scaled armored damage support.'
  };
  const supported=c.hit>=O24_HIT_ACCEPTANCE.min&&c.hit<=O24_HIT_ACCEPTANCE.max;
  return {
    ...base,stage:'complete',
    action:supported?'combined-armored-damage-coherent':'combined-armored-damage-mismatch',
    counts:c,orgDice:cap.orgDice,strengthDice:cap.strengthDice,hitAcceptance:O24_HIT_ACCEPTANCE,
    interpretation:supported
      ?'The normal defended hit gate, unpierced armored 1..6 organization die, 1..2 strength die, validated 0.9 strength scalar, and validated 50% piercing factor compose coherently at the controlled Armor-20/Piercing-9 boundary.'
      :'The coherent armored hit count lies outside the predeclared central 99% Binomial(160,0.10) region.'
  };
}
export function assessO24Log({text,...panelArgs}){const batch=parseO24Batch(text);return {assessment:assessO24({batch,panel:panelArgs}),batch};}

async function cli(){
  const [,,input,...vals]=process.argv;
  if(!input||vals.length!==12){console.error('Usage: node scripts/oracle-o24-assess.mjs <game.log> <GER SA d> <GER SA t> <POL DEF d> <POL DEF t> <GER P d> <GER P t> <GER A d> <GER A t> <POL P d> <POL P t> <POL A d> <POL A t>');process.exitCode=2;return;}
  const nums=vals.map(Number);
  try{
    process.stdout.write(JSON.stringify(assessO24Log({
      text:await fs.readFile(input,'utf8'),
      gerSoftDisplayed:nums[0],gerSoftTooltip:nums[1],polDefenseDisplayed:nums[2],polDefenseTooltip:nums[3],
      gerPiercingDisplayed:nums[4],gerPiercingTooltip:nums[5],gerArmorDisplayed:nums[6],gerArmorTooltip:nums[7],
      polPiercingDisplayed:nums[8],polPiercingTooltip:nums[9],polArmorDisplayed:nums[10],polArmorTooltip:nums[11]
    }),null,2)+'\n');
  }catch(error){console.error(`O24 assessment failed: ${error.message}`);process.exitCode=1;}
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));if(invoked)await cli();

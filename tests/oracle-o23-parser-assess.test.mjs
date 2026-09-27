import assert from 'node:assert/strict';
import {parseO23Batch} from '../scripts/oracle-o23-trial121.mjs';
import {assessO23} from '../scripts/oracle-o23-assess.mjs';

function b(v){return {low:Math.max(0,v-.00001).toFixed(5),high:Math.min(1,v+.00001).toFixed(5)};}
function run(counts){
  const seq=[];
  const unit=.00088;
  for(let die=1;die<=6;die++)for(let i=0;i<counts[die-1];i++)seq.push(unit*die);
  if(seq.length!==120)throw new Error('need 120');
  const lines=['WPO23 BEGIN schema=1 scenario=o23-armored-org-die-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial121 tacticMode=neutral-basic-only defineOverrides=DEFENDED_HIT:100,UNDEFENDED_HIT:0,ORG_MOD:0.053,ORG_DICE:4,ORG_ARMOR_DICE:6,STR_DAMAGE:0,NIGHT:0 attackModifier=-0.721 defenseModifier=-0.9923784016 attackerArmor=20 attackerPiercing=20 defenderArmor=20 defenderPiercing=4 prepared=yes'];
  let org=1;
  for(let h=0;h<=121;h++){
    if(h>=2)org-=seq[h-2];
    const a=b(1),o=b(org),s=b(1);
    lines.push('WPO23 SAMPLE hour='+h);
    lines.push(`WPO23 ATTACKER orgLow=${a.low} orgHigh=${a.high} strengthLow=${s.low} strengthHigh=${s.high}`);
    lines.push(`WPO23 DEFENDER orgLow=${o.low} orgHigh=${o.high} strengthLow=${s.low} strengthHigh=${s.high}`);
  }
  lines.push('WPO23 END hour=121 reason=trial121-complete modifiersRemoved=yes cleanupFailure=no');
  return lines.join('\n');
}
const p={
 gerSoftDisplayed:20,gerSoftTooltip:20,polDefenseDisplayed:10,polDefenseTooltip:10,
 gerPiercingDisplayed:20,gerPiercingTooltip:20,gerArmorDisplayed:20,gerArmorTooltip:20,
 polPiercingDisplayed:4,polPiercingTooltip:4,polArmorDisplayed:20,polArmorTooltip:20
};
assert.equal(assessO23({batch:parseO23Batch(run([20,20,20,20,20,20])),panel:p}).action,'armored-org-die-uniform-1-through-6-supported');
assert.equal(assessO23({batch:parseO23Batch(run([30,30,30,30,0,0])),panel:p}).action,'armored-org-die-mismatch');
console.log('Oracle O23 parser/assessment regression passed.');

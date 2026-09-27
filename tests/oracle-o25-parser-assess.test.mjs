import assert from 'node:assert/strict';
import {parseO25Batch} from '../scripts/oracle-o25-trial161.mjs';
import {assessO25} from '../scripts/oracle-o25-assess.mjs';

function b(v){return {low:Math.max(0,v-.00001).toFixed(5),high:Math.min(1,v+.00001).toFixed(5)};}
function run(hitHours=new Set([5,15,25,35,45,55,65,75,85,95,105,115,125,135,145,155])){
  const lines=['WPO25 BEGIN schema=1 scenario=o25-combined-armored-hires-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection18 runMode=trial161 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:90,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DAMAGE_MODIFIER:0.053,ORG_DICE:4,ORG_ARMOR_SOFT_DICE:6,STR_DAMAGE_MODIFIER:0.060,STR_DICE:2,STR_ARMOR_SOFT_DICE:2,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenderAttackModifier=army_infantry_attack_factor:-0.99 defenseModifier=army_infantry_defence_factor:-0.9923784016 attackerArmor=20 attackerPiercing=9 defenderArmor=20 defenderPiercing=4 expectedPiercingDamageFactor=0.50 prepared=yes modifiersPresent=yes'];
  let ao=1,as=1,do_=1,ds=1,hitIndex=0;
  for(let h=0;h<=161;h++){
    if(h>=2&&hitHours.has(h)){
      const orgDie=(hitIndex%6)+1,strDie=(hitIndex%2)+1;
      do_-=.00044*orgDie;
      ds-=.00012*strDie;
      hitIndex++;
    }
    const A=b(ao),AS=b(as),D=b(do_),DS=b(ds);
    lines.push('WPO25 SAMPLE hour='+h);
    lines.push('WPO25 ATTACKER orgLow='+A.low+' orgHigh='+A.high+' strengthLow='+AS.low+' strengthHigh='+AS.high);
    lines.push('WPO25 DEFENDER orgLow='+D.low+' orgHigh='+D.high+' strengthLow='+DS.low+' strengthHigh='+DS.high);
  }
  lines.push('WPO25 END hour=161 reason=trial161-complete modifiersRemoved=yes cleanupFailure=no');
  return lines.join('\n');
}
const p={
 gerSoftDisplayed:20,gerSoftTooltip:20,polDefenseDisplayed:10,polDefenseTooltip:10,
 gerPiercingDisplayed:9,gerPiercingTooltip:9,gerArmorDisplayed:20,gerArmorTooltip:20,
 polPiercingDisplayed:4,polPiercingTooltip:4,polArmorDisplayed:20,polArmorTooltip:20
};
const ok=assessO25({batch:parseO25Batch(run()),panel:p});
assert.equal(ok.action,'combined-armored-hires-coherent');
assert.equal(ok.counts.hit,16);
assert.equal(ok.counts.mixedChannel,0);
assert.equal(ok.counts.supportViolation,0);
const few=assessO25({batch:parseO25Batch(run(new Set([10,20,30]))),panel:p});
assert.equal(few.action,'combined-armored-hires-mismatch');
console.log('Oracle O25 parser/assessment regression passed.');

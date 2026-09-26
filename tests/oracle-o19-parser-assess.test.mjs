import assert from 'node:assert/strict';
import {parseO19Batch} from '../scripts/oracle-o19-trial161.mjs';
import {assessO19} from '../scripts/oracle-o19-assess.mjs';
function b(v){return {low:Math.max(0,v-.00001).toFixed(5),high:Math.min(1,v+.00001).toFixed(5)};}
function run(hitHours=new Set([5,15,25,35,45,55,65,75,85,95,105,115,125,135,145,155])){
  const lines=['WPO19 BEGIN schema=1 scenario=o19-combined-normal-damage-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial161 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:90,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DAMAGE_MODIFIER:0.053,ORG_DICE:4,ORG_ARMOR_SOFT_DICE:6,STR_DAMAGE_MODIFIER:0.060,STR_DICE:2,STR_ARMOR_SOFT_DICE:2,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenderAttackModifier=army_infantry_attack_factor:-0.99 defenseModifier=army_infantry_defence_factor:-0.9923784016 prepared=yes modifiersPresent=yes'];
  let ao=1,as=1,do_=1,ds=1;
  for(let h=0;h<=161;h++){
    if(h>=2&&hitHours.has(h)){do_-=.00088;ds-=.00024;}
    const A=b(ao),AS=b(as),D=b(do_),DS=b(ds);
    lines.push('WPO19 SAMPLE hour='+h);
    lines.push('WPO19 ATTACKER orgLow='+A.low+' orgHigh='+A.high+' strengthLow='+AS.low+' strengthHigh='+AS.high);
    lines.push('WPO19 DEFENDER orgLow='+D.low+' orgHigh='+D.high+' strengthLow='+DS.low+' strengthHigh='+DS.high);
  }
  lines.push('WPO19 END hour=161 reason=trial161-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const p={displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10};
const ok=assessO19({batch:parseO19Batch(run()),panel:p});assert.equal(ok.action,'combined-normal-damage-coherent');assert.equal(ok.counts.hit,16);
const few=assessO19({batch:parseO19Batch(run(new Set([10,20,30]))),panel:p});assert.equal(few.action,'combined-normal-damage-mismatch');
console.log('Oracle O19 parser/assessment regression passed.');

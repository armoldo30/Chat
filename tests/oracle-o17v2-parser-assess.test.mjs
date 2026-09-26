import assert from 'node:assert/strict';
import {parseO17v2Batch} from '../scripts/oracle-o17v2-trial61.mjs';
import {assessO17v2} from '../scripts/oracle-o17v2-assess.mjs';
function b(v){return {low:Math.max(0,v-.00001).toFixed(5),high:Math.min(1,v+.00001).toFixed(5)};}
function run(unit=.024){
 const mult=[];for(let i=0;i<15;i++)mult.push(1);for(let i=0;i<30;i++)mult.push(2);for(let i=0;i<15;i++)mult.push(3);
 const lines=['WPO17V2 BEGIN schema=1 scenario=o17v2-all-hit-strength-scale-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial61 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:0,ORG_DAMAGE_MODIFIER:0,STR_DAMAGE_MODIFIER:0.060,STR_DICE:1,STR_ARMOR_SOFT_DICE:1,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenderAttackModifier=army_infantry_attack_factor:-0.99 defenseModifier=army_infantry_defence_factor:-0.9923784016 prepared=yes modifiersPresent=yes'];let ds=1,as=1;
 for(let h=0;h<=61;h++){if(h>=2){ds-=unit*mult[h-2]/100;as-=.000001;}const org=b(1),a=b(as),d=b(ds);lines.push('WPO17V2 SAMPLE hour='+h);lines.push('WPO17V2 ATTACKER orgLow='+org.low+' orgHigh='+org.high+' strengthLow='+a.low+' strengthHigh='+a.high);lines.push('WPO17V2 DEFENDER orgLow='+org.low+' orgHigh='+org.high+' strengthLow='+d.low+' strengthHigh='+d.high);}
 lines.push('WPO17V2 END hour=61 reason=trial61-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const panel={displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10};
assert.equal(assessO17v2({batch:parseO17v2Batch(run(.024)),panel}).action,'point-nine-strength-scale-supported');
assert.equal(assessO17v2({batch:parseO17v2Batch(run(.02667)),panel}).action,'naive-hp-strength-scale-supported');
console.log('Oracle O17v2 parser/assessment regression passed.');

import assert from 'node:assert/strict';
import {parseO17Batch} from '../scripts/oracle-o17-trial21.mjs';
import {assessO17} from '../scripts/oracle-o17-assess.mjs';
function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(lossPp=.02667){
 const step=lossPp/100;const lines=['WPO17 BEGIN schema=1 scenario=o17-fixed-strength-unit-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial21 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DAMAGE_MODIFIER:0,ORG_DICE:1,STR_DAMAGE_MODIFIER:0.060,STR_DICE:1,STR_ARMOR_SOFT_DICE:1,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-0.9923784016 prepared=yes modifiersPresent=yes'];let ds=1,as=1;
 for(let h=0;h<=21;h++){if(h>=2){ds-=step;as-=step;}const org=b(1),a=b(as),d=b(ds);lines.push('WPO17 SAMPLE hour='+h);lines.push('WPO17 ATTACKER orgLow='+org.low+' orgHigh='+org.high+' strengthLow='+a.low+' strengthHigh='+a.high);lines.push('WPO17 DEFENDER orgLow='+org.low+' orgHigh='+org.high+' strengthLow='+d.low+' strengthHigh='+d.high);}
 lines.push('WPO17 END hour=21 reason=trial21-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const panel={displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10};
assert.equal(assessO17({batch:parseO17Batch(run()),panel}).action,'fixed-strength-unit-supported');
assert.equal(assessO17({batch:parseO17Batch(run(.050)),panel}).action,'fixed-strength-unit-mismatch-or-feedback');
console.log('Oracle O17 parser/assessment regression passed.');

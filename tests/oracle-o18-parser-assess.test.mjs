import assert from 'node:assert/strict';
import {parseO18Batch} from '../scripts/oracle-o18-trial21.mjs';
import {assessO18} from '../scripts/oracle-o18-assess.mjs';
function b(v){return {low:Math.max(0,v-.00001).toFixed(5),high:Math.min(1,v+.00001).toFixed(5)};}
function run(two=10){
 const seq=Array.from({length:20},(_,i)=>i<two?.00048:.00024),lines=['WPO18 BEGIN schema=1 scenario=o18-normal-strength-die-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial21 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DAMAGE_MODIFIER:0,STR_DAMAGE_MODIFIER:0.060,STR_DICE:2,STR_ARMOR_SOFT_DICE:2,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenderAttackModifier=army_infantry_attack_factor:-0.99 defenseModifier=army_infantry_defence_factor:-0.9923784016 prepared=yes modifiersPresent=yes'];let ds=1,as=1;
 for(let h=0;h<=21;h++){if(h>=2){ds-=seq[h-2];as-=.000001;}const org=b(1),a=b(as),d=b(ds);lines.push('WPO18 SAMPLE hour='+h);lines.push('WPO18 ATTACKER orgLow='+org.low+' orgHigh='+org.high+' strengthLow='+a.low+' strengthHigh='+a.high);lines.push('WPO18 DEFENDER orgLow='+org.low+' orgHigh='+org.high+' strengthLow='+d.low+' strengthHigh='+d.high);}
 lines.push('WPO18 END hour=21 reason=trial21-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const p={displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10};
assert.equal(assessO18({batch:parseO18Batch(run(10)),panel:p}).action,'strength-die-uniform-1-through-2-supported');
assert.equal(assessO18({batch:parseO18Batch(run(18)),panel:p}).action,'strength-die-semantics-mismatch');
console.log('Oracle O18 parser/assessment regression passed.');

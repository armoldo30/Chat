import assert from 'node:assert/strict';
import {parseO13Batch} from '../scripts/oracle-o13-trial81.mjs';
import {assessO13} from '../scripts/oracle-o13-assess.mjs';
function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(one,two){
 const seq=[];for(let i=0;i<one;i++)seq.push(.00088);for(let i=0;i<two;i++)seq.push(.00176);if(seq.length!==80)throw new Error('need 80');
 const lines=['WPO13 BEGIN schema=1 scenario=o13-defended-only-defense18-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial81 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-0.9599742088 prepared=yes modifiersPresent=yes'];let d=1;
 for(let h=0;h<=81;h++){if(h>=2)d-=seq[h-2];const a=b(h<2?1:1-h*.0001),s=b(1),x=b(d);lines.push('WPO13 SAMPLE hour='+h);lines.push('WPO13 ATTACKER orgLow='+a.low+' orgHigh='+a.high+' strengthLow='+s.low+' strengthHigh='+s.high);lines.push('WPO13 DEFENDER orgLow='+x.low+' orgHigh='+x.high+' strengthLow='+s.low+' strengthHigh='+s.high);}
 lines.push('WPO13 END hour=81 reason=trial81-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const panel={displayedSoft:20,tooltipSoft:20,displayedDefense:18,tooltipDefense:18};
const ok=assessO13({batch:parseO13Batch(run(32,48)),panel});assert.equal(ok.action,'single-Bernoulli-bounded-transports');assert.ok(ok.pearsonChiSquare<1e-12);
const miss=assessO13({batch:parseO13Batch(run(20,60)),panel});assert.equal(miss.action,'single-Bernoulli-bounded-does-not-transport');
console.log('Oracle O13 parser/assessment regression passed.');

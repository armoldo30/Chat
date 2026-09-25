import assert from 'node:assert/strict';
import {parseO14Batch} from '../scripts/oracle-o14-trial81.mjs';
import {assessO14} from '../scripts/oracle-o14-assess.mjs';
function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(hits){
 const seq=Array.from({length:80},(_,i)=>i<hits?.00088:0);const lines=['WPO14 BEGIN schema=1 scenario=o14-normal-defended-hit-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial81 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:90,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-0.9923784016 prepared=yes modifiersPresent=yes'];let d=1;
 for(let h=0;h<=81;h++){if(h>=2)d-=seq[h-2];const a=b(h<2?1:1-h*.0001),s=b(1),x=b(d);lines.push('WPO14 SAMPLE hour='+h);lines.push('WPO14 ATTACKER orgLow='+a.low+' orgHigh='+a.high+' strengthLow='+s.low+' strengthHigh='+s.high);lines.push('WPO14 DEFENDER orgLow='+x.low+' orgHigh='+x.high+' strengthLow='+s.low+' strengthHigh='+s.high);}
 lines.push('WPO14 END hour=81 reason=trial81-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const panel={displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10};
assert.equal(assessO14({batch:parseO14Batch(run(8)),panel}).action,'defended-hit-10pct-supported');
assert.equal(assessO14({batch:parseO14Batch(run(30)),panel}).action,'defended-hit-semantics-mismatch');
console.log('Oracle O14 parser/assessment regression passed.');

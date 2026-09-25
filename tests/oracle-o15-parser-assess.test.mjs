import assert from 'node:assert/strict';
import {parseO15Batch} from '../scripts/oracle-o15-trial161.mjs';
import {assessO15} from '../scripts/oracle-o15-assess.mjs';
function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
 const seq=[];for(let i=0;i<counts.zero;i++)seq.push(0);for(let i=0;i<counts.one;i++)seq.push(.00088);for(let i=0;i<counts.two;i++)seq.push(.00176);if(seq.length!==160)throw new Error('need 160');
 const lines=['WPO15 BEGIN schema=1 scenario=o15-normal-undefended-hit-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial161 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:100,CHANCE_TO_AVOID_HIT_AT_NO_DEF:60,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-0.9923784016 prepared=yes modifiersPresent=yes'];let d=1;
 for(let h=0;h<=161;h++){if(h>=2)d-=seq[h-2];const a=b(h<2?1:1-h*.00005),s=b(1),x=b(d);lines.push('WPO15 SAMPLE hour='+h);lines.push('WPO15 ATTACKER orgLow='+a.low+' orgHigh='+a.high+' strengthLow='+s.low+' strengthHigh='+s.high);lines.push('WPO15 DEFENDER orgLow='+x.low+' orgHigh='+x.high+' strengthLow='+s.low+' strengthHigh='+s.high);}
 lines.push('WPO15 END hour=161 reason=trial161-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const panel={displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10};
const ok=assessO15({batch:parseO15Batch(run({zero:102,one:52,two:6})),panel});assert.equal(ok.action,'undefended-hit-40pct-supported');
const miss=assessO15({batch:parseO15Batch(run({zero:130,one:25,two:5})),panel});assert.equal(miss.action,'undefended-hit-semantics-mismatch');
console.log('Oracle O15 parser/assessment regression passed.');

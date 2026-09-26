import assert from 'node:assert/strict';
import {parseO20Batch} from '../scripts/oracle-o20-trial161.mjs';
import {assessO20} from '../scripts/oracle-o20-assess.mjs';
function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
 const seq=[];for(let i=0;i<counts.zero;i++)seq.push(0);for(let i=0;i<counts.one;i++)seq.push(.00088);for(let i=0;i<counts.two;i++)seq.push(.00176);for(let i=0;i<counts.three;i++)seq.push(.00264);if(seq.length!==160)throw new Error('need 160');
 const lines=['WPO20 BEGIN schema=1 scenario=o20-normal-hit-transport-defense18-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial161 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:90,CHANCE_TO_AVOID_HIT_AT_NO_DEF:60,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenderAttackModifier=army_infantry_attack_factor:-0.99 defenseModifier=army_infantry_defence_factor:-0.9599742088 prepared=yes modifiersPresent=yes'];let d=1;
 for(let h=0;h<=161;h++){if(h>=2)d-=seq[h-2];const a=b(h<2?1:1-h*.00001),s=b(1),x=b(d);lines.push('WPO20 SAMPLE hour='+h);lines.push('WPO20 ATTACKER orgLow='+a.low+' orgHigh='+a.high+' strengthLow='+s.low+' strengthHigh='+s.high);lines.push('WPO20 DEFENDER orgLow='+x.low+' orgHigh='+x.high+' strengthLow='+s.low+' strengthHigh='+s.high);}
 lines.push('WPO20 END hour=161 reason=trial161-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const p={displayedSoft:20,tooltipSoft:20,displayedDefense:18,tooltipDefense:18};
const ok=assessO20({batch:parseO20Batch(run({zero:115,one:40,two:5,three:0})),panel:p});assert.equal(ok.action,'normal-hit-transport-defense18-supported');
const bad=assessO20({batch:parseO20Batch(run({zero:90,one:60,two:10,three:0})),panel:p});assert.equal(bad.action,'normal-hit-transport-mismatch');
console.log('Oracle O20 parser/assessment regression passed.');

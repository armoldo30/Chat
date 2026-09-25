import assert from 'node:assert/strict';
import {parseO12Batch} from '../scripts/oracle-o12-trial81.mjs';
import {assessO12} from '../scripts/oracle-o12-assess.mjs';

function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
 const seq=[];for(let i=0;i<counts.zero;i++)seq.push(0);for(let i=0;i<counts.one;i++)seq.push(.00088);for(let i=0;i<counts.two;i++)seq.push(.00176);
 if(seq.length!==80)throw new Error('need 80');
 const lines=['WPO12 BEGIN schema=1 scenario=o12-defended-only-defense12-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial81 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-0.9842773534 prepared=yes modifiersPresent=yes'];let d=1;
 for(let h=0;h<=81;h++){if(h>=2)d-=seq[h-2];const a=b(h<2?1:1-h*.0001),s=b(1),x=b(d);lines.push('WPO12 SAMPLE hour='+h);lines.push('WPO12 ATTACKER orgLow='+a.low+' orgHigh='+a.high+' strengthLow='+s.low+' strengthHigh='+s.high);lines.push('WPO12 DEFENDER orgLow='+x.low+' orgHigh='+x.high+' strengthLow='+s.low+' strengthHigh='+s.high);}
 lines.push('WPO12 END hour=81 reason=trial81-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const p={displayedSoft:20,tooltipSoft:20,displayedDefense:12,tooltipDefense:12};
const bern=parseO12Batch(run({zero:0,one:68,two:12}));
const a=assessO12({batch:bern,panel:p});
assert.equal(a.action,'candidate-family-set-resolved');assert.ok(a.compatibleFamilies.includes('singleBernoulliBounded'));
const det=parseO12Batch(run({zero:0,one:80,two:0}));
assert.ok(assessO12({batch:det,panel:p}).compatibleFamilies.includes('deterministicOne'));
console.log('Oracle O12 parser/assessment regression passed.');

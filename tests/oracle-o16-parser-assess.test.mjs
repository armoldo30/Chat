import assert from 'node:assert/strict';
import {parseO16Batch} from '../scripts/oracle-o16-trial81.mjs';
import {assessO16} from '../scripts/oracle-o16-assess.mjs';
function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
 const seq=[];for(let i=0;i<counts.one;i++)seq.push(.00088);for(let i=0;i<counts.two;i++)seq.push(.00176);for(let i=0;i<counts.three;i++)seq.push(.00264);for(let i=0;i<counts.four;i++)seq.push(.00352);if(seq.length!==80)throw new Error('need 80');
 const lines=['WPO16 BEGIN schema=1 scenario=o16-normal-org-die-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial81 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DAMAGE_MODIFIER:0.053,ORG_DICE:4,ORG_ARMOR_SOFT_DICE:6,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-0.9923784016 prepared=yes modifiersPresent=yes'];let d=1;
 for(let h=0;h<=81;h++){if(h>=2)d-=seq[h-2];const a=b(h<2?1:1-h*.0002),s=b(1),x=b(d);lines.push('WPO16 SAMPLE hour='+h);lines.push('WPO16 ATTACKER orgLow='+a.low+' orgHigh='+a.high+' strengthLow='+s.low+' strengthHigh='+s.high);lines.push('WPO16 DEFENDER orgLow='+x.low+' orgHigh='+x.high+' strengthLow='+s.low+' strengthHigh='+s.high);}
 lines.push('WPO16 END hour=81 reason=trial81-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n');
}
const panel={displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10};
const ok=assessO16({batch:parseO16Batch(run({one:20,two:20,three:20,four:20})),panel});assert.equal(ok.action,'org-die-uniform-1-through-4-supported');
const miss=assessO16({batch:parseO16Batch(run({one:50,two:10,three:10,four:10})),panel});assert.equal(miss.action,'org-die-semantics-mismatch');
console.log('Oracle O16 parser/assessment regression passed.');

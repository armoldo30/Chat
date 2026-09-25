import assert from 'node:assert/strict';
import {parseO10V2Batch} from '../scripts/oracle-o10v2-trial61.mjs';
import {assessO10V2} from '../scripts/oracle-o10v2-assess.mjs';
function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
 const seq=[];for(let i=0;i<counts.one;i++)seq.push(.00088);for(let i=0;i<counts.two;i++)seq.push(.00176);for(let i=0;i<counts.three;i++)seq.push(.00264);
 if(seq.length!==60)throw new Error('synthetic O10v2 needs 60 intervals');
 const lines=['WPO10V2 BEGIN schema=1 scenario=o10v2-minimum-defense-response-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial61 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:100,CHANCE_TO_AVOID_HIT_AT_NO_DEF:0,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-1.0328836429 prepared=yes modifiersPresent=yes'];let d=1;
 for(let h=0;h<=61;h++){if(h>=2)d-=seq[h-2];const aOrg=b(h<2?1:1-h*.0001),aStr=b(1),dOrg=b(d),dStr=b(1);lines.push('WPO10V2 SAMPLE hour='+h);lines.push('WPO10V2 ATTACKER orgLow='+aOrg.low+' orgHigh='+aOrg.high+' strengthLow='+aStr.low+' strengthHigh='+aStr.high);lines.push('WPO10V2 DEFENDER orgLow='+dOrg.low+' orgHigh='+dOrg.high+' strengthLow='+dStr.low+' strengthHigh='+dStr.high);}
 lines.push('WPO10V2 END hour=61 reason=trial61-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n')+'\n';
}
const base=parseO10V2Batch(run({one:15,two:30,three:15}));
assert.equal(assessO10V2({batch:base,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:1.9,tooltipDefense:1.9}}).action,'minimum-defense-effect-not-detected');
const shifted=parseO10V2Batch(run({one:30,two:25,three:5}));
assert.equal(assessO10V2({batch:shifted,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:1.9,tooltipDefense:1.9}}).action,'minimum-defense-effect-detected');
console.log('Oracle O10v2 parser/assessment regression passed.');

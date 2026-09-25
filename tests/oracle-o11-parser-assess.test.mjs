import assert from 'node:assert/strict';
import {parseO11Batch} from '../scripts/oracle-o11-trial81.mjs';
import {assessO11,O8_UNDEF,O9_TOTAL} from '../scripts/oracle-o11-assess.mjs';
function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
  const seq=[];for(let i=0;i<counts.zero;i++)seq.push(0);for(let i=0;i<counts.one;i++)seq.push(.00088);for(let i=0;i<counts.two;i++)seq.push(.00176);for(let i=0;i<counts.three;i++)seq.push(.00264);
  if(seq.length!==80)throw new Error('synthetic O11 needs 80 intervals');
  const lines=['WPO11 BEGIN schema=1 scenario=o11-defended-only-partition-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial81 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:100,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-0.9923784016 prepared=yes modifiersPresent=yes'];
  let d=1;
  for(let h=0;h<=81;h++){if(h>=2)d-=seq[h-2];const aOrg=b(h<2?1:1-h*.0001),aStr=b(1),dOrg=b(d),dStr=b(1);lines.push('WPO11 SAMPLE hour='+h);lines.push('WPO11 ATTACKER orgLow='+aOrg.low+' orgHigh='+aOrg.high+' strengthLow='+aStr.low+' strengthHigh='+aStr.high);lines.push('WPO11 DEFENDER orgLow='+dOrg.low+' orgHigh='+dOrg.high+' strengthLow='+dStr.low+' strengthHigh='+dStr.high);}
  lines.push('WPO11 END hour=81 reason=trial81-complete modifiersRemoved=yes cleanupFailure=no');return lines.join('\n')+'\n';
}
const compatible=parseO11Batch(run({zero:8,one:50,two:22,three:0}));
const a=assessO11({batch:compatible,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10}});
assert.equal(a.action,'partition-mean-compatible');
assert.ok(Math.abs(a.defendedMoments.mean-(O9_TOTAL.mean-O8_UNDEF.mean))<0.11);

const mismatch=parseO11Batch(run({zero:50,one:30,two:0,three:0}));
const b1=assessO11({batch:mismatch,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10}});
assert.equal(b1.action,'partition-mean-mismatch');
console.log('Oracle O11 parser/assessment regression passed.');

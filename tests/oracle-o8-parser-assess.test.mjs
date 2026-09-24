import assert from 'node:assert/strict';
import {parseO8Batch} from '../scripts/oracle-o8-trial81.mjs';
import {assessO8} from '../scripts/oracle-o8-assess.mjs';

function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
  const seq=[];
  for(let i=0;i<counts.zero;i++)seq.push(0);
  for(let i=0;i<counts.one;i++)seq.push(.00088);
  for(let i=0;i<counts.two;i++)seq.push(.00176);
  for(let i=0;i<counts.three;i++)seq.push(.00264);
  if(seq.length!==80)throw new Error('synthetic O8 needs 80 intervals');
  const lines=['WPO8 BEGIN schema=1 scenario=o8-defense-wide-rounding-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial81 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:100,CHANCE_TO_AVOID_HIT_AT_NO_DEF:0,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_defence_factor:-0.9607843137 prepared=yes modifiersPresent=yes'];
  let d=1;
  for(let h=0;h<=81;h++){
    if(h>=2)d-=seq[h-2];
    const aOrg=b(h<2?1:1-h*.0001),aStr=b(1),dOrg=b(d),dStr=b(1);
    lines.push('WPO8 SAMPLE hour='+h);
    lines.push('WPO8 ATTACKER orgLow='+aOrg.low+' orgHigh='+aOrg.high+' strengthLow='+aStr.low+' strengthHigh='+aStr.high);
    lines.push('WPO8 DEFENDER orgLow='+dOrg.low+' orgHigh='+dOrg.high+' strengthLow='+dStr.low+' strengthHigh='+dStr.high);
  }
  lines.push('WPO8 END hour=81 reason=trial81-complete modifiersRemoved=yes cleanupFailure=no');
  return lines.join('\n')+'\n';
}

const good=parseO8Batch(run({zero:25,one:30,two:20,three:5}));
const a=assessO8({batch:good,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10}});
assert.equal(a.action,'wide-defense-candidate-supported');
assert.ok(a.pearsonChiSquare<1e-12);

const oldShape=parseO8Batch(run({zero:20,one:40,two:20,three:0}));
const b1=assessO8({batch:oldShape,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10}});
assert.equal(b1.action,'wide-defense-candidate-mismatch');
assert.ok(b1.pearsonChiSquare>11.34487);

assert.throws(()=>assessO8({batch:good,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10.1}}),/tooltip\/effective POL Defense/);
console.log('Oracle O8 parser/assessment regression passed.');

import assert from 'node:assert/strict';
import {parseO7Batch} from '../scripts/oracle-o7-trial61.mjs';
import {assessO7} from '../scripts/oracle-o7-assess.mjs';

function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
  const seq=[];
  for(let i=0;i<counts.one;i++)seq.push(.00088);
  for(let i=0;i<counts.two;i++)seq.push(.00176);
  for(let i=0;i<counts.three;i++)seq.push(.00264);
  if(seq.length!==60)throw new Error('synthetic O7 needs 60 intervals');
  const lines=['WPO7 BEGIN schema=1 scenario=o7-wide-random-rounding-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial61 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 prepared=yes modifierPresent=yes'];
  let d=1;
  for(let h=0;h<=61;h++){
    if(h>=2)d-=seq[h-2];
    const aOrg=b(h<2?1:1-h*.0001),aStr=b(1),dOrg=b(d),dStr=b(1);
    lines.push('WPO7 SAMPLE hour='+h);
    lines.push('WPO7 ATTACKER orgLow='+aOrg.low+' orgHigh='+aOrg.high+' strengthLow='+aStr.low+' strengthHigh='+aStr.high);
    lines.push('WPO7 DEFENDER orgLow='+dOrg.low+' orgHigh='+dOrg.high+' strengthLow='+dStr.low+' strengthHigh='+dStr.high);
  }
  lines.push('WPO7 END hour=61 reason=trial61-complete modifierRemoved=yes cleanupFailure=no');
  return lines.join('\n')+'\n';
}

const good=parseO7Batch(run({one:15,two:30,three:15}));
const a=assessO7({batch:good,panel:{displayedSoft:20,tooltipSoft:20,defenderDefense:255}});
assert.equal(a.action,'wide-rounding-candidate-supported');
assert.ok(a.pearsonChiSquare<1e-12);

const bad=parseO7Batch(run({one:2,two:56,three:2}));
const b1=assessO7({batch:bad,panel:{displayedSoft:20,tooltipSoft:20,defenderDefense:255}});
assert.equal(b1.action,'wide-rounding-candidate-mismatch');
assert.ok(b1.pearsonChiSquare>9.21034);

assert.throws(()=>assessO7({batch:good,panel:{displayedSoft:20,tooltipSoft:20.5,defenderDefense:255}}),/tooltip Soft Attack/);
console.log('Oracle O7 parser/assessment regression passed.');

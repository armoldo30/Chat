import assert from 'node:assert/strict';
import {parseO9Batch} from '../scripts/oracle-o9-trial61.mjs';
import {assessO9} from '../scripts/oracle-o9-assess.mjs';
function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
  const seq=[];for(let i=0;i<counts.one;i++)seq.push(.00088);for(let i=0;i<counts.two;i++)seq.push(.00176);for(let i=0;i<counts.three;i++)seq.push(.00264);
  if(seq.length!==60)throw new Error('synthetic O9 needs 60 intervals');
  const lines=['WPO9 BEGIN schema=1 scenario=o9-o8-all-hit-transport-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial61 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,CHANCE_TO_AVOID_HIT_AT_NO_DEF:0,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-0.9923784016 prepared=yes modifiersPresent=yes'];
  let d=1;
  for(let h=0;h<=61;h++){
    if(h>=2)d-=seq[h-2];
    const aOrg=b(h<2?1:1-h*.0001),aStr=b(1),dOrg=b(d),dStr=b(1);
    lines.push('WPO9 SAMPLE hour='+h);
    lines.push('WPO9 ATTACKER orgLow='+aOrg.low+' orgHigh='+aOrg.high+' strengthLow='+aStr.low+' strengthHigh='+aStr.high);
    lines.push('WPO9 DEFENDER orgLow='+dOrg.low+' orgHigh='+dOrg.high+' strengthLow='+dStr.low+' strengthHigh='+dStr.high);
  }
  lines.push('WPO9 END hour=61 reason=trial61-complete modifiersRemoved=yes cleanupFailure=no');
  return lines.join('\n')+'\n';
}
const batch=parseO9Batch(run({one:15,two:30,three:15}));
const a=assessO9({batch,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10}});
assert.equal(a.action,'o7-attack-law-transports');
assert.ok(a.pearsonChiSquare<1e-12);
const miss=parseO9Batch(run({one:5,two:50,three:5}));
assert.equal(assessO9({batch:miss,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10}}).action,'o7-attack-law-does-not-transport');
console.log('Oracle O9 parser/assessment regression passed.');

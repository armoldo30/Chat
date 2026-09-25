import assert from 'node:assert/strict';
import {parseO10Batch} from '../scripts/oracle-o10-trial61.mjs';
import {assessO10} from '../scripts/oracle-o10-assess.mjs';

function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(counts){
  const seq=[];for(let i=0;i<counts.one;i++)seq.push(.00088);for(let i=0;i<counts.two;i++)seq.push(.00176);for(let i=0;i<counts.three;i++)seq.push(.00264);
  if(seq.length!==60)throw new Error('synthetic O10 needs 60 intervals');
  const lines=['WPO10 BEGIN schema=1 scenario=o10-zero-defense-hit-gate-control-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial61 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:100,CHANCE_TO_AVOID_HIT_AT_NO_DEF:0,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.721 defenseModifier=army_infantry_defence_factor:-1.0423836429 prepared=yes modifiersPresent=yes'];
  let d=1;
  for(let h=0;h<=61;h++){
    if(h>=2)d-=seq[h-2];
    const aOrg=b(h<2?1:1-h*.0001),aStr=b(1),dOrg=b(d),dStr=b(1);
    lines.push('WPO10 SAMPLE hour='+h);
    lines.push('WPO10 ATTACKER orgLow='+aOrg.low+' orgHigh='+aOrg.high+' strengthLow='+aStr.low+' strengthHigh='+aStr.high);
    lines.push('WPO10 DEFENDER orgLow='+dOrg.low+' orgHigh='+dOrg.high+' strengthLow='+dStr.low+' strengthHigh='+dStr.high);
  }
  lines.push('WPO10 END hour=61 reason=trial61-complete modifiersRemoved=yes cleanupFailure=no');
  return lines.join('\n')+'\n';
}

const batch=parseO10Batch(run({one:15,two:30,three:15}));
const a=assessO10({batch,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:0,tooltipDefense:0}});
assert.equal(a.action,'zero-defense-control-supported');
assert.ok(a.pearsonChiSquare<1e-12);

const miss=parseO10Batch(run({one:5,two:50,three:5}));
assert.equal(assessO10({batch:miss,panel:{displayedSoft:20,tooltipSoft:20,displayedDefense:0,tooltipDefense:0}}).action,'o8-hit-gate-bundle-alters-attack-transport');

console.log('Oracle O10 parser/assessment regression passed.');

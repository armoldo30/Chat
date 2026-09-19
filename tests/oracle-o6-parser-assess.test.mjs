import assert from 'node:assert/strict';
import {parseO6Batch} from '../scripts/oracle-o6-trial41.mjs';
import {assessO6} from '../scripts/oracle-o6-assess.mjs';

function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(mode,highCount){
  const mod=mode==='low'?'army_infantry_attack_factor:-0.83':'army_infantry_attack_factor:-0.748';
  const lines=['WPO6 BEGIN schema=1 scenario=o6-two-point-probability-law-v1 mode='+mode+' gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial41 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier='+mod+' prepared=yes modifierPresent=yes'];
  let d=1;
  for(let h=0;h<=41;h++){
    if(h>=2){
      const idx=h-2;
      d-=(idx<highCount?.00176:.00092);
    }
    const aOrg=b(h<2?1:1-h*.0001),aStr=b(1),dOrg=b(d),dStr=b(1);
    lines.push('WPO6 SAMPLE hour='+h);
    lines.push('WPO6 ATTACKER orgLow='+aOrg.low+' orgHigh='+aOrg.high+' strengthLow='+aStr.low+' strengthHigh='+aStr.high);
    lines.push('WPO6 DEFENDER orgLow='+dOrg.low+' orgHigh='+dOrg.high+' strengthLow='+dStr.low+' strengthHigh='+dStr.high);
  }
  lines.push('WPO6 END hour=41 reason=trial41-complete modifiersRemoved=yes cleanupFailure=no');
  return lines.join('\n')+'\n';
}

const good=parseO6Batch(run('low',8)+run('high',32));
assert.equal(good.acceptedRuns,2);
const a=assessO6({batch:good,lowStats:{attackerSoft:12,defenderDefense:255},highStats:{attackerSoft:18,defenderDefense:255}});
assert.equal(a.action,'attack-div10-probability-gradient-consistent');
assert.equal(a.kLow,8);
assert.equal(a.kHigh,32);

const bad=parseO6Batch(run('low',22)+run('high',18));
const b1=assessO6({batch:bad,lowStats:{attackerSoft:12,defenderDefense:255},highStats:{attackerSoft:18,defenderDefense:255}});
assert.equal(b1.action,'attack-div10-probability-law-mismatch-candidate');


const lowOnly=parseO6Batch(run('low',8));
lowOnly.byMode.low[0].capture.positiveIntervals=31;
const lowFail=assessO6({batch:lowOnly,lowStats:{attackerSoft:12,defenderDefense:255},highStats:{attackerSoft:18,defenderDefense:255}});
assert.equal(lowFail.stage,'low-control-failure');
assert.equal(lowFail.action,'review-unexpected-zero-damage-intervals-before-original-o6-interpretation');
assert.equal(lowFail.lowZeroIntervals,9);

console.log('Oracle O6 parser/assessment regression passed.');

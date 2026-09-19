import assert from 'node:assert/strict';
import {parseO5Batch} from '../scripts/oracle-o5-trial11.mjs';
import {assessO5} from '../scripts/oracle-o5-assess.mjs';

function b(v){return {low:Math.max(0,v-.00003).toFixed(5),high:Math.min(1,v+.00003).toFixed(5)};}
function run(losses){
  const lines=['WPO5 BEGIN schema=1 scenario=o5-fixed-damage-integerization-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial11 tacticMode=neutral-basic-only defineOverrides=BASE_CHANCE_TO_AVOID_HIT:0,ORG_DICE:1,STR_DAMAGE:0,NIGHT_PENALTY:0 attackModifier=army_infantry_attack_factor:-0.79 prepared=yes modifierPresent=yes'];
  let dOrg=1;
  for(let h=0;h<=11;h++){
    if(h>=2)dOrg-=losses[h-2]/100;
    const aOrg=b(h<2?1:1-h*.0001),aStr=b(1),dO=b(dOrg),dStr=b(1);
    lines.push('WPO5 SAMPLE hour='+h);
    lines.push('WPO5 ATTACKER orgLow='+aOrg.low+' orgHigh='+aOrg.high+' strengthLow='+aStr.low+' strengthHigh='+aStr.high);
    lines.push('WPO5 DEFENDER orgLow='+dO.low+' orgHigh='+dO.high+' strengthLow='+dStr.low+' strengthHigh='+dStr.high);
  }
  lines.push('WPO5 END hour=11 reason=trial11-complete modifierRemoved=yes cleanupFailure=no');
  return lines.join('\n')+'\n';
}
const twoLevel=[.08,.16,.08,.16,.08,.16,.08,.16,.08,.16];
const batch=parseO5Batch(run(twoLevel));
assert.equal(batch.acceptedRuns,1);
assert.equal(batch.rejectedRuns,0);
const a=assessO5({batch,observedStats:{attackerSoft:15,defenderDefense:255}});
assert.equal(a.action,'stochastic-discrete-multiplicity-supported');
assert.ok(a.cluster.ratio>1.8&&a.cluster.ratio<2.2);

const single=parseO5Batch(run(Array(10).fill(.08)));
const b1=assessO5({batch:single,observedStats:{attackerSoft:15,defenderDefense:255}});
assert.equal(b1.action,'single-level-mismatch-candidate');
assert.ok(b1.worstCaseSingleClusterProbability<.03);
console.log('Oracle O5 parser/assessment regression passed.');

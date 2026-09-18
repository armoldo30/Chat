import assert from 'node:assert/strict';
import {parseO2Batch,O2_HOURS} from '../scripts/oracle-o2-trial6.mjs';

function bounded(v){
  const low=Math.max(0,v-0.00003),high=Math.min(1,v+0.00003);
  return {low:low.toFixed(5),high:high.toFixed(5)};
}
function run(scale=1){
  const lines=[
    'WPO2 BEGIN schema=1 scenario=o2-defended-amplified-v1 gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial6 tacticMode=neutral-basic-only amplifier=army_infantry_attack_factor:+2.0'
  ];
  for(const hour of O2_HOURS){
    const aOrg=bounded(0.99997-hour*0.00055*scale);
    const aStr=bounded(0.99997-hour*0.00012*scale);
    const dOrg=bounded(0.99997-hour*0.0012*scale);
    const dStr=bounded(0.99997-hour*0.00065*scale);
    lines.push(`WPO2 SAMPLE hour=${hour}`);
    lines.push(`WPO2 ATTACKER orgLow=${aOrg.low} orgHigh=${aOrg.high} strengthLow=${aStr.low} strengthHigh=${aStr.high}`);
    lines.push(`WPO2 DEFENDER orgLow=${dOrg.low} orgHigh=${dOrg.high} strengthLow=${dStr.low} strengthHigh=${dStr.high}`);
  }
  lines.push('WPO2 END hour=6 reason=trial6-complete amplifierRemoved=yes');
  return lines.join('\n')+'\n';
}

const result=parseO2Batch(run(1)+run(1.15));
assert.equal(result.scenario,'o2-defended-amplified-v1');
assert.equal(result.totalRuns,2);
assert.equal(result.acceptedRuns,2);
assert.equal(result.rejectedRuns,0);
assert.equal(result.uniqueTraceCount,2);
assert.equal(result.primaryMetric,'defenderStrengthLoss');
assert.equal(result.runs[0].capture.samples.length,7);
assert.deepEqual(result.runs[0].capture.samples.map(s=>s.hour),O2_HOURS);
assert.ok(result.metrics.defenderStrengthLoss.mean>0);
assert.ok(result.metrics.attackerStrengthLoss.mean>0);

const duplicate=parseO2Batch(run(1)+run(1));
assert.equal(duplicate.acceptedRuns,2);
assert.equal(duplicate.uniqueTraceCount,1);
assert.deepEqual(duplicate.duplicateTraceGroups,[[1,2]]);
assert.match(duplicate.independentSampleWarning,/duplicate/i);

const malformed=run(1).replace(/WPO2 SAMPLE hour=4\nWPO2 ATTACKER[^\n]+\nWPO2 DEFENDER[^\n]+\n/,'');
const rejected=parseO2Batch(malformed);
assert.equal(rejected.acceptedRuns,0);
assert.equal(rejected.rejectedRuns,1);
assert.match(rejected.rejected[0].reason,/expected hours 0\.\.6/);

const wrongAmplifier=run(1).replace('amplifier=army_infantry_attack_factor:+2.0','amplifier=army_infantry_attack_factor:+1.5');
const rejectedAmp=parseO2Batch(wrongAmplifier);
assert.equal(rejectedAmp.acceptedRuns,0);
assert.match(rejectedAmp.rejected[0].reason,/unexpected amplifier/);

console.log('Oracle O2 trial6 parser regression passed.');

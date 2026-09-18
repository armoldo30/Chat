import assert from 'node:assert/strict';
import {
  parseO2Batch,O2_HOURS,O2_GAME_VERSION,O2_BASE_CHECKSUM,O2_CHECKSUM_SCOPE,O2_METHOD
} from '../scripts/oracle-o2-trial6.mjs';

function bounded(v){
  const low=Math.max(0,v-0.00003),high=Math.min(1,v+0.00003);
  return {low:low.toFixed(5),high:high.toFixed(5)};
}
function run(scale=1){
  const lines=[
    `WPO2 BEGIN schema=1 scenario=o2-defended-amplified-v1 gameVersion=${O2_GAME_VERSION} checksum=${O2_BASE_CHECKSUM} checksumScope=${O2_CHECKSUM_SCOPE} method=${O2_METHOD} runMode=trial6 tacticMode=neutral-basic-only amplifier=army_infantry_attack_factor:+2.0 prepared=yes`
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
function rejectWith(text,pattern){
  const result=parseO2Batch(text);
  assert.equal(result.acceptedRuns,0);
  assert.equal(result.rejectedRuns,1);
  assert.match(result.rejected[0].reason,pattern);
}

const result=parseO2Batch(run(1)+run(1.15));
assert.equal(result.scenario,'o2-defended-amplified-v1');
assert.equal(result.totalRuns,2);
assert.equal(result.acceptedRuns,2);
assert.equal(result.rejectedRuns,0);
assert.equal(result.uniqueTraceCount,2);
assert.equal(result.primaryMetric,'defenderStrengthLoss');
assert.equal(result.target.gameVersion,O2_GAME_VERSION);
assert.equal(result.target.baseChecksum,O2_BASE_CHECKSUM);
assert.equal(result.target.checksumScope,O2_CHECKSUM_SCOPE);
assert.equal(result.target.measurementMethod,O2_METHOD);
assert.equal(result.runs[0].capture.metadata.prepared,true);
assert.equal(result.runs[0].capture.metadata.endHour,6);
assert.equal(result.runs[0].capture.samples.length,7);
assert.deepEqual(result.runs[0].capture.samples.map(s=>s.hour),O2_HOURS);
assert.ok(result.metrics.defenderStrengthLoss.mean>0);
assert.ok(result.metrics.attackerStrengthLoss.mean>0);
assert.match(result.acceptanceBoundary,/external scenario controls/i);

const duplicate=parseO2Batch(run(1)+run(1));
assert.equal(duplicate.acceptedRuns,2);
assert.equal(duplicate.uniqueTraceCount,1);
assert.deepEqual(duplicate.duplicateTraceGroups,[[1,2]]);
assert.match(duplicate.independentSampleWarning,/duplicate/i);

rejectWith(run(1).replace(/WPO2 SAMPLE hour=4\nWPO2 ATTACKER[^\n]+\nWPO2 DEFENDER[^\n]+\n/,''),/expected hours 0\.\.6/);
rejectWith(run(1).replace('amplifier=army_infantry_attack_factor:+2.0','amplifier=army_infantry_attack_factor:+1.5'),/unexpected amplifier/);
rejectWith(run(1).replace(`gameVersion=${O2_GAME_VERSION}`,'gameVersion=1.19.2.0.a729'),/unexpected gameVersion/);
rejectWith(run(1).replace(`checksum=${O2_BASE_CHECKSUM}`,'checksum=dead'),/unexpected base checksum/);
rejectWith(run(1).replace(`checksumScope=${O2_CHECKSUM_SCOPE}`,'checksumScope=runtime'),/unexpected checksumScope/);
rejectWith(run(1).replace(`method=${O2_METHOD}`,'method=bisection10'),/unexpected measurement method/);
rejectWith(run(1).replace('prepared=yes','prepared=no'),/prepared=yes/);
rejectWith(run(1).replace('WPO2 END hour=6','WPO2 END hour=5'),/unexpected END hour/);
rejectWith(run(1).replace(
  'WPO2 ATTACKER orgLow=0.99994 orgHigh=1.00000 strengthLow=0.99994 strengthHigh=1.00000',
  'WPO2 ATTACKER orgLow=0.98000 orgHigh=0.98006 strengthLow=0.99994 strengthHigh=1.00000'
),/hour 0.*organization.*100%/);

console.log('Oracle O2 trial6 parser regression passed.');

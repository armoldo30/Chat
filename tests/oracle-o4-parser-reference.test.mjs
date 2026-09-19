import assert from 'node:assert/strict';
import {parseO4Batch,O4_HOURS,O4_GAME_VERSION,O4_BASE_CHECKSUM,O4_CHECKSUM_SCOPE,O4_METHOD} from '../scripts/oracle-o4-trial6.mjs';
import {buildO4Reference} from '../scripts/oracle-o4-reference.mjs';

function bounds(center){
  return {low:Math.max(0,center-0.00003).toFixed(5),high:Math.min(1,center+0.00003).toFixed(5)};
}
function run(positiveIntervals=[],variant=0){
  const lines=[`WPO4 BEGIN schema=1 scenario=o4-sub10-undefended-incidence-v1 gameVersion=${O4_GAME_VERSION} checksum=${O4_BASE_CHECKSUM} checksumScope=${O4_CHECKSUM_SCOPE} method=${O4_METHOD} runMode=trial6 tacticMode=neutral-basic-only attackAttenuator=army_infantry_attack_factor:-0.97 defenseSuppressor=army_infantry_defence_factor:-1.04 prepared=yes attackAttenuatorPresent=yes defenseSuppressorPresent=yes`];
  let d=1;
  for(const hour of O4_HOURS){
    if(hour>=2 && positiveIntervals.includes(hour-1))d-=0.00025;
    const a=hour<2?1:1-hour*(0.00001+variant*0.000001);
    const ab=bounds(a),db=bounds(d);
    lines.push(`WPO4 SAMPLE hour=${hour}`);
    lines.push(`WPO4 ATTACKER orgLow=${ab.low} orgHigh=${ab.high} strengthLow=${ab.low} strengthHigh=${ab.high}`);
    lines.push(`WPO4 DEFENDER orgLow=${db.low} orgHigh=${db.high} strengthLow=${db.low} strengthHigh=${db.high}`);
  }
  lines.push('WPO4 END hour=6 reason=trial6-complete modifiersRemoved=yes cleanupFailure=no');
  return lines.join('\n')+'\n';
}

const text=run([1,4],0)+run([3],1);
const batch=parseO4Batch(text);
assert.equal(batch.acceptedRuns,2);
assert.equal(batch.rejectedRuns,0);
assert.equal(batch.uniqueTraceCount,2);
assert.equal(batch.incidence.totalFiringIntervals,10);
assert.equal(batch.incidence.positiveIntervals,3);
assert.equal(batch.runs[0].capture.positiveIntervalCount,2);
assert.deepEqual(batch.runs[0].capture.firingIntervals.map(x=>x.fromHour),[1,2,3,4,5]);

const ref=buildO4Reference();
assert.equal(ref.totalIntervals,20);
assert.ok(Math.abs(ref.exactDecisionProbabilities.minimumOneHypothesis_P_K_le_3-0.01596116279000825)<1e-12);
assert.ok(Math.abs(ref.exactDecisionProbabilities.plannerWorstSensitivity_P_K_le_3-0.7873410254286847)<1e-12);
assert.ok(Math.abs(ref.exactDecisionProbabilities.plannerWorstSensitivity_P_K_ge_6-0.026018460588337455)<1e-12);

console.log('Oracle O4 parser/reference regression passed.');

import assert from 'node:assert/strict';
import {parseTrial6Batch} from '../scripts/oracle-trial6-batch.mjs';

function run(orgA6='0.99675',orgD6='0.99437'){
  return `WPO1 BEGIN schema=1 scenario=o1-land-baseline-v1 gameVersion=1.19.3.0.c01a checksum=5632 method=bisection14 runMode=trial6
WPO1 SAMPLE hour=0
WPO1 ATTACKER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 DEFENDER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 SAMPLE hour=1
WPO1 ATTACKER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 DEFENDER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 SAMPLE hour=2
WPO1 ATTACKER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 DEFENDER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 SAMPLE hour=3
WPO1 ATTACKER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 DEFENDER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 SAMPLE hour=4
WPO1 ATTACKER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 DEFENDER orgLow=0.99810 orgHigh=0.99816 strengthLow=0.99938 strengthHigh=0.99944
WPO1 SAMPLE hour=5
WPO1 ATTACKER orgLow=0.99993 orgHigh=1 strengthLow=0.99993 strengthHigh=1
WPO1 DEFENDER orgLow=0.99810 orgHigh=0.99816 strengthLow=0.99938 strengthHigh=0.99944
WPO1 SAMPLE hour=6
WPO1 ATTACKER orgLow=${orgA6} orgHigh=0.99681 strengthLow=0.99969 strengthHigh=0.99975
WPO1 DEFENDER orgLow=${orgD6} orgHigh=0.99443 strengthLow=0.99883 strengthHigh=0.99889
WPO1 END hour=6 reason=trial6-complete
`;
}
const result=parseTrial6Batch(run()+run('0.99670','0.99430'));
assert.equal(result.totalTrial6Runs,2);
assert.equal(result.acceptedRuns,2);
assert.equal(result.rejectedRuns,0);
assert.equal(result.runs[0].capture.samples.length,7);
assert.ok(result.metrics.attackerOrgLoss.mean>0);
assert.ok(result.metrics.defenderStrengthLoss.mean>0);
assert.ok(result.zeroDamageIntervalRate>=0&&result.zeroDamageIntervalRate<=1);

const malformed=run().replace('WPO1 SAMPLE hour=5\n','');
const rejected=parseTrial6Batch(malformed);
assert.equal(rejected.acceptedRuns,0);
assert.equal(rejected.rejectedRuns,1);

console.log('Oracle trial6 batch analyzer regression passed.');

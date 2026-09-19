import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseO4V2Batch} from '../scripts/oracle-o4v2-trial6.mjs';
import {assessO4V2} from '../scripts/oracle-o4v2-assess.mjs';

const control=readFileSync(new URL('../oracle-lab/captures/o4v2-control-001-wpo4v2.log.txt',import.meta.url),'utf8');
const probe=readFileSync(new URL('../oracle-lab/captures/o4v2-probe-001-wpo4v2.log.txt',import.meta.url),'utf8');
const batch=parseO4V2Batch(control+probe);

assert.equal(batch.acceptedRuns,2);
assert.equal(batch.rejectedRuns,0);
assert.equal(batch.byMode.control.length,1);
assert.equal(batch.byMode.probe.length,1);
assert.equal(batch.byMode.control[0].capture.positiveIntervals,5);
assert.equal(batch.byMode.probe[0].capture.positiveIntervals,1);

const assessment=assessO4V2({
  batch,
  controlStats:{attackerSoft:11,defenderDefense:255},
  probeStats:{attackerSoft:2,defenderDefense:255}
});
assert.equal(assessment.stage,'complete');
assert.equal(assessment.action,'minimum-one-hypothesis-contradicted');
assert.equal(assessment.evidenceStatus,'unvalidated');
assert.equal(assessment.controlPositiveIntervals,5);
assert.equal(assessment.probePositiveIntervals,1);

console.log('O4V2_COMPLETE '+JSON.stringify({
  controlK:assessment.controlPositiveIntervals,
  probeK:assessment.probePositiveIntervals,
  action:assessment.action
}));

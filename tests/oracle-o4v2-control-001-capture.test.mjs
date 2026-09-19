import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseO4V2Batch} from '../scripts/oracle-o4v2-trial6.mjs';

const text=readFileSync(new URL('../oracle-lab/captures/o4v2-control-001-wpo4v2.log.txt',import.meta.url),'utf8');
const batch=parseO4V2Batch(text);
assert.equal(batch.acceptedRuns,1);
assert.equal(batch.rejectedRuns,0);
assert.equal(batch.byMode.control.length,1);
assert.equal(batch.byMode.probe.length,0);
assert.equal(batch.byMode.control[0].capture.positiveIntervals,5);
assert.deepEqual(batch.byMode.control[0].capture.intervals.map(x=>x.anyDamageObserved),[true,true,true,true,true]);

console.log('O4V2_CONTROL_001 '+JSON.stringify({
  positiveIntervals:batch.byMode.control[0].capture.positiveIntervals,
  totalIntervals:batch.byMode.control[0].capture.intervals.length
}));

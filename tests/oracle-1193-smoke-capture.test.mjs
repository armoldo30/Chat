import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseTrial6Batch} from '../scripts/oracle-trial6-batch.mjs';

const text=readFileSync(new URL('../oracle-lab/captures/o1-1193-smoke-001-wpo1.log.txt',import.meta.url),'utf8');
const batch=parseTrial6Batch(text);
assert.equal(batch.totalTrial6Runs,1);
assert.equal(batch.acceptedRuns,1);
assert.equal(batch.rejectedRuns,0);
const run=batch.runs[0];
assert.equal(run.capture.metadata.gameVersion,'1.19.3.0.c01a');
assert.equal(run.capture.metadata.checksum,'5632');
assert.equal(run.capture.metadata.runMode,'trial6');
assert.deepEqual(run.capture.samples.map(x=>x.hour),[0,1,2,3,4,5,6]);
assert.equal(run.summary.deltas.attackerOrgLoss,0.3185);
assert.equal(run.summary.deltas.attackerStrengthLoss,0.0245);
assert.equal(run.summary.deltas.defenderOrgLoss,0.5565);
assert.equal(run.summary.deltas.defenderStrengthLoss,0.1105);

console.log('Oracle 1.19.3 executable smoke capture regression passed.');

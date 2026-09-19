import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseO5Batch} from '../scripts/oracle-o5-trial11.mjs';
import {assessO5} from '../scripts/oracle-o5-assess.mjs';

const text=readFileSync(new URL('../oracle-lab/captures/o5-fixed-damage-001-wpo5.log.txt',import.meta.url),'utf8');
const batch=parseO5Batch(text);
assert.equal(batch.acceptedRuns,1);
assert.equal(batch.rejectedRuns,0);
assert.equal(batch.runs[0].capture.positiveIntervals,10);

const assessment=assessO5({batch,observedStats:{attackerSoft:15,defenderDefense:255}});
assert.equal(assessment.stage,'complete');
assert.equal(assessment.action,'stochastic-discrete-multiplicity-supported');
assert.ok(assessment.cluster.ratio>=1.8&&assessment.cluster.ratio<=2.2);
assert.equal(assessment.cluster.lowCount,1);
assert.equal(assessment.cluster.highCount,9);

console.log('O5_FIXED_DAMAGE_001 '+JSON.stringify({
  lowCount:assessment.cluster.lowCount,
  highCount:assessment.cluster.highCount,
  ratio:assessment.cluster.ratio,
  action:assessment.action
}));

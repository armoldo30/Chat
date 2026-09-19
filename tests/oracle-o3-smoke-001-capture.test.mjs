import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseO3Batch} from '../scripts/oracle-o3-sub10-trial6.mjs';
import {buildO3Reference} from '../scripts/oracle-o3-sub10-reference.mjs';
import {assessO3Decision} from '../scripts/oracle-o3-assess.mjs';

const text=readFileSync(new URL('../oracle-lab/captures/o3-sub10-smoke-001-wpo3.log.txt',import.meta.url),'utf8');
const batch=parseO3Batch(text);
assert.equal(batch.acceptedRuns,1);
assert.equal(batch.rejectedRuns,0);
assert.equal(batch.uniqueTraceCount,1);
assert.equal(batch.incidence.damageRuns,1);
assert.equal(batch.runs[0].capture.incidence.defenderStrengthDamageObserved,true);
assert.ok(Math.abs(batch.runs[0].capture.deltas.defenderStrengthLoss-0.0185)<1e-12);

const reference=buildO3Reference({attackerSoft:7});
const assessment=assessO3Decision({
  batch,
  reference,
  observedStats:{attackerSoft:7,attackerBreakthrough:35,defenderSoft:69,defenderDefense:255}
});
assert.equal(assessment.stage,'early-positive-incidence');
assert.equal(assessment.action,'stop-floor-zero-hypothesis-contradicted');
assert.equal(assessment.evidenceStatus,'unvalidated');

console.log('O3_SMOKE_001 '+JSON.stringify({
  damageRuns:batch.incidence.damageRuns,
  defenderStrengthLoss:batch.runs[0].capture.deltas.defenderStrengthLoss,
  action:assessment.action
}));

import assert from 'node:assert/strict';
import {assessO2Decision,O2_EXTERNAL_CONTROLS} from '../scripts/oracle-o2-assess.mjs';

function batch(n,{mean=0.4,rejected=0,unique=n,duplicates=[]}={}){
  return {
    totalRuns:n+rejected,
    acceptedRuns:n,
    rejectedRuns:rejected,
    uniqueTraceCount:unique,
    duplicateTraceGroups:duplicates,
    metrics:{defenderStrengthLoss:{mean}}
  };
}
const reference={
  predeclaredSamplingPlan:{
    preliminaryMeanInterval95:{n:6,low:0.30,high:0.50},
    confirmatoryMeanInterval99:{n:12,low:0.28,high:0.52}
  }
};
const observedStats={attackerSoft:214,attackerBreakthrough:35,defenderSoft:70,defenderDefense:255};

assert.ok(O2_EXTERNAL_CONTROLS.length>=10);

let r=assessO2Decision({batch:batch(1),reference,observedStats});
assert.equal(r.stage,'smoke-only');
assert.equal(r.evidenceStatus,'unvalidated');
assert.equal(r.externalScenarioControlStatus,'requires-manual-evidence-review');

r=assessO2Decision({batch:batch(5),reference,observedStats});
assert.equal(r.stage,'preliminary-incomplete');
assert.equal(r.action,'collect-to-6-unique-runs');

r=assessO2Decision({batch:batch(6,{mean:.40}),reference,observedStats});
assert.equal(r.stage,'preliminary-6');
assert.equal(r.outsideReferenceInterval,false);
assert.equal(r.action,'no-preliminary-mismatch-trigger');
assert.equal(r.evidenceStatus,'unvalidated');

r=assessO2Decision({batch:batch(6,{mean:.60}),reference,observedStats});
assert.equal(r.outsideReferenceInterval,true);
assert.equal(r.action,'collect-confirmatory-to-12');

r=assessO2Decision({batch:batch(10,{mean:.60}),reference,observedStats});
assert.equal(r.stage,'confirmatory-incomplete');
assert.equal(r.action,'collect-to-12-unique-runs');

r=assessO2Decision({batch:batch(12,{mean:.40}),reference,observedStats});
assert.equal(r.stage,'confirmatory-12');
assert.equal(r.outsideReferenceInterval,false);
assert.equal(r.action,'no-confirmatory-mismatch-trigger');
assert.equal(r.evidenceStatus,'unvalidated');

r=assessO2Decision({batch:batch(12,{mean:.60}),reference,observedStats});
assert.equal(r.outsideReferenceInterval,true);
assert.equal(r.action,'confirmatory-mismatch-candidate');
assert.match(r.interpretation,/not yet oracle-divergent/i);
assert.equal(r.evidenceStatus,'unvalidated');

r=assessO2Decision({batch:batch(2,{unique:1,duplicates:[[1,2]]}),reference,observedStats});
assert.equal(r.stage,'invalid-batch');
assert.equal(r.action,'replace-duplicate-traces');

r=assessO2Decision({batch:batch(1,{rejected:1}),reference,observedStats});
assert.equal(r.stage,'invalid-batch');
assert.equal(r.action,'repair-or-rerun-rejected-traces');

assert.throws(
  ()=>assessO2Decision({batch:batch(6),reference,observedStats:{...observedStats,attackerSoft:246}}),
  /margin control violated/
);
r=assessO2Decision({batch:batch(7),reference,observedStats});
assert.equal(r.stage,'confirmatory-incomplete');
assert.equal(r.action,'collect-to-12-unique-runs');

console.log('Oracle O2 predeclared assessment regression passed.');

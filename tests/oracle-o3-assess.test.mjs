import assert from 'node:assert/strict';
import {buildO3Reference} from '../scripts/oracle-o3-sub10-reference.mjs';
import {assessO3Decision} from '../scripts/oracle-o3-assess.mjs';

const observedStats={attackerSoft:8,attackerBreakthrough:35,defenderSoft:69,defenderDefense:255};
const reference=buildO3Reference({attackerSoft:8});
function batch(n,damageRuns=0){
  return {
    totalRuns:n,acceptedRuns:n,rejectedRuns:0,uniqueTraceCount:n,duplicateTraceGroups:[],
    incidence:{damageRuns,zeroDamageRuns:n-damageRuns}
  };
}

const positive=assessO3Decision({batch:batch(1,1),reference,observedStats});
assert.equal(positive.evidenceStatus,'unvalidated');
assert.equal(positive.action,'stop-floor-zero-hypothesis-contradicted');

const prelim=assessO3Decision({batch:batch(6,0),reference,observedStats});
assert.equal(prelim.stage,'preliminary-6-all-zero');
assert.equal(prelim.action,'collect-confirmatory-to-10');

const confirm=assessO3Decision({batch:batch(10,0),reference,observedStats});
assert.equal(confirm.stage,'confirmatory-10-all-zero');
assert.equal(confirm.action,'stochastic-rounding-mismatch-candidate');
assert.ok(confirm.worstCasePlannerAllZeroProbability<.05);

assert.throws(
  ()=>assessO3Decision({batch:batch(1,0),reference,observedStats:{...observedStats,attackerSoft:9}}),
  /requires displayed GER Soft Attack/
);

console.log('Oracle O3 assessment regression passed.');

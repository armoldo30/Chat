import assert from 'node:assert/strict';
import {buildO4Reference} from '../scripts/oracle-o4-reference.mjs';
import {assessO4Decision} from '../scripts/oracle-o4-assess.mjs';

const reference=buildO4Reference();
const observedStats={attackerSoft:2,attackerBreakthrough:35,defenderSoft:69,defenderDefense:0};
function batch(k,n=4){
  return {totalRuns:n,acceptedRuns:n,rejectedRuns:0,uniqueTraceCount:n,duplicateTraceGroups:[],incidence:{positiveIntervals:k,zeroIntervals:n*5-k,totalFiringIntervals:n*5}};
}

const incomplete=assessO4Decision({batch:batch(1,1),reference,observedStats});
assert.equal(incomplete.action,'collect-to-4-unique-runs');

const low=assessO4Decision({batch:batch(3),reference,observedStats});
assert.equal(low.action,'minimum-one-point-mismatch-candidate');
assert.equal(low.evidenceStatus,'unvalidated');

const middle=assessO4Decision({batch:batch(4),reference,observedStats});
assert.equal(middle.action,'inconclusive-stop');

const high=assessO4Decision({batch:batch(6),reference,observedStats});
assert.equal(high.action,'stochastic-rounding-mismatch-candidate');

assert.throws(()=>assessO4Decision({batch:batch(1,1),reference,observedStats:{...observedStats,attackerSoft:3}}),/requires displayed GER Soft Attack exactly 2/);
assert.throws(()=>assessO4Decision({batch:batch(1,1),reference,observedStats:{...observedStats,defenderDefense:1}}),/requires displayed POL Defense exactly 0/);

console.log('Oracle O4 assessment regression passed.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildO2Reference} from '../scripts/oracle-o2-planner-reference.mjs';
import {assessO2Decision} from '../scripts/oracle-o2-assess.mjs';

const capture=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o2-defended-amplified-preliminary-6-summary.json',import.meta.url),'utf8'));
assert.equal(capture.machineAcceptance.totalUniqueRuns,6);
assert.equal(capture.machineAcceptance.rejectedRuns,0);
assert.deepEqual(capture.machineAcceptance.duplicateTraceGroups,[]);
assert.equal(capture.machineAcceptance.startupNoDamageAllRuns,true);
assert.equal(capture.machineAcceptance.cleanupConfirmedAllRuns,true);
assert.equal(capture.observedCombatPanel.defendedMargin,40);

const reference=buildO2Reference({
  attackerSoft:capture.observedCombatPanel.attackerSoftAttack,
  attackerBreakthrough:capture.observedCombatPanel.attackerBreakthrough,
  defenderSoft:capture.observedCombatPanel.defenderSoftAttack,
  defenderDefense:capture.observedCombatPanel.defenderDefense,
  runs:100000,
  displayHalfWidth:1,
  sampleMeanReplicates:50000
});

const batch={
  totalRuns:6,
  acceptedRuns:6,
  rejectedRuns:0,
  uniqueTraceCount:6,
  duplicateTraceGroups:[],
  metrics:{defenderStrengthLoss:{mean:capture.aggregate.defenderStrengthLoss.mean}}
};
const observedStats={
  attackerSoft:capture.observedCombatPanel.attackerSoftAttack,
  attackerBreakthrough:capture.observedCombatPanel.attackerBreakthrough,
  defenderSoft:capture.observedCombatPanel.defenderSoftAttack,
  defenderDefense:capture.observedCombatPanel.defenderDefense
};
const assessment=assessO2Decision({batch,reference,observedStats});

assert.equal(assessment.stage,'preliminary-6');
assert.equal(assessment.evidenceStatus,'unvalidated');
assert.equal(assessment.externalScenarioControlStatus,'requires-manual-evidence-review');
assert.equal(assessment.action,'no-preliminary-mismatch-trigger');
assert.equal(assessment.outsideReferenceInterval,false);
assert.equal(assessment.referenceInterval.centralProbability,0.95);
assert.ok(Math.abs(assessment.referenceInterval.low-0.31834092881945464)<1e-12);
assert.ok(Math.abs(assessment.referenceInterval.high-0.5483257378472323)<1e-12);
assert.ok(Math.abs(reference.midpoint.defenderStrengthLoss.mean-0.43018266666690985)<1e-12);

console.log('O2_PRELIMINARY6_ASSESSMENT '+JSON.stringify({
  observedMean:capture.aggregate.defenderStrengthLoss.mean,
  interval:{
    low:assessment.referenceInterval.low,
    high:assessment.referenceInterval.high,
    plannerOnlyLow:assessment.referenceInterval.plannerOnlyLow,
    plannerOnlyHigh:assessment.referenceInterval.plannerOnlyHigh,
    measurementAllowancePp:assessment.referenceInterval.executableLossDeltaMaxMeasurementErrorPp
  },
  outsideReferenceInterval:assessment.outsideReferenceInterval,
  action:assessment.action,
  interpretation:assessment.interpretation,
  primaryMeanSensitivity:reference.primaryMeanSensitivity,
  midpointMean:reference.midpoint.defenderStrengthLoss.mean
}));
console.log('Oracle O2 preliminary six-run assessment regression passed.');

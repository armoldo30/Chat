import assert from 'node:assert/strict';
import {buildO2Reference,plannerO2Sample} from '../scripts/oracle-o2-planner-reference.mjs';

const sample=plannerO2Sample({
  attackerSoft:214,attackerBreakthrough:35,defenderSoft:70,defenderDefense:255,
  runs:1200,seed:1234
});
assert.equal(sample.defenderStrengthLoss.n,1200);
assert.ok(sample.defenderStrengthLoss.mean>0.25);
assert.ok(sample.defenderStrengthLoss.mean<0.65);

const report=buildO2Reference({
  attackerSoft:214,attackerBreakthrough:35,defenderSoft:70,defenderDefense:255,
  runs:1200,displayHalfWidth:1
});
assert.equal(report.scenario,'o2-defended-amplified-v1');
assert.equal(report.primaryMetric,'defenderStrengthLoss');
assert.equal(report.referenceClassification,'planner analytical');
assert.equal(report.sourceObservationClassification,'executable inferred');
assert.equal(report.fullyDefendedAcrossSensitivity,true);
assert.equal(report.lowDamage.defenderStrengthLoss.n,1200);
assert.equal(report.midpoint.defenderStrengthLoss.n,1200);
assert.equal(report.highDamage.defenderStrengthLoss.n,1200);
assert.ok(report.primaryMeanSensitivity.min<=report.primaryMeanSensitivity.midpoint);
assert.ok(report.primaryMeanSensitivity.midpoint<=report.primaryMeanSensitivity.max);
assert.equal(report.predeclaredSamplingPlan.preliminaryUniqueRuns,6);
assert.equal(report.predeclaredSamplingPlan.confirmatoryTotalUniqueRuns,12);
assert.ok(report.predeclaredSamplingPlan.preliminaryMeanInterval99.low<report.predeclaredSamplingPlan.preliminaryMeanInterval99.high);
assert.ok(report.predeclaredSamplingPlan.confirmatoryMeanInterval99.low<report.predeclaredSamplingPlan.confirmatoryMeanInterval99.high);
assert.ok(
  report.predeclaredSamplingPlan.confirmatoryMeanInterval99.high-report.predeclaredSamplingPlan.confirmatoryMeanInterval99.low
  < report.predeclaredSamplingPlan.preliminaryMeanInterval99.high-report.predeclaredSamplingPlan.preliminaryMeanInterval99.low
);

assert.throws(()=>buildO2Reference({
  attackerSoft:255,attackerBreakthrough:35,defenderSoft:70,defenderDefense:255,
  runs:200,displayHalfWidth:1
}),/fully-defended|threshold/);

console.log('Oracle O2 planner-reference regression passed.');

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
  runs:1200,displayHalfWidth:1,sampleMeanReplicates:2000
});
assert.equal(report.schemaVersion,2);
assert.equal(report.scenario,'o2-defended-amplified-v1');
assert.equal(report.primaryMetric,'defenderStrengthLoss');
assert.equal(report.referenceClassification,'planner analytical');
assert.equal(report.sourceObservationClassification,'executable inferred');
assert.equal(report.fullyDefendedAcrossSensitivity,true);
assert.equal(report.sensitivityPointCount,17);
assert.equal(report.sensitivityPoints.length,17);
assert.equal(report.sensitivityPoints.filter(x=>x.label==='midpoint').length,1);
assert.equal(report.midpoint.defenderStrengthLoss.n,1200);
assert.ok(report.primaryMeanSensitivity.min<=report.primaryMeanSensitivity.midpoint);
assert.ok(report.primaryMeanSensitivity.midpoint<=report.primaryMeanSensitivity.max);
assert.equal(report.primaryMinPoint.defenderStrengthLoss.mean,report.primaryMeanSensitivity.min);
assert.equal(report.primaryMaxPoint.defenderStrengthLoss.mean,report.primaryMeanSensitivity.max);
assert.equal(report.predeclaredSamplingPlan.preliminaryUniqueRuns,6);
assert.equal(report.predeclaredSamplingPlan.confirmatoryTotalUniqueRuns,12);
assert.match(report.predeclaredSamplingPlan.intervalMethod,/empirical/i);
assert.match(report.predeclaredSamplingPlan.intervalMethod,/16 corners/i);

const six=report.predeclaredSamplingPlan.preliminaryMeanInterval95;
const twelve=report.predeclaredSamplingPlan.confirmatoryMeanInterval99;
for(const interval of [six,twelve]){
  assert.equal(interval.method,'empirical-bootstrap-union-across-full-planner-input-sensitivity');
  assert.equal(interval.replicatesPerSensitivityPoint,2000);
  assert.ok(interval.low<=interval.plannerOnlyLow);
  assert.ok(interval.high>=interval.plannerOnlyHigh);
  assert.ok(interval.executableLossDeltaMaxMeasurementErrorPp>0);
  assert.equal(interval.sensitivityPointCount,17);
  assert.equal(interval.sensitivityIntervals.length,17);
  assert.ok(interval.low<interval.high);
  assert.ok(interval.sensitivityIntervals.every(x=>x.method==='empirical-bootstrap-from-planner-monte-carlo'));
}
assert.equal(six.centralProbability,0.95);
assert.equal(twelve.centralProbability,0.99);
assert.equal(report.predeclaredSamplingPlan.measurementUncertainty.bisectionSteps,14);
assert.ok(report.predeclaredSamplingPlan.measurementUncertainty.h0ToH6LossDeltaMaxErrorPp>0.006);
assert.ok(report.predeclaredSamplingPlan.measurementUncertainty.h0ToH6LossDeltaMaxErrorPp<0.0062);

assert.throws(()=>buildO2Reference({
  attackerSoft:255,attackerBreakthrough:35,defenderSoft:70,defenderDefense:255,
  runs:200,displayHalfWidth:1,sampleMeanReplicates:1000
}),/fully-defended|threshold/);

console.log('Oracle O2 planner-reference regression passed.');

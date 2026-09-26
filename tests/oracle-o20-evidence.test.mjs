import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o20-normal-hit-transport-defense18-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o20-normal-hit-transport-defense18-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o20-normal-hit-transport-defense18-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.intervalCounts,{zero:121,one:36,two:3,three:0,fourPlus:0});
assert.deepEqual(summary.groupedCounts,{zero:121,one:36,twoPlus:3});
assert.equal(summary.action,'normal-hit-transport-defense18-supported');
assert.ok(summary.pearsonChiSquare<=summary.criticalValue1PctDf2);
assert.ok(summary.groupedCounts.twoPlus>0);
assert.equal(summary.machineControls.startupNoDamage,true);
assert.equal(summary.machineControls.strengthInvariant,true);
assert.equal(summary.machineControls.modifierRemoved,true);
assert.equal(summary.machineControls.cleanupFailure,false);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.decision,'supported');
assert.equal(assessment.action,'normal-hit-transport-defense18-supported');

console.log('Oracle O20 accepted executable evidence regression passed.');

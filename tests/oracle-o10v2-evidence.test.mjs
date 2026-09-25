import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o10v2-minimum-defense-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o10v2-minimum-defense-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o10v2-minimum-defense-response-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.multiplicityCounts,{zero:1,one:18,two:37,three:4,fourPlus:0});
assert.equal(summary.machineControls.startupNoDamage,true);
assert.equal(summary.machineControls.attackerStrengthUnchanged,true);
assert.equal(summary.machineControls.defenderStrengthUnchanged,true);
assert.equal(summary.machineControls.modifierRemoved,true);
assert.equal(summary.machineControls.cleanupFailure,false);
assert.equal(summary.reference.pearsonChiSquareIgnoringSupportViolation,10.3);
assert.equal(summary.action,'minimum-defense-effect-detected');

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.action,'minimum-defense-effect-detected');
assert.equal(assessment.decision,'effect-detected');
assert.equal(assessment.pearsonChiSquare,10.3);

console.log('Oracle O10v2 accepted executable evidence regression passed.');

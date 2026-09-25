import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o9-o8-all-hit-transport-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o9-o8-all-hit-transport-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o9-o8-all-hit-transport-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.multiplicityCounts,{zero:0,one:16,two:32,three:12,fourPlus:0});
assert.equal(summary.machineControls.startupNoDamage,true);
assert.equal(summary.machineControls.attackerStrengthUnchanged,true);
assert.equal(summary.machineControls.defenderStrengthUnchanged,true);
assert.equal(summary.machineControls.modifierRemoved,true);
assert.equal(summary.machineControls.cleanupFailure,false);
assert.equal(summary.candidate.pearsonChiSquare,0.8);
assert.equal(summary.action,'o7-attack-law-transports');

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.action,'o7-attack-law-transports');
assert.equal(assessment.decision,'supported');
assert.equal(assessment.pearsonChiSquare,0.8);

console.log('Oracle O9 accepted executable evidence regression passed.');

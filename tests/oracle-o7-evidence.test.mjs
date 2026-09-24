import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o7-wide-rounding-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o7-wide-rounding-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o7-wide-random-rounding-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.observedCombatPanel,{attackerSoftAttackDisplayed:20,attackerSoftAttackTooltip:20,defenderDefense:255,provenance:'user-reported live panel'});
assert.deepEqual(summary.multiplicityCounts,{zero:0,one:18,two:33,three:9,fourPlus:0});
assert.equal(summary.machineControls.startupNoDamage,true);
assert.equal(summary.machineControls.attackerStrengthUnchanged,true);
assert.equal(summary.machineControls.defenderStrengthUnchanged,true);
assert.equal(summary.machineControls.modifierRemoved,true);
assert.equal(summary.machineControls.cleanupFailure,false);
assert.equal(summary.candidate.pearsonChiSquare,3.3);
assert.equal(summary.candidate.criticalValue1Pct,9.21034);
assert.equal(summary.action,'wide-rounding-candidate-supported');

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.action,'wide-rounding-candidate-supported');
assert.equal(assessment.implementationEvidence,'executable inferred');
assert.equal(assessment.decision,'supported');

console.log('Oracle O7 accepted executable evidence regression passed.');

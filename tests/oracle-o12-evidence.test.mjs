import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o12-defended-only-defense12-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o12-defended-only-defense12-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o12-defended-only-defense12-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.multiplicityCounts,{zero:0,one:71,two:9,three:0,fourPlus:0});
assert.equal(summary.action,'candidate-family-set-resolved');
assert.deepEqual(summary.compatibleFamiliesAt1Pct,['singleBernoulliBounded']);
assert.ok(summary.candidateChiSquare.singleBernoulliBounded<9.21034);
assert.ok(summary.candidateChiSquare.widerIndependentBounded>9.21034);
assert.ok(summary.candidateChiSquare.deterministicCeilingBounded>9.21034);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.decision,'single-Bernoulli-bounded-supported');
assert.deepEqual(assessment.compatibleFamilies,['singleBernoulliBounded']);

console.log('Oracle O12 accepted executable evidence regression passed.');

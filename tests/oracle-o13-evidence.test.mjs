import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o13-defended-only-defense18-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o13-defended-only-defense18-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o13-defended-only-defense18-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.multiplicityCounts,{zero:0,one:36,two:44,three:0,fourPlus:0});
assert.equal(summary.action,'single-Bernoulli-bounded-transports');
assert.ok(summary.candidate.pearsonChiSquare<summary.candidate.criticalValue1Pct);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.action,'single-Bernoulli-bounded-transports');
assert.equal(assessment.decision,'supported');

console.log('Oracle O13 accepted executable evidence regression passed.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o15-normal-undefended-hit-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o15-normal-undefended-hit-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o15-normal-undefended-hit-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.hitCounts,{zero:102,one:55,two:3,threePlus:0});
assert.equal(summary.action,'undefended-hit-40pct-supported');
assert.ok(summary.reference.pearsonChiSquare<summary.reference.criticalValue1Pct);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.action,'undefended-hit-40pct-supported');
assert.equal(assessment.decision,'supported');

console.log('Oracle O15 accepted executable evidence regression passed.');

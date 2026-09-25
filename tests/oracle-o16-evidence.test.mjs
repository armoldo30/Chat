import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o16-normal-org-die-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o16-normal-org-die-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o16-normal-org-die-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.dieCounts,{zero:0,one:19,two:19,three:23,four:19,outOfRange:0});
assert.equal(summary.action,'org-die-uniform-1-through-4-supported');
assert.ok(summary.reference.pearsonChiSquare<summary.reference.criticalValue1Pct);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.action,'org-die-uniform-1-through-4-supported');
assert.equal(assessment.decision,'supported');

console.log('Oracle O16 accepted executable evidence regression passed.');

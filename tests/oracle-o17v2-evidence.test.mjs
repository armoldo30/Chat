import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o17v2-all-hit-strength-scale-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o17v2-all-hit-strength-scale-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o17v2-all-hit-strength-scale-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.multiplicityCounts,{one:13,two:36,three:11,outOfSupport:0});
assert.equal(summary.action,'point-nine-strength-scale-supported');
assert.ok(summary.normalizedStrengthUnitPp.mean>=summary.predeclaredCandidateBandsPp.pointNine.min);
assert.ok(summary.normalizedStrengthUnitPp.mean<=summary.predeclaredCandidateBandsPp.pointNine.max);
assert.ok(summary.normalizedStrengthUnitPp.mean<summary.predeclaredCandidateBandsPp.naiveHpOnly.min);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.decision,'point-nine-strength-scale-supported');

console.log('Oracle O17v2 accepted executable evidence regression passed.');

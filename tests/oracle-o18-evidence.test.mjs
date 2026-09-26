import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o18-normal-strength-die-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o18-normal-strength-die-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o18-normal-strength-die-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.dieCounts,{zero:0,one:8,two:12,outOfSupport:0});
assert.equal(summary.action,'strength-die-uniform-1-through-2-supported');
assert.ok(summary.dieCounts.two>=summary.dieTwoExactAcceptance.min);
assert.ok(summary.dieCounts.two<=summary.dieTwoExactAcceptance.max);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.decision,'supported');

console.log('Oracle O18 accepted executable evidence regression passed.');

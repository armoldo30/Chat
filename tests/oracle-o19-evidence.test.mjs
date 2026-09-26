import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o19-combined-normal-damage-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o19-combined-normal-damage-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o19-combined-normal-damage-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.intervalCounts,{miss:143,hit:17,mixedChannel:0,supportViolation:0});
assert.equal(summary.action,'combined-normal-damage-coherent');
assert.ok(summary.intervalCounts.hit>=summary.hitAcceptance.min);
assert.ok(summary.intervalCounts.hit<=summary.hitAcceptance.max);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.decision,'supported');

console.log('Oracle O19 accepted executable evidence regression passed.');

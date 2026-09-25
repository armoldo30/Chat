import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o14-normal-defended-hit-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o14-normal-defended-hit-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o14-normal-defended-hit-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.hitCounts,{miss:71,oneHit:9,twoPlus:0});
assert.equal(summary.action,'defended-hit-10pct-supported');
assert.ok(summary.hitCounts.oneHit>=summary.reference.exactCentral99Acceptance.minHitsInclusive);
assert.ok(summary.hitCounts.oneHit<=summary.reference.exactCentral99Acceptance.maxHitsInclusive);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.action,'defended-hit-10pct-supported');
assert.equal(assessment.decision,'supported');

console.log('Oracle O14 accepted executable evidence regression passed.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o11-defended-only-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o11-defended-only-001-assessment.json',import.meta.url),'utf8'));

assert.equal(summary.scenario,'o11-defended-only-partition-v1');
assert.equal(summary.evidenceStatus,'oracle-validated');
assert.deepEqual(summary.multiplicityCounts,{zero:0,one:80,two:0,three:0,fourPlus:0});
assert.equal(summary.defendedMoments.mean,1);
assert.equal(summary.defendedMoments.variance,0);
assert.equal(summary.action,'partition-mean-compatible');
assert.ok(summary.zStatistic<summary.criticalValue1Pct);

assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.action,'partition-mean-compatible');
assert.equal(assessment.decision,'compatible');

console.log('Oracle O11 accepted executable evidence regression passed.');

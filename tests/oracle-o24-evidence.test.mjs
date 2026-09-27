import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o24-combined-armored-damage-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o24-combined-armored-damage-001-assessment.json',import.meta.url),'utf8'));
const cert=readFileSync(new URL('../src/builtin1193/oracle-combat-certification-1193.js',import.meta.url),'utf8');

assert.equal(summary.scenario,'o24-combined-armored-damage-v1');
assert.deepEqual(summary.intervalCounts,{miss:138,hit:21,mixedChannel:1,supportViolation:0});
assert.equal(summary.mixedInterval.fromHour,43);
assert.equal(summary.mixedInterval.toHour,44);
assert.equal(assessment.action,'combined-armored-damage-mismatch');
assert.equal(assessment.evidenceStatus,'oracle-divergent');
assert.equal(assessment.hitCountInsideAcceptance,true);
assert.equal(assessment.likelyDiagnosticTarget,'measurement-resolution');
assert.match(cert,/combinedArmoredDamageEvidence:Object\.freeze/);
assert.match(cert,/action:'combined-armored-damage-mismatch'/);
console.log('Oracle O24 evidence regression passed.');

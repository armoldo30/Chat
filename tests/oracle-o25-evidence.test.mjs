import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o25-combined-armored-hires-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o25-combined-armored-hires-001-assessment.json',import.meta.url),'utf8'));
const cert=readFileSync(new URL('../src/builtin1193/oracle-combat-certification-1193.js',import.meta.url),'utf8');

assert.equal(summary.scenario,'o25-combined-armored-hires-v1');
assert.deepEqual(summary.intervalCounts,{miss:138,hit:22,mixedChannel:0,supportViolation:0});
assert.deepEqual(summary.orgDice,{one:3,two:6,three:3,four:5,five:5,six:0});
assert.deepEqual(summary.strengthDice,{one:11,two:11});
assert.equal(assessment.action,'combined-armored-hires-coherent');
assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.hitCountInsideAcceptance,true);
assert.equal(assessment.resolvesO24,'bisection14 observation-resolution artifact');
assert.match(cert,/combinedArmoredHighResolutionEvidence:Object\.freeze/);
assert.match(cert,/action:'combined-armored-hires-coherent'/);
console.log('Oracle O25 evidence regression passed.');

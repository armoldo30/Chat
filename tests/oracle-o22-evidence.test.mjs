import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const summary=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o22-piercing-damage-tiers-001-summary.json',import.meta.url),'utf8'));
const assessment=JSON.parse(readFileSync(new URL('../oracle-lab/captures/o22-piercing-damage-tiers-001-assessment.json',import.meta.url),'utf8'));
const cert=readFileSync(new URL('../src/builtin1193/oracle-combat-certification-1193.js',import.meta.url),'utf8');

assert.equal(summary.scenario,'o22-piercing-damage-tier-v1');
assert.equal(Object.keys(summary.runs).length,5);
for(const mode of ['p20','p15','p14','p10','p9']){
  assert.equal(summary.runs[mode].strictIntervals,20);
  assert.equal(summary.runs[mode].startupUnchanged,true);
  assert.equal(summary.runs[mode].strengthInvariant,true);
  assert.equal(summary.runs[mode].cleanup,true);
}
assert.equal(assessment.action,'piercing-damage-tiers-supported');
assert.equal(assessment.evidenceStatus,'oracle-validated');
assert.equal(assessment.frozenAbsoluteRatioTolerance,0.04);
for(const mode of ['p20','p15','p14','p10','p9'])assert.ok(assessment.absoluteErrors[mode]<=0.04);
assert.match(cert,/piercingDamageTierEvidence:Object\.freeze/);
assert.match(cert,/action:'piercing-damage-tiers-supported'/);
console.log('Oracle O22 evidence regression passed.');

import assert from 'node:assert/strict';
import { supportSourceEffects, supportEffectSummary } from '../src/support-effect-transparency.js';

const sample={
  id:'audit_sample',
  name:'Audit Sample',
  recon:2,
  entrenchment:1,
  initiative:0.05,
  reliabilityFactor:0.1,
  equipmentCaptureFactor:0.05,
  supplyConsumptionFactor:-0.1,
  fuelConsumptionFactor:-0.05,
  casualtyTrickleback:0.2,
  experienceLossFactor:-0.15,
  suppression:4,
  suppressionFactor:0.3,
  maximumSpeed:0.6,
  battalionMult:[{category:'category_artillery',soft_attack:0.1}],
  deployedLeaderModifiers:{army_speed_factor:0.05},
  enableAbility:['extra_medics']
};

const effects=supportSourceEffects(sample);
for(const field of ['recon','entrenchment','initiative','reliabilityFactor','equipmentCaptureFactor','supplyConsumptionFactor','fuelConsumptionFactor','casualtyTrickleback','experienceLossFactor','suppression','suppressionFactor','maximumSpeed','battalionMult','deployedLeaderModifiers','enableAbility']){
  assert.ok(effects.some(x=>x.field===field),`source-effect transparency should expose ${field}`);
}
assert.equal(effects.find(x=>x.field==='initiative').state,'aggregated-not-used-downstream');
assert.equal(effects.find(x=>x.field==='supplyConsumptionFactor').state,'source-retained-not-executed');
assert.equal(effects.find(x=>x.field==='enableAbility').runtimeEvidence,'unvalidated');
assert.equal(effects.find(x=>x.field==='supplyConsumptionFactor').display,'-10%');
assert.match(effects.find(x=>x.field==='battalionMult').label,/Artillery/);
assert.match(effects.find(x=>x.field==='battalionMult').display,/Soft Attack \+10%/);
assert.equal(effects.find(x=>x.field==='enableAbility').display,'Extra Medics');

const summary=supportEffectSummary([sample,{id:'plain',name:'Plain'}]);
assert.equal(summary.length,1,'companies without retained specialist effects should not create empty summary rows');
assert.equal(summary[0].name,'Audit Sample');

console.log('Support-effect transparency regression checks passed.');

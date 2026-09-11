import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pack from '../src/builtin1192.js';
import certification from '../src/builtin1192/terrain-tactics-modifiers-certification-1192.js';

const sortObject=value=>Object.fromEntries(Object.entries(value||{}).sort(([a],[b])=>a.localeCompare(b)));
const canonical=value=>{
  if(Array.isArray(value))return value.map(canonical);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)]));
};
const sha=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const topLevelFieldCounts=records=>{
  const counts={};
  for(const record of records){
    const raw=record?.raw&&typeof record.raw==='object'&&!Array.isArray(record.raw)?record.raw:{};
    for(const key of Object.keys(raw))counts[key]=(counts[key]||0)+1;
  }
  return sortObject(counts);
};

const terrain=pack.terrain||{};
const tactics=Object.values(pack.combatTactics||{});
const modifiers=Object.values(pack.modifiers||{});
const terrainCatalog=Object.fromEntries(Object.entries(terrain).sort(([a],[b])=>a.localeCompare(b)));
const tacticPayload=Object.fromEntries(tactics.map(record=>[record.id,record.raw]).sort(([a],[b])=>a.localeCompare(b)));
const modifierPayload=Object.fromEntries(modifiers.map(record=>[record.id,record.raw]).sort(([a],[b])=>a.localeCompare(b)));
const summary={
  terrainCount:Object.keys(terrain).length,terrainSha256:sha(terrainCatalog),
  tacticCount:tactics.length,tacticsWithRaw:tactics.filter(record=>record?.raw&&Object.keys(record.raw).length).length,tacticRawSha256:sha(tacticPayload),
  modifierCount:modifiers.length,modifiersWithRaw:modifiers.filter(record=>record?.raw&&Object.keys(record.raw).length).length,modifierRawSha256:sha(modifierPayload)
};

assert.equal(summary.terrainCount,certification.terrain.recordCount);
assert.deepEqual(terrainCatalog,certification.terrain.records);
assert.equal(summary.terrainSha256,certification.terrain.consumedFieldSha256);
assert.equal(pack.meta?.terrainFiles,certification.terrain.sourceFiles);

assert.equal(summary.tacticCount,certification.tactics.recordCount);
assert.equal(summary.tacticsWithRaw,certification.tactics.rawRecordCount);
assert.deepEqual(tactics.map(record=>record.id).sort(),[...certification.tactics.ids].sort());
assert.deepEqual(topLevelFieldCounts(tactics),sortObject(certification.tactics.topLevelFieldCounts));
assert.equal(summary.tacticRawSha256,certification.tactics.rawSha256);
for(const tactic of tactics){
  assert.equal(tactic.isAttacker,tactic.raw.is_attacker,`${tactic.id} is_attacker normalization drift`);
  assert.ok(Number.isFinite(tactic.baseFactor),`${tactic.id} base.factor should be normalized`);
  assert.equal(tactic.base,tactic.baseFactor,`${tactic.id} compatibility base should equal baseFactor`);
  assert.ok(Array.isArray(tactic.counteredBy),`${tactic.id} countered_by should normalize to a list`);
}

assert.equal(summary.modifierCount,certification.modifierDefinitions.recordCount);
assert.equal(summary.modifiersWithRaw,certification.modifierDefinitions.rawRecordCount);
assert.equal(summary.modifierRawSha256,certification.modifierDefinitions.rawSha256);
assert.deepEqual(modifierPayload,certification.modifierDefinitions.records);
for(const modifier of modifiers){
  assert.equal(modifier.colorType,modifier.raw.color_type);
  assert.equal(modifier.valueType,modifier.raw.value_type);
  assert.equal(modifier.precision,modifier.raw.precision);
  assert.deepEqual(modifier.categories,[modifier.raw.category]);
}

assert.equal(pack.meta?.terrainTacticsModifiersAudit,'bounded-source-certified');
assert.equal(pack.meta?.terrainConsumedFieldSha256,certification.terrain.consumedFieldSha256);
assert.equal(pack.meta?.tacticRawSha256,certification.tactics.rawSha256);
assert.equal(pack.meta?.modifierDefinitionRawSha256,certification.modifierDefinitions.rawSha256);
assert.equal(pack.meta?.tacticRuntimeClassification,'deferred-combat-formula');
assert.equal(pack.meta?.modifierDefinitionRuntimeClassification,'not-applicable-to-current-land-combat');
assert.equal(pack.meta?.subUnitTerrainRuntimeClassification,'source-preserved-formula-deferred');

console.log('TERRAIN_TACTICS_MODIFIER_AUDIT_COVERAGE',JSON.stringify(summary));
console.log('Terrain / tactics / modifiers bounded source certification passed.');

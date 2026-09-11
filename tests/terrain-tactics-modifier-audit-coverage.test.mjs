import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pack from '../src/builtin1192.js';

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
  terrainCount:Object.keys(terrain).length,
  terrainCatalog,
  terrainSha256:sha(terrainCatalog),
  tacticCount:tactics.length,
  tacticsWithRaw:tactics.filter(record=>record?.raw&&Object.keys(record.raw).length).length,
  tacticIds:tactics.map(record=>record.id).sort(),
  tacticFields:topLevelFieldCounts(tactics),
  tacticRawSha256:sha(tacticPayload),
  tacticRecordSha256:Object.fromEntries(Object.entries(tacticPayload).map(([id,raw])=>[id,sha(raw)])),
  modifierCount:modifiers.length,
  modifiersWithRaw:modifiers.filter(record=>record?.raw&&Object.keys(record.raw).length).length,
  modifierIds:modifiers.map(record=>record.id).sort(),
  modifierFields:topLevelFieldCounts(modifiers),
  modifierRawSha256:sha(modifierPayload),
  modifierPayload,
  meta:Object.fromEntries(Object.entries(pack.meta||{}).filter(([key])=>/terrain|tactic|modifier/i.test(key)).sort(([a],[b])=>a.localeCompare(b)))
};

assert.ok(summary.terrainCount>=8,'bundled pack should contain the major terrain records');
assert.ok(summary.tacticCount>=50,'bundled pack should contain the combat tactic corpus');
assert.ok(summary.modifierCount>0,'bundled pack should contain modifier definitions');
console.log('TERRAIN_TACTICS_MODIFIER_AUDIT_CENSUS',JSON.stringify(summary));
console.log('Terrain / tactics / modifiers initial census passed.');

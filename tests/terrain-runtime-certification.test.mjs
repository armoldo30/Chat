import assert from 'node:assert/strict';
import pack from '../src/builtin1192.js';
import { battalions as fallbackBattalions, supports as fallbackSupports, equipment as fallbackEquipment, terrain as fallbackTerrain } from '../src/data.js';
import { hydrateGameData } from '../src/gameData.js';
import { battleContext } from '../src/engine.js';
import certification from '../src/builtin1192/terrain-tactics-modifiers-certification-1192.js';

const battalions=structuredClone(fallbackBattalions),supports=structuredClone(fallbackSupports),equipment=structuredClone(fallbackEquipment),terrain=structuredClone(fallbackTerrain);
const status=hydrateGameData(pack,{battalions,supports,equipment,terrain},{year:1940});
assert.equal(status.terrain,certification.terrain.recordCount);
for(const [id,source] of Object.entries(certification.terrain.records)){
  assert.equal(terrain[id].width,source.width,`${id} combat width hydration drift`);
  assert.equal(terrain[id].reinforceWidth,source.reinforceWidth,`${id} support width hydration drift`);
  assert.equal(terrain[id].attack,source.attack??0,`${id} inherent attack hydration drift`);
  assert.equal(terrain[id].source,'game-pack');
}

// Exact 1.19.2 sub-unit terrain blocks are retained; hand-written legacy terrain guesses remain disabled.
assert.deepEqual(battalions.motorized.terrain,{});
assert.equal(battalions.motorized.terrainSource,'game-pack-source');
assert.equal(battalions.motorized.terrainRuntimeClassification,'combat-formulas-audited');
assert.equal(battalions.motorized.terrainModifiers.forest.attack,-.1);
assert.deepEqual(supports.engineer.terrain,{});
assert.equal(supports.engineer.terrainSource,'game-pack-source');
assert.equal(supports.engineer.terrainRuntimeClassification,'combat-formulas-audited');
assert.ok(Object.keys(supports.engineer.terrainModifiers).length>0);

const side=terrainAttack=>({divisionCount:1,singleWidth:20,width:20,manpower:1000,hp:100,org:100,supply:1,soft:100,hard:0,def:100,breakthrough:100,hardness:0,armor:0,piercing:0,need:{},terrainAttack});
const opts={terrainData:terrain,terrain:'forest',directions:0,asupply:1,dsup:1,air:0,entrench:0,fort:0,river:0,planning:0,night:0,cas:0};
const base=battleContext(side({}),side({}),opts);
assert.equal(base.available,60);
assert.ok(Math.abs(base.aTerrain-.85)<1e-12,'forest inherent attacker modifier should be -15%');
assert.ok(Math.abs(base.dTerrain-1)<1e-12,'terrain inherent attacker penalty must not be applied to defender outgoing attack');
assert.ok(Math.abs(base.aAttack-85)<1e-12);

const withUnitTerrain=battleContext(side({forest:.10}),side({}),opts);
assert.ok(Math.abs(withUnitTerrain.aTerrain-.95)<1e-12,'unit terrain attack and inherent terrain penalty must remain distinct inputs');
assert.ok(Math.abs(withUnitTerrain.aAttack-95)<1e-12);

const mountainMultiDirection=battleContext(side({}),side({}),{...opts,terrain:'mountain',directions:1});
assert.equal(mountainMultiDirection.available,75,'mountain width should be 50 + one 25 support-width direction');
assert.ok(Math.abs(mountainMultiDirection.aTerrain-.50)<1e-12);

console.log('Terrain runtime certification passed: exact widths, inherent penalties, and retained unit-terrain blocks are consumed by the Combat-audited aggregation.');

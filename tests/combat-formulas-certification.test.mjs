import assert from 'node:assert/strict';
import BUILTIN_1192 from '../src/builtin1192.js';
import { COMBAT_CONSTANTS } from '../src/data.js';
import { battleContext, combatStrengthFactor, damageDiceProfile, expectedCombatHits, piercingDamageFactor, simulateOnce } from '../src/engine.js';
import { COMBAT_SOURCE_1192, COMBAT_EXECUTABLE_1192, COMBAT_ANALYTICAL_1192, COMBAT_FORMULAS_CERTIFICATION_1192 } from '../src/builtin1192/combat-formulas-certification-1192.js';
import { SUBUNIT_TERRAIN_1192, SUBUNIT_TERRAIN_SOURCE_1192 } from '../src/builtin1192/subunit-terrain-1192.js';

assert.deepEqual(COMBAT_SOURCE_1192.piercingThresholds,[1,.75,.5,0]);
assert.deepEqual(COMBAT_SOURCE_1192.piercingDamageValues,[1,.8,.65,.5]);
assert.equal(COMBAT_SOURCE_1192.armoredSoftOrgDice,6);
assert.equal(COMBAT_SOURCE_1192.armoredSoftStrengthDice,2);
assert.equal(COMBAT_SOURCE_1192.airSupportBase,.25);
assert.equal(COMBAT_SOURCE_1192.basePlanningMax,.3);
assert.deepEqual(COMBAT_SOURCE_1192.supplyLack,{attackerAttack:-.25,attackerDefend:-.65,defenderAttack:-.35,defenderDefend:-.15});
assert.deepEqual(COMBAT_SOURCE_1192.river,{small:-.3,large:-.6});
assert.equal(COMBAT_SOURCE_1192.airSuperiorityAaMaxMitigation,.75);
assert.equal(COMBAT_SOURCE_1192.airSuperiorityAaSteepness,625);
assert.equal(COMBAT_EXECUTABLE_1192.combatPointScale,.1);
assert.equal(COMBAT_ANALYTICAL_1192.simulationSafetyHours,720);
assert.equal(COMBAT_FORMULAS_CERTIFICATION_1192.sourceExact.totalPlannerConsumedDefines,36);

assert.equal(SUBUNIT_TERRAIN_SOURCE_1192.recordCount,72);
assert.equal(SUBUNIT_TERRAIN_SOURCE_1192.terrainBlockCount,514);
assert.equal(SUBUNIT_TERRAIN_SOURCE_1192.canonicalSha256,'f7b34f3bcf1f1587ac501baeba9bb5a5a31e5423f028befe03127db0335409c2');
assert.equal(SUBUNIT_TERRAIN_1192.artillery_brigade.forest.attack,-.1);
assert.equal(BUILTIN_1192.subUnits.artillery_brigade.terrainModifiers.forest.attack,-.1,'built-in 1.19.2 pack must expose retained exact sub-unit terrain blocks');

assert.ok(Math.abs(expectedCombatHits(100,100)-1)<1e-12,'100 attack vs 100 defense should resolve as ten combat points with 10% defended hit chance');
assert.equal(piercingDamageFactor(49,100),.5);
assert.equal(piercingDamageFactor(50,100),.65);
assert.equal(piercingDamageFactor(75,100),.8);
assert.equal(piercingDamageFactor(100,100),1);
assert.deepEqual(damageDiceProfile(100,50),{softOrgDice:6,hardOrgDice:4,softStrengthDice:2,hardStrengthDice:2});
assert.deepEqual(damageDiceProfile(50,100),{softOrgDice:4,hardOrgDice:4,softStrengthDice:2,hardStrengthDice:2});
assert.equal(combatStrengthFactor(5,100),.05,'combat stats must scale below 10% strength instead of using an invented floor');

const terrainData={plains:{width:70,reinforceWidth:35,attack:0,def:0}};
const side=(overrides={})=>({divisionCount:1,singleWidth:20,width:20,manpower:1000,hp:100,org:100,supply:1,soft:100,hard:0,def:100,breakthrough:100,hardness:0,armor:0,piercing:0,airAttack:0,need:{},terrainAttack:{},terrainDefense:{},...overrides});
const opts={terrain:'plains',terrainData,directions:0,entrench:0,fort:0,river:0,asupply:1,dsupply:1,air:0,cas:0,planning:0,night:0};
const base=battleContext(side(),side(),opts);
assert.ok(Math.abs(base.aHits-1)<1e-12);

const starved=battleContext(side(),side(),{...opts,asupply:0,dsupply:0});
assert.deepEqual(starved.supplyFactors,{attackerAttack:.75,attackerDefend:.35,defenderAttack:.65,defenderDefend:.85});
assert.ok(Math.abs(starved.aAttack/base.aAttack-.75)<1e-12);
assert.ok(Math.abs(starved.aBreak/base.aBreak-.35)<1e-12);
assert.ok(Math.abs(starved.dAttack/base.dAttack-.65)<1e-12);
assert.ok(Math.abs(starved.dDefense/base.dDefense-.85)<1e-12);

const planned=battleContext(side(),side(),{...opts,planning:.3});
assert.ok(Math.abs(planned.aAttack/base.aAttack-1.3)<1e-12);
assert.ok(Math.abs(planned.aBreak/base.aBreak-1.3)<1e-12,'planning must increase breakthrough as well as attack');

const cas=battleContext(side(),side(),{...opts,cas:1});
assert.ok(Math.abs(cas.aAttack/base.aAttack-1.25)<1e-12);
assert.ok(Math.abs(cas.aBreak/base.aBreak-1.25)<1e-12);
const doctrineCas=battleContext(side(),side(),{...opts,cas:1,attackerGroundSupportBonus:.4});
assert.ok(Math.abs(doctrineCas.aAttack/base.aAttack-1.35)<1e-12);

const night=battleContext(side(),side(),{...opts,night:1});
assert.ok(Math.abs(night.aAttack/base.aAttack-.5)<1e-12);
assert.ok(Math.abs(night.aBreak/base.aBreak-1)<1e-12,'night attack penalty must not reduce breakthrough');
const nightBonus=battleContext(side(),side(),{...opts,night:1,attackerNightAttackBonus:.25});
assert.ok(Math.abs(nightBonus.aAttack/base.aAttack-.75)<1e-12,'+25% land night attack should offset 25 percentage points of the 50% night penalty');

const terrainCase={rough:{width:70,reinforceWidth:35,attack:-.5,def:0}};
const attacker=side({terrainAttack:{rough:.2}}),defender=side({terrainDefense:{rough:.1}});
const rough=battleContext(attacker,defender,{...opts,terrain:'rough',terrainData:terrainCase});
assert.ok(Math.abs(rough.aTerrain-.7)<1e-12);
assert.ok(Math.abs(rough.dTerrain-1.1)<1e-12);
assert.ok(Math.abs(rough.aAttack/base.aAttack-.7)<1e-12);
assert.ok(Math.abs(rough.aBreak/base.aBreak-.7)<1e-12);
assert.ok(Math.abs(rough.dAttack/base.dAttack-1.1)<1e-12);
assert.ok(Math.abs(rough.dDefense/base.dDefense-1.1)<1e-12);

const noAA=battleContext(side(),side({airAttack:0}),{...opts,air:1});
const highAA=battleContext(side(),side({airAttack:100}),{...opts,air:1});
assert.ok(highAA.dAirFactor>noAA.dAirFactor,'divisional AA must mitigate enemy-air defense/breakthrough penalty');
assert.ok(highAA.dDefense>noAA.dDefense);

const zeroFire=side({soft:0,hard:0,def:0,breakthrough:0});
const horizon=simulateOnce(zeroFire,zeroFire,{...opts,maxHours:200,seed:11});
assert.equal(horizon.hours,200,'planner safety horizon must be explicit and may extend beyond the obsolete 168-hour cutoff');
assert.equal(horizon.draw,true);

console.log('COMBAT_FORMULAS_AUDIT',JSON.stringify({consumedDefines:36,terrainRecords:72,terrainBlocks:514,corrections:COMBAT_FORMULAS_CERTIFICATION_1192.corrections.length,safetyHours:COMBAT_ANALYTICAL_1192.simulationSafetyHours}));
console.log('Combat formulas bounded certification passed.');

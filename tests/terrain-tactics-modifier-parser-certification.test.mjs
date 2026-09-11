import assert from 'node:assert/strict';
import { parseClausewitz } from '../src/parser.js';
import { extractCombatTactics, extractModifierDefinitions, extractTerrainDetails, extractSubUnitTerrainDetails, buildExtendedDataPack } from '../src/gameDataParser.js';

const terrainText=`categories = {
 forest = {
   movement_cost = 1.5
   combat_width = 60
   combat_support_width = 30
   units = { attack = -0.15 defence = 0.05 movement = -0.10 }
   attrition = 0.10
   enemy_army_bonus_air_superiority_factor = -0.10
   supply_flow_penalty_factor = 0.08
   truck_attrition_factor = 0.02
   sickness_chance = 0.03
   buildings_max_level = { bunker = 4 }
 }
 ocean = { naval_terrain = yes is_water = yes }
}`;
const terrain=extractTerrainDetails(parseClausewitz(terrainText),'common/terrain/00_terrain.txt');
assert.deepEqual(Object.keys(terrain),['forest']);
assert.equal(terrain.forest.width,60);
assert.equal(terrain.forest.reinforceWidth,30);
assert.equal(terrain.forest.attack,-.15);
assert.equal(terrain.forest.defense,.05,'British-spelled source defence must normalize');
assert.equal(terrain.forest.unitMovement,-.10);
assert.equal(terrain.forest.movementCost,1.5);
assert.equal(terrain.forest.attrition,.10);
assert.equal(terrain.forest.enemyAirSuperiorityFactor,-.10);
assert.equal(terrain.forest.supplyFlowPenaltyFactor,.08);
assert.equal(terrain.forest.truckAttritionFactor,.02);
assert.equal(terrain.forest.sicknessChance,.03);
assert.equal(terrain.forest.raw.buildings_max_level.bunker,4,'non-runtime terrain source fields must remain preserved');

const unitText=`sub_units = {
 engineer = {
   type = { infantry support }
   group = support
   max_strength = 2
   max_organisation = 20
   manpower = 300
   forest = { attack = 0.10 defence = 0.05 movement = 0.10 }
   river = { attack = 0.20 movement = 0.15 }
 }
}`;
const unitTerrain=extractSubUnitTerrainDetails(parseClausewitz(unitText),'common/units/support.txt');
assert.deepEqual(unitTerrain.engineer.terrainModifiers.forest,{attack:.10,defense:.05,movement:.10});
assert.deepEqual(unitTerrain.engineer.terrainModifiers.river,{attack:.20,movement:.15});

const tacticText=`tactic_test = {
 picture = test
 is_attacker = yes
 phase = close_combat
 display_phase = close
 base = { factor = 4 modifier = { factor = 2 has_tech = test_tech } }
 trigger = { is_attacker = yes }
 countered_by = { tactic_counter tactic_other }
 attacker = 1.20
 defender = 0.80
 attacker_movement_speed = 0.90
 attacker_org_damage_modifier = 0.10
 defender_org_damage_modifier = -0.10
 combat_width = -0.25
 only_show_for = { original_tag = GER }
}`;
const tactic=extractCombatTactics(parseClausewitz(tacticText),'common/combat_tactics/00_tactics.txt').tactic_test;
assert.equal(tactic.isAttacker,true);
assert.equal(tactic.baseFactor,4);
assert.equal(tactic.base,4);
assert.equal(tactic.baseBlock.modifier.factor,2);
assert.deepEqual(tactic.counteredBy,['tactic_counter','tactic_other']);
assert.equal(tactic.attacker,1.2);
assert.equal(tactic.defender,.8);
assert.equal(tactic.attackerMovementSpeed,.9);
assert.equal(tactic.attackerOrgDamageModifier,.1);
assert.equal(tactic.defenderOrgDamageModifier,-.1);
assert.equal(tactic.combatWidth,-.25);
assert.equal(tactic.phase,'close_combat');
assert.equal(tactic.displayPhase,'close');
assert.equal(tactic.onlyShowFor.original_tag,'GER');
assert.ok(tactic.prerequisites.includes('test_tech'));
assert.equal(tactic.raw.base.modifier.has_tech,'test_tech');

const modifierText=`operation_test = {
 color_type = good
 value_type = percentage
 precision = 1
 postfix = pp
 category = intelligence_agency
 category = army
}`;
const modifier=extractModifierDefinitions(parseClausewitz(modifierText),'common/modifier_definitions/00_modifiers.txt').operation_test;
assert.equal(modifier.colorType,'good');
assert.equal(modifier.valueType,'percentage');
assert.equal(modifier.precision,1);
assert.equal(modifier.postfix,'pp');
assert.equal(modifier.category,'army');
assert.deepEqual(modifier.categories,['intelligence_agency','army']);
assert.deepEqual(modifier.raw.category,['intelligence_agency','army']);

const fakeFile=(name,text,path)=>({name,webkitRelativePath:path,text:async()=>text});
const pack=await buildExtendedDataPack([
  fakeFile('support.txt',unitText,'common/units/support.txt'),
  fakeFile('00_terrain.txt',terrainText,'common/terrain/00_terrain.txt'),
  fakeFile('00_tactics.txt',tacticText,'common/combat_tactics/00_tactics.txt'),
  fakeFile('00_modifiers.txt',modifierText,'common/modifier_definitions/00_modifiers.txt')
]);
assert.equal(pack.terrain.forest.raw.buildings_max_level.bunker,4);
assert.equal(pack.subUnits.engineer.terrainModifiers.forest.attack,.10);
assert.equal(pack.combatTactics.tactic_test.baseFactor,4);
assert.deepEqual(pack.modifiers.operation_test.categories,['intelligence_agency','army']);
assert.equal(pack.meta.terrainDetailParser,true);
assert.equal(pack.meta.subUnitTerrainDetailParser,true);

console.log('Terrain / tactics / modifiers parser certification passed.');

import assert from 'node:assert/strict';
import { buildExtendedDataPack } from '../src/gameDataParser.js';
import { hydrateGameData, classifySubUnit, resolveSubUnitFromPack, importedRegimentalSupportIds } from '../src/gameData.js';

const fakeFile=(name,text,path)=>({name,webkitRelativePath:path,text:async()=>text});
const units=`sub_units = {
 infantry = { group = infantry type = { infantry } combat_width = 2 max_strength = 25 max_organisation = 60 manpower = 1000 supply_consumption = 0.07 need = { infantry_equipment = 100 } }
 artillery = { group = support type = { infantry support } max_strength = 0.2 max_organisation = 0 manpower = 300 soft_attack = -0.5 need = { artillery_equipment = 12 } }
 infantry_gun_regimental_support = { group = support type = { infantry support regimental } max_strength = 0.6 max_organisation = 30 manpower = 180 soft_attack = -0.75 need = { artillery_equipment = 6 } }
}`;
const equipment=`equipments = {
 infantry_equipment = { year = 1918 is_archetype = yes build_cost_ic = 0.4 defense = 18 soft_attack = 4 resources = { steel = 2 } }
 infantry_equipment_1 = { year = 1936 archetype = infantry_equipment parent = infantry_equipment build_cost_ic = 0.5 defense = 22 soft_attack = 8 resources = { steel = 2 } }
 artillery_equipment = { year = 1934 is_archetype = yes build_cost_ic = 3.5 defense = 10 soft_attack = 40 resources = { steel = 2 tungsten = 1 } }
}`;
const tech=`technologies = { infantry_weapons = { start_year = 1936 research_cost = 1 category = infantry allow_branch = { basic_weapons = 1 } } }`;
const tactics=`combat_tactic = { elastic_defense = { days = 3 base = 4 trigger = { has_tech = infantry_weapons } } }`;
const modifiers=`army_test_modifier = { color_type = good unit_modifier = { defense = 0.1 } }`;
const projects=`special_projects = { advanced_support_vehicle = { prototype_cost = 12 available = { has_tech = infantry_weapons } } }`;
const upgrades=`equipment_upgrades = { tank_engine_upgrade = { max_level = 20 cost = 1 } }`;
const doctrines=`technologies = { mobile_warfare = { research_cost = 1 category = land_doctrine } }`;

const pack=await buildExtendedDataPack([
  fakeFile('infantry.txt',units,'common/units/infantry.txt'),
  fakeFile('infantry_equipment.txt',equipment,'common/units/equipment/infantry_equipment.txt'),
  fakeFile('infantry.txt',tech,'common/technologies/infantry.txt'),
  fakeFile('00_tactics.txt',tactics,'common/combat_tactics/00_tactics.txt'),
  fakeFile('00_modifiers.txt',modifiers,'common/modifier_definitions/00_modifiers.txt'),
  fakeFile('00_projects.txt',projects,'common/special_projects/00_projects.txt'),
  fakeFile('00_upgrades.txt',upgrades,'common/units/equipment/upgrades/00_upgrades.txt'),
  fakeFile('00_doctrines.txt',doctrines,'common/doctrines/00_doctrines.txt')
]);

assert.equal(pack.meta.technologyCount,1);
assert.equal(pack.meta.tacticCount,1);
assert.equal(pack.meta.modifierCount,1);
assert.equal(pack.meta.specialProjectCount,1);
assert.equal(pack.meta.equipmentUpgradeCount,1);
assert.equal(pack.meta.doctrineCount,1);
assert.ok(pack.technologies.infantry_weapons);
assert.ok(pack.combatTactics.elastic_defense.prerequisites.includes('infantry_weapons'));
assert.ok(pack.specialProjects.advanced_support_vehicle.prerequisites.includes('infantry_weapons'));

assert.equal(classifySubUnit(pack.subUnits.infantry).support,false);
assert.equal(classifySubUnit(pack.subUnits.artillery).support,true);
assert.equal(classifySubUnit(pack.subUnits.infantry_gun_regimental_support).regimental,true);

const infantry=resolveSubUnitFromPack(pack.subUnits.infantry,pack,{year:1940,profile:{infantryEquipment:1}});
assert.equal(infantry.soft,8);
assert.equal(infantry.def,22);
const supportArt=resolveSubUnitFromPack(pack.subUnits.artillery,pack,{year:1940});
assert.equal(supportArt.soft,20,'support company stat adjusters should apply to equipment-sourced attack');

const battalions={},supports={},equipmentTable={},terrain={};
const status=hydrateGameData(pack,{battalions,supports,equipment:equipmentTable,terrain},{year:1940});
assert.ok(status.battalions>=1);
assert.ok(status.supports>=2);
assert.equal(equipmentTable.infantry_equipment.cost,.5);
assert.equal(equipmentTable.artillery.cost,3.5);
assert.ok(supports.support_artillery);
assert.ok(importedRegimentalSupportIds(supports).includes('infantry_gun_regimental_support'));

console.log('All extended game-data invariants passed.');

import assert from 'node:assert/strict';
import { parseClausewitz, parseDefinesLua, extractSubUnits, extractEquipment, extractEquipmentModules, extractTerrain, resolveEquipment, equipmentFamilies, equipmentSnapshot, buildDataPack, safeStructuralOverrides, defineOverrides } from '../src/parser.js';

const unitText=`
# representative unit fixture
sub_units = {
 infantry = {
   type = { infantry }
   group = infantry
   combat_width = 2
   max_strength = 25
   max_organisation = 60
   manpower = 1000
   supply_consumption = 0.07
   need = { infantry_equipment = 100 }
 }
 artillery = {
   type = { infantry support }
   group = support
   max_strength = 0.2
   max_organisation = 0
   manpower = 300
   need = { artillery_equipment = 12 }
 }
}`;
const parsed=parseClausewitz(unitText),units=extractSubUnits(parsed);
assert.equal(units.infantry.width,2);
assert.equal(units.infantry.org,60);
assert.deepEqual(units.infantry.types,['infantry']);
assert.equal(units.artillery.need.artillery_equipment,12);

const equipmentText=`equipments = { infantry_equipment_1 = { year = 1936 build_cost_ic = 0.5 defense = 22 soft_attack = 6 resources = { steel = 2 } } }`;
const eq=extractEquipment(parseClausewitz(equipmentText));
assert.equal(eq.infantry_equipment_1.cost,.5);
assert.equal(eq.infantry_equipment_1.resources.steel,2);

const inheritanceText=`equipments = {
 infantry_equipment = { year = 1918 build_cost_ic = 0.4 reliability = 0.9 resources = { steel = 2 } }
 infantry_equipment_1 = { year = 1936 archetype = infantry_equipment parent = infantry_equipment build_cost_ic = 0.5 defense = 22 }
 infantry_equipment_2 = { year = 1939 archetype = infantry_equipment parent = infantry_equipment_1 build_cost_ic = 0.6 soft_attack = 9 resources = { steel = 3 } }
}`;
const inheritedPack={equipment:extractEquipment(parseClausewitz(inheritanceText))};
const resolvedEq=resolveEquipment(inheritedPack);
assert.equal(resolvedEq.infantry_equipment_2.reliability,.9);
assert.equal(resolvedEq.infantry_equipment_2.def,22);
assert.equal(resolvedEq.infantry_equipment_2.resources.steel,3);
const families=equipmentFamilies(inheritedPack);
assert.equal(families.infantry_equipment.length,3);
assert.equal(equipmentSnapshot(inheritedPack,1938).find(x=>x.family==='infantry_equipment').item.id,'infantry_equipment_1');
assert.equal(equipmentSnapshot(inheritedPack,1940).find(x=>x.family==='infantry_equipment').item.id,'infantry_equipment_2');

const missingParentPack={equipment:{child:{id:'child',parent:'does_not_exist',cost:1}}};
const missingResolved=resolveEquipment(missingParentPack);
assert.match(missingResolved.child.inheritanceWarning,/missing-parent:does_not_exist/,'missing equipment parents should be surfaced rather than silently ignored');
const cyclePack={equipment:{a:{id:'a',parent:'b',cost:1},b:{id:'b',parent:'a',reliability:.8}}};
const cycleResolved=resolveEquipment(cyclePack);
assert.ok(cycleResolved.a.inheritanceWarning||cycleResolved.b.inheritanceWarning,'equipment inheritance cycles should be detected');



const moduleText=`equipment_modules = {
 tank_radio = { category = tank_special_module add_stats = { breakthrough = 4 build_cost_ic = 1 } build_cost_resources = { steel = 1 } }
 aircraft_cannon = { category = plane_weapon_module add_stats = { air_attack = 12 build_cost_ic = 3 } }
}`;
const modules=extractEquipmentModules(parseClausewitz(moduleText));
assert.equal(modules.tank_radio.category,'tank_special_module');
assert.equal(modules.tank_radio.addStats.breakthrough,4);
assert.equal(modules.tank_radio.resources.steel,1);

const terrainText=`categories = {
 forest = {
   combat_width = 60
   combat_support_width = 30
   units = { attack = -0.15 defense = 0.05 }
 }
 mountain = { combat_width = 50 combat_support_width = 25 }
}`;
const parsedTerrain=extractTerrain(parseClausewitz(terrainText));
assert.equal(parsedTerrain.forest.width,60);
assert.equal(parsedTerrain.forest.reinforceWidth,30);
assert.equal(parsedTerrain.forest.attack,-.15);
assert.equal(parsedTerrain.forest.defense,.05);
assert.equal(parsedTerrain.mountain.reinforceWidth,25);

const defines=parseDefinesLua(`NDefines.NMilitary.BASE_CHANCE_TO_AVOID_HIT = 90\nNMilitary.CHANCE_TO_AVOID_HIT_AT_NO_DEF = 60\nNDefines.NProduction.PRODUCTION_RESOURCE_LACK_PENALTY = -0.05`);
assert.equal(defines.NMilitary.BASE_CHANCE_TO_AVOID_HIT,90);
assert.equal(defines.NProduction.PRODUCTION_RESOURCE_LACK_PENALTY,-.05);

const fakeFile=(name,text,path='')=>({name,webkitRelativePath:path,text:async()=>text});
const pack=await buildDataPack([
  fakeFile('infantry.txt',unitText,'common/units/infantry.txt'),
  fakeFile('infantry_equipment.txt',equipmentText,'common/units/equipment/infantry_equipment.txt'),
  fakeFile('00_defines.lua','NDefines.NMilitary.BASE_CHANCE_TO_AVOID_HIT = 90\nNDefines.NProduction.PRODUCTION_RESOURCE_LACK_PENALTY = -0.05','common/defines/00_defines.lua'),
  fakeFile('00_terrain.txt',terrainText,'common/terrain/00_terrain.txt'),
  fakeFile('00_modules.txt',moduleText,'common/units/equipment/modules/00_modules.txt')
]);
assert.equal(pack.meta.sourceFiles,5);
assert.equal(pack.meta.subUnitCount,2);
assert.equal(pack.meta.equipmentCount,1);
assert.equal(pack.meta.moduleCount,2);

const modelBattalions={infantry:{width:3,manpower:1,org:1,hp:1,supply:1,need:{}}};
const modelSupports={support_artillery:{manpower:1,org:1,hp:1,supply:1,need:{}}};
const modelTerrain={plains:{width:70,reinforceWidth:35},forest:{width:84,reinforceWidth:42,attack:-.1,def:.05}};
const applied=safeStructuralOverrides(pack,modelBattalions,modelSupports,modelTerrain);
assert.equal(applied.battalionOverrides,1);
assert.equal(modelBattalions.infantry.width,2);
assert.equal(modelBattalions.infantry.manpower,1000);
assert.equal(modelSupports.support_artillery.manpower,300);
assert.equal(modelTerrain.forest.width,60);
assert.equal(modelTerrain.forest.reinforceWidth,30);
assert.equal(modelTerrain.forest.attack,-.15);
assert.equal(modelTerrain.forest.def,.05);

const combat={defendedHitChance:.2},production={resourceLackPenaltyPerUnit:.1};
const dc=defineOverrides(pack,combat,production);
assert.ok(Math.abs(combat.defendedHitChance-.1)<1e-12);
assert.equal(production.resourceLackPenaltyPerUnit,.05);
assert.ok(dc.combatCount>=1&&dc.productionCount>=1);

console.log('All parser invariants passed.');

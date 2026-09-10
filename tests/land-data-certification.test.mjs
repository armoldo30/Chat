import assert from 'node:assert/strict';
import B from '../src/builtin1192.js';
import { buildDataPack, resolveEquipment } from '../src/parser.js';
import { hydrateGameData, selectEquipment } from '../src/gameData.js';
import { tankCatalogFromPack } from '../src/designerData.js';
import { configureTankDataPack, defaultTankDesign, applyTankDesignToBattalion } from '../src/tank.js';

assert.equal(B.meta.gameVersion,'1.19.2');
assert.equal(Object.keys(B.subUnits).length,121,'division-template/support source scope must remain complete');
assert.equal(Object.values(B.equipment).filter(x=>!x?.duplicateOf).length,218,'218 static planner-scope equipment records are source-backed');
assert.equal(Object.keys(B.duplicateArchetypes||{}).length,21,'all 21 tank duplicate_archetypes definitions must be preserved');
assert.equal(Object.values(B.equipment).filter(x=>x?.duplicateOf).length,87,'tank duplicate_archetypes must materialize 87 engine-generated records');
assert.equal(Object.keys(B.equipment).length,305);
for(const id of ['motorbike_equipment_1','land_cruiser_chassis_1','land_cruiser_equipment_1'])assert.ok(B.equipment[id],`${id} must be bundled`);

const resolved=resolveEquipment(B.equipment);
const medChassis=resolved.medium_tank_chassis_2;
assert.deepEqual(medChassis.types,['armor']);
assert.deepEqual(medChassis.upgrades,['tank_nsb_engine_upgrade','tank_nsb_armor_upgrade']);
assert.ok(Object.keys(medChassis.moduleSlots||{}).length>=9,'module_slots = inherit must retain archetype slots');
assert.deepEqual(resolved.light_tank_chassis_2.moduleSlots.main_armament_slot.allowed_module_categories,['tank_small_main_armament','tank_flamethrower']);
const amph=resolved.medium_tank_amphibious_chassis_2;
assert.equal(amph.year,1940);assert.equal(amph.armor,40);assert.equal(amph.hardness,.7);assert.deepEqual(amph.types,['armor','amphibious']);
const flame=resolved.medium_tank_flame_chassis_2;
assert.equal(flame.year,1940);assert.equal(flame.armor,40);assert.deepEqual(flame.types,['armor','flame']);

const unresolved=[];
for(const unit of Object.values(B.subUnits))for(const needId of Object.keys(unit.need||{}))if(!selectEquipment(B,needId,{year:1950}))unresolved.push([unit.id,needId]);
assert.deepEqual(unresolved,[],'every bundled land sub-unit equipment need must resolve');

const battalions={},supports={},equipment={},terrain={};
hydrateGameData(B,{battalions,supports,equipment,terrain},{year:1940});
for(const id of ['light_flame_tank','medium_flame_tank','heavy_flame_tank']){assert.equal(supports[id].variantDependent,true);assert.ok(supports[id].sourceEquipment[0].includes('_flame_chassis_'));}
for(const id of ['amphibious_light_armor','amphibious_medium_armor','amphibious_heavy_armor']){assert.equal(battalions[id].variantDependent,true);assert.ok(battalions[id].sourceEquipment[0].includes('_amphibious_chassis_'));}
assert.deepEqual(supports.land_cruiser.sourceEquipment,['land_cruiser_equipment_1']);
assert.equal(supports.land_cruiser.soft,75);assert.equal(supports.land_cruiser.hard,62);assert.equal(supports.land_cruiser.armor,180);
assert.equal(selectEquipment(B,'motorbike_equipment',{year:1950}).id,'motorbike_equipment_1');

const cat=tankCatalogFromPack(B);
assert.equal(cat.meta.chassis,16,'designer catalog includes 12 standard plus modern, super-heavy, dedicated amphibious and Land Cruiser chassis');assert.equal(cat.meta.standardChassis,12);assert.equal(cat.meta.extendedChassis,4);
assert.equal(Object.values(cat.chassis).filter(x=>x.class==='light').length,4);
assert.equal(Object.values(cat.chassis).filter(x=>x.class==='medium').length,4);
assert.equal(Object.values(cat.chassis).filter(x=>x.class==='heavy').length,4);
assert.ok(Object.entries(cat.chassis).filter(([,x])=>['light','medium','heavy'].includes(x.class)).every(([id])=>/_tank_chassis_[0-3]$/.test(id)),'standard light/medium/heavy chassis IDs remain the four 0-3 source generations');for(const id of ['modern_tank_chassis_1','super_heavy_tank_chassis_1','amphibious_tank_chassis_1','land_cruiser_chassis_1'])assert.ok(cat.chassis[id],`${id} must be exposed by the Tank Designer catalog`);

configureTankDataPack(B,1940);
const design=defaultTankDesign('medium');
const applied=applyTankDesignToBattalion(battalions.medium_armor,design);
assert.ok(Math.abs(applied.breakthrough-applied.designStats.breakthrough*1.15)<1e-10,'medium armor source +15% breakthrough modifier must survive designer replacement');

const fixture=`
equipments = {
 light_tank_chassis = { year = 1922 is_archetype = yes type = { armor } module_slots = { main_armament_slot = { required = yes allowed_module_categories = { tank_small_main_armament tank_flamethrower } } } armor_value = 10 hardness = 0.8 }
 light_tank_chassis_0 = { year = 1922 archetype = light_tank_chassis module_slots = inherit }
 light_tank_chassis_1 = { year = 1934 archetype = light_tank_chassis parent = light_tank_chassis_0 module_slots = inherit armor_value = 15 }
}
duplicate_archetypes = {
 light_tank_flame_chassis = { archetype = light_tank_chassis type = { armor flame } for_each = { variant_name = { find_and_replace = { "chassis" "equipment" } } } }
 light_tank_amphibious_chassis = { archetype = light_tank_chassis type = { armor amphibious } for_each = { hardness = { set = 0.55 } } }
}`;
const fake={name:'x_tank_chassis.txt',webkitRelativePath:'common/units/equipment/x_tank_chassis.txt',text:async()=>fixture};
const pack=await buildDataPack([fake]);
assert.equal(pack.meta.duplicateArchetypeCount,2);
const rr=resolveEquipment(pack.equipment);
assert.deepEqual(rr.light_tank_flame_chassis_1.types,['armor','flame']);
assert.deepEqual(rr.light_tank_flame_chassis_1.moduleSlots.main_armament_slot.allowed_module_categories,['tank_small_main_armament','tank_flamethrower']);
assert.equal(rr.light_tank_amphibious_chassis_1.hardness,.55);
assert.equal(rr.light_tank_amphibious_chassis_1.parent,'light_tank_amphibious_chassis_0');

console.log('Land data certification invariants passed.');

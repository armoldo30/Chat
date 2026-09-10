import assert from 'node:assert/strict';
import { tankCatalogFromPack, airCatalogFromPack, equipmentToState, applyModuleEffects, chooseCatalogDefault, requirementTokens } from '../src/designerData.js';

const pack={equipment:{
  basic_medium_tank_chassis:{id:'basic_medium_tank_chassis',year:1938,cost:4,reliability:.8,def:5,breakthrough:10,hardness:.9,armor:30,speed:6,fuel:2,resources:{steel:2},moduleSlots:{fixed_turret:{allowed_module_categories:['tank_turret_type']}},raw:{}},
  improved_medium_tank_chassis:{id:'improved_medium_tank_chassis',year:1940,parent:'basic_medium_tank_chassis',cost:5,armor:45,moduleSlots:{fixed_turret:{allowed_module_categories:['tank_turret_type']}},raw:{}},
  small_plane_airframe_1:{id:'small_plane_airframe_1',year:1940,cost:15,reliability:.8,airDefense:5,airAgility:60,airRange:700,speed:400,moduleSlots:{fixed_main_weapon_slot:{required:true,allowed_module_categories:['fighter_weapon']},engine_type_slot:{required:true,allowed_module_categories:['plane_engine_type']},special_type_slot_1:{required:false,allowed_module_categories:['plane_special_module_small','plane_special_module_defense_turret']}},raw:{}}
},modules:{
  tank_medium_cannon:{id:'tank_medium_cannon',category:'tank_main_armament',addStats:{soft_attack:20,hard_attack:15,ap_attack:30,build_cost_ic:4},multiplyStats:{breakthrough:.10},addAverageStats:{},resources:{tungsten:1},raw:{allow:{has_tech:'improved_medium_tank_chassis'}}},
  tank_three_man_turret:{id:'tank_three_man_turret',category:'tank_turret_type',addStats:{breakthrough:8},multiplyStats:{},addAverageStats:{},resources:{},raw:{}},
  tank_diesel_engine:{id:'tank_diesel_engine',category:'tank_engine_type',addStats:{reliability:.2,build_cost_ic:1},multiplyStats:{},addAverageStats:{},resources:{},raw:{}},
  engine_3_1x:{id:'engine_3_1x',category:'plane_engine_type',addStats:{thrust:17,build_cost_ic:6,maximum_speed:50},multiplyStats:{},addAverageStats:{},resources:{},raw:{}},
  heavy_machine_gun_2x:{id:'heavy_machine_gun_2x',category:'fighter_weapon',addStats:{air_attack:10,build_cost_ic:2},multiplyStats:{air_agility:-.05},addAverageStats:{},resources:{},raw:{}},
  armor_plates:{id:'armor_plates',category:'plane_special_module_small',addStats:{air_defence:5,build_cost_ic:2},multiplyStats:{},addAverageStats:{},resources:{},raw:{}},
  drop_tanks:{id:'drop_tanks',category:'plane_special_module_small',addStats:{air_range:250,build_cost_ic:1},multiplyStats:{},addAverageStats:{},resources:{},raw:{}}
}};

const tanks=tankCatalogFromPack(pack);
assert.equal(tanks.meta.chassis,2);
assert.ok(tanks.guns.tank_medium_cannon);
assert.ok(tanks.turrets.tank_three_man_turret);
assert.ok(tanks.engines.tank_diesel_engine);
assert.equal(chooseCatalogDefault(tanks.chassis,x=>x.class==='medium',1940),'improved_medium_tank_chassis');
assert.deepEqual(requirementTokens(pack.modules.tank_medium_cannon.raw),['improved_medium_tank_chassis']);

const base=equipmentToState(pack.equipment.basic_medium_tank_chassis);
const built=applyModuleEffects(base,[pack.modules.tank_medium_cannon,pack.modules.tank_three_man_turret]);
assert.equal(built.softAttack,20);
assert.equal(built.hardAttack,15);
assert.equal(built.piercing,30);
assert.equal(built.buildCost,8);
assert.equal(built.breakthrough,19.8,'additions are applied before accumulated multipliers');
assert.equal(built.resources.tungsten,1);

const air=airCatalogFromPack(pack);
assert.equal(air.meta.airframes,1);
assert.ok(air.engines.engine_3_1x);
assert.ok(air.weapons.heavy_machine_gun_2x);
assert.ok(air.defense.armor_plates);
assert.ok(air.specials.drop_tanks);assert.equal(air.meta.slotCategories,4);assert.equal(air.meta.slotModules,4);
console.log('designer data tests passed');

import assert from 'node:assert/strict';
import BUILTIN from '../src/builtin1192.js';
import slotCategories from '../src/builtin1192/module-slot-categories-1192.js';
import { classifySubUnit } from '../src/gameData.js';
import { parseClausewitz, extractEquipment } from '../src/parser.js';

const certifiedSlots=Object.values(slotCategories).reduce((n,slots)=>n+Object.keys(slots).length,0);
assert.equal(certifiedSlots,234,'the 1.19.2 audit identified 234 bundled multi-category module slots');
for(const [id,slots] of Object.entries(slotCategories))for(const [slot,categories] of Object.entries(slots)){
  assert.deepEqual(BUILTIN.equipment[id]?.moduleSlots?.[slot]?.allowed_module_categories,categories,`${id}.${slot} must preserve every source category`);
}
assert.equal(BUILTIN.meta.moduleSlotListsCertified,true);
assert.deepEqual(BUILTIN.equipment.light_tank_chassis.moduleSlots.main_armament_slot.allowed_module_categories,['tank_small_main_armament','tank_flamethrower']);
assert.deepEqual(BUILTIN.equipment.medium_tank_chassis.moduleSlots.turret_type_slot.allowed_module_categories,['tank_light_turret_type','tank_medium_turret_type']);
assert.deepEqual(BUILTIN.equipment.land_cruiser_chassis.moduleSlots.lc_special_features_slot_1.allowed_module_categories,['lc_radio_module','lc_aerial_deployment','lc_external_features','lc_structural_features']);
assert.deepEqual(BUILTIN.equipment.small_plane_airframe.moduleSlots.fixed_main_weapon_slot.allowed_module_categories,['fighter_weapon','cas_weapon','nav_bomber_weapon','kamikaze_bomber_weapon']);

const imported=extractEquipment(parseClausewitz(`equipments={ test_chassis={ module_slots={ test_slot={ required=yes allowed_module_categories={ one two three four } } } } }`));
assert.deepEqual(imported.test_chassis.moduleSlots.test_slot.allowed_module_categories,['one','two','three','four']);
assert.deepEqual(imported.test_chassis.raw.module_slots.test_slot.allowed_module_categories,['one','two','three','four']);

assert.equal(classifySubUnit(BUILTIN.subUnits.super_heavy_tank_destroyer_brigade).regimental,false,'divisional super-heavy TD support is not regimental support');
for(const unit of Object.values(BUILTIN.subUnits)){
  if(!Array.isArray(unit.categories)||!unit.categories.length)continue;
  const expected=unit.categories.includes('category_regimental_support_battalions');
  assert.equal(classifySubUnit(unit).regimental,expected,`${unit.id} regimental classification must follow explicit source category`);
}
console.log('Phase 1 land-data audit invariants passed.');

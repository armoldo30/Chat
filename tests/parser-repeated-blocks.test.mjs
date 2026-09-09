import assert from 'node:assert/strict';
import { parseClausewitz, extractEquipmentModules, extractEquipment, extractSubUnits } from '../src/parser.js';

const modules=parseClausewitz(`
equipment_modules = {
  tank_gasoline_engine = { category = tank_engine_type add_stats = { build_cost_ic = 1 } }
}
equipment_modules = {
  lc_engine = { category = lc_engine add_stats = { build_cost_ic = 2 } }
}
`);
const moduleData=extractEquipmentModules(modules);
assert.ok(moduleData.tank_gasoline_engine,'first repeated equipment_modules block survives');
assert.ok(moduleData.lc_engine,'second repeated equipment_modules block survives');

const equipment=parseClausewitz(`
equipments = { first_chassis = { build_cost_ic = 4 } }
equipments = { second_chassis = { build_cost_ic = 5 } }
`);
const equipmentData=extractEquipment(equipment);
assert.equal(equipmentData.first_chassis.cost,4);
assert.equal(equipmentData.second_chassis.cost,5);

const units=parseClausewitz(`
sub_units = { first_unit = { combat_width = 1 } }
sub_units = { second_unit = { combat_width = 2 } }
`);
const unitData=extractSubUnits(units);
assert.equal(unitData.first_unit.width,1);
assert.equal(unitData.second_unit.width,2);
console.log('repeated Clausewitz block parser tests passed');

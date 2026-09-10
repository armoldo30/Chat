import assert from 'node:assert/strict';
import { parseClausewitz, extractSubUnits, extractEquipment, extractEquipmentModules } from '../src/parser.js';
import { extractTechnologies, extractDoctrines } from '../src/gameDataParser.js';

const units=extractSubUnits(parseClausewitz(`sub_units = {
  amphibious_light_armor = {
    type = { armor amphibious }
    categories = { category_tanks category_front_line category_amphibious_tanks }
  }
}`));
assert.deepEqual(units.amphibious_light_armor.types,['armor','amphibious']);
assert.deepEqual(units.amphibious_light_armor.categories,['category_tanks','category_front_line','category_amphibious_tanks']);

const equipment=extractEquipment(parseClausewitz(`equipments = {
  motorbike_equipment = {
    type = { motorized support }
    upgrades = { reliability engine }
  }
}`));
assert.deepEqual(equipment.motorbike_equipment.types,['motorized','support']);
assert.deepEqual(equipment.motorbike_equipment.upgrades,['reliability','engine']);

const modules=extractEquipmentModules(parseClausewitz(`equipment_modules = {
  test_module = {
    category = test
    allow_equipment_type = { light medium }
    forbid_equipment_type = { heavy super_heavy }
  }
}`));
assert.deepEqual(modules.test_module.allowEquipmentType,['light','medium']);
assert.deepEqual(modules.test_module.forbidEquipmentType,['heavy','super_heavy']);

const technologies=extractTechnologies(parseClausewitz(`technologies = {
  test_tech = { category = { infantry artillery } categories = { support armor } }
}`));
assert.deepEqual(technologies.test_tech.categories,['infantry','artillery','support','armor']);

const doctrines=extractDoctrines(parseClausewitz(`test_doctrine = { tracks = { a b c } }`),'track');
assert.deepEqual(doctrines.test_doctrine.tracks,['a','b','c']);

console.log('Clausewitz multi-value list invariants passed.');

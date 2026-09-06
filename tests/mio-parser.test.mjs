import assert from 'node:assert/strict';
import {parseClausewitz,extractMIOs,resolveMIOs} from '../src/parser.js';
const text=`generic_tank_organization = { equipment_type = { medium_tank light_tank } initial_trait = { equipment_bonus = { armor_value = 0.05 } } trait = { token = base_speed equipment_bonus = { maximum_speed = 0.05 } } }
GER_test = { include = generic_tank_organization allowed = { original_tag = GER } add_trait = { token = cheap parents = { base_speed } any_parent = { base_speed } production_bonus = { production_cost_factor = -0.05 } } }`;
const raw=extractMIOs(parseClausewitz(text));const r=resolveMIOs(raw);assert.equal(r.GER_test.countries[0],'GER');assert.ok(r.GER_test.equipmentTypes.includes('medium_tank'));assert.equal(r.GER_test.initial.equipmentBonus.armor_value,.05);assert.equal(r.GER_test.traits.cheap.productionBonus.production_cost_factor,-.05);assert.ok(r.GER_test.traits.base_speed);
console.log('MIO parser tests passed');

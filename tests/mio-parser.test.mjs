import assert from 'node:assert/strict';
import {parseClausewitz,extractMIOs,resolveMIOs} from '../src/parser.js';
const text=`generic_tank_organization = { equipment_type = { medium_tank light_tank } initial_trait = { equipment_bonus = { armor_value = 0.05 } } trait = { token = base_speed equipment_bonus = { maximum_speed = 0.05 } } }
GER_test = { include = generic_tank_organization allowed = { original_tag = GER } add_trait = { token = cheap parents = { base_speed } any_parent = { base_speed } production_bonus = { production_cost_factor = -0.05 } } }`;
const raw=extractMIOs(parseClausewitz(text));const r=resolveMIOs(raw);assert.equal(r.GER_test.countries[0],'GER');assert.ok(r.GER_test.equipmentTypes.includes('medium_tank'));assert.equal(r.GER_test.initial.equipmentBonus.armor_value,.05);assert.equal(r.GER_test.traits.cheap.productionBonus.production_cost_factor,-.05);assert.ok(r.GER_test.traits.base_speed);

const structural=`parent_org = {
 equipment_type = { infantry_equipment }
 trait = { token = custom_7 }
 trait = { token = custom_8 }
 trait = { token = custom_9 equipment_bonus = { soft_attack = 0.1 } }
}
child_org = {
 include = parent_org
 remove_trait = { token = custom_9 }
 add_trait = { token = custom_10 parent = { traits = { custom_7 custom_8 custom_9 } num_parents_needed = 2 } production_bonus = { production_cost_factor = -0.1 } }
}`;
const structuralRaw=extractMIOs(parseClausewitz(structural));
assert.deepEqual(structuralRaw.child_org.removeTraits,['custom_9']);
assert.deepEqual(structuralRaw.child_org.traits.custom_10.parentTraits,['custom_7','custom_8','custom_9']);
assert.equal(structuralRaw.child_org.traits.custom_10.parentCount,2);
const structuralResolved=resolveMIOs(structuralRaw);
assert.ok(structuralResolved.child_org.traits.custom_7,'included parent trait retained');
assert.equal(structuralResolved.child_org.traits.custom_9,undefined,'remove_trait applies after include inheritance');
assert.equal(structuralResolved.child_org.removeTraits,undefined,'resolver consumes remove_trait directives');
console.log('MIO parser tests passed');

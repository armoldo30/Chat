import assert from 'node:assert/strict';
import BUILTIN from '../src/builtin1192.js';
import { parseClausewitz, extractEquipmentModules } from '../src/parser.js';
import { tankCatalogFromPack } from '../src/designerData.js';
import { configureTankDataPack, defaultTankDesign, normalizeTankDesign, tankDesignOptions } from '../src/tank.js';

assert.equal(BUILTIN.meta.tankModuleCompatibilityCertified,true);
const cat=tankCatalogFromPack(BUILTIN);
assert.equal(cat.meta.chassis,12);
assert.equal(cat.meta.guns,25,'standard tank gun catalog must contain only tank armament categories');
assert.ok(!cat.guns.aircraft_cannon_1_1x,'aircraft weapons must never leak into Tank Designer');
assert.ok(!cat.guns.lc_medium_cannon_turret,'Land Cruiser modules use a separate slot family');
assert.ok(cat.guns.tank_medium_cannon&&cat.guns.tank_heavy_cannon&&cat.guns.tank_super_heavy_cannon);

const imported=extractEquipmentModules(parseClausewitz(`equipment_modules={ turret={ category=tank_medium_turret_type allowed_module_categories={ main_armament_slot={ tank_medium_main_armament tank_heavy_main_armament } } forbid_equipment_type_exact_match=armor forbid_equipment_type_exact_match_for_category={ tank_heavy_main_armament=armor } } }`));
assert.deepEqual(imported.turret.allowedModuleCategories.main_armament_slot,['tank_medium_main_armament','tank_heavy_main_armament']);
assert.deepEqual(imported.turret.forbidEquipmentTypeExactMatch,['armor']);
assert.deepEqual(imported.turret.forbidEquipmentTypeExactMatchForCategory,{tank_heavy_main_armament:'armor'});

assert.deepEqual(BUILTIN.modules.tank_medium_three_man_tank_turret.allowedModuleCategories.main_armament_slot,['tank_medium_main_armament']);
assert.deepEqual(BUILTIN.modules.tank_heavy_fixed_superstructure_turret.allowedModuleCategories.main_armament_slot,['tank_medium_main_armament','tank_heavy_main_armament','tank_super_heavy_main_armament']);

configureTankDataPack(BUILTIN,1940);
const medium=defaultTankDesign('medium');
assert.equal(medium.specials.length,4,'standard 1.19.2 chassis have four optional special slots');
let opts=tankDesignOptions(medium);
assert.ok(opts.guns.has('tank_medium_cannon'),'medium turret must add medium main-armament category');
assert.ok(!opts.guns.has('tank_heavy_cannon'),'ordinary medium turret must not accept heavy armament');
assert.equal(opts.specials.length,4);for(const set of opts.specials)assert.ok(set.has('none'));

const light=defaultTankDesign('light');
opts=tankDesignOptions(light);
assert.ok(!opts.guns.has('tank_medium_cannon'));
const lightFixed=normalizeTankDesign({...light,turret:'tank_light_fixed_superstructure_turret'},'light');
assert.ok(tankDesignOptions(lightFixed).guns.has('tank_medium_cannon'),'light fixed superstructure adds medium armament category');
const heavy=defaultTankDesign('heavy');
const heavyFixed=normalizeTankDesign({...heavy,turret:'tank_heavy_fixed_superstructure_turret'},'heavy');
assert.ok(tankDesignOptions(heavyFixed).guns.has('tank_super_heavy_cannon'),'heavy fixed superstructure adds super-heavy armament category');

const invalid=normalizeTankDesign({...light,turret:'tank_heavy_three_man_tank_turret',gun:'tank_super_heavy_cannon'},'light');
assert.notEqual(invalid.turret,'tank_heavy_three_man_tank_turret');
assert.notEqual(invalid.gun,'tank_super_heavy_cannon');
console.log('Tank Designer structural certification invariants passed.');

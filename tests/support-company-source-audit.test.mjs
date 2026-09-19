import assert from 'node:assert/strict';
import BUILTIN_1193 from '../src/builtin1193.js';
import { hydrateGameData, importedDivisionalSupportIds, importedRegimentalSupportIds } from '../src/gameData.js';
import {
  HQ_SUPPORT_IDS_1193,
  isDivisionDesignerSupport1193,
  supportCatalog1193
} from '../src/support-company-catalog-1193.js';
import {
  REGIMENTAL_SUPPORT_IDS_1193,
  REGIMENTAL_SUPPORT_LABELS_1193,
  REGIMENTAL_SUPPORT_COMPATIBILITY_1193,
  applyRegimentalSupportCompatibilityFallback
} from '../src/regimental-support-1193.js';

const EXPECTED_REGIMENTAL=[
  'anti_air_battery','anti_tank_battery','field_guns','fire_support',
  'heavy_sp_anti_air_support','heavy_tank_destroyer_support',
  'light_sp_anti_air_support','light_tank_destroyer_support',
  'medium_sp_anti_air_support','medium_tank_destroyer_support',
  'modern_sp_anti_air_support','modern_tank_destroyer_support',
  'mot_fire_support','rocket_battery'
].sort();

const SUPPORT_RUNTIME_ALIAS=Object.freeze({
  anti_air:'support_aa',
  anti_tank:'support_at',
  artillery:'support_artillery',
  logistics_company:'logistics',
  maintenance_company:'maintenance',
  signal_company:'signal'
});

const EXPECTED_DIVISIONAL=[
  'airborne_light_armor','anti_air','anti_tank','armored_car_recon','armored_engineer',
  'armored_maintenance','armored_signal','artillery','assault_engineer',
  'blackshirt_assault_battalion','elephantry','engineer','field_hospital',
  'heavy_flame_tank','helicopter_brigade','helicopter_field_hospital',
  'helicopter_recon','helicopter_transport','jungle_pioneers_support','land_cruiser',
  'light_flame_tank','light_tank_recon','logistics_company','long_range_patrol_support',
  'maintenance_company','medium_flame_tank','military_police','mot_recon',
  'motorized_military_police','northern_territory_recon_support','pioneer_support',
  'rangers_support','recon','rocket_artillery','self_propelled_super_heavy_artillery',
  'signal_company','sturmtruppe_battalion','super_heavy_armor','super_heavy_artillery',
  'super_heavy_sp_anti_air_brigade','super_heavy_sp_artillery_brigade',
  'super_heavy_tank_destroyer_brigade','winter_logistics_support'
].sort();

const sourceCatalog=supportCatalog1193(BUILTIN_1193.subUnits);
assert.deepEqual(sourceCatalog.regimental,EXPECTED_REGIMENTAL,'1.19.3 source regimental catalog must be exact');
assert.deepEqual(sourceCatalog.divisional,EXPECTED_DIVISIONAL,'normal Division Designer support catalog must match positive 1.19.3 divisional category');
assert.deepEqual(sourceCatalog.headquarters,[...HQ_SUPPORT_IDS_1193].sort(),'HQ-only support staff must remain a separate catalog');
assert.equal(sourceCatalog.regimental.length,14);
assert.equal(sourceCatalog.divisional.length,43);
assert.equal(sourceCatalog.headquarters.length,11);
assert.equal(new Set([...sourceCatalog.regimental,...sourceCatalog.divisional,...sourceCatalog.headquarters]).size,68,'catalog boundaries must not overlap');

const battalions={},supports={},equipment={},terrain={};
hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});
applyRegimentalSupportCompatibilityFallback(supports);

assert.deepEqual(importedRegimentalSupportIds(supports).sort(),EXPECTED_REGIMENTAL);
const EXPECTED_RUNTIME_DIVISIONAL=EXPECTED_DIVISIONAL.map(id=>SUPPORT_RUNTIME_ALIAS[id]||id).sort();
assert.deepEqual(importedDivisionalSupportIds(supports).sort(),EXPECTED_RUNTIME_DIVISIONAL);
for(const id of HQ_SUPPORT_IDS_1193){
  assert.ok(supports[id],`HQ support ${id} should still exist in hydrated data`);
  assert.equal(isDivisionDesignerSupport1193(id,supports[id]),false,`${id} must not leak into a normal division support slot`);
  assert.ok(!importedDivisionalSupportIds(supports).includes(id),`${id} must be excluded from Division Designer`);
}
assert.ok(importedDivisionalSupportIds(supports).includes('elephantry'),'1.19.3 Elephantry must be exposed as a support company');

assert.deepEqual([...REGIMENTAL_SUPPORT_IDS_1193].sort(),EXPECTED_REGIMENTAL);
for(const id of EXPECTED_REGIMENTAL){
  assert.equal(supports[id].name,REGIMENTAL_SUPPORT_LABELS_1193[id],`${id} should use the 1.19.3 source-backed display name`);
  assert.deepEqual(supports[id].allowedBattalionGroups,REGIMENTAL_SUPPORT_COMPATIBILITY_1193[id],`${id} compatibility must match 1.19.3 source matrix`);
}

// 1.19.3 source balance checks for every regimental-support family.
assert.deepEqual({org:supports.fire_support.org,hp:supports.fire_support.hp},{org:30,hp:.6});
assert.deepEqual({org:supports.mot_fire_support.org,hp:supports.mot_fire_support.hp},{org:30,hp:.6});
for(const id of ['field_guns','rocket_battery']){
  assert.equal(Object.values(supports[id].need).reduce((a,b)=>a+b,0),6,`${id} should require six guns/launchers`);
  assert.deepEqual(supports[id].equipmentModifiers,{soft:-.75,hard:-.75,def:-.75,breakthrough:-.75,hardness:0,armor:0,piercing:0,airAttack:0});
}
assert.equal(supports.anti_air_battery.manpower,180);
assert.equal(Object.values(supports.anti_air_battery.need).reduce((a,b)=>a+b,0),16);
assert.equal(supports.anti_air_battery.equipmentModifiers.soft,-.6);
assert.equal(supports.anti_air_battery.equipmentModifiers.hard,-.6);
assert.equal(supports.anti_air_battery.equipmentModifiers.def,-.6);
assert.equal(supports.anti_air_battery.equipmentModifiers.breakthrough,-.6);
assert.equal(supports.anti_tank_battery.manpower,180);
assert.equal(supports.anti_tank_battery.equipmentModifiers.soft,-.6);

for(const family of ['light','medium','heavy','modern']){
  const td=supports[`${family}_tank_destroyer_support`],spaa=supports[`${family}_sp_anti_air_support`];
  assert.ok(td&&spaa,`${family} armored regimental supports must exist`);
  assert.equal(Object.values(td.need).reduce((a,b)=>a+b,0),15);
  assert.equal(td.equipmentModifiers.armor,-.66);
  assert.equal(td.equipmentModifiers.soft,-.66);
  assert.equal(td.equipmentModifiers.hard,-.5);
  assert.equal(td.equipmentModifiers.def,-.5);
  assert.equal(Object.values(spaa.need).reduce((a,b)=>a+b,0),15);
  assert.equal(spaa.equipmentModifiers.armor,-.66);
  assert.equal(spaa.equipmentModifiers.soft,-.66);
  assert.equal(spaa.equipmentModifiers.hard,-.66);
  assert.equal(spaa.equipmentModifiers.def,-.5);
  assert.equal(spaa.equipmentModifiers.airAttack,-.25);
}

console.log('HOI4 1.19.3 support-company source catalog audit passed: 43 divisional, 14 regimental, 11 HQ-only.');

import assert from 'node:assert/strict';
import BUILTIN_1193 from '../src/builtin1193.js';
import { hydrateGameData, importedDivisionalSupportIds, importedRegimentalSupportIds } from '../src/gameData.js';
import { BUILTIN_ENGLISH_LOCALIZATION_1193 } from '../src/builtin1193/localization-english-1193.js';
import {
  REGIMENTAL_SUPPORT_IDS_1193,
  REGIMENTAL_SUPPORT_LABELS_1193,
  REGIMENTAL_SUPPORT_ABBREVIATIONS_1193,
  REGIMENTAL_SUPPORT_COMPATIBILITY_1193
} from '../src/regimental-support-1193.js';

const EXPECTED_DIVISIONAL=Object.freeze(`
airborne_light_armor
anti_air
anti_tank
armored_car_recon
armored_engineer
armored_maintenance
armored_signal
artillery
assault_engineer
blackshirt_assault_battalion
elephantry
engineer
field_hospital
heavy_flame_tank
helicopter_brigade
helicopter_field_hospital
helicopter_recon
helicopter_transport
hq_air_liaison
hq_engineer
hq_field_hospital
hq_logistics
hq_maintenance
hq_military_police
hq_naval_liaison
hq_recon
hq_signal
hq_specops
hq_support_company
jungle_pioneers_support
land_cruiser
light_flame_tank
light_tank_recon
logistics_company
long_range_patrol_support
maintenance_company
medium_flame_tank
military_police
mot_recon
motorized_military_police
northern_territory_recon_support
pioneer_support
rangers_support
recon
rocket_artillery
self_propelled_super_heavy_artillery
signal_company
sturmtruppe_battalion
super_heavy_armor
super_heavy_artillery
super_heavy_sp_anti_air_brigade
super_heavy_sp_artillery_brigade
super_heavy_tank_destroyer_brigade
winter_logistics_support
`.trim().split(/\s+/).sort());

const EXPECTED_REGIMENTAL=Object.freeze(`
fire_support
mot_fire_support
field_guns
rocket_battery
anti_air_battery
anti_tank_battery
light_tank_destroyer_support
medium_tank_destroyer_support
heavy_tank_destroyer_support
modern_tank_destroyer_support
light_sp_anti_air_support
medium_sp_anti_air_support
heavy_sp_anti_air_support
modern_sp_anti_air_support
`.trim().split(/\s+/).sort());

const byCategory=category=>Object.values(BUILTIN_1193.subUnits||{})
  .filter(unit=>(unit.categories||[]).includes(category))
  .map(unit=>unit.id)
  .sort();

const sourceDivisional=byCategory('category_divisional_support_battalions');
const sourceRegimental=byCategory('category_regimental_support_battalions');

assert.equal(sourceDivisional.length,54,'1.19.3 source catalog must contain 54 divisional support sub-units');
assert.equal(sourceRegimental.length,14,'1.19.3 source catalog must contain 14 regimental support sub-units');
assert.deepEqual(sourceDivisional,EXPECTED_DIVISIONAL,'divisional support inventory drifted from the certified 1.19.3 source catalog');
assert.deepEqual(sourceRegimental,EXPECTED_REGIMENTAL,'regimental support inventory drifted from the certified 1.19.3 source catalog');
assert.deepEqual([...REGIMENTAL_SUPPORT_IDS_1193].sort(),EXPECTED_REGIMENTAL,'regimental compatibility catalog must cover the exact source inventory');
assert.equal(Object.keys(REGIMENTAL_SUPPORT_COMPATIBILITY_1193).length,14);
assert.equal(Object.keys(REGIMENTAL_SUPPORT_ABBREVIATIONS_1193).length,14);

const battalions={},supports={},equipment={},terrain={};
hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});

const sourceId=id=>supports[id]?.gameId||supports[id]?.id||id;
const hydratedDivisional=importedDivisionalSupportIds(supports);
const hydratedRegimental=importedRegimentalSupportIds(supports);
assert.equal(hydratedDivisional.length,54,'Division Designer must expose exactly the 54 source divisional supports');
assert.equal(hydratedRegimental.length,14,'Division Designer must expose exactly the 14 source regimental supports');
assert.deepEqual(hydratedDivisional.map(sourceId).sort(),EXPECTED_DIVISIONAL,'hydrated divisional support aliases must map one-for-one to source IDs');
assert.deepEqual(hydratedRegimental.map(sourceId).sort(),EXPECTED_REGIMENTAL,'hydrated regimental support aliases must map one-for-one to source IDs');
assert.equal(new Set([...hydratedDivisional,...hydratedRegimental]).size,68,'support picker inventories must not overlap or alias-collide');

for(const id of [...EXPECTED_DIVISIONAL,...EXPECTED_REGIMENTAL]){
  const label=BUILTIN_ENGLISH_LOCALIZATION_1193[id];
  assert.equal(typeof label,'string',`missing exact English localization for support unit ${id}`);
  assert.ok(label.trim(),`empty English localization for support unit ${id}`);
}
for(const id of EXPECTED_REGIMENTAL){
  assert.equal(REGIMENTAL_SUPPORT_LABELS_1193[id],BUILTIN_ENGLISH_LOCALIZATION_1193[id],`regimental display label mismatch for ${id}`);
}

// Source abbreviations used by the in-game regimental support records.
assert.deepEqual(REGIMENTAL_SUPPORT_ABBREVIATIONS_1193,{
  fire_support:'FSC',mot_fire_support:'FSC',field_guns:'IFG',rocket_battery:'RBC',
  anti_air_battery:'RAA',anti_tank_battery:'RAT',
  light_tank_destroyer_support:'LTD',medium_tank_destroyer_support:'MTD',heavy_tank_destroyer_support:'HTD',modern_tank_destroyer_support:'OTD',
  light_sp_anti_air_support:'LAA',medium_sp_anti_air_support:'MAA',heavy_sp_anti_air_support:'HAA',modern_sp_anti_air_support:'OAA'
});

// Planner-consumed 1.19.3 regimental support source fields.
const raw=BUILTIN_1193.subUnits;
assert.deepEqual(raw.fire_support.need,{infantry_equipment:30,support_equipment:5});
assert.deepEqual({mp:raw.fire_support.manpower,org:raw.fire_support.org,hp:raw.fire_support.hp,supply:raw.fire_support.supply,soft:raw.fire_support.soft,hard:raw.fire_support.hard,def:raw.fire_support.def},
  {mp:240,org:30,hp:.6,supply:.06,soft:-.5,hard:-.5,def:-.25});
assert.deepEqual(raw.mot_fire_support.need,{infantry_equipment:30,motorized_equipment:5,support_equipment:5});
assert.equal(raw.mot_fire_support.breakthrough,-.25);
assert.deepEqual(raw.field_guns.need,{artillery_equipment:6});
assert.deepEqual({mp:raw.field_guns.manpower,hp:raw.field_guns.hp,supply:raw.field_guns.supply,soft:raw.field_guns.soft,hard:raw.field_guns.hard,def:raw.field_guns.def,breakthrough:raw.field_guns.breakthrough},
  {mp:180,hp:.1,supply:.1,soft:-.75,hard:-.75,def:-.75,breakthrough:-.75});
assert.deepEqual(raw.rocket_battery.need,{rocket_artillery_equipment:6});
assert.deepEqual(raw.anti_air_battery.need,{anti_air_equipment:16});
assert.deepEqual({soft:raw.anti_air_battery.soft,hard:raw.anti_air_battery.hard,def:raw.anti_air_battery.def,breakthrough:raw.anti_air_battery.breakthrough,airAttack:raw.anti_air_battery.airAttack},
  {soft:-.6,hard:-.6,def:-.6,breakthrough:-.6,airAttack:-.6});
assert.deepEqual(raw.anti_tank_battery.need,{anti_tank_equipment:16});
assert.deepEqual({soft:raw.anti_tank_battery.soft,hard:raw.anti_tank_battery.hard,def:raw.anti_tank_battery.def,breakthrough:raw.anti_tank_battery.breakthrough,piercing:raw.anti_tank_battery.piercing},
  {soft:-.6,hard:-.65,def:-.6,breakthrough:-.6,piercing:-.2});

const td={
  light:[.06,-.75],medium:[.07,-.70],heavy:[.09,-.65],modern:[.08,-.60]
};
for(const [family,[supply,breakthrough]] of Object.entries(td)){
  const unit=raw[`${family}_tank_destroyer_support`];
  assert.equal(unit.need[`${family}_tank_destroyer_chassis`],15);
  assert.deepEqual({mp:unit.manpower,hp:unit.hp,supply,actualSupply:unit.supply,soft:unit.soft,hard:unit.hard,def:unit.def,breakthrough:unit.breakthrough,armor:unit.armor},
    {mp:180,hp:.2,supply,actualSupply:supply,soft:-.66,hard:-.5,def:-.5,breakthrough,armor:-.66});
}
const spaa={
  light:[.3,.05,-.75],medium:[.3,.06,-.70],heavy:[.2,.07,-.65],modern:[.2,.06,-.60]
};
for(const [family,[hp,supply,breakthrough]] of Object.entries(spaa)){
  const unit=raw[`${family}_sp_anti_air_support`];
  assert.equal(unit.need[`${family}_tank_aa_chassis`],15);
  assert.deepEqual({mp:unit.manpower,hp:unit.hp,supply:unit.supply,soft:unit.soft,hard:unit.hard,def:unit.def,breakthrough:unit.breakthrough,airAttack:unit.airAttack,armor:unit.armor},
    {mp:180,hp,supply,soft:-.66,hard:-.66,def:-.5,breakthrough,airAttack:-.25,armor:-.66});
}

console.log(JSON.stringify({
  sourceDivisional:sourceDivisional.length,
  sourceRegimental:sourceRegimental.length,
  hydratedDivisional:hydratedDivisional.length,
  hydratedRegimental:hydratedRegimental.length,
  localizedSupportRecords:68,
  regimentalAbbreviations:Object.keys(REGIMENTAL_SUPPORT_ABBREVIATIONS_1193).length
}));

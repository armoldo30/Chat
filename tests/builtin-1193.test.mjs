import assert from 'node:assert/strict';
import pack from '../src/builtin1193.js';
import { MODEL_META } from '../src/data.js';
import { REGIMENTAL_SUPPORT_COMPATIBILITY_META, supportAllowedBattalionGroups } from '../src/regimental-support-1193.js';
import { BUILTIN_ENGLISH_LOCALIZATION_1193, BUILTIN_ENGLISH_LOCALIZATION_1193_META } from '../src/builtin1193/localization-english-1193.js';

assert.equal(MODEL_META.appVersion,'0.17.0');
assert.equal(MODEL_META.gameVersion,'1.19.3');
assert.equal(pack.meta.gameVersion,'1.19.3');
assert.equal(pack.meta.gameBuild,'1.19.3.0.c01a');
assert.equal(pack.meta.checksum,'5632');
assert.equal(pack.meta.sourceCertification,'game-file-exact-1.19.3');
assert.equal(pack.meta.sourceCertification1193.sourceArchives.commonZipSha256,'0161171c32b58bb50e6fbf4d34deb3d0b00526f23bc4be4f91a8bb740ee3a8ae');
assert.equal(pack.meta.sourceCertification1193.sourceArchives.localizationZipSha256,'5d63fe3a04f31992c1ebf8da56afe6a58b94a089055e0267fc14beb3c9ee5ede');
assert.equal(pack.meta.executableValidation,'partial-1.19.3-oracle-o1-timing');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1193_META.gameVersion,'1.19.3');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1193_META.sourceArchiveSha256,'5d63fe3a04f31992c1ebf8da56afe6a58b94a089055e0267fc14beb3c9ee5ede');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1193.airborne_light_armor,'Airborne Light Armor');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1193.AST_mio_trait_boomerang_spirit,'Boomerang Spirit');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1193.SUBDOCTRINE_MOBILE_INFANTRY,'Mobile Infantry');

// Land/support changes from the supplied 1.19.3 common files.
assert.deepEqual(
  {soft:pack.subUnits.artillery.soft,hard:pack.subUnits.artillery.hard,def:pack.subUnits.artillery.def,breakthrough:pack.subUnits.artillery.breakthrough},
  {soft:-0.5,hard:-0.5,def:-0.5,breakthrough:-0.5}
);
assert.equal(pack.subUnits.rocket_artillery.soft,-0.5);
assert.equal(pack.subUnits.anti_air.need.anti_air_equipment,24);
assert.equal(pack.subUnits.fire_support.org,30);
assert.equal(pack.subUnits.fire_support.hp,0.6);
assert.equal(pack.subUnits.mot_fire_support.org,30);
assert.equal(pack.subUnits.mot_fire_support.hp,0.6);
assert.equal(pack.subUnits.field_guns.need.artillery_equipment,6);
assert.equal(pack.subUnits.field_guns.soft,-0.75);
assert.equal(pack.subUnits.field_guns.def,-0.75);
assert.equal(pack.subUnits.rocket_battery.need.rocket_artillery_equipment,6);
assert.equal(pack.subUnits.anti_air_battery.need.anti_air_equipment,16);
assert.equal(pack.subUnits.anti_air_battery.manpower,180);
assert.equal(pack.subUnits.anti_air_battery.breakthrough,-0.6);
assert.equal(pack.subUnits.anti_tank_battery.manpower,180);
assert.equal(pack.subUnits.anti_tank_battery.soft,-0.6);
assert.ok(pack.subUnits.mot_anti_air_brigade.categories.includes('category_anti_air'));
assert.equal(pack.subUnits.light_tank_destroyer_support.need.light_tank_destroyer_chassis,15);
assert.equal(pack.subUnits.light_tank_destroyer_support.armor,-0.66);
assert.equal(pack.subUnits.light_tank_destroyer_support.def,-0.5);
assert.equal(pack.subUnits.light_tank_destroyer_support.hard,-0.5);
assert.ok(!pack.subUnits.light_tank_destroyer_support.categories.includes('category_tank_destroyers'));
assert.equal(pack.subUnits.light_sp_anti_air_support.need.light_tank_aa_chassis,15);
assert.equal(pack.subUnits.light_sp_anti_air_support.airAttack,-0.25);
assert.equal(pack.subUnits.light_sp_anti_air_support.hard,-0.66);
assert.ok(!pack.subUnits.light_sp_anti_air_support.categories.includes('category_self_propelled_anti_air'));
assert.equal(pack.subUnits.hq_motorized.supply,0.08);
assert.ok(pack.subUnits.airborne_light_armor);

// The supplied 1.19.3 hq_support.txt still contains these armored-HQ values.
// Keep source truth ahead of release-note prose if they disagree.
assert.equal(pack.subUnits.hq_light_armor.supply,0.26);
assert.equal(pack.subUnits.hq_medium_armor.supply,0.28);
assert.equal(pack.subUnits.hq_heavy_armor.supply,0.34);

// Equipment/module balance changes.
assert.deepEqual(
  {soft:pack.equipment.artillery_equipment.soft,def:pack.equipment.artillery_equipment.def,breakthrough:pack.equipment.artillery_equipment.breakthrough},
  {soft:26,def:11,breakthrough:10}
);
assert.deepEqual(
  {hard:pack.equipment.artillery_equipment_2.hard,piercing:pack.equipment.artillery_equipment_2.piercing,breakthrough:pack.equipment.artillery_equipment_2.breakthrough},
  {hard:3,piercing:7,breakthrough:13}
);
assert.deepEqual(
  {hard:pack.equipment.artillery_equipment_3.hard,piercing:pack.equipment.artillery_equipment_3.piercing,def:pack.equipment.artillery_equipment_3.def,breakthrough:pack.equipment.artillery_equipment_3.breakthrough},
  {hard:4,piercing:9,def:19,breakthrough:16}
);
assert.equal(pack.equipment.rocket_artillery_equipment.soft,32);
assert.equal(pack.equipment.rocket_artillery_equipment.breakthrough,17);
assert.equal(pack.equipment.rocket_artillery_equipment_2.soft,40);
assert.equal(pack.equipment.rocket_artillery_equipment_2.breakthrough,20);
assert.equal(pack.equipment.motorized_rocket_equipment.breakthrough,20);
assert.equal(pack.equipment.gw_armored_car_equipment.cost,3);
assert.equal(pack.equipment.armored_car_equipment.cost,4.5);
assert.equal(pack.equipment.armored_car_equipment_2.cost,6);
assert.equal(pack.equipment.armored_car_at_equipment.cost,7.5);
assert.equal(pack.modules.tank_heavy_howitzer.addStats.breakthrough,-2);
assert.equal(pack.modules.tank_rocket_launcher.addStats.breakthrough,-2);
assert.equal(pack.modules.tank_rocket_launcher_2.addStats.breakthrough,-2);

// Technology effects: certify changed-source behavior, not patch-note transcription.
assert.equal(pack.technologies.artillery2.directEffects.field_guns.soft_attack,0.05);
assert.equal(pack.technologies.sp_variable_time_fuze_shells.directEffects.field_guns.soft_attack,0.05);
assert.equal(pack.technologies.rocket_artillery2.directEffects.rocket_battery.soft_attack,0.1);
assert.equal(pack.technologies.sp_rockets_improved_guidance.directEffects.rocket_battery.soft_attack,0.05);
assert.ok(!('field_guns' in pack.technologies.support_weapons2.directEffects));
assert.ok(!('mot_anti_tank_brigade' in pack.technologies.antitank2.directEffects));
assert.equal(pack.technologies.antitank1.directEffects.category_tank_destroyer_regimental_support.ap_attack,0.05);
assert.equal(pack.technologies.tech_engineers3.directEffects.light_flame_tank.urban.attack,0.05);
assert.equal(pack.technologies.tech_engineers4.directEffects.assault_engineer.urban.attack,0.1);
assert.equal(pack.technologies.tech_logistics_company2.directEffects.helicopter_transport.supply_consumption_factor,-0.15);

// Doctrine source replacements.
assert.equal(pack.doctrines.mobile_infantry.raw.rewards.cavalry_charge.recon.defense,0.1);
assert.equal(pack.doctrines.mobile_infantry.raw.rewards.maneuver_warfare.mot_fire_support.max_organisation,10);
assert.equal(pack.doctrines.defensive_postures.raw.rewards.improvised_fighting_position.fire_support.entrenchment,0.2);
assert.equal(pack.doctrines.fire_concentration.raw.category_line_artillery.breakthrough,0.1);
assert.equal(pack.doctrines.fire_concentration.raw.rewards.weakpoint_studies.category_regimental_support_artillery.defense,0.1);
assert.equal(pack.doctrines.infiltration_tactics.raw.max_planning,0.1);
assert.equal(pack.doctrines.infiltration_tactics.raw.rewards.self_sustaining_infiltration_units.command_power_gain,0.1);
assert.equal(pack.doctrines.anti_aircraft_cruisers.raw.navy_anti_air_attack_factor,0.1);
assert.equal(pack.doctrines.patrol_boats.raw.rewards.small_craft_harassment.destroyer.torpedo_attack,0.1);
assert.equal(pack.doctrines.self_propelled_support.raw.rewards.multirole_support_vehicles.category_tank_destroyer_regimental_support.hard_attack,0.05);

// Changed MIOs must retain generic inherited traits after the 1.19.3 source overlay.
const cac=pack.mios.AST_commonwealth_aircraft_corporation_organization;
assert.ok(cac);
assert.ok(cac.traits.AST_mio_trait_boomerang_spirit);
assert.ok(Object.keys(cac.traits).length>3,'changed MIO retains inherited generic traits');
assert.ok(!cac.inheritanceWarning);

// Regimental-support compatibility is now exact from 1.19.3 source.
assert.equal(REGIMENTAL_SUPPORT_COMPATIBILITY_META.gameVersion,'1.19.3');
assert.equal(REGIMENTAL_SUPPORT_COMPATIBILITY_META.evidence,'game-file-exact');
assert.deepEqual(supportAllowedBattalionGroups('fire_support',pack.subUnits.fire_support).groups,['infantry','mobile','combat_support']);
assert.deepEqual(supportAllowedBattalionGroups('light_tank_destroyer_support',pack.subUnits.light_tank_destroyer_support).groups,['armor','mobile_combat_support','armor_combat_support']);

assert.equal(Object.keys(pack.modules).length,313);
assert.equal(Object.keys(pack.technologies).length,552);
assert.equal(Object.keys(pack.doctrines).length,121);
assert.equal(Object.keys(pack.mios).length,440);
assert.equal(pack.meta.rawSourceMioDeclarationCount,552);

console.log('bundled HOI4 1.19.3 migration certification passed');

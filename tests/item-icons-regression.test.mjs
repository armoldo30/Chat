import assert from 'node:assert/strict';
import { itemIconKey, itemIconSvg } from '../src/item-icons.js';

const tankCases=[
  ['light_basic','Basic Light Chassis','armor'],['light_improved','Improved Light Chassis','armor'],['light_advanced','Advanced Light Chassis','armor'],
  ['medium_basic','Basic Medium Chassis','armor'],['medium_improved','Improved Medium Chassis','armor'],['medium_advanced','Advanced Medium Chassis','armor'],
  ['heavy_basic','Basic Heavy Chassis','armor'],['heavy_improved','Improved Heavy Chassis','armor'],['heavy_advanced','Advanced Heavy Chassis','armor'],
  ['heavy_machine_gun','Heavy Machine Gun','armor'],['small_cannon','Small Cannon','armor'],['close_support_gun','Close Support Gun','armor'],['high_velocity_1','High Velocity Cannon I','armor'],['medium_cannon','Medium Cannon','armor'],['improved_medium_cannon','Improved Medium Cannon','armor'],['medium_howitzer','Medium Howitzer','armor'],['heavy_cannon','Heavy Cannon','armor'],
  ['one_man','One-Man Turret','armor'],['two_man','Two-Man Turret','armor'],['three_man','Three-Man Turret','armor'],['fixed','Fixed Superstructure','armor'],
  ['bogie','Bogie Suspension','armor'],['christie','Christie Suspension','armor'],['torsion','Torsion Bar','armor'],['interleaved','Interleaved Roadwheels','armor'],
  ['riveted','Riveted Armor','armor'],['welded','Welded Armor','armor'],['cast','Cast Armor','armor'],['gasoline','Gasoline Engine','armor'],['diesel','Diesel Engine','armor'],['petrol_electric','Petrol-Electric Engine','armor'],
  ['radio','Radio','armor'],['sloped_armor','Sloped Armor','armor'],['wet_ammo','Wet Ammunition Storage','armor'],['easy_maintenance','Easy Maintenance','armor'],['extra_machine_guns','Additional Machine Guns','armor'],['smoke_launchers','Smoke Launchers','armor'],['stabilizer','Stabilizer','armor']
];
const airCases=[
  ['small_basic','Basic Small Airframe','air'],['small_improved','Improved Small Airframe','air'],['small_advanced','Advanced Small Airframe','air'],['medium_basic','Basic Medium Airframe','air'],['medium_improved','Improved Medium Airframe','air'],['medium_advanced','Advanced Medium Airframe','air'],
  ['engine_1_1x','Engine I ×1','air'],['engine_2_1x','Engine II ×1','air'],['engine_2_2x','Engine II ×2','air'],['engine_3_1x','Engine III ×1','air'],['jet_engine_1x','Jet Engine','air'],['rocket_engine_1','Rocket Engine','air'],
  ['light_mg_2x','2× Light Machine Guns','air'],['heavy_mg_2x','2× Heavy Machine Guns','air'],['aircraft_cannon_1_1x','Cannon I','air'],['bomb_locks','Bomb Locks','air'],['medium_bomb_bay','Medium Bomb Bay','air'],['torpedo_mounting','Torpedo Mounting','air'],['hmg_defense_turret','HMG Defense Turret','air'],['recon_camera','Recon Camera','air'],['radio_navigation_1','Radio Navigation','air'],['drop_tanks','Drop Tanks','air'],['fuel_tanks_small','Extra Fuel Tanks','air'],['self_sealing_fuel_tanks_small','Self-Sealing Fuel Tanks','air'],['armor_plate_small','Armor Plates','air'],['non_strategic_materials_small','Non-Strategic Materials','air']
];
for(const [value,label,context] of [...tankCases,...airCases])assert.match(itemIconSvg(value,label,context),/<svg/);
const all=[...tankCases,...airCases].map(x=>itemIconSvg(...x));
assert.equal(new Set(all).size,all.length,'representative selectable equipment items must render unique SVG strings');
assert.notEqual(itemIconKey('light_tank','Light Tank','armor'),itemIconKey('medium_tank','Medium Tank','armor'));
assert.notEqual(itemIconKey('medium_tank','Medium Tank','armor'),itemIconKey('heavy_tank','Heavy Tank','armor'));
console.log('Item icon regression checks passed.');

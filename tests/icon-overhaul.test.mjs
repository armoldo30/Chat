import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { itemIconKey, itemIconSvg } from '../src/item-icons.js';
import { sourceIconHint } from '../src/source-icon-hints.js';

const [html,visual,designer,clarity]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-overhaul.js',import.meta.url),'utf8'),
  readFile(new URL('../src/designer-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/item-icon-clarity.css',import.meta.url),'utf8')
]);

assert.doesNotMatch(html,/src\/icon-overhaul\.js/,'legacy icon runtime must not override the current item-icon system');
assert.match(html,/src\/item-icon-clarity\.css/,'item identity marks should be visible at runtime');
assert.match(visual,/sourceIconHint/,'visual pickers should use source-aware module hints');
assert.match(visual,/itemIconSvg/,'visual pickers should render the shared item-icon system');
assert.match(designer,/familyIconValue/,'tank family tabs should keep family-specific silhouettes');
assert.match(clarity,/icon-signature/,'variant marks should be emphasized for phone-size icons');

const tankIds=[
  'tank_auto_cannon_2','tank_anti_air_cannon_3','tank_high_velocity_cannon_3','tank_medium_howitzer_2',
  'tank_bogie_suspension','tank_interleaved_suspension','tank_cast_armor','tank_gas_turbine_engine',
  'tank_radio_3','dozer_blade','auto_loader','expanded_fuel_tank','extra_ammo_storage','squeezebore_adaptor'
];
for(const id of tankIds){
  const hint=sourceIconHint(id,id,'armor','Tank Module'),key=itemIconKey(id,hint,'armor');
  assert.notEqual(key,'armor',`${id} must not collapse to the generic tank icon`);
  assert.notEqual(key,'generic',`${id} must resolve to a meaningful item icon`);
}

const airIds=[
  'engine_2_1x','heavy_mg_2x','aircraft_cannon_1_1x','bomb_locks','medium_bomb_bay','torpedo_mounting',
  'rocket_rails','hmg_defense_turret','radio_navigation_1','air_ground_radar_1','recon_camera',
  'drop_tanks','self_sealing_fuel_tanks_small','armor_plate_small','fuel_tanks_small','non_strategic_materials_small'
];
for(const id of airIds){
  const hint=sourceIconHint(id,id,'air','Aircraft Module'),key=itemIconKey(id,hint,'air');
  assert.notEqual(key,'air',`${id} must not collapse to the generic aircraft icon`);
  assert.notEqual(key,'generic',`${id} must resolve to a meaningful item icon`);
}

const tankFamilies=['light_tank','medium_tank','heavy_tank'].map(id=>itemIconSvg(id,id,'armor','armor'));
assert.equal(new Set(tankFamilies).size,3,'light, medium and heavy tank tabs need visibly different SVGs');

const airEngineVariants=['engine_1_1x','engine_2_1x','engine_3_1x','engine_4_1x'].map(id=>itemIconSvg(id,sourceIconHint(id,id,'air','Engine'),'air','air'));
assert.equal(new Set(airEngineVariants).size,4,'air engine generations must not reuse identical SVG markup');

const cannonVariants=['tank_small_cannon','tank_small_cannon_2','tank_medium_cannon','tank_medium_cannon_2','tank_heavy_cannon','tank_heavy_cannon_2'].map(id=>itemIconSvg(id,sourceIconHint(id,id,'armor','Main Armament'),'armor','armor'));
assert.equal(new Set(cannonVariants).size,cannonVariants.length,'source tank weapons must remain item-distinct even inside one weapon family');

console.log('Live item-specific icon regression checks passed.');
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { itemIconKey, itemIconSvg } from '../src/item-icons.js';
import { sourceIconHint } from '../src/source-icon-hints.js';
import { hoi4ModelIconSvg } from '../src/hoi4-model-icons.js';

const [html,visual,designer,clarity,modelRuntime,modelCss]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-overhaul.js',import.meta.url),'utf8'),
  readFile(new URL('../src/designer-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/item-icon-clarity.css',import.meta.url),'utf8'),
  readFile(new URL('../src/hoi4-model-runtime.js',import.meta.url),'utf8'),
  readFile(new URL('../src/hoi4-model-icons.css',import.meta.url),'utf8')
]);

assert.doesNotMatch(html,/src\/icon-overhaul\.js/,'legacy icon runtime must not override the current item-icon system');
assert.match(html,/src\/item-icon-clarity\.css/,'item identity marks should be visible at runtime');
assert.match(html,/src\/hoi4-model-icons\.css/,'HOI4-style model icon skin should load');
assert.match(html,/src\/hoi4-model-runtime\.js/,'HOI4-style model icon runtime should load');
assert.match(visual,/sourceIconHint/,'visual pickers should use source-aware module hints');
assert.match(visual,/itemIconSvg/,'visual pickers should retain the shared item-icon system under the model layer');
assert.match(designer,/familyIconValue/,'tank family tabs should keep family-specific silhouettes');
assert.match(clarity,/icon-signature/,'variant marks should be emphasized for phone-size icons');
assert.match(modelRuntime,/visual-picker-trigger/,'model runtime should replace active designer trigger icons');
assert.match(modelRuntime,/data-tank-class/,'model runtime should replace tank-family tabs');
assert.match(modelCss,/hoi-model-plate/,'model icons should use stamped equipment plates');

const tankIds=[
  'tank_auto_cannon_2','tank_anti_air_cannon_3','tank_high_velocity_cannon_3','tank_medium_howitzer_2',
  'tank_bogie_suspension','tank_interleaved_suspension','tank_cast_armor','tank_gas_turbine_engine',
  'tank_radio_3','dozer_blade','auto_loader','expanded_fuel_tank','extra_ammo_storage','squeezebore_adaptor'
];
for(const id of tankIds){
  const hint=sourceIconHint(id,id,'armor','Tank Module'),key=itemIconKey(id,hint,'armor');
  assert.notEqual(key,'armor',`${id} must not collapse to the generic tank icon`);
  assert.notEqual(key,'generic',`${id} must resolve to a meaningful item icon`);
  assert.match(hoi4ModelIconSvg(id,id,'armor','armor','Tank Module'),/hoi-model-icon/,`${id} should render through the HOI4-style model layer`);
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
  assert.match(hoi4ModelIconSvg(id,id,'air','air','Aircraft Module'),/hoi-model-icon/,`${id} should render through the HOI4-style model layer`);
}

const tankFamilies=['light_tank','medium_tank','heavy_tank'].map(id=>itemIconSvg(id,id,'armor','armor'));
assert.equal(new Set(tankFamilies).size,3,'light, medium and heavy tank tabs need visibly different SVGs');
const modeledTankFamilies=['light_tank','medium_tank','heavy_tank'].map(id=>hoi4ModelIconSvg(id,id,'armor','armor','Tank class'));
assert.equal(new Set(modeledTankFamilies).size,3,'modeled light, medium and heavy tanks must remain visibly distinct');

const airEngineVariants=['engine_1_1x','engine_2_1x','engine_3_1x','engine_4_1x'].map(id=>hoi4ModelIconSvg(id,id,'air','air','Engine'));
assert.equal(new Set(airEngineVariants).size,4,'air engine generations must not reuse identical modeled SVG markup');

const cannonVariants=['tank_small_cannon','tank_small_cannon_2','tank_medium_cannon','tank_medium_cannon_2','tank_heavy_cannon','tank_heavy_cannon_2'].map(id=>hoi4ModelIconSvg(id,id,'armor','armor','Main Armament'));
assert.equal(new Set(cannonVariants).size,cannonVariants.length,'source tank weapons must remain item-distinct in the modeled icon layer');

console.log('Live item-specific HOI4-style icon regression checks passed.');
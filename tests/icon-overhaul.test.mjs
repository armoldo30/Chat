import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { itemIconKey, itemIconSvg } from '../src/item-icons.js';
import { sourceIconHint } from '../src/source-icon-hints.js';
import { hoi4ModelIconSvg } from '../src/hoi4-model-icons.js';

const [html,visual,designer,clarity,modelRuntime,modelCss,modelIcons,uiLabels,divisionVisuals]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-overhaul.js',import.meta.url),'utf8'),
  readFile(new URL('../src/designer-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/item-icon-clarity.css',import.meta.url),'utf8'),
  readFile(new URL('../src/hoi4-model-runtime.js',import.meta.url),'utf8'),
  readFile(new URL('../src/hoi4-model-icons.css',import.meta.url),'utf8'),
  readFile(new URL('../src/hoi4-model-icons.js',import.meta.url),'utf8'),
  readFile(new URL('../src/ui-labels.js',import.meta.url),'utf8'),
  readFile(new URL('../src/division-visuals.js',import.meta.url),'utf8')
]);

assert.doesNotMatch(html,/src\/icon-overhaul\.js/,'legacy icon runtime must not override the current item-icon system');
assert.match(html,/src\/item-icon-clarity\.css/,'semantic tier badges should be styled at runtime');
assert.match(html,/src\/hoi4-model-icons\.css/,'HOI4-style model icon skin should load');
assert.match(html,/src\/hoi4-model-runtime\.js/,'HOI4-style model icon runtime should load');
assert.match(visual,/sourceIconHint/,'visual pickers should use source-aware module hints');
assert.match(visual,/itemIconSvg/,'visual pickers should retain the shared item-icon system under the model layer');
assert.match(designer,/familyIconValue/,'tank family tabs should keep family-specific silhouettes');
assert.match(clarity,/icon-tier-badge/,'meaningful tier badges should remain legible on phone-size icons');
assert.match(modelRuntime,/visual-picker-trigger/,'model runtime should replace active designer trigger icons');
assert.match(modelRuntime,/data-tank-class/,'model runtime should replace tank-family tabs');
assert.match(modelRuntime,/division-counter/,'model runtime should replace letter-only division counters with modeled unit identities');
assert.match(modelCss,/hoi-model-plate/,'model icons should use stamped equipment plates');
assert.match(modelCss,/hoi-model-accent/,'modeled icons should share a category accent system');
assert.match(modelCss,/hoi-model-unit/,'division icons should receive unit-specific plate styling');
assert.match(modelCss,/Semantic palette/,'modeled icons should use semantic military-family palettes');
assert.match(modelCss,/hoi4-artillery/,'artillery should have a distinct semantic palette');
assert.match(modelCss,/hoi4-antiair/,'anti-air should have a distinct semantic palette');
assert.match(modelCss,/hoi4-mountaineer/,'special forces should have distinct semantic palettes');
assert.match(modelCss,/Shared small-symbol treatment/,'nav, battlefield and stat icons should share the polished symbol treatment');
assert.match(uiLabels,/class="ui-symbol-icon"/,'shared semantic SVGs should expose the unified symbol class');
assert.match(modelIcons,/hoi-stage-badge/,'modeled tier differences should use explicit stage badges');
assert.match(modelIcons,/hoi-model-corners/,'modeled icons should use the stronger framed plate treatment');
assert.match(modelIcons,/hoi-model-glyph/,'modeled silhouettes should render in a shared scalable glyph layer');
assert.match(modelRuntime,/startsWith\('hoi4-'\)/,'runtime should clear stale semantic icon classes when selections change');
assert.match(divisionVisuals,/hoi4ModelIconSvg/,'Division Lab battalion and support slots should use the shared modeled icon renderer');
assert.match(divisionVisuals,/hoi4ModelIconKey/,'Division Lab should share the same semantic icon identity mapping');
for(const [id,expected] of [['gw_armored_car_equipment','armored_car'],['bicycle_battalion','bicycle'],['mot_fire_support','motorized_artillery'],['rocket_battery','rocket_artillery']]){
  assert.equal(itemIconKey(id,id,'infantry'),expected,`${id} should resolve to ${expected}`);
  assert.match(hoi4ModelIconSvg(id,id,'infantry','generic','Division unit'),/hoi-model-icon/);
}
assert.doesNotMatch(modelIcons,/hoi-id-rivet|identityMark/,'modeled icons should not use pseudo-random identity decoration');

const unicodeIconPattern=/\p{Extended_Pictographic}|\uFE0F|[ⓘ☑☒☐✓✔✕✖✗✘★☆◆◇●○◉►▶◀▲▼]/u;
const uiEntries=await readdir(new URL('../src/',import.meta.url),{withFileTypes:true});
const uiPaths=uiEntries.filter(entry=>entry.isFile()&&/\.(?:js|css)$/.test(entry.name)).map(entry=>`../src/${entry.name}`);
uiPaths.push('../index.html','../about.html','../guides.html','../methodology.html','../privacy.html','../division-counter.html','../division-gauntlet.html','../tank-designer.html','../air-lab.html');
for(const path of uiPaths){
  const content=await readFile(new URL(path,import.meta.url),'utf8');
  assert.doesNotMatch(content,unicodeIconPattern,`${path} must not ship Unicode emoji/pseudo-icon glyphs; use SVG, CSS, or text labels instead`);
}

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
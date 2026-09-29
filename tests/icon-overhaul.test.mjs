import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { itemIconKey, itemIconSvg } from '../src/item-icons.js';
import { sourceIconHint } from '../src/source-icon-hints.js';
import { hoi4ModelIconSvg } from '../src/hoi4-model-icons.js';
import { hoi4SourceIcon } from '../src/hoi4-source-icons.js';
import { hoi4TextIconForLabel } from '../src/hoi4-text-icons.js';
import { HOI4_STAT_ICONS, hoi4StatIconForLabel } from '../src/hoi4-stat-icons.js';

const [html,visual,designer,clarity,modelRuntime,modelCss,modelIcons,uiLabels,divisionVisuals,buildScript,sourceIcons]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-overhaul.js',import.meta.url),'utf8'),
  readFile(new URL('../src/designer-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/item-icon-clarity.css',import.meta.url),'utf8'),
  readFile(new URL('../src/hoi4-model-runtime.js',import.meta.url),'utf8'),
  readFile(new URL('../src/hoi4-model-icons.css',import.meta.url),'utf8'),
  readFile(new URL('../src/hoi4-model-icons.js',import.meta.url),'utf8'),
  readFile(new URL('../src/ui-labels.js',import.meta.url),'utf8'),
  readFile(new URL('../src/division-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8'),
  readFile(new URL('../src/hoi4-source-icons.js',import.meta.url),'utf8')
]);

assert.doesNotMatch(html,/src\/icon-overhaul\.js/,'legacy icon runtime must not override the current item-icon system');
assert.match(html,/src\/item-icon-clarity\.css/,'semantic tier badges should be styled at runtime');
assert.match(html,/src\/hoi4-model-icons\.css/,'HOI4-style model icon skin should load');
assert.match(html,/src\/hoi4-model-runtime\.js/,'HOI4-style model icon runtime should load');
assert.match(visual,/sourceIconHint/,'visual pickers should use source-aware module hints');
assert.match(visual,/hoi4SourceFallbackSvg/,'visual pickers should fall back to authentic HOI4 source artwork');
assert.match(designer,/familyIconValue/,'tank family tabs should keep family-specific silhouettes');
assert.match(clarity,/icon-tier-badge/,'meaningful tier badges should remain legible on phone-size icons');
assert.match(visual,/modal\.dataset\.pickerKind=baseKind/,'visual picker must preserve the originating designer context');
assert.match(visual,/card\.dataset\.optionValue=String\(option\.value\|\|''\)/,'visual picker must preserve each exact option id');
assert.match(modelRuntime,/modal\.dataset\.pickerKind/,'model runtime must use the preserved picker context');
assert.match(modelRuntime,/card\.dataset\.optionValue/,'model runtime must use exact picker option ids instead of reconstructed labels');
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
assert.match(buildScript,/publicFiles=\[[^\]]*'hoi4-icons\.webp'/s,'production build must copy the authentic HOI4 atlas into dist');
assert.match(sourceIcons,/ATLAS_ASSET_URL\.search=MODULE_URL\.search/,'atlas URL must inherit the module build token to avoid stale cached 404s');
assert.match(sourceIcons,/clipPathUnits="userSpaceOnUse"/,'source atlas sprites should use an explicit user-space clip path');
assert.match(sourceIcons,/clip-path="url\(#\$\{clipId\}\)"/,'atlas image must be explicitly clipped instead of relying on SVG viewport overflow');
assert.match(sourceIcons,/SOURCE_CLIP_SERIAL/,'each rendered source icon should receive a unique clip id to avoid duplicate DOM ids');
assert.match(sourceIcons,/<rect x="1" y="1" width="\$\{cellWidth-2\}" height="\$\{cellHeight-2\}"\/>/,'explicit atlas clip should inset one source pixel inside every cell');
for(const [id,expected] of [['gw_armored_car_equipment','armored_car'],['bicycle_battalion','bicycle'],['mot_fire_support','motorized_artillery'],['rocket_battery','rocket_artillery']]){
  assert.equal(itemIconKey(id,id,'infantry'),expected,`${id} should resolve to ${expected}`);
  assert.match(hoi4ModelIconSvg(id,id,'infantry','generic','Division unit'),/hoi-model-icon/);
}
assert.doesNotMatch(modelIcons,/hoi-id-rivet|identityMark/,'modeled icons should not use pseudo-random identity decoration');

const exactEngine=hoi4SourceIcon('engine_2_1x','1x Engine II','air','Engine');
assert.equal(exactEngine?.key,'module:engine_2_1x','air designer modules should resolve by exact HOI4 module id');
const exactTankGun=hoi4SourceIcon('tank_medium_cannon_2','Improved Medium Cannon','armor','Main Armament');
assert.equal(exactTankGun?.key,'module:tank_medium_cannon_2','tank designer modules should resolve by exact HOI4 module id');
const exactInfantry=hoi4SourceIcon('infantry','Infantry','infantry','Division unit');
assert.equal(exactInfantry?.key,'unit:infantry','division battalions should resolve by exact HOI4 subunit id');
assert.match(hoi4ModelIconSvg('engine_2_1x','1x Engine II','air','air','Engine'),/data-source-icon="module:engine_2_1x"/,'authentic HOI4 art should take precedence over modeled SVG fallback');
assert.match(hoi4ModelIconSvg('definitely_unknown_icon','Unknown','generic','generic','Unknown'),/data-source-icon=/,'unknown visible items should use a generic authentic HOI4 source fallback');
for(const label of ['Soft Attack','Hard Attack','Piercing','Defense','Breakthrough','Armor','Hardness','Air Attack','Reliability','Speed','Fuel Consumption','Supply Consumption','Entrenchment','Build Cost']){
  assert.match(hoi4StatIconForLabel(label),/data:image\/webp;base64/,`${label} should use an exact HOI4 stat icon`);
}
for(const [key,url] of Object.entries(HOI4_STAT_ICONS)){
  const b64=String(url).replace(/^data:image\/webp;base64,/,'');
  const bytes=Buffer.from(b64,'base64');
  assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF',`${key} must be a valid RIFF WebP`);
  assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP',`${key} must be a valid WebP`);
  assert.equal(bytes.length,bytes.readUInt32LE(4)+8,`${key} WebP payload must not be truncated or overrun`);
}
for(const label of ['Manpower','Organization','HP','Doctrine','Night Fighting']){
  assert.match(hoi4TextIconForLabel(label),/data:image\/png;base64,/,`${label} should use an exact HOI4 texticon`);
}

const authenticOnlyUiPaths=[
  '../src/nav-visuals.js','../src/battlefield-visuals.js','../src/stat-visuals.js','../src/battle-report-visuals.js',
  '../src/industry-visuals.js','../src/designer-visuals.js','../src/visual-overhaul.js','../src/doctrine-board.js',
  '../src/air-doctrine-board.js','../src/mio-board.js','../src/inline-mio-board.js','../src/inline-mio-guided.js','../src/tech-system-summary.js'
];
for(const path of authenticOnlyUiPaths){
  const content=await readFile(new URL(path,import.meta.url),'utf8');
  assert.doesNotMatch(content,/\bitemIconSvg\s*\(/,`${path} must not render planner-drawn item icons`);
  assert.doesNotMatch(content,/\biconSvg\s*\(/,`${path} must not render planner-drawn generic UI icons`);
}

const unicodeIconPattern=/\p{Extended_Pictographic}|\uFE0F|[ⓘ☑☒☐✓✔✕✖✗✘★☆◆◇●○◉►▶◀▲▼]/u;
async function collectUiSources(dirUrl,prefix='../src/'){
  const entries=await readdir(dirUrl,{withFileTypes:true}),paths=[];
  for(const entry of entries){
    const path=`${prefix}${entry.name}`;
    if(entry.isDirectory())paths.push(...await collectUiSources(new URL(`${entry.name}/`,dirUrl),`${path}/`));
    else if(/\.(?:js|css)$/.test(entry.name))paths.push(path);
  }
  return paths;
}
const uiPaths=await collectUiSources(new URL('../src/',import.meta.url));
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
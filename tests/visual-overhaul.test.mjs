import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { displayLabel, humanizeIdentifier, visualKind, iconSvg } from '../src/ui-labels.js';
import { itemIconKey, itemIconSvg } from '../src/item-icons.js';

assert.equal(displayLabel('support_artillery'),'Support Artillery');
assert.equal(displayLabel('mobile_warfare'),'Mobile Warfare');
assert.equal(displayLabel('GER_porsche_tank'),'Porsche');
assert.equal(humanizeIdentifier('USA_example_aircraft_organization'),'Example Aircraft');
assert.ok(!displayLabel('regimental_infantry_guns').includes('_'),'visible labels must not expose underscore ids');
assert.equal(visualKind('medium_tank_chassis'),'armor');
assert.equal(visualKind('fighter_airframe'),'air');
assert.match(iconSvg('armor'),/<svg/);

assert.equal(itemIconKey('light_tank_chassis','Light Tank','armor'),'light_tank');
assert.equal(itemIconKey('medium_tank_chassis','Medium Tank','armor'),'medium_tank');
assert.equal(itemIconKey('heavy_tank_chassis','Heavy Tank','armor'),'heavy_tank');
assert.equal(itemIconKey('christie','Christie Suspension','armor'),'christie');
assert.equal(itemIconKey('diesel','Diesel Engine','armor'),'diesel_engine');
assert.equal(itemIconKey('engine_2_1x','Engine II ×1','air'),'prop_engine');
assert.equal(itemIconKey('bomb_locks','Bomb Locks','air'),'bomb_locks');
assert.equal(itemIconKey('torpedo_mounting','Torpedo Mounting','air'),'torpedo');
assert.equal(itemIconKey('recon_camera','Recon Camera','air'),'recon_camera');

const distinctSamples=[
  ['light_tank_chassis','Light Tank','armor'],['medium_tank_chassis','Medium Tank','armor'],['heavy_tank_chassis','Heavy Tank','armor'],
  ['one_man','One-Man Turret','armor'],['two_man','Two-Man Turret','armor'],['three_man','Three-Man Turret','armor'],['fixed','Fixed Superstructure','armor'],
  ['bogie','Bogie Suspension','armor'],['christie','Christie Suspension','armor'],['torsion','Torsion Bar','armor'],['interleaved','Interleaved Roadwheels','armor'],
  ['riveted','Riveted Armor','armor'],['welded','Welded Armor','armor'],['cast','Cast Armor','armor'],
  ['gasoline','Gasoline Engine','armor'],['diesel','Diesel Engine','armor'],['petrol_electric','Petrol-Electric Engine','armor'],
  ['engine_1_1x','Engine I ×1','air'],['engine_2_1x','Engine II ×1','air'],['engine_2_2x','Engine II ×2','air'],
  ['light_mg_2x','2× Light Machine Guns','air'],['heavy_mg_2x','2× Heavy Machine Guns','air'],['aircraft_cannon_1_1x','Cannon I','air'],
  ['bomb_locks','Bomb Locks','air'],['medium_bomb_bay','Medium Bomb Bay','air'],['torpedo_mounting','Torpedo Mounting','air'],
  ['recon_camera','Recon Camera','air'],['radio_navigation_1','Radio Navigation','air'],['drop_tanks','Drop Tanks','air'],['self_sealing_fuel_tanks_small','Self-Sealing Fuel Tanks','air']
];
const distinctSvgs=distinctSamples.map(args=>itemIconSvg(...args));
assert.equal(new Set(distinctSvgs).size,distinctSvgs.length,'representative tank and air selections should not reuse identical SVG output');
assert.notEqual(itemIconSvg('engine_1_1x','Engine I ×1','air'),itemIconSvg('engine_2_1x','Engine II ×1','air'),'different tiers must remain visually distinct even within one module family');

const [html,js,css,cleanup,division,industry,designer,designerCss,itemIcons]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-overhaul.js',import.meta.url),'utf8'),
  readFile(new URL('../src/visual-overhaul.css',import.meta.url),'utf8'),
  readFile(new URL('../src/visible-label-cleanup.js',import.meta.url),'utf8'),
  readFile(new URL('../src/division-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/industry-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/designer-visuals.js',import.meta.url),'utf8'),
  readFile(new URL('../src/designer-visuals.css',import.meta.url),'utf8'),
  readFile(new URL('../src/item-icons.js',import.meta.url),'utf8')
]);

assert.match(html,/visual-overhaul\.css/,'index should load the visual overhaul stylesheet');
assert.match(html,/visual-overhaul\.js/,'index should load the visual overhaul module');
assert.match(html,/visible-label-cleanup\.js/,'index should load the visible ID cleanup layer');
assert.match(html,/division-visuals\.js/,'index should load division pictograms');
assert.match(html,/division-visuals\.css/,'index should load division pictogram styling');
assert.match(html,/industry-visuals\.js/,'index should load industry pictograms');
assert.match(html,/industry-visuals\.css/,'index should load industry pictogram styling');
assert.match(html,/designer-visuals\.js/,'index should load designer visual tabs');
assert.match(html,/designer-visuals\.css/,'index should load designer visual styling');
for(const selector of ['#land-grand','[data-doctrine-choice]','[data-mio-org]','.tank-module-grid select','.air-module-grid select'])assert.ok(js.includes(selector),`visual picker coverage should include ${selector}`);
assert.match(js,/itemIconSvg/,'visual selectors should use the item-specific icon catalog');
assert.match(js,/dispatchEvent\(new Event\('change'/,'visual choices must drive the existing certified controls');
assert.doesNotMatch(js,/engine\.js|simulateBattle|calcDivision/,'visual layer must not import or execute simulation mechanics');
assert.match(cleanup,/looksLikeIdentifier/,'visible label cleanup should only rewrite identifier-like labels');
assert.match(cleanup,/Game ID:/,'raw game IDs should remain inspectable as tooltips');
assert.match(cleanup,/txt\|lua\|yml/,'source filenames should be excluded from display rewriting');
assert.doesNotMatch(cleanup,/engine\.js|simulateBattle|calcDivision/,'label cleanup must remain UI-only');
assert.match(division,/\.picker-choice\[data-choice\]/,'division selection cards should gain pictograms');
assert.match(division,/\.hoi-battalion-slot\.filled/,'filled battalion slots should gain pictograms');
assert.match(division,/\.regimental-support\.filled/,'filled regimental supports should gain pictograms');
assert.match(division,/itemIconSvg/,'division pictograms should use the item-specific catalog');
assert.doesNotMatch(division,/engine\.js|simulateBattle|calcDivision/,'division pictogram layer must remain UI-only');
assert.match(industry,/\.advisor-eq \.equipment-badge/,'industry allocation rows should gain equipment pictograms');
assert.match(industry,/\.stock-grid label/,'stockpile rows should gain equipment pictograms');
assert.match(industry,/\.loss-list > span/,'replacement losses should gain equipment pictograms');
assert.doesNotMatch(industry,/engine\.js|simulateBattle|calcDivision/,'industry pictogram layer must remain UI-only');
assert.match(designer,/\[data-tank-class\]/,'tank family tabs should gain pictograms');
assert.match(designer,/\[data-tank-role\]/,'tank role tabs should gain pictograms');
assert.match(designer,/\.aircraft-role span/,'aircraft role tags should gain pictograms');
assert.match(designer,/itemIconSvg/,'equipment designers should use item-specific pictograms');
assert.doesNotMatch(designer,/engine\.js|simulateBattle|calcDivision/,'designer visual layer must remain UI-only');
assert.match(itemIcons,/icon-signature/,'item icons should include deterministic per-id identity marks');
assert.match(designerCss,/designer-visual-tab/);
assert.match(designerCss,/air-role-visual/);
assert.match(css,/visual-picker-grid/);
assert.match(css,/mastery-pips/);
assert.match(css,/visual-mio-node/);
assert.match(css,/prefers-reduced-motion/);

console.log('Visual overhaul regression checks passed.');

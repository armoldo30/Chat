import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,icons]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/icon-overhaul.js',import.meta.url),'utf8')
]);

assert.match(html,/\.\/src\/icon-overhaul\.js/,'index should load the item-specific icon overhaul');
for(const key of [
  'light_tank','medium_tank','heavy_tank','superheavy_tank','modern_tank','tank_destroyer','spg','spaa',
  'fighter','heavy_fighter','cas','tactical_bomber','strategic_bomber','naval_bomber','scout_plane',
  'piston_engine','jet_engine','rocket_engine','light_mg','heavy_mg','cannon','bomb_lock','bomb_bay_small','bomb_bay_medium','bomb_bay_large','torpedo','rocket_rail','radar','radio_nav','self_sealing','drop_tank','fuel_tank','camera',
  'tank_turret_1','tank_turret_2','tank_turret_3','fixed_superstructure','autocannon','close_support_gun','high_velocity_gun','howitzer','tank_cannon_small','tank_cannon_medium','tank_cannon_heavy','tank_cannon_super','tank_aa_gun','flamethrower','gasoline_engine','diesel_engine','electric_engine','bogie','christie','torsion','interleaved','riveted_armor','welded_armor','cast_armor','sloped_armor','tank_radio','stabilizer','wet_ammo','squeeze_bore','smoke','extra_ammo','easy_maintenance','additional_mg','amphibious',
  'infantry','motorized','mechanized','cavalry','mountaineer','marine','paratrooper','engineer','maintenance','military_police','recon','logistics','signal','hospital','support_artillery','support_at','support_aa'
])assert.ok(icons.includes(`${key}:`),`icon library should include ${key}`);

assert.match(icons,/function variantMark\(/,'distinct items should receive deterministic visual variants');
assert.match(icons,/hash32\(/,'variant marks should be stable from item identity');
assert.match(icons,/\.air-module-grid label/,'air module controls should be item-specific');
assert.match(icons,/\.tank-module-grid label/,'tank module controls should be item-specific');
assert.match(icons,/\[data-tank-class\]/,'tank chassis tabs should be differentiated');
assert.match(icons,/\.hoi-battalion-slot\.filled/,'division battalions should be differentiated');
assert.doesNotMatch(icons,/engine\.js|simulateBattle|calcDivision/,'icon overhaul must remain presentation-only');

// Parse browser source without executing DOM APIs.
new Function(icons.replace(/^import .*$/gm,''));

console.log('Item-specific icon overhaul regression checks passed.');

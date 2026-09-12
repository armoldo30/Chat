import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import BUILTIN_1192 from '../src/builtin1192.js';
import { regimentGroupForUnit, normalizeBattalionRegimentGroups, regimentGroupLabel } from '../src/regiment-groups.js';

const sourceArtillery=BUILTIN_1192.subUnits.artillery_brigade;
const sourceAT=BUILTIN_1192.subUnits.anti_tank_brigade;
const sourceAA=BUILTIN_1192.subUnits.anti_air_brigade;
const sourceTD=BUILTIN_1192.subUnits.medium_tank_destroyer_brigade;
const sourceSPAA=BUILTIN_1192.subUnits.medium_sp_anti_air_brigade;
assert.equal(sourceArtillery.group,'combat_support','bundled 1.19.2 line artillery source group should be combat_support');
assert.equal(sourceAT.group,'combat_support','bundled 1.19.2 line AT source group should be combat_support');
assert.equal(sourceAA.group,'combat_support','bundled 1.19.2 line AA source group should be combat_support');
assert.equal(sourceTD.group,'armor_combat_support','bundled 1.19.2 tank destroyer source group should be armor_combat_support');
assert.equal(sourceSPAA.group,'armor_combat_support','bundled 1.19.2 SPAA source group should be armor_combat_support');
assert.ok(sourceArtillery.categories.includes('category_line_artillery'));

assert.equal(regimentGroupForUnit('infantry',{group:'infantry',gameId:'infantry'}),'infantry');
assert.equal(regimentGroupForUnit('artillery',{group:'infantry',gameId:'artillery_brigade',categories:['category_line_artillery'],types:['infantry','artillery']}),'combat_support','line artillery must not collapse into infantry');
assert.equal(regimentGroupForUnit('anti_tank',{group:'infantry'}),'combat_support','fallback line AT must use combat-support regiment group');
assert.equal(regimentGroupForUnit('anti_air',{group:'infantry'}),'combat_support','fallback line AA must use combat-support regiment group');
assert.equal(regimentGroupForUnit('mot_artillery_brigade',{group:'infantry',gameId:'mot_artillery_brigade',categories:['category_line_artillery','category_mobile_and_mobile_combat_sup'],types:['motorized','artillery']}),'mobile_combat_support','motorized line artillery must keep its mobile combat-support group');
assert.equal(regimentGroupForUnit('medium_tank_destroyer_brigade',{group:'armor',gameId:'medium_tank_destroyer_brigade',categories:['category_all_armor','category_tank_destroyers'],types:['armor','anti_tank']}),'armor_combat_support','tank destroyer battalions must not collapse into ordinary armor');
assert.equal(regimentGroupForUnit('medium_sp_anti_air_brigade',{group:'armor',gameId:'medium_sp_anti_air_brigade',categories:['category_all_armor','category_self_propelled_anti_air'],types:['armor','anti_air']}),'armor_combat_support','SPAA battalions must not collapse into ordinary armor');
assert.equal(regimentGroupForUnit('medium_armor',{group:'armor'}),'armor');
assert.equal(regimentGroupLabel('mobile_combat_support'),'Mobile Combat Support');
assert.equal(regimentGroupLabel('armor_combat_support'),'Armor Combat Support');

const map={infantry:{group:'infantry'},artillery:{group:'infantry',gameId:'artillery_brigade',categories:['category_line_artillery']},td:{group:'armor',gameId:'medium_tank_destroyer_brigade',categories:['category_tank_destroyers']}};
normalizeBattalionRegimentGroups(map);
assert.equal(map.artillery.group,'combat_support','runtime normalization should expose the source-compatible group to UI filters');
assert.equal(map.td.group,'armor_combat_support','runtime normalization should recover armored combat-support groups from source categories');

const [html,css,runtime]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/mobile-cleanup-v3.css',import.meta.url),'utf8'),
  readFile(new URL('../src/regiment-group-runtime.js',import.meta.url),'utf8')
]);
assert.match(html,/mobile-cleanup-v3\.css/,'site should load the mobile cleanup layer');
assert.match(html,/regiment-group-runtime\.js/,'site should load the regiment group runtime after main');
assert.match(css,/@media\(max-width:720px\)/,'cleanup must be mobile-scoped');
assert.match(css,/lab-command-bar/,'lab navigation should be mobile-cleaned');
assert.match(css,/battlefield-quick/,'combat controls should be mobile-cleaned');
assert.match(runtime,/normalizeBattalionRegimentGroups/,'runtime should normalize hydrated battalion groups');

console.log('Regiment grouping and mobile cleanup regression checks passed.');

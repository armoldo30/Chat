import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import BUILTIN_1192 from '../src/builtin1192.js';
import { regimentGroupForUnit, normalizeBattalionRegimentGroups, regimentGroupLabel } from '../src/regiment-groups.js';

const sourceArtillery=BUILTIN_1192.subUnits.artillery_brigade;
const sourceAT=BUILTIN_1192.subUnits.anti_tank_brigade;
const sourceAA=BUILTIN_1192.subUnits.anti_air_brigade;
assert.equal(sourceArtillery.group,'combat_support','bundled 1.19.2 line artillery source group should be combat_support');
assert.equal(sourceAT.group,'combat_support','bundled 1.19.2 line AT source group should be combat_support');
assert.equal(sourceAA.group,'combat_support','bundled 1.19.2 line AA source group should be combat_support');
assert.ok(sourceArtillery.categories.includes('category_line_artillery'));

assert.equal(regimentGroupForUnit('infantry',{group:'infantry',gameId:'infantry'}),'infantry');
assert.equal(regimentGroupForUnit('artillery',{group:'infantry',gameId:'artillery_brigade',categories:['category_line_artillery'],types:['infantry','artillery']}),'combat_support','line artillery must not collapse into infantry');
assert.equal(regimentGroupForUnit('anti_tank',{group:'infantry'}),'combat_support','fallback line AT must use combat-support regiment group');
assert.equal(regimentGroupForUnit('anti_air',{group:'infantry'}),'combat_support','fallback line AA must use combat-support regiment group');
assert.equal(regimentGroupForUnit('mot_artillery_brigade',{group:'infantry',gameId:'mot_artillery_brigade',categories:['category_line_artillery','category_mobile_and_mobile_combat_sup'],types:['motorized','artillery']}),'mobile_combat_support','motorized line artillery must keep its mobile combat-support group');
assert.equal(regimentGroupForUnit('medium_armor',{group:'armor'}),'armor');
assert.equal(regimentGroupLabel('mobile_combat_support'),'Mobile Combat Support');

const map={infantry:{group:'infantry'},artillery:{group:'infantry',gameId:'artillery_brigade',categories:['category_line_artillery']}};
normalizeBattalionRegimentGroups(map);
assert.equal(map.artillery.group,'combat_support','runtime normalization should expose the source-compatible group to UI filters');

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

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import BUILTIN_1193 from '../src/builtin1193.js';
import { hydrateGameData } from '../src/gameData.js';
import { battalionPickerGroups, assignRegimentalSupport } from '../src/division-designer-options.js';
import { regimentGroupForUnit } from '../src/regiment-groups.js';
import { REGIMENTAL_SUPPORT_IDS_1193, applyRegimentalSupportCompatibilityFallback } from '../src/regimental-support-1193.js';

const battalions={},supports={},equipment={},terrain={};
hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});
applyRegimentalSupportCompatibilityFallback(supports);

const groups=battalionPickerGroups(battalions);
const armorSupport=groups['Armored Combat Support']||[];
for(const id of [
  'light_tank_destroyer_brigade','medium_tank_destroyer_brigade','heavy_tank_destroyer_brigade',
  'light_sp_artillery_brigade','medium_sp_artillery_brigade','heavy_sp_artillery_brigade',
  'light_sp_anti_air_brigade','medium_sp_anti_air_brigade','heavy_sp_anti_air_brigade'
]){
  assert.ok(battalions[id],`hydrated 1.19.3 battalion catalog should include ${id}`);
  assert.equal(regimentGroupForUnit(id,battalions[id]),'armor_combat_support',`${id} should use the armored combat-support regiment group`);
  assert.ok(armorSupport.includes(id),`Division Designer picker should expose ${id}`);
}

assert.ok((groups['Armored Battalions']||[]).includes('light_armor'));
assert.ok((groups['Armored Battalions']||[]).includes('medium_armor'));
assert.ok((groups['Armored Battalions']||[]).includes('heavy_armor'));

for(const id of REGIMENTAL_SUPPORT_IDS_1193)assert.ok(supports[id]?.regimentalSupport,`1.19.3 regimental support ${id} should hydrate as regimental support`);

const state={attackerRegimentalSupports:[null,null,null,null,null]};
assert.equal(assignRegimentalSupport(state,'attacker',2,'medium_sp_anti_air_support',()=>true),'medium_sp_anti_air_support');
assert.equal(state.attackerRegimentalSupports[2],'medium_sp_anti_air_support','regimental support click helper should persist the selected company');
assert.equal(assignRegimentalSupport(state,'attacker',2,'medium_sp_anti_air_support',()=>false),null);
assert.equal(state.attackerRegimentalSupports[2],null,'incompatible regimental support should still be rejected');

const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
assert.match(main,/battalionPickerGroups\(battalions\)/,'Division Designer should derive battalion picker groups from hydrated source data');
assert.doesNotMatch(main,/'Armored Battalions':\['light_armor','medium_armor','heavy_armor'\]/,'armor picker must not be hardcoded to only three tank battalions');
assert.match(main,/data-regimental-choice=/,'regimental support choices should use a dedicated click binding');
assert.match(main,/assignRegimentalSupport\(state,side,column,value/,'regimental support click binding should mutate the selected regiment explicitly');
assert.match(main,/normalizeGrid\(state\[key\],Object\.keys\(battalions\),battalions\)/,'designer normalization must use the hydrated battalion map');

console.log('Division Designer live regression checks passed.');

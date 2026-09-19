import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import BUILTIN_1193 from '../src/builtin1193.js';
import { hydrateGameData, importedDivisionalSupportIds } from '../src/gameData.js';
import { battalionPickerGroups, supportCompanyPickerGroups, supportCompanySection, assignRegimentalSupport } from '../src/division-designer-options.js';
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



const auditedDivisionalSupports=importedDivisionalSupportIds(supports);
const supportGroups=supportCompanyPickerGroups(supports,auditedDivisionalSupports);
for(const id of ['elephantry','armored_engineer','helicopter_field_hospital','winter_logistics_support','super_heavy_artillery']){
  assert.ok(auditedDivisionalSupports.includes(id),`audited Division Designer support catalog should include ${id}`);
}
for(const id of ['hq_engineer','hq_recon','hq_logistics','hq_signal','hq_field_hospital']){
  assert.ok(!auditedDivisionalSupports.includes(id),`HQ-only support ${id} must not appear in normal Division Designer support choices`);
}
assert.equal(supportCompanySection('engineer',supports.engineer),'Engineering & Recon');
assert.equal(supportCompanySection('support_artillery',supports.support_artillery),'Fire Support');
assert.equal(supportCompanySection('support_at',supports.support_at),'Anti-Tank & Anti-Air');
assert.equal(supportCompanySection('support_aa',supports.support_aa),'Anti-Tank & Anti-Air');
if(supports.logistics)assert.equal(supportCompanySection('logistics',supports.logistics),'Logistics & Maintenance');
if(supports.signal)assert.equal(supportCompanySection('signal',supports.signal),'Command, Medical & Security');
for(const ids of Object.values(supportGroups)){
  const names=ids.map(id=>String(supports[id]?.name||id));
  assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)),'support companies should be alphabetized within each role group');
}

const state={attackerRegimentalSupports:[null,null,null,null,null]};
assert.equal(assignRegimentalSupport(state,'attacker',2,'medium_sp_anti_air_support',()=>true),'medium_sp_anti_air_support');
assert.equal(state.attackerRegimentalSupports[2],'medium_sp_anti_air_support','regimental support click helper should persist the selected company');
assert.equal(assignRegimentalSupport(state,'attacker',2,'medium_sp_anti_air_support',()=>false),null);
assert.equal(state.attackerRegimentalSupports[2],null,'incompatible regimental support should still be rejected');

const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
assert.match(main,/battalionPickerGroups\(battalions\)/,'Division Designer should derive battalion picker groups from hydrated source data');
assert.match(main,/supportCompanyPickerGroups\(supports,BASE_DIVISIONAL_SUPPORTS\)/,'support company picker should be grouped instead of rendered as one unsorted wall');
assert.match(main,/importedDivisionalSupportIds\(supports\)/,'Division Designer must use the positive source-backed divisional support catalog');
assert.match(main,/filter\(x=>BASE_DIVISIONAL_SUPPORTS\.includes\(x\)\)/,'saved support selections must be normalized against the audited catalog');
assert.doesNotMatch(main,/'Armored Battalions':\['light_armor','medium_armor','heavy_armor'\]/,'armor picker must not be hardcoded to only three tank battalions');
assert.match(main,/data-regimental-choice=/,'regimental support choices should use a dedicated click binding');
assert.match(main,/assignRegimentalSupport\(state,side,column,value/,'regimental support click binding should mutate the selected regiment explicitly');
assert.match(main,/normalizeGrid\(state\[key\],Object\.keys\(battalions\),battalions\)/,'designer normalization must use the hydrated battalion map');

console.log('Division Designer live regression checks passed.');

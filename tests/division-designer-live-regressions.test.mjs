import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import BUILTIN_1193 from '../src/builtin1193.js';
import { hydrateGameData } from '../src/gameData.js';
import { ordinaryDivisionBattalionIds, battalionPickerGroups, supportCompanyPickerGroups, supportCompanySection, assignRegimentalSupport } from '../src/division-designer-options.js';
import { regimentGroupForUnit } from '../src/regiment-groups.js';
import { REGIMENTAL_SUPPORT_IDS_1193, applyRegimentalSupportCompatibilityFallback, regimentalSupportAllowed } from '../src/regimental-support-1193.js';
import { HQ_ONLY_LINE_BATTALIONS_1193, HQ_LINE_ELIGIBILITY_1193_META } from '../src/builtin1193/hq-line-eligibility-1193.js';

const battalions={},supports={},equipment={},terrain={};
hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});
applyRegimentalSupportCompatibilityFallback(supports);

const ordinaryBattalions=ordinaryDivisionBattalionIds(battalions);
const groups=battalionPickerGroups(battalions,ordinaryBattalions);
const presentHqOnly=HQ_ONLY_LINE_BATTALIONS_1193.filter(id=>battalions[id]);
assert.equal(presentHqOnly.length,6,'compact 1.19.3 runtime should currently contain six of seven HQ-only line battalions');
assert.equal(battalions.hq_armored_car,undefined,'hq_armored_car is outside the current compact line-battalion subset');
for(const id of presentHqOnly){
  assert.equal(battalions[id].allowInNonArmyHq,false,`${id} must retain/recover the source HQ-only restriction`);
  assert.ok(!ordinaryBattalions.includes(id),`${id} must be excluded from normal division templates`);
  for(const ids of Object.values(groups))assert.ok(!ids.includes(id),`${id} must not appear in the normal battalion picker`);
}
assert.equal(HQ_LINE_ELIGIBILITY_1193_META.evidence,'unvalidated','mirror-recovered structural flags must not be promoted to game-file exact');

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

const infantryRegimental=['fire_support','mot_fire_support','field_guns','rocket_battery','anti_air_battery','anti_tank_battery'];
const armoredRegimental=['mot_fire_support','light_tank_destroyer_support','medium_tank_destroyer_support','heavy_tank_destroyer_support','modern_tank_destroyer_support','light_sp_anti_air_support','medium_sp_anti_air_support','heavy_sp_anti_air_support','modern_sp_anti_air_support'];
const expectedRegimentalByGroup={
  infantry:infantryRegimental,
  combat_support:infantryRegimental,
  mobile:infantryRegimental,
  mobile_combat_support:armoredRegimental,
  armor:armoredRegimental,
  armor_combat_support:armoredRegimental
};
for(const [group,expected] of Object.entries(expectedRegimentalByGroup)){
  const actual=REGIMENTAL_SUPPORT_IDS_1193.filter(id=>regimentalSupportAllowed(id,supports[id],group));
  assert.deepEqual(actual,expected,`${group} Regimental Support choices must match the exact 1.19.3 allowed_battalion_groups matrix`);
}




const supportGroups=supportCompanyPickerGroups(supports,Object.keys(supports).filter(id=>!supports[id]?.regimentalSupport));
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
assert.match(main,/BASE_DIVISION_BATTALIONS=ordinaryDivisionBattalionIds\(battalions\)/,'normal Division Designer must derive a structural battalion allowlist');
assert.match(main,/battalionPickerGroups\(battalions,BASE_DIVISION_BATTALIONS\)/,'Division Designer picker should use the ordinary-division battalion allowlist');
assert.match(main,/supportCompanyPickerGroups\(supports,BASE_DIVISIONAL_SUPPORTS\)/,'support company picker should be grouped instead of rendered as one unsorted wall');
assert.doesNotMatch(main,/'Armored Battalions':\['light_armor','medium_armor','heavy_armor'\]/,'armor picker must not be hardcoded to only three tank battalions');
assert.match(main,/data-regimental-choice=/,'regimental support choices should use a dedicated click binding');
assert.match(main,/assignRegimentalSupport\(state,side,column,value/,'regimental support click binding should mutate the selected regiment explicitly');
assert.match(main,/normalizeGrid\(state\[key\],BASE_DIVISION_BATTALIONS,battalions\)/,'designer normalization must reject HQ-only battalions from saved grids');

console.log('Division Designer live regression checks passed.');

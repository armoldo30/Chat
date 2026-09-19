import assert from 'node:assert/strict';
import BUILTIN_1193 from '../src/builtin1193.js';
import { hydrateGameData } from '../src/gameData.js';
import { regimentGroupForUnit } from '../src/regiment-groups.js';
import { normalDivisionBattalionIds, battalionPickerGroups } from '../src/division-designer-options.js';
import { HQ_ONLY_LINE_BATTALIONS_1193, HQ_LINE_ELIGIBILITY_1193_META } from '../src/builtin1193/hq-line-eligibility-1193.js';
import {
  REGIMENTAL_SUPPORT_IDS_1193,
  applyRegimentalSupportCompatibilityFallback,
  regimentalSupportAllowed
} from '../src/regimental-support-1193.js';

const battalions={},supports={},equipment={},terrain={};
hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});
applyRegimentalSupportCompatibilityFallback(supports);

assert.equal(HQ_LINE_ELIGIBILITY_1193_META.evidence,'unvalidated','mirror-backed HQ eligibility recovery must not be promoted to game-file exact');
assert.equal(HQ_LINE_ELIGIBILITY_1193_META.source,'public-1.19.3-source-mirror-cross-check');

const presentHqOnly=HQ_ONLY_LINE_BATTALIONS_1193.filter(id=>battalions[id]);
assert.ok(presentHqOnly.length>=6,'bundled runtime should contain the retained HQ-only line battalions used by this regression');

const normalIds=new Set(normalDivisionBattalionIds(battalions));
const pickerIds=new Set(Object.values(battalionPickerGroups(battalions)).flat());
for(const id of presentHqOnly){
  assert.equal(battalions[id].allowInArmyHq,true,`${id} should retain/recover Army-HQ eligibility`);
  assert.equal(battalions[id].allowInNonArmyHq,false,`${id} must be structurally excluded from ordinary divisions`);
  assert.equal(normalIds.has(id),false,`${id} must not survive ordinary-division normalization`);
  assert.equal(pickerIds.has(id),false,`${id} must not appear in the ordinary Division Designer picker`);
}

const representative={
  infantry:'infantry',
  mobile:'motorized',
  combat_support:'artillery',
  mobile_combat_support:'mot_artillery_brigade',
  armor:'medium_armor',
  armor_combat_support:'medium_tank_destroyer_brigade'
};
for(const [group,id] of Object.entries(representative)){
  assert.ok(battalions[id],`representative battalion ${id} should exist`);
  assert.equal(regimentGroupForUnit(id,battalions[id]),group,`${id} must map to source regiment group ${group}`);
  assert.ok(normalIds.has(id),`${id} should remain available in normal divisions`);
}

const footSupports=[
  'fire_support','mot_fire_support','field_guns','rocket_battery','anti_air_battery','anti_tank_battery'
];
const armoredSupports=[
  'mot_fire_support',
  'light_tank_destroyer_support','medium_tank_destroyer_support','heavy_tank_destroyer_support','modern_tank_destroyer_support',
  'light_sp_anti_air_support','medium_sp_anti_air_support','heavy_sp_anti_air_support','modern_sp_anti_air_support'
];
const expectedByGroup={
  infantry:footSupports,
  mobile:footSupports,
  combat_support:footSupports,
  mobile_combat_support:armoredSupports,
  armor:armoredSupports,
  armor_combat_support:armoredSupports
};

assert.equal(REGIMENTAL_SUPPORT_IDS_1193.length,14);
for(const [group,expected] of Object.entries(expectedByGroup)){
  const actual=REGIMENTAL_SUPPORT_IDS_1193.filter(id=>regimentalSupportAllowed(id,supports[id],group)).sort();
  assert.deepEqual(actual,[...expected].sort(),`Regimental Support options for ${group} must match the 1.19.3 source compatibility matrix`);
}

console.log('1.19.3 Regimental Support compatibility and normal-division eligibility regression passed.');

import assert from 'node:assert/strict';
import BUILTIN_1193 from '../src/builtin1193.js';
import supportA from '../src/builtin1193/support-subunits-complete-a.js';
import supportB from '../src/builtin1193/support-subunits-complete-b.js';
import supportLabels from '../src/builtin1193/support-localization-complete-1193.js';
import { BUILTIN_ENGLISH_LOCALIZATION_1193, BUILTIN_ENGLISH_LOCALIZATION_1193_META } from '../src/builtin1193/localization-english-1193.js';
import { hydrateGameData, importedRegimentalSupportIds, importedDivisionalSupportIds } from '../src/gameData.js';
import { applyRegimentalSupportCompatibilityFallback, REGIMENTAL_SUPPORT_IDS_1193, REGIMENTAL_SUPPORT_ABBREVIATIONS_1193, REGIMENTAL_SUPPORT_COMPATIBILITY_1193 } from '../src/regimental-support-1193.js';
import { supportCompaniesConflict, supportCompanyAllowedWithSelection, normalizeSupportCompanySelection } from '../src/division-designer-options.js';

const audited={...supportA,...supportB};
const auditedIds=Object.keys(audited).sort();
const regimentalSource=auditedIds.filter(id=>audited[id].categories?.includes('category_regimental_support_battalions'));
const divisionalSource=auditedIds.filter(id=>audited[id].categories?.includes('category_divisional_support_battalions'));
const hqOnly=divisionalSource.filter(id=>audited[id].allowInNonArmyHq===false);
const normalDivisional=divisionalSource.filter(id=>audited[id].allowInNonArmyHq!==false&&!audited[id].categories?.includes('category_regimental_support_battalions'));

assert.equal(auditedIds.length,68,'audited 1.19.3 support-category source census should contain 68 unique sub-units');
assert.equal(regimentalSource.length,14,'1.19.3 regimental support census should contain 14 source units');
assert.equal(divisionalSource.length,54,'1.19.3 divisional-support category census should contain 54 source units including HQ-only support');
assert.equal(hqOnly.length,11,'1.19.3 source should contain 11 Army-HQ-only support companies');
assert.equal(normalDivisional.length,43,'normal division support picker should contain 43 source-valid support companies');
assert.deepEqual(hqOnly.sort(),[
  'hq_air_liaison','hq_engineer','hq_field_hospital','hq_logistics','hq_maintenance','hq_military_police',
  'hq_naval_liaison','hq_recon','hq_signal','hq_specops','hq_support_company'
].sort());

assert.deepEqual(regimentalSource.sort(),[...REGIMENTAL_SUPPORT_IDS_1193].sort(),'regimental catalog must match the source-category census exactly');
for(const id of auditedIds){
  assert.ok(supportLabels[id]&&supportLabels[id]!==id,`audited support ${id} needs a player-facing English label`);
  assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1193[id],supportLabels[id],`support cross-check label must agree with the certified/retained runtime label for ${id}`);
}
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1193_META.auditedSupportLabelPrecedence,'certified-localisation-wins-cross-check-fills-only');

assert.equal(audited.fire_support.abbreviation,'FSC');
assert.equal(audited.mot_fire_support.abbreviation,'FSC');
assert.equal(audited.field_guns.abbreviation,'IFG');
assert.equal(audited.rocket_battery.abbreviation,'RBC');
assert.equal(audited.anti_air_battery.abbreviation,'RAA');
assert.equal(audited.anti_tank_battery.abbreviation,'RAT');
assert.deepEqual(REGIMENTAL_SUPPORT_ABBREVIATIONS_1193,{
  fire_support:'FSC',mot_fire_support:'FSC',field_guns:'IFG',rocket_battery:'RBC',
  anti_air_battery:'RAA',anti_tank_battery:'RAT',
  light_tank_destroyer_support:'LTD',medium_tank_destroyer_support:'MTD',heavy_tank_destroyer_support:'HTD',modern_tank_destroyer_support:'OTD',
  light_sp_anti_air_support:'LAA',medium_sp_anti_air_support:'MAA',heavy_sp_anti_air_support:'HAA',modern_sp_anti_air_support:'OAA'
});

for(const id of ['armored_engineer','assault_engineer','armored_maintenance','armored_signal','helicopter_transport','helicopter_recon','helicopter_field_hospital','motorized_military_police','winter_logistics_support','long_range_patrol_support','super_heavy_tank_destroyer_brigade','super_heavy_sp_artillery_brigade','super_heavy_sp_anti_air_brigade']){
  assert.ok(audited[id],`audit overlay must include previously omitted source support ${id}`);
}

const battalions={},supports={},equipment={},terrain={};
hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});
applyRegimentalSupportCompatibilityFallback(supports);
const runtimeReg=importedRegimentalSupportIds(supports).sort();
const runtimeDiv=importedDivisionalSupportIds(supports).sort();
assert.deepEqual(runtimeReg,regimentalSource.sort(),'runtime regimental picker must be category-derived from the audited 1.19.3 catalog');
assert.equal(runtimeDiv.length,43,'runtime normal divisional support picker must exclude all 11 HQ-only supports');
const runtimeDivGameIds=runtimeDiv.map(id=>supports[id]?.gameId||id).sort();
for(const id of hqOnly)assert.ok(!runtimeDivGameIds.includes(id),`HQ-only support ${id} must not appear in a normal division support slot`);
assert.deepEqual(runtimeDivGameIds,[...normalDivisional].sort(),'normal support picker must map one-to-one onto the 43 audited source-valid support companies');

for(const id of REGIMENTAL_SUPPORT_IDS_1193){
  assert.deepEqual(supports[id].allowedBattalionGroups,REGIMENTAL_SUPPORT_COMPATIBILITY_1193[id],`${id} must retain exact source allowed_battalion_groups`);
  const source=audited[id],packed=BUILTIN_1193.subUnits[id];
  for(const field of ['hp','org','manpower','supply','soft','hard','def','breakthrough','airAttack','armor','piercing']){
    if(source[field]!==undefined)assert.equal(packed[field],source[field],`${id} raw ${field} should match audited source overlay`);
  }
  assert.deepEqual(packed.need,source.need,`${id} raw equipment need should match audited source overlay`);
}

assert.equal(supportLabels.light_flame_tank,'Light Flame Tank Company');
assert.equal(supportLabels.medium_flame_tank,'Medium Flame Tank Company');
assert.equal(supportLabels.heavy_flame_tank,'Heavy Flame Tank Company');

assert.equal(supportCompaniesConflict('recon',supports.recon,'mot_recon',supports.mot_recon),true,'recon variants share the source same_support_type');
assert.equal(supportCompaniesConflict('engineer',supports.engineer,'armored_engineer',supports.armored_engineer),true,'engineer variants share the source same_support_type');
assert.equal(supportCompaniesConflict('logistics',supports.logistics,'helicopter_transport',supports.helicopter_transport),true,'helicopter transport conflicts with ordinary logistics by source same_support_type');
assert.equal(supportCompaniesConflict('artillery',supports.artillery,'anti_air',supports.anti_air),false);
assert.equal(supportCompaniesConflict('base',{id:'base',sameSupportType:[]},'variant',{id:'variant',sameSupportType:['base']}),true,'one-sided source same_support_type must match the other record identity');
assert.equal(supportCompaniesConflict('variant',{id:'variant',sameSupportType:['base']},'base',{id:'base',sameSupportType:[]}),true,'support-type conflict must remain symmetric even when only one source record names the family');
assert.equal(supportCompanyAllowedWithSelection('mot_recon',supports,['engineer','recon'],-1),false);
assert.deepEqual(normalizeSupportCompanySelection(['recon','mot_recon','engineer','armored_engineer','support_artillery'],supports,runtimeDiv,5),['recon','engineer','support_artillery']);

assert.equal(BUILTIN_1193.meta.auditedSupportSubUnitCount,68);
assert.equal(BUILTIN_1193.meta.auditedSupportRecoveryPrecedence,'certified-retained-values-win');
console.log('HOI4 1.19.3 support-company census and structural audit passed');

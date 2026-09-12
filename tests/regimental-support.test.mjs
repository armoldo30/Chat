import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import BUILTIN from '../src/builtin1192.js';
import { parseClausewitz, extractSubUnits } from '../src/parser.js';
import { classifySubUnit, hydrateGameData, importedRegimentalSupportIds } from '../src/gameData.js';
import { REGIMENTAL_SUPPORT_IDS_1192, REGIMENTAL_SUPPORT_LABELS_1192, REGIMENTAL_SUPPORT_COMPATIBILITY_1192, REGIMENTAL_SUPPORT_COMPATIBILITY_META, applyRegimentalSupportCompatibilityFallback, regimentalSupportAllowed, supportAllowedBattalionGroups } from '../src/regimental-support-1192.js';

const fixture=extractSubUnits(parseClausewitz(`sub_units={
  test_reg={ group=support combat_width=0 allowed_battalion_groups={ infantry combat_support mobile } divisional=no categories={ category_support_battalions category_regimental_support_battalions } same_support_type=foo same_support_type=bar battalion_mult={ category=category_all_infantry max_strength=0.1 } }
  explicit_no={ group=support combat_width=0 regimental=no categories={ category_support_battalions category_regimental_support_battalions } }
}`));
assert.deepEqual(fixture.test_reg.allowedBattalionGroups,['infantry','combat_support','mobile']);
assert.equal(fixture.test_reg.divisional,false);
assert.deepEqual(fixture.test_reg.sameSupportType,['foo','bar']);
assert.equal(fixture.test_reg.battalionMult.length,1);
assert.equal(classifySubUnit(fixture.test_reg).regimental,true);
assert.equal(classifySubUnit(fixture.explicit_no).regimental,false,'explicit regimental=no must override category fallback');

assert.equal(REGIMENTAL_SUPPORT_IDS_1192.length,14,'1.19.2 regimental support catalog should contain the 14 retained vanilla unit IDs');
assert.equal(Object.keys(REGIMENTAL_SUPPORT_COMPATIBILITY_1192).length,14,'bundled fallback should cover all reconstructed 1.19.2 regimental support IDs');
assert.equal(REGIMENTAL_SUPPORT_COMPATIBILITY_META.authoritativeSourceRetained,false,'fallback must not be mislabeled source exact');
assert.equal(REGIMENTAL_SUPPORT_COMPATIBILITY_META.displayNameEvidence,'public-localization-cross-check');
assert.equal(REGIMENTAL_SUPPORT_LABELS_1192.fire_support,'Heavy Weapons Company');
assert.equal(REGIMENTAL_SUPPORT_LABELS_1192.mot_fire_support,'Motorized Heavy Weapons Company');
assert.equal(REGIMENTAL_SUPPORT_LABELS_1192.field_guns,'Infantry Guns');
assert.equal(REGIMENTAL_SUPPORT_LABELS_1192.rocket_battery,'Regimental Rocket Battery');
assert.equal(regimentalSupportAllowed('field_guns',{},'infantry'),true);
assert.equal(regimentalSupportAllowed('field_guns',{},'armor'),false);
assert.equal(regimentalSupportAllowed('mot_fire_support',{},'armor'),true);
assert.equal(regimentalSupportAllowed('light_tank_destroyer_support',{},'armor_combat_support'),true);
assert.equal(regimentalSupportAllowed('light_tank_destroyer_support',{},'infantry'),false);
assert.deepEqual(supportAllowedBattalionGroups('field_guns',{allowedBattalionGroups:['armor']}).groups,['armor'],'imported source structure must override bundled fallback');

const battalions={},supports={},equipment={},terrain={};
hydrateGameData(BUILTIN,{battalions,supports,equipment,terrain},{year:1940});
const ids=importedRegimentalSupportIds(supports).sort();
for(const id of REGIMENTAL_SUPPORT_IDS_1192)assert.ok(ids.includes(id),`bundled regimental support ${id} should exist in the 1.19.2 pack`);
const applied=applyRegimentalSupportCompatibilityFallback(supports);
assert.ok(applied>0,'compact built-in data should receive a compatibility fallback');
assert.deepEqual(supports.field_guns.allowedBattalionGroups,['infantry','mobile','combat_support']);
assert.equal(supports.field_guns.regimentalCompatibilitySource,'planner-analytical-cross-check');
assert.equal(supports.field_guns.name,'Infantry Guns');
assert.equal(supports.fire_support.name,'Heavy Weapons Company');
assert.equal(supports.mot_fire_support.name,'Motorized Heavy Weapons Company');
assert.equal(supports.support_artillery?.regimentalSupport,false,'ordinary divisional support artillery must not become regimental');
assert.equal(supports.engineer?.regimentalSupport,false,'engineers must remain divisional support only');

const [main,parser,gameData]=await Promise.all([
  readFile(new URL('../src/main.js',import.meta.url),'utf8'),
  readFile(new URL('../src/parser.js',import.meta.url),'utf8'),
  readFile(new URL('../src/gameData.js',import.meta.url),'utf8')
]);
assert.match(main,/regimentalSupportAllowed/,'designer should consume structural regimental compatibility');
assert.match(main,/value&&regimentalBaselineCompatible/,'picker should reject incompatible regimental support');
assert.match(main,/filledInRegiment\(state\[side\+'Grid'\],c\)>=3/,'invalid saved regimental support should be cleaned when the regiment changes');
assert.match(parser,/allowedBattalionGroups:items\(raw\.allowed_battalion_groups\)/,'imports should preserve allowed_battalion_groups');
assert.match(gameData,/allowedBattalionGroups:\[\.\.\.\(kind\.allowedBattalionGroups\|\|\[\]\)\]/,'hydration should retain imported group compatibility');

console.log('Regimental support structural and naming regression checks passed.');

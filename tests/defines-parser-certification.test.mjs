import assert from 'node:assert/strict';
import { parseDefinesLua, parseDefinesLuaAssignments, buildDataPack, defineOverrides } from '../src/parser.js';

const nested=`NDefines = {
 NMilitary = {
  BASE_CHANCE_TO_AVOID_HIT = 90,
  CHANCE_TO_AVOID_HIT_AT_NO_DEF = 60,
  BASE_NIGHT_ATTACK_PENALTY = -0.5,
  TEST_BOOL = true,
  TEST_STRING = "source-string",
  TEST_ARRAY = { 1, 2.5, -3 },
 }
 NProduction = {
  BASE_FACTORY_EFFICIENCY_GAIN = 1,
  MAX_MIL_FACTORIES_PER_LINE = 150,
 }
}`;
const parsed=parseDefinesLua(nested);
assert.equal(parsed.NMilitary.BASE_CHANCE_TO_AVOID_HIT,90);
assert.equal(parsed.NMilitary.CHANCE_TO_AVOID_HIT_AT_NO_DEF,60);
assert.equal(parsed.NMilitary.BASE_NIGHT_ATTACK_PENALTY,-.5);
assert.equal(parsed.NMilitary.TEST_BOOL,true);
assert.equal(parsed.NMilitary.TEST_STRING,'source-string');
assert.deepEqual(parsed.NMilitary.TEST_ARRAY,[1,2.5,-3]);
assert.equal(parsed.NProduction.MAX_MIL_FACTORIES_PER_LINE,150);

const graphics=`NDefines_Graphics = { NMapMode = { TEST_STRING = "graphics" TEST_ARRAY = { 4, 5 } } }`;
assert.equal(parseDefinesLua(graphics).NMapMode.TEST_STRING,'graphics');
assert.deepEqual(parseDefinesLua(graphics).NMapMode.TEST_ARRAY,[4,5]);

const dotted=`-- override style
NDefines.NMilitary.BASE_NIGHT_ATTACK_PENALTY = -0.50 -- inline comment
NDefines.NMilitary.COMBAT_OVER_WIDTH_PENALTY = -1
NDefines.NMilitary.COMBAT_OVER_WIDTH_PENALTY_MAX = -0.33
NDefines.NProduction.PRODUCTION_RESOURCE_LACK_PENALTY = -0.05
NDefines.NMilitary.TEST_ARRAY = { 9, 10 }
`;
const overrides=parseDefinesLua(dotted);
assert.equal(overrides.NMilitary.COMBAT_OVER_WIDTH_PENALTY,-1);
assert.equal(overrides.NMilitary.COMBAT_OVER_WIDTH_PENALTY_MAX,-.33);
assert.equal(overrides.NProduction.PRODUCTION_RESOURCE_LACK_PENALTY,-.05);
assert.deepEqual(overrides.NMilitary.TEST_ARRAY,[9,10]);
assert.ok(parseDefinesLuaAssignments(dotted).every((item,index)=>item.order===index+1));

const fake=(name,path,text)=>({name,webkitRelativePath:path,text:async()=>text});
const pack=await buildDataPack([
 fake('00_defines.lua','common/defines/00_defines.lua',nested),
 fake('zz_override.lua','common/defines/zz_override.lua',dotted)
]);
assert.equal(pack.meta.defineFiles,2,'both define files must be inventoried');
assert.equal(pack.defines.NMilitary.BASE_NIGHT_ATTACK_PENALTY,-.5,'later define files must override earlier values');
assert.equal(pack.defines.NProduction.MAX_MIL_FACTORIES_PER_LINE,150);
assert.equal(pack.defineProvenance['NMilitary.BASE_NIGHT_ATTACK_PENALTY'].length,2,'override provenance must retain both source-file observations');
assert.equal(pack.defineProvenance['NMilitary.BASE_NIGHT_ATTACK_PENALTY'].at(-1).sourceFile,'common/defines/zz_override.lua');
assert.ok(pack.defineProvenance['NMilitary.BASE_NIGHT_ATTACK_PENALTY'].at(-1).assignmentOrder>pack.defineProvenance['NMilitary.BASE_NIGHT_ATTACK_PENALTY'][0].assignmentOrder);

const combat={armorWeights:{max:.1,average:.9},piercingWeights:{max:.1,average:.9}},production={maxLineResourcePenalty:.9};
const mapped={defines:{NMilitary:{
 BASE_CHANCE_TO_AVOID_HIT:90,CHANCE_TO_AVOID_HIT_AT_NO_DEF:60,
 COMBAT_OVER_WIDTH_PENALTY:-1,COMBAT_OVER_WIDTH_PENALTY_MAX:-.33,
 COMBAT_STACKING_START:5,COMBAT_STACKING_EXTRA:3,COMBAT_STACKING_PENALTY:-.02,
 BASE_FORT_PENALTY:-.15,DIG_IN_FACTOR:.02,ENEMY_AIR_SUPERIORITY_IMPACT:-.35,BASE_NIGHT_ATTACK_PENALTY:-.5,
 LAND_COMBAT_ORG_DICE_SIZE:4,LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE:6,LAND_COMBAT_STR_DICE_SIZE:2,
 LAND_COMBAT_ORG_DAMAGE_MODIFIER:.053,LAND_COMBAT_STR_DAMAGE_MODIFIER:.060,COMBAT_MINIMUM_TIME:4,EQUIPMENT_COMBAT_LOSS_FACTOR:.7,
 ARMOR_VS_AVERAGE:.4,PEN_VS_AVERAGE:.4
},NProduction:{BASE_FACTORY_EFFICIENCY_GAIN:1,PRODUCTION_RESOURCE_LACK_PENALTY:-.05,MAX_MIL_FACTORIES_PER_LINE:150}}};
const result=defineOverrides(mapped,combat,production);
assert.equal(result.combatCount,20,'all 20 planner-consumed source-exact military defines must map');
assert.equal(result.productionCount,3,'two direct production values plus the explicitly inferred efficiency scale must map');
assert.ok(Math.abs(combat.defendedHitChance-.1)<1e-12);
assert.ok(Math.abs(combat.undefendedHitChance-.4)<1e-12);
assert.equal(combat.nightAttackPenalty,.5);
assert.deepEqual(combat.armorWeights,{max:.4,average:.6});
assert.deepEqual(combat.piercingWeights,{max:.4,average:.6});
assert.equal(production.efficiencyBaseGain,.001);
assert.equal(production.resourceLackPenaltyPerUnit,.05);
assert.equal(production.maxLineResourcePenalty,.9,'planner analytical resource cap is not overwritten by a nonexistent 1.19.2 source key');
assert.equal(production.maxMilitaryFactoriesPerLine,150);
console.log('Defines parser/mapping certification passed.');

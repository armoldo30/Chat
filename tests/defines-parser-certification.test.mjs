import assert from 'node:assert/strict';
import { parseDefinesLua, buildDataPack, defineOverrides } from '../src/parser.js';

const nested=`NDefines = {
 NMilitary = {
  BASE_CHANCE_TO_AVOID_HIT = 90,
  CHANCE_TO_AVOID_HIT_AT_NO_DEF = 60,
  BASE_NIGHT_ATTACK_PENALTY = -0.5,
  TEST_BOOL = true,
 }
 NProduction = {
  MAX_MIL_FACTORIES_PER_LINE = 150,
  MAX_LINE_RESOURCE_PENALTY = 90,
 }
}`;
const parsed=parseDefinesLua(nested);
assert.equal(parsed.NMilitary.BASE_CHANCE_TO_AVOID_HIT,90);
assert.equal(parsed.NMilitary.CHANCE_TO_AVOID_HIT_AT_NO_DEF,60);
assert.equal(parsed.NMilitary.BASE_NIGHT_ATTACK_PENALTY,-.5);
assert.equal(parsed.NMilitary.TEST_BOOL,true);
assert.equal(parsed.NProduction.MAX_MIL_FACTORIES_PER_LINE,150);
assert.equal(parsed.NProduction.MAX_LINE_RESOURCE_PENALTY,90);

const dotted=`-- override style
NDefines.NMilitary.BASE_NIGHT_ATTACK_PENALTY = -0.50 -- inline comment
NDefines.NMilitary.COMBAT_OVER_WIDTH_PENALTY = -1
NDefines.NMilitary.COMBAT_OVER_WIDTH_PENALTY_MAX = -0.33
NDefines.NProduction.PRODUCTION_RESOURCE_LACK_PENALTY = -0.05
`;
const overrides=parseDefinesLua(dotted);
assert.equal(overrides.NMilitary.COMBAT_OVER_WIDTH_PENALTY,-1);
assert.equal(overrides.NMilitary.COMBAT_OVER_WIDTH_PENALTY_MAX,-.33);
assert.equal(overrides.NProduction.PRODUCTION_RESOURCE_LACK_PENALTY,-.05);

const fake=(name,path,text)=>({name,webkitRelativePath:path,text:async()=>text});
const pack=await buildDataPack([
 fake('00_defines.lua','common/defines/00_defines.lua',nested),
 fake('zz_override.lua','common/defines/zz_override.lua',dotted)
]);
assert.equal(pack.meta.defineFiles,2,'both define files must be inventoried');
assert.equal(pack.defines.NMilitary.BASE_NIGHT_ATTACK_PENALTY,-.5,'later define files must override earlier values');
assert.equal(pack.defines.NProduction.MAX_MIL_FACTORIES_PER_LINE,150);

const combat={armorWeights:{max:.1,average:.9},piercingWeights:{max:.1,average:.9}},production={};
const mapped={defines:{NMilitary:{
 BASE_CHANCE_TO_AVOID_HIT:90,CHANCE_TO_AVOID_HIT_AT_NO_DEF:60,
 COMBAT_OVER_WIDTH_PENALTY:-1,COMBAT_OVER_WIDTH_PENALTY_MAX:-.33,
 COMBAT_STACKING_START:8,COMBAT_STACKING_EXTRA:4,COMBAT_STACKING_PENALTY:-.02,
 BASE_FORT_PENALTY:-.15,DIG_IN_FACTOR:.02,ENEMY_AIR_SUPERIORITY_IMPACT:-.35,BASE_NIGHT_ATTACK_PENALTY:-.5,
 LAND_COMBAT_ORG_DICE_SIZE:4,LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE:6,LAND_COMBAT_STR_DICE_SIZE:2,
 LAND_COMBAT_ORG_DAMAGE_MODIFIER:.05,LAND_COMBAT_STR_DAMAGE_MODIFIER:.05,COMBAT_MINIMUM_TIME:4,EQUIPMENT_COMBAT_LOSS_FACTOR:.7,
 ARMOR_VS_AVERAGE:.4,PEN_VS_AVERAGE:.4
},NProduction:{PRODUCTION_RESOURCE_LACK_PENALTY:-.05,MAX_LINE_RESOURCE_PENALTY:90,MAX_MIL_FACTORIES_PER_LINE:150}}};
const result=defineOverrides(mapped,combat,production);
assert.equal(result.combatCount,20,'all 20 planner-consumed direct combat define mappings must apply');
assert.equal(result.productionCount,3,'three production defines map directly; efficiency gain remains formula-deferred');
assert.equal(combat.defendedHitChance,.1);
assert.equal(combat.undefendedHitChance,.4);
assert.equal(combat.nightAttackPenalty,.5);
assert.deepEqual(combat.armorWeights,{max:.4,average:.6});
assert.deepEqual(combat.piercingWeights,{max:.4,average:.6});
assert.equal(production.resourceLackPenaltyPerUnit,.05);
assert.equal(production.maxLineResourcePenalty,.9);
assert.equal(production.maxMilitaryFactoriesPerLine,150);
console.log('Defines parser/mapping certification passed.');

import assert from 'node:assert/strict';
import BUILTIN_1192 from '../src/builtin1192.js';
import { COMBAT_CONSTANTS, PRODUCTION_CONSTANTS, battalions, supports, terrain } from '../src/data.js';
import { calcDivision, aggregateDivision, battleContext } from '../src/engine.js';
import { DEFINE_VALUES_1192 } from '../src/builtin1192/defines-certification-1192.js';

const mil=DEFINE_VALUES_1192.NMilitary,prod=DEFINE_VALUES_1192.NProduction;
assert.equal(COMBAT_CONSTANTS.defendedHitChance,1-mil.BASE_CHANCE_TO_AVOID_HIT/100);
assert.equal(COMBAT_CONSTANTS.undefendedHitChance,1-mil.CHANCE_TO_AVOID_HIT_AT_NO_DEF/100);
assert.equal(COMBAT_CONSTANTS.overWidthPenaltyCap,Math.abs(mil.COMBAT_OVER_WIDTH_PENALTY_MAX));
assert.equal(COMBAT_CONSTANTS.overWidthPenaltyMultiplier,Math.abs(mil.COMBAT_OVER_WIDTH_PENALTY));
assert.equal(COMBAT_CONSTANTS.stackingLimitBase,5);
assert.equal(COMBAT_CONSTANTS.stackingLimitPerDirection,3);
assert.equal(COMBAT_CONSTANTS.stackingPenaltyPerDivision,Math.abs(mil.COMBAT_STACKING_PENALTY));
assert.equal(COMBAT_CONSTANTS.fortPenaltyPerLevel,Math.abs(mil.BASE_FORT_PENALTY));
assert.equal(COMBAT_CONSTANTS.entrenchmentPerPoint,Math.abs(mil.DIG_IN_FACTOR));
assert.equal(COMBAT_CONSTANTS.maxAirSuperiorityPenalty,Math.abs(mil.ENEMY_AIR_SUPERIORITY_IMPACT));
assert.equal(COMBAT_CONSTANTS.nightAttackPenalty,.5);
assert.equal(COMBAT_CONSTANTS.orgDamageModifier,.053);
assert.equal(COMBAT_CONSTANTS.strengthDamageModifier,.060);
assert.equal(COMBAT_CONSTANTS.orgDice,mil.LAND_COMBAT_ORG_DICE_SIZE);
assert.equal(COMBAT_CONSTANTS.armoredOrgDice,mil.LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE);
assert.equal(COMBAT_CONSTANTS.strengthDice,mil.LAND_COMBAT_STR_DICE_SIZE);
assert.equal(COMBAT_CONSTANTS.combatMinimumHours,mil.COMBAT_MINIMUM_TIME);
assert.equal(COMBAT_CONSTANTS.equipmentCombatLossFactor,mil.EQUIPMENT_COMBAT_LOSS_FACTOR);
assert.deepEqual(COMBAT_CONSTANTS.armorWeights,{max:mil.ARMOR_VS_AVERAGE,average:1-mil.ARMOR_VS_AVERAGE});
assert.deepEqual(COMBAT_CONSTANTS.piercingWeights,{max:mil.PEN_VS_AVERAGE,average:1-mil.PEN_VS_AVERAGE});
assert.equal(PRODUCTION_CONSTANTS.resourceLackPenaltyPerUnit,Math.abs(prod.PRODUCTION_RESOURCE_LACK_PENALTY));
assert.equal(PRODUCTION_CONSTANTS.maxLineResourcePenalty,1,'Production formulas audit supersedes the provisional Defines-only 90% analytical cap');
assert.equal(PRODUCTION_CONSTANTS.maxMilitaryFactoriesPerLine,prod.MAX_MIL_FACTORIES_PER_LINE);
assert.equal(PRODUCTION_CONSTANTS.efficiencyBaseGain,.001,'daily efficiency scale is Production-audited executable-inferred');

for(const [group,values] of Object.entries(DEFINE_VALUES_1192))for(const [key,value] of Object.entries(values)){
  assert.equal(BUILTIN_1192.defines?.[group]?.[key],value,`built-in define ${group}.${key} must match the exact retained 1.19.2 source map`);
}
assert.equal(BUILTIN_1192.meta.definesCertification,'game-file-exact-consumed-defines');
assert.equal(BUILTIN_1192.meta.plannerConsumedDefineCount,23);

const a=aggregateDivision(calcDivision([{type:'infantry',count:10}],battalions,[],supports),1);
const d=aggregateDivision(calcDivision([{type:'infantry',count:10}],battalions,[],supports),1);
const opts={terrain:'plains',terrainData:terrain,directions:0,entrench:0,fort:0,river:0,asupply:1,dsupply:1,air:0,cas:0,planning:0,night:0};
const day=battleContext(a,d,opts),night=battleContext(a,d,{...opts,night:1});
assert.ok(Math.abs(night.aAttack/day.aAttack-.5)<1e-12,'full-night land attack must use the exact 50% 1.19.2 base night penalty');
assert.ok(Math.abs(night.dAttack/day.dAttack-.5)<1e-12,'night penalty must apply symmetrically before side-specific bonuses');
console.log('Defines runtime certification passed.');

import { DEFINE_VALUES_1192, DEFINES_SOURCE_1192 } from './defines-certification-1192.js';
import { SUBUNIT_TERRAIN_SOURCE_1192 } from './subunit-terrain-1192.js';

const M=DEFINE_VALUES_1192.NMilitary;
export const COMBAT_SOURCE_1192=Object.freeze({
  gameVersion:'1.19.2',
  definesSha256:DEFINES_SOURCE_1192.sourceFiles[0].sha256,
  piercingThresholds:M.PIERCING_THRESHOLDS,
  piercingDamageValues:M.PIERCING_THRESHOLD_DAMAGE_VALUES,
  armoredSoftOrgDice:M.LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE,
  armoredSoftStrengthDice:M.LAND_COMBAT_STR_ARMOR_ON_SOFT_DICE_SIZE,
  airSuperiorityAaMaxMitigation:M.ENEMY_AIR_SUPERIORITY_DEFENSE,
  airSuperiorityAaSteepness:M.ENEMY_AIR_SUPERIORITY_DEFENSE_STEEPNESS,
  airSupportBase:M.AIR_SUPPORT_BASE,
  basePlanningMax:M.PLANNING_MAX,
  supplyLack:{
    attackerAttack:M.COMBAT_SUPPLY_LACK_ATTACKER_ATTACK,
    attackerDefend:M.COMBAT_SUPPLY_LACK_ATTACKER_DEFEND,
    defenderAttack:M.COMBAT_SUPPLY_LACK_DEFENDER_ATTACK,
    defenderDefend:M.COMBAT_SUPPLY_LACK_DEFENDER_DEFEND
  },
  river:{small:M.RIVER_CROSSING_PENALTY,large:M.RIVER_CROSSING_PENALTY_LARGE},
  subUnitTerrain:SUBUNIT_TERRAIN_SOURCE_1192
});

export const COMBAT_EXECUTABLE_1192=Object.freeze({
  combatPointScale:0.1,
  classifications:{
    combatPointScale:'executable-inferred',
    supplySatisfactionInterpolation:'executable-inferred planner-input mapping',
    terrainAggregation:'executable-inferred',
    planningApplication:'executable-inferred',
    nightPenaltyOffset:'executable-inferred',
    aaAirSuperiorityMitigation:'source-described formula / executable-inferred ordering',
    casGroundSupport:'source-constrained executable-inferred'
  }
});

export const COMBAT_ANALYTICAL_1192=Object.freeze({
  simulationSafetyHours:720,
  normalizedInputs:['attacker supply satisfaction','defender supply satisfaction','air-superiority advantage','attacker CAS support presence','night fraction','effective planning bonus'],
  aggregateApproximations:['engaged identical-division aggregation','reserve organization/HP depth','no per-division reinforcement timing','no target selection/coordination','no combat-tactic execution','no direct CAS bombing damage','no weather/commander/intel combat resolver']
});

export const COMBAT_FORMULAS_CERTIFICATION_1192=Object.freeze({
  gameVersion:'1.19.2',
  classification:'bounded source-certified combat formulas with executable-inferred land-combat resolution',
  sourceExact:{
    consumedDefines:33,
    productionDefinesAlsoRetained:3,
    totalPlannerConsumedDefines:36,
    subUnitTerrainRecords:72,
    subUnitTerrainBlocks:514
  },
  corrections:[
    'convert attack/defense/breakthrough points to hourly combat points at stat / 10 before hit rolls',
    'replace one-size-fits-all supply penalty with four 1.19.2 attacker/defender attack/defend endpoints',
    'apply planning to attacker attack and breakthrough',
    'replace hardcoded 35% CAS support with 25% source baseline plus air_cas_present_factor',
    'apply CAS ground support to attacker attack and breakthrough',
    'change land_night_attack from multiplicative penalty reduction to additive penalty offset',
    'apply unit terrain attack modifiers to attacker attack/breakthrough and defense modifiers to defender attack/defense',
    'retain and consume exact river/fort unit terrain modifiers',
    'mitigate enemy-air defense/breakthrough penalty with divisional AA using the source-described diminishing-return curve',
    'remove the invented 10% minimum-strength combat-stat floor',
    'use armored organization dice only for soft hits when armor outclasses piercing',
    'replace the 168-hour hidden safety cutoff with an explicit 720-hour planner-analytical horizon'
  ],
  bounded:['exact hoi4.exe modifier ordering across every combat modifier','dynamic target selection and coordination','reinforcement timing/reserve rotation','combat tactics selection/counters','direct CAS damage and plane-count allocation','weather, commander skill, experience, intel and country combat modifiers']
});

export default COMBAT_FORMULAS_CERTIFICATION_1192;

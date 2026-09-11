export const DEFINE_VALUES_1192={
  NMilitary:{
    BASE_CHANCE_TO_AVOID_HIT:90,
    CHANCE_TO_AVOID_HIT_AT_NO_DEF:60,
    COMBAT_OVER_WIDTH_PENALTY:-1,
    COMBAT_OVER_WIDTH_PENALTY_MAX:-0.33,
    COMBAT_STACKING_START:5,
    COMBAT_STACKING_EXTRA:3,
    COMBAT_STACKING_PENALTY:-0.02,
    BASE_FORT_PENALTY:-0.15,
    DIG_IN_FACTOR:0.02,
    ENEMY_AIR_SUPERIORITY_IMPACT:-0.35,
    BASE_NIGHT_ATTACK_PENALTY:-0.50,
    LAND_COMBAT_ORG_DAMAGE_MODIFIER:0.053,
    LAND_COMBAT_STR_DAMAGE_MODIFIER:0.060,
    LAND_COMBAT_ORG_DICE_SIZE:4,
    LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE:6,
    LAND_COMBAT_STR_DICE_SIZE:2,
    COMBAT_MINIMUM_TIME:4,
    EQUIPMENT_COMBAT_LOSS_FACTOR:0.70,
    ARMOR_VS_AVERAGE:0.40,
    PEN_VS_AVERAGE:0.40,
    PIERCING_THRESHOLDS:[1.00,0.75,0.50,0.00],
    PIERCING_THRESHOLD_DAMAGE_VALUES:[1.00,0.80,0.65,0.50],
    LAND_COMBAT_STR_ARMOR_ON_SOFT_DICE_SIZE:2,
    ENEMY_AIR_SUPERIORITY_DEFENSE:0.75,
    ENEMY_AIR_SUPERIORITY_DEFENSE_STEEPNESS:625,
    AIR_SUPPORT_BASE:0.25,
    PLANNING_MAX:0.3,
    COMBAT_SUPPLY_LACK_ATTACKER_ATTACK:-0.25,
    COMBAT_SUPPLY_LACK_ATTACKER_DEFEND:-0.65,
    COMBAT_SUPPLY_LACK_DEFENDER_ATTACK:-0.35,
    COMBAT_SUPPLY_LACK_DEFENDER_DEFEND:-0.15,
    RIVER_CROSSING_PENALTY:-0.3,
    RIVER_CROSSING_PENALTY_LARGE:-0.6
  },
  NProduction:{
    BASE_FACTORY_EFFICIENCY_GAIN:1,
    PRODUCTION_RESOURCE_LACK_PENALTY:-0.05,
    MAX_MIL_FACTORIES_PER_LINE:150
  }
};

export const DEFINES_SUPERSEDED_ANALYTICAL_1192={
  historicalMaxLineResourcePenalty:{
    value:0.90,
    active:false,
    supersededBy:'Production formulas audit',
    replacement:'100% executable-inferred resource-shortage cap; individual factories may reach zero output'
  }
};

export const DEFINES_SOURCE_1192={
  gameVersion:'1.19.2',
  retainedSource:'HOI4-War-Planner-0.15.0-HANDOFF.zip/game-source/common/defines',
  sourceFiles:[
    {path:'common/defines/00_defines.lua',bytes:405669,sha256:'405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4',root:'NDefines',namespaceCount:28,directAssignments:3230,recursiveScalarLeaves:3848},
    {path:'common/defines/00_graphics.lua',bytes:89354,sha256:'dfdab0a5fad7319d7b5ac524d98af49d3a0c1f95772e6b7a76abce54836f3d86',root:'NDefines_Graphics',namespaceCount:9,directAssignments:1252,recursiveScalarLeaves:2128},
    {path:'common/defines/01_career_profile.lua',bytes:3101,sha256:'49a3c68dde41a092b1af94674db6369a7abcfc0445153bb9da248cdb3f5c8604',root:'NDefines_CareerProfile',namespaceCount:2,directAssignments:21,recursiveScalarLeaves:21}
  ],
  totalBytes:498124,
  namespaceCount:39,
  directAssignmentCount:4503,
  recursiveScalarLeafCount:5997,
  directValueTypes:{number:4124,boolean:42,string:22,table:315},
  duplicateAssignments:2,
  duplicateEffectiveValueChanges:0,
  duplicateDetails:[
    {namespace:'NMapIcons',key:'DEFAULT_PRIORITY_NAVAL_ACCIDENTS',value:13,occurrences:2},
    {namespace:'NMapIcons',key:'OPERATIVES_PRIORITY_NAVAL_ACCIDENTS',value:13,occurrences:2}
  ]
};

export const DEFINES_CERTIFICATION_1192={
  gameVersion:'1.19.2',
  classification:'game-file-exact-consumed-defines',
  sourceBoundary:{
    authoritativeRawGameDefinesRetained:true,
    fullDefinesCorpusCensused:true,
    plannerConsumedSourceDefineValues:36,
    plannerAnalyticalConstants:0,
    supersededPlannerAnalyticalConstants:1,
    note:'The preserved 1.19.2 handoff contains the authoritative common/defines corpus. Planner-consumed game-file values below are exact extractions from that corpus; executable transformations remain separately classified. The one provisional Production analytical placeholder created during the Defines phase has been retired by the downstream Production formulas audit.'
  },
  corrections:[
    {runtime:'COMBAT_CONSTANTS.nightAttackPenalty',before:0.75,after:0.50,source:'NMilitary.BASE_NIGHT_ATTACK_PENALTY'},
    {runtime:'COMBAT_CONSTANTS.stackingLimitBase',before:8,after:5,source:'NMilitary.COMBAT_STACKING_START'},
    {runtime:'COMBAT_CONSTANTS.stackingLimitPerDirection',before:4,after:3,source:'NMilitary.COMBAT_STACKING_EXTRA'},
    {runtime:'COMBAT_CONSTANTS.orgDamageModifier',before:0.05,after:0.053,source:'NMilitary.LAND_COMBAT_ORG_DAMAGE_MODIFIER'},
    {runtime:'COMBAT_CONSTANTS.strengthDamageModifier',before:0.05,after:0.060,source:'NMilitary.LAND_COMBAT_STR_DAMAGE_MODIFIER'}
  ],
  provenanceCorrections:[
    {runtime:'PRODUCTION_CONSTANTS.maxLineResourcePenalty',historicalValue:0.90,previousClaim:'NProduction.MAX_LINE_RESOURCE_PENALTY = 90',classification:'superseded-by-production-formulas',active:false,reason:'No MAX_LINE_RESOURCE_PENALTY assignment exists anywhere in the retained 1.19.2 common/defines corpus. The Production formulas audit supersedes the temporary 0.90 analytical placeholder with executable-inferred 100% starvation behavior.'}
  ],
  formulaDerived:{
    'PRODUCTION_CONSTANTS.efficiencyBaseGain':{runtimeValue:0.001,sourceDefine:'NProduction.BASE_FACTORY_EFFICIENCY_GAIN',sourceValue:1,classification:'executable-inferred',resolvedBy:'Production formulas audit',note:'The downstream Production formulas audit certifies the 0.001 runtime scale as part of the bounded nonlinear efficiency-growth formula.'}
  },
  formulaDeferred:[
    'exact define interaction/order inside combat formulas'
  ],
  combatResolvedBy:'Combat formulas audit'
};

export default DEFINES_CERTIFICATION_1192;

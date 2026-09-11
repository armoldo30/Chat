export const DEFINE_VALUES_1192={
  NMilitary:{
    BASE_CHANCE_TO_AVOID_HIT:90,
    CHANCE_TO_AVOID_HIT_AT_NO_DEF:60,
    COMBAT_OVER_WIDTH_PENALTY:-1,
    COMBAT_OVER_WIDTH_PENALTY_MAX:-0.33,
    COMBAT_STACKING_START:8,
    COMBAT_STACKING_EXTRA:4,
    COMBAT_STACKING_PENALTY:-0.02,
    BASE_FORT_PENALTY:-0.15,
    DIG_IN_FACTOR:0.02,
    ENEMY_AIR_SUPERIORITY_IMPACT:-0.35,
    BASE_NIGHT_ATTACK_PENALTY:-0.50,
    LAND_COMBAT_ORG_DAMAGE_MODIFIER:0.05,
    LAND_COMBAT_STR_DAMAGE_MODIFIER:0.05,
    LAND_COMBAT_ORG_DICE_SIZE:4,
    LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE:6,
    LAND_COMBAT_STR_DICE_SIZE:2,
    COMBAT_MINIMUM_TIME:4,
    EQUIPMENT_COMBAT_LOSS_FACTOR:0.70,
    ARMOR_VS_AVERAGE:0.40,
    PEN_VS_AVERAGE:0.40
  },
  NProduction:{
    BASE_FACTORY_EFFICIENCY_GAIN:1,
    PRODUCTION_RESOURCE_LACK_PENALTY:-0.05,
    MAX_LINE_RESOURCE_PENALTY:90,
    MAX_MIL_FACTORIES_PER_LINE:150
  }
};

export const DEFINES_CERTIFICATION_1192={
  gameVersion:'1.19.2',
  classification:'bounded-corroborated-source',
  sourceBoundary:{
    authoritativeRawGameDefinesRetained:false,
    plannerConsumedDefineValues:24,
    note:'The supplied compact audit corpus did not retain common/defines. Values below are limited to planner-consumed defines and are independently corroborated by modern vanilla-reference/mod source plus historical source continuity; they are not presented as a fingerprint of the complete 1.19.2 defines file.'
  },
  evidence:{
    exact1192Corroboration:[
      'blackwater26/hoi4-warfare-framework@1.19.2: common/defines/ww_air_balance.lua (vanilla over-width and supply-penalty comments)'
    ],
    currentVanillaCorroboration:[
      'MillenniumDawn/Millennium-Dawn: common/defines/MD_defines.lua (vanilla-reference comments for night, fort, air-superiority and other overridden values)',
      'Kaiserreich/Kaiserreich-HOI4: common/defines/KR_defines.lua (vanilla equipment-combat-loss reference)'
    ],
    continuityEvidence:[
      'cbrzeczysz/hoi4-history: common/defines/00_defines.lua (source-form definitions for long-lived combat/production constants)',
      'multiple current full-copy/mod defines agree on MAX_MIL_FACTORIES_PER_LINE=150, MAX_LINE_RESOURCE_PENALTY=90 and PRODUCTION_RESOURCE_LACK_PENALTY=-0.05'
    ]
  },
  corrections:[
    {runtime:'COMBAT_CONSTANTS.nightAttackPenalty',before:0.75,after:0.50,source:'NMilitary.BASE_NIGHT_ATTACK_PENALTY',reason:'stale planner constant; current vanilla reference is -0.50'}
  ],
  formulaDerived:{
    'PRODUCTION_CONSTANTS.efficiencyBaseGain':{runtimeValue:0.001,sourceDefine:'NProduction.BASE_FACTORY_EFFICIENCY_GAIN',sourceValue:1,classification:'executable-inferred',deferredTo:'Production formulas',note:'0.001 is a planner formula scale, not the literal define value.'}
  },
  formulaDeferred:[
    'piercingDamageFactor thresholds and partial-piercing damage factors',
    'supplyModifier interpolation',
    'planning multiplier/cap',
    'CAS land-combat multiplier',
    '168-hour simulation safety horizon',
    'exact define interaction/order inside combat and production formulas'
  ]
};

export default DEFINES_CERTIFICATION_1192;

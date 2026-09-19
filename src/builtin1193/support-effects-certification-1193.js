// Support-specific runtime coverage ledger for HOI4 1.19.3.
// This file separates source retention from executable/runtime interpretation.
// Evidence labels intentionally use the project's canonical vocabulary.

export const SUPPORT_EFFECT_RUNTIME_1193=Object.freeze({
  structural:Object.freeze({
    allowedBattalionGroups:Object.freeze({
      runtimeEvidence:'game-file exact',
      state:'consumed',
      note:'Regimental Support availability is filtered directly by retained allowed_battalion_groups.'
    }),
    sameSupportType:Object.freeze({
      runtimeEvidence:'game-file exact',
      state:'consumed',
      note:'Mutually exclusive support families are enforced from retained same_support_type relationships.'
    }),
    hqEligibility:Object.freeze({
      runtimeEvidence:'game-file exact',
      state:'consumed',
      note:'allow_in_non_army_hq excludes Army-HQ-only support from ordinary divisions.'
    }),
    requiredDlc:Object.freeze({
      runtimeEvidence:'planner analytical',
      state:'informational-only',
      note:'DLC/unlock requirements are displayed but deliberately not hard-locked in theorycraft mode.'
    })
  }),
  combat:Object.freeze({
    directCombatStats:Object.freeze({
      runtimeEvidence:'unvalidated',
      state:'consumed-by-existing-planner-model',
      fields:Object.freeze(['soft','hard','def','breakthrough','airAttack','armor','piercing','hp','org','manpower','supply']),
      note:'Source values are consumed by the existing division aggregation; this audit does not broaden executable-parity claims for their exact engine ordering.'
    }),
    terrainModifiers:Object.freeze({
      runtimeEvidence:'unvalidated',
      state:'consumed-by-existing-planner-model',
      note:'Support terrain attack/defense blocks are consumed, but support-specific executable stacking/order is not independently Oracle-validated.'
    }),
    initiative:Object.freeze({
      runtimeEvidence:'unvalidated',
      state:'aggregated-not-used-downstream',
      note:'Initiative is retained and summed by calcDivision but is not currently consumed by battle resolution.'
    }),
    recon:Object.freeze({
      runtimeEvidence:'unvalidated',
      state:'source-retained-not-executed'
    }),
    entrenchment:Object.freeze({
      runtimeEvidence:'unvalidated',
      state:'source-retained-not-executed',
      note:'Source entrenchment is not automatically folded into the separate battlefield entrenchment input.'
    }),
    recovery:Object.freeze({
      runtimeEvidence:'unvalidated',
      state:'source-retained-not-executed'
    }),
    battalionMult:Object.freeze({
      runtimeEvidence:'unvalidated',
      state:'source-retained-not-executed',
      note:'battalion_mult requires category matching plus executable stacking/order that is not yet certified.'
    })
  }),
  logisticsAndLosses:Object.freeze({
    reliabilityFactor:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'}),
    equipmentCaptureFactor:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'}),
    supplyConsumptionFactor:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'}),
    fuelConsumptionFactor:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'}),
    casualtyTrickleback:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'}),
    experienceLossFactor:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'}),
    suppression:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'}),
    suppressionFactor:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'}),
    maximumSpeed:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'})
  }),
  specialist:Object.freeze({
    deployedLeaderModifiers:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'}),
    enableAbility:Object.freeze({runtimeEvidence:'unvalidated',state:'source-retained-not-executed'})
  })
});

export const SUPPORT_EFFECT_RUNTIME_1193_META=Object.freeze({
  gameVersion:'1.19.3',
  scope:'support-specific runtime semantics',
  broadResolverPromotion:false,
  sourceCatalogRelease:'0.17.2',
  followupIssue:46
});

export const ORACLE_COMBAT_1193=Object.freeze({
  gameVersion:'1.19.3.0.c01a',
  baseChecksum:'5632',
  classification:'oracle-validated',
  validationBoundary:'controlled O1 combat-entry timing only',
  initialFireDelayHours:1,
  evidence:Object.freeze({
    totalControlledRuns:35,
    vanillaTacticRuns:25,
    neutralTacticRuns:10,
    h0ToH1NoDamageRuns:35,
    observedFirstDamageWindow:'after h1; damage may appear by h2',
    neutralScenario:'o1-base-neutral-tactics-v1'
  }),
  integerizationEvidence:Object.freeze({
    priorPlannerStatus:'oracle-divergent',
    priorBoundary:'O6 fixed-damage diagnostic only',
    priorPlannerMechanism:'stochasticRound(totalAttack * 0.1)',
    lowMode:Object.freeze({displayedSoftAttack:12,defenderDefense:255,multiplicityCounts:Object.freeze({zero:9,one:20,two:11,three:0})}),
    highMode:Object.freeze({displayedSoftAttack:18,defenderDefense:255,multiplicityCounts:Object.freeze({zero:0,one:17,two:20,three:3})}),
    replacementCandidate:Object.freeze({
      status:'oracle-validated',
      implementationEvidence:'executable inferred',
      boundary:'controlled O7 fixed-damage attack-point multiplicity distribution only',
      formula:'round(attack / 10 + U[-1,+1]), clamped at zero',
      displayedSoftAttack:20,
      tooltipSoftAttack:20,
      defenderDefense:255,
      multiplicityCounts:Object.freeze({zero:0,one:18,two:33,three:9,fourPlus:0}),
      candidateProbabilities:Object.freeze({one:0.25,two:0.5,three:0.25}),
      pearsonChiSquare:3.3,
      criticalValue1PctDf2:9.21034
    }),
    defenseSplitEvidence:Object.freeze({
      status:'oracle-divergent',
      boundary:'controlled O8 fixed-damage defended-vs-undefended split at Soft Attack 20 and Defense 10',
      rejectedCandidate:'independent wider random-rounding of attack and defense points followed by simple subtraction',
      displayedSoftAttack:20,
      tooltipSoftAttack:20,
      displayedDefense:10,
      tooltipDefense:10,
      multiplicityCounts:Object.freeze({zero:25,one:49,two:6,three:0,fourPlus:0}),
      candidateProbabilities:Object.freeze({zero:0.3125,one:0.375,two:0.25,three:0.0625}),
      pearsonChiSquare:26.8333333333,
      criticalValue1PctDf3:11.34487,
      exactMechanism:'unvalidated'
    }),
    attackTransportEvidence:Object.freeze({
      status:'oracle-validated',
      boundary:'controlled O9 all-hit transport at Soft Attack 20 and Defense 10',
      multiplicityCounts:Object.freeze({zero:0,one:16,two:32,three:12,fourPlus:0}),
      candidateProbabilities:Object.freeze({one:0.25,two:0.5,three:0.25}),
      pearsonChiSquare:0.8,
      criticalValue1PctDf2:9.21034,
      interpretation:'The O7 total attack-point law transports to the exact O8 low-defense scenario when defended and undefended points are both forced to hit, localizing the O8 mismatch downstream of total attack-point generation.'
    }),
    minimumDefenseEvidence:Object.freeze({
      status:'oracle-validated',
      boundary:'controlled O10v2 asymmetric-hit-gate boundary at Soft Attack 20 and executable-minimum Defense 1.9',
      displayedSoftAttack:20,
      tooltipSoftAttack:20,
      displayedDefense:1.9,
      tooltipDefense:1.9,
      defenderBaseDefense:198,
      finalStatFloorPercent:1,
      multiplicityCounts:Object.freeze({zero:1,one:18,two:37,three:4,fourPlus:0}),
      multiplicityMean:1.7333333333,
      referenceProbabilities:Object.freeze({one:0.25,two:0.5,three:0.25}),
      pearsonChiSquareIgnoringSupportViolation:10.3,
      criticalValue1PctDf2:9.21034,
      interpretation:'The executable minimum positive Defense already measurably changes the asymmetric-gate multiplicity distribution relative to the O7/O9 total attack-point reference. The exact split mechanism remains unvalidated.'
    }),
    defendedOnlyEvidence:Object.freeze({
      status:'oracle-validated',
      boundary:'controlled O11 defended-only fixed-damage boundary at Soft Attack 20 and Defense 10',
      displayedSoftAttack:20,
      tooltipSoftAttack:20,
      displayedDefense:10,
      tooltipDefense:10,
      multiplicityCounts:Object.freeze({zero:0,one:80,two:0,three:0,fourPlus:0}),
      defendedMean:1,
      defendedVariance:0,
      frozenO8UndefendedMean:0.7625,
      frozenO9TotalMean:1.9333333333333333,
      partitionDelta:0.1708333333333334,
      partitionStandardError:0.10966008881767925,
      partitionZ:1.5578441999747121,
      criticalValue1Pct:2.575829,
      action:'partition-mean-compatible',
      interpretation:'At Defense 10 the defended-only branch produced exactly one damage multiplicity in every accepted interval. Its mean is compatible at the predeclared 1% level with O8 undefended plus O11 defended partitioning O9 total damage in expectation.'
    }),
    fractionalDefenseEvidence:Object.freeze({
      status:'oracle-validated',
      boundary:'controlled O12 defended-only fixed-damage boundary at Soft Attack 20 and Defense 12',
      displayedSoftAttack:20,
      tooltipSoftAttack:20,
      displayedDefense:12,
      tooltipDefense:12,
      multiplicityCounts:Object.freeze({zero:0,one:71,two:9,three:0,fourPlus:0}),
      defendedMean:1.1125,
      compatibleFamily:'single-Bernoulli defense-point rounding bounded by total attack points',
      candidateChiSquare:Object.freeze({
        singleBernoulliBounded:0.8823529411764706,
        widerIndependentBounded:31.112462006079028,
        deterministicCeilingBounded:173.4
      }),
      interpretation:'At Defense 12, only the predeclared single-Bernoulli bounded defense-point family remains compatible at the controlled O12 boundary. This narrows defense integerization to stochastic rounding of Defense/10 before bounding by total attack points.'
    }),
    highFractionDefenseEvidence:Object.freeze({
      status:'oracle-validated',
      boundary:'controlled O13 defended-only fixed-damage boundary at Soft Attack 20 and Defense 18',
      displayedSoftAttack:20,
      tooltipSoftAttack:20,
      displayedDefense:18,
      tooltipDefense:18,
      multiplicityCounts:Object.freeze({zero:0,one:36,two:44,three:0,fourPlus:0}),
      candidateProbabilities:Object.freeze({one:0.4,two:0.6}),
      pearsonChiSquare:0.8333333333,
      criticalValue1PctDf1:6.634897,
      action:'single-Bernoulli-bounded-transports',
      interpretation:'The O12-supported single-Bernoulli Defense/10 sampler bounded by total attack points transports to the Defense-18 confirmation boundary.'
    }),
    interpretation:'O6 rejects the old single-Bernoulli attack support. O7 supports the wider total attack-point distribution. O8 rejects independent wider defense rounding plus simple subtraction. O9 localizes that mismatch downstream of total attack generation. O10v2 shows a real defense-present effect even at the executable minimum. O11 establishes exactly one defended point at Defense 10. O12 supports single-Bernoulli stochastic rounding of Defense/10 bounded by total attack points at Defense 12, and O13 confirms the same family at Defense 18. The planner point-partition structure is now narrowly Oracle-validated across the tested boundaries; normal hit probabilities and damage dice remain separate validation targets.'
  }),
  limitations:Object.freeze([
    'does not validate the wider attack-point law outside the controlled O7 range',
    'does not establish the defense split outside the controlled O11/O12/O13 Defense-10/12/18 defended-only boundaries',
    'does not validate hit-roll distribution',
    'does not validate organization/strength damage dice',
    'does not validate tactic execution outside the neutralized O1 harness',
    'does not establish bit-for-bit hoi4.exe parity'
  ])
});

export default ORACLE_COMBAT_1193;

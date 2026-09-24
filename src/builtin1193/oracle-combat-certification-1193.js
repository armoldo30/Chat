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
    interpretation:'O6 rejects the old single-Bernoulli support. O7 supports the predeclared wider attack-point random-rounding distribution at the controlled fixed-damage boundary. The replacement remains executable inferred and does not validate defense-point integerization or the complete resolver.'
  }),
  limitations:Object.freeze([
    'does not validate the wider attack-point law outside the controlled O7 range',
    'does not validate defense-point integerization',
    'does not validate hit-roll distribution',
    'does not validate organization/strength damage dice',
    'does not validate tactic execution outside the neutralized O1 harness',
    'does not establish bit-for-bit hoi4.exe parity'
  ])
});

export default ORACLE_COMBAT_1193;

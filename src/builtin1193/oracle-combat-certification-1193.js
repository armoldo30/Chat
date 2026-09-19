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
    status:'oracle-divergent',
    boundary:'O6 fixed-damage diagnostic only',
    plannerMechanism:'stochasticRound(totalAttack * 0.1)',
    lowMode:Object.freeze({displayedSoftAttack:12,defenderDefense:255,multiplicityCounts:Object.freeze({zero:9,one:20,two:11,three:0})}),
    highMode:Object.freeze({displayedSoftAttack:18,defenderDefense:255,multiplicityCounts:Object.freeze({zero:0,one:17,two:20,three:3})}),
    interpretation:'The current single Bernoulli stochastic-round step has support 1/2 at both controlled panel values but the executable produced 0 and 3 multiplicities under fixed-damage diagnostics. The /10 mean scale remains unvalidated rather than rejected.'
  }),
  limitations:Object.freeze([
    'does not validate combat-point scaling',
    'does not validate hit-roll distribution',
    'does not validate organization/strength damage dice',
    'does not validate tactic execution outside the neutralized O1 harness',
    'does not establish bit-for-bit hoi4.exe parity'
  ])
});

export default ORACLE_COMBAT_1193;

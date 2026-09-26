export const ORACLE_COMBAT_1193=Object.freeze({
  gameVersion:'1.19.3.0.c01a',
  baseChecksum:'5632',
  scope:'core ordinary unarmored 1v1 resolver at controlled O1-O20 boundaries',
  initialFireDelayHours:1,
  strengthDamageExecutableScale:0.9,
  evidence:Object.freeze({
    timing:Object.freeze({
      classification:'oracle-validated',
      boundary:'controlled O1 combat-entry timing',
      result:'first firing opportunity begins after one elapsed combat hour'
    }),
    attackPoints:Object.freeze({
      classification:'oracle-validated',
      implementationEvidence:'executable inferred',
      boundary:'controlled O7 with O9/O20 transport',
      formula:'round(attack / 10 + U[-1,+1]), clamped to nonnegative'
    }),
    defensePoints:Object.freeze({
      classification:'oracle-validated',
      implementationEvidence:'executable inferred',
      boundary:'controlled Defense 10/12/18 tests O11/O12/O13 with O20 transport',
      formula:'stochasticRound(defense / 10), then bounded by total attack points'
    }),
    hitGates:Object.freeze({
      classification:'oracle-validated',
      boundary:'controlled O14/O15 with O20 transport',
      defendedHitChance:0.10,
      undefendedHitChance:0.40
    }),
    ordinaryOrgDie:Object.freeze({
      classification:'oracle-validated',
      boundary:'controlled O16 ordinary unarmored damage',
      support:'UniformInteger(1,4)'
    }),
    ordinaryStrength:Object.freeze({
      classification:'oracle-validated',
      boundary:'controlled O17v2/O18 ordinary unarmored damage',
      executableScale:0.9,
      dieSupport:'UniformInteger(1,2)'
    }),
    combinedTransport:Object.freeze({
      classification:'oracle-validated',
      boundary:'controlled O19/O20 composition and Defense-18 transport',
      o20GroupedCounts:Object.freeze({zero:121,one:36,twoPlus:3}),
      o20PearsonChiSquare:1.9033166318218089,
      o20CriticalValue1PctDf2:9.21034
    })
  }),
  limitations:Object.freeze([
    'validation is narrow to the declared controlled boundaries rather than every possible attack/defense value',
    'tactic execution outside the neutralized harness is not established',
    'armor, piercing, armored-on-soft damage behavior and other special-case combat paths are not Oracle-validated here',
    'bit-for-bit hoi4.exe parity is not claimed'
  ])
});

export default ORACLE_COMBAT_1193;

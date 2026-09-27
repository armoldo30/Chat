export const ORACLE_COMBAT_1193=Object.freeze({
  gameVersion:'1.19.3.0.c01a',
  baseChecksum:'5632',
  scope:'core ordinary 1v1 resolver at controlled O1-O25 boundaries, including armor/piercing at O22/O23/O25',
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
    piercingDamageTiers:Object.freeze({
      classification:'oracle-validated',
      boundary:'controlled O22 Armor-20 piercing sweep',
      thresholds:Object.freeze([1.00,0.75,0.50,0.00]),
      damageFactors:Object.freeze([1.00,0.80,0.65,0.50]),
      observedRatios:Object.freeze({p20:1,p15:0.7989238176154094,p14:0.6505239308977617,p10:0.6505239308977617,p9:0.4984423676012485}),
      interpretation:'Executable organization damage matches the retained 100% / 80% / 65% / 50% piercing-tier family at the tested Armor-20 boundaries.'
    }),
    armoredOrgDie:Object.freeze({
      classification:'oracle-validated',
      boundary:'controlled O23 unpierced armored attacker with Armor 20 against defender Piercing 4',
      support:'UniformInteger(1,6)',
      dieCounts:Object.freeze({one:20,two:18,three:22,four:22,five:18,six:20}),
      pearsonChiSquare:0.8,
      criticalValue1PctDf5:15.086272
    }),
    combinedArmoredComposition:Object.freeze({
      classification:'oracle-validated',
      boundary:'controlled O25 Armor-20/Piercing-9 combined composition measured with bisection18',
      expectedPiercingDamageFactor:0.50,
      intervalCounts:Object.freeze({miss:138,hit:22,mixedChannel:0,supportViolation:0}),
      orgDieCounts:Object.freeze({one:3,two:6,three:3,four:5,five:5,six:0}),
      strengthDieCounts:Object.freeze({one:11,two:11}),
      hitAcceptance:Object.freeze({min:7,max:26}),
      o24Resolution:'O24 is preserved as a bisection14 predeclared mismatch; O25 repeats identical combat mechanics at higher observation precision and resolves the lone mixed interval as an observation-resolution artifact.'
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
    'armor/piercing validation is narrow to the controlled O22/O23/O25 boundaries and does not establish every hardness, hard-attack, tactic, multi-division, targeting, reinforcement, width, terrain or weather interaction',
    'bit-for-bit hoi4.exe parity is not claimed'
  ])
});

export default ORACLE_COMBAT_1193;

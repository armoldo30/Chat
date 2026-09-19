export function buildO4V2Reference(){
  return {
    schemaVersion:1,
    scenario:'o4-guaranteed-hit-sub10-v2',
    evidenceStatus:'unvalidated',
    defineIntervention:{BASE_CHANCE_TO_AVOID_HIT:0,defendedHitChance:1},
    control:{acceptedDisplayedSoftAttack:[10,19],requiredPositiveIntervals:5,totalIntervals:5},
    probe:{
      displayedSoftAttack:2,displayHalfWidth:1,trueSoftSensitivity:[1,2,3],
      plannerPositiveIntervalProbability:[0.1,0.2,0.3],
      minimumOnePositiveIntervalProbability:1,
      plannerWorstCaseAllFivePositiveProbability:0.3**5
    },
    decision:{
      validControlRequired:true,
      probeKLe4:'minimum-one-hypothesis-contradicted',
      probeKEq5:'stochastic-rounding-mismatch-candidate'
    }
  };
}

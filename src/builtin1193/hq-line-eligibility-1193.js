// Bounded 1.19.3 recovery for Army-HQ-only line battalion eligibility.
//
// The compact planner runtime retained these line battalions but dropped
// allow_in_army_hq / allow_in_non_army_hq. The values below are recovered from
// the public 1.19.3 source mirror used by the support audit. They are deliberately
// NOT labelled game-file exact because the omitted field was not retained in the
// certified compact runtime record.

export const HQ_ONLY_LINE_BATTALIONS_1193=Object.freeze([
  'hq_infantry',
  'hq_motorized',
  'hq_armored_car',
  'hq_paratrooper',
  'hq_light_armor',
  'hq_medium_armor',
  'hq_heavy_armor'
]);

export const HQ_LINE_ELIGIBILITY_1193=Object.freeze(Object.fromEntries(
  HQ_ONLY_LINE_BATTALIONS_1193.map(id=>[id,Object.freeze({
    allowInArmyHq:true,
    allowInNonArmyHq:false
  })])
));

export const HQ_LINE_ELIGIBILITY_1193_META=Object.freeze({
  gameVersion:'1.19.3',
  evidence:'unvalidated',
  source:'public-1.19.3-source-mirror-cross-check',
  mirrorRepository:'prisle123/hoi4-archive',
  mirrorCommit:'228560dc3508a43c1eaef0774f1c0dcc3c954ada',
  sourceFile:'common/units/hq_support.txt',
  scope:'Army-HQ-only line battalion eligibility fields omitted by compact runtime normalization',
  broadExecutablePromotion:false
});

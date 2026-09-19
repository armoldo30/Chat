// Bounded 1.19.3 recovery for Army-HQ-only line-battalion eligibility.
// The compact runtime omitted these structural flags. Retained source fields always
// win; missing fields are recovered from the public 1.19.3 source mirror only.

export const HQ_ONLY_LINE_BATTALIONS_1193=Object.freeze([
  'hq_infantry',
  'hq_motorized',
  'hq_armored_car',
  'hq_paratrooper',
  'hq_light_armor',
  'hq_medium_armor',
  'hq_heavy_armor'
]);

export const HQ_LINE_ELIGIBILITY_1193_META=Object.freeze({
  gameVersion:'1.19.3',
  sourceFile:'common/units/hq_support.txt',
  sourceMirror:'prisle123/hoi4-archive',
  sourceMirrorCommit:'228560dc3508a43c1eaef0774f1c0dcc3c954ada',
  evidence:'unvalidated',
  recovery:'bounded-public-1.19.3-source-mirror-cross-check',
  authoritativeSourceRetained:false,
  ordinaryDivisionRule:'allow_in_non_army_hq = no'
});

export function applyHqLineEligibilityRecovery(subUnits={}){
  const recovered=[],retained=[],missing=[];
  for(const id of HQ_ONLY_LINE_BATTALIONS_1193){
    const record=subUnits?.[id];
    if(!record){missing.push(id);continue;}
    let changed=false;
    if(record.allowInArmyHq===undefined){record.allowInArmyHq=true;changed=true;}
    if(record.allowInNonArmyHq===undefined){record.allowInNonArmyHq=false;changed=true;}
    if(changed){
      record.hqEligibilityRecovery=HQ_LINE_ELIGIBILITY_1193_META.recovery;
      recovered.push(id);
    }else retained.push(id);
  }
  return {recovered,retained,missing};
}

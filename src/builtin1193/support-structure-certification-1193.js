// HOI4 1.19.3 support-company structural eligibility retained from common/units.
// This is source structure, not an executable inference.

export const HQ_ONLY_SUPPORT_IDS_1193=Object.freeze([
  'hq_support_company',
  'hq_engineer',
  'hq_recon',
  'hq_military_police',
  'hq_maintenance',
  'hq_field_hospital',
  'hq_logistics',
  'hq_signal',
  'hq_naval_liaison',
  'hq_air_liaison',
  'hq_specops'
]);

export const SUPPORT_STRUCTURE_META_1193=Object.freeze({
  gameVersion:'1.19.3',
  evidence:'game-file exact',
  sourceFile:'common/units/hq_support.txt',
  hqOnlySupportCount:HQ_ONLY_SUPPORT_IDS_1193.length,
  rule:'allow_in_army_hq = yes; allow_in_non_army_hq = no'
});

export function applySupportStructureFallback1193(supports){
  let applied=0;
  for(const id of HQ_ONLY_SUPPORT_IDS_1193){
    const record=supports?.[id];
    if(!record)continue;
    if(record.allowInArmyHq===undefined){record.allowInArmyHq=true;applied++;}
    if(record.allowInNonArmyHq===undefined){record.allowInNonArmyHq=false;applied++;}
    record.supportStructureSource=record.allowInNonArmyHq===false?'game-file exact':'game-pack';
  }
  return applied;
}

export function regularDivisionSupportAllowed1193(id,record={}){
  if(record.allowInNonArmyHq===false)return false;
  return !HQ_ONLY_SUPPORT_IDS_1193.includes(String(record.gameId||record.id||id));
}

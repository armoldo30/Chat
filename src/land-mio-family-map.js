const list=values=>Object.freeze([...values]);
const family=(battalions,supports)=>Object.freeze({battalions:list(battalions),supports:list(supports)});

// Shared runtime identity map for land-equipment MIO propagation and the planner's
// legacy coarse equipment-tier/availability fallback. Current 1.19.3 IDs and the
// retained predecessor aliases intentionally live together so Division Lab,
// Counter Analysis, and fallback theorycraft cannot drift independently.
export const LAND_MIO_FAMILY_MAP=Object.freeze({
  infantry_equipment:family(['infantry','motorized','mechanized','cavalry'],[]),
  artillery:family(['artillery'],['support_artillery','field_guns','regimental_infantry_guns']),
  anti_tank:family(['anti_tank'],['support_at','anti_tank_battery','regimental_at']),
  anti_air:family(['anti_air'],['support_aa','anti_air_battery','regimental_aa'])
});

const SUPPORT_TO_FAMILY=Object.freeze(Object.fromEntries(
  Object.entries(LAND_MIO_FAMILY_MAP).flatMap(([familyId,units])=>units.supports.map(id=>[id,familyId]))
));

export function landMioSupportFamily(id){return SUPPORT_TO_FAMILY[String(id||'')]||null;}

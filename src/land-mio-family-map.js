const list=values=>Object.freeze([...values]);
const family=(battalions,supports)=>Object.freeze({battalions:list(battalions),supports:list(supports)});

// Retained for the legacy packless tech/availability fallback. Current source-backed
// runtime MIO propagation is derived from each hydrated unit's actual equipment need.
export const LAND_MIO_FAMILY_MAP=Object.freeze({
  infantry_equipment:family(['infantry','motorized','mechanized','cavalry'],[]),
  artillery:family(['artillery'],['support_artillery','field_guns','regimental_infantry_guns']),
  anti_tank:family(['anti_tank'],['support_at','anti_tank_battery','regimental_at']),
  anti_air:family(['anti_air'],['support_aa','anti_air_battery','regimental_aa'])
});

const SUPPORT_TO_FAMILY=Object.freeze(Object.fromEntries(
  Object.entries(LAND_MIO_FAMILY_MAP).flatMap(([familyId,units])=>units.supports.map(id=>[id,familyId]))
));

const NEED_TARGETS=Object.freeze({
  infantry_equipment:Object.freeze({family:'infantry_equipment',equipmentFamily:'infantry_equipment'}),
  artillery:Object.freeze({family:'artillery',equipmentFamily:'artillery_equipment'}),
  artillery_equipment:Object.freeze({family:'artillery',equipmentFamily:'artillery_equipment'}),
  anti_tank:Object.freeze({family:'anti_tank',equipmentFamily:'anti_tank_equipment'}),
  anti_tank_equipment:Object.freeze({family:'anti_tank',equipmentFamily:'anti_tank_equipment'}),
  anti_air:Object.freeze({family:'anti_air',equipmentFamily:'anti_air_equipment'}),
  anti_air_equipment:Object.freeze({family:'anti_air',equipmentFamily:'anti_air_equipment'}),
  rocket_artillery_equipment:Object.freeze({family:'artillery',equipmentFamily:'rocket_artillery_equipment'}),
  motorized_rocket_equipment:Object.freeze({family:'artillery',equipmentFamily:'motorized_rocket_equipment'})
});

export function landMioSupportFamily(id){return SUPPORT_TO_FAMILY[String(id||'')]||null;}

export function landMioTargetsForUnit(record){
  const out=[],seen=new Set();
  for(const needId of Object.keys(record?.need||{})){
    const target=NEED_TARGETS[needId];if(!target)continue;
    const key=`${target.family}|${target.equipmentFamily}`;if(seen.has(key))continue;seen.add(key);out.push(target);
  }
  return out;
}

export function landMioTargetForEquipment(id,record=null){
  for(const key of [record?.family,id]){
    const target=NEED_TARGETS[String(key||'')];if(target)return target;
  }
  return null;
}

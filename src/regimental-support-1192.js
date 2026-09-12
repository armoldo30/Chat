// HOI4 1.19.2 regimental-support structural compatibility.
//
// IMPORTANT EVIDENCE BOUNDARY:
// The compact certified 1.19.2 bundle retained each support unit's category and
// combat/equipment fields, but it did not retain allowed_battalion_groups. The
// fallback matrix below is therefore NOT labelled game-file exact. It is a
// provisional structural reconstruction cross-checked against current public
// vanilla-file mirrors and the 1.19 Division Designer behavior. When the user's
// retained vanilla common/units source is available again, imported
// allowedBattalionGroups always wins and this fallback can be source-certified
// or replaced without changing the designer logic.

export const REGIMENTAL_SUPPORT_GROUPS=['infantry','combat_support','mobile','mobile_combat_support','armor','armor_combat_support'];

export const REGIMENTAL_SUPPORT_COMPATIBILITY_1192=Object.freeze({
  fire_support:['infantry','mobile','combat_support'],
  mot_fire_support:['infantry','mobile','combat_support','mobile_combat_support','armor','armor_combat_support'],
  field_guns:['infantry','mobile','combat_support'],
  rocket_battery:['infantry','mobile','combat_support'],
  anti_air_battery:['infantry','mobile','combat_support'],
  anti_tank_battery:['infantry','mobile','combat_support'],
  light_tank_destroyer_support:['armor','mobile_combat_support','armor_combat_support'],
  medium_tank_destroyer_support:['armor','mobile_combat_support','armor_combat_support'],
  heavy_tank_destroyer_support:['armor','mobile_combat_support','armor_combat_support'],
  modern_tank_destroyer_support:['armor','mobile_combat_support','armor_combat_support'],
  light_sp_anti_air_support:['armor','mobile_combat_support','armor_combat_support'],
  medium_sp_anti_air_support:['armor','mobile_combat_support','armor_combat_support'],
  heavy_sp_anti_air_support:['armor','mobile_combat_support','armor_combat_support'],
  modern_sp_anti_air_support:['armor','mobile_combat_support','armor_combat_support']
});

export const REGIMENTAL_SUPPORT_COMPATIBILITY_META=Object.freeze({
  gameVersion:'1.19.2',
  evidence:'planner-analytical-cross-check',
  authoritativeSourceRetained:false,
  note:'Imported allowed_battalion_groups overrides this bundled compatibility fallback.'
});

const cleanGroups=value=>Array.isArray(value)?[...new Set(value.map(x=>String(x)).filter(x=>REGIMENTAL_SUPPORT_GROUPS.includes(x)))]:[];

export function supportAllowedBattalionGroups(id,record){
  const imported=cleanGroups(record?.allowedBattalionGroups);
  if(imported.length)return {groups:imported,source:'game-pack'};
  const fallback=cleanGroups(REGIMENTAL_SUPPORT_COMPATIBILITY_1192[id]);
  return {groups:fallback,source:fallback.length?'planner-analytical-cross-check':'unknown'};
}

export function regimentalSupportAllowed(id,record,regimentGroup){
  if(!regimentGroup)return false;
  const {groups}=supportAllowedBattalionGroups(id,record);
  return groups.includes(String(regimentGroup));
}

export function applyRegimentalSupportCompatibilityFallback(supports){
  let applied=0;
  for(const [id,groups] of Object.entries(REGIMENTAL_SUPPORT_COMPATIBILITY_1192)){
    const record=supports?.[id];
    if(!record)continue;
    const retained=cleanGroups(record.allowedBattalionGroups);
    if(retained.length){record.allowedBattalionGroups=retained;record.regimentalCompatibilitySource='game-pack';continue;}
    record.allowedBattalionGroups=[...groups];
    record.regimentalCompatibilitySource='planner-analytical-cross-check';
    applied++;
  }
  return applied;
}

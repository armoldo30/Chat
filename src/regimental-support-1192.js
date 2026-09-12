// HOI4 1.19.2 regimental-support structure and display catalog.
//
// IMPORTANT EVIDENCE BOUNDARY:
// The compact certified 1.19.2 bundle retained the regimental-support unit IDs,
// categories, combat values and equipment needs, but not allowed_battalion_groups
// or the English localisation files. Compatibility below is therefore a
// planner-analytical reconstruction. The English labels are a public-localisation
// cross-check and are NOT promoted to game-file exact until the user's retained
// 1.19.2 localisation folder is available.

export const REGIMENTAL_SUPPORT_GROUPS=['infantry','combat_support','mobile','mobile_combat_support','armor','armor_combat_support'];

export const REGIMENTAL_SUPPORT_LABELS_1192=Object.freeze({
  fire_support:'Heavy Weapons Company',
  mot_fire_support:'Motorized Heavy Weapons Company',
  field_guns:'Infantry Guns',
  rocket_battery:'Regimental Rocket Battery',
  anti_air_battery:'Anti-Air Battery',
  anti_tank_battery:'Anti-Tank Battery',
  light_tank_destroyer_support:'Light Tank Destroyer Support',
  medium_tank_destroyer_support:'Medium Tank Destroyer Support',
  heavy_tank_destroyer_support:'Heavy Tank Destroyer Support',
  modern_tank_destroyer_support:'Modern Tank Destroyer Support',
  light_sp_anti_air_support:'Light SP Anti-Air Support',
  medium_sp_anti_air_support:'Medium SP Anti-Air Support',
  heavy_sp_anti_air_support:'Heavy SP Anti-Air Support',
  modern_sp_anti_air_support:'Modern SP Anti-Air Support'
});

export const REGIMENTAL_SUPPORT_IDS_1192=Object.freeze(Object.keys(REGIMENTAL_SUPPORT_LABELS_1192));

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
  displayNameEvidence:'public-localization-cross-check',
  note:'Imported allowed_battalion_groups overrides the bundled compatibility fallback; exact English localisation remains pending the retained 1.19.2 localisation folder.'
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
  for(const id of REGIMENTAL_SUPPORT_IDS_1192){
    const record=supports?.[id];
    if(!record)continue;
    record.name=REGIMENTAL_SUPPORT_LABELS_1192[id];
    record.regimentalSupport=true;
    record.regimentalDisplayNameSource='public-localization-cross-check';
    const retained=cleanGroups(record.allowedBattalionGroups);
    if(retained.length){record.allowedBattalionGroups=retained;record.regimentalCompatibilitySource='game-pack';continue;}
    record.allowedBattalionGroups=[...REGIMENTAL_SUPPORT_COMPATIBILITY_1192[id]];
    record.regimentalCompatibilitySource='planner-analytical-cross-check';
    applied++;
  }
  return applied;
}

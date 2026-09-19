// HOI4 1.19.3 regimental-support structure and display catalog.
// Compatibility groups below are read directly from the supplied 1.19.3 common/units
// files; display names are from the supplied 1.19.3 English localisation.

export const REGIMENTAL_SUPPORT_GROUPS=['infantry','combat_support','mobile','mobile_combat_support','armor','armor_combat_support'];

export const REGIMENTAL_SUPPORT_LABELS_1193=Object.freeze({
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

export const REGIMENTAL_SUPPORT_IDS_1193=Object.freeze(Object.keys(REGIMENTAL_SUPPORT_LABELS_1193));

export const REGIMENTAL_SUPPORT_ABBREVIATIONS_1193=Object.freeze({
  fire_support:'FSC',
  mot_fire_support:'FSC',
  field_guns:'IFG',
  rocket_battery:'RBC',
  anti_air_battery:'RAA',
  anti_tank_battery:'RAT',
  light_tank_destroyer_support:'LTD',
  medium_tank_destroyer_support:'MTD',
  heavy_tank_destroyer_support:'HTD',
  modern_tank_destroyer_support:'OTD',
  light_sp_anti_air_support:'LAA',
  medium_sp_anti_air_support:'MAA',
  heavy_sp_anti_air_support:'HAA',
  modern_sp_anti_air_support:'OAA'
});


export const REGIMENTAL_SUPPORT_COMPATIBILITY_1193=Object.freeze({
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
  gameVersion:'1.19.3',
  evidence:'game-file exact',
  authoritativeSourceRetained:true,
  displayNameEvidence:'game-file exact',
  sourceFiles:[
    'common/units/fire_support.txt',
    'common/units/tank_destroyer_brigade.txt',
    'common/units/sp_anti-air_brigade.txt'
  ]
});

const cleanGroups=value=>Array.isArray(value)?[...new Set(value.map(x=>String(x)).filter(x=>REGIMENTAL_SUPPORT_GROUPS.includes(x)))]:[];

export function supportAllowedBattalionGroups(id,record){
  const imported=cleanGroups(record?.allowedBattalionGroups);
  if(imported.length)return {groups:imported,source:'game-pack'};
  const exact=cleanGroups(REGIMENTAL_SUPPORT_COMPATIBILITY_1193[id]);
  return {groups:exact,source:exact.length?'game-file-exact-fallback':'unknown'};
}

export function regimentalSupportAllowed(id,record,regimentGroup){
  if(!regimentGroup)return false;
  const {groups}=supportAllowedBattalionGroups(id,record);
  return groups.includes(String(regimentGroup));
}

export function applyRegimentalSupportCompatibilityFallback(supports){
  let applied=0;
  for(const id of REGIMENTAL_SUPPORT_IDS_1193){
    const record=supports?.[id];
    if(!record)continue;
    record.name=REGIMENTAL_SUPPORT_LABELS_1193[id];
    record.regimentalSupport=true;
    record.regimentalDisplayNameSource='game-file exact';
    const retained=cleanGroups(record.allowedBattalionGroups);
    if(retained.length){record.allowedBattalionGroups=retained;record.regimentalCompatibilitySource='game-pack';continue;}
    record.allowedBattalionGroups=[...REGIMENTAL_SUPPORT_COMPATIBILITY_1193[id]];
    record.regimentalCompatibilitySource='game-file-exact-fallback';
    applied++;
  }
  return applied;
}

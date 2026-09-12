const LINE_ARTILLERY_IDS=new Set(['artillery','anti_tank','anti_air']);
const ARMOR_COMBAT_SUPPORT_CATEGORIES=new Set(['category_self_propelled_artillery','category_self_propelled_anti_air','category_tank_destroyers']);
const VALID_REGIMENT_GROUPS=new Set(['infantry','combat_support','mobile','mobile_combat_support','armor','armor_combat_support']);

const norm=value=>String(value||'').trim().toLowerCase();
const words=(type,unit={})=>[type,unit.gameId,unit.id,unit.sourceGroup,unit.group,...(unit.types||[]),...(unit.categories||[])].filter(Boolean).join(' ').toLowerCase();

export function regimentGroupForUnit(type,unit={}){
  const categories=new Set((unit.categories||[]).map(norm)),text=words(type,unit),declared=norm(unit.sourceGroup||unit.group);
  // Prefer retained 1.19.2 regiment groups whenever they survived hydration.
  if(VALID_REGIMENT_GROUPS.has(declared)&&['combat_support','mobile_combat_support','armor_combat_support'].includes(declared))return declared;
  // Tank destroyers, SP artillery and SP anti-air form the armored combat-support
  // regiment group even when an older hydrated record collapsed them to armor.
  if([...ARMOR_COMBAT_SUPPORT_CATEGORIES].some(category=>categories.has(category)))return 'armor_combat_support';
  // Line gun battalions form combat-support regiments; motorized variants form
  // mobile-combat-support regiments.
  if(categories.has('category_line_artillery')||LINE_ARTILLERY_IDS.has(norm(type))){
    if(declared==='mobile_combat_support'||/mot(?:orized)?[_ ]|\bmotorized\b|\bmobile combat support\b/.test(text))return 'mobile_combat_support';
    return 'combat_support';
  }
  if(VALID_REGIMENT_GROUPS.has(declared))return declared;
  if(/category_all_armor|\barmor\b|\btank\b/.test(text))return 'armor';
  if(/motor|mechanized|mobile|cavalry/.test(text))return 'mobile';
  return 'infantry';
}

export function normalizeBattalionRegimentGroups(battalionMap={}){
  for(const [type,unit] of Object.entries(battalionMap||{})){
    if(!unit||typeof unit!=='object')continue;
    const group=regimentGroupForUnit(type,unit);
    if(group)unit.group=group;
  }
  return battalionMap;
}

export function regimentGroupLabel(group=''){
  return String(group||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
}

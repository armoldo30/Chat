const LINE_ARTILLERY_IDS=new Set(['artillery','anti_tank','anti_air']);

const norm=value=>String(value||'').trim().toLowerCase();
const words=(type,unit={})=>[type,unit.gameId,unit.id,unit.group,...(unit.types||[]),...(unit.categories||[])].filter(Boolean).join(' ').toLowerCase();

export function regimentGroupForUnit(type,unit={}){
  const categories=new Set((unit.categories||[]).map(norm)),text=words(type,unit),declared=norm(unit.sourceGroup||unit.group);
  // 1.19.2 line gun battalions are their own combat-support regiment group.
  // The bundled source records retain category_line_artillery even when older
  // planner hydration collapsed their group to infantry.
  if(categories.has('category_line_artillery')||LINE_ARTILLERY_IDS.has(norm(type))){
    if(declared==='mobile_combat_support'||/mot(?:orized)?[_ ]|\bmotorized\b|\bmobile combat support\b/.test(text))return 'mobile_combat_support';
    return 'combat_support';
  }
  if(declared)return declared;
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

import BUILTIN from '../src/builtin1192.js';
import { resolveEquipment } from '../src/parser.js';
import { tankCatalogFromPack } from '../src/designerData.js';

const resolved=resolveEquipment(BUILTIN);
const hasSlots=e=>e?.moduleSlots&&typeof e.moduleSlots==='object'&&Object.keys(e.moduleSlots).length>0;
const list=v=>Array.isArray(v)?v:v==null?[]:[v];
const tankish=Object.entries(resolved).filter(([id,e])=>hasSlots(e)&&/tank|armor|land_cruiser/i.test(`${id} ${e?.archetype||''} ${(e?.types||[]).join(' ')}`));
const catalog=tankCatalogFromPack(BUILTIN);

console.log('TANK_AUDIT_SUMMARY',JSON.stringify({
  allTankishWithSlots:tankish.length,
  catalogChassis:Object.keys(catalog.chassis).length,
  catalogMeta:catalog.meta
}));

for(const [id,e] of tankish){
  if(e?.duplicateRole)continue;
  const slots=Object.fromEntries(Object.entries(e.moduleSlots||{}).map(([slot,s])=>[slot,{required:s?.required,allowed:list(s?.allowed_module_categories)}]));
  console.log('TANK_CHASSIS',JSON.stringify({id,year:e.year,archetype:e.archetype,types:e.types||[],duplicateRole:e.duplicateRole||null,designerVisible:e.designerVisible,rawArchetype:e.raw?.is_archetype===true,cataloged:!!catalog.chassis[id],slots}));
}

const allAllowed=new Set();
for(const [,e] of tankish)for(const s of Object.values(e.moduleSlots||{}))for(const c of list(s?.allowed_module_categories))allAllowed.add(c);
const moduleCats={};
for(const m of Object.values(BUILTIN.modules||{}))moduleCats[m.category]=(moduleCats[m.category]||0)+1;
console.log('TANK_SLOT_CATEGORIES',JSON.stringify([...allAllowed].sort()));
console.log('TANK_MODULE_CATEGORY_COUNTS',JSON.stringify(Object.fromEntries(Object.entries(moduleCats).filter(([c])=>/^tank_|^lc_/.test(c)).sort())));

const catalogedModules=new Set([
  ...Object.keys(catalog.guns||{}),...Object.keys(catalog.turrets||{}),...Object.keys(catalog.suspensions||{}),
  ...Object.keys(catalog.armorTypes||{}),...Object.keys(catalog.engines||{}),...Object.keys(catalog.specials||{})
]);
const unusedTankModules=Object.values(BUILTIN.modules||{}).filter(m=>(/^tank_|^lc_/.test(m.category||'')||/^tank_|^lc_/.test(m.id||''))&&!allAllowed.has(m.category));
const catalogedButNoSlot=Object.values(BUILTIN.modules||{}).filter(m=>catalogedModules.has(m.id)&&m.id!=='none'&&!allAllowed.has(m.category));
console.log('TANK_UNUSED_MODULES',JSON.stringify(unusedTankModules.map(m=>({id:m.id,category:m.category})).sort((a,b)=>a.id.localeCompare(b.id))));
console.log('TANK_CATALOGED_WITHOUT_SLOT',JSON.stringify(catalogedButNoSlot.map(m=>({id:m.id,category:m.category})).sort((a,b)=>a.id.localeCompare(b.id))));

for(const id of ['tank_light_three_man_tank_turret','tank_medium_three_man_tank_turret','tank_heavy_three_man_tank_turret','tank_modern_tank_turret','tank_super_heavy_three_man_tank_turret','tank_medium_cannon','tank_heavy_cannon','tank_super_heavy_cannon','flamethrower','amphibious_drive']){
  const m=BUILTIN.modules?.[id];
  console.log('TANK_MODULE_DETAIL',JSON.stringify({id,exists:!!m,category:m?.category,addEquipmentType:m?.addEquipmentType||[],allowEquipmentType:m?.allowEquipmentType||[],forbidEquipmentType:m?.forbidEquipmentType||[],keys:m?Object.keys(m).sort():[]}));
}

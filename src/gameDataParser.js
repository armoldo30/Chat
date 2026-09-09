import { buildDataPack, parseClausewitz } from './parser.js';

const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const last=v=>Array.isArray(v)?v.at(-1):v;
const items=v=>Array.isArray(v)?v.map(String):isObj(v)&&Array.isArray(v.__items)?v.__items.map(String):typeof v==='string'?[v]:[];
const num=v=>Number.isFinite(Number(last(v)))?Number(last(v)):undefined;
const clean=v=>{
  if(Array.isArray(v))return v.map(clean);
  if(!isObj(v))return v;
  const out={};for(const [k,x] of Object.entries(v))out[k]=clean(x);return out;
};
const entries=(parsed,key)=>{
  const root=isObj(last(key?parsed?.[key]:parsed))?last(key?parsed?.[key]:parsed):{};
  return Object.entries(root).filter(([k])=>k!=='__items');
};
const merge=(target,source)=>{for(const [k,v] of Object.entries(source||{}))target[k]=v;return target;};

function prerequisiteTokens(raw){
  const found=new Set();
  const relevant=/allow|require|prereq|dependency|available|visible|has_tech|technology|has_dlc|special_project|prototype/i;
  const walk=(v,key='')=>{
    if(Array.isArray(v)){for(const x of v)walk(x,key);return;}
    if(!isObj(v)){
      if(relevant.test(key)&&typeof v==='string')found.add(v);
      return;
    }
    for(const [k,x] of Object.entries(v)){
      if(k==='__items'){
        if(relevant.test(key))for(const t of items(v))found.add(t);
      }else if(relevant.test(k)){
        if(typeof last(x)==='string')found.add(String(last(x)));else for(const t of items(last(x)))found.add(t);
        walk(x,k);
      }else walk(x,k);
    }
  };
  walk(raw);
  return [...found];
}

export function extractTechnologies(parsed){
  const out={};
  for(const [id,raw0] of entries(parsed,'technologies')){
    const raw=isObj(last(raw0))?last(raw0):{};
    out[id]={id,startYear:num(raw.start_year??raw.year),researchCost:num(raw.research_cost),categories:[...new Set([...items(last(raw.category)),...items(last(raw.categories))])],prerequisites:prerequisiteTokens(raw),raw:clean(raw)};
  }
  return out;
}

export function extractCombatTactics(parsed){
  const roots=['combat_tactic','combat_tactics','tactics'];const out={};
  for(const root of roots)for(const [id,raw0] of entries(parsed,root)){
    const raw=isObj(last(raw0))?last(raw0):{};
    out[id]={id,days:num(raw.days),base:num(raw.base),prerequisites:prerequisiteTokens(raw),raw:clean(raw)};
  }
  if(!Object.keys(out).length)for(const [id,raw0] of entries(parsed)){
    const raw=isObj(last(raw0))?last(raw0):{};
    if(raw.trigger||raw.allowed||raw.attacker||raw.defender||raw.countered_by||raw.attacker_movement_speed||raw.defender_movement_speed)out[id]={id,days:num(raw.days),base:num(raw.base),prerequisites:prerequisiteTokens(raw),raw:clean(raw)};
  }
  return out;
}

export function extractModifierDefinitions(parsed){
  const out={};
  for(const [id,raw0] of entries(parsed)){
    const raw=isObj(last(raw0))?last(raw0):null;if(!raw)continue;
    out[id]={id,raw:clean(raw)};
  }
  return out;
}

export function extractSpecialProjects(parsed){
  const out={};
  for(const root of ['special_projects','projects'])for(const [id,raw0] of entries(parsed,root)){
    const raw=isObj(last(raw0))?last(raw0):{};
    out[id]={id,cost:num(raw.cost??raw.prototype_cost??raw.breakthrough_cost),prerequisites:prerequisiteTokens(raw),raw:clean(raw)};
  }
  if(!Object.keys(out).length)for(const [id,raw0] of entries(parsed)){
    const raw=isObj(last(raw0))?last(raw0):{};
    if(raw.prototype_time||raw.specialization||raw.breakthrough_cost||raw.prototype_cost)out[id]={id,cost:num(raw.cost??raw.prototype_cost??raw.breakthrough_cost),prerequisites:prerequisiteTokens(raw),raw:clean(raw)};
  }
  return out;
}

export function extractEquipmentUpgrades(parsed){
  const out={};
  for(const root of ['equipment_upgrades','upgrades'])for(const [id,raw0] of entries(parsed,root)){
    const raw=isObj(last(raw0))?last(raw0):{};out[id]={id,raw:clean(raw)};
  }
  return out;
}

// HOI4 1.19 uses common/doctrines/{grand_doctrines,tracks,subdoctrines} rather than the old technology-shaped doctrine tree.
export function extractDoctrines(parsed,kind='unknown'){
  const out={};
  for(const [id,raw0] of entries(parsed)){
    const raw=isObj(last(raw0))?last(raw0):{};
    if(!Object.keys(raw).length)continue;
    out[id]={id,kind,folder:last(raw.folder),track:last(raw.track),tracks:items(last(raw.tracks)),xpCost:num(raw.xp_cost),prerequisites:prerequisiteTokens(raw),raw:clean(raw)};
  }
  return out;
}

export async function buildExtendedDataPack(files){
  const list=[...files],pack=await buildDataPack(list);
  pack.technologies=pack.technologies||{};pack.combatTactics=pack.combatTactics||{};pack.modifiers=pack.modifiers||{};pack.specialProjects=pack.specialProjects||{};pack.equipmentUpgrades=pack.equipmentUpgrades||{};pack.doctrines=pack.doctrines||{};
  for(const file of list){
    const path=String(file.webkitRelativePath||file.name||'').replaceAll('\\','/').toLowerCase();
    if(!/\.(txt|gui|asset)$/i.test(file.name||path))continue;
    const relevant=path.includes('/technolog')||path.includes('/combat_tactic')||path.includes('/modifier_definition')||path.includes('/special_project')||path.includes('/equipment/upgrades')||path.includes('/doctrine');
    if(!relevant)continue;
    let parsed;try{parsed=parseClausewitz(await file.text());}catch{continue;}
    if(path.includes('/technolog'))merge(pack.technologies,extractTechnologies(parsed));
    if(path.includes('/combat_tactic'))merge(pack.combatTactics,extractCombatTactics(parsed));
    if(path.includes('/modifier_definition'))merge(pack.modifiers,extractModifierDefinitions(parsed));
    if(path.includes('/special_project'))merge(pack.specialProjects,extractSpecialProjects(parsed));
    if(path.includes('/equipment/upgrades'))merge(pack.equipmentUpgrades,extractEquipmentUpgrades(parsed));
    if(path.includes('/doctrines/grand_doctrines/'))merge(pack.doctrines,extractDoctrines(parsed,'grand'));
    else if(path.includes('/doctrines/tracks/'))merge(pack.doctrines,extractDoctrines(parsed,'track'));
    else if(path.includes('/doctrines/subdoctrines/'))merge(pack.doctrines,extractDoctrines(parsed,'subdoctrine'));
    else if(path.includes('/doctrine'))merge(pack.doctrines,extractDoctrines(parsed,'legacy'));
  }
  pack.meta={...(pack.meta||{}),technologyCount:Object.keys(pack.technologies).length,tacticCount:Object.keys(pack.combatTactics).length,modifierCount:Object.keys(pack.modifiers).length,specialProjectCount:Object.keys(pack.specialProjects).length,equipmentUpgradeCount:Object.keys(pack.equipmentUpgrades).length,doctrineCount:Object.keys(pack.doctrines).length,parserVersion:'0.15.0'};
  return pack;
}

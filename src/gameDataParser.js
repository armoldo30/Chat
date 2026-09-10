import { buildDataPack, parseClausewitz } from './parser.js';

const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const last=v=>Array.isArray(v)?v.at(-1):v;
const items=v=>Array.isArray(v)?v.flatMap(items):isObj(v)&&Array.isArray(v.__items)?v.__items.flatMap(items):typeof v==='string'||typeof v==='number'?[String(v)]:[];
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
const blockList=v=>Array.isArray(v)?v.filter(isObj):isObj(v)?[v]:[];

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
        if(typeof last(x)==='string')found.add(String(last(x)));else for(const t of items(x))found.add(t);
        walk(x,k);
      }else walk(x,k);
    }
  };
  walk(raw);
  return [...found];
}

function technologyPaths(v){
  return blockList(v).map(path=>({
    leadsToTech:String(last(path.leads_to_tech)||''),
    researchCostCoeff:num(path.research_cost_coeff)
  })).filter(path=>path.leadsToTech);
}

function technologyDependencies(v){
  const source=isObj(last(v))?last(v):{},out={};
  for(const [id,value] of Object.entries(source)){
    if(id==='__items')continue;
    const parsed=num(value);out[id]=parsed===undefined?last(value):parsed;
  }
  return out;
}

function technologyGateTokens(raw){
  return [...new Set([...prerequisiteTokens(raw?.allow),...prerequisiteTokens(raw?.allow_branch)])];
}

export function extractTechnologies(parsed,sourceFile=''){
  const out={};
  for(const [id,raw0] of entries(parsed,'technologies')){
    // Script variables live beside technology definitions in HOI4 files. They are source constants, not technologies.
    if(String(id).startsWith('@'))continue;
    // Empty technology blocks are valid (for example fleet_submarines), so preserve them as real records.
    const raw=isObj(last(raw0))?last(raw0):{},dependencies=technologyDependencies(raw.dependencies),xor=[...new Set([...items(raw.XOR),...items(raw.xor)])],gateTokens=technologyGateTokens(raw);
    out[id]={
      id,sourceFile:String(sourceFile||''),folder:last(raw.folder),startYear:num(raw.start_year??raw.year),researchCost:num(raw.research_cost),
      categories:[...new Set([...items(raw.category),...items(raw.categories)])],
      specialProjectSpecializations:items(raw.special_project_specialization),
      paths:technologyPaths(raw.path),pathPrerequisites:[],dependencies,xor,
      enableEquipment:items(raw.enable_equipments),enableModules:items(raw.enable_equipment_modules),enableSubUnits:items(raw.enable_subunits),subTechnologies:items(raw.sub_technologies),
      isSpecialProjectTech:last(raw.is_special_project_tech)===true,
      requirements:{dependencies:Object.keys(dependencies),path:[],xor:[...xor],allow:raw.allow===undefined?null:clean(raw.allow),allowBranch:raw.allow_branch===undefined?null:clean(raw.allow_branch)},
      prerequisites:[...new Set([...Object.keys(dependencies),...gateTokens])],raw:clean(raw)
    };
  }
  return out;
}

export function normalizeTechnologyGraph(technologies){
  const out=technologies||{};
  for(const tech of Object.values(out)){
    tech.pathPrerequisites=[];
    tech.requirements={...(tech.requirements||{}),dependencies:Object.keys(tech.dependencies||{}),path:[],xor:[...(tech.xor||[])]};
  }
  for(const source of Object.values(out))for(const path of source.paths||[]){
    const target=out[path?.leadsToTech];if(!target)continue;
    if(!target.pathPrerequisites.includes(source.id))target.pathPrerequisites.push(source.id);
  }
  for(const tech of Object.values(out)){
    tech.pathPrerequisites.sort();
    tech.requirements.path=[...tech.pathPrerequisites];
    const gateTokens=technologyGateTokens(tech.raw||{});
    tech.prerequisites=[...new Set([...tech.pathPrerequisites,...Object.keys(tech.dependencies||{}),...gateTokens])];
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
    out[id]={id,kind,folder:last(raw.folder),track:last(raw.track),tracks:items(raw.tracks),xpCost:num(raw.xp_cost),prerequisites:prerequisiteTokens(raw),raw:clean(raw)};
  }
  return out;
}

export async function buildExtendedDataPack(files){
  const list=[...files],pack=await buildDataPack(list);
  pack.technologies=pack.technologies||{};pack.combatTactics=pack.combatTactics||{};pack.modifiers=pack.modifiers||{};pack.specialProjects=pack.specialProjects||{};pack.equipmentUpgrades=pack.equipmentUpgrades||{};pack.doctrines=pack.doctrines||{};
  for(const file of list){
    const sourceFile=String(file.webkitRelativePath||file.name||'');
    const path=sourceFile.replaceAll('\\','/').toLowerCase();
    if(!/\.(txt|gui|asset)$/i.test(file.name||path))continue;
    const relevant=path.includes('/technolog')||path.includes('/combat_tactic')||path.includes('/modifier_definition')||path.includes('/special_project')||path.includes('/equipment/upgrades')||path.includes('/doctrine');
    if(!relevant)continue;
    let parsed;try{parsed=parseClausewitz(await file.text());}catch{continue;}
    if(path.includes('/technolog'))merge(pack.technologies,extractTechnologies(parsed,sourceFile));
    if(path.includes('/combat_tactic'))merge(pack.combatTactics,extractCombatTactics(parsed));
    if(path.includes('/modifier_definition'))merge(pack.modifiers,extractModifierDefinitions(parsed));
    if(path.includes('/special_project'))merge(pack.specialProjects,extractSpecialProjects(parsed));
    if(path.includes('/equipment/upgrades'))merge(pack.equipmentUpgrades,extractEquipmentUpgrades(parsed));
    if(path.includes('/doctrines/grand_doctrines/'))merge(pack.doctrines,extractDoctrines(parsed,'grand'));
    else if(path.includes('/doctrines/tracks/'))merge(pack.doctrines,extractDoctrines(parsed,'track'));
    else if(path.includes('/doctrines/subdoctrines/'))merge(pack.doctrines,extractDoctrines(parsed,'subdoctrine'));
    else if(path.includes('/doctrine'))merge(pack.doctrines,extractDoctrines(parsed,'legacy'));
  }
  normalizeTechnologyGraph(pack.technologies);
  pack.meta={...(pack.meta||{}),technologyCount:Object.keys(pack.technologies).length,tacticCount:Object.keys(pack.combatTactics).length,modifierCount:Object.keys(pack.modifiers).length,specialProjectCount:Object.keys(pack.specialProjects).length,equipmentUpgradeCount:Object.keys(pack.equipmentUpgrades).length,doctrineCount:Object.keys(pack.doctrines).length,parserVersion:'0.15.0'};
  return pack;
}

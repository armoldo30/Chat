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

function technologyVariables(parsed){
  const root=isObj(last(parsed?.technologies))?last(parsed.technologies):{},out={};
  for(const [id,value] of Object.entries(root))if(String(id).startsWith('@'))out[id]=value;
  return out;
}
function resolveTechnologyScalar(value,variables,seen=new Set()){
  const raw=last(value);
  if(typeof raw!=='string'||!raw.startsWith('@')||!Object.prototype.hasOwnProperty.call(variables||{},raw))return raw;
  if(seen.has(raw))return raw;
  const next=new Set(seen);next.add(raw);return resolveTechnologyScalar(variables[raw],variables,next);
}
function resolveTechnologyValue(value,variables){
  if(Array.isArray(value))return value.map(x=>resolveTechnologyValue(x,variables));
  if(isObj(value)){
    const out={};for(const [key,item] of Object.entries(value))out[key]=resolveTechnologyValue(item,variables);return out;
  }
  return resolveTechnologyScalar(value,variables);
}
function technologyNum(value,variables){
  const resolved=resolveTechnologyScalar(value,variables);return Number.isFinite(Number(resolved))?Number(resolved):undefined;
}

function technologyPaths(v,variables){
  return blockList(v).map(path=>({
    leadsToTech:String(resolveTechnologyScalar(path.leads_to_tech,variables)||''),
    researchCostCoeff:technologyNum(path.research_cost_coeff,variables)
  })).filter(path=>path.leadsToTech);
}

function technologyDependencies(v,variables){
  const source=isObj(last(v))?last(v):{},out={};
  for(const [id,value] of Object.entries(source)){
    if(id==='__items')continue;
    const parsed=technologyNum(value,variables);out[id]=parsed===undefined?resolveTechnologyScalar(value,variables):parsed;
  }
  return out;
}

function technologyGateTokens(raw){
  return [...new Set([...prerequisiteTokens(raw?.allow),...prerequisiteTokens(raw?.allow_branch)])];
}

const TECHNOLOGY_STRUCTURAL_KEYS=new Set([
  'research_cost','start_year','year','categories','category','folder','path','dependencies','XOR','xor',
  'enable_equipments','enable_equipment_modules','enable_subunits','sub_technologies','special_project_specialization','is_special_project_tech',
  'allow','allow_branch','ai_will_do','ai_research_weights','xp_research_type','xp_boost_cost','xp_research_bonus',
  'force_use_small_tech_layout','show_effect_as_desc','show_equipment_icon','desc','sub_tech_index'
]);
function technologyDirectEffects(raw,variables){
  const out={};
  for(const [key,value] of Object.entries(raw||{})){
    if(key==='__items'||TECHNOLOGY_STRUCTURAL_KEYS.has(key)||key==='on_research_complete'||key==='on_research_complete_limit')continue;
    out[key]=clean(resolveTechnologyValue(value,variables));
  }
  return out;
}
function technologyScriptedEffects(raw,variables){
  return {
    onResearchComplete:raw?.on_research_complete===undefined?null:clean(resolveTechnologyValue(raw.on_research_complete,variables)),
    limit:raw?.on_research_complete_limit===undefined?null:clean(resolveTechnologyValue(raw.on_research_complete_limit,variables))
  };
}

export function extractTechnologies(parsed,sourceFile=''){
  const out={},variables=technologyVariables(parsed);
  for(const [id,raw0] of entries(parsed,'technologies')){
    // Script variables live beside technology definitions in HOI4 files. They are source constants, not technologies.
    if(String(id).startsWith('@'))continue;
    // Empty technology blocks are valid (for example fleet_submarines), so preserve them as real records.
    const raw=isObj(last(raw0))?last(raw0):{},dependencies=technologyDependencies(raw.dependencies,variables),xor=[...new Set([...items(raw.XOR),...items(raw.xor)])],gateTokens=technologyGateTokens(raw);
    out[id]={
      id,sourceFile:String(sourceFile||''),folder:last(raw.folder),startYear:technologyNum(raw.start_year??raw.year,variables),researchCost:technologyNum(raw.research_cost,variables),
      categories:[...new Set([...items(raw.category),...items(raw.categories)])],
      specialProjectSpecializations:items(raw.special_project_specialization),
      paths:technologyPaths(raw.path,variables),pathPrerequisites:[],dependencies,xor,
      enableEquipment:items(raw.enable_equipments),enableModules:items(raw.enable_equipment_modules),enableSubUnits:items(raw.enable_subunits),subTechnologies:items(raw.sub_technologies),
      isSpecialProjectTech:last(raw.is_special_project_tech)===true,
      requirements:{dependencies:Object.keys(dependencies),path:[],xor:[...xor],allow:raw.allow===undefined?null:clean(raw.allow),allowBranch:raw.allow_branch===undefined?null:clean(raw.allow_branch)},
      directEffects:technologyDirectEffects(raw,variables),scriptedEffects:technologyScriptedEffects(raw,variables),
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

export function normalizeCombatTacticRecord(id,raw0,sourceFile=''){
  const raw=isObj(last(raw0))?last(raw0):{},baseBlock=isObj(last(raw.base))?last(raw.base):{};
  const baseFactor=num(baseBlock.factor??raw.base);
  return {
    id,sourceFile:String(sourceFile||''),days:num(raw.days),isAttacker:last(raw.is_attacker),active:raw.active===undefined?null:clean(raw.active),
    phase:last(raw.phase),displayPhase:last(raw.display_phase),picture:last(raw.picture),base:baseFactor,baseFactor,baseBlock:clean(baseBlock),
    counteredBy:items(raw.countered_by),attacker:num(raw.attacker),defender:num(raw.defender),
    attackerMovementSpeed:num(raw.attacker_movement_speed),defenderMovementSpeed:num(raw.defender_movement_speed),
    attackerOrgDamageModifier:num(raw.attacker_org_damage_modifier),defenderOrgDamageModifier:num(raw.defender_org_damage_modifier),combatWidth:num(raw.combat_width),
    trigger:raw.trigger===undefined?null:clean(raw.trigger),onlyShowFor:raw.only_show_for===undefined?null:clean(raw.only_show_for),
    prerequisites:prerequisiteTokens(raw),raw:clean(raw)
  };
}

export function extractCombatTactics(parsed,sourceFile=''){
  const roots=['combat_tactic','combat_tactics','tactics'];const out={};
  for(const root of roots)for(const [id,raw0] of entries(parsed,root))out[id]=normalizeCombatTacticRecord(id,raw0,sourceFile);
  if(!Object.keys(out).length)for(const [id,raw0] of entries(parsed)){
    const raw=isObj(last(raw0))?last(raw0):{};
    if(raw.trigger||raw.allowed||raw.attacker||raw.defender||raw.countered_by||raw.attacker_movement_speed||raw.defender_movement_speed)out[id]=normalizeCombatTacticRecord(id,raw0,sourceFile);
  }
  return out;
}

export function normalizeModifierDefinitionRecord(id,raw0,sourceFile=''){
  const raw=isObj(last(raw0))?last(raw0):{};
  return {id,sourceFile:String(sourceFile||''),colorType:last(raw.color_type),valueType:last(raw.value_type),precision:num(raw.precision),postfix:last(raw.postfix),category:last(raw.category),categories:items(raw.category),raw:clean(raw)};
}

export function extractModifierDefinitions(parsed,sourceFile=''){
  const out={};
  for(const [id,raw0] of entries(parsed)){
    const raw=isObj(last(raw0))?last(raw0):null;if(!raw)continue;
    out[id]=normalizeModifierDefinitionRecord(id,raw0,sourceFile);
  }
  return out;
}

export function extractTerrainDetails(parsed,sourceFile=''){
  const out={},root=isObj(last(parsed?.categories))?last(parsed.categories):{};
  for(const [id,raw0] of Object.entries(root)){
    if(id==='__items')continue;
    const raw=isObj(last(raw0))?last(raw0):{},units=isObj(last(raw.units))?last(raw.units):{};
    const width=num(raw.combat_width),reinforceWidth=num(raw.combat_support_width??raw.combat_width_addition??raw.reinforce_width);
    if(width===undefined&&reinforceWidth===undefined)continue;
    out[id]={
      id,sourceFile:String(sourceFile||''),width,reinforceWidth,attack:num(units.attack??raw.attack),defense:num(units.defence??units.defense??raw.defence??raw.defense),unitMovement:num(units.movement),
      movementCost:num(raw.movement_cost),attrition:num(raw.attrition),enemyAirSuperiorityFactor:num(raw.enemy_army_bonus_air_superiority_factor??raw.enemy_air_superiority_factor),
      supplyFlowPenaltyFactor:num(raw.supply_flow_penalty_factor),truckAttritionFactor:num(raw.truck_attrition_factor),sicknessChance:num(raw.sickness_chance),raw:clean(raw)
    };
  }
  return out;
}

export function extractSubUnitTerrainDetails(parsed,sourceFile=''){
  const out={};
  for(const [id,raw0] of entries(parsed,'sub_units')){
    const raw=isObj(last(raw0))?last(raw0):{},terrainModifiers={};
    for(const [scope,block0] of Object.entries(raw)){
      if(scope==='__items')continue;
      const block=isObj(last(block0))?last(block0):{};if(!Object.keys(block).length)continue;
      const attack=num(block.attack),defense=num(block.defence??block.defense),movement=num(block.movement);
      if(attack===undefined&&defense===undefined&&movement===undefined)continue;
      terrainModifiers[scope]={...(attack===undefined?{}:{attack}),...(defense===undefined?{}:{defense}),...(movement===undefined?{}:{movement})};
    }
    if(Object.keys(terrainModifiers).length)out[id]={id,sourceFile:String(sourceFile||''),terrainModifiers};
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
function doctrineGateTokens(raw){
  return [...new Set([...prerequisiteTokens(raw?.available),...prerequisiteTokens(raw?.visible),...prerequisiteTokens(raw?.allowed)])];
}
export function extractDoctrines(parsed,kind='unknown',sourceFile=''){
  const out={};
  for(const [id,raw0] of entries(parsed)){
    if(String(id).startsWith('@'))continue;
    const raw=isObj(last(raw0))?last(raw0):{};
    if(!Object.keys(raw).length)continue;
    const xor=items(raw.xor);
    out[id]={id,kind,sourceFile:String(sourceFile||''),folder:last(raw.folder),track:last(raw.track),tracks:items(raw.tracks),xpCost:num(raw.xp_cost),xor,
      requirements:{available:raw.available===undefined?null:clean(raw.available),visible:raw.visible===undefined?null:clean(raw.visible),allowed:raw.allowed===undefined?null:clean(raw.allowed),xor:[...xor]},
      prerequisites:doctrineGateTokens(raw),raw:clean(raw)};
  }
  return out;
}

export function extractDoctrineMetadata(parsed,sourceFile=''){
  const out={};
  for(const [id,raw0] of entries(parsed)){
    if(String(id).startsWith('@'))continue;
    const raw=isObj(last(raw0))?last(raw0):{};
    if(!Object.keys(raw).length)continue;
    out[id]={id,kind:'metadata',sourceFile:String(sourceFile||''),raw:clean(raw)};
  }
  return out;
}

export async function buildExtendedDataPack(files){
  const list=[...files],pack=await buildDataPack(list);
  pack.technologies=pack.technologies||{};pack.combatTactics=pack.combatTactics||{};pack.modifiers=pack.modifiers||{};pack.specialProjects=pack.specialProjects||{};pack.equipmentUpgrades=pack.equipmentUpgrades||{};pack.doctrines=pack.doctrines||{};pack.doctrineMetadata=pack.doctrineMetadata||{};
  for(const file of list){
    const sourceFile=String(file.webkitRelativePath||file.name||'');
    const path=sourceFile.replaceAll('\\','/').toLowerCase();
    if(!/\.(txt|gui|asset)$/i.test(file.name||path))continue;
    const unitSource=path.includes('/units/')&&!path.includes('/units/equipment/');
    const terrainSource=path.includes('/terrain/');
    const relevant=path.includes('/technolog')||path.includes('/combat_tactic')||path.includes('/modifier_definition')||path.includes('/special_project')||path.includes('/equipment/upgrades')||path.includes('/doctrine')||unitSource||terrainSource;
    if(!relevant)continue;
    let parsed;try{parsed=parseClausewitz(await file.text());}catch{continue;}
    if(path.includes('/technolog'))merge(pack.technologies,extractTechnologies(parsed,sourceFile));
    if(path.includes('/combat_tactic'))merge(pack.combatTactics,extractCombatTactics(parsed,sourceFile));
    if(path.includes('/modifier_definition'))merge(pack.modifiers,extractModifierDefinitions(parsed,sourceFile));
    if(path.includes('/special_project'))merge(pack.specialProjects,extractSpecialProjects(parsed));
    if(path.includes('/equipment/upgrades'))merge(pack.equipmentUpgrades,extractEquipmentUpgrades(parsed));
    if(terrainSource)for(const [id,details] of Object.entries(extractTerrainDetails(parsed,sourceFile)))pack.terrain[id]={...(pack.terrain[id]||{}),...details};
    if(unitSource)for(const [id,details] of Object.entries(extractSubUnitTerrainDetails(parsed,sourceFile)))if(pack.subUnits?.[id])pack.subUnits[id]={...pack.subUnits[id],...details};
    if(path.includes('/doctrines/grand_doctrines/'))merge(pack.doctrines,extractDoctrines(parsed,'grand',sourceFile));
    else if(path.includes('/doctrines/tracks/'))merge(pack.doctrines,extractDoctrines(parsed,'track',sourceFile));
    else if(path.includes('/doctrines/subdoctrines/'))merge(pack.doctrines,extractDoctrines(parsed,'subdoctrine',sourceFile));
    else if(path.includes('/doctrine'))merge(pack.doctrineMetadata,extractDoctrineMetadata(parsed,sourceFile));
  }
  normalizeTechnologyGraph(pack.technologies);
  const technologyRecords=Object.values(pack.technologies);
  pack.meta={...(pack.meta||{}),technologyCount:technologyRecords.length,technologyDirectEffectCount:technologyRecords.filter(tech=>Object.keys(tech.directEffects||{}).length).length,technologyScriptedEffectCount:technologyRecords.filter(tech=>tech.scriptedEffects?.onResearchComplete!==null||tech.scriptedEffects?.limit!==null).length,tacticCount:Object.keys(pack.combatTactics).length,modifierCount:Object.keys(pack.modifiers).length,specialProjectCount:Object.keys(pack.specialProjects).length,equipmentUpgradeCount:Object.keys(pack.equipmentUpgrades).length,doctrineCount:Object.keys(pack.doctrines).length,doctrineMetadataCount:Object.keys(pack.doctrineMetadata).length,terrainDetailParser:true,subUnitTerrainDetailParser:true,parserVersion:'0.15.0'};
  return pack;
}
const NUM=/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/;

function put(obj,key,value){
  if(Object.prototype.hasOwnProperty.call(obj,key)){
    obj[key]=Array.isArray(obj[key])?[...obj[key],value]:[obj[key],value];
  }else obj[key]=value;
}

export function tokenizeClausewitz(text){
  const out=[]; let i=0;
  while(i<text.length){
    const c=text[i];
    if(/\s/.test(c)||c===','){i++;continue;}
    if(c==='#'){while(i<text.length&&text[i]!=='\n')i++;continue;}
    if(c==='/'&&text[i+1]==='/'){i+=2;while(i<text.length&&text[i]!=='\n')i++;continue;}
    if(c==='{'||c==='}'||c==='='){out.push(c);i++;continue;}
    if(c==='"'){
      let s='';i++;
      while(i<text.length&&text[i]!=='"'){
        if(text[i]==='\\'&&i+1<text.length){i++;s+=text[i++];}else s+=text[i++];
      }
      if(text[i]==='"')i++;out.push({type:'string',value:s});continue;
    }
    let j=i;
    while(j<text.length&&!/\s/.test(text[j])&&!['{','}','=',',','#'].includes(text[j])){
      if(text[j]==='/'&&text[j+1]==='/')break;
      j++;
    }
    if(j===i){i++;continue;}
    out.push(text.slice(i,j));i=j;
  }
  return out;
}

function scalar(token){
  const raw=typeof token==='object'?token.value:token;
  if(typeof token==='object'&&token.type==='string')return raw;
  if(NUM.test(raw))return Number(raw);
  if(raw==='yes'||raw==='true')return true;
  if(raw==='no'||raw==='false')return false;
  return raw;
}

export function parseClausewitz(text){
  const tokens=tokenizeClausewitz(text); let at=0;
  function value(){
    const t=tokens[at++];
    if(t==='{')return block(true);
    return scalar(t);
  }
  function block(expectClose=false){
    const obj={},items=[];
    while(at<tokens.length){
      if(tokens[at]==='}'){
        if(expectClose)at++;
        break;
      }
      // HOI4 uses anonymous object entries inside list blocks (notably doctrine milestones).
      // Preserve them as list items instead of discarding the opening brace.
      if(tokens[at]==='{'){at++;items.push(block(true));continue;}
      const key=tokens[at++];
      if(key==='=')continue;
      if(tokens[at]==='='){
        at++;put(obj,String(scalar(key)),value());
      }else items.push(scalar(key));
    }
    if(!Object.keys(obj).length)return items;
    if(items.length)obj.__items=items;
    return obj;
  }
  return block(false);
}

export function parseDefinesLua(text){
  const out={};
  // Modern HOI4 defines are primarily nested: NDefines = { NMilitary = { KEY = 1 } }.
  // Some override files still use NDefines.NMilitary.KEY = 1, so support both forms.
  const dotted=/(?:NDefines\.)?(N[A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|true|false)/g;
  let m;
  while((m=dotted.exec(text))){
    const group=out[m[1]]||(out[m[1]]={});
    group[m[2]]=m[3]==='true'?true:m[3]==='false'?false:Number(m[3]);
  }
  let depth=0,inside=false,group=null;
  for(const original of String(text||'').split(/\r?\n/)){
    const line=original.replace(/--.*$/,'').trim();
    if(!line)continue;
    if(!inside){
      if(/^NDefines\s*=\s*\{/.test(line)){inside=true;depth+=(line.match(/\{/g)||[]).length-(line.match(/\}/g)||[]).length;}
      continue;
    }
    if(depth===1){
      const gm=line.match(/^(N[A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{/);
      if(gm)group=gm[1];
    }
    if(group&&depth===2){
      const kv=line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|true|false)\s*,?/);
      if(kv){const target=out[group]||(out[group]={});target[kv[1]]=kv[2]==='true'?true:kv[2]==='false'?false:Number(kv[2]);}
    }
    depth+=(line.match(/\{/g)||[]).length-(line.match(/\}/g)||[]).length;
    if(depth<2)group=null;
    if(depth<=0){inside=false;depth=0;group=null;}
  }
  return out;
}

function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
function num(v){return Number.isFinite(Number(v))?Number(v):undefined;}
function last(v){return Array.isArray(v)?v.at(-1):v;}
function plainNeed(v){
  const out={};for(const [k,q] of Object.entries(obj(last(v)))){if(k==='__items')continue;const n=num(last(q));if(n!==undefined)out[k]=n;}return out;
}
function plainMap(v){
  const out={};for(const [k,q] of Object.entries(obj(last(v)))){if(k==='__items')continue;const value=last(q);out[k]=value&&typeof value==='object'&&!Array.isArray(value)?plainMap(value):value;}return out;
}
function items(v){
  if(Array.isArray(v))return v.map(String);
  if(v&&typeof v==='object'&&Array.isArray(v.__items))return v.__items.map(String);
  if(typeof v==='string')return [v];
  return [];
}

export function extractSubUnits(parsed){
  const root=obj(last(parsed?.sub_units)),out={};
  for(const [id,raw0] of Object.entries(root)){
    if(id==='__items')continue;const raw=obj(last(raw0));
    out[id]={
      id,group:last(raw.group),types:items(last(raw.type)),categories:items(last(raw.categories)),
      width:num(last(raw.combat_width)),hp:num(last(raw.max_strength)),org:num(last(raw.max_organisation)),manpower:num(last(raw.manpower)),
      supply:num(last(raw.supply_consumption)),hardness:num(last(raw.hardness)),armor:num(last(raw.armor_value)),piercing:num(last(raw.ap_attack)),
      soft:num(last(raw.soft_attack)),hard:num(last(raw.hard_attack)),def:num(last(raw.defense)),breakthrough:num(last(raw.breakthrough)),airAttack:num(last(raw.air_attack)),
      need:plainNeed(raw.need)
    };
  }
  return out;
}

export function extractEquipment(parsed){
  const root=obj(last(parsed?.equipments)),out={};
  for(const [id,raw0] of Object.entries(root)){
    if(id==='__items')continue;const raw=obj(last(raw0));
    out[id]={
      id,year:num(last(raw.year)),archetype:last(raw.archetype),parent:last(raw.parent),cost:num(last(raw.build_cost_ic)),
      reliability:num(last(raw.reliability)),def:num(last(raw.defense)),breakthrough:num(last(raw.breakthrough)),hardness:num(last(raw.hardness)),armor:num(last(raw.armor_value)),
      soft:num(last(raw.soft_attack)),hard:num(last(raw.hard_attack)),piercing:num(last(raw.ap_attack)),airAttack:num(last(raw.air_attack)),
      speed:num(last(raw.maximum_speed)),fuel:num(last(raw.fuel_consumption)),weight:num(last(raw.weight)),thrust:num(last(raw.thrust)),
      airDefense:num(last(raw.air_defence)),airAgility:num(last(raw.air_agility)),airRange:num(last(raw.air_range)),groundAttack:num(last(raw.air_ground_attack)),navalAttack:num(last(raw.naval_strike_attack)),
      resources:plainNeed(raw.resources),moduleSlots:plainMap(raw.module_slots),types:items(last(raw.type)),upgrades:items(last(raw.upgrades)),raw:plainMap(raw)
    };
  }
  return out;
}

export function extractEquipmentModules(parsed){
  let root=obj(last(parsed?.equipment_modules??parsed?.modules));
  if(!Object.keys(root).length){
    root={};
    for(const [id,raw0] of Object.entries(parsed||{})){
      const raw=obj(last(raw0));
      if(raw.category&&(raw.add_stats||raw.multiply_stats||raw.add_average_stats||raw.build_cost_resources))root[id]=raw0;
    }
  }
  const out={};
  for(const [id,raw0] of Object.entries(root)){
    if(id==='__items')continue;const raw=obj(last(raw0));
    out[id]={id,category:last(raw.category),guiCategory:last(raw.gui_category),parent:last(raw.parent),addStats:plainNeed(raw.add_stats),multiplyStats:plainNeed(raw.multiply_stats),addAverageStats:plainNeed(raw.add_average_stats),resources:plainNeed(raw.build_cost_resources),allowEquipmentType:items(last(raw.allow_equipment_type)),forbidEquipmentType:items(last(raw.forbid_equipment_type)),addEquipmentType:items(last(raw.add_equipment_type)),xpCost:num(last(raw.xp_cost)),raw:plainMap(raw)};
  }
  return out;
}


export function extractMIOs(parsed){
  const out={};
  const normalizeTrait=(raw0,fallback)=>{
    const raw=obj(last(raw0));
    const token=String(last(raw.token)||fallback||'');
    if(!token)return null;
    return {id:token,name:String(last(raw.name)||token),equipmentBonus:plainNeed(raw.equipment_bonus),productionBonus:plainNeed(raw.production_bonus),organizationModifier:plainNeed(raw.organization_modifier),parents:items(raw.any_parent),allParents:items(raw.all_parents),mutuallyExclusive:items(raw.mutually_exclusive),equipmentTypes:items(raw.limit_to_equipment_type)};
  };
  for(const [id,raw0] of Object.entries(parsed||{})){
    if(id==='__items')continue;const raw=obj(last(raw0));
    if(!(raw.include||raw.equipment_type||raw.equipment_types||raw.initial_trait||raw.trait||raw.add_trait||raw.override_trait||raw.allowed))continue;
    const allowed=obj(last(raw.allowed));
    let countries=items(allowed.original_tag);
    if(!countries.length&&typeof last(allowed.original_tag)==='string')countries=[String(last(allowed.original_tag))];
    const initList=arrify(raw.initial_trait),initial={equipmentBonus:{},productionBonus:{},organizationModifier:{}};
    for(const x of initList){const t=obj(last(x));Object.assign(initial.equipmentBonus,{...initial.equipmentBonus,...plainNeed(t.equipment_bonus)});Object.assign(initial.productionBonus,{...initial.productionBonus,...plainNeed(t.production_bonus)});Object.assign(initial.organizationModifier,{...initial.organizationModifier,...plainNeed(t.organization_modifier)});}
    const traits={};
    for(const source of [raw.trait,raw.add_trait,raw.override_trait])for(const t0 of arrify(source)){const t=normalizeTrait(t0);if(t)traits[t.id]=t;}
    out[id]={id,name:String(last(raw.name)||id),include:String(last(raw.include)||''),countries,equipmentTypes:[...new Set([...items(raw.equipment_type),...items(raw.equipment_types)])],initial,traits};
  }
  return out;
}
function arrify(v){return v==null?[]:Array.isArray(v)?v:[v];}
export function resolveMIOs(mios){
  const source=mios||{},resolved={},visiting=new Set();
  const visit=id=>{
    if(resolved[id])return resolved[id];const raw=source[id];if(!raw)return null;
    if(visiting.has(id))return {...raw,inheritanceWarning:'cycle'};visiting.add(id);
    const parent=raw.include&&raw.include!==id?visit(raw.include):null;
    const mergeBonus=(a,b)=>({...a,...b});
    const base=parent||{};const result={...base,...raw,id,
      countries:raw.countries?.length?raw.countries:[...(base.countries||[])],
      equipmentTypes:raw.equipmentTypes?.length?raw.equipmentTypes:[...(base.equipmentTypes||[])],
      initial:{equipmentBonus:mergeBonus(base.initial?.equipmentBonus,raw.initial?.equipmentBonus),productionBonus:mergeBonus(base.initial?.productionBonus,raw.initial?.productionBonus),organizationModifier:mergeBonus(base.initial?.organizationModifier,raw.initial?.organizationModifier)},
      traits:{...(base.traits||{}),...(raw.traits||{})}
    };
    if(raw.include&&!parent)result.inheritanceWarning=`missing-include:${raw.include}`;
    visiting.delete(id);resolved[id]=result;return result;
  };
  for(const id of Object.keys(source))visit(id);return resolved;
}

export function resolveEquipment(packOrEquipment){
  const source=packOrEquipment?.equipment||packOrEquipment||{},resolved={},visiting=new Set();
  const definedEntries=obj=>Object.fromEntries(Object.entries(obj||{}).filter(([,value])=>value!==undefined));
  const visit=id=>{
    if(resolved[id])return resolved[id];
    const raw=source[id];if(!raw)return null;
    if(visiting.has(id))return {...definedEntries(raw),id,inheritanceWarning:'cycle'};
    visiting.add(id);
    let base={},warnings=[];
    for(const parentId of [raw.archetype,raw.parent]){
      if(!parentId||parentId===id)continue;
      const parent=visit(parentId);
      if(parent){
        base={...base,...definedEntries(parent),resources:{...(base.resources||{}),...(parent.resources||{})}};
        if(parent.inheritanceWarning)warnings.push(parent.inheritanceWarning);
      }else warnings.push(`missing-parent:${parentId}`);
    }
    const own=definedEntries(raw);
    const result={...base,...own,resources:{...(base.resources||{}),...(raw.resources||{})},id};
    if(warnings.length)result.inheritanceWarning=[...new Set(warnings)].join(',');
    visiting.delete(id);resolved[id]=result;return result;
  };
  for(const id of Object.keys(source))visit(id);
  return resolved;
}

function equipmentFamilyId(item,resolved){
  if(item?.archetype&&resolved[item.archetype])return item.archetype;
  let cur=item,seen=new Set();
  while(cur?.parent&&resolved[cur.parent]&&!seen.has(cur.parent)){seen.add(cur.parent);cur=resolved[cur.parent];}
  return cur?.id||item?.id;
}

export function equipmentFamilies(packOrEquipment){
  const resolved=resolveEquipment(packOrEquipment),families={};
  for(const item of Object.values(resolved)){
    const family=equipmentFamilyId(item,resolved);(families[family]||(families[family]=[])).push(item);
  }
  for(const list of Object.values(families))list.sort((a,b)=>(a.year??-Infinity)-(b.year??-Infinity)||a.id.localeCompare(b.id));
  return families;
}

export function equipmentSnapshot(packOrEquipment,year){
  const y=Number(year),families=equipmentFamilies(packOrEquipment),out=[];
  for(const [family,items] of Object.entries(families)){
    const dated=items.filter(x=>Number.isFinite(x.year)&&(!Number.isFinite(y)||x.year<=y));
    const chosen=(dated.length?dated.at(-1):items.find(x=>!Number.isFinite(x.year))||items[0]);
    if(chosen)out.push({family,item:chosen,variants:items.length});
  }
  return out.sort((a,b)=>a.family.localeCompare(b.family));
}

export function extractTerrain(parsed){
  const out={};
  const walk=node=>{
    if(!node||typeof node!=='object'||Array.isArray(node))return;
    for(const [id,raw0] of Object.entries(node)){
      const raw=obj(last(raw0));if(!Object.keys(raw).length)continue;
      const units=obj(last(raw.units));
      const width=num(last(raw.combat_width)),reinforceWidth=num(last(raw.combat_support_width??raw.combat_width_addition??raw.reinforce_width));
      const attack=num(last(units.attack??raw.attack)),defense=num(last(units.defense??raw.defense));
      if(width!==undefined||reinforceWidth!==undefined)out[id]={id,width,reinforceWidth,attack,defense};
    }
  };
  walk(parsed);for(const v of Object.values(obj(parsed)))walk(v);
  return out;
}

function mergeMap(target,source){for(const [k,v] of Object.entries(source||{}))target[k]=v;return target;}
function mergeDefines(target,source){for(const [g,vals] of Object.entries(source||{}))Object.assign(target[g]||(target[g]={}),vals);return target;}

export async function buildDataPack(files){
  const pack={
    meta:{format:1,createdAt:new Date().toISOString(),sourceFiles:0,unitFiles:0,equipmentFiles:0,defineFiles:0,terrainFiles:0,technologyFiles:0,moduleFiles:0,mioFiles:0,warnings:[]},
    defines:{},subUnits:{},equipment:{},modules:{},mios:{},terrain:{},technologyFiles:[]
  };
  for(const file of Array.from(files||[])){
    const path=(file.webkitRelativePath||file.name||'').replaceAll('\\','/').toLowerCase();
    if(!/\.(txt|lua)$/i.test(file.name||path))continue;
    const text=await file.text();pack.meta.sourceFiles++;
    try{
      if(path.includes('/defines/')||path.includes('defines')||/(?:NDefines\.)?N[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*\s*=/.test(text)){mergeDefines(pack.defines,parseDefinesLua(text));pack.meta.defineFiles++;continue;}
      if(path.includes('military_industrial_organization/organizations/')||path.startsWith('organizations/')){mergeMap(pack.mios,extractMIOs(parseClausewitz(text)));pack.meta.mioFiles++;continue;}
      if(path.includes('/units/equipment/modules/')||/\bequipment_modules\s*=\s*\{/.test(text)){mergeMap(pack.modules,extractEquipmentModules(parseClausewitz(text)));pack.meta.moduleFiles++;continue;}
      if(path.includes('/units/equipment/')||/\bequipments\s*=\s*\{/.test(text)){mergeMap(pack.equipment,extractEquipment(parseClausewitz(text)));pack.meta.equipmentFiles++;continue;}
      if(path.includes('/units/')||/\bsub_units\s*=\s*\{/.test(text)){mergeMap(pack.subUnits,extractSubUnits(parseClausewitz(text)));pack.meta.unitFiles++;continue;}
      if(path.includes('/terrain/')||path.includes('terrain')){mergeMap(pack.terrain,extractTerrain(parseClausewitz(text)));pack.meta.terrainFiles++;continue;}
      if(path.includes('/technologies/')||path.includes('technolog')||/\btechnologies\s*=\s*\{/.test(text)){pack.technologyFiles.push(file.webkitRelativePath||file.name);pack.meta.technologyFiles++;}
    }catch(error){pack.meta.warnings.push(`${file.name}: ${error?.message||'parse error'}`);}
  }
  pack.mios=resolveMIOs(pack.mios);pack.meta.subUnitCount=Object.keys(pack.subUnits).length;pack.meta.equipmentCount=Object.keys(pack.equipment).length;pack.meta.moduleCount=Object.keys(pack.modules).length;pack.meta.mioCount=Object.keys(pack.mios).length;pack.meta.terrainCount=Object.keys(pack.terrain).length;
  return pack;
}

const SUBUNIT_MAP={
  infantry:'infantry',motorized:'motorized',mechanized:'mechanized',artillery:'artillery_brigade',anti_tank:'anti_tank_brigade',anti_air:'anti_air_brigade',cavalry:'cavalry'
};
const SUPPORT_MAP={engineer:'engineer',support_artillery:'artillery',recon:'recon',support_at:'anti_tank',support_aa:'anti_air',logistics:'logistics_company',signal:'signal_company'};

export function safeStructuralOverrides(pack,battalions,supports,terrain){
  let battalionOverrides=0,supportOverrides=0,terrainOverrides=0;
  for(const [appId,gameId] of Object.entries(SUBUNIT_MAP)){
    const src=pack?.subUnits?.[gameId],dst=battalions?.[appId];if(!src||!dst)continue;
    for(const [a,b] of [['width','width'],['manpower','manpower'],['org','org'],['hp','hp'],['supply','supply']])if(src[a]!==undefined)dst[b]=src[a];
    if(['infantry','mobile','armor'].includes(src.group))dst.group=src.group;
    if(Object.keys(src.need||{}).length)dst.need={...src.need};battalionOverrides++;
  }
  for(const [appId,gameId] of Object.entries(SUPPORT_MAP)){
    const src=pack?.subUnits?.[gameId],dst=supports?.[appId];if(!src||!dst)continue;
    for(const [a,b] of [['manpower','manpower'],['org','org'],['hp','hp'],['supply','supply']])if(src[a]!==undefined)dst[b]=src[a];
    if(Object.keys(src.need||{}).length)dst.need={...src.need};supportOverrides++;
  }
  for(const [id,dst] of Object.entries(terrain||{})){
    const src=pack?.terrain?.[id];if(!src)continue;if(src.width!==undefined)dst.width=src.width;if(src.reinforceWidth!==undefined)dst.reinforceWidth=src.reinforceWidth;if(src.attack!==undefined)dst.attack=src.attack;if(src.defense!==undefined)dst.def=src.defense;terrainOverrides++;
  }
  return {battalionOverrides,supportOverrides,terrainOverrides};
}

export function defineOverrides(pack,combat,production){
  const m=pack?.defines?.NMilitary||pack?.defines?.NProduction||{};let combatCount=0,productionCount=0;
  const set=(obj,key,value)=>{if(Number.isFinite(Number(value))){obj[key]=Number(value);return 1;}return 0;};
  const mil=pack?.defines?.NMilitary||{};
  if(Number.isFinite(mil.BASE_CHANCE_TO_AVOID_HIT)){combat.defendedHitChance=1-mil.BASE_CHANCE_TO_AVOID_HIT/100;combatCount++;}
  if(Number.isFinite(mil.CHANCE_TO_AVOID_HIT_AT_NO_DEF)){combat.undefendedHitChance=1-mil.CHANCE_TO_AVOID_HIT_AT_NO_DEF/100;combatCount++;}
  if(Number.isFinite(mil.COMBAT_OVER_WIDTH_PENALTY_MAX)){combat.overWidthPenaltyCap=Math.abs(mil.COMBAT_OVER_WIDTH_PENALTY_MAX);combatCount++;}
  if(Number.isFinite(mil.COMBAT_OVER_WIDTH_PENALTY)){combat.overWidthPenaltyMultiplier=Math.abs(mil.COMBAT_OVER_WIDTH_PENALTY);combatCount++;}
  if(Number.isFinite(mil.COMBAT_STACKING_START)){combat.stackingLimitBase=mil.COMBAT_STACKING_START;combatCount++;}
  if(Number.isFinite(mil.COMBAT_STACKING_EXTRA)){combat.stackingLimitPerDirection=mil.COMBAT_STACKING_EXTRA;combatCount++;}
  if(Number.isFinite(mil.COMBAT_STACKING_PENALTY)){combat.stackingPenaltyPerDivision=Math.abs(mil.COMBAT_STACKING_PENALTY);combatCount++;}
  if(Number.isFinite(mil.BASE_FORT_PENALTY)){combat.fortPenaltyPerLevel=Math.abs(mil.BASE_FORT_PENALTY);combatCount++;}
  if(Number.isFinite(mil.DIG_IN_FACTOR)){combat.entrenchmentPerPoint=Math.abs(mil.DIG_IN_FACTOR);combatCount++;}
  if(Number.isFinite(mil.ENEMY_AIR_SUPERIORITY_IMPACT)){combat.maxAirSuperiorityPenalty=Math.abs(mil.ENEMY_AIR_SUPERIORITY_IMPACT);combatCount++;}
  if(Number.isFinite(mil.BASE_NIGHT_ATTACK_PENALTY)){combat.nightAttackPenalty=Math.abs(mil.BASE_NIGHT_ATTACK_PENALTY);combatCount++;}
  combatCount+=set(combat,'orgDice',mil.LAND_COMBAT_ORG_DICE_SIZE);
  combatCount+=set(combat,'armoredOrgDice',mil.LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE);
  combatCount+=set(combat,'strengthDice',mil.LAND_COMBAT_STR_DICE_SIZE);
  combatCount+=set(combat,'orgDamageModifier',mil.LAND_COMBAT_ORG_DAMAGE_MODIFIER);
  combatCount+=set(combat,'strengthDamageModifier',mil.LAND_COMBAT_STR_DAMAGE_MODIFIER);
  combatCount+=set(combat,'combatMinimumHours',mil.COMBAT_MINIMUM_TIME);
  combatCount+=set(combat,'equipmentCombatLossFactor',mil.EQUIPMENT_COMBAT_LOSS_FACTOR);
  const prod=pack?.defines?.NProduction||pack?.defines?.NMilitary||{};
  if(Number.isFinite(prod.PRODUCTION_RESOURCE_LACK_PENALTY)){production.resourceLackPenaltyPerUnit=Math.abs(prod.PRODUCTION_RESOURCE_LACK_PENALTY);productionCount++;}
  if(Number.isFinite(prod.MAX_LINE_RESOURCE_PENALTY)){production.maxLineResourcePenalty=Math.abs(prod.MAX_LINE_RESOURCE_PENALTY)>1?Math.abs(prod.MAX_LINE_RESOURCE_PENALTY)/100:Math.abs(prod.MAX_LINE_RESOURCE_PENALTY);productionCount++;}
  productionCount+=set(production,'maxMilitaryFactoriesPerLine',prod.MAX_MIL_FACTORIES_PER_LINE);
  return {combatCount,productionCount};
}

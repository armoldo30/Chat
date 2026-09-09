import { equipmentFamilies, resolveEquipment } from './parser.js';

const LINE_ID_MAP={
  infantry:'infantry',cavalry:'cavalry',motorized:'motorized',mechanized:'mechanized',
  artillery_brigade:'artillery',anti_tank_brigade:'anti_tank',anti_air_brigade:'anti_air',
  light_armor:'light_armor',medium_armor:'medium_armor',heavy_armor:'heavy_armor'
};
const SUPPORT_ID_MAP={
  engineer:'engineer',artillery:'support_artillery',anti_tank:'support_at',anti_air:'support_aa',recon:'recon',
  logistics_company:'logistics',signal_company:'signal',maintenance_company:'maintenance',field_hospital:'field_hospital'
};
const EQUIPMENT_ALIAS={
  infantry_equipment:'infantry_equipment',artillery_equipment:'artillery',anti_tank_equipment:'anti_tank',anti_air_equipment:'anti_air',
  support_equipment:'support_equipment',motorized_equipment:'motorized_equipment',mechanized_equipment:'mechanized_equipment',
  light_tank_equipment:'light_tank',medium_tank_equipment:'medium_tank',heavy_tank_equipment:'heavy_tank'
};
const COMBAT_KEYS={soft:'soft',hard:'hard',def:'def',breakthrough:'breakthrough',piercing:'piercing',airAttack:'airAttack'};

const humanize=id=>String(id||'').replace(/^unit_/,'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const n=v=>Number.isFinite(Number(v))?Number(v):undefined;
const words=u=>[u?.id,u?.group,...(u?.types||[]),...(u?.categories||[])].filter(Boolean).join(' ').toLowerCase();
const indexedRequirements=(pack,kind,id)=>[...new Set(pack?.requirements?.[kind]?.[id]||[])];

export function equipmentAlias(id){return EQUIPMENT_ALIAS[id]||id;}
export function classifySubUnit(u){
  const text=words(u),group=String(u?.group||'').toLowerCase();
  const support=u?.width===undefined||u?.width===0||group==='support'||/category_(?:all_)?support|\bsupport\b/.test(text);
  const regimental=support&&(/regiment|regimental|infantry_gun|heavy_weapon|rocket_battery|anti_air_battery|anti_tank_battery|tank_destroyer.*support|spaa.*support/.test(text));
  let regimentGroup=null;
  if(/armor|tank|spaa|tank_destroyer/.test(text))regimentGroup='armor';
  else if(/motor|mechanized|mobile/.test(text))regimentGroup='mobile';
  else if(regimental)regimentGroup='infantry';
  return {support,regimental,regimentGroup};
}

function normalizedGroup(u){
  const text=words(u),g=String(u?.group||'').toLowerCase();
  if(g==='armor'||/category_all_armor|\barmor\b|\btank\b/.test(text))return 'armor';
  if(g==='mobile'||/motor|mechanized|mobile/.test(text))return 'mobile';
  if(g==='support')return 'support';
  return 'infantry';
}

function familyForNeed(pack,needId){
  const families=equipmentFamilies(pack);
  if(families[needId])return families[needId];
  for(const items of Object.values(families))if(items.some(x=>x.id===needId||x.archetype===needId))return items;
  return [];
}

export function selectEquipment(pack,needId,{year=1940,tier}={}){
  const items=familyForNeed(pack,needId);
  if(!items.length)return null;
  const ordered=[...items].sort((a,b)=>(a.year??-Infinity)-(b.year??-Infinity)||a.id.localeCompare(b.id));
  if(Number.isFinite(Number(tier))){
    const buildable=ordered.filter(x=>x.cost!==undefined||x.year!==undefined);
    return buildable[Math.max(0,Math.min(buildable.length-1,Math.floor(Number(tier))))]||ordered[0];
  }
  const eligible=ordered.filter(x=>!Number.isFinite(Number(x.year))||Number(x.year)<=Number(year));
  return eligible.length?eligible.at(-1):ordered[0];
}

function tierForNeed(needId,profile){
  if(!profile)return undefined;
  if(needId==='infantry_equipment')return profile.infantryEquipment;
  if(needId==='artillery_equipment')return profile.artillery;
  if(needId==='anti_tank_equipment')return profile.antiTank;
  if(needId==='anti_air_equipment')return profile.antiAir;
  return undefined;
}

export function resolveSubUnitFromPack(raw,pack,{year=1940,profile}={}){
  const equipment=[];
  for(const needId of Object.keys(raw?.need||{})){
    const item=selectEquipment(pack,needId,{year,tier:tierForNeed(needId,profile)});
    if(item)equipment.push(item);
  }
  const sum=key=>equipment.reduce((total,item)=>total+(Number(item?.[key])||0),0);
  const apply=(base,modifier)=>Math.max(0,base*(1+(Number(modifier)||0)));
  const out={
    width:n(raw?.width)??0,hp:n(raw?.hp)??0,org:n(raw?.org)??0,manpower:n(raw?.manpower)??0,supply:n(raw?.supply)??0,
    hardness:0,armor:0,piercing:0,soft:0,hard:0,def:0,breakthrough:0,airAttack:0,
    need:Object.fromEntries(Object.entries(raw?.need||{}).map(([k,v])=>[equipmentAlias(k),Number(v)||0]))
  };
  for(const [dst,key] of Object.entries(COMBAT_KEYS))out[dst]=apply(sum(key),raw?.[dst]);
  const weighted=(key)=>{
    let total=0,weight=0;
    for(const [needId,q0] of Object.entries(raw?.need||{})){
      const item=selectEquipment(pack,needId,{year,tier:tierForNeed(needId,profile)}),q=Math.max(0,Number(q0)||0),value=Number(item?.[key]);
      if(item&&Number.isFinite(value)&&q>0){total+=value*q;weight+=q;}
    }
    return weight?total/weight:0;
  };
  out.hardness=apply(weighted('hardness'),raw?.hardness);
  out.armor=apply(Math.max(0,...equipment.map(x=>Number(x?.armor)||0)),raw?.armor);
  out.piercing=apply(Math.max(0,...equipment.map(x=>Number(x?.piercing)||0)),raw?.piercing);
  out.sourceEquipment=equipment.map(x=>x.id);
  out.source='game-pack';
  return out;
}

function appIdForSubUnit(raw){
  const {support}=classifySubUnit(raw);
  if(support)return SUPPORT_ID_MAP[raw.id]||raw.id;
  return LINE_ID_MAP[raw.id]||raw.id;
}

function addEquipmentAliases(pack,equipment,year){
  const families=equipmentFamilies(pack);
  let count=0;
  for(const [family,items] of Object.entries(families)){
    const item=selectEquipment(pack,family,{year});if(!item)continue;
    const id=equipmentAlias(family),record={
      name:humanize(item.id||family),cost:Number(item.cost)||0,resources:{...(item.resources||{})},
      source:'game-pack',gameId:item.id,family,year:item.year,reliability:item.reliability,
      soft:item.soft,hard:item.hard,def:item.def,breakthrough:item.breakthrough,hardness:item.hardness,armor:item.armor,piercing:item.piercing,airAttack:item.airAttack
    };
    equipment[id]=record;
    if(id!==family&&!equipment[family])equipment[family]=record;
    count++;
  }
  return count;
}

export function hydrateGameData(pack,{battalions,supports,equipment,terrain},{year=1940,profile=null}={}){
  const status={equipment:0,battalions:0,supports:0,regimentalSupports:0,terrain:0};
  if(!pack)return status;
  status.equipment=addEquipmentAliases(pack,equipment,year);
  for(const raw of Object.values(pack.subUnits||{})){
    const id=appIdForSubUnit(raw),kind=classifySubUnit(raw),computed=resolveSubUnitFromPack(raw,pack,{year,profile});
    const record={...(kind.support?supports[id]:battalions[id]||{}),...computed,id,name:(kind.support?supports[id]?.name:battalions[id]?.name)||humanize(raw.id),group:normalizedGroup(raw),gameId:raw.id,categories:[...(raw.categories||[])],types:[...(raw.types||[])],regimentalSupport:kind.regimental,regimentGroup:kind.regimentGroup,requirements:indexedRequirements(pack,'subUnits',raw.id),prerequisite:raw.prerequisite||null};
    if(kind.support){supports[id]=record;status.supports++;if(kind.regimental)status.regimentalSupports++;}
    else {battalions[id]=record;status.battalions++;}
  }
  for(const [id,src] of Object.entries(pack.terrain||{})){
    const dst=terrain[id]||(terrain[id]={name:humanize(id),attack:0,def:0});
    if(n(src.width)!==undefined)dst.width=n(src.width);if(n(src.reinforceWidth)!==undefined)dst.reinforceWidth=n(src.reinforceWidth);
    if(n(src.attack)!==undefined)dst.attack=n(src.attack);if(n(src.defense)!==undefined)dst.def=n(src.defense);dst.source='game-pack';status.terrain++;
  }
  return status;
}

export function importedRegimentalSupportIds(supports){return Object.keys(supports||{}).filter(id=>supports[id]?.regimentalSupport);}
export function importedDivisionalSupportIds(supports){return Object.keys(supports||{}).filter(id=>!supports[id]?.regimentalSupport);}

export function prerequisiteText(record){
  const indexed=record?.requirements;if(Array.isArray(indexed)&&indexed.length)return indexed.join(' · ');
  const p=record?.prerequisite;
  if(!p)return '';
  if(typeof p==='string')return p;
  if(Array.isArray(p))return p.join(', ');
  return Object.entries(p).map(([k,v])=>`${humanize(k)}: ${Array.isArray(v)?v.join(', '):String(v)}`).join(' · ');
}

export function gameDataCoverage(pack){
  return {
    subUnits:Object.keys(pack?.subUnits||{}).length,equipment:Object.keys(pack?.equipment||{}).length,modules:Object.keys(pack?.modules||{}).length,
    terrain:Object.keys(pack?.terrain||{}).length,mios:Object.keys(pack?.mios||{}).length,technologies:Object.keys(pack?.technologies||{}).length,
    tactics:Object.keys(pack?.combatTactics||{}).length,modifiers:Object.keys(pack?.modifiers||{}).length,specialProjects:Object.keys(pack?.specialProjects||{}).length
  };
}

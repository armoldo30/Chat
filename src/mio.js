import { resolveMIOs } from './parser.js';
const clone=x=>structuredClone(x);
const arr=v=>Array.isArray(v)?v:v==null?[]:[v];

export const BUILTIN_MIOS={
  GER_porsche_tank:{id:'GER_porsche_tank',name:'Porsche',countries:['GER'],equipmentTypes:['light_tank','medium_tank','heavy_tank','armor'],initial:{equipmentBonus:{armor_value:.03,maximum_speed:.02},productionBonus:{}},traits:{
    reinforced_suspension:{id:'reinforced_suspension',name:'Reinforced Suspension',equipmentBonus:{reliability:.05},productionBonus:{production_cost_factor:.02}},
    high_output_engines:{id:'high_output_engines',name:'High-Output Engines',equipmentBonus:{maximum_speed:.05},productionBonus:{production_cost_factor:.03},parents:[]},
    simplified_components:{id:'simplified_components',name:'Simplified Components',equipmentBonus:{reliability:-.02},productionBonus:{production_cost_factor:-.05,production_efficiency_gain_factor:.05},parents:[]}
  }}
};

export const DEFAULT_MIO_SELECTION={organization:null,traits:[]};
export function normalizeMioSelection(raw){return {organization:raw?.organization||null,traits:[...new Set(arr(raw?.traits).filter(Boolean))]};}

function addBonus(target,source){for(const [k,v] of Object.entries(source||{}))if(Number.isFinite(Number(v)))target[k]=(target[k]||0)+Number(v);return target;}

const MIO_PACK_CACHE=new WeakMap();
export function mioCatalog(pack){
  let imported=pack?.mios||{};
  if(pack?.meta?.mioInheritance==='runtime'&&pack&&typeof pack==='object'){if(!MIO_PACK_CACHE.has(pack))MIO_PACK_CACHE.set(pack,resolveMIOs(imported));imported=MIO_PACK_CACHE.get(pack);}
  return {...BUILTIN_MIOS,...imported};
}
export function mioAvailable(org,country,equipmentFamily){
  if(!org)return false;
  if(org.countries?.length&&country&&!org.countries.includes(country.toUpperCase()))return false;
  if(!equipmentFamily||!org.equipmentTypes?.length)return true;
  const e=String(equipmentFamily).toLowerCase(),types=org.equipmentTypes.map(x=>String(x).toLowerCase());
  const isTank=e.includes('tank'),isSmallAir=e.includes('small_airframe'),isMediumAir=e.includes('medium_airframe');
  return types.some(t=>e.includes(t)||t.includes(e)||(isTank&&(t.includes('tank')||t.includes('armor')))||(isSmallAir&&(t.includes('small_plane')||t.includes('light_aircraft')||t.includes('all_aircraft')))||(isMediumAir&&(t.includes('medium_plane')||t.includes('medium_aircraft')||t.includes('all_aircraft'))));
}
export function traitSelectable(org,traitId,selected){
  const t=org?.traits?.[traitId];if(!t)return false;const set=new Set(selected||[]);
  if(t.parents?.length&&!t.parents.some(x=>set.has(x)))return false;
  if(t.allParents?.length&&!t.allParents.every(x=>set.has(x)))return false;
  if(t.mutuallyExclusive?.some(x=>set.has(x)))return false;
  return true;
}
export function mioEffects(catalog,selection){
  const sel=normalizeMioSelection(selection),org=catalog?.[sel.organization];
  const out={equipmentBonus:{},productionBonus:{},organizationModifier:{},selected:[]};
  if(!org)return out;
  addBonus(out.equipmentBonus,org.initial?.equipmentBonus);addBonus(out.productionBonus,org.initial?.productionBonus);addBonus(out.organizationModifier,org.initial?.organizationModifier);
  const accepted=[];
  for(const id of sel.traits){if(!traitSelectable(org,id,accepted))continue;const t=org.traits?.[id];if(!t)continue;accepted.push(id);addBonus(out.equipmentBonus,t.equipmentBonus);addBonus(out.productionBonus,t.productionBonus);addBonus(out.organizationModifier,t.organizationModifier);}
  out.selected=accepted;return out;
}

const STAT_MAP={soft_attack:'soft',hard_attack:'hard',defense:'def',breakthrough:'breakthrough',armor_value:'armor',ap_attack:'piercing',air_attack:'airAttack',reliability:'reliability',maximum_speed:'speed',air_defence:'airDefense',air_agility:'agility',air_attack:'airAttack',build_cost_ic:'cost'};
export function applyMioEquipmentBonus(record,bonus){
  const out=clone(record||{});for(const [src,v] of Object.entries(bonus||{})){const key=STAT_MAP[src]||src;if(!Number.isFinite(Number(v)))continue;const base=Number(out[key]);if(Number.isFinite(base))out[key]=Math.max(0,base*(1+Number(v)));}
  return out;
}
export function mioProductionAdjustments(effects){
  const p=effects?.productionBonus||{};return {costFactor:1+(p.production_cost_factor||0),outputFactor:1+(p.production_capacity_factor||0),efficiencyCapFactor:1+(p.production_efficiency_cap_factor||0),efficiencyGainFactor:1+(p.production_efficiency_gain_factor||0),resourceNeedFactor:1+(p.production_resource_need_factor||0)};
}

const VARIANT_MAP={soft_attack:'softAttack',hard_attack:'hardAttack',ap_attack:'piercing',armor_value:'armor',breakthrough:'breakthrough',defense:'defense',maximum_speed:'maxSpeed',reliability:'reliability',air_attack:'airAttack',air_defence:'airDefense',air_agility:'agility',ground_attack:'groundAttack',naval_attack:'navalAttack',range:'range',build_cost_ic:'buildCost'};
export function applyMioToVariant(record,effects){
  const out=clone(record||{}),bonus=effects?.equipmentBonus||{};
  for(const [src,v0] of Object.entries(bonus)){const v=Number(v0);if(!Number.isFinite(v))continue;const key=VARIANT_MAP[src]||src;if(Number.isFinite(Number(out[key])))out[key]=Math.max(0,Number(out[key])*(1+v));}
  const prod=mioProductionAdjustments(effects);if(Number.isFinite(Number(out.buildCost)))out.buildCost=Math.max(.01,out.buildCost*prod.costFactor);
  if(out.resources&&prod.resourceNeedFactor!==1)for(const k of Object.keys(out.resources))out.resources[k]=Math.max(0,out.resources[k]*prod.resourceNeedFactor);
  return out;
}
export function applyMioToEquipmentRecord(record,effects){
  const out=applyMioEquipmentBonus(record,effects?.equipmentBonus||{}),prod=mioProductionAdjustments(effects);
  if(Number.isFinite(Number(out.cost)))out.cost=Math.max(.01,out.cost*prod.costFactor);
  if(out.resources&&prod.resourceNeedFactor!==1)for(const k of Object.keys(out.resources))out.resources[k]=Math.max(0,out.resources[k]*prod.resourceNeedFactor);
  out.mioProduction=prod;return out;
}

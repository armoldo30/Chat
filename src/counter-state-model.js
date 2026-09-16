import { battalions, supports, equipment, terrain, COMBAT_CONSTANTS } from './data.js';
import { calcDivision, divisionEquipmentIC } from './engine.js';
import { countsToGrid, normalizeGrid, gridToCounts, filledInRegiment, DESIGNER_COLS } from './designer.js';
import { DEFAULT_TECH_PROFILE, normalizeTechProfile, buildTechAdjustedData } from './tech.js';
import { DEFAULT_MIO_SELECTION, normalizeMioSelection, mioCatalog, mioEffects, applyMioEquipmentBonus, applyMioToEquipmentRecord, applyMioToVariant } from './mio.js';
import { TANK_FAMILIES, defaultTankDesign, normalizeTankDesign, buildTankDesign, applyTankDesignToBattalion, tankEquipmentRecord, tankRolesForFamily, tankVariantTargets, tankMioFamily } from './tank.js';
import { airDoctrineEffects } from './doctrine.js';
import BUILTIN_1192 from './builtin1192.js';

const STORAGE='hoi4-war-planner-v7';
const MIO_FAMILIES=['infantry_equipment','artillery','anti_tank','anti_air','light_tank','medium_tank','heavy_tank','small_airframe','medium_airframe','large_airframe'];
const DEFAULT_FORCE={
  attacker:{line:[{type:'infantry',count:9},{type:'artillery',count:1}],supports:['engineer','support_artillery','support_aa'],divisions:3,name:'Assault Division'},
  defender:{line:[{type:'infantry',count:10}],supports:['engineer','support_artillery'],divisions:3,name:'Defensive Division'}
};
const DEFAULT_BATTLEFIELD={terrain:'plains',directions:0,entrench:20,fort:0,river:0,asupply:1,dsupply:1,air:0,cas:0,planning:COMBAT_CONSTANTS.basePlanningMax,night:0,runs:500,seed:1944};
const derivedCache=new WeakMap();

function cacheFor(state){
  let cache=derivedCache.get(state);
  if(!cache){cache={tech:{},equipment:{},battle:null};derivedCache.set(state,cache);}
  return cache;
}
function ensureTankState(state){
  if(!state.tankVariants||typeof state.tankVariants!=='object')state.tankVariants={attacker:{},defender:{}};
  if(!state.tankDesigns||typeof state.tankDesigns!=='object')state.tankDesigns={attacker:{},defender:{}};
  for(const side of ['attacker','defender']){
    state.tankVariants[side]=state.tankVariants[side]||{};
    state.tankDesigns[side]=state.tankDesigns[side]||{};
    for(const family of TANK_FAMILIES){
      state.tankVariants[side][family]=state.tankVariants[side][family]||{};
      for(const role of tankRolesForFamily(family)){
        const legacy=role==='armor'&&['light','medium','heavy'].includes(family)?state.tankDesigns[side][family]:null;
        const raw=state.tankVariants[side][family][role]||legacy||defaultTankDesign(family,role);
        state.tankVariants[side][family][role]=normalizeTankDesign({...raw,class:family,role},family,role);
      }
    }
  }
}
function ensureMioState(state){
  state.mioSelections=state.mioSelections&&typeof state.mioSelections==='object'?state.mioSelections:{attacker:{},defender:{}};
  for(const side of ['attacker','defender']){
    state.mioSelections[side]=state.mioSelections[side]||{};
    for(const family of MIO_FAMILIES)state.mioSelections[side][family]=normalizeMioSelection(state.mioSelections[side][family]||DEFAULT_MIO_SELECTION);
  }
}
function tankDesignFor(state,side,family,role='armor'){
  return state.tankVariants[side][family]?.[role]||state.tankVariants[side][family]?.[tankRolesForFamily(family)[0]]||defaultTankDesign(family,role);
}
function mioEffectFor(state,side,family){return mioEffects(mioCatalog(state.dataPack),state.mioSelections[side][family]);}
function applyFamilyMioToData(state,data,side){
  const maps={infantry_equipment:{b:['infantry','motorized','mechanized','cavalry'],s:[]},artillery:{b:['artillery'],s:['support_artillery','regimental_infantry_guns']},anti_tank:{b:['anti_tank'],s:['support_at','regimental_at']},anti_air:{b:['anti_air'],s:['support_aa','regimental_aa']}};
  for(const [family,map] of Object.entries(maps)){
    const effect=mioEffectFor(state,side,family);
    for(const id of map.b)if(data.battalions[id])data.battalions[id]=applyMioEquipmentBonus(data.battalions[id],effect.equipmentBonus);
    for(const id of map.s)if(data.supports[id])data.supports[id]=applyMioEquipmentBonus(data.supports[id],effect.equipmentBonus);
  }
  for(const family of ['light','medium','heavy']){
    const mio=tankMioFamily(family),effect=mioEffectFor(state,side,mio);
    for(const role of tankRolesForFamily(family))for(const unit of tankVariantTargets(family,role)?.units||[]){const map=unit.kind==='support'?data.supports:data.battalions;if(map[unit.id])map[unit.id]=applyMioEquipmentBonus(map[unit.id],effect.equipmentBonus);}
  }
  return data;
}

export function loadCounterState(){
  let raw={};try{raw=JSON.parse(localStorage.getItem(STORAGE)||'{}')||{};}catch{}
  const state={...raw};state.dataPack=state.dataPack||BUILTIN_1192;state.dataSnapshotYear=Number(state.dataSnapshotYear)||1940;
  const valid=Object.keys(battalions);
  for(const side of ['attacker','defender']){
    const fallback=DEFAULT_FORCE[side],savedLine=Array.isArray(state[side])?state[side]:fallback.line;
    state[side+'Name']=String(state[side+'Name']||fallback.name);
    state[side+'Supports']=Array.isArray(state[side+'Supports'])?state[side+'Supports'].filter(id=>supports[id]).slice(0,5):[...fallback.supports];
    state[side+'RegimentalSupports']=Array.isArray(state[side+'RegimentalSupports'])?Array.from({length:DESIGNER_COLS},(_,i)=>state[side+'RegimentalSupports'][i]||null):Array(DESIGNER_COLS).fill(null);
    state[side+'Grid']=Array.isArray(state[side+'Grid'])?normalizeGrid(state[side+'Grid'],valid,battalions):countsToGrid(savedLine,valid,battalions);
    state[side+'Divisions']=Math.max(1,Number(state[side+'Divisions']??fallback.divisions)||fallback.divisions);
    state[side+'Tech']=normalizeTechProfile(state[side+'Tech']||structuredClone(DEFAULT_TECH_PROFILE));
  }
  state.battlefield={...DEFAULT_BATTLEFIELD,...(state.battlefield||{})};
  ensureTankState(state);ensureMioState(state);return state;
}

export function counterTechData(state,side){
  const cache=cacheFor(state);if(cache.tech[side])return cache.tech[side];
  const data=buildTechAdjustedData(battalions,supports,state[side+'Tech'],{pack:state.dataPack,year:state.dataSnapshotYear});
  for(const family of TANK_FAMILIES)for(const role of tankRolesForFamily(family)){
    const target=tankVariantTargets(family,role),raw=tankDesignFor(state,side,family,role);
    for(const unit of target?.units||[]){const map=unit.kind==='support'?data.supports:data.battalions;if(map[unit.id])map[unit.id]=applyTankDesignToBattalion(map[unit.id],raw);}
  }
  cache.tech[side]=applyFamilyMioToData(state,data,side);return cache.tech[side];
}

export function counterEquipment(state,side){
  const cache=cacheFor(state);if(cache.equipment[side])return cache.equipment[side];
  const out=structuredClone(equipment);
  for(const family of ['infantry_equipment','artillery','anti_tank','anti_air'])if(out[family])out[family]=applyMioToEquipmentRecord(out[family],mioEffectFor(state,side,family));
  for(const family of TANK_FAMILIES)for(const role of tankRolesForFamily(family)){
    const target=tankVariantTargets(family,role),raw=tankDesignFor(state,side,family,role),base=buildTankDesign(raw),mio=tankMioFamily(family),effect=mio?mioEffectFor(state,side,mio):null,design=mio?applyMioToVariant(base,effect):base;
    for(const key of [target?.equipmentKey,...(target?.aliases||[])].filter(Boolean))if(out[key]){out[key]=mio?applyMioToEquipmentRecord(tankEquipmentRecord(out[key],raw),effect):tankEquipmentRecord(out[key],raw);out[key].designStats=design;}
  }
  cache.equipment[side]=out;return out;
}

export function counterDivision(state,side,grid=state[side+'Grid'],supportKeys=state[side+'Supports']){
  const data=counterTechData(state,side),line=gridToCounts(grid,Object.keys(battalions));
  const regimental=state[side+'RegimentalSupports'].filter((key,column)=>key&&supports[key]&&filledInRegiment(grid,column)>=3);
  return calcDivision(line,data.battalions,[...supportKeys,...regimental],data.supports);
}

export function counterBattleOptions(state){
  const cache=cacheFor(state);if(cache.battle)return cache.battle;
  const attackerGlobal=counterTechData(state,'attacker').doctrineGlobal||{},defenderGlobal=counterTechData(state,'defender').doctrineGlobal||{},airDoctrine=airDoctrineEffects(state.attackerTech.airDoctrine,null,state.dataPack);
  cache.battle={...state.battlefield,entrench:(Number(state.battlefield.entrench)||0)*(1+(defenderGlobal.entrenchment||0)),attackerNightAttackBonus:attackerGlobal.nightAttack||0,defenderNightAttackBonus:defenderGlobal.nightAttack||0,attackerGroundSupportBonus:airDoctrine.groundSupport||0,terrainData:terrain};
  return cache.battle;
}

export function counterSnapshot(){
  const state=loadCounterState(),attacker=counterDivision(state,'attacker'),defender=counterDivision(state,'defender');
  const attackerIC=divisionEquipmentIC(attacker.need,counterEquipment(state,'attacker')),defenderIC=divisionEquipmentIC(defender.need,counterEquipment(state,'defender'));
  const fingerprint=JSON.stringify({a:state.attackerGrid,as:state.attackerSupports,ar:state.attackerRegimentalSupports,at:state.attackerTech,av:state.tankVariants?.attacker,am:state.mioSelections?.attacker,d:state.defenderGrid,ds:state.defenderSupports,dr:state.defenderRegimentalSupports,dt:state.defenderTech,dv:state.tankVariants?.defender,dm:state.mioSelections?.defender,b:state.battlefield,an:state.attackerDivisions,dn:state.defenderDivisions,p:state.production,pg:state.productionGoals});
  return {state,attacker,defender,attackerIC,defenderIC,fingerprint};
}
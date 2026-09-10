import { DEFAULT_LAND_DOCTRINE, DEFAULT_AIR_DOCTRINE, normalizeLandDoctrine, normalizeAirDoctrine, applyLandDoctrineToData } from './doctrine.js';
import { resolveSubUnitFromPack } from './gameData.js';
const clone=x=>structuredClone(x);

// Fallback labels/deltas are retained only for sessions without an imported game-data pack.
export const INFANTRY_EQUIPMENT_LEVELS = [
  {value:0,label:'Basic Infantry Equipment',delta:{soft:-3,hard:-0.5,def:-2,breakthrough:-1,piercing:-3}},
  {value:1,label:'Infantry Equipment I',delta:{soft:0,hard:0,def:0,breakthrough:0,piercing:0}},
  {value:2,label:'Infantry Equipment II',delta:{soft:3,hard:0.5,def:6,breakthrough:1,piercing:1}},
  {value:3,label:'Infantry Equipment III',delta:{soft:6,hard:1,def:12,breakthrough:2,piercing:6}}
];

export const WEAPON_TIER_LEVELS = [
  {value:0,label:'Earliest equipment',mult:1},
  {value:1,label:'Equipment I',mult:1},
  {value:2,label:'Equipment II',mult:1.15},
  {value:3,label:'Equipment III',mult:1.30}
];

export const DEFAULT_TECH_PROFILE = {
  countryTag:'GER',
  infantryEquipment:1,
  artillery:1,
  antiTank:1,
  antiAir:1,
  technologies:[],
  unlocks:{mechanized:true,lightArmor:true,mediumArmor:true,heavyArmor:true,engineer:true,recon:true,logistics:true,signal:true},
  doctrine:{org:0,soft:0,hard:0,def:0,breakthrough:0},
  landDoctrine:structuredClone(DEFAULT_LAND_DOCTRINE),
  airDoctrine:structuredClone(DEFAULT_AIR_DOCTRINE)
};

export function normalizeTechProfile(raw){
  const out=clone(DEFAULT_TECH_PROFILE),src=raw&&typeof raw==='object'?raw:{};
  out.countryTag=String(src.countryTag||out.countryTag||'GER').toUpperCase().slice(0,3);
  for(const k of ['infantryEquipment','artillery','antiTank','antiAir']){
    const max=3;out[k]=Math.max(0,Math.min(max,Math.floor(Number(src[k]??out[k]))));
  }
  out.technologies=[...new Set((Array.isArray(src.technologies)?src.technologies:[]).map(x=>String(x||'').trim()).filter(Boolean))];
  if(src.unlocks&&typeof src.unlocks==='object')for(const k of Object.keys(out.unlocks))out.unlocks[k]=src.unlocks[k]===undefined?out.unlocks[k]:!!src.unlocks[k];
  if(src.doctrine&&typeof src.doctrine==='object')for(const k of Object.keys(out.doctrine))out.doctrine[k]=Number(src.doctrine[k]??out.doctrine[k])||0;
  out.landDoctrine=normalizeLandDoctrine(src.landDoctrine||out.landDoctrine);
  out.airDoctrine=normalizeAirDoctrine(src.airDoctrine||out.airDoctrine);
  return out;
}

function addDelta(unit,delta){
  if(!unit)return;
  for(const [k,v] of Object.entries(delta||{}))unit[k]=Math.max(0,(Number(unit[k])||0)+v);
}
function multiply(unit,keys,mult){
  if(!unit)return;
  for(const k of keys)unit[k]=Math.max(0,(Number(unit[k])||0)*mult);
}
function doctrineMult(unit,profile){
  if(!unit)return;
  const d=profile.doctrine||{};
  const map={org:'org',soft:'soft',hard:'hard',def:'def',breakthrough:'breakthrough'};
  for(const [src,dst] of Object.entries(map))unit[dst]=Math.max(0,(Number(unit[dst])||0)*(1+(Number(d[src])||0)/100));
}

// These are the technology fields whose semantics map directly onto stats already consumed by the land planner.
// Factor fields use HOI4's sub-unit modifier convention; additive fields modify the corresponding base sub-unit value.
const TECHNOLOGY_UNIT_FACTOR_FIELDS={
  soft_attack:'soft',hard_attack:'hard',defence:'def',defense:'def',breakthrough:'breakthrough',air_attack:'airAttack',
  ap_attack:'piercing',armor_value:'armor',hardness:'hardness',supply_consumption_factor:'supply'
};
const TECHNOLOGY_UNIT_ADDITIVE_FIELDS={combat_width:'width',max_strength:'hp',max_organisation:'org',supply_consumption:'supply'};
function technologyTargetMatches(unit,targetId,pack){
  if(!unit||!targetId)return false;
  // Technology effect keys occupy distinct source namespaces. If the key names a real sub-unit, only that source
  // gameId may match it. This prevents collisions such as source sub-unit `artillery` vs the broad type `artillery`.
  if(pack?.subUnits?.[targetId])return unit.gameId===targetId;
  if(String(targetId).startsWith('category_'))return (unit.categories||[]).includes(targetId);
  if(unit.gameId===targetId)return true;
  if(!unit.gameId&&unit.id===targetId)return true;
  return false;
}

// Source technology values are exact; the interpretation below is intentionally limited to planner-consumed core land stats
// and remains classified executable-inferred. Terrain blocks, battalion_mult, country modifiers, specialist support stats,
// scripted completion effects and equipment/air effects remain preserved in pack.technologies but are not guessed here.
export function applySelectedTechnologyEffects(battalions,supports,pack,technologyIds=[]){
  const selected=[...new Set((technologyIds||[]).map(x=>String(x||'').trim()).filter(Boolean))],units=[...Object.values(battalions||{}),...Object.values(supports||{})];
  const accumulated=new Map(),appliedTechnologies=[],unknownTechnologies=[];let skippedEffectFields=0;
  for(const techId of selected){
    const tech=pack?.technologies?.[techId];
    if(!tech){unknownTechnologies.push(techId);continue;}
    const effects=tech.directEffects&&typeof tech.directEffects==='object'?tech.directEffects:{};let techApplied=false;
    for(const [targetId,block] of Object.entries(effects)){
      if(!block||typeof block!=='object'||Array.isArray(block))continue;
      const matched=units.filter(unit=>technologyTargetMatches(unit,targetId,pack));
      if(!matched.length)continue;
      for(const [sourceField,value] of Object.entries(block)){
        const factorField=TECHNOLOGY_UNIT_FACTOR_FIELDS[sourceField],additiveField=TECHNOLOGY_UNIT_ADDITIVE_FIELDS[sourceField],amount=Number(value);
        if((!factorField&&!additiveField)||!Number.isFinite(amount)){skippedEffectFields++;continue;}
        for(const unit of matched){
          let row=accumulated.get(unit);if(!row){row={factor:{},additive:{}};accumulated.set(unit,row);}
          const bucket=factorField?row.factor:row.additive,targetField=factorField||additiveField;
          bucket[targetField]=(bucket[targetField]||0)+amount;techApplied=true;
        }
      }
    }
    if(techApplied)appliedTechnologies.push(techId);
  }
  let appliedModifierCount=0;
  for(const [unit,row] of accumulated){
    // Flat base-stat changes are applied before percentage factors. Exact cross-system ordering remains part of the formula audit.
    for(const [field,amount] of Object.entries(row.additive||{})){
      unit[field]=Math.max(0,(Number(unit[field])||0)+amount);appliedModifierCount++;
    }
    for(const [field,amount] of Object.entries(row.factor||{})){
      unit[field]=Math.max(0,(Number(unit[field])||0)*(1+amount));appliedModifierCount++;
    }
  }
  return {selected,appliedTechnologies,unknownTechnologies,appliedModifierCount,skippedEffectFields,classification:'executable-inferred',applicationOrder:'additive-then-factor'};
}

function applyImportedEquipmentTier(target,pack,profile,year){
  for(const unit of Object.values(target||{})){
    const gameId=unit?.gameId;if(!gameId||!pack?.subUnits?.[gameId])continue;
    const imported=resolveSubUnitFromPack(pack.subUnits[gameId],pack,{year,profile});
    for(const k of ['width','hp','org','manpower','supply','hardness','armor','piercing','soft','hard','def','breakthrough','airAttack','need','sourceEquipment','source'])if(imported[k]!==undefined)unit[k]=imported[k];
  }
}

export function buildTechAdjustedData(baseBattalions,baseSupports,rawProfile,gameContext=null){
  const profile=normalizeTechProfile(rawProfile),b=clone(baseBattalions),s=clone(baseSupports);
  const pack=gameContext?.pack||gameContext?.dataPack||null,year=Number(gameContext?.year)||1940;
  if(pack?.subUnits&&pack?.equipment){
    // Real data path: choose actual equipment records from the imported family/tier.
    // Do not layer the legacy guessed percentage/delta tables on top of game-file stats.
    applyImportedEquipmentTier(b,pack,profile,year);
    applyImportedEquipmentTier(s,pack,profile,year);
  }else{
    const inf=INFANTRY_EQUIPMENT_LEVELS.find(x=>x.value===profile.infantryEquipment)||INFANTRY_EQUIPMENT_LEVELS[1];
    for(const key of ['infantry','motorized','mechanized','cavalry'])addDelta(b[key],inf.delta);
    const art=WEAPON_TIER_LEVELS.find(x=>x.value===profile.artillery)?.mult??1;
    const at=WEAPON_TIER_LEVELS.find(x=>x.value===profile.antiTank)?.mult??1;
    const aa=WEAPON_TIER_LEVELS.find(x=>x.value===profile.antiAir)?.mult??1;
    for(const key of ['artillery'])multiply(b[key],['soft','hard','piercing'],art||1);
    for(const key of ['support_artillery','regimental_infantry_guns'])multiply(s[key],['soft','hard','piercing'],art||1);
    for(const key of ['anti_tank'])multiply(b[key],['soft','hard','piercing'],at||1);
    for(const key of ['support_at','regimental_at'])multiply(s[key],['soft','hard','piercing'],at||1);
    for(const key of ['anti_air'])multiply(b[key],['soft','hard','piercing','airAttack'],aa||1);
    for(const key of ['support_aa','regimental_aa'])multiply(s[key],['soft','hard','piercing','airAttack'],aa||1);
  }

  const technologyEffects=pack?.technologies?applySelectedTechnologyEffects(b,s,pack,profile.technologies):{selected:[],appliedTechnologies:[],unknownTechnologies:[],appliedModifierCount:0,skippedEffectFields:0,classification:'not-applied'};

  // Legacy manual doctrine modifiers remain readable for imported old scenarios. They are not research locks.
  for(const u of Object.values(b))doctrineMult(u,profile);
  for(const u of Object.values(s))doctrineMult(u,profile);
  const doctrine=applyLandDoctrineToData(b,s,profile.landDoctrine,pack);
  return {battalions:doctrine.battalions,supports:doctrine.supports,profile,technologyEffects,doctrineGlobal:doctrine.global,landDoctrine:doctrine.state};
}

export function techAvailable(kind,key,rawProfile){
  const p=normalizeTechProfile(rawProfile);
  if(kind==='battalion'){
    if(key==='artillery')return p.artillery>0;
    if(key==='anti_tank')return p.antiTank>0;
    if(key==='anti_air')return p.antiAir>0;
    if(key==='mechanized')return p.unlocks.mechanized;
    if(key==='light_armor')return p.unlocks.lightArmor;
    if(key==='medium_armor')return p.unlocks.mediumArmor;
    if(key==='heavy_armor')return p.unlocks.heavyArmor;
    return true;
  }
  if(kind==='support'){
    if(['support_artillery','regimental_infantry_guns'].includes(key))return p.artillery>0;
    if(['support_at','regimental_at'].includes(key))return p.antiTank>0;
    if(['support_aa','regimental_aa'].includes(key))return p.antiAir>0;
    if(key==='engineer')return p.unlocks.engineer;
    if(key==='recon')return p.unlocks.recon;
    if(key==='logistics')return p.unlocks.logistics;
    if(key==='signal')return p.unlocks.signal;
    return true;
  }
  return true;
}

export function techIssues(grid,divisionSupports,regimentalSupports,rawProfile){
  const issues=[];
  for(const col of grid||[])for(const key of col||[])if(key&&!techAvailable('battalion',key,rawProfile))issues.push(key);
  for(const key of divisionSupports||[])if(key&&!techAvailable('support',key,rawProfile))issues.push(key);
  for(const key of regimentalSupports||[])if(key&&!techAvailable('support',key,rawProfile))issues.push(key);
  return [...new Set(issues)];
}

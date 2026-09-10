export const TANK_SLOT_MODULES={none:{id:'none',name:'Empty',source:'system',_module:null}};
export const TANK_FAMILIES=['light','medium','heavy','modern','super_heavy','amphibious','land_cruiser'];
export const TANK_ROLE_LABELS={armor:'Tank',anti_tank:'Tank Destroyer',artillery:'SP Artillery',anti_air:'SP Anti-Air',flame:'Flame Tank',amphibious:'Amphibious Tank'};
const FAMILY_LABELS={light:'Light',medium:'Medium',heavy:'Heavy',modern:'Modern',super_heavy:'Super Heavy',amphibious:'Dedicated Amphibious',land_cruiser:'Land Cruiser'};
const FAMILY_ROLES={
  light:['armor','anti_tank','artillery','anti_air','flame','amphibious'],
  medium:['armor','anti_tank','artillery','anti_air','flame','amphibious'],
  heavy:['armor','anti_tank','artillery','anti_air','flame','amphibious'],
  modern:['armor','anti_tank','artillery','anti_air'],
  super_heavy:['armor','anti_tank','artillery','anti_air'],
  amphibious:['armor'],land_cruiser:['armor']
};
const TARGETS={
  light:{
    armor:{equipmentKey:'light_tank_chassis',aliases:['light_tank'],units:[['battalion','light_armor']]},
    anti_tank:{equipmentKey:'light_tank_destroyer_chassis',duplicate:'light_tank_destroyer_chassis',units:[['battalion','light_tank_destroyer_brigade'],['support','light_tank_destroyer_support']]},
    artillery:{equipmentKey:'light_tank_artillery_chassis',duplicate:'light_tank_artillery_chassis',units:[['battalion','light_sp_artillery_brigade']]},
    anti_air:{equipmentKey:'light_tank_aa_chassis',duplicate:'light_tank_aa_chassis',units:[['battalion','light_sp_anti_air_brigade'],['support','light_sp_anti_air_support']]},
    flame:{equipmentKey:'light_tank_flame_chassis',duplicate:'light_tank_flame_chassis',units:[['support','light_flame_tank']]},
    amphibious:{equipmentKey:'light_tank_amphibious_chassis',duplicate:'light_tank_amphibious_chassis',units:[['battalion','amphibious_light_armor']]}
  },
  medium:{
    armor:{equipmentKey:'medium_tank_chassis',aliases:['medium_tank'],units:[['battalion','medium_armor']]},
    anti_tank:{equipmentKey:'medium_tank_destroyer_chassis',duplicate:'medium_tank_destroyer_chassis',units:[['battalion','medium_tank_destroyer_brigade'],['support','medium_tank_destroyer_support']]},
    artillery:{equipmentKey:'medium_tank_artillery_chassis',duplicate:'medium_tank_artillery_chassis',units:[['battalion','medium_sp_artillery_brigade']]},
    anti_air:{equipmentKey:'medium_tank_aa_chassis',duplicate:'medium_tank_aa_chassis',units:[['battalion','medium_sp_anti_air_brigade'],['support','medium_sp_anti_air_support']]},
    flame:{equipmentKey:'medium_tank_flame_chassis',duplicate:'medium_tank_flame_chassis',units:[['support','medium_flame_tank']]},
    amphibious:{equipmentKey:'medium_tank_amphibious_chassis',duplicate:'medium_tank_amphibious_chassis',units:[['battalion','amphibious_medium_armor']]}
  },
  heavy:{
    armor:{equipmentKey:'heavy_tank_chassis',aliases:['heavy_tank'],units:[['battalion','heavy_armor']]},
    anti_tank:{equipmentKey:'heavy_tank_destroyer_chassis',duplicate:'heavy_tank_destroyer_chassis',units:[['battalion','heavy_tank_destroyer_brigade'],['support','heavy_tank_destroyer_support']]},
    artillery:{equipmentKey:'heavy_tank_artillery_chassis',duplicate:'heavy_tank_artillery_chassis',units:[['battalion','heavy_sp_artillery_brigade']]},
    anti_air:{equipmentKey:'heavy_tank_aa_chassis',duplicate:'heavy_tank_aa_chassis',units:[['battalion','heavy_sp_anti_air_brigade'],['support','heavy_sp_anti_air_support']]},
    flame:{equipmentKey:'heavy_tank_flame_chassis',duplicate:'heavy_tank_flame_chassis',units:[['support','heavy_flame_tank']]},
    amphibious:{equipmentKey:'heavy_tank_amphibious_chassis',duplicate:'heavy_tank_amphibious_chassis',units:[['battalion','amphibious_heavy_armor']]}
  },
  modern:{
    armor:{equipmentKey:'modern_tank_chassis',units:[['battalion','modern_armor']]},
    anti_tank:{equipmentKey:'modern_tank_destroyer_chassis',duplicate:'modern_tank_destroyer_chassis',units:[['battalion','modern_tank_destroyer_brigade'],['support','modern_tank_destroyer_support']]},
    artillery:{equipmentKey:'modern_tank_artillery_chassis',duplicate:'modern_tank_artillery_chassis',units:[['battalion','modern_sp_artillery_brigade']]},
    anti_air:{equipmentKey:'modern_tank_aa_chassis',duplicate:'modern_tank_aa_chassis',units:[['battalion','modern_sp_anti_air_brigade'],['support','modern_sp_anti_air_support']]}
  },
  super_heavy:{
    armor:{equipmentKey:'super_heavy_tank_chassis',units:[['support','super_heavy_armor']]},
    anti_tank:{equipmentKey:'super_heavy_tank_destroyer_chassis',duplicate:'super_heavy_tank_destroyer_chassis',units:[['support','super_heavy_tank_destroyer_brigade']]},
    artillery:{equipmentKey:'super_heavy_tank_artillery_chassis',duplicate:'super_heavy_tank_artillery_chassis',units:[['support','super_heavy_sp_artillery_brigade']]},
    anti_air:{equipmentKey:'super_heavy_tank_aa_chassis',duplicate:'super_heavy_tank_aa_chassis',units:[['support','super_heavy_sp_anti_air_brigade']]}
  },
  amphibious:{armor:{equipmentKey:'amphibious_tank_chassis',units:[['battalion','amphibious_armor']]}},
  land_cruiser:{armor:{equipmentKey:'land_cruiser_chassis',units:[['support','land_cruiser']]}}
};
const MIO_FAMILY={light:'light_tank',medium:'medium_tank',heavy:'heavy_tank'};
export function tankFamilyLabel(family){return FAMILY_LABELS[family]||humanize(family);}
export function tankRolesForFamily(family){return [...(FAMILY_ROLES[family]||['armor'])];}
export function tankMioFamily(family){return MIO_FAMILY[family]||null;}
export function tankVariantTargets(family,role='armor'){
  const cfg=TARGETS[family]?.[role]||TARGETS[family]?.armor||null;if(!cfg)return null;
  return {...cfg,aliases:[...(cfg.aliases||[])],units:(cfg.units||[]).map(([kind,id])=>({kind,id})),mioFamily:tankMioFamily(family)};
}

const FALLBACK_DEFAULT_CHASSIS={light:'light_improved',medium:'medium_improved',heavy:'heavy_improved'};
const FALLBACK_DEFAULT_GUN={light:'small_cannon',medium:'medium_cannon',heavy:'heavy_cannon'};
let PACK_MODE=false,PACK_YEAR=1940,PACK_UPGRADES={},PACK_META=null,PACK_EQUIPMENT={};

function replaceCatalog(target,next){for(const k of Object.keys(target))delete target[k];Object.assign(target,next);}
function firstKey(map,exceptNone=false){return Object.keys(map).find(k=>!exceptNone||k!=='none')||Object.keys(map)[0]||null;}
function chassisDefault(family){return PACK_MODE?chooseCatalogDefault(TANK_CHASSIS,x=>x.class===family,PACK_YEAR):FALLBACK_DEFAULT_CHASSIS[family];}
function gunDefault(family){
  if(!PACK_MODE)return FALLBACK_DEFAULT_GUN[family]||FALLBACK_DEFAULT_GUN.medium;
  const names=Object.keys(TANK_GUNS);if(!names.length)return null;
  const classNamed=names.find(k=>k.includes(family));return classNamed||names[0];
}
function defaultModule(map,fallback){return PACK_MODE?(firstKey(map,true)||firstKey(map)||fallback):fallback;}

export function configureTankDataPack(pack,year=1940){
  const cat=tankCatalogFromPack(pack);if(!cat.meta.chassis)return {active:false,...cat.meta};
  replaceCatalog(TANK_CHASSIS,cat.chassis);
  if(cat.meta.guns)replaceCatalog(TANK_GUNS,cat.guns);
  if(cat.meta.turrets)replaceCatalog(TANK_TURRETS,cat.turrets);
  if(cat.meta.suspensions)replaceCatalog(TANK_SUSPENSIONS,cat.suspensions);
  if(cat.meta.armorTypes)replaceCatalog(TANK_ARMOR_TYPES,cat.armorTypes);
  if(cat.meta.engines)replaceCatalog(TANK_ENGINES,cat.engines);
  if(cat.meta.specials)replaceCatalog(TANK_SPECIALS,cat.specials);
  if(cat.meta.slotModules)replaceCatalog(TANK_SLOT_MODULES,cat.slotModules);
  PACK_MODE=true;PACK_YEAR=Number(year)||1940;PACK_UPGRADES=pack?.equipmentUpgrades||{};PACK_META=cat.meta;PACK_EQUIPMENT=resolveEquipment(pack?.equipment||{});
  return {active:true,...cat.meta,upgrades:Object.keys(PACK_UPGRADES).length};
}
export function tankDataStatus(){return {active:PACK_MODE,year:PACK_YEAR,...(PACK_META||{}),upgrades:Object.keys(PACK_UPGRADES).length};}

const list=v=>Array.isArray(v)?v:v==null?[]:[v];
function chassisSlots(chassis){return chassis?._equipment?.moduleSlots||chassis?.moduleSlots||{};}
function moduleSource(record){return record?._module||record||{};}
function allowedCategories(chassis,slotId,selected=[]){
  const out=new Set(list(chassisSlots(chassis)?.[slotId]?.allowed_module_categories));
  for(const record of selected.filter(Boolean))for(const cat of list(moduleSource(record)?.allowedModuleCategories?.[slotId]))out.add(cat);
  return out;
}
function structurallyCompatible(record,chassis,slotId,selected=[]){
  if(!record)return false;if(record.id==='none'||record.name==='Empty')return !chassisSlots(chassis)?.[slotId]?.required;
  return allowedCategories(chassis,slotId,selected).has(moduleSource(record)?.category||record.category);
}
function moduleForbidsRole(record,role){
  const m=moduleSource(record);if(list(m?.forbidEquipmentType).includes(role))return true;
  if(list(m?.forbidEquipmentTypeExactMatch).includes(role))return true;
  return false;
}
function roleGunAllowed(record,chassis,turret,role){
  if(!structurallyCompatible(record,chassis,'main_armament_slot',[turret])||moduleForbidsRole(record,role))return false;
  const m=moduleSource(record),cat=m?.category||record?.category;
  const exact=moduleSource(turret)?.forbidEquipmentTypeExactMatchForCategory||{};
  if(String(exact?.[cat]||'')===role)return false;
  if(['anti_tank','artillery','anti_air','flame'].includes(role)&&!list(m?.allowEquipmentType).includes(role))return false;
  return true;
}
function turretSupportsRole(record,chassis,role){
  if(!structurallyCompatible(record,chassis,'turret_type_slot')||moduleForbidsRole(record,role))return false;
  return Object.values(TANK_GUNS).some(g=>roleGunAllowed(g,chassis,record,role));
}
function compatibleIds(map,chassis,slotId,selected=[],role=null){
  return new Set(Object.entries(map||{}).filter(([,record])=>structurallyCompatible(record,chassis,slotId,selected)&&(!role||!moduleForbidsRole(record,role))).map(([id])=>id));
}
function firstFromSet(set,preferred=[]){for(const id of preferred)if(set.has(id))return id;return [...set][0]||null;}
const preferredTurret={
  light:['tank_light_three_man_tank_turret','tank_light_two_man_tank_turret'],
  medium:['tank_medium_three_man_tank_turret','tank_medium_two_man_tank_turret'],
  heavy:['tank_heavy_three_man_tank_turret','tank_heavy_two_man_tank_turret'],
  modern:['tank_modern_tank_turret','tank_heavy_three_man_tank_turret','tank_medium_three_man_tank_turret'],
  super_heavy:['tank_super_heavy_four_man_tank_turret','tank_super_heavy_three_man_tank_turret'],
  amphibious:['tank_light_three_man_tank_turret','tank_light_two_man_tank_turret']
};
const preferredGunByRole={
  armor:['tank_medium_cannon_2','tank_medium_cannon','tank_small_cannon_2','tank_small_cannon','tank_heavy_machine_gun'],
  anti_tank:['tank_high_velocity_cannon_3','tank_heavy_cannon_3','tank_high_velocity_cannon_2','tank_heavy_cannon_2','tank_medium_cannon_2','tank_high_velocity_cannon','tank_medium_cannon'],
  artillery:['tank_heavy_howitzer','tank_medium_howitzer_2','tank_medium_howitzer','tank_close_support_gun','tank_rocket_launcher_2','tank_rocket_launcher'],
  anti_air:['tank_anti_air_cannon_3','tank_anti_air_cannon_2','tank_anti_air_cannon'],
  flame:['advanced_flamethrower','flamethrower'],
  amphibious:['tank_medium_cannon_2','tank_medium_cannon','tank_small_cannon_2','tank_small_cannon']
};
function familyGunPreference(family,role){
  if(role!=='armor')return preferredGunByRole[role]||preferredGunByRole.armor;
  if(family==='light'||family==='amphibious')return ['tank_small_cannon_2','tank_small_cannon','tank_auto_cannon_2','tank_auto_cannon','tank_heavy_machine_gun'];
  if(family==='heavy'||family==='super_heavy')return ['tank_heavy_cannon_2','tank_heavy_cannon','tank_medium_cannon_2','tank_medium_cannon','tank_small_cannon_2'];
  if(family==='modern')return ['tank_high_velocity_cannon_3','tank_heavy_cannon_3','tank_medium_cannon_2','tank_medium_cannon'];
  return preferredGunByRole.armor;
}
function roleGunIds(chassis,turret,role){return new Set(Object.entries(TANK_GUNS).filter(([,g])=>roleGunAllowed(g,chassis,turret,role)).map(([id])=>id));}
function roleTurretIds(chassis,role){return new Set(Object.entries(TANK_TURRETS).filter(([,t])=>turretSupportsRole(t,chassis,role)).map(([id])=>id));}
function specialSlotIds(chassis){return Object.keys(chassisSlots(chassis)).filter(x=>/^special_type_slot_\d+$/.test(x)).sort((a,b)=>Number(a.match(/\d+$/)?.[0])-Number(b.match(/\d+$/)?.[0]));}
function packDefaults(family,chassisId,role='armor'){
  const ch=TANK_CHASSIS[chassisId];
  if(family==='land_cruiser')return {slotModules:normalizeLandCruiserSlots({},ch)};
  const turrets=roleTurretIds(ch,role),turret=firstFromSet(turrets,preferredTurret[family]||[]),selectedTurret=TANK_TURRETS[turret];
  const guns=roleGunIds(ch,selectedTurret,role),gun=firstFromSet(guns,familyGunPreference(family,role));
  const suspension=firstFromSet(compatibleIds(TANK_SUSPENSIONS,ch,'suspension_type_slot',[],role));
  const armorType=firstFromSet(compatibleIds(TANK_ARMOR_TYPES,ch,'armor_type_slot',[],role));
  const engine=firstFromSet(compatibleIds(TANK_ENGINES,ch,'engine_type_slot',[],role));
  const specials=specialSlotIds(ch).map(()=> 'none');
  if(role==='amphibious'){
    const drive=TANK_SPECIALS.amphibious_drive;
    const idx=specialSlotIds(ch).findIndex(slot=>structurallyCompatible(drive,ch,slot,[])&&!moduleForbidsRole(drive,role));if(idx>=0)specials[idx]='amphibious_drive';
  }
  return {turret,gun,suspension,armorType,engine,specials};
}
function landCruiserLimits(chassis){return Array.isArray(chassis?._equipment?.moduleCountLimits)?chassis._equipment.moduleCountLimits:[];}
function limitAllows(moduleId,chosenIds,chassis){
  if(moduleId==='none')return true;
  for(const limit of landCruiserLimits(chassis)){
    const match=id=>limit.module? id===limit.module : limit.category?String(moduleSource(TANK_SLOT_MODULES[id])?.category||'')===limit.category:false;
    if(match(moduleId)&&chosenIds.filter(match).length>=Number(limit.max||0))return false;
  }
  return true;
}
function normalizeLandCruiserSlots(rawSlots,chassis){
  const slots=chassisSlots(chassis),out={},chosen=[];
  for(const [slotId,slot] of Object.entries(slots)){
    const allowed=new Set(list(slot.allowed_module_categories));
    const candidates=Object.keys(TANK_SLOT_MODULES).filter(id=>id!=='none'&&allowed.has(String(moduleSource(TANK_SLOT_MODULES[id])?.category||'')));
    let id=rawSlots?.[slotId];
    if(!candidates.includes(id)||!limitAllows(id,chosen,chassis))id=slot.required?candidates.find(x=>limitAllows(x,chosen,chassis))||candidates[0]:'none';
    out[slotId]=id||'none';if(out[slotId]!=='none')chosen.push(out[slotId]);
  }
  return out;
}
function landCruiserOptions(raw,chassis){
  const slots=chassisSlots(chassis),selected=raw?.slotModules||{},result={};
  for(const [slotId,slot] of Object.entries(slots)){
    const allowed=new Set(list(slot.allowed_module_categories)),others=Object.entries(selected).filter(([s,id])=>s!==slotId&&id&&id!=='none').map(([,id])=>id);
    const set=new Set();if(!slot.required)set.add('none');
    for(const [id,rec] of Object.entries(TANK_SLOT_MODULES))if(id!=='none'&&allowed.has(String(moduleSource(rec)?.category||''))&&limitAllows(id,others,chassis))set.add(id);
    result[slotId]=set;
  }
  return result;
}

export function defaultTankDesign(family='medium',role='armor'){
  const f=TANK_FAMILIES.includes(family)?family:'medium',r=tankRolesForFamily(f).includes(role)?role:tankRolesForFamily(f)[0],chassis=chassisDefault(f)||chassisDefault('medium')||firstKey(TANK_CHASSIS);
  if(PACK_MODE){const m=packDefaults(f,chassis,r);return {name:`${tankFamilyLabel(f)} ${TANK_ROLE_LABELS[r]||'Tank'}`,class:f,role:r,chassis,...m,engineUpgrades:0,armorUpgrades:0};}
  const c=['light','medium','heavy'].includes(f)?f:'medium';
  return {name:`${tankFamilyLabel(c)} Tank`,class:c,role:'armor',chassis:chassisDefault(c),gun:gunDefault(c)||firstKey(TANK_GUNS),turret:defaultModule(TANK_TURRETS,'three_man'),suspension:defaultModule(TANK_SUSPENSIONS,'torsion'),armorType:defaultModule(TANK_ARMOR_TYPES,'welded'),engine:defaultModule(TANK_ENGINES,'diesel'),engineUpgrades:3,armorUpgrades:3,specials:[defaultModule(TANK_SPECIALS,'none'),'none','none','none']};
}

export function normalizeTankDesign(raw,family='medium',role=null){
  const desired=TANK_FAMILIES.includes(raw?.class)?raw.class:(TANK_FAMILIES.includes(family)?family:'medium'),roles=tankRolesForFamily(desired),desiredRole=roles.includes(raw?.role)?raw.role:(roles.includes(role)?role:roles[0]),base=defaultTankDesign(desired,desiredRole),out={...base,...(raw||{}),class:desired,role:desiredRole};
  if(!TANK_CHASSIS[out.chassis]||TANK_CHASSIS[out.chassis]?.class!==desired)out.chassis=base.chassis;
  out.class=TANK_CHASSIS[out.chassis]?.class||desired;out.role=tankRolesForFamily(out.class).includes(out.role)?out.role:tankRolesForFamily(out.class)[0];
  if(PACK_MODE){
    const ch=TANK_CHASSIS[out.chassis];
    if(out.class==='land_cruiser'){
      out.slotModules=normalizeLandCruiserSlots(out.slotModules,ch);delete out.gun;delete out.turret;delete out.suspension;delete out.armorType;delete out.engine;out.specials=[];
    }else{
      const defaults=packDefaults(out.class,out.chassis,out.role),turretSet=roleTurretIds(ch,out.role);
      if(!turretSet.has(out.turret))out.turret=defaults.turret;
      const guns=roleGunIds(ch,TANK_TURRETS[out.turret],out.role);if(!guns.has(out.gun))out.gun=firstFromSet(guns,familyGunPreference(out.class,out.role))||defaults.gun;
      if(!compatibleIds(TANK_SUSPENSIONS,ch,'suspension_type_slot',[],out.role).has(out.suspension))out.suspension=defaults.suspension;
      if(!compatibleIds(TANK_ARMOR_TYPES,ch,'armor_type_slot',[],out.role).has(out.armorType))out.armorType=defaults.armorType;
      if(!compatibleIds(TANK_ENGINES,ch,'engine_type_slot',[],out.role).has(out.engine))out.engine=defaults.engine;
      const slots=specialSlotIds(ch);out.specials=slots.map((slot,i)=>{const id=out.specials?.[i]||'none';return id==='none'||(structurallyCompatible(TANK_SPECIALS[id],ch,slot)&&!moduleForbidsRole(TANK_SPECIALS[id],out.role))?id:'none';});
      if(out.role==='amphibious'&&!out.specials.includes('amphibious_drive')){
        const idx=slots.findIndex(slot=>structurallyCompatible(TANK_SPECIALS.amphibious_drive,ch,slot)&&!moduleForbidsRole(TANK_SPECIALS.amphibious_drive,out.role));if(idx>=0)out.specials[idx]='amphibious_drive';
      }
      delete out.slotModules;
    }
  }else{
    if(!TANK_GUNS[out.gun])out.gun=gunDefault(out.class)||firstKey(TANK_GUNS);
    if(!TANK_TURRETS[out.turret])out.turret=defaultModule(TANK_TURRETS,'three_man');
    if(!TANK_SUSPENSIONS[out.suspension])out.suspension=defaultModule(TANK_SUSPENSIONS,'torsion');
    if(!TANK_ARMOR_TYPES[out.armorType])out.armorType=defaultModule(TANK_ARMOR_TYPES,'welded');
    if(!TANK_ENGINES[out.engine])out.engine=defaultModule(TANK_ENGINES,'diesel');
    out.specials=Array.from({length:4},(_,i)=>TANK_SPECIALS[out.specials?.[i]]?out.specials[i]:'none');
  }
  out.engineUpgrades=clamp(Math.round(Number(out.engineUpgrades)||0),0,20);out.armorUpgrades=clamp(Math.round(Number(out.armorUpgrades)||0),0,20);
  out.name=String(out.name||TANK_CHASSIS[out.chassis]?.name||humanize(out.chassis)).slice(0,80);return out;
}

export function tankDesignOptions(raw){
  const family=TANK_FAMILIES.includes(raw?.class)?raw.class:'medium',c=TANK_CHASSIS[raw?.chassis]||TANK_CHASSIS[chassisDefault(family)]||TANK_CHASSIS[firstKey(TANK_CHASSIS)],role=tankRolesForFamily(family).includes(raw?.role)?raw.role:tankRolesForFamily(family)[0];
  if(!PACK_MODE){const all=map=>new Set(Object.keys(map));return {roles:new Set(tankRolesForFamily(family)),guns:all(TANK_GUNS),turrets:all(TANK_TURRETS),suspensions:all(TANK_SUSPENSIONS),armorTypes:all(TANK_ARMOR_TYPES),engines:all(TANK_ENGINES),specials:Array.from({length:4},()=>all(TANK_SPECIALS)),genericSlots:null};}
  if(family==='land_cruiser')return {roles:new Set(['armor']),guns:new Set(),turrets:new Set(),suspensions:new Set(),armorTypes:new Set(),engines:new Set(),specials:[],genericSlots:landCruiserOptions(raw,c)};
  const turret=TANK_TURRETS[raw?.turret];
  return {roles:new Set(tankRolesForFamily(family)),guns:roleGunIds(c,turret,role),turrets:roleTurretIds(c,role),suspensions:compatibleIds(TANK_SUSPENSIONS,c,'suspension_type_slot',[],role),armorTypes:compatibleIds(TANK_ARMOR_TYPES,c,'armor_type_slot',[],role),engines:compatibleIds(TANK_ENGINES,c,'engine_type_slot',[],role),specials:specialSlotIds(c).map(slot=>new Set(['none',...compatibleIds(TANK_SPECIALS,c,slot,[],role)])),genericSlots:null};
}

function mergeResources(...sources){const out={};for(const src of sources)for(const [k,v] of Object.entries(src||{}))out[k]=(out[k]||0)+(Number(v)||0);return out;}
const UPGRADE_STAT_MAP={soft_attack:'softAttack',hard_attack:'hardAttack',ap_attack:'piercing',armor_value:'armor',defense:'defense',breakthrough:'breakthrough',maximum_speed:'maxSpeed',reliability:'reliability',fuel_consumption:'fuelConsumption',build_cost_ic:'buildCost',air_attack:'airAttack'};
const upgradeRaw=id=>PACK_UPGRADES?.[id]?.raw||PACK_UPGRADES?.[id];
function numericLevelMap(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}};
export function applyTankUpgradeDefinition(state,def0,requested){
  const def=def0?.raw||def0;if(!def||typeof def!=='object')return 0;
  const max=Number(def.max_level);const level=clamp(Math.round(Number(requested)||0),0,Number.isFinite(max)?max:20);if(!level)return 0;
  for(const [rawKey,dst] of Object.entries(UPGRADE_STAT_MAP)){const per=Number(def[rawKey]);if(!Number.isFinite(per))continue;state[dst]=(Number(state[dst])||0)*(1+per*level);}
  for(const [rawKey,value] of Object.entries(numericLevelMap(def.add_stats))){const dst=UPGRADE_STAT_MAP[rawKey],per=Number(value);if(!dst||!Number.isFinite(per))continue;state[dst]=(Number(state[dst])||0)+per*level;}
  const thresholds=numericLevelMap(def.resource_cost_thresholds),eligible=Object.keys(thresholds).map(Number).filter(x=>Number.isFinite(x)&&x<=level).sort((a,b)=>a-b);
  if(eligible.length){const resources=numericLevelMap(thresholds[String(eligible.at(-1))]??thresholds[eligible.at(-1)]);state.resources={...(state.resources||{})};for(const [resource,value] of Object.entries(resources)){const q=Number(value);if(Number.isFinite(q))state.resources[resource]=(Number(state.resources[resource])||0)+q;}}
  return level;
}
function applyPackUpgrade(state,id,requested){return applyTankUpgradeDefinition(state,upgradeRaw(id),requested);}
function tankUpgradeId(kind){const nsb=`tank_nsb_${kind}_upgrade`,legacy=`tank_${kind}_upgrade`;return upgradeRaw(nsb)?nsb:legacy;}
function roleEquipmentForDesign(d){
  const base=TANK_CHASSIS[d.chassis]?._equipment||TANK_CHASSIS[d.chassis];const cfg=TARGETS[d.class]?.[d.role];if(!PACK_MODE||!cfg?.duplicate)return base;
  const suffix=String(d.chassis).match(/_(\d+)$/)?.[1];if(suffix!==undefined&&PACK_EQUIPMENT[`${cfg.duplicate}_${suffix}`])return PACK_EQUIPMENT[`${cfg.duplicate}_${suffix}`];
  return base;
}
function selectedPackModules(d){
  if(d.class==='land_cruiser')return Object.values(d.slotModules||{}).filter(id=>id&&id!=='none').map(id=>TANK_SLOT_MODULES[id]?._module).filter(Boolean);
  return [TANK_GUNS[d.gun],TANK_TURRETS[d.turret],TANK_SUSPENSIONS[d.suspension],TANK_ARMOR_TYPES[d.armorType],TANK_ENGINES[d.engine],...(d.specials||[]).map(k=>TANK_SPECIALS[k])].map(x=>x?._module).filter(Boolean);
}
function buildImportedTankDesign(raw){
  const d=normalizeTankDesign(raw,raw?.class,raw?.role),c=TANK_CHASSIS[d.chassis],roleBase=roleEquipmentForDesign(d);
  let state=applyModuleEffects(equipmentToState(roleBase),selectedPackModules(d));
  applyPackUpgrade(state,tankUpgradeId('engine'),d.engineUpgrades);applyPackUpgrade(state,tankUpgradeId('armor'),d.armorUpgrades);
  state.reliability=clamp(Number(state.reliability)||0,.01,1);state.maxSpeed=Math.max(0,Number(state.maxSpeed)||0);state.buildCost=Math.max(0,Number(state.buildCost)||0);
  return {...d,year:c?.year,softAttack:Number(state.softAttack)||0,hardAttack:Number(state.hardAttack)||0,piercing:Number(state.piercing)||0,breakthrough:Number(state.breakthrough)||0,defense:Number(state.defense)||0,reliability:state.reliability,maxSpeed:state.maxSpeed,armor:Math.max(0,Number(state.armor)||0),hardness:Math.max(0,Number(state.hardness)||0),buildCost:state.buildCost,fuelConsumption:Math.max(0,Number(state.fuelConsumption)||0),weight:Number(state.weight)||0,maxWeight:0,overloaded:false,overload:0,resources:{...(state.resources||{})},airAttack:Number(state.airAttack)||0,source:'game-pack',averageStatInference:!!state.averageStatInference,upgradeSource:Object.keys(PACK_UPGRADES).length?'game-pack':'none',roleEquipmentId:roleBase?.id||d.chassis};
}

function applyUnitEquipmentModifier(value,modifier){return Math.max(0,(Number(value)||0)*(1+(Number(modifier)||0)));}
function buildFallbackTankDesign(raw){
  const d=normalizeTankDesign(raw),c=TANK_CHASSIS[d.chassis],g=TANK_GUNS[d.gun],t=TANK_TURRETS[d.turret],s=TANK_SUSPENSIONS[d.suspension],a=TANK_ARMOR_TYPES[d.armorType],e=TANK_ENGINES[d.engine],special=d.specials.map(k=>TANK_SPECIALS[k]);
  let soft=g.soft||0,hard=g.hard||0,piercing=g.piercing||0,breakthrough=c.breakthrough+(t.breakthrough||0)+(s.breakthrough||0)+(e.breakthrough||0),defense=c.defense+(t.defense||0),reliability=c.reliability+(g.reliability||0)+(t.reliability||0)+(s.reliability||0)+(e.reliability||0),speed=c.speed+(s.speed||0)+(e.speed||0),fuel=Math.max(.1,c.fuel+(e.fuel||0));
  let armor=c.armor*a.armorMult,armorMult=1,attackMult=1,cost=c.cost+(g.cost||0)+(t.cost||0)+(s.cost||0)+(a.cost||0)+(e.cost||0),weight=(c.weight+(g.weight||0)+(t.weight||0)+(s.weight||0)+(e.weight||0))*a.weightMult;
  for(const m of special){soft+=m.soft||0;hard+=m.hard||0;piercing+=m.piercing||0;breakthrough+=m.breakthrough||0;defense+=m.defense||0;reliability+=m.reliability||0;speed+=m.speed||0;cost+=m.cost||0;weight+=m.weight||0;armorMult+=m.armorMult||0;attackMult+=m.attackMult||0;}
  armor*=armorMult;speed+=d.engineUpgrades*.32;cost+=d.engineUpgrades*.22;reliability-=d.engineUpgrades*.008;fuel+=d.engineUpgrades*.035;armor*=1+d.armorUpgrades*.045;cost+=d.armorUpgrades*.28;reliability-=d.armorUpgrades*.009;speed-=d.armorUpgrades*.055;weight+=d.armorUpgrades*.45;soft*=attackMult;hard*=attackMult;
  const overload=Math.max(0,weight-c.maxWeight),overloadRatio=overload/Math.max(1,c.maxWeight);if(overload>0){speed*=clamp(1-overloadRatio*.8,.45,1);reliability-=overloadRatio*.3;}
  reliability=clamp(reliability,.10,1);speed=Math.max(.5,speed);cost=Math.max(.5,cost);armor=Math.max(0,armor);const resources=mergeResources(c.resources,g.resources);if(d.armorUpgrades>=6)resources.steel=(resources.steel||0)+1;if(d.armorType==='cast')resources.steel=(resources.steel||0)+1;
  return {...d,year:c.year,softAttack:soft,hardAttack:hard,piercing,breakthrough,defense,reliability,maxSpeed:speed,armor,hardness:c.hardness,buildCost:cost,fuelConsumption:fuel,weight,maxWeight:c.maxWeight,overloaded:overload>0,overload,resources,source:'fallback',airAttack:0};
}
export function buildTankDesign(raw){return PACK_MODE?buildImportedTankDesign(raw):buildFallbackTankDesign(raw);}
export function applyTankDesignToBattalion(baseBattalion,rawDesign){
  const d=buildTankDesign(rawDesign),base={...baseBattalion},m=base.equipmentModifiers||{};
  return {...base,soft:applyUnitEquipmentModifier(d.softAttack,m.soft),hard:applyUnitEquipmentModifier(d.hardAttack,m.hard),def:applyUnitEquipmentModifier(d.defense,m.def),breakthrough:applyUnitEquipmentModifier(d.breakthrough,m.breakthrough),hardness:clamp(applyUnitEquipmentModifier(d.hardness,m.hardness),0,1),armor:applyUnitEquipmentModifier(d.armor,m.armor),piercing:applyUnitEquipmentModifier(d.piercing,m.piercing),airAttack:applyUnitEquipmentModifier(d.airAttack??base.airAttack,m.airAttack),designReliability:d.reliability,designSpeed:d.maxSpeed,designFuel:d.fuelConsumption,designStats:d};
}
export function tankEquipmentRecord(baseEquipment,rawDesign){const d=buildTankDesign(rawDesign);return {...baseEquipment,name:d.name,cost:d.buildCost,resources:{...d.resources},designStats:d};}
export function tankClassIds(cls){const cfg=tankVariantTargets(cls,'armor');const unit=cfg?.units?.[0];return {battalion:unit?.kind==='battalion'?unit.id:null,support:unit?.kind==='support'?unit.id:null,equipment:cfg?.equipmentKey||`${cls}_tank_chassis`};}

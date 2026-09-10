import { tankCatalogFromPack, equipmentToState, applyModuleEffects, chooseCatalogDefault } from './designerData.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const humanize=id=>String(id||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

export const TANK_CHASSIS={
  light_basic:{name:'Basic Light Chassis',class:'light',year:1934,cost:2.0,speed:7.0,reliability:.80,armor:10,breakthrough:5,defense:3,hardness:.80,fuel:1.2,weight:7,maxWeight:16,resources:{steel:1}},
  light_improved:{name:'Improved Light Chassis',class:'light',year:1936,cost:2.5,speed:8.0,reliability:.82,armor:15,breakthrough:7,defense:4,hardness:.80,fuel:1.4,weight:8,maxWeight:19,resources:{steel:1}},
  light_advanced:{name:'Advanced Light Chassis',class:'light',year:1941,cost:3.2,speed:9.0,reliability:.84,armor:24,breakthrough:9,defense:5,hardness:.82,fuel:1.6,weight:9,maxWeight:23,resources:{steel:2}},
  medium_basic:{name:'Basic Medium Chassis',class:'medium',year:1938,cost:4.0,speed:6.0,reliability:.80,armor:32,breakthrough:11,defense:5,hardness:.90,fuel:2.2,weight:16,maxWeight:31,resources:{steel:2}},
  medium_improved:{name:'Improved Medium Chassis',class:'medium',year:1940,cost:5.0,speed:7.0,reliability:.82,armor:46,breakthrough:15,defense:7,hardness:.90,fuel:2.5,weight:18,maxWeight:35,resources:{steel:2}},
  medium_advanced:{name:'Advanced Medium Chassis',class:'medium',year:1943,cost:6.0,speed:8.0,reliability:.84,armor:64,breakthrough:19,defense:9,hardness:.92,fuel:2.8,weight:20,maxWeight:40,resources:{steel:3}},
  heavy_basic:{name:'Basic Heavy Chassis',class:'heavy',year:1934,cost:6.0,speed:4.0,reliability:.76,armor:55,breakthrough:16,defense:7,hardness:.95,fuel:3.2,weight:30,maxWeight:52,resources:{steel:3,chromium:1}},
  heavy_improved:{name:'Improved Heavy Chassis',class:'heavy',year:1940,cost:7.5,speed:4.5,reliability:.78,armor:80,breakthrough:22,defense:9,hardness:.96,fuel:3.8,weight:34,maxWeight:60,resources:{steel:4,chromium:1}},
  heavy_advanced:{name:'Advanced Heavy Chassis',class:'heavy',year:1943,cost:9.0,speed:5.0,reliability:.80,armor:105,breakthrough:28,defense:11,hardness:.97,fuel:4.4,weight:38,maxWeight:70,resources:{steel:4,chromium:2}}
};

export const TANK_GUNS={
  heavy_machine_gun:{name:'Heavy Machine Gun',soft:7,hard:1,piercing:5,cost:.5,weight:1,reliability:0},
  small_cannon:{name:'Small Cannon',soft:12,hard:5,piercing:18,cost:1.5,weight:2,reliability:-.02},
  close_support_gun:{name:'Close Support Gun',soft:28,hard:3,piercing:12,cost:3.0,weight:3,reliability:-.03},
  high_velocity_1:{name:'High Velocity Cannon I',soft:9,hard:22,piercing:48,cost:3.5,weight:4,reliability:-.04,resources:{tungsten:1}},
  medium_cannon:{name:'Medium Cannon',soft:22,hard:16,piercing:36,cost:4.0,weight:5,reliability:-.04,resources:{tungsten:1}},
  improved_medium_cannon:{name:'Improved Medium Cannon',soft:27,hard:22,piercing:52,cost:5.0,weight:6,reliability:-.05,resources:{tungsten:1}},
  medium_howitzer:{name:'Medium Howitzer',soft:38,hard:6,piercing:20,cost:5.0,weight:6,reliability:-.05,resources:{tungsten:1}},
  heavy_cannon:{name:'Heavy Cannon',soft:23,hard:38,piercing:76,cost:6.5,weight:9,reliability:-.07,resources:{tungsten:2}}
};

export const TANK_TURRETS={
  one_man:{name:'One-Man Turret',breakthrough:2,defense:0,cost:.5,weight:1,reliability:-.04},
  two_man:{name:'Two-Man Turret',breakthrough:5,defense:1,cost:1.2,weight:2,reliability:-.02},
  three_man:{name:'Three-Man Turret',breakthrough:9,defense:2,cost:2.2,weight:3,reliability:0},
  fixed:{name:'Fixed Superstructure',breakthrough:-4,defense:5,cost:-.3,weight:1,reliability:.04}
};

export const TANK_SUSPENSIONS={
  bogie:{name:'Bogie Suspension',speed:0,reliability:.05,breakthrough:0,cost:.4,weight:0},
  christie:{name:'Christie Suspension',speed:1.4,reliability:-.04,breakthrough:1,cost:1.1,weight:.5},
  torsion:{name:'Torsion Bar',speed:.4,reliability:.06,breakthrough:2,cost:1.2,weight:.5},
  interleaved:{name:'Interleaved Roadwheels',speed:.2,reliability:.03,breakthrough:3,cost:1.4,weight:1}
};

export const TANK_ARMOR_TYPES={
  riveted:{name:'Riveted Armor',armorMult:.90,cost:-.5,reliability:-.02,weightMult:.95},
  welded:{name:'Welded Armor',armorMult:1.00,cost:.8,reliability:.02,weightMult:1.00},
  cast:{name:'Cast Armor',armorMult:1.12,cost:2.0,reliability:.03,weightMult:1.06}
};

export const TANK_ENGINES={
  gasoline:{name:'Gasoline Engine',speed:1.0,reliability:-.04,fuel:.4,cost:.6,weight:0},
  diesel:{name:'Diesel Engine',speed:.3,reliability:.09,fuel:-.25,cost:1.0,weight:.5},
  petrol_electric:{name:'Petrol-Electric Engine',speed:.6,reliability:-.08,fuel:.15,cost:2.0,weight:1,breakthrough:2}
};

export const TANK_SPECIALS={
  none:{name:'Empty',cost:0,weight:0},
  radio:{name:'Radio',breakthrough:5,defense:2,cost:1.0,weight:.2},
  sloped_armor:{name:'Sloped Armor',armorMult:.12,breakthrough:-1,cost:1.0,weight:.7},
  wet_ammo:{name:'Wet Ammunition Storage',reliability:.12,cost:1.0,weight:.4},
  easy_maintenance:{name:'Easy Maintenance',reliability:.10,cost:.7,weight:.2},
  extra_machine_guns:{name:'Additional Machine Guns',soft:5,cost:.6,weight:.3},
  smoke_launchers:{name:'Smoke Launchers',defense:2,breakthrough:2,cost:.5,weight:.2},
  stabilizer:{name:'Stabilizer',breakthrough:6,attackMult:.05,cost:1.5,weight:.5}
};

const FALLBACK_DEFAULT_CHASSIS={light:'light_improved',medium:'medium_improved',heavy:'heavy_improved'};
const FALLBACK_DEFAULT_GUN={light:'small_cannon',medium:'medium_cannon',heavy:'heavy_cannon'};
let PACK_MODE=false,PACK_YEAR=1940,PACK_UPGRADES={},PACK_META=null;

function replaceCatalog(target,next){for(const k of Object.keys(target))delete target[k];Object.assign(target,next);}
function firstKey(map,exceptNone=false){return Object.keys(map).find(k=>!exceptNone||k!=='none')||Object.keys(map)[0]||null;}
function chassisDefault(cls){return PACK_MODE?chooseCatalogDefault(TANK_CHASSIS,x=>x.class===cls,PACK_YEAR):FALLBACK_DEFAULT_CHASSIS[cls];}
function gunDefault(cls){
  if(!PACK_MODE)return FALLBACK_DEFAULT_GUN[cls];
  const names=Object.keys(TANK_GUNS);if(!names.length)return null;
  const classNamed=names.find(k=>k.includes(cls));return classNamed||names[0];
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
  PACK_MODE=true;PACK_YEAR=Number(year)||1940;PACK_UPGRADES=pack?.equipmentUpgrades||{};PACK_META=cat.meta;
  return {active:true,...cat.meta,upgrades:Object.keys(PACK_UPGRADES).length};
}
export function tankDataStatus(){return {active:PACK_MODE,year:PACK_YEAR,...(PACK_META||{}),upgrades:Object.keys(PACK_UPGRADES).length};}

export function defaultTankDesign(cls='medium'){
  const c=['light','medium','heavy'].includes(cls)?cls:'medium',chassis=chassisDefault(c)||firstKey(TANK_CHASSIS);
  return {name:`${c[0].toUpperCase()+c.slice(1)} Tank`,class:c,chassis,gun:gunDefault(c)||firstKey(TANK_GUNS),turret:defaultModule(TANK_TURRETS,'three_man'),suspension:defaultModule(TANK_SUSPENSIONS,'torsion'),armorType:defaultModule(TANK_ARMOR_TYPES,'welded'),engine:defaultModule(TANK_ENGINES,'diesel'),engineUpgrades:PACK_MODE?0:3,armorUpgrades:PACK_MODE?0:3,specials:[defaultModule(TANK_SPECIALS,'none'),'none','none']};
}

export function normalizeTankDesign(raw,cls='medium'){
  const desired=['light','medium','heavy'].includes(raw?.class)?raw.class:cls,base=defaultTankDesign(desired),out={...base,...(raw||{})};
  if(!TANK_CHASSIS[out.chassis])out.chassis=base.chassis;
  out.class=TANK_CHASSIS[out.chassis]?.class||desired;
  if(!TANK_GUNS[out.gun])out.gun=gunDefault(out.class)||firstKey(TANK_GUNS);
  if(!TANK_TURRETS[out.turret])out.turret=defaultModule(TANK_TURRETS,'three_man');
  if(!TANK_SUSPENSIONS[out.suspension])out.suspension=defaultModule(TANK_SUSPENSIONS,'torsion');
  if(!TANK_ARMOR_TYPES[out.armorType])out.armorType=defaultModule(TANK_ARMOR_TYPES,'welded');
  if(!TANK_ENGINES[out.engine])out.engine=defaultModule(TANK_ENGINES,'diesel');
  out.engineUpgrades=clamp(Math.round(Number(out.engineUpgrades)||0),0,20);
  out.armorUpgrades=clamp(Math.round(Number(out.armorUpgrades)||0),0,20);
  out.specials=Array.from({length:3},(_,i)=>TANK_SPECIALS[out.specials?.[i]]?out.specials[i]:'none');
  out.name=String(out.name||TANK_CHASSIS[out.chassis]?.name||humanize(out.chassis)).slice(0,80);
  return out;
}

function mergeResources(...sources){const out={};for(const src of sources)for(const [k,v] of Object.entries(src||{}))out[k]=(out[k]||0)+(Number(v)||0);return out;}
const UPGRADE_STAT_MAP={soft_attack:'softAttack',hard_attack:'hardAttack',ap_attack:'piercing',armor_value:'armor',defense:'defense',breakthrough:'breakthrough',maximum_speed:'maxSpeed',reliability:'reliability',fuel_consumption:'fuelConsumption',build_cost_ic:'buildCost',air_attack:'airAttack'};
function applyPackUpgrade(state,id,requested){
  const def=PACK_UPGRADES?.[id]?.raw||PACK_UPGRADES?.[id];if(!def||typeof def!=='object')return;
  const max=Number(def.max_level);const level=clamp(Math.round(Number(requested)||0),0,Number.isFinite(max)?max:20);if(!level)return;
  for(const [rawKey,dst] of Object.entries(UPGRADE_STAT_MAP)){
    const per=Number(def[rawKey]);if(!Number.isFinite(per))continue;
    state[dst]=(Number(state[dst])||0)*(1+per*level);
  }
}
function buildImportedTankDesign(raw){
  const d=normalizeTankDesign(raw),c=TANK_CHASSIS[d.chassis];
  const selected=[TANK_GUNS[d.gun],TANK_TURRETS[d.turret],TANK_SUSPENSIONS[d.suspension],TANK_ARMOR_TYPES[d.armorType],TANK_ENGINES[d.engine],...d.specials.map(k=>TANK_SPECIALS[k])];
  let state=applyModuleEffects(equipmentToState(c?._equipment||c),selected.map(x=>x?._module).filter(Boolean));
  applyPackUpgrade(state,'tank_engine_upgrade',d.engineUpgrades);applyPackUpgrade(state,'tank_armor_upgrade',d.armorUpgrades);
  state.reliability=clamp(Number(state.reliability)||0,.01,1);state.maxSpeed=Math.max(0,Number(state.maxSpeed)||0);state.buildCost=Math.max(0,Number(state.buildCost)||0);
  return {...d,year:c?.year,softAttack:Number(state.softAttack)||0,hardAttack:Number(state.hardAttack)||0,piercing:Number(state.piercing)||0,breakthrough:Number(state.breakthrough)||0,defense:Number(state.defense)||0,reliability:state.reliability,maxSpeed:state.maxSpeed,armor:Math.max(0,Number(state.armor)||0),hardness:clamp(Number(state.hardness)||0,0,1),buildCost:state.buildCost,fuelConsumption:Math.max(0,Number(state.fuelConsumption)||0),weight:Number(state.weight)||0,maxWeight:0,overloaded:false,overload:0,resources:{...(state.resources||{})},airAttack:Number(state.airAttack)||0,source:'game-pack',averageStatInference:!!state.averageStatInference,upgradeSource:Object.keys(PACK_UPGRADES).length?'game-pack':'none'};
}


function applyUnitEquipmentModifier(value,modifier){return Math.max(0,(Number(value)||0)*(1+(Number(modifier)||0)));}
function buildFallbackTankDesign(raw){
  const d=normalizeTankDesign(raw),c=TANK_CHASSIS[d.chassis],g=TANK_GUNS[d.gun],t=TANK_TURRETS[d.turret],s=TANK_SUSPENSIONS[d.suspension],a=TANK_ARMOR_TYPES[d.armorType],e=TANK_ENGINES[d.engine],special=d.specials.map(k=>TANK_SPECIALS[k]);
  let soft=g.soft||0,hard=g.hard||0,piercing=g.piercing||0,breakthrough=c.breakthrough+(t.breakthrough||0)+(s.breakthrough||0)+(e.breakthrough||0),defense=c.defense+(t.defense||0),reliability=c.reliability+(g.reliability||0)+(t.reliability||0)+(s.reliability||0)+(e.reliability||0),speed=c.speed+(s.speed||0)+(e.speed||0),fuel=Math.max(.1,c.fuel+(e.fuel||0));
  let armor=c.armor*a.armorMult,armorMult=1,attackMult=1,cost=c.cost+(g.cost||0)+(t.cost||0)+(s.cost||0)+(a.cost||0)+(e.cost||0),weight=(c.weight+(g.weight||0)+(t.weight||0)+(s.weight||0)+(e.weight||0))*a.weightMult;
  for(const m of special){soft+=m.soft||0;hard+=m.hard||0;piercing+=m.piercing||0;breakthrough+=m.breakthrough||0;defense+=m.defense||0;reliability+=m.reliability||0;speed+=m.speed||0;cost+=m.cost||0;weight+=m.weight||0;armorMult+=m.armorMult||0;attackMult+=m.attackMult||0;}
  armor*=armorMult;
  speed+=d.engineUpgrades*.32;cost+=d.engineUpgrades*.22;reliability-=d.engineUpgrades*.008;fuel+=d.engineUpgrades*.035;
  armor*=1+d.armorUpgrades*.045;cost+=d.armorUpgrades*.28;reliability-=d.armorUpgrades*.009;speed-=d.armorUpgrades*.055;weight+=d.armorUpgrades*.45;
  soft*=attackMult;hard*=attackMult;
  const overload=Math.max(0,weight-c.maxWeight),overloadRatio=overload/Math.max(1,c.maxWeight);
  if(overload>0){speed*=clamp(1-overloadRatio*.8,.45,1);reliability-=overloadRatio*.3;}
  reliability=clamp(reliability,.10,1);speed=Math.max(.5,speed);cost=Math.max(.5,cost);armor=Math.max(0,armor);
  const resources=mergeResources(c.resources,g.resources);
  if(d.armorUpgrades>=6)resources.steel=(resources.steel||0)+1;
  if(d.armorType==='cast')resources.steel=(resources.steel||0)+1;
  return {...d,year:c.year,softAttack:soft,hardAttack:hard,piercing,breakthrough,defense,reliability,maxSpeed:speed,armor,hardness:c.hardness,buildCost:cost,fuelConsumption:fuel,weight,maxWeight:c.maxWeight,overloaded:overload>0,overload,resources,source:'fallback'};
}

export function buildTankDesign(raw){return PACK_MODE?buildImportedTankDesign(raw):buildFallbackTankDesign(raw);}

export function applyTankDesignToBattalion(baseBattalion,rawDesign){
  const d=buildTankDesign(rawDesign),base={...baseBattalion},m=base.equipmentModifiers||{};
  return {...base,soft:applyUnitEquipmentModifier(d.softAttack,m.soft),hard:applyUnitEquipmentModifier(d.hardAttack,m.hard),def:applyUnitEquipmentModifier(d.defense,m.def),breakthrough:applyUnitEquipmentModifier(d.breakthrough,m.breakthrough),hardness:clamp(applyUnitEquipmentModifier(d.hardness,m.hardness),0,1),armor:applyUnitEquipmentModifier(d.armor,m.armor),piercing:applyUnitEquipmentModifier(d.piercing,m.piercing),airAttack:applyUnitEquipmentModifier(d.airAttack??base.airAttack,m.airAttack),designReliability:d.reliability,designSpeed:d.maxSpeed,designFuel:d.fuelConsumption,designStats:d};
}

export function tankEquipmentRecord(baseEquipment,rawDesign){
  const d=buildTankDesign(rawDesign);
  return {...baseEquipment,name:d.name,cost:d.buildCost,resources:{...d.resources},designStats:d};
}

export function tankClassIds(cls){
  return cls==='light'?{battalion:'light_armor',equipment:'light_tank'}:cls==='heavy'?{battalion:'heavy_armor',equipment:'heavy_tank'}:{battalion:'medium_armor',equipment:'medium_tank'};
}

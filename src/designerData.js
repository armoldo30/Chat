import { resolveEquipment } from './parser.js';

const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const humanize=id=>String(id||'').replace(/^unit_/,'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const number=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const text=v=>String(v||'').toLowerCase();
const mergedRequirements=(pack,kind,id,raw)=>[...new Set([...(pack?.requirements?.[kind]?.[id]||[]),...requirementTokens(raw)])];

const STAT_MAP={
  soft_attack:'softAttack',hard_attack:'hardAttack',ap_attack:'piercing',armor_value:'armor',defense:'defense',breakthrough:'breakthrough',
  maximum_speed:'maxSpeed',reliability:'reliability',fuel_consumption:'fuelConsumption',build_cost_ic:'buildCost',hardness:'hardness',air_attack:'airAttack',
  air_defence:'airDefense',air_agility:'agility',air_range:'range',air_ground_attack:'groundAttack',naval_strike_attack:'navalAttack',thrust:'thrust',weight:'weight'
};
const BASE_FIELD_MAP={
  soft:'softAttack',hard:'hardAttack',piercing:'piercing',armor:'armor',def:'defense',breakthrough:'breakthrough',speed:'maxSpeed',reliability:'reliability',
  fuel:'fuelConsumption',cost:'buildCost',hardness:'hardness',airAttack:'airAttack',airDefense:'airDefense',airAgility:'agility',airRange:'range',groundAttack:'groundAttack',navalAttack:'navalAttack',thrust:'thrust',weight:'weight'
};

export function requirementTokens(raw){
  const out=new Set();
  const walk=(v,key='')=>{
    if(Array.isArray(v)){for(const x of v)walk(x,key);return;}
    if(!isObj(v)){
      if(/has_tech|technology|has_dlc|special_project|prototype|require|prereq/i.test(key)&&typeof v==='string')out.add(v);
      return;
    }
    if(Array.isArray(v.__items)&&/has_tech|technology|has_dlc|special_project|prototype|require|prereq/i.test(key))for(const x of v.__items)out.add(String(x));
    for(const [k,x] of Object.entries(v))if(k!=='__items')walk(x,k);
  };
  walk(raw);
  return [...out];
}

export function equipmentToState(record){
  const state={};
  for(const [src,dst] of Object.entries(BASE_FIELD_MAP))if(record?.[src]!==undefined)state[dst]=number(record[src]);
  state.resources={...(record?.resources||{})};
  return state;
}

export function moduleEffects(module){
  const add={},multiply={},average={};
  for(const [src,v] of Object.entries(module?.addStats||{}))if(STAT_MAP[src])add[STAT_MAP[src]]=number(v);
  for(const [src,v] of Object.entries(module?.multiplyStats||{}))if(STAT_MAP[src])multiply[STAT_MAP[src]]=number(v);
  for(const [src,v] of Object.entries(module?.addAverageStats||{}))if(STAT_MAP[src])average[STAT_MAP[src]]=number(v);
  return {add,multiply,average,resources:{...(module?.resources||{})}};
}

export function applyModuleEffects(base,modules=[]){
  const state={...base,resources:{...(base?.resources||{})}},add={},mult={},average={},averageKeys=new Set();
  for(const module of modules.filter(Boolean)){
    const fx=moduleEffects(module);
    for(const [k,v] of Object.entries(fx.add))add[k]=(add[k]||0)+v;
    for(const [k,v] of Object.entries(fx.multiply))mult[k]=(mult[k]||0)+v;
    for(const [k,v] of Object.entries(fx.average)){average[k]=(average[k]||0)+v;averageKeys.add(k);}
    for(const [r,q] of Object.entries(fx.resources))state.resources[r]=(state.resources[r]||0)+number(q);
  }
  for(const [k,v] of Object.entries(add))state[k]=number(state[k])+v;
  // Clausewitz equipment-module multiply_stats are accumulated modifiers. Applying the summed multiplier after additive module stats is the conservative designer approximation used here.
  for(const [k,v] of Object.entries(mult))state[k]=number(state[k])*(1+v);
  // add_average_stats requires executable aggregation semantics. Preserve the value and expose the inference flag instead of silently pretending exact parity.
  for(const [k,v] of Object.entries(average))state[k]=number(state[k])+v;
  state.averageStatInference=averageKeys.size>0;
  return state;
}

function resolvedEquipment(pack,id){try{return resolveEquipment(pack?.equipment||{})[id]||null;}catch{return pack?.equipment?.[id]||null;}}
function hasSlots(e){return e&&isObj(e.moduleSlots)&&Object.keys(e.moduleSlots).length>0;}
function tankClass(id,e){
  const s=`${id} ${e?.archetype||''} ${(e?.types||[]).join(' ')}`.toLowerCase();
  if(/light.*tank|tank.*light/.test(s))return 'light';
  if(/heavy.*tank|tank.*heavy/.test(s))return 'heavy';
  if(/medium.*tank|tank.*medium/.test(s))return 'medium';
  return null;
}
function airSize(id,e){
  const s=`${id} ${e?.archetype||''}`.toLowerCase();
  if(/small.*(?:plane|airframe)|(?:plane|airframe).*small/.test(s))return 'small';
  if(/medium.*(?:plane|airframe)|(?:plane|airframe).*medium/.test(s))return 'medium';
  if(/large.*(?:plane|airframe)|(?:plane|airframe).*large/.test(s))return 'large';
  return null;
}
function moduleRecord(m,pack){return {id:m.id,name:humanize(m.id),category:m.category,guiCategory:m.guiCategory,parent:m.parent,requirements:mergedRequirements(pack,'modules',m.id,m.raw),_module:m,source:'game-pack'};}
function chassisRecord(id,e,cls,pack){const s=equipmentToState(e);return {id,name:humanize(id),class:cls,year:e.year,source:'game-pack',gameId:id,requirements:mergedRequirements(pack,'equipment',id,e.raw),_equipment:e,...s};}
function airframeRecord(id,e,size,pack){const s=equipmentToState(e);return {id,name:humanize(id),size,year:e.year,source:'game-pack',gameId:id,requirements:mergedRequirements(pack,'equipment',id,e.raw),_equipment:e,...s};}

function tankModuleBucket(m){
  const c=text(m.category),id=text(m.id),all=`${c} ${text(m.guiCategory)} ${id}`;
  if(c==='tank_main_armament'||/tank.*main.*armament|tank.*weapon|cannon|howitzer|flamethrower/.test(all))return 'guns';
  if(c==='tank_turret_type'||/tank.*turret/.test(all))return 'turrets';
  if(c==='tank_suspension'||/tank.*suspension/.test(all))return 'suspensions';
  if(c==='tank_armor_type'||/tank.*armor.*type/.test(all))return 'armorTypes';
  if(c==='tank_engine_type'||/tank.*engine.*type/.test(all))return 'engines';
  if(c.startsWith('tank_')||id.startsWith('tank_')||(m.allowEquipmentType||[]).some(x=>/armor|tank/i.test(x)))return 'specials';
  return null;
}
function airModuleBucket(m){
  const c=text(m.category),id=text(m.id),all=`${c} ${text(m.guiCategory)} ${id}`;
  const fx=moduleEffects(m),attack=(fx.add.airAttack||0)+(fx.add.groundAttack||0)+(fx.add.navalAttack||0)+(fx.average.airAttack||0);
  if(/plane.*engine|air.*engine/.test(all))return 'engines';
  if(/weapon|armament|bomb|torpedo|cannon|machine_gun|rocket/.test(all)||attack>0)return 'weapons';
  if(/armor|armour|defen|self_seal|turret/.test(all)||fx.add.airDefense||fx.multiply.airDefense)return 'defense';
  if(/plane|air/.test(all)||(m.allowEquipmentType||[]).some(x=>/fighter|cas|bomber|air/i.test(x)))return 'specials';
  return null;
}

export function tankCatalogFromPack(pack){
  const out={chassis:{},guns:{},turrets:{},suspensions:{},armorTypes:{},engines:{},specials:{none:{id:'none',name:'Empty',source:'system',_module:null}}};
  for(const id of Object.keys(pack?.equipment||{})){
    const e=resolvedEquipment(pack,id),cls=tankClass(id,e);if(!cls||!hasSlots(e))continue;
    out.chassis[id]=chassisRecord(id,e,cls,pack);
  }
  for(const m of Object.values(pack?.modules||{})){const bucket=tankModuleBucket(m);if(bucket)out[bucket][m.id]=moduleRecord(m,pack);}
  out.meta={chassis:Object.keys(out.chassis).length,guns:Object.keys(out.guns).length,turrets:Object.keys(out.turrets).length,suspensions:Object.keys(out.suspensions).length,armorTypes:Object.keys(out.armorTypes).length,engines:Object.keys(out.engines).length,specials:Object.keys(out.specials).length-1};
  return out;
}

export function airCatalogFromPack(pack){
  const out={airframes:{},engines:{},weapons:{none:{id:'none',name:'Empty',source:'system',_module:null}},defense:{none:{id:'none',name:'No Defense Module',source:'system',_module:null}},specials:{none:{id:'none',name:'Empty',source:'system',_module:null}}};
  for(const id of Object.keys(pack?.equipment||{})){
    const e=resolvedEquipment(pack,id),size=airSize(id,e);if(!size||!hasSlots(e))continue;
    out.airframes[id]=airframeRecord(id,e,size,pack);
  }
  for(const m of Object.values(pack?.modules||{})){const bucket=airModuleBucket(m);if(bucket)out[bucket][m.id]=moduleRecord(m,pack);}
  out.meta={airframes:Object.keys(out.airframes).length,engines:Object.keys(out.engines).length,weapons:Object.keys(out.weapons).length-1,defense:Object.keys(out.defense).length-1,specials:Object.keys(out.specials).length-1};
  return out;
}

export function chooseCatalogDefault(map,predicate=()=>true,year=1940){
  const rows=Object.values(map||{}).filter(x=>x&&x.id!=='none'&&predicate(x));
  if(!rows.length)return Object.keys(map||{})[0]||null;
  rows.sort((a,b)=>(number(a.year,9999)-number(b.year,9999))||String(a.id).localeCompare(String(b.id)));
  const eligible=rows.filter(x=>!Number.isFinite(Number(x.year))||Number(x.year)<=year);
  return (eligible.at(-1)||rows[0]).id;
}

export function designerCatalogCoverage(pack){const t=tankCatalogFromPack(pack),a=airCatalogFromPack(pack);return {tank:t.meta,air:a.meta};}

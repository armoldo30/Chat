let PACK_MODE=false,PACK_YEAR=1940,PACK_META=null;
export const AIR_SLOT_MODULES={none:{id:'none',name:'Empty',source:'system',_module:null}};
function replaceCatalog(target,next){for(const k of Object.keys(target))delete target[k];Object.assign(target,next);}
function firstKey(map,exceptNone=false){return Object.keys(map).find(k=>!exceptNone||k!=='none')||Object.keys(map)[0]||null;}
function defaultFrame(size){
  if(!PACK_MODE)return size==='medium'?'medium_improved':'small_improved';
  return chooseCatalogDefault(AIRFRAMES,x=>x.size===size&&!x.carrier,PACK_YEAR)||chooseCatalogDefault(AIRFRAMES,x=>x.size===size,PACK_YEAR);
}
const list=v=>Array.isArray(v)?v:v==null?[]:[v];
const moduleSource=r=>r?._module||r||{};
const frameSource=f=>f?._equipment||f||{};
const frameSlots=f=>frameSource(f)?.moduleSlots||{};
const slotCategories=(f,slot)=>new Set(list(frameSlots(f)?.[slot]?.allowed_module_categories));
export function airSlotKind(slotId){return /engine/i.test(slotId)?'engine':/(weapon|armament)/i.test(slotId)?'weapon':'special';}
export function airSlotLabel(slotId){
  if(slotId==='fixed_main_weapon_slot')return 'Main Weapon';
  if(slotId==='engine_type_slot')return 'Engine';
  const aux=String(slotId).match(/weapon_slot_(\d+)/);if(aux)return `Auxiliary Weapon ${aux[1]}`;
  const special=String(slotId).match(/special_type_slot_(\d+)/);if(special)return `Special ${special[1]}`;
  return String(slotId||'Module').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function compatibleModule(id,frame,slotId){if(id==='none')return !frameSlots(frame)?.[slotId]?.required;const rec=AIR_SLOT_MODULES[id];return !!rec&&slotCategories(frame,slotId).has(String(moduleSource(rec)?.category||rec.category||''));}
function compatibleSet(frame,slotId){const out=new Set();if(!frameSlots(frame)?.[slotId]?.required)out.add('none');for(const id of Object.keys(AIR_SLOT_MODULES))if(id!=='none'&&compatibleModule(id,frame,slotId))out.add(id);return out;}
const DEFAULT_MODULE_PRIORITY=[
  'heavy_mg_2x','light_mg_4x','light_mg_2x','aircraft_cannon_1_1x','bomb_locks','medium_bomb_bay','large_bomb_bay','torpedo_mounting','recon_camera',
  'engine_2_1x','engine_2_2x','engine_2_3x','engine_2_4x','engine_2_6x','engine_1_1x','engine_1_2x','engine_1_3x','engine_1_4x','engine_1_6x',
  'jet_engine_1x','jet_engine_2x','jet_engine_3x','jet_engine_4x','jet_engine_6x','rocket_engine_1'
];
function firstCompatible(frame,slotId,preferred=[]){const set=compatibleSet(frame,slotId);for(const id of [...preferred,...DEFAULT_MODULE_PRIORITY])if(set.has(id))return id;return [...set].find(x=>x!=='none')||([...set][0]||null);}
function legacyAliasCandidates(id,frame){
  if(!id||id==='none')return ['none'];
  const direct=[id];
  const aliases={engine_1:['engine_1_1x','engine_1_2x','engine_1_3x','engine_1_4x','engine_1_6x'],engine_2:['engine_2_1x','engine_2_2x','engine_2_3x','engine_2_4x','engine_2_6x'],engine_3:['engine_3_1x','engine_3_2x','engine_3_3x','engine_3_4x','engine_3_6x'],engine_4:['engine_4_1x','engine_4_2x','engine_4_3x','engine_4_4x','engine_4_6x'],light_mg:['light_mg_2x'],heavy_mg:['heavy_mg_4x','heavy_mg_2x'],cannon_1:['aircraft_cannon_1_2x','aircraft_cannon_1_1x'],cannon_2:['aircraft_cannon_2_2x','aircraft_cannon_2_1x'],torpedo_mount:['torpedo_mounting'],radio_navigation:['radio_navigation_1']};
  direct.push(...(aliases[id]||[]));
  const size=frame?.size||'small',suffix=size==='large'?'large':size==='medium'?'medium':'small';
  if(id==='self_sealing')direct.push(`self_sealing_fuel_tanks_${suffix}`);
  if(id==='armor_plates')direct.push(`armor_plate_${suffix}`);
  if(id==='extra_fuel')direct.push(`fuel_tanks_${suffix}`);
  if(id==='non_strategic_materials')direct.push(`non_strategic_materials_${suffix}`);
  if(id==='defensive_turret')direct.push('hmg_defense_turret','lmg_defense_turret');
  return [...new Set(direct)];
}
function migrateLegacySlots(raw,frame){
  const slots=Object.keys(frameSlots(frame)),out={};
  const engine=list(raw?.engine),weapons=list(raw?.weapons),special=[raw?.defense,...list(raw?.specials)].filter(Boolean);
  const pools={engine,weapon:weapons,special};
  for(const slot of slots){
    const pool=pools[airSlotKind(slot)]||[];let chosen=null,used=-1;
    for(let i=0;i<pool.length&&!chosen;i++)for(const id of legacyAliasCandidates(pool[i],frame))if(compatibleModule(id,frame,slot)){chosen=id;used=i;break;}
    if(used>=0)pool.splice(used,1);if(chosen)out[slot]=chosen;
  }
  return out;
}
function normalizeSlots(raw,frame){
  const input=raw?.slotModules&&typeof raw.slotModules==='object'?raw.slotModules:migrateLegacySlots(raw,frame),out={};
  for(const [slotId,slot] of Object.entries(frameSlots(frame))){
    const id=input?.[slotId];out[slotId]=compatibleModule(id,frame,slotId)?id:(slot.required?firstCompatible(frame,slotId):'none');
  }
  return out;
}
function syncLegacyFields(out,frame){
  const entries=Object.entries(out.slotModules||{}),engine=entries.find(([s])=>airSlotKind(s)==='engine')?.[1]||'none',weapons=entries.filter(([s])=>airSlotKind(s)==='weapon').map(([,id])=>id),specials=entries.filter(([s])=>airSlotKind(s)==='special').map(([,id])=>id);
  const defensive=specials.find(id=>/armor|self_seal|defense_turret/.test(id));out.engine=engine;out.weapons=weapons;out.defense=defensive||'none';out.specials=specials.filter(id=>id!==defensive);return out;
}
export function airDesignOptions(raw){const frame=AIRFRAMES[raw?.airframe]||AIRFRAMES[defaultFrame(raw?.size||'small')]||AIRFRAMES[firstKey(AIRFRAMES)];const slots={};for(const slot of Object.keys(frameSlots(frame)))slots[slot]=compatibleSet(frame,slot);return {slots};}

export function configureAirDataPack(pack,year=1940){
  const cat=airCatalogFromPack(pack);if(!cat.meta.airframes)return {active:false,...cat.meta};
  replaceCatalog(AIRFRAMES,cat.airframes);replaceCatalog(AIR_SLOT_MODULES,cat.slotModules||{});
  if(cat.meta.engines)replaceCatalog(AIR_ENGINES,cat.engines);
  if(cat.meta.weapons)replaceCatalog(AIR_WEAPONS,cat.weapons);
  if(cat.meta.defense)replaceCatalog(AIR_DEFENSE_MODULES,cat.defense);
  if(cat.meta.specials)replaceCatalog(AIR_SPECIALS,cat.specials);
  PACK_MODE=true;PACK_YEAR=Number(year)||1940;PACK_META=cat.meta;
  return {active:true,...cat.meta};
}
export function airDataStatus(){return {active:PACK_MODE,year:PACK_YEAR,...(PACK_META||{})};}

export function defaultAirDesign(size='small'){
  const s=['small','medium','large'].includes(size)?size:'small',frameId=defaultFrame(s)||firstKey(AIRFRAMES),frame=AIRFRAMES[frameId];
  if(PACK_MODE){const out={name:s==='small'?'Fighter Design':`${s[0].toUpperCase()+s.slice(1)} Aircraft`,airframe:frameId,size:s,slotModules:{}};out.slotModules=normalizeSlots(out,frame);return syncLegacyFields(out,frame);}
  return {name:s==='small'?'Fighter Design':'Heavy Fighter Design',airframe:s==='small'?'small_improved':'medium_improved',engine:'engine_2',weapons:s==='small'?['heavy_mg','heavy_mg','none']:['heavy_mg','cannon_1','none'],defense:'self_sealing',specials:['drop_tanks','none']};
}

export function normalizeAirDesign(raw,size='small'){
  if(PACK_MODE){
    const desired=['small','medium','large'].includes(size)?size:'small',fallback=defaultFrame(desired)||firstKey(AIRFRAMES),airframe=AIRFRAMES[raw?.airframe]?raw.airframe:fallback,frame=AIRFRAMES[airframe],out={...(raw||{}),airframe,size:frame?.size||desired};
    out.slotModules=normalizeSlots(raw||{},frame);out.name=String(out.name||frame?.name||'Aircraft').slice(0,80);return syncLegacyFields(out,frame);
  }
  const base=defaultAirDesign(size),out={...base,...(raw||{})};
  if(!AIRFRAMES[out.airframe])out.airframe=base.airframe;if(!AIR_ENGINES[out.engine])out.engine=firstKey(AIR_ENGINES,true)||firstKey(AIR_ENGINES);
  out.weapons=Array.from({length:3},(_,i)=>AIR_WEAPONS[out.weapons?.[i]]?out.weapons[i]:'none');if(!AIR_DEFENSE_MODULES[out.defense])out.defense='none';out.specials=Array.from({length:2},(_,i)=>AIR_SPECIALS[out.specials?.[i]]?out.specials[i]:'none');out.name=String(out.name||AIRFRAMES[out.airframe]?.name||'Aircraft').slice(0,80);return out;
}

function mergeResources(...sources){const out={};for(const src of sources)for(const [k,v] of Object.entries(src||{}))out[k]=(out[k]||0)+(Number(v)||0);return out;}
function selectedPackModules(d){return Object.values(d.slotModules||{}).filter(id=>id&&id!=='none').map(id=>AIR_SLOT_MODULES[id]).filter(Boolean);}
function equipmentTypesForModules(modules){return [...new Set(modules.flatMap(r=>list(moduleSource(r)?.addEquipmentType)).filter(Boolean))];}
function rolesForTypes(types,state){
  const out=[];const add=x=>{if(!out.includes(x))out.push(x);};
  for(const t of types){if(t==='fighter'||t==='heavy_fighter')add('fighter');else if(t==='cas')add('cas');else if(t==='naval_bomber'||t==='maritime_patrol_plane')add('naval_bomber');else if(t==='strategic_bomber')add('strategic_bomber');else if(t==='tactical_bomber')add('tactical_bomber');else if(t==='scout_plane')add('recon');else if(t==='suicide')add('kamikaze');}
  if(!out.length&&Number(state?.airAttack)>0)add('fighter');return out;
}
function buildImportedAirDesign(raw){
  const d=normalizeAirDesign(raw),f=AIRFRAMES[d.airframe],selected=selectedPackModules(d),state=applyModuleEffects(equipmentToState(frameSource(f)),selected.map(moduleSource));
  const thrust=Math.max(0,Number(state.thrust)||0),weight=Math.max(0,Number(state.weight)||0),required=weight,overweight=thrust>0&&weight>thrust,types=equipmentTypesForModules(selected),roles=rolesForTypes(types,state);
  return {...d,size:f?.size||'small',carrier:!!f?.carrier,year:f?.year,airAttack:Math.max(0,Number(state.airAttack)||0),airDefense:Math.max(0,Number(state.airDefense)||0),groundAttack:Math.max(0,Number(state.groundAttack)||0),navalAttack:Math.max(0,Number(state.navalAttack)||0),agility:Math.max(0,Number(state.agility)||0),maxSpeed:Math.max(0,Number(state.maxSpeed)||0),range:Math.max(0,Number(state.range)||0),reliability:clamp(Number(state.reliability)||0,.01,1),buildCost:Math.max(0,Number(state.buildCost)||0),weight,thrust,requiredThrust:required,thrustRatio:required>0?thrust/required:1,overweight,missionEfficiency:1,fuelConsumption:Math.max(0,Number(state.fuelConsumption)||0),resources:{...(state.resources||{})},roles,equipmentTypes:types,source:'game-pack',averageStatInference:!!state.averageStatInference,missionStatCompleteness:'partial-bundle'};
}

function buildFallbackAirDesign(raw){
  const d=normalizeAirDesign(raw),f=AIRFRAMES[d.airframe],e=AIR_ENGINES[d.engine],weapons=d.weapons.map(k=>AIR_WEAPONS[k]),def=AIR_DEFENSE_MODULES[d.defense],specials=d.specials.map(k=>AIR_SPECIALS[k]);
  let airAttack=def.airAttack||0,groundAttack=0,navalAttack=0,defense=f.defense+(def.defense||0),agility=f.agility,speed=f.speed+e.speed,range=f.range+(def.range||0),reliability=f.reliability+(e.reliability||0)+(def.reliability||0),cost=f.cost+e.cost+(def.cost||0),weight=f.weight+e.weight+(def.weight||0),missionEfficiency=1,costMult=1,fuel=f.fuel+(e.fuel||0);
  for(const w of weapons){airAttack+=w.airAttack||0;groundAttack+=w.groundAttack||0;navalAttack+=w.navalAttack||0;agility+=w.agility||0;cost+=w.cost||0;weight+=w.weight||0;}
  for(const m of specials){airAttack+=m.airAttack||0;groundAttack+=m.groundAttack||0;navalAttack+=m.navalAttack||0;defense+=m.defense||0;agility+=m.agility||0;speed+=m.speed||0;range+=m.range||0;reliability+=m.reliability||0;cost+=m.cost||0;weight+=m.weight||0;missionEfficiency+=m.missionEfficiency||0;costMult+=m.costMult||0;}
  cost*=costMult;const thrust=e.thrust,required=f.thrustNeed+Math.max(0,weight-f.weight)*.75,thrustRatio=thrust/Math.max(.1,required),overweight=thrustRatio<1;if(overweight){agility*=clamp(thrustRatio,.35,1);speed*=clamp(.65+.35*thrustRatio,.45,1);reliability-=Math.max(0,1-thrustRatio)*.15;}
  agility=Math.max(1,agility);speed=Math.max(100,speed);range=Math.max(100,range);reliability=clamp(reliability,.10,1);cost=Math.max(1,cost);defense=Math.max(1,defense);const resources=mergeResources(f.resources,def.resources),roles=[];if(airAttack>0)roles.push('fighter');if(groundAttack>=6)roles.push('cas');if(navalAttack>=6)roles.push('naval_bomber');
  return {...d,size:f.size,year:f.year,airAttack,airDefense:defense,groundAttack,navalAttack,agility,maxSpeed:speed,range,reliability,buildCost:cost,weight,thrust,requiredThrust:required,thrustRatio,overweight,missionEfficiency,fuelConsumption:fuel,resources,roles,source:'fallback'};
}

export function buildAirDesign(raw){return PACK_MODE?buildImportedAirDesign(raw):buildFallbackAirDesign(raw);}

const clone=x=>structuredClone(x);
const pct=(n=0)=>Number(n)||0;

export const LAND_DOCTRINE_TRACKS={
  infantry:{name:'Infantry',choices:[
    ['mobile_infantry','Mobile Infantry'],['defensive_postures','Defensive Postures'],['large_unit_tactics','Large Unit Tactics'],['assault_infantry','Assault Infantry'],['mounted_infantry','Mounted Infantry'],['commandos','Individual Excellence'],['irregulars','Irregulars'],['peoples_war','People\'s Militia'],['great_war_infantry','Great War Infantry']
  ]},
  combat_support:{name:'Artillery & Combat Support',choices:[
    ['fire_concentration','Fire Concentration'],['anti_tank_frontline','Anti-Tank Frontline'],['flying_batteries','Flying Batteries'],['air_cavalry','Air Cavalry'],['mobile_recon_and_assault','Mobile Recon & Assault'],['self_propelled_support','Self-Propelled Support'],['siege_artillery','Siege Artillery'],['field_engineering','Field Engineering']
  ]},
  armor:{name:'Armor',choices:[
    ['armored_spearhead','Armored Spearhead'],['armored_infantry_support','Armored Infantry Support'],['streamlined_deployment','Streamlined Deployment'],['mobile_defense','Mobile Defense'],['armored_cavalry','Armored Cavalry'],['tank_destroyer_force','Tank Destroyer Force']
  ]},
  operations:{name:'Operations',choices:[
    ['mission_type_tactics','Mission-Type Tactics'],['last_stand','Desperate Defense'],['infiltration_tactics','Infiltration Tactics'],['grand_assault','Grand Assault'],['deep_battle','Deep Battle'],['guerilla_war','Guerilla War'],['rapid_domination','Rapid Domination'],['expeditionary_warfare','Expeditionary Warfare'],['dispersed_operations','Dispersed Operations']
  ]}
};

export const GRAND_DOCTRINES={
  mobile_warfare:{name:'Mobile Warfare',global:{planningSpeed:.20,armySpeed:.10},milestones:{
    combat_support:{all:{breakthrough:.10}},armor:{armor:{orgFlat:2,hard:.05,hpFlat:.5}},operations:{planningRetention:.10}
  }},
  superior_firepower:{name:'Superior Firepower',categories:{line_artillery:{soft:.10},support_artillery:{soft:.05}},milestones:{
    infantry:{global:{supply:-.10}},combat_support:{support:{orgFlat:10}},armor:{armor:{orgFlat:2,hard:.05,hpFlat:.5}},operations:{planningSpeed:.20}
  }},
  grand_battleplan:{name:'Grand Battleplan',global:{maxPlanning:.10},milestones:{
    infantry:{global:{entrenchment:.05}},combat_support:{support:{orgFlat:5}},armor:{armor:{def:.05}},operations:{global:{planningSpeed:.10}}
  }},
  mass_assault:{name:'Mass Assault',global:{supplyGraceHours:48},milestones:{
    infantry:{global:{supply:-.10}},combat_support:{all:{soft:.05}},armor:{all:{def:.10,hp:.10}},operations:{global:{coordination:.10}}
  }}
};

// Rewards below deliberately model only combat-relevant effects that can be mapped cleanly
// into this planner. Unmodeled tactics, command power, reinforce rate, training, and special
// scripted effects remain metadata until game-file doctrine import is complete.
const R={
  mobile_infantry:[
    {cavalry:{breakthrough:.20}},
    {infantry:{orgFlat:10,speed:.05},mobile:{orgFlat:10,speed:.05}},
    {mobile:{orgFlat:20}},
    {mobile:{soft:.10}},
    {infantry:{orgFlat:10,speed:.20},mobile:{orgFlat:10,speed:.20}}
  ],
  defensive_postures:[{infantry:{def:.05}},{infantry:{orgFlat:5}},{infantry:{def:.10}},{all:{entrenchment:.05}},{infantry:{orgFlat:5,def:.05}}],
  large_unit_tactics:[{all:{entrenchment:.05}},{infantry:{def:.05}},{infantry:{orgFlat:5}},{all:{soft:.05}},{mobile:{speed:.05}}],
  assault_infantry:[{infantry:{soft:.05}},{infantry:{breakthrough:.05}},{support:{soft:.05}},{infantry:{hard:.05}},{infantry:{soft:.05,breakthrough:.05}}],
  fire_concentration:[{line_artillery:{soft:.05}},{line_artillery:{soft:.05}},{line_artillery:{def:.05}},{support_artillery:{soft:.10}},{line_artillery:{soft:.05,hard:.05}}],
  anti_tank_frontline:[{anti_tank:{piercing:.10}},{anti_tank:{hard:.10}},{anti_tank:{piercing:.10}},{anti_tank:{breakthrough:.10}},{anti_tank:{hard:.10,piercing:.10}}],
  flying_batteries:[{line_artillery:{speed:.05}},{line_artillery:{soft:.05}},{support:{soft:.05}},{line_artillery:{breakthrough:.05}},{line_artillery:{speed:.05,soft:.05}}],
  field_engineering:[{support:{def:.05}},{support:{breakthrough:.05}},{all:{entrenchment:.05}},{support:{soft:.05}},{all:{def:.05}}],
  armored_spearhead:[{armor:{breakthrough:.10}},{armor:{orgFlat:4}},{armor:{speed:.05}},{armor:{def:.05}},{armor:{breakthrough:.10,soft:.05}}],
  armored_infantry_support:[{armor:{soft:.05}},{infantry:{breakthrough:.05}},{armor:{reliability:.05}},{armor:{supply:-.05}},{armor:{def:.10}}],
  streamlined_deployment:[{mobile:{orgFlat:5}},{mobile:{breakthrough:.05}},{armor:{orgFlat:2}},{all:{supply:-.05}},{armor:{breakthrough:.10}}],
  mobile_defense:[{mobile:{def:.05}},{armor:{def:.05}},{support:{def:.05}},{armor:{hard:.05}},{armor:{def:.10,hard:.05}}],
  armored_cavalry:[{armor:{speed:.05}},{mobile:{def:.05}},{armor:{speed:.05}},{mobile:{soft:.05}},{all:{supply:-.05}}],
  tank_destroyer_force:[{armor:{piercing:.10}},{support:{def:.05}},{armor:{speed:.05}},{armor:{hard:.10}},{armor:{piercing:.10,hard:.05}}],
  mission_type_tactics:[{all:{orgFlat:3}},{all:{breakthrough:.05}},{all:{orgFlat:3}},{all:{soft:.05}},{all:{def:.05}}],
  infiltration_tactics:[{infantry:{breakthrough:.05}},{global:{nightAttack:.10}},{all:{supply:-.05}},{infantry:{def:.05}},{infantry:{soft:.05,breakthrough:.05}}],
  grand_assault:[{global:{maxPlanning:.05}},{all:{breakthrough:.05}},{all:{soft:.05}},{global:{planningSpeed:.10}},{all:{breakthrough:.05}}],
  deep_battle:[{armor:{orgFlat:4}},{all:{supply:-.05}},{all:{breakthrough:.05}},{mobile:{orgFlat:4}},{all:{soft:.05}}],
  last_stand:[{all:{def:.05}},{all:{orgFlat:3}},{global:{entrenchment:.05}},{all:{supply:-.05}},{all:{def:.05}}],
  guerilla_war:[{infantry:{def:.05}},{all:{supply:-.05}},{infantry:{orgFlat:5}},{infantry:{soft:.05}},{infantry:{def:.05}}],
  peoples_war:[{infantry:{orgFlat:5}},{infantry:{def:.05}},{infantry:{soft:.05}},{all:{supply:-.05}},{infantry:{orgFlat:5}}],
  rapid_domination:[{support:{soft:.05}},{all:{breakthrough:.05}},{line_artillery:{soft:.05}},{all:{orgFlat:3}},{all:{soft:.05}}],
  expeditionary_warfare:[{all:{def:.03}},{all:{breakthrough:.03}},{support:{soft:.05}},{all:{supply:-.05}},{all:{orgFlat:3}}],
  dispersed_operations:[{all:{def:.03}},{all:{supply:-.05}},{anti_air:{airAttack:.10}},{all:{def:.03}},{all:{orgFlat:3}}]
};

export const DEFAULT_LAND_DOCTRINE={grand:'mobile_warfare',tracks:{
  infantry:{choice:'mobile_infantry',mastery:0},combat_support:{choice:'fire_concentration',mastery:0},armor:{choice:'armored_spearhead',mastery:0},operations:{choice:'mission_type_tactics',mastery:0}
}};

export function normalizeLandDoctrine(raw){
  const src=raw&&typeof raw==='object'?raw:{},out=clone(DEFAULT_LAND_DOCTRINE);
  if(GRAND_DOCTRINES[src.grand])out.grand=src.grand;
  for(const [track,meta] of Object.entries(LAND_DOCTRINE_TRACKS)){
    const t=src.tracks?.[track]||{},allowed=new Set(meta.choices.map(x=>x[0]));
    if(allowed.has(t.choice))out.tracks[track].choice=t.choice;
    out.tracks[track].mastery=Math.max(0,Math.min(5,Math.floor(Number(t.mastery??0))));
  }
  return out;
}

function mergeEffect(target,effect){
  if(!effect)return target;
  for(const [scope,vals] of Object.entries(effect)){
    if(!vals||typeof vals!=='object')continue;
    target[scope]=target[scope]||{};
    for(const [k,v] of Object.entries(vals))target[scope][k]=(target[scope][k]||0)+pct(v);
  }
  return target;
}

export function landDoctrineEffects(raw){
  const state=normalizeLandDoctrine(raw),grand=GRAND_DOCTRINES[state.grand],effects={global:{},all:{}};
  mergeEffect(effects,{global:grand.global, ...(grand.categories||{})});
  for(const [track,t] of Object.entries(state.tracks)){
    const rewards=R[t.choice]||[];
    for(let i=0;i<Math.min(t.mastery,rewards.length);i++)mergeEffect(effects,rewards[i]);
    if(t.mastery>=5)mergeEffect(effects,grand.milestones?.[track]);
  }
  return {state,effects};
}

function scopeMatches(id,unit,scope,isSupport=false){
  const group=unit?.group||'';
  if(scope==='all')return true;
  if(scope==='infantry')return ['infantry','cavalry'].includes(id);
  if(scope==='mobile')return ['motorized','mechanized','cavalry'].includes(id);
  if(scope==='cavalry')return id==='cavalry';
  if(scope==='armor')return group==='armor'||id.includes('armor');
  if(scope==='line_artillery')return !isSupport&&id==='artillery';
  if(scope==='support_artillery')return isSupport&&['support_artillery','regimental_infantry_guns'].includes(id);
  if(scope==='anti_tank')return ['anti_tank','support_at','regimental_at'].includes(id);
  if(scope==='anti_air')return ['anti_air','support_aa','regimental_aa'].includes(id);
  if(scope==='support')return isSupport;
  return false;
}

function applyUnitEffect(unit,vals){
  if(!unit||!vals)return;
  const percentMap={soft:'soft',hard:'hard',def:'def',breakthrough:'breakthrough',piercing:'piercing',speed:'speed',airAttack:'airAttack',hp:'hp'};
  for(const [k,dst] of Object.entries(percentMap))if(vals[k])unit[dst]=Math.max(0,(Number(unit[dst])||0)*(1+vals[k]));
  if(vals.orgFlat)unit.org=Math.max(0,(Number(unit.org)||0)+vals.orgFlat);
  if(vals.hpFlat)unit.hp=Math.max(0,(Number(unit.hp)||0)+vals.hpFlat);
  if(vals.supply)unit.supply=Math.max(0,(Number(unit.supply)||0)*(1+vals.supply));
}

export function applyLandDoctrineToData(battalions,supports,raw){
  const {state,effects}=landDoctrineEffects(raw),b=clone(battalions),s=clone(supports);
  for(const [id,u] of Object.entries(b)){
    applyUnitEffect(u,effects.all);
    for(const [scope,vals] of Object.entries(effects))if(!['global','all'].includes(scope)&&scopeMatches(id,u,scope,false))applyUnitEffect(u,vals);
  }
  for(const [id,u] of Object.entries(s)){
    applyUnitEffect(u,effects.all);
    for(const [scope,vals] of Object.entries(effects))if(!['global','all'].includes(scope)&&scopeMatches(id,u,scope,true))applyUnitEffect(u,vals);
  }
  return {battalions:b,supports:s,state,global:effects.global||{}};
}

export function doctrineSummary(raw){
  const s=normalizeLandDoctrine(raw),grand=GRAND_DOCTRINES[s.grand]?.name||s.grand;
  return `${grand} · ${Object.values(s.tracks).map(x=>x.mastery).join('/')}`;
}

export const AIR_DOCTRINE_TRACKS={
  fighter_aircraft:{name:'Fighter Aircraft',choices:[['escort_fighter','Medium-Range Escort'],['fighter_homeland_defense','Homeland Air Defense'],['fighter_bombers','Fighter-Bombers'],['tactical_flexibility','Airspace Dominance'],['dogfighting_mastery','Knights of the Air'],['fighter_central_field','Naval Aviation']]},
  strike_aircraft:{name:'Strike Aircraft',choices:[['flying_artillery','Flying Artillery'],['dive_bombers','Pinpoint Strikes'],['flexible_fire_support','Ground-Naval Coordination'],['carrier_strikes','Carrier Strikes'],['naval_strike_tactics','Precision Naval Bombing'],['naval_torpedo_tactics','Torpedo Swarm Tactics']]},
  medium_aircraft:{name:'Medium Aircraft',choices:[['bomber_interception','Heavy Interceptors'],['long_range_escort','Long-Range Escort'],['operational_air_support','Operational Air Support'],['tactical_battlefield_support','Tactical Battlefield Support'],['theater_interdiction','Theater Interdiction'],['aerial_reconnaissance','Aerial Reconnaissance']]},
  heavy_aircraft:{name:'Heavy Aircraft',choices:[['night_bombing','Night Strategic Bombing'],['carpet_bombing','Carpet Bombing'],['deep_air_raids','Deep Air Raids'],['flying_fortresses','Flying Fortresses'],['coastal_air_patrol','Coastal Air Patrol'],['open_ocean_air_patrol','Open Ocean Air Patrol'],['heavy_aircraft_focus','Heavy Aircraft Focus']]}
};
export const AIR_GRAND_DOCTRINES={
  strategic_destruction:{name:'Strategic Destruction',mission:{},milestones:{fighter_aircraft:{variant:{agility:.10},mission:{air_superiority:.20}},strike_aircraft:{mission:{naval_strike:.15}},medium_aircraft:{variant:{agility:.10,airDefense:.10}},heavy_aircraft:{variant:{airDefense:.25}}}},
  battlefield_support:{name:'Battlefield Support',mission:{cas:.20},detection:.15,milestones:{fighter_aircraft:{mission:{air_superiority:.15}},strike_aircraft:{variant:{agility:.20},mission:{cas:.20}},medium_aircraft:{variant:{groundAttack:.10}},heavy_aircraft:{detection:.10}}},
  operational_integrity:{name:'Operational Integrity',mission:{air_superiority:.10},detection:.20,milestones:{fighter_aircraft:{variant:{agility:.10}},strike_aircraft:{mission:{air_superiority:.10}},medium_aircraft:{variant:{agility:.10,groundAttack:.10}},heavy_aircraft:{variant:{airDefense:.15}}}}
};
export const DEFAULT_AIR_DOCTRINE={grand:'operational_integrity',tracks:{fighter_aircraft:{choice:'tactical_flexibility',mastery:0},strike_aircraft:{choice:'flying_artillery',mastery:0},medium_aircraft:{choice:'bomber_interception',mastery:0},heavy_aircraft:{choice:'flying_fortresses',mastery:0}}};
const AIR_REWARDS={
  escort_fighter:[{range:.03},{reliability:.02},{range:.04},{missionEfficiency:.03},{airAttack:.03}],
  fighter_homeland_defense:[{airDefense:.03},{detection:.04},{reliability:.02},{airAttack:.03},{missionEfficiency:.04}],
  fighter_bombers:[{groundAttack:.05},{missionEfficiency:.03},{reliability:.02},{groundAttack:.05},{airAttack:.03}],
  tactical_flexibility:[{agility:.03},{airAttack:.03},{reliability:.02},{maxSpeed:.03},{agility:.05}],
  dogfighting_mastery:[{agility:.03},{missionEfficiency:.03},{airAttack:.03},{reliability:.03},{agility:.04}],
  fighter_central_field:[{airDefense:.03},{agility:.03},{airAttack:.03},{detection:.03},{missionEfficiency:.03}],
  flying_artillery:[{groundAttack:.05},{missionEfficiency:.03},{groundAttack:.05},{reliability:.03},{groundAttack:.05}],
  dive_bombers:[{groundAttack:.06},{airDefense:.03},{missionEfficiency:.03},{reliability:.03},{groundAttack:.05}],
  flexible_fire_support:[{groundAttack:.04,navalAttack:.04},{airDefense:.03},{missionEfficiency:.03},{reliability:.03},{groundAttack:.04,navalAttack:.04}],
  carrier_strikes:[{navalAttack:.05},{airDefense:.03},{navalAttack:.05},{missionEfficiency:.03},{navalAttack:.05}],
  naval_strike_tactics:[{navalAttack:.06},{airDefense:.03},{missionEfficiency:.03},{reliability:.03},{navalAttack:.06}],
  naval_torpedo_tactics:[{navalAttack:.07},{missionEfficiency:.03},{range:.03},{reliability:.03},{navalAttack:.06}],
  bomber_interception:[{airAttack:.04},{airDefense:.04},{agility:.03},{missionEfficiency:.03},{airAttack:.05}],
  long_range_escort:[{range:.05},{airAttack:.03},{reliability:.03},{range:.05},{airDefense:.04}],
  operational_air_support:[{groundAttack:.04},{missionEfficiency:.04},{range:.03},{reliability:.03},{groundAttack:.05}],
  tactical_battlefield_support:[{groundAttack:.05},{airDefense:.03},{missionEfficiency:.04},{agility:.03},{groundAttack:.05}],
  theater_interdiction:[{range:.04},{groundAttack:.04},{missionEfficiency:.03},{airAttack:.03},{groundAttack:.05}],
  aerial_reconnaissance:[{range:.04},{detection:.05},{reliability:.03},{missionEfficiency:.04},{detection:.05}],
  night_bombing:[{airDefense:.03},{reliability:.03},{missionEfficiency:.03},{range:.03},{airDefense:.04}],
  carpet_bombing:[{groundAttack:.05},{missionEfficiency:.03},{groundAttack:.05},{airDefense:.03},{groundAttack:.05}],
  deep_air_raids:[{range:.05},{airDefense:.03},{range:.05},{reliability:.03},{missionEfficiency:.04}],
  flying_fortresses:[{airDefense:.05},{airAttack:.03},{airDefense:.05},{reliability:.03},{airDefense:.05}],
  coastal_air_patrol:[{navalAttack:.04},{detection:.04},{range:.03},{reliability:.03},{navalAttack:.05}],
  open_ocean_air_patrol:[{range:.06},{detection:.04},{navalAttack:.04},{reliability:.03},{range:.05}],
  heavy_aircraft_focus:[{airDefense:.04},{range:.04},{groundAttack:.03},{reliability:.03},{airAttack:.04}]
};
export function normalizeAirDoctrine(raw){const src=raw&&typeof raw==='object'?raw:{},out=clone(DEFAULT_AIR_DOCTRINE);if(AIR_GRAND_DOCTRINES[src.grand])out.grand=src.grand;for(const [track,meta] of Object.entries(AIR_DOCTRINE_TRACKS)){const t=src.tracks?.[track]||{},allowed=new Set(meta.choices.map(x=>x[0]));if(allowed.has(t.choice))out.tracks[track].choice=t.choice;out.tracks[track].mastery=Math.max(0,Math.min(5,Math.floor(Number(t.mastery??0))));}return out;}
function addFlatBonus(target,src){for(const [k,v] of Object.entries(src||{}))target[k]=(target[k]||0)+(Number(v)||0);return target;}
export function airDoctrineEffects(raw,design){
  const state=normalizeAirDoctrine(raw),grand=AIR_GRAND_DOCTRINES[state.grand],variant={},mission={...(grand.mission||{})};let detection=grand.detection||0;
  const relevant=[];if(design?.size==='medium')relevant.push('medium_aircraft');else relevant.push('fighter_aircraft');if(design?.roles?.some(x=>['cas','naval_bomber'].includes(x)))relevant.push('strike_aircraft');
  for(const track of relevant){const t=state.tracks[track],rewards=AIR_REWARDS[t.choice]||[];for(let i=0;i<Math.min(t.mastery,rewards.length);i++){const r=rewards[i];for(const [k,v] of Object.entries(r)){if(k==='missionEfficiency')mission.air_superiority=(mission.air_superiority||0)+v;else if(k==='detection')detection+=v;else variant[k]=(variant[k]||0)+v;}}if(t.mastery>=5){const m=grand.milestones?.[track]||{};addFlatBonus(variant,m.variant);for(const [k,v] of Object.entries(m.mission||{}))mission[k]=(mission[k]||0)+v;detection+=m.detection||0;}}
  return {state,variant,mission,detection};
}
export function applyAirDoctrineToVariant(design,raw){const fx=airDoctrineEffects(raw,design),out=clone(design);for(const [k,v] of Object.entries(fx.variant)){if(Number.isFinite(Number(out[k])))out[k]=Math.max(0,Number(out[k])*(1+v));}return {...out,doctrineEffects:fx};}

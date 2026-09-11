import { MODEL_META, RESOURCES, COMBAT_CONSTANTS, PRODUCTION_CONSTANTS, equipment, battalions, supports, terrain, rolePresets } from './data.js';
import { fmt, optimizeForceProduction, divisionEquipmentIC, calcDivision, aggregateDivision, simulateBattle, compareTerrains, uncertaintyBand, scoreDivision, clamp } from './engine.js';
import { safeStructuralOverrides, defineOverrides, equipmentSnapshot } from './parser.js';
import { buildExtendedDataPack } from './gameDataParser.js';
import { hydrateGameData, importedRegimentalSupportIds, prerequisiteText } from './gameData.js';
import { LAND_DOCTRINE_TRACKS, GRAND_DOCTRINES, AIR_DOCTRINE_TRACKS, AIR_GRAND_DOCTRINES, normalizeLandDoctrine, normalizeAirDoctrine, doctrineSummary, applyAirDoctrineToVariant, airDoctrineEffects } from './doctrine.js';
import { DEFAULT_MIO_SELECTION, normalizeMioSelection, mioCatalog, mioAvailable, mioEffects, traitSelectable, applyMioEquipmentBonus, applyMioToVariant, applyMioToEquipmentRecord } from './mio.js';
import { DESIGNER_COLS, DESIGNER_ROWS, blankGrid, normalizeGrid, countsToGrid, gridToCounts, filledInRegiment, fillRegiment, regimentGroup as gridRegimentGroup, canPlaceBattalion } from './designer.js';
import { DEFAULT_TECH_PROFILE, INFANTRY_EQUIPMENT_LEVELS, WEAPON_TIER_LEVELS, normalizeTechProfile, buildTechAdjustedData, techAvailable, techIssues } from './tech.js';
import { TANK_CHASSIS, TANK_GUNS, TANK_TURRETS, TANK_SUSPENSIONS, TANK_ARMOR_TYPES, TANK_ENGINES, TANK_SPECIALS, TANK_SLOT_MODULES, TANK_FAMILIES, TANK_ROLE_LABELS, defaultTankDesign, normalizeTankDesign, buildTankDesign, applyTankDesignToBattalion, tankEquipmentRecord, configureTankDataPack, tankDataStatus, tankDesignOptions, tankRolesForFamily, tankVariantTargets, tankMioFamily, tankFamilyLabel } from './tank.js';
import { AIRFRAMES, AIR_ENGINES, AIR_WEAPONS, AIR_DEFENSE_MODULES, AIR_SPECIALS, AIR_SLOT_MODULES, defaultAirDesign, normalizeAirDesign, buildAirDesign, compareAirDesigns, compareBuiltAirDesigns, airMissionEfficiency, airMissionEfficiencyBuilt, configureAirDataPack, airDataStatus, airDesignOptions, airSlotLabel } from './air.js';
import BUILTIN_1192 from './builtin1192.js';
import { renderGauntlet } from './gauntlet-ui.js';

const STORAGE='hoi4-war-planner-v7',LEGACY_STORAGE='hoi4-war-planner-v6';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const panel=(title,body,extra='')=>`<section class="panel ${extra}"><div class="panel-head"><h2>${title}</h2></div>${body}</section>`;
const pct=n=>`${fmt(n,1)}%`;
const badge=(text,tone='')=>`<span class="badge ${tone}">${text}</span>`;
const readinessMeter=(label,value,detail='',tone='')=>{const v=clamp(Number(value)||0,0,100);return `<div class="readiness-meter ${tone}"><div class="meter-copy"><span>${esc(label)}</span><b>${fmt(v,0)}%</b></div><div class="meter-track"><i style="width:${v}%"></i></div>${detail?`<small>${esc(detail)}</small>`:''}</div>`;};
const defaults={
  schema:7,country:'Germany',operation:'Operation Iron Compass',objective:'Prepare an offensive that can survive the worst plausible enemy case.',
  attacker:[{type:'infantry',count:9},{type:'artillery',count:1}],attackerSupports:['engineer','support_artillery','support_aa'],attackerDivisions:3,attackerName:'Assault Division',
  defender:[{type:'infantry',count:10}],defenderSupports:['engineer','support_artillery'],defenderDivisions:3,defenderName:'Defensive Division',
  attackerRegimentalSupports:[null,null,null,null,null],defenderRegimentalSupports:[null,null,null,null,null],
  battlefield:{terrain:'plains',directions:0,entrench:20,fort:0,river:0,asupply:1,dsupply:1,air:0,cas:0,planning:COMBAT_CONSTANTS.basePlanningMax,night:0,runs:500,seed:1944},
  intelUncertainty:.20,role:'assault',lastBattle:null,dataPack:null,dataSnapshotYear:1940,
  includeLabDemand:true,labDemandCount:24,armyDemand:[],
  production:{days:180,factories:30,efficiency:10,efficiencyGain:100,maxEfficiency:50,outputBonus:0,energySatisfaction:100,resources:{steel:60,aluminum:20,rubber:20,tungsten:15,chromium:5}},
  productionGoals:[
    {type:'infantry_equipment',stock:5000,target:25000,factories:12,priority:5},
    {type:'artillery',stock:300,target:2200,factories:6,priority:4},
    {type:'support_equipment',stock:500,target:2500,factories:4,priority:4},
    {type:'fighter',stock:100,target:700,factories:8,priority:3}
  ],
  tankDesigns:{attacker:{light:defaultTankDesign('light'),medium:defaultTankDesign('medium'),heavy:defaultTankDesign('heavy')},defender:{light:defaultTankDesign('light'),medium:defaultTankDesign('medium'),heavy:defaultTankDesign('heavy')}},
  tankVariants:null,
  tankDesigner:{side:'attacker',class:'medium',role:'armor'},
  airLab:{a:defaultAirDesign('small'),b:{...defaultAirDesign('small'),name:'Enemy Fighter',engine:'engine_3',weapons:['cannon_1','heavy_mg','none']},countA:100,countB:100,sorties:1000,mission:'air_superiority',missionEfficiencyA:1,missionEfficiencyB:1,detectionA:1,detectionB:1},
  attackerTech:{...structuredClone(DEFAULT_TECH_PROFILE),countryTag:'GER'},
  defenderTech:{...structuredClone(DEFAULT_TECH_PROFILE),countryTag:'SOV'},
  mioSelections:{attacker:{},defender:{}}
};

function deepMerge(base,raw){
  if(Array.isArray(base)) return Array.isArray(raw)?raw:structuredClone(base);
  if(base&&typeof base==='object'){
    const out={...base};
    if(raw&&typeof raw==='object') for(const k of Object.keys(raw)) out[k]=k in base?deepMerge(base[k],raw[k]):raw[k];
    return out;
  }
  return raw===undefined?base:raw;
}
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE)||localStorage.getItem(LEGACY_STORAGE)||'null'),next=deepMerge(defaults,raw);
    if(raw?.production?.energySatisfaction===undefined&&raw?.production?.baseFactoryOutput!==undefined){
      const span=PRODUCTION_CONSTANTS.poweredFactoryOutput-PRODUCTION_CONSTANTS.baseFactoryOutput,legacy=Number(raw.production.baseFactoryOutput);
      if(Number.isFinite(legacy)&&span>0)next.production.energySatisfaction=clamp((legacy-PRODUCTION_CONSTANTS.baseFactoryOutput)/span*100,0,100);
    }
    delete next.production.baseFactoryOutput;next.schema=7;return next;
  }catch{return structuredClone(defaults);}
}
let state=load();
if(!state.dataPack)state.dataPack=BUILTIN_1192;
const LEGACY_REGIMENTAL_SUPPORTS=['regimental_infantry_guns','regimental_at','regimental_aa'];
const runtimeGameDataStatus=state.dataPack?hydrateGameData(state.dataPack,{battalions,supports,equipment,terrain},{year:state.dataSnapshotYear}):{equipment:0,battalions:0,supports:0,regimentalSupports:0,terrain:0};
const runtimeTankDataStatus=state.dataPack?configureTankDataPack(state.dataPack,state.dataSnapshotYear):{active:false};
const runtimeAirDataStatus=state.dataPack?configureAirDataPack(state.dataPack,state.dataSnapshotYear):{active:false};
const importedRegimentalSupports=state.dataPack?importedRegimentalSupportIds(supports):[];
const BASE_REGIMENTAL_SUPPORTS=importedRegimentalSupports.length?importedRegimentalSupports:LEGACY_REGIMENTAL_SUPPORTS;
const BASE_DIVISIONAL_SUPPORTS=Object.keys(supports).filter(k=>!BASE_REGIMENTAL_SUPPORTS.includes(k)&&!(state.dataPack&&LEGACY_REGIMENTAL_SUPPORTS.includes(k)));
const LEGACY_REGIMENTAL_MAP={support_artillery:'regimental_infantry_guns',support_at:'regimental_at',support_aa:'regimental_aa'};
function ensureDesignerState(side){
  const key=side+'Grid';
  if(!Array.isArray(state[key]))state[key]=countsToGrid(state[side],Object.keys(battalions));
  else state[key]=normalizeGrid(state[key],Object.keys(battalions));
  state[side]=gridToCounts(state[key],Object.keys(battalions));
  state[side+'Supports']=(Array.isArray(state[side+'Supports'])?state[side+'Supports']:[]).filter(x=>supports[x]).slice(0,5);
  const regKey=side+'RegimentalSupports';
  state[regKey]=Array.isArray(state[regKey])?Array.from({length:DESIGNER_COLS},(_,i)=>{
    const raw=state[regKey][i],mapped=LEGACY_REGIMENTAL_MAP[raw]||raw;
    return BASE_REGIMENTAL_SUPPORTS.includes(mapped)?mapped:null;
  }):Array(DESIGNER_COLS).fill(null);
}
function ensureTechState(side){state[side+'Tech']=normalizeTechProfile(state[side+'Tech']);return state[side+'Tech'];}
function ensureTankState(){
  if(!state.tankDesigns||typeof state.tankDesigns!=='object')state.tankDesigns=structuredClone(defaults.tankDesigns);
  if(!state.tankVariants||typeof state.tankVariants!=='object')state.tankVariants={attacker:{},defender:{}};
  for(const side of ['attacker','defender']){
    state.tankDesigns[side]=state.tankDesigns[side]||{};state.tankVariants[side]=state.tankVariants[side]||{};
    for(const family of TANK_FAMILIES){
      state.tankVariants[side][family]=state.tankVariants[side][family]||{};
      for(const role of tankRolesForFamily(family)){
        const legacy=role==='armor'&&['light','medium','heavy'].includes(family)?state.tankDesigns[side][family]:null;
        const raw=state.tankVariants[side][family][role]||legacy||defaultTankDesign(family,role);
        state.tankVariants[side][family][role]=normalizeTankDesign({...raw,class:family,role},family,role);
      }
      if(['light','medium','heavy'].includes(family))state.tankDesigns[side][family]=structuredClone(state.tankVariants[side][family].armor);
    }
  }
  const family=TANK_FAMILIES.includes(state.tankDesigner?.class)?state.tankDesigner.class:'medium',roles=tankRolesForFamily(family),role=roles.includes(state.tankDesigner?.role)?state.tankDesigner.role:roles[0];
  state.tankDesigner={side:['attacker','defender'].includes(state.tankDesigner?.side)?state.tankDesigner.side:'attacker',class:family,role};
}
function tankDesignFor(side,family,role='armor'){ensureTankState();return state.tankVariants[side][family][role]||state.tankVariants[side][family][tankRolesForFamily(family)[0]];}
function ensureAirState(){
  state.airLab=state.airLab&&typeof state.airLab==='object'?state.airLab:{};state.airLab.a=normalizeAirDesign(state.airLab.a,'small');state.airLab.b=normalizeAirDesign(state.airLab.b,'small');
  for(const k of ['countA','countB','sorties'])state.airLab[k]=Math.max(1,Number(state.airLab[k])||defaults.airLab[k]);
  for(const k of ['missionEfficiencyA','missionEfficiencyB','detectionA','detectionB'])state.airLab[k]=clamp(Number(state.airLab[k]??1),.1,1.25);
  if(!['air_superiority','cas','naval_strike'].includes(state.airLab.mission))state.airLab.mission='air_superiority';
}
const MIO_FAMILIES={infantry_equipment:'Infantry Equipment',artillery:'Artillery',anti_tank:'Anti-Tank',anti_air:'Anti-Air',light_tank:'Light Tanks',medium_tank:'Medium Tanks',heavy_tank:'Heavy Tanks',small_airframe:'Small Aircraft',medium_airframe:'Medium Aircraft',large_airframe:'Large Aircraft'};
function ensureMioState(){
  state.mioSelections=state.mioSelections&&typeof state.mioSelections==='object'?state.mioSelections:{attacker:{},defender:{}};
  for(const side of ['attacker','defender']){state.mioSelections[side]=state.mioSelections[side]||{};for(const family of Object.keys(MIO_FAMILIES))state.mioSelections[side][family]=normalizeMioSelection(state.mioSelections[side][family]||DEFAULT_MIO_SELECTION);}
}
function currentMioCatalog(){return mioCatalog(state.dataPack);}
function mioEffectFor(side,family){ensureMioState();return mioEffects(currentMioCatalog(),state.mioSelections[side][family]);}
function applyFamilyMioToData(data,side){
  const maps={infantry_equipment:{b:['infantry','motorized','mechanized','cavalry'],s:[]},artillery:{b:['artillery'],s:['support_artillery','regimental_infantry_guns']},anti_tank:{b:['anti_tank'],s:['support_at','regimental_at']},anti_air:{b:['anti_air'],s:['support_aa','regimental_aa']}};
  for(const [family,m] of Object.entries(maps)){const eff=mioEffectFor(side,family);for(const id of m.b)if(data.battalions[id])data.battalions[id]=applyMioEquipmentBonus(data.battalions[id],eff.equipmentBonus);for(const id of m.s)if(data.supports[id])data.supports[id]=applyMioEquipmentBonus(data.supports[id],eff.equipmentBonus);}
  for(const family of ['light','medium','heavy']){const mio=tankMioFamily(family),eff=mioEffectFor(side,mio);for(const role of tankRolesForFamily(family)){const target=tankVariantTargets(family,role);for(const u of target?.units||[]){const map=u.kind==='support'?data.supports:data.battalions;if(map[u.id])map[u.id]=applyMioEquipmentBonus(map[u.id],eff.equipmentBonus);}}}
  return data;
}
function adjustedTankDesign(side,family,role='armor'){const base=buildTankDesign(tankDesignFor(side,family,role)),mio=tankMioFamily(family);return mio?applyMioToVariant(base,mioEffectFor(side,mio)):base;}
function adjustedAirDesign(side,raw){const base=buildAirDesign(raw),family=base.size==='large'?'large_airframe':base.size==='medium'?'medium_airframe':'small_airframe',withMio=applyMioToVariant(base,mioEffectFor(side,family));return applyAirDoctrineToVariant(withMio,ensureTechState(side).airDoctrine,state.dataPack);}
function equipmentForSide(side='attacker'){
  ensureTankState();ensureMioState();const out=structuredClone(equipment);
  for(const family of ['infantry_equipment','artillery','anti_tank','anti_air'])if(out[family])out[family]=applyMioToEquipmentRecord(out[family],mioEffectFor(side,family));
  for(const family of TANK_FAMILIES)for(const role of tankRolesForFamily(family)){
    const target=tankVariantTargets(family,role),raw=tankDesignFor(side,family,role),base=buildTankDesign(raw),mio=tankMioFamily(family),eff=mio?mioEffectFor(side,mio):null,design=mio?applyMioToVariant(base,eff):base;
    for(const key of [target?.equipmentKey,...(target?.aliases||[])].filter(Boolean))if(out[key]){out[key]=mio?applyMioToEquipmentRecord(tankEquipmentRecord(out[key],raw),eff):tankEquipmentRecord(out[key],raw);out[key].designStats=design;}
  }
  return out;
}
function validRegimentalSupports(side){ensureDesignerState(side);return state[side+'RegimentalSupports'].filter((key,c)=>key&&filledInRegiment(state[side+'Grid'],c)>=3&&regimentalBaselineCompatible(side,c,key));}
function syncDesignerSide(side){ensureDesignerState(side);state[side]=gridToCounts(state[side+'Grid'],Object.keys(battalions));}
function techData(side){
  const data=buildTechAdjustedData(battalions,supports,ensureTechState(side),{pack:state.dataPack,year:state.dataSnapshotYear});ensureTankState();ensureMioState();
  for(const family of TANK_FAMILIES)for(const role of tankRolesForFamily(family)){const target=tankVariantTargets(family,role),raw=tankDesignFor(side,family,role);for(const u of target?.units||[]){const map=u.kind==='support'?data.supports:data.battalions;if(map[u.id])map[u.id]=applyTankDesignToBattalion(map[u.id],raw);}}
  return applyFamilyMioToData(data,side);
}
function techProblems(side){ensureDesignerState(side);return techIssues(state[side+'Grid'],state[side+'Supports'],state[side+'RegimentalSupports'],ensureTechState(side));}
ensureDesignerState('attacker');ensureDesignerState('defender');ensureTechState('attacker');ensureTechState('defender');ensureTankState();ensureAirState();ensureMioState();
let activeDesignerSide='attacker',activeLabPanel='template',designerPick=null;
let dataPackStatus={...runtimeGameDataStatus,tank:runtimeTankDataStatus,air:runtimeAirDataStatus,battalionOverrides:0,supportOverrides:0,terrainOverrides:0,combatCount:0,productionCount:0};
function applyCurrentDataPack(){
  if(!state.dataPack)return dataPackStatus;
  dataPackStatus={...runtimeGameDataStatus,tank:tankDataStatus(),air:airDataStatus(),...safeStructuralOverrides(state.dataPack,battalions,supports,terrain),...defineOverrides(state.dataPack,COMBAT_CONSTANTS,PRODUCTION_CONSTANTS)};
  return dataPackStatus;
}
applyCurrentDataPack();
let saveFailureShown=false;
function serializableState(){return {...state,dataPack:state.dataPack?.meta?.bundled?null:state.dataPack};}
function save(){
  try{localStorage.setItem(STORAGE,JSON.stringify(serializableState()));saveFailureShown=false;return true;}
  catch(err){console.error('Unable to save planner state locally.',err);if(!saveFailureShown){saveFailureShown=true;alert('Local save failed. Your current session is still open; export the scenario JSON before leaving this page.');}return false;}
}
function route(){const r=location.hash.replace('#','');return ['dashboard','battle','gauntlet','tank','air','production','front','intel','data','scenario'].includes(r)?r:'battle';}
function downloadJSON(name,obj){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function readJSON(file,cb){
  if(!file||file.size>25*1024*1024){alert('JSON file is too large to import safely. Maximum size is 25 MB.');return;}
  const r=new FileReader();r.onerror=()=>alert('Could not read that JSON file.');r.onload=()=>{try{cb(JSON.parse(r.result));}catch{alert('Invalid JSON file.');}};r.readAsText(file);
}

function division(side){ensureDesignerState(side);const data=techData(side),line=gridToCounts(state[side+'Grid'],Object.keys(battalions));return calcDivision(line,data.battalions,[...state[side+'Supports'],...validRegimentalSupports(side)],data.supports);}
function aggregate(side){return aggregateDivision(division(side),state[side+'Divisions']);}
function battleOpts(){const ag=techData('attacker').doctrineGlobal||{},dg=techData('defender').doctrineGlobal||{},airDoctrine=airDoctrineEffects(ensureTechState('attacker').airDoctrine,null,state.dataPack);return {...state.battlefield,entrench:(Number(state.battlefield.entrench)||0)*(1+(dg.entrenchment||0)),attackerNightAttackBonus:ag.nightAttack||0,defenderNightAttackBonus:dg.nightAttack||0,attackerGroundSupportBonus:airDoctrine.groundSupport||0,terrainData:terrain};}
function replacementIC(losses,side='attacker'){const eq=equipmentForSide(side);return Object.entries(losses||{}).reduce((sum,[k,q])=>sum+(eq[k]?.cost||0)*(+q||0),0);}
function equipmentLossList(losses,side='attacker'){const eq=equipmentForSide(side),rows=Object.entries(losses||{}).filter(([,q])=>q>0.05).sort((a,b)=>b[1]-a[1]);return rows.length?rows.map(([k,q])=>`<span><b>${eq[k]?.name||k}</b> ${fmt(q,0)}</span>`).join(''):'<span>No material loss estimate available.</span>';}
function applyLastBattleReplacement(){if(!state.lastBattle||state.lastBattle.applied)return;for(const [type,q] of Object.entries(state.lastBattle.attackerEquipmentLosses||{})){if(q<=0)continue;let g=state.productionGoals.find(x=>x.type===type);if(!g){g={type,stock:0,target:0,factories:0,priority:3};state.productionGoals.push(g);}g.target=Math.max(+g.target||0,+g.stock||0)+Math.ceil(q);}state.lastBattle.applied=true;save();shell();}
function forceProductionPlan(){return optimizeForceProduction(division('attacker').need||{},productionStockMap(),state.production,equipmentForSide('attacker'));}
function productionReadiness(){
  const plan=forceProductionPlan(),target=Math.max(1,Math.floor(+state.labDemandCount||1));
  return Math.round(clamp((plan.fieldable/target)*100,0,100));
}
function combatBand(){return uncertaintyBand(aggregate('attacker'),aggregate('defender'),battleOpts(),state.intelUncertainty,Math.min(350,state.battlefield.runs));}
function battleFingerprint(){
  ensureDesignerState('attacker');ensureDesignerState('defender');
  return JSON.stringify({a:state.attackerGrid,as:state.attackerSupports,ar:state.attackerRegimentalSupports,an:state.attackerDivisions,at:state.attackerTech,tanks:state.tankDesigns,d:state.defenderGrid,ds:state.defenderSupports,dr:state.defenderRegimentalSupports,dn:state.defenderDivisions,dt:state.defenderTech,mio:state.mioSelections,b:state.battlefield});
}
function lastBattlePreview(){
  const r=state.lastBattle;if(!r)return '<p>Execute the simulation to generate an outcome report.</p>';
  const stale=!r.fingerprint||r.fingerprint!==battleFingerprint();
  return `<div class="saved-battle ${stale?'stale':'current'}"><div><span class="eyebrow">${stale?'STALE RESULT · INPUTS CHANGED':'CURRENT RESULT'}</span><h3>${pct(r.winRate)} attacker win probability</h3><p>${fmt(r.avgHours,0)} h expected · ${pct(r.attackerCasualtyRate)} attacker strength loss · seed ${r.seed??'random'}</p></div><span class="battle-state">${stale?'RERUN REQUIRED':'UP TO DATE'}</span></div>`;
}

function shell(){
  const nav=[['battle','DIV','Division Lab'],['gauntlet','GNT','Division Gauntlet'],['tank','TNK','Tank Designer'],['air','AIR','Air Lab'],['production','MIC','Industry'],['data','DAT','Data Packs'],['scenario','CFG','Scenario']];
  const active=route();
  document.title=`${state.operation} · HOI4 War Planner`;
  $('app').innerHTML=`<div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#battle"><span class="brand-mark">★</span><span><b>GENERAL STAFF</b><small>HOI4 War Planner</small></span></a>
      <nav>${nav.map(([r,code,n])=>`<a href="#${r}" class="${active===r?'active':''}"><span class="nav-code">${code}</span><span>${n}</span></a>`).join('')}</nav>
      <div class="side-meta"><span>${MODEL_META.gameVersion}</span><small>${MODEL_META.appVersion}</small></div>
    </aside>
    <main><header class="topbar"><div><span class="kicker">${esc(state.country)}</span><b>${esc(state.operation)}</b></div><div class="top-actions">${badge(`Game ${MODEL_META.gameVersion}`,'good')}${badge('Public-data baseline')}</div></header><div id="view" class="view"></div></main>
  </div>`;
  render(active);
}
function render(r){const v=$('view');({dashboard,battle,gauntlet,tank,air,production,front,intel,data,scenario}[r]||battle)(v);}
function gauntlet(c){renderGauntlet(c,{name:side=>state[side+'Name'],stats:side=>division(side),data:side=>techData(side),equipment:side=>equipmentForSide(side),battleOpts:()=>battleOpts()});}

function dashboard(c){
  const eqA=equipmentForSide('attacker'),band=combatBand(),forcePlan=forceProductionPlan(),industry=productionReadiness(),ready=Math.round(industry*.65+clamp(band.adverse.winRate,0,100)*.35);
  const a=division('attacker'),d=division('defender'),supply=clamp(state.battlefield.asupply*100,0,100),airScore=clamp((state.battlefield.air+1)*50,0,100);
  const posture=ready>=75?['FINAL PREPARATION','go']:ready>=55?['BUILD COMBAT MARGIN','warn']:['HOLD OPERATION','stop'];
  const battleState=state.lastBattle?(!state.lastBattle.fingerprint||state.lastBattle.fingerprint!==battleFingerprint()?'STALE':'CURRENT'):'NO REPORT';
  c.innerHTML=`<section class="command-hero"><div class="command-title"><p class="eyebrow">GENERAL STAFF · THEATRE COMMAND</p><h1>${esc(state.operation)}</h1><p>${esc(state.objective)}</p><div class="command-tags">${badge(esc(state.country))}${badge(`HOI4 ${MODEL_META.gameVersion}`,'good')}${badge(state.dataPack?'Imported data':'Public baseline',state.dataPack?'good':'')}</div></div><div class="command-readiness ${posture[1]}"><small>OPERATION READINESS</small><strong>${ready}</strong><span>${posture[0]}</span></div></section>
  <section class="war-room-strip">${readinessMeter('Adverse combat',band.adverse.winRate,'enemy stronger',band.adverse.winRate>=60?'good':band.adverse.winRate>=45?'warn':'stop')}${readinessMeter('Industry',industry,'equipment goals',industry>=80?'good':industry>=60?'warn':'stop')}${readinessMeter('Supply',supply,'attacking force',supply>=80?'good':supply>=60?'warn':'stop')}${readinessMeter('Air control',airScore,state.battlefield.air>0?'friendly advantage':state.battlefield.air<0?'enemy advantage':'contested',airScore>=60?'good':airScore>=40?'warn':'stop')}</section>
  <div class="war-room-grid">
    ${panel('Operation order',`<div class="hq-posture ${posture[1]}"><span>STAFF RECOMMENDATION</span><h2>${posture[0]}</h2><p>${ready>=75?'The modeled plan has enough adverse-case and industrial margin to enter final preparation.':ready>=55?'The operation is plausible but remains sensitive to combat or supply assumptions. Increase margin before execution.':'Current combat/industrial readiness does not justify commitment.'}</p><a class="btn" href="#front">Open Front Planner →</a></div>`,'hq-order-panel')}
    ${panel('Land forces',`<div class="hq-force"><div><span>ATTACKER</span><b>${esc(state.attackerName)}</b><small>${state.attackerDivisions} divisions · ${fmt(a.width,0)}w · ${fmt(a.org,0)} org</small></div><div><span>ENEMY ESTIMATE</span><b>${esc(state.defenderName)}</b><small>${state.defenderDivisions} divisions · ${fmt(d.width,0)}w · ${fmt(d.org,0)} org</small></div></div><div class="hq-stat-pair"><div><span>Base win</span><b>${pct(band.base.winRate)}</b></div><div><span>Adverse win</span><b>${pct(band.adverse.winRate)}</b></div><div><span>Attacker armor</span><b>${fmt(a.armor,1)}</b></div><div><span>Enemy piercing</span><b>${fmt(d.piercing,1)}</b></div></div><a class="btn" href="#battle">Open Division Lab →</a>`,'hq-forces-panel')}
    ${panel('Industrial command',`<div class="hq-industry"><div><small>FIELDABLE BY DEADLINE</small><strong>${fmt(forcePlan.fieldable,1)}</strong><span>target ${Math.max(1,+state.labDemandCount||1)} divisions</span></div><div><small>FORCE READINESS</small><strong>${industry}%</strong><span>${forcePlan.nextFactory?.type?`next MIC → ${esc(eqA[forcePlan.nextFactory.type]?.name||forcePlan.nextFactory.type)}`:'allocation complete'}</span></div></div><div class="resource-ledger">${RESOURCES.map(r=>`<span><b>${r.toUpperCase()}</b>${fmt(state.production.resources[r]||0,0)}</span>`).join('')}</div><a class="btn" href="#production">Open Industry Advisor →</a>`,'hq-industry-panel')}
    ${panel('Latest combat report',`<div class="hq-report ${battleState==='STALE'?'stale':''}"><span>${battleState}</span>${state.lastBattle?`<h3>${pct(state.lastBattle.winRate)} attacker win</h3><p>${fmt(state.lastBattle.avgHours,0)} h expected · ${pct(state.lastBattle.attackerCasualtyRate)} attacker strength loss · ${fmt(replacementIC(state.lastBattle.attackerEquipmentLosses),0)} IC replacement</p>`:'<h3>No simulation recorded</h3><p>Build the opposing templates and execute a battle to create an operational report.</p>'}</div><a class="btn" href="#battle">${state.lastBattle?'Review battle →':'Run simulation →'}</a>`,'hq-report-panel')}
  </div>
  <section class="staff-sections"><a href="#tank"><span>TNK</span><div><b>Tank Designer</b><small>Variants feed Division Lab and Industry</small></div></a><a href="#air"><span>AIR</span><div><b>Air Lab</b><small>Compare aircraft performance and IC exchange</small></div></a><a href="#battle"><span>R&D</span><div><b>Tech & Doctrine</b><small>Research assumptions now live inside Division Lab</small></div></a><a href="#intel"><span>INT</span><div><b>Intelligence</b><small>±${Math.round(state.intelUncertainty*100)}% enemy uncertainty</small></div></a><a href="#data"><span>DAT</span><div><b>Data Packs</b><small>${state.dataPack?.meta?.bundled?'Bundled vanilla 1.19.2 data active':'Custom imported game data active'}</small></div></a><a href="#scenario"><span>CFG</span><div><b>Scenario Control</b><small>Schema ${state.schema} · local persistence</small></div></a></section>
  <p class="model-footnote">${MODEL_META.confidence}. ${state.dataPack?.meta?.bundled?'Bundled 1.19.2 units, equipment, modules, doctrines and defines are active.':'Custom imported game data is active.'} Research, DLC and special-project prerequisites are informational only; executable-only behavior remains explicitly analytical.</p>`;
}

function statCard(s){const vals=[['Width',s.width,0],['Manpower',s.manpower,0],['Org',s.org,1],['HP',s.hp,1],['Soft attack',s.soft,1],['Hard attack',s.hard,1],['Defense',s.def,1],['Breakthrough',s.breakthrough,1],['Hardness',s.hardness*100,0,'%'],['Supply/day',s.supply,2],['Armor',s.armor,1],['Piercing',s.piercing,1],['Air attack',s.airAttack,1]];return `<div class="statgrid">${vals.map(([k,v,d,suf=''])=>`<div class="stat"><small>${k}</small><strong>${fmt(v,d)}${suf}</strong></div>`).join('')}</div>`;}

function widthPacking(stats){
  const w=Math.max(1,Number(stats.width)||1);
  return Object.entries(terrain).map(([key,t])=>{
    let best=null;
    for(let n=1;n<=8;n++){
      const total=w*n,delta=total-t.width,penalty=delta>0?Math.min(.33,delta/t.width):0;
      const effective=total*(1-penalty),score=Math.abs(effective-t.width);
      if(!best||score<best.score)best={n,total,delta,penalty,effective,score};
    }
    return {key,terrain:t,...best};
  });
}
function widthPackingTable(stats){
  return `<div class="table-wrap compact-table"><table><thead><tr><th>Terrain</th><th>Base width</th><th>Closest packing</th><th>Raw width</th><th>Modeled width penalty</th><th>+1 flank</th></tr></thead><tbody>${widthPacking(stats).map(x=>`<tr><td>${x.terrain.name}</td><td>${x.terrain.width}</td><td>${x.n} × ${fmt(stats.width,0)}</td><td>${fmt(x.total,0)} ${x.delta===0?'exact':x.delta>0?`(+${fmt(x.delta,0)})`:`(${fmt(x.delta,0)})`}</td><td>${pct(x.penalty*100)}</td><td>${x.terrain.width+x.terrain.reinforceWidth}</td></tr>`).join('')}</tbody></table></div>`;
}

const BATTALION_CODES={infantry:'INF',motorized:'MOT',mechanized:'MEC',artillery:'ART',anti_tank:'AT',anti_air:'AA',cavalry:'CAV',light_armor:'LARM',medium_armor:'MARM',heavy_armor:'HARM'};
const SUPPORT_CODES={engineer:'ENG',support_artillery:'ART',recon:'REC',support_at:'AT',support_aa:'AA',regimental_infantry_guns:'IG',regimental_at:'RAT',regimental_aa:'RAA',logistics:'LOG',signal:'SIG'};
function battalionTone(type){if(type.includes('armor'))return 'armor';if(['motorized','mechanized','cavalry'].includes(type))return 'mobile';if(type.includes('artillery')||type.includes('anti_tank')||type.includes('anti_air')||['support_at','support_aa'].includes(type))return 'fire';return 'infantry';}
function regimentGroup(side,c,ignoreRow=null){ensureDesignerState(side);return gridRegimentGroup(state[side+'Grid'],c,battalions,ignoreRow);}
function regimentalBaselineCompatible(side,c,key=null){const group=regimentGroup(side,c);if(!key)return !!group;const required=supports[key]?.regimentGroup;if(required)return required==='any'||required===group;if(LEGACY_REGIMENTAL_SUPPORTS.includes(key))return group==='infantry';return true;}
function templateIC(stats,side='attacker'){return replacementIC(stats.need||{},side);}
function designerStatGroups(s){
  const groups=[
    ['BASE',[['ORG','Organization',s.org,1],['HP','Hit Points',s.hp,1],['MAN','Manpower',s.manpower,0],['WIDTH','Combat Width',s.width,0],['SUP','Supply Use',s.supply,2]]],
    ['COMBAT',[['SA','Soft Attack',s.soft,1],['HA','Hard Attack',s.hard,1],['DEF','Defense',s.def,1],['BRK','Breakthrough',s.breakthrough,1],['AA','Air Attack',s.airAttack,1]]],
    ['ARMOR',[['ARM','Armor',s.armor,1],['PIER','Piercing',s.piercing,1],['HARD','Hardness',s.hardness*100,0,'%']]]
  ];
  return groups.map(([name,vals])=>`<section class="hoi-stat-section"><h4>${name}</h4>${vals.map(([short,label,v,d,suf=''])=>`<div title="${label}"><span>${short}</span><b>${fmt(v,d)}${suf}</b></div>`).join('')}</section>`).join('');
}
function designerMainStrip(s){
  const items=[['WIDTH','Combat Width',fmt(s.width,0)],['ORG','Organization',fmt(s.org,1)],['HP','Hit Points',fmt(s.hp,1)],['MAN','Manpower',fmt(s.manpower,0)],['SUP','Supply Use',fmt(s.supply,2)]];
  return `<div class="designer-main-stats">${items.map(([short,label,v])=>`<span title="${label}"><small>${short}</small><b>${v}</b></span>`).join('')}</div>`;
}
function equipmentSummary(stats,side='attacker'){
  const eq=equipmentForSide(side),rows=Object.entries(stats.need||{}).filter(([,q])=>q>0);
  return rows.length?rows.map(([k,q])=>`<span><b>${esc(eq[k]?.name||k)}</b><em>${fmt(q,0)}</em></span>`).join(''):'<span><b>No equipment</b><em>0</em></span>';
}
function designerCostBand(stats,side='attacker'){
  const eq=equipmentForSide(side),rows=Object.entries(stats.need||{}).filter(([,q])=>q>0),ic=templateIC(stats,side);
  return `<div class="designer-cost-band"><div><span class="eyebrow">EQUIPMENT REQUIREMENTS</span><div class="cost-chips">${rows.length?rows.slice(0,6).map(([k,q])=>`<span><b>${esc(eq[k]?.name||k)}</b>${fmt(q,0)}</span>`).join(''):'<span><b>No equipment</b>0</span>'}</div></div><div class="cost-total"><small>Estimated production cost</small><strong>${fmt(ic,0)} IC</strong></div></div>`;
}
function requirementInfo(record){const req=prerequisiteText(record);return req?`Requirements (informational only): ${req}`:'';}
function requirementBadge(record){const info=requirementInfo(record);return info?`<em class="req-info" title="${esc(info)}">ⓘ req</em>`:'';}
function pickerBattalionMeta(side,key){
  const u=techData(side).battalions[key];if(!u)return '';
  const ic=templateIC({need:u.need||{}},side);
  return `<span class="picker-meta"><em>${fmt(u.width,0)}w</em><em>${fmt(u.org,0)} org</em><em>${fmt(u.soft,0)} SA</em>${u.armor?`<em>${fmt(u.armor,0)} arm</em>`:''}${u.piercing?`<em>${fmt(u.piercing,0)} pierce</em>`:''}<em>${fmt(ic,0)} IC</em>${requirementBadge(u)}</span>`;
}
function pickerSupportMeta(side,key){
  const u=techData(side).supports[key];if(!u)return '';
  const ic=templateIC({need:u.need||{}},side);
  return `<span class="picker-meta"><em>${fmt(u.soft||0,0)} SA</em><em>${fmt(u.def||0,0)} DEF</em>${u.piercing?`<em>${fmt(u.piercing,0)} pierce</em>`:''}<em>${fmt(ic,0)} IC</em>${requirementBadge(u)}</span>`;
}
function supportSlot(side,i){
  const key=state[side+'Supports'][i];
  if(!key)return `<button class="hoi-support-slot empty" data-sslot="${i}" title="Add support company"><span>+</span><small>Support</small></button>`;
  const info=requirementInfo(supports[key]);
  return `<button class="hoi-support-slot filled tone-${battalionTone(key)} ${info?'prereq-info':''}" data-sslot="${i}" title="${esc(supports[key]?.name||key)}${info?' · '+esc(info):''}"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}${info?' · ⓘ':''}</small></button>`;
}
function regimentalSupportSlot(side,c,filled){
  const key=state[side+'RegimentalSupports'][c];
  if(filled<3)return `<button class="regimental-support locked" disabled title="Requires at least 3 line battalions in this regiment"><span>◆</span><small>Requires 3 battalions</small></button>`;
  if(!key)return `<button class="regimental-support available" data-rslot="${c}" title="Add regimental support"><span>+</span><small>Regimental support</small></button>`;
  const info=requirementInfo(supports[key]);
  return `<button class="regimental-support available filled tone-${battalionTone(key)} ${info?'prereq-info':''}" data-rslot="${c}" title="${esc(supports[key]?.name||key)}${info?' · '+esc(info):''}"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}${info?' · ⓘ':''}</small></button>`;
}
function regimentColumn(side,c){
  const grid=state[side+'Grid'],filled=filledInRegiment(grid,c);
  const group=regimentGroup(side,c);return `<div class="hoi-regiment"><div class="regiment-title"><span>REGIMENT ${c+1}${group?` · ${group.toUpperCase()}`:''}</span><b>${filled}/5</b></div><div class="regiment-slots">${grid[c].map((type,r)=>{if(!type)return `<button class="hoi-battalion-slot empty" data-bslot="1" data-c="${c}" data-r="${r}" title="Add battalion"><span>+</span><small>Add</small></button>`;const info=requirementInfo(battalions[type]);return `<button class="hoi-battalion-slot filled tone-${battalionTone(type)} ${info?'prereq-info':''}" data-bslot="1" data-c="${c}" data-r="${r}" title="${esc(battalions[type].name)}${info?' · '+esc(info):''}"><span class="unit-symbol">${BATTALION_CODES[type]||'BAT'}</span><small>${esc(battalions[type].name)}${info?' · ⓘ':''}</small></button>`;}).join('')}</div>${regimentalSupportSlot(side,c,filled)}</div>`;
}
function designerPicker(side){
  if(!designerPick||designerPick.side!==side)return '';
  const battalionGroups={
    'Infantry Battalions':['infantry','cavalry'],
    'Mobile Battalions':['motorized','mechanized'],
    'Artillery Battalions':['artillery','anti_tank','anti_air'],
    'Armored Battalions':['light_armor','medium_armor','heavy_armor']
  };
  if(designerPick.kind==='support'){
    const current=state[side+'Supports'][designerPick.i],used=new Set(state[side+'Supports'].filter(Boolean));
    return `<div class="hoi-picker"><div class="picker-head"><div><span class="eyebrow">MAKE A SELECTION</span><h3>Support Companies</h3></div><button class="btn" data-cancel-pick>Back</button></div><div class="picker-grid"><button class="picker-choice remove-choice" data-choice="">×<small>Empty slot</small></button>${BASE_DIVISIONAL_SUPPORTS.map(k=>[k,supports[k]]).map(([k,v])=>{const info=requirementInfo(v);return `<button class="picker-choice ${info?'prereq-info':''}" data-choice="${k}" ${used.has(k)&&k!==current?'disabled':''} title="${esc(info)}"><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(v.name)}${info?' · ⓘ':''}</small>${pickerSupportMeta(side,k)}</button>`;}).join('')}</div></div>`;
  }
  if(designerPick.kind==='regimental'){
    return `<div class="hoi-picker"><div class="picker-head"><div><span class="eyebrow">MAKE A SELECTION</span><h3>Regimental Support</h3><p class="muted">Bundled 1.19.2 support definitions are active. Structural regiment compatibility is enforced; research, DLC and Special Project requirements are informational only.</p></div><button class="btn" data-cancel-pick>Back</button></div><div class="picker-grid"><button class="picker-choice remove-choice" data-choice="">×<small>Empty slot</small></button>${BASE_REGIMENTAL_SUPPORTS.filter(k=>regimentalBaselineCompatible(side,designerPick.c,k)).map(k=>{const info=requirementInfo(supports[k]);return `<button class="picker-choice tone-fire ${info?'prereq-info':''}" data-choice="${k}" title="${esc(info)}"><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(supports[k]?.name||k)}${info?' · ⓘ':''}</small>${pickerSupportMeta(side,k)}</button>`;}).join('')}</div></div>`;
  }
  const lockedGroup=designerPick.fillRegiment?null:regimentGroup(side,designerPick.c,designerPick.r);
  return `<div class="hoi-picker"><div class="picker-head"><div><span class="eyebrow">MAKE A SELECTION</span><h3>Change or add battalion</h3><p class="muted">${lockedGroup?`Regiment locked to ${lockedGroup.toUpperCase()} group. `:''}Shift-click a choice to replace the full regiment.</p></div><button class="btn" data-cancel-pick>Back</button></div>${Object.entries(battalionGroups).map(([name,ids])=>{const allowed=ids.filter(k=>battalions[k]&&(!lockedGroup||battalions[k].group===lockedGroup));return allowed.length?`<section class="picker-group"><h4>${name}</h4><div class="picker-grid">${allowed.map(k=>{const info=requirementInfo(battalions[k]);return `<button class="picker-choice tone-${battalionTone(k)} ${info?'prereq-info':''}" data-choice="${k}" title="${esc(info)}"><b>${BATTALION_CODES[k]||'BAT'}</b><small>${esc(battalions[k].name)}${info?' · ⓘ':''}</small>${pickerBattalionMeta(side,k)}</button>`;}).join('')}</div></section>`:'';}).join('')}<button class="picker-choice remove-choice wide" data-choice="">× <small>Remove battalion</small></button></div>`;
}
function renderDivisionDesigner(side){
  ensureDesignerState(side);const stats=division(side),other=side==='attacker'?'defender':'attacker';
  return `<section class="hoi-designer panel ${side}">
    <div class="designer-topbar"><div class="division-ident"><span class="division-counter">${side==='attacker'?'A':'D'}</span><div><span class="eyebrow">${side.toUpperCase()} TEMPLATE</span><input class="template-name" id="designerName" value="${esc(state[side+'Name'])}" aria-label="Template name"></div></div><label class="compact-label">Committed divisions<input id="designerDivisions" type="number" min="1" max="30" value="${state[side+'Divisions']}"></label></div>
    <div class="hoi-designer-layout">
      <div class="regiment-board"><div class="board-label"><span>COMBAT BATTALIONS</span><small>5 regiments · 5 battalions each · Shift-click a slot to fill its regiment</small></div>${designerMainStrip(stats)}<div class="regiment-grid">${Array.from({length:5},(_,c)=>regimentColumn(side,c)).join('')}</div><div class="regimental-label"><span>REGIMENTAL SUPPORT</span><small>1.19 structure · requires 3 battalions in the regiment</small></div>${designerCostBand(stats,side)}</div>
      <aside class="support-rail"><div class="rail-title">DIVISION SUPPORT</div>${Array.from({length:5},(_,i)=>supportSlot(side,i)).join('')}</aside>
      <aside class="designer-stats"><div class="stats-title">DIVISION STATS</div>${designerStatGroups(stats)}<section class="hoi-stat-section equipment-cost"><h4>EQUIPMENT DETAIL</h4><div class="equipment-mini">${equipmentSummary(stats,side)}</div></section></aside>
    </div>
    ${designerPick?`<div class="picker-overlay" data-picker-overlay>${designerPicker(side)}</div>`:''}
    <div class="designer-footer"><div class="template-facts"><span><b>${fmt(stats.width,0)}</b> width</span><span><b>${fmt(stats.org,1)}</b> org</span><span><b>${fmt(stats.manpower,0)}</b> manpower</span></div><div class="actions"><button class="btn" id="clearDesigner">Reset</button><button class="btn" id="copyDesigner">Copy → ${other}</button><button class="btn" id="exportDesigner">Export</button><label class="btn file">Import<input id="importDesigner" type="file" accept="application/json" hidden></label></div></div>
  </section>`;
}
function bindDivisionDesigner(side){
  $('designerName').onchange=()=>{state[side+'Name']=$('designerName').value.trim()||`${side==='attacker'?'Assault':'Defensive'} Division`;save();shell();};
  $('designerDivisions').onchange=()=>{state[side+'Divisions']=Math.max(1,+$('designerDivisions').value||1);save();shell();};
  document.querySelectorAll('[data-bslot]').forEach(el=>el.onclick=ev=>{designerPick={kind:'battalion',side,c:+el.dataset.c,r:+el.dataset.r,fillRegiment:!!ev.shiftKey};shell();});
  document.querySelectorAll('[data-sslot]').forEach(el=>el.onclick=()=>{designerPick={kind:'support',side,i:+el.dataset.sslot};shell();});
  document.querySelectorAll('[data-rslot]').forEach(el=>el.onclick=()=>{designerPick={kind:'regimental',side,c:+el.dataset.rslot};shell();});
  document.querySelectorAll('[data-cancel-pick]').forEach(el=>el.onclick=()=>{designerPick=null;shell();});
  const pickerOverlay=document.querySelectorAll('[data-picker-overlay]')[0];if(pickerOverlay)pickerOverlay.onclick=e=>{if(e.target===pickerOverlay){designerPick=null;shell();}};
  document.querySelectorAll('[data-choice]').forEach(el=>el.onclick=ev=>{
    const value=el.dataset.choice||null;
    if(designerPick?.kind==='battalion'){
      const fill=designerPick.fillRegiment||ev.shiftKey;
      if(fill)state[side+'Grid']=fillRegiment(state[side+'Grid'],designerPick.c,value,Object.keys(battalions));
      else if(canPlaceBattalion(state[side+'Grid'],designerPick.c,designerPick.r,value,battalions))state[side+'Grid'][designerPick.c][designerPick.r]=value;
    }
    if(designerPick?.kind==='support'){
      const next=[...state[side+'Supports']];
      if(value)next[designerPick.i]=value;else next.splice(designerPick.i,1);
      state[side+'Supports']=next.filter(Boolean).slice(0,5);
    }
    if(designerPick?.kind==='regimental')state[side+'RegimentalSupports'][designerPick.c]=value;
    syncDesignerSide(side);designerPick=null;save();shell();
  });
  $('clearDesigner').onclick=()=>{state[side+'Grid']=blankGrid();state[side+'Supports']=[];state[side+'RegimentalSupports']=Array(DESIGNER_COLS).fill(null);syncDesignerSide(side);designerPick=null;save();shell();};
  $('copyDesigner').onclick=()=>{const other=side==='attacker'?'defender':'attacker';state[other+'Grid']=structuredClone(state[side+'Grid']);state[other+'Supports']=structuredClone(state[side+'Supports']);state[other+'RegimentalSupports']=structuredClone(state[side+'RegimentalSupports']);state[other+'Name']=`Copy of ${state[side+'Name']}`;syncDesignerSide(other);save();shell();};
  $('exportDesigner').onclick=()=>downloadJSON(`${side}-division.json`,{name:state[side+'Name'],grid:state[side+'Grid'],battalions:gridToCounts(state[side+'Grid'],Object.keys(battalions)),supports:state[side+'Supports'],regimentalSupports:state[side+'RegimentalSupports']});
  $('importDesigner').onchange=e=>{const f=e.target.files[0];if(!f)return;readJSON(f,x=>{state[side+'Grid']=Array.isArray(x.grid)?normalizeGrid(x.grid,Object.keys(battalions)):countsToGrid(Array.isArray(x.battalions)?x.battalions:Array.isArray(x[side])?x[side]:[],Object.keys(battalions));state[side+'Supports']=(Array.isArray(x.supports)?x.supports:Array.isArray(x[side+'Supports'])?x[side+'Supports']:[]).filter(k=>supports[k]).slice(0,5);state[side+'RegimentalSupports']=Array.isArray(x.regimentalSupports)?Array.from({length:DESIGNER_COLS},(_,i)=>{const raw=x.regimentalSupports[i],mapped=LEGACY_REGIMENTAL_MAP[raw]||raw;return BASE_REGIMENTAL_SUPPORTS.includes(mapped)?mapped:null;}):Array(DESIGNER_COLS).fill(null);if(x.name)state[side+'Name']=String(x.name).slice(0,80);syncDesignerSide(side);save();shell();});};
}

function techTierOptions(levels,current){return levels.map(x=>`<option value="${x.value}" ${+current===x.value?'selected':''}>${esc(x.label)}</option>`).join('');}
function techProfileSummary(side){
  const p=ensureTechState(side),inf=INFANTRY_EQUIPMENT_LEVELS.find(x=>x.value===p.infantryEquipment)?.label||'Infantry equipment';
  return `${p.countryTag} · ${inf} · ${doctrineSummary(p.landDoctrine)}`;
}
function inlineMioPicker(side,family,prefix){
  ensureMioState();const p=ensureTechState(side),catalog=currentMioCatalog(),sel=state.mioSelections[side][family],available=Object.values(catalog).filter(org=>mioAvailable(org,p.countryTag,family)),org=catalog[sel.organization];
  const title=org?esc(org.name||org.id):'No MIO assigned';
  return `<details class="equipment-drawer mio-drawer"><summary><span>MIO · ${esc(p.countryTag)}</span><b>${title}</b><em>${available.length} available</em></summary><div class="drawer-body"><div class="inline-mio"><div class="inline-mio-head"><div><span class="eyebrow">${esc(MIO_FAMILIES[family]||family)}</span></div><select id="${prefix}-mio-org"><option value="">No MIO assigned</option>${available.map(x=>`<option value="${esc(x.id)}" ${sel.organization===x.id?'selected':''}>${esc(x.name||x.id)}</option>`).join('')}</select></div>${org?`<div class="mio-traits">${Object.values(org.traits||{}).map(t=>{const checked=sel.traits.includes(t.id),ok=checked||traitSelectable(org,t.id,sel.traits);return `<label class="mio-trait ${ok?'':'locked'}"><input type="checkbox" data-inline-mio="${prefix}" value="${esc(t.id)}" ${checked?'checked':''} ${ok?'':'disabled'}><span>${esc(t.name||t.id)}</span></label>`;}).join('')||'<small>No parsed traits.</small>'}</div>`:`<small>${available.length?`${available.length} compatible organization${available.length===1?'':'s'} available.`:'Import MIO organization files for national manufacturer choices.'}</small>`}</div></div></details>`;
}

function bindInlineMio(side,family,prefix){
  const org=$(`${prefix}-mio-org`);if(org)org.onchange=()=>{state.mioSelections[side][family]={organization:org.value||null,traits:[]};save();shell();};
  document.querySelectorAll(`[data-inline-mio="${prefix}"]`).forEach(el=>el.onchange=()=>{const sel=state.mioSelections[side][family],set=new Set(sel.traits||[]);el.checked?set.add(el.value):set.delete(el.value);sel.traits=[...set];save();shell();});
}
function mioFamiliesInUse(side){
  const need=division(side).need||{},families=[];
  for(const family of ['infantry_equipment','artillery','anti_tank','anti_air','light_tank','medium_tank','heavy_tank'])if((need[family]||0)>0)families.push(family);
  return families;
}
function renderMioAssignments(side){
  ensureMioState();const p=ensureTechState(side),catalog=currentMioCatalog(),families=mioFamiliesInUse(side);
  if(!families.length)return '<p class="muted">No MIO-eligible equipment is used by this template.</p>';
  return `<div class="mio-assignment-grid">${families.map(family=>{
    const sel=state.mioSelections[side][family],available=Object.values(catalog).filter(org=>mioAvailable(org,p.countryTag,family));const org=catalog[sel.organization];
    const opts=`<option value="">No MIO assigned</option>${available.map(x=>`<option value="${esc(x.id)}" ${sel.organization===x.id?'selected':''}>${esc(x.name||x.id)}</option>`).join('')}`;
    const traits=org?Object.values(org.traits||{}):[];
    return `<article class="mio-assignment"><div><span>${esc(MIO_FAMILIES[family])}</span><select data-mio-org="${family}">${opts}</select></div>${org?`<div class="mio-traits">${traits.length?traits.map(t=>{const checked=sel.traits.includes(t.id),ok=checked||traitSelectable(org,t.id,sel.traits);return `<label class="mio-trait ${ok?'':'locked'}"><input type="checkbox" data-mio-trait="${family}" value="${esc(t.id)}" ${checked?'checked':''} ${ok?'':'disabled'}><span>${esc(t.name||t.id)}</span></label>`;}).join(''):'<small>This organization has no parsed selectable traits in the active data pack.</small>'}</div>`:`<small>${available.length?`${available.length} compatible organization${available.length===1?'':'s'} available.`:'No compatible MIO found for '+esc(p.countryTag)+' in the current data pack.'}</small>`}</article>`;
  }).join('')}</div>`;
}
function renderTechDoctrine(side){
  const p=ensureTechState(side),other=side==='attacker'?'defender':'attacker',issues=techProblems(side),land=normalizeLandDoctrine(p.landDoctrine);
  const unlocks=[['mechanized','Mechanized'],['lightArmor','Light armor'],['mediumArmor','Medium armor'],['heavyArmor','Heavy armor'],['engineer','Engineers'],['recon','Recon'],['logistics','Logistics'],['signal','Signal']];
  return panel('Tech, Doctrine & MIOs',`<div class="tech-profile-head"><div><span class="eyebrow">${side.toUpperCase()} FORCE PROFILE</span><h3>${esc(techProfileSummary(side))}</h3><p>Research, doctrine mastery and equipment manufacturers modify this side of the test.</p></div><button class="btn" id="copyTech">Copy → ${other}</button></div>
  <div class="tech-equipment-grid"><label>Country tag<input id="tech-countryTag" maxlength="3" value="${esc(p.countryTag)}"></label><label>Infantry equipment<select id="tech-infantryEquipment">${techTierOptions(INFANTRY_EQUIPMENT_LEVELS,p.infantryEquipment)}</select></label><label>Artillery<select id="tech-artillery">${techTierOptions(WEAPON_TIER_LEVELS,p.artillery)}</select></label><label>Anti-Tank<select id="tech-antiTank">${techTierOptions(WEAPON_TIER_LEVELS,p.antiTank)}</select></label><label>Anti-Air<select id="tech-antiAir">${techTierOptions(WEAPON_TIER_LEVELS,p.antiAir)}</select></label></div>
  <div class="tech-subhead"><span>EQUIPMENT / COMPANY PREREQUISITES</span><small>Informational only — theorycrafting never hard-locks a valid unit or module.</small></div><div class="tech-unlocks">${unlocks.map(([k,label])=>`<label class="tech-toggle"><input type="checkbox" data-tech-unlock="${k}" ${p.unlocks[k]?'checked':''}><span>${label}</span></label>`).join('')}</div>
  <div class="tech-subhead"><span>LAND DOCTRINE · 1.19 MASTERY MODEL</span><small>Choose one Grand Doctrine and a subdoctrine + mastery stage for each independent track.</small></div>
  <div class="grand-doctrine-row"><label>Grand Doctrine<select id="land-grand">${Object.entries(GRAND_DOCTRINES).map(([id,x])=>`<option value="${id}" ${land.grand===id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><div class="doctrine-summary"><span>TRACK MASTERY</span><b>${Object.values(land.tracks).map(x=>x.mastery).join(' · ')}</b></div></div>
  <div class="doctrine-track-grid">${Object.entries(LAND_DOCTRINE_TRACKS).map(([track,meta])=>{const t=land.tracks[track];return `<article class="doctrine-track ${t.mastery>=5?'complete':''}"><div><span>${esc(meta.name)}</span><b>${t.mastery>=5?'MILESTONE ACTIVE':`MASTERY ${t.mastery}/5`}</b></div><select data-doctrine-choice="${track}">${meta.choices.map(([id,name])=>`<option value="${id}" ${t.choice===id?'selected':''}>${esc(name)}</option>`).join('')}</select><input type="range" min="0" max="5" step="1" value="${t.mastery}" data-doctrine-mastery="${track}"><small>${t.mastery>=5?'Grand Doctrine milestone for this track is included in the modeled effects.':'Advance mastery as that subdoctrine develops in your campaign.'}</small></article>`;}).join('')}</div>
  <div class="tech-subhead"><span>MILITARY INDUSTRIAL ORGANIZATIONS</span><small>Availability is filtered by country tag and equipment family. Imported game files provide national MIO trees.</small></div>${renderMioAssignments(side)}
  ${issues.length?`<p class="notice stop"><b>Research conflict:</b> ${issues.map(k=>esc(battalions[k]?.name||supports[k]?.name||k)).join(', ')} is present in this template but not unlocked by the selected research profile.</p>`:''}
  <p class="notice">Doctrine structure follows the current 1.19 Grand Doctrine + four mastery-track system. The built-in pack only maps combat effects we can represent safely; tactics and scripted effects remain excluded. National MIO coverage becomes exact when organization files are imported.</p>`,'tech-doctrine-panel');
}
function bindTechDoctrine(side){
  $('tech-countryTag').onchange=()=>{state[side+'Tech'].countryTag=String($('tech-countryTag').value||'').toUpperCase().slice(0,3)||'---';ensureTechState(side);save();shell();};
  for(const k of ['infantryEquipment','artillery','antiTank','antiAir'])$('tech-'+k).onchange=()=>{state[side+'Tech'][k]=+$('tech-'+k).value;ensureTechState(side);save();shell();};
  document.querySelectorAll('[data-tech-unlock]').forEach(el=>el.onchange=()=>{state[side+'Tech'].unlocks[el.dataset.techUnlock]=el.checked;save();shell();});
  $('land-grand').onchange=()=>{state[side+'Tech'].landDoctrine.grand=$('land-grand').value;state[side+'Tech'].landDoctrine=normalizeLandDoctrine(state[side+'Tech'].landDoctrine);save();shell();};
  document.querySelectorAll('[data-doctrine-choice]').forEach(el=>el.onchange=()=>{const t=el.dataset.doctrineChoice;state[side+'Tech'].landDoctrine.tracks[t].choice=el.value;state[side+'Tech'].landDoctrine=normalizeLandDoctrine(state[side+'Tech'].landDoctrine);save();shell();});
  document.querySelectorAll('[data-doctrine-mastery]').forEach(el=>el.onchange=()=>{const t=el.dataset.doctrineMastery;state[side+'Tech'].landDoctrine.tracks[t].mastery=+el.value;state[side+'Tech'].landDoctrine=normalizeLandDoctrine(state[side+'Tech'].landDoctrine);save();shell();});
  document.querySelectorAll('[data-mio-org]').forEach(el=>el.onchange=()=>{const family=el.dataset.mioOrg;state.mioSelections[side][family]={organization:el.value||null,traits:[]};save();shell();});
  document.querySelectorAll('[data-mio-trait]').forEach(el=>el.onchange=()=>{const family=el.dataset.mioTrait,sel=state.mioSelections[side][family],set=new Set(sel.traits||[]);el.checked?set.add(el.value):set.delete(el.value);sel.traits=[...set];save();shell();});
  $('copyTech').onclick=()=>{const other=side==='attacker'?'defender':'attacker';state[other+'Tech']=structuredClone(state[side+'Tech']);state.mioSelections[other]=structuredClone(state.mioSelections[side]);save();shell();};
}

function battle(c){
  ensureDesignerState('attacker');ensureDesignerState('defender');
  const a=division('attacker'),d=division('defender'),selected=division(activeDesignerSide),preset=rolePresets[state.role],coach=scoreDivision(selected,preset),techInvalid=techProblems('attacker').length||techProblems('defender').length;
  const labTabs=[['template','TEMPLATE'],['tech','TECH & MIO'],['combat','COMBAT'],['analysis','ANALYSIS']];
  const armorPanel=panel('Armor variants',`<div class="armor-variant-strip">${['light','medium','heavy'].map(cls=>{const design=adjustedTankDesign(activeDesignerSide,cls);return `<a href="#tank" data-armor-link="${cls}"><span>${cls.toUpperCase()}</span><b>${esc(design.name)}</b><small>${fmt(design.armor,0)} ARM · ${fmt(design.softAttack,0)} SA · ${fmt(design.buildCost,2)} IC</small></a>`;}).join('')}</div>`,'compact-panel');
  const battlefieldPanel=panel('Battlefield',`<div class="battlefield-quick">
      <label>Terrain<select id="b-terrain">${Object.entries(terrain).map(([k,v])=>`<option value="${k}" ${k===state.battlefield.terrain?'selected':''}>${v.name} · ${v.width}+${v.reinforceWidth}</option>`).join('')}</select></label>
      <label>Directions<input id="b-directions" type="number" min="0" max="5" value="${state.battlefield.directions}"></label>
      <label>Entrench<input id="b-entrench" type="number" min="0" max="100" value="${state.battlefield.entrench}"></label>
      <label>Fort<input id="b-fort" type="number" min="0" max="10" value="${state.battlefield.fort}"></label>
      <label>River<select id="b-river"><option value="0" ${+state.battlefield.river===0?'selected':''}>None</option><option value="${COMBAT_CONSTANTS.riverCrossingPenalty}" ${+state.battlefield.river===COMBAT_CONSTANTS.riverCrossingPenalty?'selected':''}>Small</option><option value="${COMBAT_CONSTANTS.riverCrossingPenaltyLarge}" ${+state.battlefield.river===COMBAT_CONSTANTS.riverCrossingPenaltyLarge?'selected':''}>Large</option></select></label>
      <label>A Supply<input id="b-asupply" type="number" min="0" max="1" step=".05" value="${state.battlefield.asupply}"></label>
      <label>D Supply<input id="b-dsupply" type="number" min="0" max="1" step=".05" value="${state.battlefield.dsupply}"></label>
      <label>Air<input id="b-air" type="number" min="-1" max="1" step=".05" value="${state.battlefield.air}"></label>
    </div>
    <details class="advanced-settings"><summary>Advanced combat assumptions</summary><div class="field-grid compact-fields">
      <label>CAS support<input id="b-cas" type="number" min="0" max="1" step=".05" value="${state.battlefield.cas}"></label>
      <label>Planning<input id="b-planning" type="number" min="0" max="1" step=".05" value="${state.battlefield.planning}"></label>
      <label>Night fraction<input id="b-night" type="number" min="0" max="1" step=".1" value="${state.battlefield.night}"></label>
      <label>Runs<input id="b-runs" type="number" min="50" max="5000" step="50" value="${state.battlefield.runs}"></label>
      <label>Seed<input id="b-seed" type="number" step="1" value="${state.battlefield.seed}"></label>
    </div></details>
    <div class="combat-command"><button class="primary" id="simulate">► START BATTLE TEST</button><button class="btn" id="terrains">Compare terrain</button><span>${techInvalid?'ⓘ Prerequisites not selected · theorycraft still enabled':'Seeded simulation ready'}</span></div>`,'hoi-control-panel');
  const analysisPanel=`<div class="grid two compact-analysis">${panel('Template coach',`<label>Role<select id="role">${Object.entries(rolePresets).map(([k,v])=>`<option value="${k}" ${state.role===k?'selected':''}>${v.name}</option>`).join('')}</select></label><div class="coach compact-coach"><strong>${fmt(coach.score,0)}</strong><span>${activeDesignerSide} role score</span></div><div class="compare-cards"><div><span>ATTACKER</span><b>${fmt(a.soft)} SA · ${fmt(a.breakthrough)} BRK</b><small>${fmt(a.armor)} ARM · ${fmt(a.piercing)} PIER</small></div><div><span>DEFENDER</span><b>${fmt(d.soft)} SA · ${fmt(d.def)} DEF</b><small>${fmt(d.armor)} ARM · ${fmt(d.piercing)} PIER</small></div></div>`,'hoi-control-panel')}${panel('Width packing',`${widthPackingTable(selected)}`,'hoi-control-panel')}</div>`;
  const content=activeLabPanel==='template'?`${renderDivisionDesigner(activeDesignerSide)}${armorPanel}`:activeLabPanel==='tech'?renderTechDoctrine(activeDesignerSide):activeLabPanel==='combat'?`${battlefieldPanel}${panel('Battle report',`<div id="battleResult" class="result">${lastBattlePreview()}</div>`,'battle-report-panel')}`:analysisPanel;
  c.innerHTML=`<section class="tool-head hoi-tool-head"><div><p class="eyebrow">LAND FORCES</p><h1>Division Lab</h1></div>${badge(`HOI4 ${MODEL_META.gameVersion}`,'good')}</section>
  <div class="lab-command-bar"><div class="designer-tabs"><button class="${activeDesignerSide==='attacker'?'active':''}" data-designer-side="attacker"><span>ATTACKER</span><b>${fmt(a.width,0)}W · ${fmt(a.org,0)} ORG</b></button><button class="${activeDesignerSide==='defender'?'active':''}" data-designer-side="defender"><span>DEFENDER</span><b>${fmt(d.width,0)}W · ${fmt(d.org,0)} ORG</b></button><button class="swap-tab" id="swapSides">⇄</button></div><div class="lab-mode-tabs">${labTabs.map(([id,label])=>`<button data-lab-panel="${id}" class="${activeLabPanel===id?'active':''}">${label}${id==='tech'&&techInvalid?' !':''}</button>`).join('')}</div></div>
  <div class="lab-workspace">${content}</div>`;
  document.querySelectorAll('[data-lab-panel]').forEach(el=>el.onclick=()=>{activeLabPanel=el.dataset.labPanel;designerPick=null;shell();});
  document.querySelectorAll('[data-designer-side]').forEach(el=>el.onclick=()=>{activeDesignerSide=el.dataset.designerSide;designerPick=null;shell();});
  $('swapSides').onclick=()=>{[state.attackerGrid,state.defenderGrid]=[state.defenderGrid,state.attackerGrid];[state.attackerSupports,state.defenderSupports]=[state.defenderSupports,state.attackerSupports];[state.attackerRegimentalSupports,state.defenderRegimentalSupports]=[state.defenderRegimentalSupports,state.attackerRegimentalSupports];[state.attackerTech,state.defenderTech]=[state.defenderTech,state.attackerTech];[state.tankDesigns.attacker,state.tankDesigns.defender]=[state.tankDesigns.defender,state.tankDesigns.attacker];[state.mioSelections.attacker,state.mioSelections.defender]=[state.mioSelections.defender,state.mioSelections.attacker];[state.attackerDivisions,state.defenderDivisions]=[state.defenderDivisions,state.attackerDivisions];syncDesignerSide('attacker');syncDesignerSide('defender');designerPick=null;save();shell();};
  if(activeLabPanel==='template'){
    bindDivisionDesigner(activeDesignerSide);
    document.querySelectorAll('[data-armor-link]').forEach(el=>el.onclick=()=>{state.tankDesigner.side=activeDesignerSide;state.tankDesigner.class=el.dataset.armorLink;state.tankDesigner.role='armor';save();});
  }
  if(activeLabPanel==='tech')bindTechDoctrine(activeDesignerSide);
  if(activeLabPanel==='combat'){
    ['terrain','directions','entrench','fort','river','asupply','dsupply','air','cas','planning','night','runs','seed'].forEach(id=>{const el=$('b-'+id);if(el)el.onchange=()=>{state.battlefield[id]=id==='terrain'?el.value:+el.value;save();};});
    $('simulate').onclick=()=>showBattle(false);$('terrains').onclick=()=>showBattle(true);
  }
  if(activeLabPanel==='analysis')$('role').onchange=()=>{state.role=$('role').value;save();shell();};
}

function battleTimeline(rep){
  const rows=rep?.timeline||[];if(!rows.length)return '';
  const outcome=rep.attackerWin?'Attacker victory':rep.defenderWin?'Defender victory':'Unresolved';
  return `<section class="aar-section"><div class="aar-head"><div><span class="eyebrow">REPRESENTATIVE SEEDED ENGAGEMENT</span><h3>${outcome} · H+${rep.hours}</h3></div><small>One deterministic run for shape/timing—not the Monte Carlo average.</small></div><div class="aar-timeline">${rows.map(x=>`<article><b>H+${x.hour}</b><div class="aar-bars"><span>A ORG<i><em style="width:${clamp(x.aOrg,0,100)}%"></em></i><small>${fmt(x.aOrg,0)}%</small></span><span>A STR<i><em style="width:${clamp(x.aStrength,0,100)}%"></em></i><small>${fmt(x.aStrength,0)}%</small></span><span class="enemy">D ORG<i><em style="width:${clamp(x.dOrg,0,100)}%"></em></i><small>${fmt(x.dOrg,0)}%</small></span><span class="enemy">D STR<i><em style="width:${clamp(x.dStrength,0,100)}%"></em></i><small>${fmt(x.dStrength,0)}%</small></span></div></article>`).join('')}</div></section>`;
}

function showBattle(compare){
  const a=aggregate('attacker'),d=aggregate('defender'),o=battleOpts();
  if(compare){
    const rows=compareTerrains(a,d,o,Math.min(250,state.battlefield.runs));
    $('battleResult').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Terrain</th><th>Width</th><th>Attacker win</th><th>Draw</th><th>Hours</th><th>Att. loss</th><th>Def. loss</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${terrain[x.terrain].name}</td><td>${terrain[x.terrain].width}+${terrain[x.terrain].reinforceWidth}</td><td>${pct(x.results.winRate)}</td><td>${pct(x.results.drawRate)}</td><td>${fmt(x.results.avgHours,0)}</td><td>${pct(x.results.attackerCasualtyRate)}</td><td>${pct(x.results.defenderCasualtyRate)}</td></tr>`).join('')}</tbody></table></div>`;
    return;
  }
  const r=simulateBattle(a,d,o,state.battlefield.runs),cx=r.context;
  state.lastBattle={attackerEquipmentLosses:r.attackerEquipmentLosses,defenderEquipmentLosses:r.defenderEquipmentLosses,attackerManpowerLoss:r.attackerManpowerLoss,defenderManpowerLoss:r.defenderManpowerLoss,attackerCasualtyRate:r.attackerCasualtyRate,defenderCasualtyRate:r.defenderCasualtyRate,winRate:r.winRate,winRateLow:r.winRateLow,winRateHigh:r.winRateHigh,avgHours:r.avgHours,seed:r.seed,representative:r.representative,fingerprint:battleFingerprint(),simulatedAt:new Date().toISOString(),applied:false};save();
  const title=r.winRate>=60?'Favorable':r.winRate>=40?'Contested':'Unfavorable';
  $('battleResult').innerHTML=`<div class="report"><div class="report-title"><div><p class="eyebrow">${title.toUpperCase()}</p><h2>${pct(r.winRate)} attacker win · ${pct(r.defenderWinRate)} defender win</h2><p class="confidence">95% Monte Carlo interval: <b>${pct(r.winRateLow)}–${pct(r.winRateHigh)}</b> · ${fmt(r.runs,0)} seeded runs</p></div>${badge(`${pct(r.drawRate)} unresolved`)}</div>
    <div class="result-grid"><div><span>Expected duration</span><strong>${fmt(r.avgHours,0)} h</strong></div><div><span>Attacker manpower loss</span><strong>${fmt(r.attackerManpowerLoss,0)}</strong></div><div><span>Defender manpower loss</span><strong>${fmt(r.defenderManpowerLoss,0)}</strong></div><div><span>Battle width</span><strong>${fmt(cx.available,0)}</strong></div><div><span>Attacker engaged / reserve</span><strong>${cx.ae.engaged} / ${cx.ae.reserve}</strong></div><div><span>Defender engaged / reserve</span><strong>${cx.de.engaged} / ${cx.de.reserve}</strong></div><div><span>Attacker hits / hour</span><strong>${fmt(r.attackerHitsPerHour,1)}</strong></div><div><span>Defender hits / hour</span><strong>${fmt(r.defenderHitsPerHour,1)}</strong></div></div>
    ${battleTimeline(r.representative)}
    <div class="grid two"><div><h3>Attacker replacement estimate</h3><div class="loss-list">${equipmentLossList(r.attackerEquipmentLosses)}</div><p><b>${fmt(replacementIC(r.attackerEquipmentLosses),0)} IC</b> of material replacement.</p><button class="btn" id="addReplacement">Add to production targets</button></div><div><h3>Combat mechanics</h3><div class="notice-grid"><p><b>Target hardness:</b> soft/hard mix uses the opponent.</p><p><b>Armor/piercing:</b> 40/60 division weighting + partial tiers.</p><p><b>Width:</b> ${pct(cx.ae.widthPenalty*100)} attacker penalty · ${pct(cx.de.widthPenalty*100)} defender.</p><p><b>Stacking:</b> ${pct(cx.ae.stackPenalty*100)} attacker · ${pct(cx.de.stackPenalty*100)} defender.</p></div></div></div>
    <p class="notice">Analytical model. Committed divisions that do not initially fit on the line contribute aggregate reserve depth, but exact reinforce timing/initiative is not yet simulated. Use the uncertainty view before treating a narrow win probability as decision-grade.</p></div>`;
  $('addReplacement').onclick=applyLastBattleReplacement;
}


function optionList(map,current,filter=()=>true){return Object.entries(map).filter(([k,v])=>filter(v,k)).map(([k,v])=>{const req=Array.isArray(v.requirements)?v.requirements:[];return `<option value="${k}" ${k===current?'selected':''} title="${esc(req.length?'Prerequisite: '+req.join(', '):'')}">${esc(v.name)}${req.length?' ⓘ':''}</option>`;}).join('');}
function tankCurrent(){ensureTankState();return tankDesignFor(state.tankDesigner.side,state.tankDesigner.class,state.tankDesigner.role);}
function tankStatsGrid(d){
  const rows=[['Soft Attack',d.softAttack,1],['Hard Attack',d.hardAttack,1],['Piercing',d.piercing,1],['Air Attack',d.airAttack||0,1],['Armor',d.armor,1],['Hardness',(d.hardness||0)*100,1,'%'],['Breakthrough',d.breakthrough,1],['Defense',d.defense,1],['Max Speed',d.maxSpeed,2,' km/h'],['Reliability',d.reliability*100,1,'%'],['Fuel Use',d.fuelConsumption,2],['IC Cost',d.buildCost,2]];
  return `<div class="tank-stat-grid">${rows.map(([k,v,n,suf=''])=>`<div><span>${k}</span><b>${fmt(v,n)}${suf}</b></div>`).join('')}</div>`;
}
function tank(c){
  ensureTankState();
  const side=state.tankDesigner.side,cls=state.tankDesigner.class,role=state.tankDesigner.role,raw=tankCurrent(),choices=tankDesignOptions(raw),d=adjustedTankDesign(side,cls,role),target=tankVariantTargets(cls,role),other=side==='attacker'?'defender':'attacker',data=techData(side),eqMap=equipmentForSide(side);
  const linked=(target?.units||[]).map(t=>({t,record:(t.kind==='support'?data.supports:data.battalions)?.[t.id]})).filter(x=>x.record),primary=linked[0]?.record||null,eq=target?.equipmentKey?eqMap[target.equipmentKey]:null,mioFamily=tankMioFamily(cls);
  const resourceText=Object.entries(d.resources||{}).map(([k,v])=>`<span class="resource-chip">${k.toUpperCase()} ${fmt(v,0)}/MIC</span>`).join('')||'<span class="resource-chip">No strategic resource</span>';
  const familyTabs=TANK_FAMILIES.map(k=>{const firstRole=tankRolesForFamily(k)[0],design=state.tankVariants?.[side]?.[k]?.[firstRole];return `<button data-tank-class="${k}" class="${cls===k?'active':''}">${esc(tankFamilyLabel(k).toUpperCase())}<small>${esc(design?.name||tankFamilyLabel(k))}</small></button>`;}).join('');
  const roleTabs=tankRolesForFamily(cls).map(r=>`<button data-tank-role="${r}" class="${role===r?'active':''}">${esc((TANK_ROLE_LABELS[r]||r).toUpperCase())}<small>${esc(state.tankVariants[side][cls][r].name)}</small></button>`).join('');
  const standardModules=`
        <label class="fixed-slot weapon"><span>MAIN ARMAMENT</span><select id="tank-gun">${optionList(TANK_GUNS,raw.gun,(v,k)=>choices.guns.has(k))}</select></label>
        <label><span>TURRET</span><select id="tank-turret">${optionList(TANK_TURRETS,raw.turret,(v,k)=>choices.turrets.has(k))}</select></label>
        <label><span>SUSPENSION</span><select id="tank-suspension">${optionList(TANK_SUSPENSIONS,raw.suspension,(v,k)=>choices.suspensions.has(k))}</select></label>
        <label><span>ARMOR TYPE</span><select id="tank-armorType">${optionList(TANK_ARMOR_TYPES,raw.armorType,(v,k)=>choices.armorTypes.has(k))}</select></label>
        <label><span>ENGINE</span><select id="tank-engine">${optionList(TANK_ENGINES,raw.engine,(v,k)=>choices.engines.has(k))}</select></label>
        ${(raw.specials||[]).map((v,i)=>`<label><span>SPECIAL ${i+1}</span><select id="tank-special-${i}">${optionList(TANK_SPECIALS,v,(m,k)=>choices.specials[i]?.has(k))}</select></label>`).join('')}`;
  const genericModules=choices.genericSlots?Object.entries(choices.genericSlots).map(([slot,set])=>`<label class="${slot==='lc_main_armament_slot'?'fixed-slot weapon':''}"><span>${esc(slot.replace(/^lc_/,'').replaceAll('_',' ').toUpperCase())}</span><select id="tank-slot-${slot}">${optionList(TANK_SLOT_MODULES,raw.slotModules?.[slot]||'none',(m,k)=>set.has(k))}</select></label>`).join(''):'';
  const capacityNotice=d.maxWeight>0?(d.overloaded?`<p class="notice stop"><b>Chassis overloaded:</b> ${fmt(d.overload,1)} weight above the ${fmt(d.maxWeight,0)} baseline capacity. Speed/reliability penalties are active.</p>`:`<p class="notice good"><b>Weight within chassis capacity.</b> ${fmt(d.weight,1)} / ${fmt(d.maxWeight,0)}.</p>`):`<p class="notice"><b>Source-slot validation active.</b> No executable weight-cap rule is asserted for this 1.19.2 designer chassis.</p>`;
  const mioBlock=mioFamily?inlineMioPicker(side,mioFamily,'tank-active'):`<p class="muted">MIO effects are not inferred for ${esc(tankFamilyLabel(cls))}; source chassis/module behavior remains active.</p>`;
  const linkedNames=linked.map(x=>x.record.name).join(', ');
  const needQty=Number(primary?.need?.[target?.equipmentKey]||0),industrial=eq&&primary?`<div class="variant-link-card"><span>PRODUCTION EQUIPMENT</span><h3>${esc(eq.name)}</h3><strong class="big-ic">${fmt(eq.cost,2)} IC / vehicle</strong><p>${esc(primary.name)} requires ${fmt(needQty,0)} vehicles, so this unit carries roughly <b>${fmt(needQty*eq.cost,0)} IC</b> of designed equipment before losses.</p><a class="btn" href="#production">Test force production →</a></div>`:`<p class="notice">No production alias is available for this role target.</p>`;
  const integration=primary?`<div class="variant-link-card"><span>${side.toUpperCase()} · ${esc((TANK_ROLE_LABELS[role]||role).toUpperCase())}</span><h3>${esc(primary.name)}</h3><div class="hq-stat-pair"><div><span>Soft attack</span><b>${fmt(primary.soft,1)}</b></div><div><span>Hard attack</span><b>${fmt(primary.hard,1)}</b></div><div><span>Armor</span><b>${fmt(primary.armor,1)}</b></div><div><span>Breakthrough</span><b>${fmt(primary.breakthrough,1)}</b></div></div><p>This design is active for ${linked.length} linked source unit${linked.length===1?'':'s'}${linkedNames?`: ${esc(linkedNames)}`:''}.</p><a class="btn" href="#battle">Open Division Lab →</a></div>`:`<p class="notice stop">No hydrated 1.19.2 unit target was found for this family/role.</p>`;
  c.innerHTML=`<section class="tool-head hoi-tool-head"><div><p class="eyebrow">ARMORED FORCES · EQUIPMENT DESIGN</p><h1>Tank Designer</h1><p>Build source-valid tank, TD, SPG, SPAA, flame, amphibious and special-project variants. Prerequisites stay informational; structural role and slot rules are enforced.</p></div>${badge('Source-linked','good')}</section>
  <div class="designer-tabs tank-tabs"><button class="${side==='attacker'?'active':''}" data-tank-side="attacker"><span>ATTACKER</span><b>${esc(state.attackerName)}</b></button><button class="${side==='defender'?'active':''}" data-tank-side="defender"><span>DEFENDER</span><b>${esc(state.defenderName)}</b></button><button class="swap-tab" id="copyTank">COPY → ${other.toUpperCase()}</button></div>
  <div class="tank-class-tabs">${familyTabs}</div>
  <div class="tank-class-tabs tank-role-tabs">${roleTabs}</div>
  <section class="tank-designer-shell">
    <div class="tank-blueprint panel"><div class="tank-nameplate"><div><span class="eyebrow">${esc(tankFamilyLabel(cls).toUpperCase())} · ${esc((TANK_ROLE_LABELS[role]||role).toUpperCase())}</span><input id="tank-name" value="${esc(raw.name)}" aria-label="Tank design name"></div><div class="tank-silhouette"><span>▰</span><b>${fmt(d.armor,0)}</b><small>ARMOR</small></div></div>
      <div class="tank-module-grid">
        <label class="fixed-slot"><span>CHASSIS</span><select id="tank-chassis">${optionList(TANK_CHASSIS,raw.chassis,v=>v.class===cls)}</select></label>
        ${choices.genericSlots?genericModules:standardModules}
      </div>
      <div class="tank-upgrades"><label>Engine upgrades <input id="tank-engineUpgrades" type="range" min="0" max="20" value="${raw.engineUpgrades}"><b>${raw.engineUpgrades}</b></label><label>Armor upgrades <input id="tank-armorUpgrades" type="range" min="0" max="20" value="${raw.armorUpgrades}"><b>${raw.armorUpgrades}</b></label></div>
      ${capacityNotice}
    </div>
    <aside class="panel tank-performance"><div class="panel-head"><h2>Variant statistics</h2></div>${tankStatsGrid(d)}<div class="advisor-resources">${resourceText}</div>${mioBlock}<p class="muted">Bundled 1.19.2 chassis, duplicate-role hardness, module compatibility, role restrictions and NSB upgrades are active. Module aggregation order that is not explicit in data files remains labeled analytical.</p></aside>
  </section>
  <div class="grid two">${panel('Division Lab integration',integration)}${panel('Industrial burden',industrial)}</div>`;
  document.querySelectorAll('[data-tank-side]').forEach(el=>el.onclick=()=>{state.tankDesigner.side=el.dataset.tankSide;save();shell();});
  document.querySelectorAll('[data-tank-class]').forEach(el=>el.onclick=()=>{state.tankDesigner.class=el.dataset.tankClass;const roles=tankRolesForFamily(state.tankDesigner.class);if(!roles.includes(state.tankDesigner.role))state.tankDesigner.role=roles[0];save();shell();});
  document.querySelectorAll('[data-tank-role]').forEach(el=>el.onclick=()=>{state.tankDesigner.role=el.dataset.tankRole;save();shell();});
  $('copyTank').onclick=()=>{state.tankVariants[other][cls][role]=structuredClone(state.tankVariants[side][cls][role]);state.tankVariants[other][cls][role].name=`Copy of ${state.tankVariants[side][cls][role].name}`;save();shell();};
  const set=(k,v)=>{const design=state.tankVariants[side][cls][role];design[k]=v;state.tankVariants[side][cls][role]=normalizeTankDesign(design,cls,role);if(role==='armor'&&['light','medium','heavy'].includes(cls))state.tankDesigns[side][cls]=structuredClone(state.tankVariants[side][cls][role]);save();shell();};
  $('tank-name').onchange=()=>set('name',$('tank-name').value.trim()||`${tankFamilyLabel(cls)} ${TANK_ROLE_LABELS[role]||'Tank'}`);
  $('tank-chassis').onchange=()=>set('chassis',$('tank-chassis').value);
  if(choices.genericSlots){for(const slot of Object.keys(choices.genericSlots)){const el=$('tank-slot-'+slot);if(el)el.onchange=()=>set('slotModules',{...(state.tankVariants[side][cls][role].slotModules||{}),[slot]:el.value});}}
  else{
    for(const k of ['gun','turret','suspension','armorType','engine']){const el=$('tank-'+k);if(el)el.onchange=()=>set(k,el.value);}
    (raw.specials||[]).forEach((_,i)=>{const el=$('tank-special-'+i);if(el)el.onchange=()=>{const next=[...state.tankVariants[side][cls][role].specials];next[i]=el.value;set('specials',next);};});
  }
  for(const k of ['engineUpgrades','armorUpgrades'])$('tank-'+k).onchange=()=>set(k,+$('tank-'+k).value);
  if(mioFamily)bindInlineMio(side,mioFamily,'tank-active');
}


function renderAirDoctrine(side,prefix){
  const p=ensureTechState(side),d=normalizeAirDoctrine(p.airDoctrine),grand=AIR_GRAND_DOCTRINES[d.grand]?.name||d.grand,mastery=Object.values(d.tracks).reduce((n,x)=>n+(+x.mastery||0),0);
  return `<details class="equipment-drawer air-doctrine"><summary><span>AIR DOCTRINE · ${esc(p.countryTag)}</span><b>${esc(grand)}</b><em>${mastery}/15 mastery</em></summary><div class="drawer-body"><div class="air-doctrine-head"><select id="${prefix}-air-grand">${Object.entries(AIR_GRAND_DOCTRINES).map(([id,x])=>`<option value="${id}" ${d.grand===id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="air-doctrine-tracks">${Object.entries(AIR_DOCTRINE_TRACKS).map(([track,meta])=>{const t=d.tracks[track];return `<div class="air-doctrine-track ${t.mastery>=5?'complete':''}"><span>${esc(meta.name)}</span><select data-air-doctrine-choice="${prefix}:${track}">${meta.choices.map(([id,name])=>`<option value="${id}" ${t.choice===id?'selected':''}>${esc(name)}</option>`).join('')}</select><label>Mastery <input type="number" min="0" max="5" step="1" value="${t.mastery}" data-air-doctrine-mastery="${prefix}:${track}"></label></div>`;}).join('')}</div></div></details>`;
}

function bindAirDoctrine(side,prefix){
  const grand=$(`${prefix}-air-grand`);if(grand)grand.onchange=()=>{state[side+'Tech'].airDoctrine.grand=grand.value;state[side+'Tech'].airDoctrine=normalizeAirDoctrine(state[side+'Tech'].airDoctrine);save();shell();};
  document.querySelectorAll(`[data-air-doctrine-choice^="${prefix}:"]`).forEach(el=>el.onchange=()=>{const track=el.dataset.airDoctrineChoice.split(':')[1];state[side+'Tech'].airDoctrine.tracks[track].choice=el.value;state[side+'Tech'].airDoctrine=normalizeAirDoctrine(state[side+'Tech'].airDoctrine);save();shell();});
  document.querySelectorAll(`[data-air-doctrine-mastery^="${prefix}:"]`).forEach(el=>el.onchange=()=>{const track=el.dataset.airDoctrineMastery.split(':')[1];state[side+'Tech'].airDoctrine.tracks[track].mastery=+el.value;state[side+'Tech'].airDoctrine=normalizeAirDoctrine(state[side+'Tech'].airDoctrine);save();shell();});
}
function airDesignStats(d){
  const rows=[['Air Attack',d.airAttack,1],['Air Defense',d.airDefense,1],['Agility',d.agility,1],['Max Speed',d.maxSpeed,0,' km/h'],['Range',d.range,0,' km'],['Ground Attack',d.groundAttack,1],['Naval Attack',d.navalAttack,1],['Reliability',d.reliability*100,1,'%'],['IC Cost',d.buildCost,2],['Weight',d.weight,1],['Thrust',d.thrust,1]];
  return `<div class="air-stat-grid">${rows.map(([k,v,n,suf=''])=>`<div><span>${k}</span><b>${fmt(v,n)}${suf}</b></div>`).join('')}</div>`;
}
function airDesignPanel(key,label){
  const raw=state.airLab[key],side=key==='a'?'attacker':'defender',d=adjustedAirDesign(side,raw),prefix=`air-${key}`,choices=airDesignOptions(raw),sourceSlots=Object.keys(choices.slots||{});
  const sourceSlotHtml=sourceSlots.map(slot=>{const current=raw.slotModules?.[slot]||'none',frame=AIRFRAMES[raw.airframe],required=!!frame?._equipment?.moduleSlots?.[slot]?.required;return `<label class="${required?'fixed-slot':''}"><span>${esc(airSlotLabel(slot))}${required?' · REQUIRED':''}</span><select id="${prefix}-slot-${slot}">${optionList(AIR_SLOT_MODULES,current,(v,id)=>choices.slots[slot].has(id))}</select></label>`;}).join('');
  const legacyHtml=`<label class="wide"><span>ENGINE</span><select id="${prefix}-engine">${optionList(AIR_ENGINES,raw.engine)}</select></label>${raw.weapons.map((v,i)=>`<label><span>WEAPON ${i+1}</span><select id="${prefix}-weapon-${i}">${optionList(AIR_WEAPONS,v)}</select></label>`).join('')}<label><span>DEFENSE</span><select id="${prefix}-defense">${optionList(AIR_DEFENSE_MODULES,raw.defense)}</select></label>${raw.specials.map((v,i)=>`<label><span>SPECIAL ${i+1}</span><select id="${prefix}-special-${i}">${optionList(AIR_SPECIALS,v)}</select></label>`).join('')}`;
  const missionNote=d.source==='game-pack'?`<p class="muted"><b>1.19.2 source-slot mode.</b> Structural compatibility, base module stats, IC, resources, weight and thrust use bundled game data. Aircraft mission-specific repeated stat blocks are not yet source-complete in the bundled import, so CAS/naval/strategic mission attack remains explicitly uncertified.</p>`:'';
  return `<section class="panel aircraft-designer ${key==='a'?'friendly':'enemy'}"><div class="aircraft-head"><div><span class="eyebrow">${label}</span><input id="${prefix}-name" value="${esc(raw.name)}"></div><div class="aircraft-role">${d.roles.map(x=>`<span>${x.replaceAll('_',' ').toUpperCase()}</span>`).join('')||'<span>NO MISSION TYPE</span>'}${d.carrier?'<span>CARRIER</span>':''}</div></div>
    <div class="air-module-grid"><label class="wide"><span>AIRFRAME</span><select id="${prefix}-airframe">${optionList(AIRFRAMES,raw.airframe)}</select></label>${sourceSlots.length?sourceSlotHtml:legacyHtml}</div>
    ${d.overweight?`<p class="notice stop"><b>Insufficient thrust.</b> ${fmt(d.thrust,1)} available / ${fmt(d.requiredThrust,1)} required.${d.source==='game-pack'?' The design remains selectable for theorycrafting; no invented performance penalty is applied.':' Agility, speed and reliability are penalized by the fallback analytical model.'}</p>`:`<p class="notice good"><b>Thrust margin:</b> ${fmt(d.thrust-d.requiredThrust,1)}.</p>`}
    ${airDesignStats(d)}<div class="advisor-resources">${Object.entries(d.resources||{}).map(([r,q])=>`<span class="resource-chip">${r.toUpperCase()} ${fmt(q,0)}/MIC</span>`).join('')}</div>${inlineMioPicker(side,d.size==='large'?'large_airframe':d.size==='medium'?'medium_airframe':'small_airframe',`${prefix}-active`)}${missionNote}${renderAirDoctrine(side,prefix)}</section>`;
}
function bindAirDesign(key){
  const prefix=`air-${key}`,set=(k,v)=>{state.airLab[key][k]=v;state.airLab[key]=normalizeAirDesign(state.airLab[key],AIRFRAMES[state.airLab[key].airframe]?.size||'small');save();shell();};
  $(`${prefix}-name`).onchange=()=>set('name',$(`${prefix}-name`).value.trim()||'Aircraft');
  $(`${prefix}-airframe`).onchange=()=>set('airframe',$(`${prefix}-airframe`).value);
  const choices=airDesignOptions(state.airLab[key]),sourceSlots=Object.keys(choices.slots||{});
  if(sourceSlots.length){
    for(const slot of sourceSlots){const el=$(`${prefix}-slot-${slot}`);if(el)el.onchange=()=>set('slotModules',{...(state.airLab[key].slotModules||{}),[slot]:el.value});}
  }else{
    for(const k of ['engine','defense'])$(`${prefix}-${k}`).onchange=()=>set(k,$(`${prefix}-${k}`).value);
    state.airLab[key].weapons.forEach((_,i)=>{$(`${prefix}-weapon-${i}`).onchange=()=>{const x=[...state.airLab[key].weapons];x[i]=$(`${prefix}-weapon-${i}`).value;set('weapons',x);};});
    state.airLab[key].specials.forEach((_,i)=>{$(`${prefix}-special-${i}`).onchange=()=>{const x=[...state.airLab[key].specials];x[i]=$(`${prefix}-special-${i}`).value;set('specials',x);};});
  }
  const side=key==='a'?'attacker':'defender',built=adjustedAirDesign(side,state.airLab[key]);bindInlineMio(side,built.size==='large'?'large_airframe':built.size==='medium'?'medium_airframe':'small_airframe',`${prefix}-active`);bindAirDoctrine(side,prefix);
}

function air(c){
  ensureAirState();const o=state.airLab,aBuilt=adjustedAirDesign('attacker',o.a),bBuilt=adjustedAirDesign('defender',o.b),afx=airDoctrineEffects(ensureTechState('attacker').airDoctrine,aBuilt,state.dataPack),bfx=airDoctrineEffects(ensureTechState('defender').airDoctrine,bBuilt,state.dataPack),airOpts={...o,missionEfficiencyA:o.missionEfficiencyA*(1+(afx.mission[o.mission]||0)),missionEfficiencyB:o.missionEfficiencyB*(1+(bfx.mission[o.mission]||0)),detectionA:o.detectionA*(1+(afx.detection||0)),detectionB:o.detectionB*(1+(bfx.detection||0))},r=compareBuiltAirDesigns(aBuilt,bBuilt,airOpts),a=r.a,b=r.b,effA=airMissionEfficiencyBuilt(a,o.mission),effB=airMissionEfficiencyBuilt(b,o.mission),exchange=Number.isFinite(r.exchangeA)?fmt(r.exchangeA,2):'∞',kill=Number.isFinite(r.killRatioA)?fmt(r.killRatioA,2):'∞';
  const verdict=r.exchangeA>=1.15?'FRIENDLY DESIGN WINS ON IC':r.exchangeA<=.87?'ENEMY DESIGN WINS ON IC':'ROUGH IC PARITY';
  c.innerHTML=`<section class="tool-head hoi-tool-head"><div><p class="eyebrow">AIR MINISTRY · AIRCRAFT DESIGN & TEST</p><h1>Air Lab</h1><p>Design two aircraft, compare combat exchange and judge whether extra performance is worth the extra IC.</p></div>${badge('Analytical air-combat model')}</section>
  <div class="air-lab-grid">${airDesignPanel('a','FRIENDLY DESIGN')}<section class="air-versus"><span>VS</span><button class="btn" id="swapAir">⇄ Swap</button><button class="btn" id="copyAir">Copy A → B</button></section>${airDesignPanel('b','ENEMY DESIGN')}</div>
  ${panel('Test conditions',`<div class="air-test-quick"><label>Mission<select id="air-mission"><option value="air_superiority" ${o.mission==='air_superiority'?'selected':''}>Air Superiority</option><option value="cas" ${o.mission==='cas'?'selected':''}>Close Air Support</option><option value="naval_strike" ${o.mission==='naval_strike'?'selected':''}>Naval Strike</option></select></label><label>Friendly<input id="air-countA" type="number" min="1" value="${o.countA}"></label><span class="versus-small">VS</span><label>Enemy<input id="air-countB" type="number" min="1" value="${o.countB}"></label></div><details class="advanced-settings"><summary>Advanced air-combat assumptions</summary><div class="field-grid compact-fields"><label>Sorties<input id="air-sorties" type="number" min="100" step="100" value="${o.sorties}"></label><label>A Mission Eff.<input id="air-missionEfficiencyA" type="number" min=".1" max="1.25" step=".05" value="${o.missionEfficiencyA}"></label><label>B Mission Eff.<input id="air-missionEfficiencyB" type="number" min=".1" max="1.25" step=".05" value="${o.missionEfficiencyB}"></label><label>A Detection<input id="air-detectionA" type="number" min=".1" max="1" step=".05" value="${o.detectionA}"></label><label>B Detection<input id="air-detectionB" type="number" min=".1" max="1" step=".05" value="${o.detectionB}"></label></div></details>`)}
  <section class="air-comparison-report"><div class="air-verdict"><span>COMPARATIVE RESULT</span><h2>${verdict}</h2><p>This is an analytical exchange model using attack/defense, agility, speed, reliability, detection and mission efficiency. Air-to-air exchange remains analytical. Source-slot aircraft data and the recovered 1.19.2 mission-stat corpus are active. Exact NAir executable parity and add_average_stats aggregation semantics remain separately classified rather than presented as source-data uncertainty.</p></div><div class="air-report-metrics"><article><span>KILL RATIO A:B</span><strong>${kill}</strong><small>${fmt(r.lossB,2)} enemy / ${fmt(r.lossA,2)} friendly losses</small></article><article><span>IC EXCHANGE</span><strong>${exchange}:1</strong><small>${fmt(r.icLostB,0)} enemy IC / ${fmt(r.icLostA,0)} friendly IC lost</small></article><article><span>AIR POWER SHARE</span><strong>${fmt(r.airPowerShareA,1)}%</strong><small>friendly analytical share</small></article><article><span>${esc(effA.label)}</span><strong>${fmt(effA.score,2)}</strong><small>enemy ${fmt(effB.score,2)} · mission blocks A/B ${effA.appliedBlocks}/${effB.appliedBlocks} · ${effA.completeness}</small></article></div></section>
  ${panel('Design economics',`<div class="air-economics"><div><span>FRIENDLY</span><b>${esc(a.name)}</b><strong>${fmt(a.buildCost,2)} IC</strong><small>${fmt(1000/a.buildCost,1)} aircraft / 1,000 IC</small></div><div><span>ENEMY</span><b>${esc(b.name)}</b><strong>${fmt(b.buildCost,2)} IC</strong><small>${fmt(1000/b.buildCost,1)} aircraft / 1,000 IC</small></div></div><p class="notice"><b>Decision rule:</b> do not judge the aircraft only by kill ratio. A more expensive fighter can win tactically and still lose the industrial exchange; the IC exchange metric is intended to expose that trade.</p>`)} `;
  bindAirDesign('a');bindAirDesign('b');
  $('swapAir').onclick=()=>{[state.airLab.a,state.airLab.b]=[state.airLab.b,state.airLab.a];[state.airLab.countA,state.airLab.countB]=[state.airLab.countB,state.airLab.countA];for(const f of ['small_airframe','medium_airframe'])[state.mioSelections.attacker[f],state.mioSelections.defender[f]]=[state.mioSelections.defender[f],state.mioSelections.attacker[f]];save();shell();};
  $('copyAir').onclick=()=>{state.airLab.b=structuredClone(state.airLab.a);state.airLab.b.name=`Enemy ${state.airLab.a.name}`;save();shell();};
  $('air-mission').onchange=()=>{state.airLab.mission=$('air-mission').value;save();shell();};
  for(const k of ['countA','countB','sorties','missionEfficiencyA','missionEfficiencyB','detectionA','detectionB'])$('air-'+k).onchange=()=>{state.airLab[k]=+$('air-'+k).value;ensureAirState();save();shell();};
}

function factoryPips(active,requested){
  const total=Math.min(20,Math.max(0,Math.floor(requested||0))),on=Math.min(total,Math.max(0,Math.floor(active||0)));
  return `<div class="factory-pips" title="${active} active / ${requested} assigned">${Array.from({length:total},(_,i)=>`<i class="${i<on?'active':'queued'}"></i>`).join('')}${requested>20?`<b>+${requested-20}</b>`:''}</div>`;
}
function productionStockMap(){const out={};for(const g of state.productionGoals||[])out[g.type]=Math.max(0,+g.stock||0);return out;}
function stockGoal(type){let g=state.productionGoals.find(x=>x.type===type);if(!g){g={type,stock:0,target:0,factories:0,priority:3};state.productionGoals.push(g);}return g;}
function advisorCombatBand(){return uncertaintyBand(aggregate('attacker'),aggregate('defender'),battleOpts(),state.intelUncertainty,Math.min(180,state.battlefield.runs));}
function industryVerdict(band,issues){
  // Prerequisite issues are informational in 0.15.0: theorycrafted designs remain fully analyzable.
  if(band.adverse.winRate>=60)return {tone:'go',code:'MASS',title:'Mass production justified',copy:'The current Lab design remains favorable against the adverse enemy estimate. Optimize industry around fielding complete copies and replacement depth.'};
  if(band.base.winRate>=60&&band.adverse.winRate>=45)return {tone:'warn',code:'LIMITED',title:'Produce cautiously',copy:'The design works in the base case but loses too much margin when the enemy estimate is wrong. Build a limited force while improving the template or battlefield conditions.'};
  return {tone:'stop',code:'REDESIGN',title:'Do not mass-produce this design',copy:'Your current Lab matchup is too weak to justify committing the bulk of military industry. Improve the division first, then return here for allocation.'};
}
function advisorRow(row,need,eqTable=equipment){
  const eq=eqTable[row.type],coverage=row.divisionEquivalents||0,whole=Math.floor(coverage),partial=(coverage-whole)*100;
  const pressure=Object.entries(row.resourceRequired||{}).filter(([,v])=>v>0).map(([r,req])=>{const used=row.resourceUsed?.[r]||0;return `<span class="resource-chip ${used+1e-9<req?'short':''}">${r.toUpperCase()} ${fmt(used,1)}/${fmt(req,1)}</span>`;}).join('');
  return `<article class="advisor-line ${row.resourceFactor<.999?'constrained':''}"><div class="advisor-eq"><span class="equipment-badge">${(eq?.name||row.type).slice(0,2).toUpperCase()}</span><div><b>${esc(eq?.name||row.type)}</b><small>${fmt(need,0)} per division · ${fmt((eq?.cost||0)*need,0)} IC/div</small></div></div><div><span class="advisor-label">RECOMMENDED MIC</span><strong class="advisor-mic">${row.effectiveFactories}</strong>${factoryPips(row.effectiveFactories,row.effectiveFactories)}</div><div class="advisor-output"><span>Current stock <b>${fmt(row.stock,0)}</b></span><span>Produced by deadline <b>+${fmt(row.produced,0)}</b></span><span>Output/day <b>${fmt(row.daily,2)}</b></span></div><div class="advisor-coverage"><div><span>FORCE COVERAGE</span><b>${fmt(coverage,2)} div</b></div><div class="mini-track"><i style="width:${clamp(partial,0,100)}%"></i></div><small>${whole} complete + ${fmt(partial,0)}% toward next</small></div><div class="advisor-resources">${pressure||'<span class="resource-chip">NO STRATEGIC RESOURCE</span>'}<small>${pct((row.resourceFactor||0)*100)} line efficiency from resources</small></div></article>`;
}
function production(c){
  const need=division('attacker').need||{},stocks=productionStockMap(),issues=techProblems('attacker');
  const eqTable=equipmentForSide('attacker'),plan=optimizeForceProduction(need,stocks,state.production,eqTable),band=advisorCombatBand(),verdict=industryVerdict(band,issues);
  const complete=Math.floor(plan.fieldable||0),nextPct=((plan.fieldable||0)-complete)*100,icPerDivision=divisionEquipmentIC(need,eqTable);
  const totalDailyIC=(plan.lines||[]).reduce((sum,row)=>sum+(Number(row.daily)||0)*(Number(eqTable[row.type]?.cost)||0),0);
  const bottleneck=(plan.rows||[]).slice().sort((a,b)=>a.divisionEquivalents-b.divisionEquivalents)[0];
  c.innerHTML=`<section class="tool-head operational-head"><div><p class="eyebrow">ARMAMENTS MINISTRY · IC ALLOCATION</p><h1>What Should I Build?</h1><p>Use the current Division Lab design and enemy test to decide whether the template deserves mass production, then allocate available military industry to maximize complete fieldable divisions.</p></div><div class="order-status ${verdict.tone}"><span>PRODUCTION ORDER</span><b>${verdict.code}</b></div></section>
  <section class="industry-verdict ${verdict.tone}"><div><span>GENERAL STAFF RECOMMENDATION</span><h2>${verdict.title}</h2><p>${verdict.copy}</p></div><div class="industry-combat"><small>BASE / ADVERSE WIN</small><strong>${pct(band.base.winRate)} <i>/</i> ${pct(band.adverse.winRate)}</strong><span>vs current Division Lab defender</span></div></section>
  <div class="industry-summary"><article><span>FIELDABLE BY DEADLINE</span><strong>${fmt(plan.fieldable,2)}</strong><small>${complete} complete · target ${Math.max(1,+state.labDemandCount||1)} divisions</small></article><article><span>EQUIPMENT IC / DIVISION</span><strong>${fmt(icPerDivision,0)}</strong><small>material cost before replacement losses</small></article><article><span>AVAILABLE MIC</span><strong>${state.production.factories}</strong><small>${fmt(totalDailyIC,1)} effective IC/day at average efficiency</small></article><article><span>NEXT FACTORY</span><strong>${esc(eqTable[plan.nextFactory?.type]?.name||'—')}</strong><small>${bottleneck?`${esc(eqTable[bottleneck.type]?.name||bottleneck.type)} is current bottleneck`:'No equipment demand'}</small></article></div>
  <details class="industry-settings"><summary><span>INDUSTRIAL SETUP</span><b>${state.production.factories} MIC · ${state.production.days} days · ${Math.max(1,+state.labDemandCount||1)} target divisions</b><em>resources & stockpiles</em></summary><div class="drawer-body"><div class="grid two">
    ${panel('Industrial assumptions',`<div class="field-grid"><label>Planning horizon (days)<input id="p-days" type="number" min="1" value="${state.production.days}"></label><label>Target field divisions<input id="p-targetDivisions" type="number" min="1" value="${Math.max(1,+state.labDemandCount||1)}"></label><label>Military factories<input id="p-factories" type="number" min="0" value="${state.production.factories}"></label><label>Starting efficiency %<input id="p-efficiency" type="number" min="0" max="200" value="${state.production.efficiency}"></label><label>Efficiency growth %<input id="p-efficiencyGain" type="number" min="0" step="5" value="${state.production.efficiencyGain}"></label><label>Efficiency cap %<input id="p-maxEfficiency" type="number" min="1" max="200" value="${state.production.maxEfficiency}"></label><label>Factory output bonus %<input id="p-outputBonus" type="number" step="1" value="${state.production.outputBonus}"></label><label>Energy satisfaction %<input id="p-energySatisfaction" type="number" min="0" max="100" step="1" value="${state.production.energySatisfaction}"></label></div><p class="muted"><b>1.19.2 energy model:</b> MIC output interpolates from 3.5 IC/day at 0% energy to 4.5 at 100%. Positive factory-output bonuses scale with energy satisfaction. Enter the effective in-game energy satisfaction here; the planner does not invent a country-wide coal balance from incomplete factory/law data.</p><div class="projection"><div><span>End efficiency</span><strong>${pct((plan.efficiency?.end||0)*100)}</strong></div><div><span>Average efficiency</span><strong>${pct((plan.efficiency?.average||0)*100)}</strong></div><div><span>Allocated MIC</span><strong>${plan.usedFactories}/${state.production.factories}</strong></div></div>`)}
    ${panel('Strategic resources',`<div class="resource-inputs">${RESOURCES.map(r=>`<label>${r}<input data-resource="${r}" type="number" min="0" value="${state.production.resources[r]??0}"></label>`).join('')}</div>`)}
  </div>${panel('Current stockpiles',`<div class="stock-grid">${Object.entries(need).map(([type,q])=>`<label><span>${esc(eqTable[type]?.name||type)}</span><small>${fmt(q,0)} needed/div</small><input data-stock-type="${type}" type="number" min="0" value="${stocks[type]||0}"></label>`).join('')}</div>`)}</div></details>
  ${panel('Recommended factory allocation',`<div class="advisor-lines">${(plan.rows||[]).sort((a,b)=>b.effectiveFactories-a.effectiveFactories).map(r=>advisorRow(r,need[r.type],eqTable)).join('')}</div><p class="notice"><b>Optimization objective:</b> maximize fully equipped copies of the current Lab division by the deadline. The recommendation balances bottlenecks rather than maximizing raw equipment count. ${plan.nextFactory?.type?`If you gain one additional MIC, assign it to <b>${esc(eqTable[plan.nextFactory.type]?.name||plan.nextFactory.type)}</b>.`:''}</p>`)}
  ${state.lastBattle?panel('Replacement burden',`<div class="replacement-advisor"><div><span>LAST MODELED ENGAGEMENT</span><strong>${fmt(replacementIC(state.lastBattle.attackerEquipmentLosses),0)} IC</strong><small>estimated material replacement</small></div><div class="loss-list">${equipmentLossList(state.lastBattle.attackerEquipmentLosses)}</div></div><p class="muted">This is shown as operational reserve pressure rather than silently mixed into new-division production. A later pass can optimize sustained campaign replacement rates separately.</p>`):''}
  ${issues.length?panel('Lab conflicts',`<div class="staff-list">${issues.map(x=>`<article class="staff-warning"><b>TECH</b><div><strong>${esc(x)}</strong><span>Informational prerequisite only; the theorycrafted unit remains selectable and its selected equipment tier still feeds this industrial estimate.</span></div></article>`).join('')}</div>`):''}`;
  ['days','factories','efficiency','efficiencyGain','maxEfficiency','outputBonus','energySatisfaction'].forEach(k=>{$('p-'+k).onchange=()=>{state.production[k]=+$('p-'+k).value;save();shell();};});
  $('p-targetDivisions').onchange=()=>{state.labDemandCount=Math.max(1,+$('p-targetDivisions').value||1);save();shell();};
  document.querySelectorAll('[data-resource]').forEach(el=>el.onchange=()=>{state.production.resources[el.dataset.resource]=+el.value||0;save();shell();});
  document.querySelectorAll('[data-stock-type]').forEach(el=>el.onchange=()=>{stockGoal(el.dataset.stockType).stock=Math.max(0,+el.value||0);save();shell();});
}

function front(c){
  const band=combatBand(),equip=productionReadiness(),low=band.adverse.winRate,base=band.base.winRate;
  const supply=clamp(state.battlefield.asupply*100,0,100),airScore=clamp((state.battlefield.air+1)*50,0,100),planning=clamp(state.battlefield.planning*100,0,100);
  const verdict=equip>=80&&low>=60?['PROCEED TO FINAL PREPARATION','go','GREEN']:equip>=60&&base>=55?['CONTINUE PREPARATION','warn','AMBER']:['HOLD OFFENSIVE','stop','RED'];
  const issues=[];
  if(equip<80)issues.push(['INDUSTRY',`Equipment readiness is ${equip}%`,'Raise priority or extend the production horizon.']);
  if(low<60)issues.push(['COMBAT',`Adverse combat case wins only ${pct(low)}`,'Increase margin before committing the operation.']);
  if(state.battlefield.asupply<.8)issues.push(['SUPPLY','Attacker supply is below 80%','Improve the route, hubs or motorization before attack.']);
  if(state.battlefield.air<0)issues.push(['AIR','Enemy air superiority is modeled','Contest the air zone or add AA before committing.']);
  if(state.lastBattle&&state.lastBattle.attackerCasualtyRate>20)issues.push(['LOSSES',`Last modeled battle costs ${pct(state.lastBattle.attackerCasualtyRate)} strength`,'Confirm replacement stock and operational reserves.']);
  const staffRows=issues.length?issues.map(([code,title,note])=>`<article class="staff-warning"><b>${code}</b><div><strong>${title}</strong><span>${note}</span></div></article>`).join(''):'<article class="staff-clear"><b>✓</b><div><strong>No modeled critical blockers</strong><span>Maintain reserves and verify assumptions before execution.</span></div></article>';
  c.innerHTML=`<section class="tool-head operational-head"><div><p class="eyebrow">GENERAL STAFF · OPERATION ORDER</p><h1>${esc(state.operation)}</h1><p>${esc(state.objective)}</p></div><div class="order-status ${verdict[1]}"><span>STAFF STATUS</span><b>${verdict[2]}</b></div></section>
    <section class="operations-board"><div class="operations-verdict ${verdict[1]}"><div><span>GO / NO-GO RECOMMENDATION</span><h2>${verdict[0]}</h2><p>Decision uses the adverse enemy estimate, industrial readiness and current battlefield inputs—not the optimistic case alone.</p></div><div class="operations-score"><small>ADVERSE WIN</small><strong>${pct(low)}</strong><span>base ${pct(base)}</span></div></div>
    <div class="readiness-strip">${readinessMeter('Combat robustness',low,'adverse enemy estimate',low>=60?'good':low>=45?'warn':'stop')}${readinessMeter('Equipment',equip,'goal-weighted industry',equip>=80?'good':equip>=60?'warn':'stop')}${readinessMeter('Supply',supply,'attacking force',supply>=80?'good':supply>=60?'warn':'stop')}${readinessMeter('Air control',airScore,state.battlefield.air===0?'contested':state.battlefield.air>0?'friendly advantage':'enemy advantage',airScore>=60?'good':airScore>=40?'warn':'stop')}${readinessMeter('Planning',planning,'preparedness bonus',planning>=50?'good':planning>=25?'warn':'')}</div></section>
    <div class="grid front-grid">${panel('Staff assessment',`<div class="staff-list">${staffRows}</div>`,'staff-panel')}${panel('Battle plan inputs',`<div class="orders-form"><label><span>Terrain</span><select id="f-terrain">${Object.entries(terrain).map(([k,v])=>`<option value="${k}" ${k===state.battlefield.terrain?'selected':''}>${v.name}</option>`).join('')}</select></label><label><span>Extra attack axes</span><input id="f-directions" type="number" min="0" value="${state.battlefield.directions}"></label><label><span>Attacker supply</span><input id="f-asupply" type="number" min="0" max="1" step=".05" value="${state.battlefield.asupply}"></label><label><span>Air superiority</span><input id="f-air" type="number" min="-1" max="1" step=".05" value="${state.battlefield.air}"></label><label><span>Planning bonus</span><input id="f-planning" type="number" min="0" max="1" step=".05" value="${state.battlefield.planning}"></label><label><span>CAS support</span><input id="f-cas" type="number" min="0" max="1" step=".05" value="${state.battlefield.cas}"></label></div>`,'orders-panel')}</div>
    ${panel('Enemy estimate robustness',`<div class="intel-band"><article><span>FAVORABLE</span><strong>${pct(band.favorable.winRate)}</strong><small>enemy weaker</small></article><article class="base"><span>ESTIMATE</span><strong>${pct(band.base.winRate)}</strong><small>current observed case</small></article><article class="adverse"><span>ADVERSE</span><strong>${pct(band.adverse.winRate)}</strong><small>enemy stronger</small></article></div><p class="muted">Operational doctrine: a plan that only works against the favorable estimate is treated as fragile.</p>`,'robustness-panel')}`;
  ['terrain','directions','asupply','air','planning','cas'].forEach(k=>{$('f-'+k).onchange=()=>{state.battlefield[k]=k==='terrain'?$('f-'+k).value:+$('f-'+k).value;save();shell();};});
}

function intel(c){
  const band=combatBand(),d=division('defender'),confidence=clamp(100-state.intelUncertainty*100,40,100);
  const keyStats=[['ORG',fmt(d.org,1)],['SOFT',fmt(d.soft,1)],['HARD',fmt(d.hard,1)],['DEF',fmt(d.def,1)],['ARMOR',fmt(d.armor,1)],['PIERCE',fmt(d.piercing,1)],['WIDTH',fmt(d.width,0)],['MP',fmt(d.manpower,0)]];
  const interpretation=band.adverse.winRate>=60?['ROBUST','The offensive remains favorable under the adverse estimate. Intelligence error is unlikely to reverse the modeled decision.','good']:band.base.winRate>=60?['FRAGILE','The base case is favorable, but a stronger-than-estimated enemy can reverse the result. Build more margin before commitment.','warn']:['UNFAVORABLE','The current enemy estimate already leaves too little combat margin. Improve the plan before relying on better intelligence.','stop'];
  c.innerHTML=`<section class="tool-head intel-head"><div><p class="eyebrow">INTELLIGENCE DIRECTORATE · ENEMY ESTIMATE</p><h1>Intel</h1><p>Model the uncertainty around what you think the enemy has—not imaginary perfect information.</p></div><div class="intel-confidence"><small>ESTIMATE CONFIDENCE</small><b>${fmt(confidence,0)}%</b></div></section>
  <div class="grid intel-grid">${panel('Enemy division dossier',`<div class="dossier-head"><div class="dossier-emblem">?</div><div><span>OBSERVED TEMPLATE</span><h3>${esc(state.defenderName||'Enemy Division')}</h3><small>${state.defenderDivisions} committed division${state.defenderDivisions===1?'':'s'}</small></div></div><div class="dossier-stats">${keyStats.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div><p class="muted">These are the current modeled defender values from Division Lab. They are an estimate, not hidden-game truth.</p>`,'dossier-panel')}${panel('Confidence controls',`<div class="uncertainty-control"><div><span>Enemy-stat uncertainty</span><b id="uncertaintyReadout">±${Math.round(state.intelUncertainty*100)}%</b></div><input id="intelUncertainty" type="range" min="0" max="0.6" step="0.05" value="${state.intelUncertainty}"><div class="uncertainty-scale"><span>High confidence</span><span>Low confidence</span></div></div><p class="notice">Stress testing scales enemy attack, defense, organization, HP, armor and piercing together. It is deliberately conservative and does not pretend to reconstruct hidden intelligence mechanics.</p>`,'confidence-panel')}</div>
  ${panel('Combat intelligence range',`<div class="intel-band large"><article><span>ENEMY WEAKER</span><strong>${pct(band.favorable.winRate)}</strong><small>${pct(band.favorable.drawRate)} unresolved</small></article><article class="base"><span>CURRENT ESTIMATE</span><strong>${pct(band.base.winRate)}</strong><small>${pct(band.base.drawRate)} unresolved</small></article><article class="adverse"><span>ENEMY STRONGER</span><strong>${pct(band.adverse.winRate)}</strong><small>${pct(band.adverse.drawRate)} unresolved</small></article></div><div class="intel-judgement ${interpretation[2]}"><span>STAFF JUDGEMENT</span><b>${interpretation[0]}</b><p>${interpretation[1]}</p></div>`,'intel-range-panel')}`;
  $('intelUncertainty').oninput=()=>{$('uncertaintyReadout').textContent=`±${Math.round(+$('intelUncertainty').value*100)}%`;};
  $('intelUncertainty').onchange=()=>{state.intelUncertainty=+$('intelUncertainty').value;save();shell();};
}

function data(c){
  const pack=state.dataPack,meta=pack?.meta;
  const snapshot=pack?.equipment?equipmentSnapshot(pack,state.dataSnapshotYear):[];
  const inheritedWarnings=snapshot.filter(x=>x.item?.inheritanceWarning).length;
  const coverage=pack?[
    ['Sub-units',meta?.subUnitCount||0,dataPackStatus.battalionOverrides+dataPackStatus.supportOverrides],
    ['Equipment records',meta?.equipmentCount||0,0],
    ['Equipment modules',meta?.moduleCount||0,0],
    ['MIO organizations',meta?.mioCount||0,meta?.mioCount||0],
    ['Terrain records',meta?.terrainCount||0,dataPackStatus.terrainOverrides],
    ['Combat defines',Object.keys(pack.defines?.NMilitary||{}).length,dataPackStatus.combatCount],
    ['Production defines',Object.keys(pack.defines?.NProduction||{}).length,dataPackStatus.productionCount]
  ]:[];
  c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">VERSIONED INPUTS</p><h1>Data Packs</h1><p>Import your own HOI4 common files locally in the browser. The planner stores a compact normalized pack and only applies fields it can interpret safely.</p></div>${badge(pack?'Imported pack active':'Public baseline',pack?'good':'')}</section>
  ${pack?panel('Active pack',`<div class="version-card"><strong>${meta?.sourceFiles||0} source files</strong><span>${meta?.createdAt?new Date(meta.createdAt).toLocaleString():'Imported'}</span></div><div class="metric-grid compact-metrics"><article class="metric"><span>Sub-units</span><strong>${meta?.subUnitCount||0}</strong><small>${dataPackStatus.battalionOverrides+dataPackStatus.supportOverrides} safe structural overrides</small></article><article class="metric"><span>Equipment</span><strong>${meta?.equipmentCount||0}</strong><small>${meta?.moduleCount||0} designer modules parsed</small></article><article class="metric"><span>MIOs</span><strong>${meta?.mioCount||0}</strong><small>country/equipment organizations available in Lab, Tank & Air</small></article><article class="metric"><span>Terrain</span><strong>${meta?.terrainCount||0}</strong><small>${dataPackStatus.terrainOverrides} widths applied</small></article><article class="metric"><span>Defines</span><strong>${Object.values(pack.defines||{}).reduce((n,x)=>n+Object.keys(x||{}).length,0)}</strong><small>${dataPackStatus.combatCount+dataPackStatus.productionCount} mechanics applied</small></article></div><div class="table-wrap compact-table"><table><thead><tr><th>Category</th><th>Parsed</th><th>Applied now</th></tr></thead><tbody>${coverage.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td><td>${x[2]}</td></tr>`).join('')}</tbody></table></div><div class="actions"><button class="btn" id="exportPack">Export normalized pack</button><button class="btn danger" id="clearPack">Clear imported pack</button></div>${meta?.warnings?.length?`<p class="notice warn"><b>${meta.warnings.length} parser warnings.</b> Export the normalized pack to inspect them.</p>`:''}`):panel('No imported pack',`<p>The planner is currently using its built-in ${MODEL_META.gameVersion} public-data baseline.</p><p class="muted">Nothing is uploaded to a server by this page; browser file inputs are parsed client-side and the normalized result is saved in local storage.</p>`)}
  ${pack&&snapshot.length?panel('Equipment lineage preview',`<div class="version-card"><div><strong>Equipment snapshot · ${state.dataSnapshotYear}</strong><p class="muted">Resolved through imported archetype/parent inheritance. This is a diagnostic preview; equipment stats are not yet injected into battalion combat values.</p></div><label>Snapshot year<input id="dataSnapshotYear" type="number" min="1910" max="2100" value="${state.dataSnapshotYear}"></label></div>${inheritedWarnings?`<p class="notice warn">${inheritedWarnings} selected equipment families carry inheritance warnings. Export the normalized pack before relying on them.</p>`:''}<div class="table-wrap compact-table"><table><thead><tr><th>Family</th><th>Selected model</th><th>Year</th><th>Variants</th><th>IC</th><th>Reliability</th><th>Soft</th><th>Hard</th><th>Defense</th><th>Piercing</th></tr></thead><tbody>${snapshot.slice(0,80).map(x=>`<tr><td>${esc(x.family)}</td><td>${esc(x.item.id)}</td><td>${fmt(x.item.year,0)}</td><td>${x.variants}</td><td>${fmt(x.item.cost,2)}</td><td>${x.item.reliability===undefined?'—':pct(x.item.reliability*100)}</td><td>${fmt(x.item.soft,1)}</td><td>${fmt(x.item.hard,1)}</td><td>${fmt(x.item.def,1)}</td><td>${fmt(x.item.piercing,1)}</td></tr>`).join('')}</tbody></table></div>${snapshot.length>80?`<p class="muted">Showing first 80 of ${snapshot.length} equipment families.</p>`:''}`):''}
  <div class="grid two">${panel('Import a common folder',`<label class="drop-zone">Select HOI4 <b>common</b> folder<input id="folderImport" type="file" multiple webkitdirectory directory></label><p class="muted">Best option on desktop. Select the game’s <code>common</code> directory or a smaller folder such as <code>common/units</code> or <code>common/defines</code>.</p>`)}${panel('Import selected files',`<label class="drop-zone">Select .txt / .lua files<input id="fileImport" type="file" accept=".txt,.lua,text/plain" multiple></label><p class="muted">Useful for smaller targeted imports. Unit, equipment, terrain and defines files are recognized.</p>`)}</div>
  ${panel('Importer policy',`<div class="check-grid"><span>✓ Parses Clausewitz key/value script</span><span>✓ Parses NDefines Lua constants</span><span>✓ Normalizes sub-unit structure</span><span>✓ Normalizes equipment records</span><span>✓ Normalizes tank/aircraft equipment modules</span><span>✓ Parses country-specific MIO organizations & traits</span><span>✓ Applies safe width/org/HP/manpower data</span><span>✓ Applies recognized combat/production defines</span></div><p class="notice">Equipment/module definitions and MIO organizations are parsed, including country restrictions, trait dependencies, equipment bonuses and production modifiers. Imported MIOs can already affect land equipment, tank variants and aircraft variants. The built-in tank/air module catalogs remain transparent analytical baselines until imported chassis/module compatibility can be resolved safely end-to-end.</p>`)} `;
  if($('dataSnapshotYear'))$('dataSnapshotYear').onchange=()=>{state.dataSnapshotYear=Math.max(1910,Math.floor(+$('dataSnapshotYear').value||1940));save();location.reload();};
  const importFiles=async files=>{
    if(!files?.length)return;
    const view=$('view');view.insertAdjacentHTML('afterbegin','<div id="importBusy" class="notice">Parsing selected game data…</div>');
    try{const next=await buildExtendedDataPack(files);if(!next.meta.sourceFiles)throw new Error('No supported HOI4 text files were recognized.');state.dataPack=next;save();location.reload();}
    catch(error){$('importBusy')?.remove();alert(`Data-pack import failed: ${error?.message||error}`);}
  };
  $('folderImport').onchange=e=>importFiles(e.target.files);$('fileImport').onchange=e=>importFiles(e.target.files);
  if($('exportPack'))$('exportPack').onclick=()=>downloadJSON(`hoi4-data-pack-${MODEL_META.gameVersion}.json`,pack);
  if($('clearPack'))$('clearPack').onclick=()=>{if(confirm('Return to the bundled vanilla 1.19.2 baseline?')){state.dataPack=null;save();location.reload();}};
}

function scenario(c){
  c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">SCENARIO CONTROL</p><h1>Scenario</h1><p>Manage the full planner state and see exactly what is modeled versus approximate.</p></div>${badge(`Schema ${state.schema}`)}</section>
  <div class="grid two">${panel('Campaign',`<div class="field-grid"><label>Country<input id="s-country" value="${esc(state.country)}"></label><label>Operation<input id="s-operation" value="${esc(state.operation)}"></label></div><label>Objective<textarea id="s-objective" rows="4">${esc(state.objective)}</textarea></label><div class="actions"><button class="primary" id="saveState">Save locally</button><button class="btn" id="exportState">Export JSON</button><label class="btn file">Import JSON<input id="importState" type="file" accept="application/json" hidden></label><button class="btn danger" id="resetState">Reset</button></div>`)}${panel('Version lock',`<div class="version-card"><strong>HOI4 ${MODEL_META.gameVersion}</strong><span>Planner ${MODEL_META.appVersion}</span></div><p>${MODEL_META.label}</p><p class="notice">This release is intentionally locked to the supplied vanilla HOI4 1.19.2 game files. Newer patch data is not mixed into the 0.16.0 model.</p>`)}</div>
  ${panel('Implemented systems',`<div class="check-grid"><span>✓ Target-hardness attack mix</span><span>✓ Defense vs breakthrough roles</span><span>✓ Weighted armor & piercing</span><span>✓ Support-company org/HP/manpower</span><span>✓ Partial piercing approximation</span><span>✓ Terrain-specific combat width</span><span>✓ Extra-flank width</span><span>✓ Over-width & stacking penalties</span><span>✓ Entrenchment attack + defense</span><span>✓ Fort + flanking interaction</span><span>✓ River penalties</span><span>✓ Supply effects</span><span>✓ Air-superiority defense/breakthrough penalty</span><span>✓ CAS support input</span><span>✓ Planning & night inputs</span><span>✓ Aggregate reserve depth</span><span>✓ Attack-level Monte Carlo outcomes</span><span>✓ Reproducible simulation seeds</span><span>✓ Monte Carlo confidence intervals</span><span>✓ Battle equipment-loss estimates</span><span>✓ Enemy uncertainty band</span><span>✓ IC/day production</span><span>✓ Efficiency growth curve</span><span>✓ Per-factory resource penalties</span><span>✓ Division Lab → industry demand</span><span>✓ Factory optimizer</span><span>✓ Lab-integrated tech & doctrine profiles</span><span>✓ HOI-style 5×5 division designer</span><span>✓ 1.19 regimental-support baseline</span><span>✓ Template migration/import/export</span><span>✓ Local game-file data packs</span><span>✓ Clausewitz + defines parser</span><span>✓ Equipment inheritance + year snapshots</span><span>✓ Staged 1.19 land doctrine + mastery tracks</span><span>✓ Staged air doctrine + mastery tracks</span><span>✓ Country/equipment MIO assignment</span><span>✓ MIO combat + production modifiers</span><span>✓ Tank variant designer → Division Lab + Industry</span><span>✓ Air Lab aircraft designer + IC exchange</span><span>✓ Airframe MIOs → Air Lab + IC cost</span><span>✓ Equipment/MIO importer baseline</span><span>✓ Zero-dependency static build</span></div>`)}
  ${panel('Known limits',`<p class="muted">${state.dataPack?'<b>Imported structural data is active.</b> ':''}Not yet executable-parity: some combat-tactic/counter resolution, true per-division reinforcement timing and coordination, exact CAS direct damage, commander traits, weather, experience, some executable-only regimental/module compatibility semantics, executable-parity air combat, every national/DLC MIO special case, and broad mod compatibility. The 1.19.2 files are bundled; behavior that only lives in hoi4.exe remains conservative and explicitly analytical.</p>`)} `;
  $('s-country').onchange=()=>{state.country=$('s-country').value;save();}; $('s-operation').onchange=()=>{state.operation=$('s-operation').value;save();shell();}; $('s-objective').onchange=()=>{state.objective=$('s-objective').value;save();};
  $('saveState').onclick=()=>{if(save())alert('Scenario saved locally.');}; $('exportState').onclick=()=>downloadJSON('war-planner-scenario.json',serializableState());
  $('importState').onchange=e=>{const f=e.target.files[0];if(f)readJSON(f,x=>{if(!x||typeof x!=='object'||Array.isArray(x)){alert('Invalid scenario JSON.');return;}state=deepMerge(defaults,x);state.schema=defaults.schema;ensureDesignerState('attacker');ensureDesignerState('defender');if(save())location.reload();});};
  $('resetState').onclick=()=>{if(confirm('Reset all planner data?')){state=structuredClone(defaults);state.schema=defaults.schema;if(save())location.reload();}};
}

window.addEventListener('hashchange',shell); shell();

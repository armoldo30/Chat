import { MODEL_META, RESOURCES, COMBAT_CONSTANTS, PRODUCTION_CONSTANTS, equipment, armyTemplates, battalions, supports, terrain, rolePresets } from './data.js';
import { fmt, evaluateProduction, optimizeProduction, buildDemand, mergeGoals, calcDivision, aggregateDivision, simulateBattle, compareTerrains, uncertaintyBand, readinessScore, scoreDivision, researchEstimate, clamp } from './engine.js';
import { buildDataPack, safeStructuralOverrides, defineOverrides, equipmentSnapshot } from './parser.js';
import { DESIGNER_COLS, DESIGNER_ROWS, blankGrid, normalizeGrid, countsToGrid, gridToCounts, filledInRegiment, fillRegiment, regimentGroup as gridRegimentGroup, canPlaceBattalion } from './designer.js';

const STORAGE='hoi4-war-planner-v5',LEGACY_STORAGE='hoi4-war-planner-v4';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const panel=(title,body,extra='')=>`<section class="panel ${extra}"><div class="panel-head"><h2>${title}</h2></div>${body}</section>`;
const pct=n=>`${fmt(n,1)}%`;
const badge=(text,tone='')=>`<span class="badge ${tone}">${text}</span>`;
const readinessMeter=(label,value,detail='',tone='')=>{const v=clamp(Number(value)||0,0,100);return `<div class="readiness-meter ${tone}"><div class="meter-copy"><span>${esc(label)}</span><b>${fmt(v,0)}%</b></div><div class="meter-track"><i style="width:${v}%"></i></div>${detail?`<small>${esc(detail)}</small>`:''}</div>`;};
const addDaysISO=(date,days)=>{const d=new Date(`${date}T00:00:00Z`);if(Number.isNaN(d.getTime()))return '—';d.setUTCDate(d.getUTCDate()+Math.ceil(Number(days)||0));return d.toISOString().slice(0,10);};
function researchSchedule(){
  const slotCount=Math.max(1,Math.min(10,Math.floor(+state.researchSlots||1))),available=Array(slotCount).fill(0),out=[];
  const items=state.research.map((x,i)=>({i,x,days:Math.ceil(researchEstimate({baseDays:x.baseDays,speedBonus:(x.speedBonus||0)/100,aheadPenalty:x.aheadPenalty}))}))
    .sort((a,b)=>(+b.x.priority||0)-(+a.x.priority||0)||a.i-b.i);
  for(const item of items){
    let slot=0;for(let i=1;i<available.length;i++)if(available[i]<available[slot])slot=i;
    const start=available[slot],finish=start+item.days;available[slot]=finish;out[item.i]={...item,slot:slot+1,start,finish};
  }
  return out;
}

const defaults={
  schema:5,country:'Germany',operation:'Operation Iron Compass',objective:'Prepare an offensive that can survive the worst plausible enemy case.',
  attacker:[{type:'infantry',count:9},{type:'artillery',count:1}],attackerSupports:['engineer','support_artillery','support_aa'],attackerDivisions:3,attackerName:'Assault Division',
  defender:[{type:'infantry',count:10}],defenderSupports:['engineer','support_artillery'],defenderDivisions:3,defenderName:'Defensive Division',
  attackerRegimentalSupports:[null,null,null,null,null],defenderRegimentalSupports:[null,null,null,null,null],
  battlefield:{terrain:'plains',directions:0,entrench:20,fort:0,river:0,asupply:1,dsupply:1,air:0,cas:0,planning:.30,night:0,runs:500,seed:1944},
  intelUncertainty:.20,role:'assault',lastBattle:null,dataPack:null,dataSnapshotYear:1940,
  includeLabDemand:true,labDemandCount:24,armyDemand:[],
  production:{days:180,factories:30,efficiency:50,efficiencyGain:100,maxEfficiency:100,outputBonus:0,baseFactoryOutput:4.5,resources:{steel:60,aluminum:20,rubber:20,tungsten:15,chromium:5}},
  productionGoals:[
    {type:'infantry_equipment',stock:5000,target:25000,factories:12,priority:5},
    {type:'artillery',stock:300,target:2200,factories:6,priority:4},
    {type:'support_equipment',stock:500,target:2500,factories:4,priority:4},
    {type:'fighter',stock:100,target:700,factories:8,priority:3}
  ],
  researchDate:'1939-01-01',researchSlots:4,
  research:[
    {name:'Industry technology',baseDays:170,speedBonus:10,aheadPenalty:1,priority:5},
    {name:'Land doctrine milestone',baseDays:220,speedBonus:5,aheadPenalty:1,priority:4}
  ]
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
function load(){try{const raw=JSON.parse(localStorage.getItem(STORAGE)||localStorage.getItem(LEGACY_STORAGE)||'null');const next=deepMerge(defaults,raw);next.schema=5;return next;}catch{return structuredClone(defaults);}}
let state=load();
const BASE_REGIMENTAL_SUPPORTS=['regimental_infantry_guns','regimental_at','regimental_aa'];
const BASE_DIVISIONAL_SUPPORTS=Object.keys(supports).filter(k=>!BASE_REGIMENTAL_SUPPORTS.includes(k));
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
function validRegimentalSupports(side){ensureDesignerState(side);return state[side+'RegimentalSupports'].filter((key,c)=>key&&filledInRegiment(state[side+'Grid'],c)>=3&&regimentalBaselineCompatible(side,c));}
function syncDesignerSide(side){ensureDesignerState(side);state[side]=gridToCounts(state[side+'Grid'],Object.keys(battalions));}
ensureDesignerState('attacker');ensureDesignerState('defender');
let activeDesignerSide='attacker',designerPick=null;
let dataPackStatus={battalionOverrides:0,supportOverrides:0,terrainOverrides:0,combatCount:0,productionCount:0};
function applyCurrentDataPack(){
  if(!state.dataPack)return dataPackStatus;
  dataPackStatus={...safeStructuralOverrides(state.dataPack,battalions,supports,terrain),...defineOverrides(state.dataPack,COMBAT_CONSTANTS,PRODUCTION_CONSTANTS)};
  return dataPackStatus;
}
applyCurrentDataPack();
function save(){localStorage.setItem(STORAGE,JSON.stringify(state));}
function route(){const r=location.hash.replace('#','');return ['dashboard','battle','production','front','research','intel','data','scenario'].includes(r)?r:'dashboard';}
function downloadJSON(name,obj){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function readJSON(file,cb){const r=new FileReader();r.onload=()=>{try{cb(JSON.parse(r.result));}catch{alert('Invalid JSON file.');}};r.readAsText(file);}

function division(side){ensureDesignerState(side);return calcDivision(gridToCounts(state[side+'Grid'],Object.keys(battalions)),battalions,[...state[side+'Supports'],...validRegimentalSupports(side)],supports);}
function aggregate(side){return aggregateDivision(division(side),state[side+'Divisions']);}
function battleOpts(){return {...state.battlefield,terrainData:terrain};}
function addDemandMap(a,b){const out={...a};for(const [k,v] of Object.entries(b||{}))out[k]=(out[k]||0)+v;return out;}
function labDemand(){if(!state.includeLabDemand)return {};const n=Math.max(0,Math.floor(+state.labDemandCount||0)),need=division('attacker').need||{},out={};for(const [k,v] of Object.entries(need))out[k]=v*n;return out;}
function totalDemand(){return addDemandMap(buildDemand(armyTemplates,state.armyDemand),labDemand());}
function mergedGoals(){return mergeGoals(state.productionGoals,totalDemand());}
function productionEval(){return evaluateProduction(mergedGoals(),state.production,equipment);}
function replacementIC(losses){return Object.entries(losses||{}).reduce((sum,[k,q])=>sum+(equipment[k]?.cost||0)*(+q||0),0);}
function equipmentLossList(losses){const rows=Object.entries(losses||{}).filter(([,q])=>q>0.05).sort((a,b)=>b[1]-a[1]);return rows.length?rows.map(([k,q])=>`<span><b>${equipment[k]?.name||k}</b> ${fmt(q,0)}</span>`).join(''):'<span>No material loss estimate available.</span>';}
function applyLastBattleReplacement(){if(!state.lastBattle||state.lastBattle.applied)return;for(const [type,q] of Object.entries(state.lastBattle.attackerEquipmentLosses||{})){if(q<=0)continue;let g=state.productionGoals.find(x=>x.type===type);if(!g){g={type,stock:0,target:0,factories:0,priority:3};state.productionGoals.push(g);}g.target=Math.max(+g.target||0,+g.stock||0)+Math.ceil(q);}state.lastBattle.applied=true;save();shell();}
function productionReadiness(){
  const goals=mergedGoals(),p=productionEval();
  const total=goals.reduce((s,g)=>s+Math.max(0,(+g.target||0)-(+g.stock||0))*(+g.priority||1),0);
  return total?Math.round(clamp((1-p.shortage/total)*100,0,100)):100;
}
function combatBand(){return uncertaintyBand(aggregate('attacker'),aggregate('defender'),battleOpts(),state.intelUncertainty,Math.min(350,state.battlefield.runs));}
function battleFingerprint(){
  ensureDesignerState('attacker');ensureDesignerState('defender');
  return JSON.stringify({a:state.attackerGrid,as:state.attackerSupports,ar:state.attackerRegimentalSupports,an:state.attackerDivisions,d:state.defenderGrid,ds:state.defenderSupports,dr:state.defenderRegimentalSupports,dn:state.defenderDivisions,b:state.battlefield});
}
function lastBattlePreview(){
  const r=state.lastBattle;if(!r)return '<p>Execute the simulation to generate an outcome report.</p>';
  const stale=!r.fingerprint||r.fingerprint!==battleFingerprint();
  return `<div class="saved-battle ${stale?'stale':'current'}"><div><span class="eyebrow">${stale?'STALE RESULT · INPUTS CHANGED':'CURRENT RESULT'}</span><h3>${pct(r.winRate)} attacker win probability</h3><p>${fmt(r.avgHours,0)} h expected · ${pct(r.attackerCasualtyRate)} attacker strength loss · seed ${r.seed??'random'}</p></div><span class="battle-state">${stale?'RERUN REQUIRED':'UP TO DATE'}</span></div>`;
}

function shell(){
  const nav=[['dashboard','HQ','Command'],['battle','DIV','Division Lab'],['production','MIC','Production'],['front','OPS','Front Planner'],['research','R&D','Research'],['intel','INT','Intel'],['data','DAT','Data Packs'],['scenario','CFG','Scenario']];
  const active=route();
  document.title=`${state.operation} · HOI4 War Planner`;
  document.body.innerHTML=`<div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#dashboard"><span class="brand-mark">★</span><span><b>GENERAL STAFF</b><small>HOI4 War Planner</small></span></a>
      <nav>${nav.map(([r,code,n])=>`<a href="#${r}" class="${active===r?'active':''}"><span class="nav-code">${code}</span><span>${n}</span></a>`).join('')}</nav>
      <div class="side-meta"><span>${MODEL_META.gameVersion}</span><small>${MODEL_META.appVersion}</small></div>
    </aside>
    <main><header class="topbar"><div><span class="kicker">${esc(state.country)}</span><b>${esc(state.operation)}</b></div><div class="top-actions">${badge(`Game ${MODEL_META.gameVersion}`,'good')}${badge('Public-data baseline')}</div></header><div id="view" class="view"></div></main>
  </div>`;
  render(active);
}
function render(r){const v=$('view');({dashboard,battle,production,front,research,intel,data,scenario}[r]||dashboard)(v);}

function dashboard(c){
  const band=combatBand(),prod=productionEval(),ready=readinessScore(mergedGoals(),prod,band.adverse.winRate),industry=productionReadiness();
  const a=division('attacker'),d=division('defender'),supply=clamp(state.battlefield.asupply*100,0,100),airScore=clamp((state.battlefield.air+1)*50,0,100);
  const posture=ready>=75?['FINAL PREPARATION','go']:ready>=55?['BUILD COMBAT MARGIN','warn']:['HOLD OPERATION','stop'];
  const battleState=state.lastBattle?(!state.lastBattle.fingerprint||state.lastBattle.fingerprint!==battleFingerprint()?'STALE':'CURRENT'):'NO REPORT';
  c.innerHTML=`<section class="command-hero"><div class="command-title"><p class="eyebrow">GENERAL STAFF · THEATRE COMMAND</p><h1>${esc(state.operation)}</h1><p>${esc(state.objective)}</p><div class="command-tags">${badge(esc(state.country))}${badge(`HOI4 ${MODEL_META.gameVersion}`,'good')}${badge(state.dataPack?'Imported data':'Public baseline',state.dataPack?'good':'')}</div></div><div class="command-readiness ${posture[1]}"><small>OPERATION READINESS</small><strong>${ready}</strong><span>${posture[0]}</span></div></section>
  <section class="war-room-strip">${readinessMeter('Adverse combat',band.adverse.winRate,'enemy stronger',band.adverse.winRate>=60?'good':band.adverse.winRate>=45?'warn':'stop')}${readinessMeter('Industry',industry,'equipment goals',industry>=80?'good':industry>=60?'warn':'stop')}${readinessMeter('Supply',supply,'attacking force',supply>=80?'good':supply>=60?'warn':'stop')}${readinessMeter('Air control',airScore,state.battlefield.air>0?'friendly advantage':state.battlefield.air<0?'enemy advantage':'contested',airScore>=60?'good':airScore>=40?'warn':'stop')}</section>
  <div class="war-room-grid">
    ${panel('Operation order',`<div class="hq-posture ${posture[1]}"><span>STAFF RECOMMENDATION</span><h2>${posture[0]}</h2><p>${ready>=75?'The modeled plan has enough adverse-case and industrial margin to enter final preparation.':ready>=55?'The operation is plausible but remains sensitive to combat or supply assumptions. Increase margin before execution.':'Current combat/industrial readiness does not justify commitment.'}</p><a class="btn" href="#front">Open Front Planner →</a></div>`,'hq-order-panel')}
    ${panel('Land forces',`<div class="hq-force"><div><span>ATTACKER</span><b>${esc(state.attackerName)}</b><small>${state.attackerDivisions} divisions · ${fmt(a.width,0)}w · ${fmt(a.org,0)} org</small></div><div><span>ENEMY ESTIMATE</span><b>${esc(state.defenderName)}</b><small>${state.defenderDivisions} divisions · ${fmt(d.width,0)}w · ${fmt(d.org,0)} org</small></div></div><div class="hq-stat-pair"><div><span>Base win</span><b>${pct(band.base.winRate)}</b></div><div><span>Adverse win</span><b>${pct(band.adverse.winRate)}</b></div><div><span>Attacker armor</span><b>${fmt(a.armor,1)}</b></div><div><span>Enemy piercing</span><b>${fmt(d.piercing,1)}</b></div></div><a class="btn" href="#battle">Open Division Lab →</a>`,'hq-forces-panel')}
    ${panel('Industrial command',`<div class="hq-industry"><div><small>FACTORIES ACTIVE</small><strong>${prod.usedFactories}</strong><span>of ${state.production.factories}</span></div><div><small>READINESS</small><strong>${industry}%</strong><span>${fmt(prod.shortage,0)} weighted shortage</span></div></div><div class="resource-ledger">${RESOURCES.map(r=>`<span><b>${r.toUpperCase()}</b>${fmt(state.production.resources[r]||0,0)}</span>`).join('')}</div><a class="btn" href="#production">Open Production →</a>`,'hq-industry-panel')}
    ${panel('Latest combat report',`<div class="hq-report ${battleState==='STALE'?'stale':''}"><span>${battleState}</span>${state.lastBattle?`<h3>${pct(state.lastBattle.winRate)} attacker win</h3><p>${fmt(state.lastBattle.avgHours,0)} h expected · ${pct(state.lastBattle.attackerCasualtyRate)} attacker strength loss · ${fmt(replacementIC(state.lastBattle.attackerEquipmentLosses),0)} IC replacement</p>`:'<h3>No simulation recorded</h3><p>Build the opposing templates and execute a battle to create an operational report.</p>'}</div><a class="btn" href="#battle">${state.lastBattle?'Review battle →':'Run simulation →'}</a>`,'hq-report-panel')}
  </div>
  <section class="staff-sections"><a href="#research"><span>R&D</span><div><b>Research Staff</b><small>${state.researchSlots} slots · ${state.research.length} queued items</small></div></a><a href="#intel"><span>INT</span><div><b>Intelligence</b><small>±${Math.round(state.intelUncertainty*100)}% enemy uncertainty</small></div></a><a href="#data"><span>DAT</span><div><b>Data Packs</b><small>${state.dataPack?'Imported game data active':'Built-in 1.19.2 baseline'}</small></div></a><a href="#scenario"><span>CFG</span><div><b>Scenario Control</b><small>Schema ${state.schema} · local persistence</small></div></a></section>
  <p class="model-footnote">${MODEL_META.confidence}. Player-designed tank and aircraft stats remain representative until exact game files or explicit designs are imported.</p>`;
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
function regimentalBaselineCompatible(side,c){return regimentGroup(side,c)==='infantry';}
function templateIC(stats){return replacementIC(stats.need||{});}
function designerStatGroups(s){
  const groups=[
    ['BASE STATS',[['Organization',s.org,1],['HP',s.hp,1],['Manpower',s.manpower,0],['Combat Width',s.width,0],['Supply Use',s.supply,2]]],
    ['COMBAT STATS',[['Soft Attack',s.soft,1],['Hard Attack',s.hard,1],['Defense',s.def,1],['Breakthrough',s.breakthrough,1],['Air Attack',s.airAttack,1]]],
    ['ARMOR',[['Armor',s.armor,1],['Piercing',s.piercing,1],['Hardness',s.hardness*100,0,'%']]]
  ];
  return groups.map(([name,vals])=>`<section class="hoi-stat-section"><h4>${name}</h4>${vals.map(([k,v,d,suf=''])=>`<div><span>${k}</span><b>${fmt(v,d)}${suf}</b></div>`).join('')}</section>`).join('');
}
function designerMainStrip(s){
  const items=[['Combat Width',fmt(s.width,0)],['Organization',fmt(s.org,1)],['HP',fmt(s.hp,1)],['Manpower',fmt(s.manpower,0)],['Supply',fmt(s.supply,2)]];
  return `<div class="designer-main-stats">${items.map(([k,v])=>`<span><small>${k}</small><b>${v}</b></span>`).join('')}</div>`;
}
function equipmentSummary(stats){
  const rows=Object.entries(stats.need||{}).filter(([,q])=>q>0);
  return rows.length?rows.map(([k,q])=>`<span><b>${esc(equipment[k]?.name||k)}</b><em>${fmt(q,0)}</em></span>`).join(''):'<span><b>No equipment</b><em>0</em></span>';
}
function designerCostBand(stats){
  const rows=Object.entries(stats.need||{}).filter(([,q])=>q>0),ic=templateIC(stats);
  return `<div class="designer-cost-band"><div><span class="eyebrow">EQUIPMENT REQUIREMENTS</span><div class="cost-chips">${rows.length?rows.slice(0,6).map(([k,q])=>`<span><b>${esc(equipment[k]?.name||k)}</b>${fmt(q,0)}</span>`).join(''):'<span><b>No equipment</b>0</span>'}</div></div><div class="cost-total"><small>Estimated production cost</small><strong>${fmt(ic,0)} IC</strong></div></div>`;
}
function pickerBattalionMeta(key){
  const u=battalions[key];if(!u)return '';
  const ic=templateIC({need:u.need||{}});
  return `<span class="picker-meta"><em>${fmt(u.width,0)}w</em><em>${fmt(u.org,0)} org</em><em>${fmt(u.soft,0)} SA</em>${u.armor?`<em>${fmt(u.armor,0)} arm</em>`:''}${u.piercing?`<em>${fmt(u.piercing,0)} pierce</em>`:''}<em>${fmt(ic,0)} IC</em></span>`;
}
function pickerSupportMeta(key){
  const u=supports[key];if(!u)return '';
  const ic=templateIC({need:u.need||{}});
  return `<span class="picker-meta"><em>${fmt(u.soft||0,0)} SA</em><em>${fmt(u.def||0,0)} DEF</em>${u.piercing?`<em>${fmt(u.piercing,0)} pierce</em>`:''}<em>${fmt(ic,0)} IC</em></span>`;
}
function supportSlot(side,i){
  const key=state[side+'Supports'][i];
  if(!key)return `<button class="hoi-support-slot empty" data-sslot="${i}" title="Add support company"><span>+</span><small>Support</small></button>`;
  return `<button class="hoi-support-slot filled tone-${battalionTone(key)}" data-sslot="${i}" title="${esc(supports[key]?.name||key)}"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}</small></button>`;
}
function regimentalSupportSlot(side,c,filled){
  const key=state[side+'RegimentalSupports'][c],group=regimentGroup(side,c);
  if(filled<3)return `<button class="regimental-support locked" disabled title="Requires at least 3 line battalions in this regiment"><span>◆</span><small>Requires 3 battalions</small></button>`;
  if(group!=='infantry')return `<button class="regimental-support locked" disabled title="Built-in baseline only models leg weapon support for infantry-group regiments. Import 1.19 game data for additional compatibility rules."><span>◆</span><small>${group||'Unknown'} support locked</small></button>`;
  if(!key)return `<button class="regimental-support available" data-rslot="${c}" title="Add regimental support"><span>+</span><small>Regimental support</small></button>`;
  return `<button class="regimental-support available filled tone-${battalionTone(key)}" data-rslot="${c}" title="${esc(supports[key]?.name||key)}"><span>${SUPPORT_CODES[key]||'SUP'}</span><small>${esc(supports[key]?.name||key)}</small></button>`;
}
function regimentColumn(side,c){
  const grid=state[side+'Grid'],filled=filledInRegiment(grid,c);
  const group=regimentGroup(side,c);return `<div class="hoi-regiment"><div class="regiment-title"><span>REGIMENT ${c+1}${group?` · ${group.toUpperCase()}`:''}</span><b>${filled}/5</b></div><div class="regiment-slots">${grid[c].map((type,r)=>type?`<button class="hoi-battalion-slot filled tone-${battalionTone(type)}" data-bslot="1" data-c="${c}" data-r="${r}" title="${esc(battalions[type].name)}"><span class="unit-symbol">${BATTALION_CODES[type]||'BAT'}</span><small>${esc(battalions[type].name)}</small></button>`:`<button class="hoi-battalion-slot empty" data-bslot="1" data-c="${c}" data-r="${r}" title="Add battalion"><span>+</span><small>Add</small></button>`).join('')}</div>${regimentalSupportSlot(side,c,filled)}</div>`;
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
    return `<div class="hoi-picker"><div class="picker-head"><div><span class="eyebrow">MAKE A SELECTION</span><h3>Support Companies</h3></div><button class="btn" data-cancel-pick>Back</button></div><div class="picker-grid"><button class="picker-choice remove-choice" data-choice="">×<small>Empty slot</small></button>${BASE_DIVISIONAL_SUPPORTS.map(k=>[k,supports[k]]).map(([k,v])=>`<button class="picker-choice" data-choice="${k}" ${(used.has(k)&&k!==current)?'disabled':''}><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(v.name)}</small>${pickerSupportMeta(k)}</button>`).join('')}</div></div>`;
  }
  if(designerPick.kind==='regimental'){
    return `<div class="hoi-picker"><div class="picker-head"><div><span class="eyebrow">MAKE A SELECTION</span><h3>Regimental Support</h3><p class="muted">Conservative 1.19 baseline: weapon support only. Imported game data will expand the full company list and exact regiment compatibility.</p></div><button class="btn" data-cancel-pick>Back</button></div><div class="picker-grid"><button class="picker-choice remove-choice" data-choice="">×<small>Empty slot</small></button>${BASE_REGIMENTAL_SUPPORTS.map(k=>`<button class="picker-choice tone-fire" data-choice="${k}"><b>${SUPPORT_CODES[k]||'SUP'}</b><small>${esc(supports[k]?.name||k)}</small>${pickerSupportMeta(k)}</button>`).join('')}</div></div>`;
  }
  const lockedGroup=designerPick.fillRegiment?null:regimentGroup(side,designerPick.c,designerPick.r);
  return `<div class="hoi-picker"><div class="picker-head"><div><span class="eyebrow">MAKE A SELECTION</span><h3>Change or add battalion</h3><p class="muted">${lockedGroup?`Regiment locked to ${lockedGroup.toUpperCase()} group. `:''}Shift-click a choice to replace the full regiment.</p></div><button class="btn" data-cancel-pick>Back</button></div>${Object.entries(battalionGroups).map(([name,ids])=>{const allowed=ids.filter(k=>battalions[k]&&(!lockedGroup||battalions[k].group===lockedGroup));return allowed.length?`<section class="picker-group"><h4>${name}</h4><div class="picker-grid">${allowed.map(k=>`<button class="picker-choice tone-${battalionTone(k)}" data-choice="${k}"><b>${BATTALION_CODES[k]||'BAT'}</b><small>${esc(battalions[k].name)}</small>${pickerBattalionMeta(k)}</button>`).join('')}</div></section>`:'';}).join('')}<button class="picker-choice remove-choice wide" data-choice="">× <small>Remove battalion</small></button></div>`;
}
function renderDivisionDesigner(side){
  ensureDesignerState(side);const stats=division(side),other=side==='attacker'?'defender':'attacker';
  return `<section class="hoi-designer panel ${side}">
    <div class="designer-topbar"><div class="division-ident"><span class="division-counter">${side==='attacker'?'A':'D'}</span><div><span class="eyebrow">${side.toUpperCase()} TEMPLATE</span><input class="template-name" id="designerName" value="${esc(state[side+'Name'])}" aria-label="Template name"></div></div><label class="compact-label">Committed divisions<input id="designerDivisions" type="number" min="1" max="30" value="${state[side+'Divisions']}"></label></div>
    <div class="hoi-designer-layout">
      <div class="regiment-board"><div class="board-label"><span>COMBAT BATTALIONS</span><small>5 regiments · 5 battalions each · Shift-click a slot to fill its regiment</small></div>${designerMainStrip(stats)}<div class="regiment-grid">${Array.from({length:5},(_,c)=>regimentColumn(side,c)).join('')}</div><div class="regimental-label"><span>REGIMENTAL SUPPORT</span><small>1.19 structure · requires 3 battalions in the regiment</small></div>${designerCostBand(stats)}</div>
      <aside class="support-rail"><div class="rail-title">DIVISION SUPPORT</div>${Array.from({length:5},(_,i)=>supportSlot(side,i)).join('')}</aside>
      <aside class="designer-stats"><div class="stats-title">DIVISION STATS</div>${designerStatGroups(stats)}<section class="hoi-stat-section equipment-cost"><h4>EQUIPMENT DETAIL</h4><div class="equipment-mini">${equipmentSummary(stats)}</div></section></aside>
    </div>
    ${designerPicker(side)}
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

function battle(c){
  ensureDesignerState('attacker');ensureDesignerState('defender');
  const a=division('attacker'),d=division('defender'),selected=division(activeDesignerSide),preset=rolePresets[state.role],coach=scoreDivision(selected,preset);
  c.innerHTML=`<section class="tool-head hoi-tool-head"><div><p class="eyebrow">LAND FORCES · TEMPLATE DESIGNER</p><h1>Division Lab</h1><p>Build templates in an HOI-style regiment grid, then test them against terrain, supply, air, forts and uncertain enemy strength.</p></div>${badge(`Vanilla ${MODEL_META.gameVersion}`,'good')}</section>
  <div class="designer-tabs"><button class="${activeDesignerSide==='attacker'?'active':''}" data-designer-side="attacker"><span>ATTACKER</span><b>${fmt(a.width,0)}w · ${fmt(a.org,0)} org</b></button><button class="${activeDesignerSide==='defender'?'active':''}" data-designer-side="defender"><span>DEFENDER</span><b>${fmt(d.width,0)}w · ${fmt(d.org,0)} org</b></button><button class="swap-tab" id="swapSides">⇄ <span>Swap forces</span></button></div>
  ${renderDivisionDesigner(activeDesignerSide)}
  <div class="grid two battle-controls">
    ${panel('Battlefield',`<div class="field-grid">
      <label>Terrain<select id="b-terrain">${Object.entries(terrain).map(([k,v])=>`<option value="${k}" ${k===state.battlefield.terrain?'selected':''}>${v.name} · ${v.width}+${v.reinforceWidth}</option>`).join('')}</select></label>
      <label>Extra attack directions<input id="b-directions" type="number" min="0" max="5" value="${state.battlefield.directions}"></label>
      <label>Defender entrenchment<input id="b-entrench" type="number" min="0" max="100" value="${state.battlefield.entrench}"></label>
      <label>Fort level<input id="b-fort" type="number" min="0" max="10" value="${state.battlefield.fort}"></label>
      <label>River<select id="b-river"><option value="0" ${+state.battlefield.river===0?'selected':''}>None</option><option value="0.3" ${+state.battlefield.river===.3?'selected':''}>Small · -30%</option><option value="0.6" ${+state.battlefield.river===.6?'selected':''}>Large · -60%</option></select></label>
      <label>Attacker supply<input id="b-asupply" type="number" min="0" max="1" step=".05" value="${state.battlefield.asupply}"></label>
      <label>Defender supply<input id="b-dsupply" type="number" min="0" max="1" step=".05" value="${state.battlefield.dsupply}"></label>
      <label>Air superiority (-1 to 1)<input id="b-air" type="number" min="-1" max="1" step=".05" value="${state.battlefield.air}"></label>
      <label>Attacker CAS support (0–1)<input id="b-cas" type="number" min="0" max="1" step=".05" value="${state.battlefield.cas}"></label>
      <label>Planning bonus (0–1)<input id="b-planning" type="number" min="0" max="1" step=".05" value="${state.battlefield.planning}"></label>
      <label>Night fraction (0–1)<input id="b-night" type="number" min="0" max="1" step=".1" value="${state.battlefield.night}"></label>
      <label>Simulation runs<input id="b-runs" type="number" min="50" max="5000" step="50" value="${state.battlefield.runs}"></label>
      <label>Simulation seed<input id="b-seed" type="number" step="1" value="${state.battlefield.seed}"></label>
    </div><div class="actions"><button class="primary" id="simulate">Execute simulation</button><button class="btn" id="terrains">Compare terrain</button></div>`,'hoi-control-panel')}
    ${panel('Template coach',`<label>Doctrine role<select id="role">${Object.entries(rolePresets).map(([k,v])=>`<option value="${k}" ${state.role===k?'selected':''}>${v.name}</option>`).join('')}</select></label><div class="coach"><strong>${fmt(coach.score,0)}</strong><span>${activeDesignerSide} role score</span></div><div class="compare-cards"><div><span>ATTACKER</span><b>${fmt(a.soft)} SA · ${fmt(a.breakthrough)} BRK</b><small>${fmt(a.armor)} armor · ${fmt(a.piercing)} piercing</small></div><div><span>DEFENDER</span><b>${fmt(d.soft)} SA · ${fmt(d.def)} DEF</b><small>${fmt(d.armor)} armor · ${fmt(d.piercing)} piercing</small></div></div><p class="muted">Role scoring is a design heuristic. Combat simulation remains the decision tool.</p>`,'hoi-control-panel')}
  </div>
  ${panel('Width packing guide',`${widthPackingTable(selected)}<p class="muted">Guide shown for the currently selected template. Exact reinforcement behavior is resolved by the battle model.</p>`)}
  ${panel('Battle report',`<div id="battleResult" class="result">${lastBattlePreview()}</div>`,'battle-report-panel')}
  `;
  document.querySelectorAll('[data-designer-side]').forEach(el=>el.onclick=()=>{activeDesignerSide=el.dataset.designerSide;designerPick=null;shell();});
  bindDivisionDesigner(activeDesignerSide);
  $('swapSides').onclick=()=>{[state.attackerGrid,state.defenderGrid]=[state.defenderGrid,state.attackerGrid];[state.attackerSupports,state.defenderSupports]=[state.defenderSupports,state.attackerSupports];[state.attackerRegimentalSupports,state.defenderRegimentalSupports]=[state.defenderRegimentalSupports,state.attackerRegimentalSupports];[state.attackerDivisions,state.defenderDivisions]=[state.defenderDivisions,state.attackerDivisions];syncDesignerSide('attacker');syncDesignerSide('defender');designerPick=null;save();shell();};
  $('role').onchange=()=>{state.role=$('role').value;save();shell();};
  ['terrain','directions','entrench','fort','river','asupply','dsupply','air','cas','planning','night','runs','seed'].forEach(id=>{$('b-'+id).onchange=()=>{state.battlefield[id]=id==='terrain'?$('b-'+id).value:+$('b-'+id).value;save();};});
  $('simulate').onclick=()=>showBattle(false);$('terrains').onclick=()=>showBattle(true);
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

function factoryPips(active,requested){
  const total=Math.min(20,Math.max(0,Math.floor(requested||0))),on=Math.min(total,Math.max(0,Math.floor(active||0)));
  return `<div class="factory-pips" title="${active} active / ${requested} requested">${Array.from({length:total},(_,i)=>`<i class="${i<on?'active':'queued'}"></i>`).join('')}${requested>20?`<b>+${requested-20}</b>`:''}</div>`;
}
function productionLineCard(g,q,i){
  const need=Math.max(0,(+g.target||0)-(+g.stock||0)),completion=need<=0?100:clamp((q.produced/Math.max(1,need))*100,0,100),eta=q.daily>0?Math.ceil(need/q.daily):Infinity;
  const pressure=Object.entries(q.resourceRequired||{}).filter(([,v])=>v>0).map(([r,req])=>{const used=q.resourceUsed?.[r]||0;return `<span class="resource-chip ${used+1e-9<req?'short':''}">${r.toUpperCase()} ${fmt(used,1)}/${fmt(req,1)}</span>`;}).join('');
  return `<article class="production-line ${q.resourceFactor<.999?'constrained':''}"><div class="prod-equipment"><span class="equipment-badge">${(equipment[g.type]?.name||g.type).slice(0,2).toUpperCase()}</span><div><select data-g-type="${i}">${Object.entries(equipment).map(([k,v])=>`<option value="${k}" ${g.type===k?'selected':''}>${v.name}</option>`).join('')}</select><small>${pressure||'No strategic resources'}</small></div></div><div class="prod-factories"><div class="line-label"><span>Factories</span><b>${q.effectiveFactories}/${g.factories||0}</b></div>${factoryPips(q.effectiveFactories,g.factories||0)}<input data-g-fact="${i}" type="number" min="0" value="${g.factories||0}"></div><div class="prod-controls"><label>Stock<input data-g-stock="${i}" type="number" min="0" value="${g.stock||0}"></label><label>Target<input data-g-target="${i}" type="number" min="0" value="${g.target||0}"></label><label>Priority<input data-g-priority="${i}" type="number" min="1" max="10" value="${g.priority||1}"></label></div><div class="prod-output"><div><span>Output / day</span><b>${fmt(q.daily,2)}</b></div><div><span>Resource efficiency</span><b>${pct((q.resourceFactor||0)*100)}</b></div><div><span>ETA</span><b>${Number.isFinite(eta)?`${eta} d`:'—'}</b></div></div><div class="prod-progress"><span style="width:${completion}%"></span></div><div class="prod-footer"><span>${fmt(q.produced,0)} projected · ${fmt(q.shortage,0)} shortage</span><button class="icon danger" data-g-remove="${i}" title="Remove production line">×</button></div></article>`;
}

function production(c){
  const goals=mergedGoals(),p=evaluateProduction(goals,state.production,equipment);
  c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">INDUSTRIAL PLANNING</p><h1>Production</h1><p>Allocate military factories against equipment goals using IC/day, production efficiency and shared strategic-resource constraints.</p></div>${badge(`${productionReadiness()}% ready`,productionReadiness()>=75?'good':'')}</section>
  <div class="grid two">
    ${panel('Scenario',`<div class="field-grid"><label>Days to target<input id="p-days" type="number" min="1" value="${state.production.days}"></label><label>Military factories<input id="p-factories" type="number" min="0" value="${state.production.factories}"></label><label>Starting efficiency %<input id="p-efficiency" type="number" min="0" max="200" value="${state.production.efficiency}"></label><label>Efficiency growth modifier %<input id="p-efficiencyGain" type="number" min="0" step="5" value="${state.production.efficiencyGain}"></label><label>Efficiency cap %<input id="p-maxEfficiency" type="number" min="1" max="200" value="${state.production.maxEfficiency}"></label><label>Factory output bonus %<input id="p-outputBonus" type="number" step="1" value="${state.production.outputBonus}"></label><label>Base MIC output / day<input id="p-baseFactoryOutput" type="number" min="0.1" step="0.1" value="${state.production.baseFactoryOutput}"></label></div><div class="projection"><div><span>End efficiency</span><strong>${pct(p.efficiency.end*100)}</strong></div><div><span>Average efficiency</span><strong>${pct(p.efficiency.average*100)}</strong></div><div><span>Factory load</span><strong>${p.usedFactories}/${state.production.factories}</strong><small>${p.queuedFactories?`${p.queuedFactories} queued`:`${p.unusedFactories} unassigned`}</small></div></div>`)}
    ${panel('Available strategic resources',`<div class="resource-inputs">${RESOURCES.map(r=>`<label>${r}<input data-resource="${r}" type="number" min="0" value="${state.production.resources[r]??0}"></label>`).join('')}</div><p class="muted">Resource requirements are modeled per assigned military factory, not per finished equipment item.</p>`)}
  </div>
  ${panel('Division Lab demand',`<div class="row demand-link"><label class="check"><input id="includeLabDemand" type="checkbox" ${state.includeLabDemand?'checked':''}> Include current attacker template</label><label>Divisions<input id="labDemandCount" type="number" min="0" value="${state.labDemandCount}"></label></div><div class="loss-list">${equipmentLossList(labDemand())}</div><p class="muted">This link updates automatically when the attacker template changes, so industry planning follows the actual Division Lab instead of a disconnected example template.</p>`)}
  ${panel('Additional formation demand',`<div id="armyDemand">${state.armyDemand.map((x,i)=>`<div class="row"><select data-demand-template="${i}">${Object.entries(armyTemplates).map(([k,v])=>`<option value="${k}" ${x.template===k?'selected':''}>${v.name}</option>`).join('')}</select><input data-demand-count="${i}" type="number" min="0" value="${x.count}"><button class="icon danger" data-demand-remove="${i}">×</button></div>`).join('')}</div><div class="actions"><button class="btn" id="addDemand">+ Formation goal</button></div>`)}
  ${state.lastBattle?panel('Last battle replacement',`<div class="loss-list">${equipmentLossList(state.lastBattle.attackerEquipmentLosses)}</div><p><b>${fmt(replacementIC(state.lastBattle.attackerEquipmentLosses),0)} IC</b> estimated replacement burden.</p><button class="btn" id="productionReplacement" ${state.lastBattle.applied?'disabled':''}>${state.lastBattle.applied?'Already added':'Add to production targets'}</button>`):''}
  ${panel('Production lines',`<div class="production-lines">${goals.map((g,i)=>productionLineCard(g,p.lines[i],i)).join('')}</div><div class="actions"><button class="primary" id="optimize">Optimize factories</button><button class="btn" id="addGoal">+ Production line</button></div>`)}
  ${p.queuedFactories?panel('Factory queue',`<p class="notice warn"><b>${p.queuedFactories} requested factories are inactive.</b> Higher-priority lines receive available factories first; reduce assignments or add military factories to activate the queued capacity.</p>`):''}
  ${panel('Resource pressure',`<div class="resource-grid">${RESOURCES.map(r=>{const req=p.resources.required[r]||0,use=p.resources.used[r]||0,avail=state.production.resources[r]||0;return `<div><span>${r}</span><strong>${fmt(use,1)} / ${fmt(req,1)}</strong><small>${fmt(avail,0)} available</small></div>`;}).join('')}</div>`)}
  `;
  ['days','factories','efficiency','efficiencyGain','maxEfficiency','outputBonus','baseFactoryOutput'].forEach(k=>{$('p-'+k).onchange=()=>{state.production[k]=+$('p-'+k).value;save();shell();};});
  document.querySelectorAll('[data-resource]').forEach(el=>el.onchange=()=>{state.production.resources[el.dataset.resource]=+el.value||0;save();shell();});
  $('includeLabDemand').onchange=()=>{state.includeLabDemand=$('includeLabDemand').checked;save();shell();};
  $('labDemandCount').onchange=()=>{state.labDemandCount=Math.max(0,+$('labDemandCount').value||0);save();shell();};
  if($('productionReplacement'))$('productionReplacement').onclick=applyLastBattleReplacement;
  document.querySelectorAll('[data-demand-template]').forEach(el=>el.onchange=()=>{state.armyDemand[+el.dataset.demandTemplate].template=el.value;save();shell();});
  document.querySelectorAll('[data-demand-count]').forEach(el=>el.onchange=()=>{state.armyDemand[+el.dataset.demandCount].count=+el.value||0;save();shell();});
  document.querySelectorAll('[data-demand-remove]').forEach(el=>el.onclick=()=>{state.armyDemand.splice(+el.dataset.demandRemove,1);save();shell();});
  $('addDemand').onclick=()=>{state.armyDemand.push({template:'infantry',count:12});save();shell();};
  const setters=[['type','gType'],['stock','gStock'],['target','gTarget'],['factories','gFact'],['priority','gPriority']];
  setters.forEach(([field,data])=>document.querySelectorAll(`[data-g-${field==='factories'?'fact':field}]`).forEach(el=>el.onchange=()=>{const idx=+el.dataset[data];const actual=findGoalByMergedIndex(goals,idx);if(!actual)return;actual[field]=field==='type'?el.value:+el.value||0;save();shell();}));
  document.querySelectorAll('[data-g-remove]').forEach(el=>el.onclick=()=>{const g=goals[+el.dataset.gRemove];const idx=state.productionGoals.findIndex(x=>x.type===g.type);if(idx>=0)state.productionGoals.splice(idx,1);save();shell();});
  $('addGoal').onclick=()=>{const type=Object.keys(equipment).find(k=>!state.productionGoals.some(g=>g.type===k))||'infantry_equipment';state.productionGoals.push({type,stock:0,target:1000,factories:0,priority:2});save();shell();};
  $('optimize').onclick=()=>{const result=optimizeProduction(goals,state.production,equipment);for(const line of result.lines){let g=state.productionGoals.find(x=>x.type===line.type);if(!g){g={type:line.type,stock:line.stock||0,target:line.target||0,priority:line.priority||1,factories:0};state.productionGoals.push(g);}g.factories=line.factories;}save();shell();};
}
function findGoalByMergedIndex(goals,i){const g=goals[i];if(!g)return null;let own=state.productionGoals.find(x=>x.type===g.type);if(!own){own={...g};state.productionGoals.push(own);}return own;}

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

function research(c){
  const schedule=researchSchedule();
  const rows=state.research.map((x,i)=>{const plan=schedule[i],days=plan?.days??researchEstimate({baseDays:x.baseDays,speedBonus:(x.speedBonus||0)/100,aheadPenalty:x.aheadPenalty}),start=addDaysISO(state.researchDate,plan?.start||0),finish=addDaysISO(state.researchDate,plan?.finish||days);return `<article class="research-card"><div class="research-icon">R${plan?.slot||1}</div><div class="research-main"><div class="research-title"><input data-r-name="${i}" value="${esc(x.name)}"><span class="research-priority">P${x.priority}</span></div><div class="research-dates"><span>Slot <b>${plan?.slot||1}</b></span><span>Start <b>${start}</b></span><span>Finish <b>${finish}</b></span><span>Duration <b>${fmt(days,0)} d</b></span></div><div class="research-controls"><label>Base days<input data-r-base="${i}" type="number" min="1" value="${x.baseDays}"></label><label>Speed bonus %<input data-r-speed="${i}" type="number" step="1" value="${x.speedBonus}"></label><label>Ahead multiplier<input data-r-ahead="${i}" type="number" min="1" step=".05" value="${x.aheadPenalty}"></label><label>Priority<input data-r-priority="${i}" type="number" min="1" max="10" value="${x.priority}"></label></div></div><button class="icon danger research-remove" data-r-remove="${i}">×</button></article>`;}).join('');
  const slotEnds=Array.from({length:Math.max(1,Math.min(10,Math.floor(+state.researchSlots||1)))},(_,i)=>{const inSlot=schedule.filter(x=>x?.slot===i+1),last=inSlot.sort((a,b)=>b.finish-a.finish)[0];return `<div><span>Slot ${i+1}</span><strong>${last?addDaysISO(state.researchDate,last.finish):'Open'}</strong><small>${inSlot.length} queued</small></div>`;}).join('');
  c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">TECH TIMING</p><h1>Research</h1><p>Turn priorities into an actual multi-slot timing plan without inventing a hardcoded 1.19.2 technology database.</p></div>${badge(`${state.researchSlots} slots`)}</section>
  ${panel('Planning setup',`<div class="field-grid"><label>In-game planning date<input id="researchDate" type="date" value="${state.researchDate}"></label><label>Research slots<input id="researchSlots" type="number" min="1" max="10" value="${state.researchSlots}"></label></div><div class="slot-summary">${slotEnds}</div>`)}
  ${panel('Research queue',`<div class="research-queue">${rows}</div><div class="actions"><button class="btn" id="addResearch">+ Research item</button></div><p class="notice">Higher-priority items are scheduled first into the earliest available research slot. Ahead-of-time penalties vary by tech; enter the effective multiplier you want tested until exact technology files are imported.</p>`)} `;
  $('researchDate').onchange=()=>{state.researchDate=$('researchDate').value;save();shell();};
  $('researchSlots').onchange=()=>{state.researchSlots=Math.max(1,Math.min(10,+$('researchSlots').value||1));save();shell();};
  ['name','base','speed','ahead','priority'].forEach(field=>document.querySelectorAll(`[data-r-${field}]`).forEach(el=>el.onchange=()=>{const i=+el.dataset['r'+field[0].toUpperCase()+field.slice(1)];const map={name:'name',base:'baseDays',speed:'speedBonus',ahead:'aheadPenalty',priority:'priority'};state.research[i][map[field]]=field==='name'?el.value:+el.value||0;save();shell();}));
  document.querySelectorAll('[data-r-remove]').forEach(el=>el.onclick=()=>{state.research.splice(+el.dataset.rRemove,1);save();shell();});
  $('addResearch').onclick=()=>{state.research.push({name:'New technology',baseDays:180,speedBonus:0,aheadPenalty:1,priority:3});save();shell();};
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
    ['Terrain records',meta?.terrainCount||0,dataPackStatus.terrainOverrides],
    ['Combat defines',Object.keys(pack.defines?.NMilitary||{}).length,dataPackStatus.combatCount],
    ['Production defines',Object.keys(pack.defines?.NProduction||{}).length,dataPackStatus.productionCount]
  ]:[];
  c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">VERSIONED INPUTS</p><h1>Data Packs</h1><p>Import your own HOI4 common files locally in the browser. The planner stores a compact normalized pack and only applies fields it can interpret safely.</p></div>${badge(pack?'Imported pack active':'Public baseline',pack?'good':'')}</section>
  ${pack?panel('Active pack',`<div class="version-card"><strong>${meta?.sourceFiles||0} source files</strong><span>${meta?.createdAt?new Date(meta.createdAt).toLocaleString():'Imported'}</span></div><div class="metric-grid compact-metrics"><article class="metric"><span>Sub-units</span><strong>${meta?.subUnitCount||0}</strong><small>${dataPackStatus.battalionOverrides+dataPackStatus.supportOverrides} safe structural overrides</small></article><article class="metric"><span>Equipment</span><strong>${meta?.equipmentCount||0}</strong><small>parsed for future stat resolution</small></article><article class="metric"><span>Terrain</span><strong>${meta?.terrainCount||0}</strong><small>${dataPackStatus.terrainOverrides} widths applied</small></article><article class="metric"><span>Defines</span><strong>${Object.values(pack.defines||{}).reduce((n,x)=>n+Object.keys(x||{}).length,0)}</strong><small>${dataPackStatus.combatCount+dataPackStatus.productionCount} mechanics applied</small></article></div><div class="table-wrap compact-table"><table><thead><tr><th>Category</th><th>Parsed</th><th>Applied now</th></tr></thead><tbody>${coverage.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td><td>${x[2]}</td></tr>`).join('')}</tbody></table></div><div class="actions"><button class="btn" id="exportPack">Export normalized pack</button><button class="btn danger" id="clearPack">Clear imported pack</button></div>${meta?.warnings?.length?`<p class="notice warn"><b>${meta.warnings.length} parser warnings.</b> Export the normalized pack to inspect them.</p>`:''}`):panel('No imported pack',`<p>The planner is currently using its built-in ${MODEL_META.gameVersion} public-data baseline.</p><p class="muted">Nothing is uploaded to a server by this page; browser file inputs are parsed client-side and the normalized result is saved in local storage.</p>`)}
  ${pack&&snapshot.length?panel('Equipment lineage preview',`<div class="version-card"><div><strong>Equipment snapshot · ${state.dataSnapshotYear}</strong><p class="muted">Resolved through imported archetype/parent inheritance. This is a diagnostic preview; equipment stats are not yet injected into battalion combat values.</p></div><label>Snapshot year<input id="dataSnapshotYear" type="number" min="1910" max="2100" value="${state.dataSnapshotYear}"></label></div>${inheritedWarnings?`<p class="notice warn">${inheritedWarnings} selected equipment families carry inheritance warnings. Export the normalized pack before relying on them.</p>`:''}<div class="table-wrap compact-table"><table><thead><tr><th>Family</th><th>Selected model</th><th>Year</th><th>Variants</th><th>IC</th><th>Reliability</th><th>Soft</th><th>Hard</th><th>Defense</th><th>Piercing</th></tr></thead><tbody>${snapshot.slice(0,80).map(x=>`<tr><td>${esc(x.family)}</td><td>${esc(x.item.id)}</td><td>${fmt(x.item.year,0)}</td><td>${x.variants}</td><td>${fmt(x.item.cost,2)}</td><td>${x.item.reliability===undefined?'—':pct(x.item.reliability*100)}</td><td>${fmt(x.item.soft,1)}</td><td>${fmt(x.item.hard,1)}</td><td>${fmt(x.item.def,1)}</td><td>${fmt(x.item.piercing,1)}</td></tr>`).join('')}</tbody></table></div>${snapshot.length>80?`<p class="muted">Showing first 80 of ${snapshot.length} equipment families.</p>`:''}`):''}
  <div class="grid two">${panel('Import a common folder',`<label class="drop-zone">Select HOI4 <b>common</b> folder<input id="folderImport" type="file" multiple webkitdirectory directory></label><p class="muted">Best option on desktop. Select the game’s <code>common</code> directory or a smaller folder such as <code>common/units</code> or <code>common/defines</code>.</p>`)}${panel('Import selected files',`<label class="drop-zone">Select .txt / .lua files<input id="fileImport" type="file" accept=".txt,.lua,text/plain" multiple></label><p class="muted">Useful for smaller targeted imports. Unit, equipment, terrain and defines files are recognized.</p>`)}</div>
  ${panel('Importer policy',`<div class="check-grid"><span>✓ Parses Clausewitz key/value script</span><span>✓ Parses NDefines Lua constants</span><span>✓ Normalizes sub-unit structure</span><span>✓ Normalizes equipment records</span><span>✓ Applies safe width/org/HP/manpower data</span><span>✓ Applies recognized combat/production defines</span></div><p class="notice">Equipment-derived attack, defense, armor and piercing are parsed but not blindly applied yet because HOI4 combines sub-unit modifiers, technology and equipment variants. That resolver will use exact imported files rather than guessing.</p>`)} `;
  if($('dataSnapshotYear'))$('dataSnapshotYear').onchange=()=>{state.dataSnapshotYear=Math.max(1910,Math.floor(+$('dataSnapshotYear').value||1940));save();shell();};
  const importFiles=async files=>{
    if(!files?.length)return;
    const view=$('view');view.insertAdjacentHTML('afterbegin','<div id="importBusy" class="notice">Parsing selected game data…</div>');
    try{const next=await buildDataPack(files);if(!next.meta.sourceFiles)throw new Error('No supported HOI4 text files were recognized.');state.dataPack=next;save();location.reload();}
    catch(error){$('importBusy')?.remove();alert(`Data-pack import failed: ${error?.message||error}`);}
  };
  $('folderImport').onchange=e=>importFiles(e.target.files);$('fileImport').onchange=e=>importFiles(e.target.files);
  if($('exportPack'))$('exportPack').onclick=()=>downloadJSON(`hoi4-data-pack-${MODEL_META.gameVersion}.json`,pack);
  if($('clearPack'))$('clearPack').onclick=()=>{if(confirm('Return to the built-in public-data baseline?')){state.dataPack=null;save();location.reload();}};
}

function scenario(c){
  c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">SCENARIO CONTROL</p><h1>Scenario</h1><p>Manage the full planner state and see exactly what is modeled versus approximate.</p></div>${badge(`Schema ${state.schema}`)}</section>
  <div class="grid two">${panel('Campaign',`<div class="field-grid"><label>Country<input id="s-country" value="${esc(state.country)}"></label><label>Operation<input id="s-operation" value="${esc(state.operation)}"></label></div><label>Objective<textarea id="s-objective" rows="4">${esc(state.objective)}</textarea></label><div class="actions"><button class="primary" id="saveState">Save locally</button><button class="btn" id="exportState">Export JSON</button><label class="btn file">Import JSON<input id="importState" type="file" accept="application/json" hidden></label><button class="btn danger" id="resetState">Reset</button></div>`)}${panel('Version lock',`<div class="version-card"><strong>HOI4 ${MODEL_META.gameVersion}</strong><span>Planner ${MODEL_META.appVersion}</span></div><p>${MODEL_META.label}</p><p class="notice">1.19.3 is announced but not yet public as of this model snapshot, so this build does not silently mix future balance changes into the 1.19.2 baseline.</p>`)}</div>
  ${panel('Implemented systems',`<div class="check-grid"><span>✓ Target-hardness attack mix</span><span>✓ Defense vs breakthrough roles</span><span>✓ Weighted armor & piercing</span><span>✓ Support-company org/HP/manpower</span><span>✓ Partial piercing approximation</span><span>✓ Terrain-specific combat width</span><span>✓ Extra-flank width</span><span>✓ Over-width & stacking penalties</span><span>✓ Entrenchment attack + defense</span><span>✓ Fort + flanking interaction</span><span>✓ River penalties</span><span>✓ Supply effects</span><span>✓ Air-superiority defense/breakthrough penalty</span><span>✓ CAS support input</span><span>✓ Planning & night inputs</span><span>✓ Aggregate reserve depth</span><span>✓ Attack-level Monte Carlo outcomes</span><span>✓ Reproducible simulation seeds</span><span>✓ Monte Carlo confidence intervals</span><span>✓ Battle equipment-loss estimates</span><span>✓ Enemy uncertainty band</span><span>✓ IC/day production</span><span>✓ Efficiency growth curve</span><span>✓ Per-factory resource penalties</span><span>✓ Division Lab → industry demand</span><span>✓ Factory optimizer</span><span>✓ Research timing + finish dates</span><span>✓ HOI-style 5×5 division designer</span><span>✓ 1.19 regimental-support baseline</span><span>✓ Template migration/import/export</span><span>✓ Local game-file data packs</span><span>✓ Clausewitz + defines parser</span><span>✓ Equipment inheritance + year snapshots</span><span>✓ Zero-dependency static build</span></div>`)}
  ${panel('Known limits',`<p class="muted">${state.dataPack?'<b>Imported structural data is active.</b> ':''}Not yet executable-parity: combat tactics/counters, true per-division reinforcement timing and coordination, exact CAS direct damage, commander traits, doctrines/mastery, weather, experience, complete exact 1.19.2 equipment/technology data, the full 12-company regimental-support compatibility rules, player-designed tank/air variants, and broad mod compatibility. Those belong in the data-import milestone rather than being faked.</p>`)} `;
  $('s-country').onchange=()=>{state.country=$('s-country').value;save();}; $('s-operation').onchange=()=>{state.operation=$('s-operation').value;save();shell();}; $('s-objective').onchange=()=>{state.objective=$('s-objective').value;save();};
  $('saveState').onclick=()=>{save();alert('Scenario saved locally.');}; $('exportState').onclick=()=>downloadJSON('war-planner-scenario.json',state);
  $('importState').onchange=e=>{const f=e.target.files[0];if(f)readJSON(f,x=>{state=deepMerge(defaults,x);state.schema=5;ensureDesignerState('attacker');ensureDesignerState('defender');save();location.reload();});};
  $('resetState').onclick=()=>{if(confirm('Reset all planner data?')){state=structuredClone(defaults);state.schema=5;save();location.reload();}};
}

window.addEventListener('hashchange',shell); shell();

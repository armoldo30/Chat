import { runGauntlet, gauntletGrade, GAUNTLET_TERRAINS } from './gauntlet.js';

const TERRAIN_ICON={plains:'🌾',forest:'🌲',hills:'⛰️',mountain:'🏔️',jungle:'🌴',marsh:'🪷',desert:'🏜️',urban:'🏙️'};
const TERRAIN_NAME={plains:'Plains',forest:'Forest',hills:'Hills',mountain:'Mountains',jungle:'Jungle',marsh:'Marsh',desert:'Desert',urban:'Urban'};
let selectedSide='attacker',lastResult=null,lastSide=null,lastMode=null,running=false;

function ensureStyle(){if(document.querySelector('link[data-gauntlet-style]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='./src/gauntlet.css';l.dataset.gauntletStyle='1';document.head.append(l);}
const fmt=(n,d=1)=>Number.isFinite(Number(n))?Number(n).toLocaleString(undefined,{maximumFractionDigits:d}):'—';
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const scoreClass=s=>s>=85?'excellent':s>=70?'good':s>=55?'mixed':'poor';
const gradeCard=(label,score,detail='')=>`<div class="gauntlet-grade-card ${scoreClass(score)}"><small>${esc(label)}</small><strong>${gauntletGrade(score)}</strong><b>${fmt(score,1)}</b>${detail?`<span>${esc(detail)}</span>`:''}</div>`;
const meter=(label,score,icon='')=>`<div class="gauntlet-meter"><span class="gauntlet-meter-icon">${icon}</span><div><small>${esc(label)}</small><div class="gauntlet-track"><i style="width:${Math.max(0,Math.min(100,score))}%"></i></div></div><b>${gauntletGrade(score)} · ${fmt(score,0)}</b></div>`;

function resultHtml(r){
  const cat=n=>Number(r.categoryScores?.[n]||0),terrain=GAUNTLET_TERRAINS.filter(k=>r.terrainScores[k]!==undefined);
  return `<section class="gauntlet-result-hero">
    <div class="gauntlet-seal ${scoreClass(r.practicalScore)}"><small>PRACTICAL</small><strong>${r.practicalGrade}</strong><span>${fmt(r.practicalScore,1)}/100</span></div>
    <div class="gauntlet-result-copy"><span class="eyebrow">DIVISION GAUNTLET COMPLETE</span><h2>${fmt(r.opponents,0)} opponent designs · ${fmt(r.matchups,0)} terrain/role matchups</h2><p>Your division outperformed <b>${fmt(r.percentile,1)}%</b> of generated opponent designs across the complete test matrix.</p><div class="gauntlet-result-tags"><span>⚔ Raw Combat ${r.rawGrade} · ${fmt(r.rawScore,1)}</span><span>🎯 P10 ${fmt(r.distribution.p10,1)}</span><span>📦 ${fmt(r.candidateCost,0)} IC</span><span>⛽ ${fmt(r.candidateSupply,2)} supply/day</span></div></div>
  </section>
  <section class="gauntlet-grade-grid">${gradeCard('Raw Combat',r.rawScore,'Pure combat performance')}${gradeCard('Offense',r.offense,'Division attacking')}${gradeCard('Defense',r.defense,'Division defending')}${gradeCard('IC Efficiency',r.icEfficiency,'Combat value per production cost')}${gradeCard('Supply Efficiency',r.supplyEfficiency,'Combat value per supply burden')}${gradeCard('Consistency',r.consistency,'Low matchup variance')}${gradeCard('Terrain Versatility',r.terrainVersatility,'Performance across all terrain')}${gradeCard('Counter Resilience',r.counterResilience,'10th-percentile floor')}</section>
  <div class="gauntlet-two-col">
    <section class="panel gauntlet-panel"><div class="panel-head"><h2>Terrain Board</h2><span>attack + defense combined</span></div><div class="gauntlet-terrain-grid">${terrain.map(k=>`<div class="gauntlet-terrain ${scoreClass(r.terrainScores[k])}"><span>${TERRAIN_ICON[k]||'◈'}</span><div><small>${TERRAIN_NAME[k]||k}</small><strong>${r.terrainGrades[k]}</strong></div><b>${fmt(r.terrainScores[k],0)}</b></div>`).join('')}</div></section>
    <section class="panel gauntlet-panel"><div class="panel-head"><h2>Matchup Classes</h2><span>where the template wins and breaks</span></div><div class="gauntlet-meter-list">${meter('Infantry formations',cat('infantry'),'🪖')}${meter('Armor formations',cat('armor'),'🛡️')}${meter('Mobile formations',cat('mobile'),'🚚')}${meter('Hard counters',cat('counter'),'🎯')}${meter('Hybrid formations',cat('hybrid'),'⚙️')}${meter('Elite formations',cat('elite'),'★')}</div></section>
  </div>
  <div class="gauntlet-two-col">
    <section class="panel gauntlet-panel"><div class="panel-head"><h2>Best Matchups</h2><span>highest family averages</span></div><div class="gauntlet-matchup-list best">${r.bestMatchups.map(x=>`<div><span>▲</span><b>${esc(x.name)}</b><em>${x.grade}</em><strong>${fmt(x.score,1)}</strong></div>`).join('')}</div></section>
    <section class="panel gauntlet-panel"><div class="panel-head"><h2>Worst Matchups</h2><span>priority counters and weaknesses</span></div><div class="gauntlet-matchup-list worst">${r.worstMatchups.map(x=>`<div><span>▼</span><b>${esc(x.name)}</b><em>${x.grade}</em><strong>${fmt(x.score,1)}</strong></div>`).join('')}</div></section>
  </div>
  <section class="panel gauntlet-panel"><div class="panel-head"><h2>Stress Tests</h2><span>not included in the core 16-condition matrix</span></div><div class="gauntlet-stress-grid">${r.stress.map(x=>gradeCard(x.name,x.score)).join('')}</div></section>
  <section class="panel gauntlet-panel gauntlet-validation"><div><span class="eyebrow">SECOND-STAGE VALIDATION</span><h2>${r.validation.samples} extreme scenarios × ${r.validation.runs} seeded stochastic runs</h2><p>The full pool is screened with expected combat math; the most extreme scenarios are then re-run through the stochastic battle simulator. Mean absolute screening difference: <b>${fmt(r.validation.meanDelta,1)} points</b>.</p></div><div class="validation-badge"><small>SCREEN</small><b>${fmt(r.validation.meanScreen,1)}</b><small>STOCHASTIC</small><b>${fmt(r.validation.meanStochastic,1)}</b></div></section>
  <p class="gauntlet-evidence">Evidence boundary: opponent generation, archetype variation, grading weights and practical score are <b>planner analytical</b>. Battles use the certified bounded 1.19.2 combat engine. Oracle work can later replace executable-inferred behavior without changing the Gauntlet structure.</p>`;
}

function shellHtml(api){
  const name=api.name(selectedSide),stats=api.stats(selectedSide),mode=lastMode||'quick';
  return `<section class="gauntlet-hero"><div><span class="eyebrow">DIVISION GAUNTLET · GENERAL STAFF TRIALS</span><h1>Put one division through the entire war.</h1><p>Procedurally generated, plausible HOI4 opponents. Every terrain. Attack and defense. Production and supply matter.</p></div><div class="gauntlet-target"><small>TEST DIVISION</small><strong>${esc(name)}</strong><span>${fmt(stats.width,0)}w · ${fmt(stats.org,1)} org · ${fmt(stats.armor,1)} armor · ${fmt(stats.piercing,1)} piercing</span></div></section>
  <section class="gauntlet-control-panel panel"><div class="gauntlet-side-switch"><button data-gauntlet-side="attacker" class="${selectedSide==='attacker'?'active':''}">⚔ Attacker Template</button><button data-gauntlet-side="defender" class="${selectedSide==='defender'?'active':''}">🛡 Defender Template</button></div><div class="gauntlet-mode-grid"><button data-gauntlet-mode="quick" class="gauntlet-mode ${mode==='quick'?'active':''}"><span>⚡</span><div><b>Quick Gauntlet</b><small>500 opponent designs</small><em>8,000 terrain/role matchups</em></div></button><button data-gauntlet-mode="full" class="gauntlet-mode ${mode==='full'?'active':''}"><span>🏅</span><div><b>Full Gauntlet</b><small>10,000 opponent designs</small><em>160,000 terrain/role matchups</em></div></button></div><button class="btn primary gauntlet-run" id="gauntletRun" ${running?'disabled':''}>${running?'Gauntlet running…':'Run Division Gauntlet'}</button><div class="gauntlet-progress" id="gauntletProgress" ${running?'':'hidden'}><div><i id="gauntletProgressBar"></i></div><span id="gauntletProgressText">Preparing opponent pool…</span></div></section>
  ${lastResult&&lastSide===selectedSide?resultHtml(lastResult):`<section class="gauntlet-empty"><span>🏟️</span><h2>No trial recorded for this template</h2><p>Choose Quick for rapid diagnosis or Full for the launch-grade 10,000-design matrix.</p></section>`}`;
}

export function renderGauntlet(container,api){
  ensureStyle();container.innerHTML=shellHtml(api);
  container.querySelectorAll('[data-gauntlet-side]').forEach(b=>b.onclick=()=>{if(running)return;selectedSide=b.dataset.gauntletSide;renderGauntlet(container,api);});
  let mode=lastMode||'quick';container.querySelectorAll('[data-gauntlet-mode]').forEach(b=>b.onclick=()=>{if(running)return;mode=b.dataset.gauntletMode;lastMode=mode;container.querySelectorAll('[data-gauntlet-mode]').forEach(x=>x.classList.toggle('active',x===b));});
  const run=container.querySelector('#gauntletRun');if(!run)return;
  run.onclick=async()=>{
    if(running)return;running=true;lastMode=mode;run.disabled=true;run.textContent='Gauntlet running…';const progress=container.querySelector('#gauntletProgress'),bar=container.querySelector('#gauntletProgressBar'),text=container.querySelector('#gauntletProgressText');progress.hidden=false;
    try{
      const side=selectedSide,count=mode==='full'?10000:500,data=api.data(side),equipment=api.equipment(side),candidate=api.stats(side),baseOpts=api.battleOpts();
      const result=await runGauntlet({candidate,data,equipment,baseOpts,count,stochasticRuns:mode==='full'?60:40,onProgress:p=>{if(!bar||!text)return;bar.style.width=`${Math.min(100,p.percent||0)}%`;text.textContent=p.phase==='validation'?`Validating extreme matchups · ${p.done}/${p.total}`:`Screening ${fmt(p.done,0)} / ${fmt(p.total,0)} opponent designs`;}});
      lastResult=result;lastSide=side;
    }catch(err){console.error(err);alert(`Gauntlet failed: ${err?.message||err}`);}
    finally{running=false;renderGauntlet(container,api);}
  };
}

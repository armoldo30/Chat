import { fmt } from './engine.js';
import { counterSnapshot } from './counter-state-model.js';
import { diagnoseMatchup } from './counter-diagnosis.js';
const SETTINGS='hoi4-counter-analysis-v1';
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function loadSettings(){try{return {baseMic:30,divisionCount:24,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')};}catch{return {baseMic:30,divisionCount:24};}}
function saveSettings(value){try{localStorage.setItem(SETTINGS,JSON.stringify(value));}catch{}}
function stat(label,value,target,suffix=''){return `<div><span>${esc(label)}</span><b>${fmt(value,1)}${suffix}</b><small>target ${fmt(target,1)}${suffix}</small></div>`;}
export function renderCounterBase(host){
  const snap=counterSnapshot(),config=loadSettings(),diagnosis=diagnoseMatchup(snap.attacker,snap.defender,{side:'attacker',battlefield:snap.state.battlefield});
  host.innerHTML=`<section class="counter-hero"><div><p class="eyebrow">POST-GAME MATCHUP REVIEW</p><h2>Counter Analysis</h2><p>Recreate the matchup, then improve either division while holding its opponent and battlefield context fixed. The search screens the current 1.19.3 ordinary battalion, divisional-support and Regimental Support catalogs plus active tank-design retunes, then battle-tests the strongest diverse one- and two-change counters.</p></div><div class="counter-actions"><button class="primary" id="runCounterSearch">IMPROVE ATTACKER</button><button class="primary" id="runDefenderCounterSearch">IMPROVE DEFENDER</button></div></section>
  <div class="counter-matchup-grid"><article><span>YOUR DIVISION</span><h3>${esc(snap.state.attackerName||'Attacker')}</h3><div>${stat('Piercing',snap.attacker.piercing,snap.defender.armor)}${stat('Armor',snap.attacker.armor,snap.defender.piercing)}${stat('Soft attack',snap.attacker.soft,snap.defender.def)}${stat('Hard attack',snap.attacker.hard,snap.defender.def)}</div><small>${fmt(snap.attackerIC,0)} equipment IC / division</small></article><article><span>TARGET DIVISION</span><h3>${esc(snap.state.defenderName||'Defender')}</h3><div>${stat('Armor',snap.defender.armor,snap.attacker.piercing)}${stat('Piercing',snap.defender.piercing,snap.attacker.armor)}${stat('Hardness',snap.defender.hardness*100,snap.attacker.hardness*100,'%')}${stat('Organization',snap.defender.org,snap.attacker.org)}</div><small>${fmt(snap.defenderIC,0)} equipment IC / division</small></article></div>
  <section class="panel counter-diagnosis"><div class="panel-head"><h2>What matters in this matchup</h2></div><div class="counter-priorities">${diagnosis.notes.map(note=>`<article class="${note.tone}"><div><strong>${esc(note.title)}</strong><span>${esc(note.detail)}</span></div></article>`).join('')}</div><p class="muted">These priorities guide candidate screening; final recommendations come from the full battle simulation, not the heuristic alone. Defender searches recalculate priorities from the defender's perspective.</p></section>
  <section class="panel counter-economics"><div class="panel-head"><h2>Cost context</h2></div><p>Combat effectiveness is the primary Counter objective. These settings only add a secondary IC frame so Best Value and tradeoff text can distinguish similarly effective answers; they do not override Best Raw.</p><div class="counter-settings"><label>Reference divisions<input id="counterDivisionCount" type="number" min="1" max="200" value="${config.divisionCount}"></label><label>Reference MIC<input id="counterBaseMic" type="number" min="1" max="500" value="${config.baseMic}"></label></div></section><div id="counterSearchResults"></div>`;
  const attackerRun=document.getElementById('runCounterSearch'),defenderRun=document.getElementById('runDefenderCounterSearch');
  if(attackerRun)attackerRun.onclick=()=>host.dispatchEvent(new CustomEvent('countersearch',{bubbles:true,detail:{side:'attacker',snapshot:snap}}));
  if(defenderRun)defenderRun.onclick=()=>host.dispatchEvent(new CustomEvent('countersearch',{bubbles:true,detail:{side:'defender',snapshot:snap}}));
  const divisions=document.getElementById('counterDivisionCount'),mic=document.getElementById('counterBaseMic');
  const update=()=>{saveSettings({divisionCount:Math.max(1,Number(divisions?.value)||24),baseMic:Math.max(1,Number(mic?.value)||30)});host.dispatchEvent(new CustomEvent('countersettings',{bubbles:true}));};
  if(divisions)divisions.onchange=update;if(mic)mic.onchange=update;
  return {snapshot:snap,settings:config};
}
export function counterViewSettings(){return loadSettings();}

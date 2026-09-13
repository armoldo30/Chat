import { fmt } from './engine.js';
import { counterSnapshot } from './counter-state-model.js';
import { diagnoseMatchup } from './counter-diagnosis.js';

const SETTINGS='hoi4-counter-analysis-v1';
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function loadSettings(){try{return {baseMic:30,divisionCount:24,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')};}catch{return {baseMic:30,divisionCount:24};}}
function saveSettings(value){try{localStorage.setItem(SETTINGS,JSON.stringify(value));}catch{}}
function stat(label,value,target,suffix=''){return `<div><span>${esc(label)}</span><b>${fmt(value,1)}${suffix}</b><small>target ${fmt(target,1)}${suffix}</small></div>`;}

export function renderCounterBase(host){
  const snap=counterSnapshot(),config=loadSettings(),diagnosis=diagnoseMatchup(snap.attacker,snap.defender);
  host.innerHTML=`<section class="counter-hero"><div><p class="eyebrow">POST-GAME MATCHUP REVIEW</p><h2>Counter Analysis</h2><p>Recreate the division that gave you trouble, then test focused one- and two-change counters against that exact target. The search can now combine template edits with relevant equipment-tier upgrades and retuning tank variants already used by your division, while explaining the modeled combat mechanism and cost.</p></div><button class="primary" id="runCounterSearch">FIND COUNTERS</button></section>
  <div class="counter-matchup-grid"><article><span>YOUR DIVISION</span><h3>${esc(snap.state.attackerName||'Attacker')}</h3><div>${stat('Piercing',snap.attacker.piercing,snap.defender.armor)}${stat('Armor',snap.attacker.armor,snap.defender.piercing)}${stat('Soft attack',snap.attacker.soft,snap.defender.def)}${stat('Hard attack',snap.attacker.hard,snap.defender.def)}</div><small>${fmt(snap.attackerIC,0)} equipment IC / division</small></article><article><span>TARGET DIVISION</span><h3>${esc(snap.state.defenderName||'Defender')}</h3><div>${stat('Armor',snap.defender.armor,snap.attacker.piercing)}${stat('Piercing',snap.defender.piercing,snap.attacker.armor)}${stat('Hardness',snap.defender.hardness*100,snap.attacker.hardness*100,'%')}${stat('Organization',snap.defender.org,snap.attacker.org)}</div><small>${fmt(snap.defenderIC,0)} equipment IC / division</small></article></div>
  <section class="panel counter-diagnosis"><div class="panel-head"><h2>What matters in this matchup</h2></div><div class="counter-priorities">${diagnosis.notes.map(note=>`<article class="${note.tone}"><div><strong>${esc(note.title)}</strong><span>${esc(note.detail)}</span></div></article>`).join('')}</div></section>
  <section class="panel counter-economics"><div class="panel-head"><h2>Cost frame</h2></div><p>This is normalized post-game theorycrafting, not a live production queue. Set a reference force and MIC base; a more expensive counter shows how much extra MIC would preserve the same fielding rate under equivalent production conditions.</p><div class="counter-settings"><label>Reference divisions<input id="counterDivisionCount" type="number" min="1" max="200" value="${config.divisionCount}"></label><label>Reference MIC<input id="counterBaseMic" type="number" min="1" max="500" value="${config.baseMic}"></label></div></section><div id="counterSearchResults"></div>`;
  const run=document.getElementById('runCounterSearch');if(run)run.onclick=()=>host.dispatchEvent(new CustomEvent('countersearch',{bubbles:true,detail:{snapshot:snap}}));
  const divisions=document.getElementById('counterDivisionCount'),mic=document.getElementById('counterBaseMic');
  const update=()=>{saveSettings({divisionCount:Math.max(1,Number(divisions?.value)||24),baseMic:Math.max(1,Number(mic?.value)||30)});host.dispatchEvent(new CustomEvent('countersettings',{bubbles:true}));};
  if(divisions)divisions.onchange=update;if(mic)mic.onchange=update;
  return {snapshot:snap,settings:config};
}

export function counterViewSettings(){return loadSettings();}

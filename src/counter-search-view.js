import { fmt } from './engine.js';
import { economicBurden } from './counter-analysis.js';
import { runCounterSearch } from './counter-search.js';
import { counterSnapshot } from './counter-state-model.js';
import { counterViewSettings } from './counter-base-view.js';

let lastSearch=null;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function card(title,item,snap,config){
  if(!item)return `<article class="counter-result empty"><span>${title}</span><h3>No qualifying one-change result</h3><p>A larger structural redesign may be needed.</p></article>`;
  const cost=economicBurden(snap.attackerIC,item.ic,config.baseMic,config.divisionCount),threshold=[];
  if(item.pierces&&snap.attacker.piercing<snap.defender.armor)threshold.push('crosses the armor threshold');
  if(item.holdsArmor&&snap.attacker.armor<=snap.defender.piercing)threshold.push('creates an armor advantage');
  return `<article class="counter-result"><span>${title}</span><h3>${esc(item.label)}</h3><div class="counter-result-metrics"><b>+${fmt(item.gain,1)} pp modeled win rate</b><b>${cost.delta>=0?'+':''}${fmt(cost.delta,0)} IC/div</b><b>${cost.delta>0?`≈ +${cost.extraFactories} MIC per ${config.baseMic} baseline MIC`:'no additional MIC required'}</b></div><p>${threshold.length?`${threshold.join(' and ')}. `:''}${cost.delta>0?`Across ${config.divisionCount} divisions, that is roughly +${fmt(cost.totalDelta,0)} equipment IC.`:'The candidate is not more expensive per division in the current model.'}</p></article>`;
}

function renderResults(host,snap){
  const target=host.querySelector('#counterSearchResults');if(!target)return;
  const search=lastSearch?.fingerprint===snap.fingerprint?lastSearch:null;if(!search){target.innerHTML='';return;}
  const config=counterViewSettings();
  target.innerHTML=`<section class="counter-results"><div class="counter-results-head"><div><p class="eyebrow">FOCUSED ONE-CHANGE SEARCH · ${search.runs} SEEDED RUNS / CANDIDATE</p><h2>Recommended counters</h2></div><span>Baseline modeled win ${fmt(search.baseline.winRate,1)}%</span></div><div class="counter-result-grid">${card('BEST RAW COUNTER',search.highlights.best,snap,config)}${card('BEST VALUE',search.highlights.value,snap,config)}${card('SMALLEST MEANINGFUL CHANGE',search.highlights.minimal,snap,config)}</div><details class="counter-ranked"><summary>Show ranked alternatives</summary><div>${search.ranked.slice(0,10).map((item,index)=>{const cost=economicBurden(snap.attackerIC,item.ic,config.baseMic,config.divisionCount);return `<article><b>#${index+1} ${esc(item.label)}</b><span>+${fmt(item.gain,1)} pp · ${cost.delta>=0?'+':''}${fmt(cost.delta,0)} IC/div · ${cost.delta>0?`≈ +${cost.extraFactories} MIC`:'no extra MIC'}</span></article>`;}).join('')||'<p>No one-change candidate improved the modeled matchup by at least 2 percentage points.</p>'}</div></details><p class="notice">This first search is intentionally limited to structurally valid one-battalion changes and common support-company additions. It is matchup analysis, not a universal-template claim.</p></section>`;
}

document.addEventListener('countersearch',event=>{
  const host=event.target.closest?.('.counter-analysis-workspace');if(!host)return;
  const button=host.querySelector('#runCounterSearch');if(button){button.disabled=true;button.textContent='ANALYZING…';}
  setTimeout(()=>{try{const snap=counterSnapshot();lastSearch=runCounterSearch(snap);renderResults(host,snap);if(button){button.disabled=false;button.textContent='RERUN COUNTER SEARCH';}}catch(error){console.error('Counter search failed',error);if(button){button.disabled=false;button.textContent='TRY AGAIN';}}},20);
});
document.addEventListener('countersettings',event=>{const host=event.target.closest?.('.counter-analysis-workspace');if(host)renderResults(host,counterSnapshot());});
export function renderExistingCounterResults(host,snap){renderResults(host,snap);}

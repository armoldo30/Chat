import { fmt } from './engine.js';
import { economicBurden } from './counter-analysis.js';
import { runCounterSearch } from './counter-search.js';
import { counterSnapshot } from './counter-state-model.js';
import { counterViewSettings } from './counter-base-view.js';
import { explainCounter } from './counter-explanations.js';

let lastSearch=null;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const list=items=>`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
function card(title,item,snap,config){
  if(!item)return `<article class="counter-result empty"><span>${title}</span><h3>No qualifying priced result</h3><p>The current focused search did not find a priced one- or two-change force design that cleared the modeled improvement threshold for this category.</p></article>`;
  const cost=economicBurden(snap.attackerIC,item.ic,config.baseMic,config.divisionCount),explanation=explainCounter(item,snap),priced=!item.costUnpriced;
  return `<article class="counter-result"><span>${title} · ${item.changeCount||1} CHANGE${(item.changeCount||1)===1?'':'S'}</span><h3>${esc(item.label)}</h3><div class="counter-result-metrics"><b>+${fmt(item.gain,1)} pp modeled win rate</b><b>${cost.delta>=0?'+':''}${fmt(cost.delta,0)} modeled IC/div</b><b>${priced?(cost.delta>0?`≈ +${cost.extraFactories} MIC per ${config.baseMic} baseline MIC`:'no additional MIC required'):'tech transition cost not priced'}</b></div><div class="counter-explain"><strong>Why it works</strong>${list(explanation.reasons)}<strong>Tradeoffs</strong>${list(explanation.tradeoffs)}</div><p class="counter-force-cost">${priced?(cost.delta>0?`Across ${config.divisionCount} divisions, that is roughly +${fmt(cost.totalDelta,0)} equipment IC.`:'The candidate is not more expensive per division in the current model.'):'The displayed division IC only covers costs the current equipment model can price. Research, line conversion, efficiency loss and replacement-equipment transition costs are excluded, so this candidate is not eligible for cost-based highlights.'}</p></article>`;
}

function renderResults(host,snap){
  const target=host.querySelector('#counterSearchResults');if(!target)return;
  const search=lastSearch?.fingerprint===snap.fingerprint?lastSearch:null;if(!search){target.innerHTML='';return;}
  const config=counterViewSettings();
  target.innerHTML=`<section class="counter-results"><div class="counter-results-head"><div><p class="eyebrow">FORCE-DESIGN TWO-STEP SEARCH · ${search.testedCount} CANDIDATES · ${search.runs} SEEDED RUNS / CANDIDATE</p><h2>Recommended counters</h2></div><span>Baseline modeled win ${fmt(search.baseline.winRate,1)}% · ${search.oneChangeCount} first-step + ${search.multiChangeCount} second-step tests · ${search.forceDesignCount} equipment/design tests</span></div><div class="counter-result-grid">${card('BEST RAW COUNTER',search.highlights.best,snap,config)}${card('BEST VALUE',search.highlights.value,snap,config)}${card('SMALLEST MEANINGFUL CHANGE',search.highlights.minimal,snap,config)}</div><details class="counter-ranked"><summary>Show ranked alternatives</summary><div>${search.ranked.slice(0,12).map((item,index)=>{const cost=economicBurden(snap.attackerIC,item.ic,config.baseMic,config.divisionCount),why=explainCounter(item,snap),costText=item.costUnpriced?'transition cost unpriced':(cost.delta>0?`≈ +${cost.extraFactories} MIC`:'no extra MIC');return `<article><div><b>#${index+1} ${esc(item.label)}</b><small>${item.changeCount||1} change${(item.changeCount||1)===1?'':'s'} · ${esc(why.summary)}</small></div><span>+${fmt(item.gain,1)} pp · ${cost.delta>=0?'+':''}${fmt(cost.delta,0)} modeled IC/div · ${costText}</span></article>`;}).join('')||'<p>No focused counter improved the modeled matchup by at least 2 percentage points.</p>'}</div></details><p class="notice">Search depth is capped at two changes. It now mixes structurally valid battalion/support edits with relevant equipment-tier upgrades and retuning of tank variants already used by the division. ${search.mixedForceCount?`${search.mixedForceCount} tested second-step candidates combined template and equipment/design changes. `:''}${search.unpricedCount?`${search.unpricedCount} tested candidates included an equipment-tier transition whose research/conversion cost is not yet priced; those candidates remain eligible for raw combat ranking but are excluded from Best Value and cost-based minimal-change highlights. `:''}Results remain planner-analytical matchup comparisons, not universal-template claims or research recommendations.</p></section>`;
}

document.addEventListener('countersearch',event=>{
  const host=event.target.closest?.('.counter-analysis-workspace');if(!host)return;
  const button=host.querySelector('#runCounterSearch');if(button){button.disabled=true;button.textContent='ANALYZING FORCE-DESIGN COUNTERS…';}
  setTimeout(()=>{try{const snap=counterSnapshot();lastSearch=runCounterSearch(snap);renderResults(host,snap);if(button){button.disabled=false;button.textContent='RERUN COUNTER SEARCH';}}catch(error){console.error('Counter search failed',error);if(button){button.disabled=false;button.textContent='TRY AGAIN';}}},20);
});
document.addEventListener('countersettings',event=>{const host=event.target.closest?.('.counter-analysis-workspace');if(host)renderResults(host,counterSnapshot());});
export function renderExistingCounterResults(host,snap){renderResults(host,snap);}

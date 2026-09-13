import { fmt } from './engine.js';
import { economicBurden } from './counter-analysis.js';
import { runCounterSearchResponsive } from './counter-search.js';
import { counterSnapshot } from './counter-state-model.js';
import { counterViewSettings } from './counter-base-view.js';
import { explainCounter } from './counter-explanations.js';

let lastSearch=null,activeSearch=0;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const list=items=>`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
function card(title,item,snap,config){
  if(!item)return `<article class="counter-result empty"><span>${title}</span><h3>No qualifying result</h3><p>The current focused search did not find a one- or two-change division/equipment design that cleared the modeled improvement threshold for this category.</p></article>`;
  const cost=economicBurden(snap.attackerIC,item.ic,config.baseMic,config.divisionCount),explanation=explainCounter(item,snap);
  return `<article class="counter-result"><span>${title} · ${item.changeCount||1} CHANGE${(item.changeCount||1)===1?'':'S'}</span><h3>${esc(item.label)}</h3><div class="counter-result-metrics"><b>+${fmt(item.gain,1)} pp modeled win rate</b><b>${cost.delta>=0?'+':''}${fmt(cost.delta,0)} modeled IC/div</b><b>${cost.delta>0?`≈ +${cost.extraFactories} MIC per ${config.baseMic} baseline MIC`:'no additional MIC required'}</b></div><div class="counter-explain"><strong>Why it works</strong>${list(explanation.reasons)}<strong>Tradeoffs</strong>${list(explanation.tradeoffs)}</div><p class="counter-force-cost">${cost.delta>0?`Across ${config.divisionCount} divisions, that is roughly +${fmt(cost.totalDelta,0)} equipment IC.`:'The candidate is not more expensive per division in the current model.'}</p></article>`;
}

function renderResults(host,snap){
  const target=host.querySelector('#counterSearchResults');if(!target)return;
  const search=lastSearch?.fingerprint===snap.fingerprint?lastSearch:null;if(!search){target.innerHTML='';return;}
  const config=counterViewSettings();
  target.innerHTML=`<section class="counter-results"><div class="counter-results-head"><div><p class="eyebrow">DIVISION + EQUIPMENT TWO-STEP SEARCH · ${search.testedCount} CANDIDATES · ${search.runs} SEEDED RUNS / CANDIDATE</p><h2>Recommended counters</h2></div><span>Baseline modeled win ${fmt(search.baseline.winRate,1)}% · ${search.oneChangeCount} first-step + ${search.multiChangeCount} second-step tests · ${search.forceDesignCount} active tank-design tests</span></div><div class="counter-result-grid">${card('BEST RAW COUNTER',search.highlights.best,snap,config)}${card('BEST VALUE',search.highlights.value,snap,config)}${card('SMALLEST MEANINGFUL CHANGE',search.highlights.minimal,snap,config)}</div><details class="counter-ranked"><summary>Show ranked alternatives</summary><div>${search.ranked.slice(0,12).map((item,index)=>{const cost=economicBurden(snap.attackerIC,item.ic,config.baseMic,config.divisionCount),why=explainCounter(item,snap),costText=cost.delta>0?`≈ +${cost.extraFactories} MIC`:'no extra MIC';return `<article><div><b>#${index+1} ${esc(item.label)}</b><small>${item.changeCount||1} change${(item.changeCount||1)===1?'':'s'} · ${esc(why.summary)}</small></div><span>+${fmt(item.gain,1)} pp · ${cost.delta>=0?'+':''}${fmt(cost.delta,0)} modeled IC/div · ${costText}</span></article>`;}).join('')||'<p>No focused counter improved the modeled matchup by at least 2 percentage points.</p>'}</div></details><p class="notice">Search depth is capped at two changes and the browser-safe search intentionally tests a bounded candidate set. It mixes structurally valid battalion/support edits with retuning of tank variants already used by the division. Doctrine, MIOs, technologies and country-wide effects are treated as fixed context: they affect the modeled matchup but are not proposed as counters. ${search.mixedForceCount?`${search.mixedForceCount} tested second-step candidates combined template and tank-design changes. `:''}Results remain planner-analytical matchup comparisons, not universal-template claims.</p></section>`;
}

function renderSearchError(host){
  const target=host.querySelector('#counterSearchResults');if(!target)return;
  target.innerHTML='<section class="counter-results"><article class="counter-result empty"><span>SEARCH STOPPED</span><h3>Counter Analysis could not complete safely</h3><p>The search was stopped instead of continuing to lock the page. Your division setup is unchanged; try the search again or adjust the matchup.</p></article></section>';
}

document.addEventListener('countersearch',async event=>{
  const host=event.target.closest?.('.counter-analysis-workspace');if(!host)return;
  const request=++activeSearch,button=host.querySelector('#runCounterSearch'),snap=counterSnapshot();
  if(button){button.disabled=true;button.textContent='PREPARING COUNTER SEARCH…';}
  try{
    const result=await runCounterSearchResponsive(snap,{
      cancelled:()=>request!==activeSearch||!host.isConnected,
      onProgress:({completed,total})=>{if(button&&request===activeSearch)button.textContent=`ANALYZING ${completed} / ${total}…`;}
    });
    if(request!==activeSearch||!host.isConnected)return;
    lastSearch=result;renderResults(host,snap);
    if(button){button.disabled=false;button.textContent='RERUN COUNTER SEARCH';}
  }catch(error){
    if(error?.name==='AbortError')return;
    console.error('Counter search failed',error);if(request===activeSearch&&host.isConnected){renderSearchError(host);if(button){button.disabled=false;button.textContent='TRY AGAIN';}}
  }
});
document.addEventListener('countersettings',event=>{const host=event.target.closest?.('.counter-analysis-workspace');if(host)renderResults(host,counterSnapshot());});
export function renderExistingCounterResults(host,snap){renderResults(host,snap);}

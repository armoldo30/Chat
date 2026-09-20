import { fmt } from './engine.js';
import { economicBurden } from './counter-analysis.js';
import { runCounterSearchResponsive } from './counter-search.js';
import { counterSnapshot } from './counter-state-model.js';
import { counterViewSettings } from './counter-base-view.js';
import { explainCounter } from './counter-explanations.js';

let lastSearch={attacker:null,defender:null},activeSearch=0,lastSide='attacker';
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const list=items=>`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
const signed=(value,digits=1)=>`${value>=0?'+':''}${fmt(value,digits)}`;
const normalizeSide=side=>side==='defender'?'defender':'attacker';
const sideLabel=side=>normalizeSide(side)==='defender'?'defender':'attacker';
function productionNote(item){
  const practicality=item?.practicality;if(!practicality?.majorRetooling)return '';
  const families=(practicality.introducedArmorFamilies||[]).map(family=>`${family[0].toUpperCase()}${family.slice(1)} Armor`).join(' + ')||'a new armor family';
  return `MAJOR RETOOLING · Introduces ${families}. This is secondary context; the combat result is still tested normally.`;
}
function outcomeNote(item,search){
  if(item.winRate<50)return ' · still below 50%';
  if(search.baseline.winRate<50&&item.winRate>=50)return ' · crosses 50%';
  return '';
}
function card(title,item,snap,config,search,side,note=''){
  if(!item)return '';
  const baseIC=snap[side+'IC'],cost=economicBurden(baseIC,item.ic,config.baseMic,config.divisionCount),explanation=explainCounter(item,snap,side),notes=[note,productionNote(item)].filter(Boolean).map(text=>`<p class="counter-force-cost">${esc(text)}</p>`).join(''),quality=item.battleQuality,exchange=quality?`<b>Strength loss: own ${fmt(quality.ownCasualtyRate,1)}% · enemy ${fmt(quality.enemyCasualtyRate,1)}% · exchange ${signed(quality.casualtyExchange,1)} pp</b>`:'';
  return `<article class="counter-result"><span>${esc(title)} · ${item.changeCount||1} CHANGE${(item.changeCount||1)===1?'':'S'}</span><h3>${esc(item.label)}</h3><div class="counter-result-metrics"><b>${fmt(search.baseline.winRate,1)}% → ${fmt(item.winRate,1)}% modeled ${sideLabel(side)} win rate${outcomeNote(item,search)}</b><b>${signed(item.gain,1)} pp improvement</b><b>${cost.delta>=0?'+':''}${fmt(cost.delta,0)} modeled IC/div</b><b>${cost.delta>0?`≈ +${cost.extraFactories} MIC per ${config.baseMic} baseline MIC`:'no additional MIC required'}</b>${exchange}</div>${notes}<div class="counter-explain"><strong>Why it works</strong>${list(explanation.reasons)}<strong>Tradeoffs</strong>${list(explanation.tradeoffs)}</div><p class="counter-force-cost">${cost.delta>0?`Across ${config.divisionCount} divisions, that is roughly +${fmt(cost.totalDelta,0)} equipment IC.`:'The candidate is not more expensive per division in the current model.'}</p></article>`;
}
function groupTitle(group){
  if(group.alternative)return 'DISTINCT ALTERNATIVE';
  if((group.roles||[]).length>1)return `DOMINANT PICK · ${(group.roles||[]).join(' · ')}`;
  const role=group.roles?.[0];
  if(role==='BEST RAW')return 'BEST RAW COUNTER';
  if(role==='BEST VALUE')return 'BEST EFFICIENT COUNTER';
  if(role==='SMALLEST CHANGE')return 'SMALLEST EFFECTIVE CHANGE';
  return role||'RECOMMENDED COUNTER';
}
function groupNote(group){
  if(group.alternative)return 'Shown as a distinct qualifying answer because another candidate wins more than one headline category.';
  if((group.roles||[]).length>1)return `This single counter wins ${(group.roles||[]).length} headline objectives, so duplicate cards are collapsed into one recommendation.`;
  return '';
}
function resultRows(items,snap,config,search,side){
  const baseIC=snap[side+'IC'];
  return (items||[]).map((item,index)=>{const cost=economicBurden(baseIC,item.ic,config.baseMic,config.divisionCount),why=explainCounter(item,snap,side),costText=cost.delta>0?`≈ +${cost.extraFactories} MIC`:'no extra MIC',retool=item.practicality?.majorRetooling?' · major retooling':'',exchange=item.battleQuality?` · strength exchange ${signed(item.battleQuality.casualtyExchange,1)} pp`:'';return `<article><div><b>#${index+1} ${esc(item.label)}</b><small>${item.changeCount||1} change${(item.changeCount||1)===1?'':'s'}${retool} · ${esc(why.summary)}</small></div><span>${fmt(search.baseline.winRate,1)}% → ${fmt(item.winRate,1)}%${outcomeNote(item,search)} · ${signed(item.gain,1)} pp${exchange} · ${cost.delta>=0?'+':''}${fmt(cost.delta,0)} modeled IC/div · ${costText}</span></article>`;}).join('');
}
function noCounterPanel(search,snap,config,side){
  const threshold=search.meaningfulThreshold??2,best=search.bestTested,base=search.baseline.winRate,bestWin=best?.winRate,deep=search.maxDepth>=3,deepEligible=search.meaningfulGainReachable!==false,scope=deep?'up to three changes':'one or two changes',attempt=best&&best.gain>0?`The strongest tested change reached ${fmt(bestWin,1)}% (${signed(best.gain,1)} pp), below the +${fmt(threshold,0)} pp meaningful-improvement threshold.`:`None of the ${search.testedCount} tested candidates across ${scope} improved the baseline matchup.`;
  let diagnosis=deep?'Even the bounded three-change deep redesign did not find a meaningful counter. Force ratio, battlefield conditions, or a more comprehensive template rebuild may be the limiting factor.':'The bounded search screened the current structural counter catalog but did not find a one- or two-change answer large enough to count as a meaningful improvement.';
  if(!deep&&!deepEligible)diagnosis=`The selected side is already at ${fmt(base,1)}% modeled win rate. A +${fmt(threshold,0)} pp qualifying improvement is impossible because modeled win rate is capped at 100%, so a deeper search would spend extra battle tests without being able to satisfy the recommendation rule.`;
  else if(!deep&&base<35)diagnosis='This matchup is heavily unfavorable. The normal one/two-change search did not find a meaningful local counter; the optional deep redesign can test a bounded third change before concluding that a broader rebuild is needed.';
  else if(!deep&&base>65)diagnosis='The selected side is already strongly favored, so the bounded search did not find a local edit that improves it enough to qualify as a new recommendation.';
  const effort=best&&best.gain>0?card('BEST TESTED ATTEMPT · BELOW THRESHOLD',best,snap,config,search,side,`This is the strongest attempt the search found, not a qualifying recommendation. The current threshold is +${fmt(threshold,0)} percentage points.`):'',deepAction=!deep&&deepEligible?`<button type="button" class="primary counter-deep-search" data-counter-deep-side="${side}">TRY DEEP REDESIGN</button><p class="counter-force-cost">Adds a bounded third change from a few of the strongest diverse two-change attempts. The normal search remains unchanged.</p>`:'';
  return `<article class="counter-result empty"><span>${deep?'DEEP REDESIGN EXHAUSTED':'LOCAL COUNTER NOT FOUND'}</span><h3>${deep?'No meaningful three-change counter emerged':'No meaningful one- or two-change counter emerged'}</h3><p>Baseline modeled ${sideLabel(side)} win rate: ${fmt(base,1)}%. ${esc(attempt)}</p><p>${esc(diagnosis)}</p>${deepAction}</article>${effort}`;
}

function renderResults(host,snap,requestedSide=lastSide){
  const target=host.querySelector('#counterSearchResults');if(!target)return;
  const side=normalizeSide(requestedSide),search=lastSearch[side]?.fingerprint===snap.fingerprint?lastSearch[side]:null;if(!search){target.innerHTML='';return;}
  const config=counterViewSettings(),hasMeaningful=search.ranked.length>0,recommendations=search.recommendations||[],headline=hasMeaningful?`Recommended ${sideLabel(side)} counters`:`No meaningful local ${sideLabel(side)} counter found`,cards=hasMeaningful?recommendations.map(group=>card(groupTitle(group),group.item,snap,config,search,side,groupNote(group))).join(''):noCounterPanel(search,snap,config,side),detailItems=hasMeaningful?search.ranked.slice(0,12):(search.bestEfforts||[]).slice(0,5),detailTitle=hasMeaningful?'Show ranked alternatives':'Show strongest tested attempts',emptyText=hasMeaningful?'No additional qualifying alternatives were found.':'No tested local change improved this matchup.',deep=search.maxDepth>=3,searchLabel=deep?'BOUNDED THREE-STEP DEEP REDESIGN':'MATCHUP-DRIVEN TWO-STEP SEARCH',countText=deep?`${search.oneChangeCount} first-step + ${search.twoChangeCount} second-step + ${search.threeChangeCount} third-step tests`:`${search.oneChangeCount} first-step + ${search.twoChangeCount} second-step tests`;
  target.innerHTML=`<section class="counter-results"><div class="counter-results-head"><div><p class="eyebrow">${side.toUpperCase()} ${searchLabel} · ${search.testedCount} BATTLE-TESTED CANDIDATES · ${search.runs} SEEDED RUNS / CANDIDATE</p><h2>${headline}</h2></div><span>Baseline modeled ${sideLabel(side)} win ${fmt(search.baseline.winRate,1)}% · ${countText} · ${search.forceDesignCount} active tank-design tests</span></div><div class="counter-result-grid">${cards}</div><details class="counter-ranked"><summary>${detailTitle}</summary><div>${resultRows(detailItems,snap,config,search,side)||`<p>${emptyText}</p>`}</div></details><p class="notice">Recommendations are improvements, not promises of victory: a counter can improve the matchup substantially and still remain below 50% modeled win rate. Before battle simulation, Counter screens the current 1.19.3 ordinary battalion, divisional-support and Regimental Support catalogs plus active tank-design retunes against the exact enemy profile, then preserves structural diversity when choosing which candidates to battle-test. The normal search is capped at two changes. If it finds no meaningful counter, the optional deep redesign adds a bounded third step from a small diverse seed set; it is still not an exhaustive template search. Combat width, organization, armor/piercing thresholds, hardness-sensitive attack and selected battlefield effects are rebuilt and re-simulated for every tested candidate. Doctrine, MIOs, technologies and country-wide effects remain fixed matchup context rather than proposed counters. Best Raw is the strongest combat result; equal win-rate results are separated by modeled strength-loss exchange before non-combat tie-breakers. Best Efficient balances improvement against IC, supply and change complexity; production capacity is only secondary context. Supply-use changes remain tradeoffs and Counter does not infer province-level supply satisfaction. Smallest Effective Change favors the least disruptive meaningful answer. ${search.mixedForceCount?`${search.mixedForceCount} tested multi-step candidates combined template and tank-design changes. `:''}${hasMeaningful?'Headline categories are deduplicated: when one candidate wins multiple objectives it appears once, with distinct qualifying alternatives filling the remaining recommendation space. ':'A failed bounded search is reported as a search limit rather than hidden as an empty recommendation. '}Results remain planner-analytical matchup comparisons, not universal-template claims.</p></section>`;
  const deepButton=target.querySelector('[data-counter-deep-side]');if(deepButton)deepButton.onclick=()=>host.dispatchEvent(new CustomEvent('countersearch',{bubbles:true,detail:{side,deep:true}}));
}

function setSearchButtons(host,runningSide=null,text='',deep=false){
  const attacker=host.querySelector('#runCounterSearch'),defender=host.querySelector('#runDefenderCounterSearch'),deepButton=host.querySelector('[data-counter-deep-side]');
  for(const button of [attacker,defender,deepButton])if(button)button.disabled=!!runningSide;
  if(attacker)attacker.textContent=runningSide==='attacker'&&!deep?text:'IMPROVE ATTACKER';
  if(defender)defender.textContent=runningSide==='defender'&&!deep?text:'IMPROVE DEFENDER';
  if(deepButton&&deep&&runningSide)deepButton.textContent=text;
}
function renderSearchError(host){
  const target=host.querySelector('#counterSearchResults');if(!target)return;
  target.innerHTML='<section class="counter-results"><article class="counter-result empty"><span>SEARCH STOPPED</span><h3>Counter Analysis could not complete safely</h3><p>The search was stopped instead of continuing to lock the page. Your division setup is unchanged; try the search again or adjust the matchup.</p></article></section>';
}

document.addEventListener('countersearch',async event=>{
  const host=event.target.closest?.('.counter-analysis-workspace');if(!host)return;
  const side=normalizeSide(event.detail?.side),deep=event.detail?.deep===true,request=++activeSearch;lastSide=side;setSearchButtons(host,side,deep?'PREPARING DEEP REDESIGN…':'PREPARING SEARCH…',deep);
  try{
    const snap=counterSnapshot();
    const result=await runCounterSearchResponsive(snap,{
      side,deep,
      cancelled:()=>request!==activeSearch||!host.isConnected,
      onProgress:({completed,total})=>{if(request===activeSearch)setSearchButtons(host,side,`${deep?'REDESIGN':'ANALYZING'} ${completed} / ${total}…`,deep);}
    });
    if(request!==activeSearch||!host.isConnected)return;
    lastSearch[side]=result;renderResults(host,snap,side);setSearchButtons(host);
  }catch(error){
    if(error?.name==='AbortError')return;
    console.error('Counter search failed',error);if(request===activeSearch&&host.isConnected){renderSearchError(host);setSearchButtons(host);}
  }
});
document.addEventListener('countersettings',event=>{
  const host=event.target.closest?.('.counter-analysis-workspace');if(!host)return;
  try{renderResults(host,counterSnapshot(),lastSide);}
  catch(error){console.error('Counter settings refresh failed',error);renderSearchError(host);}
});
export function renderExistingCounterResults(host,snap){renderResults(host,snap,lastSide);}

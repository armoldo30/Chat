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
function productionNotes(item){
  const notes=[],plan=item?.productionPlan,practicality=item?.practicality;
  if(plan?.available){
    if(plan.targetRegressionIC>0){
      const affected=(plan.rows||[]).filter(row=>row.targetRegression>1e-9).sort((a,b)=>b.targetRegressionIC-a.targetRegressionIC).map(row=>row.label).slice(0,2).join(' / ');
      notes.push(`SAVED TARGET REGRESSION · This equipment design leaves roughly ${fmt(plan.targetRegressionIC,0)} more IC of existing saved production targets unmet over ${Math.round(plan.horizonDays)} days${affected?` (${affected})`:''}.`);
    }
    if(plan.incrementalIC>0){
      if(plan.incrementalShortfallIC<=1e-9)notes.push(`CURRENT PLAN COVERED · The saved production plan has enough projected surplus beyond its existing targets to cover this force's added equipment within ${Math.round(plan.horizonDays)} days.`);
      else{
        const covered=Math.round((plan.coverageRatio||0)*100),missing=(plan.rows||[]).filter(row=>row.incrementalShortfall>1e-9).sort((a,b)=>b.incrementalShortfallIC-a.incrementalShortfallIC),missingLabels=missing.slice(0,2).map(row=>row.label).join(' / ');
        notes.push(`CURRENT PLAN GAP · About ${covered}% of the added equipment IC is covered beyond existing saved targets over ${Math.round(plan.horizonDays)} days; roughly ${fmt(plan.incrementalShortfallIC,0)} added-equipment IC remains uncovered${missingLabels?` (${missingLabels})`:''}.`);
        const newLines=missing.filter(row=>row.newLine).map(row=>row.label),inactive=missing.filter(row=>row.inactiveLine).map(row=>row.label);
        if(newLines.length)notes.push(`NO SAVED LINE · ${newLines.slice(0,3).join(' / ')} would require opening or reallocating production.`);
        else if(inactive.length)notes.push(`INACTIVE SAVED LINE · ${inactive.slice(0,3).join(' / ')} currently receives no active factories under the saved factory cap.`);
      }
    }
  }
  if(practicality?.majorRetooling){
    const families=(practicality.introducedArmorFamilies||[]).map(family=>`${family[0].toUpperCase()}${family.slice(1)} Armor`).join(' + ')||'a new armor family';
    notes.push(`MAJOR RETOOLING · Introduces ${families}. Current-plan output is checked, but conversion efficiency loss, new trade acquisition, and campaign fuel logistics are not automatically modeled.`);
  }
  return notes;
}
function outcomeNote(item,search){
  if(item.winRate<50)return ' · still below 50%';
  if(search.baseline.winRate<50&&item.winRate>=50)return ' · crosses 50%';
  return '';
}
function card(title,item,snap,config,search,side,note=''){
  if(!item)return '';
  const baseIC=snap[side+'IC'],cost=economicBurden(baseIC,item.ic,config.baseMic,config.divisionCount),explanation=explainCounter(item,snap,side),notes=[note,...productionNotes(item)].filter(Boolean).map(text=>`<p class="counter-force-cost">${esc(text)}</p>`).join('');
  return `<article class="counter-result"><span>${esc(title)} · ${item.changeCount||1} CHANGE${(item.changeCount||1)===1?'':'S'}</span><h3>${esc(item.label)}</h3><div class="counter-result-metrics"><b>${fmt(search.baseline.winRate,1)}% → ${fmt(item.winRate,1)}% modeled ${sideLabel(side)} win rate${outcomeNote(item,search)}</b><b>${signed(item.gain,1)} pp improvement</b><b>${cost.delta>=0?'+':''}${fmt(cost.delta,0)} modeled IC/div</b><b>${cost.delta>0?`≈ +${cost.extraFactories} MIC per ${config.baseMic} baseline MIC`:'no additional MIC required'}</b></div>${notes}<div class="counter-explain"><strong>Why it works</strong>${list(explanation.reasons)}<strong>Tradeoffs</strong>${list(explanation.tradeoffs)}</div><p class="counter-force-cost">${cost.delta>0?`Across ${config.divisionCount} divisions, that is roughly +${fmt(cost.totalDelta,0)} equipment IC.`:'The candidate is not more expensive per division in the current model.'}</p></article>`;
}
function groupTitle(group){
  if(group.alternative)return 'DISTINCT ALTERNATIVE';
  if((group.roles||[]).length>1)return `DOMINANT PICK · ${(group.roles||[]).join(' · ')}`;
  const role=group.roles?.[0];
  if(role==='BEST RAW')return 'BEST RAW IMPROVEMENT';
  if(role==='SMALLEST CHANGE')return 'SMALLEST MEANINGFUL CHANGE';
  return role||'RECOMMENDED IMPROVEMENT';
}
function groupNote(group){
  if(group.alternative)return 'Shown as a distinct qualifying option because another candidate wins more than one headline category.';
  if((group.roles||[]).length>1)return `This single candidate wins ${(group.roles||[]).length} headline objectives, so duplicate cards are collapsed into one recommendation.`;
  return '';
}
function resultRows(items,snap,config,search,side){
  const baseIC=snap[side+'IC'];
  return (items||[]).map((item,index)=>{const cost=economicBurden(baseIC,item.ic,config.baseMic,config.divisionCount),why=explainCounter(item,snap,side),costText=cost.delta>0?`≈ +${cost.extraFactories} MIC`:'no extra MIC',retool=item.practicality?.majorRetooling?' · major retooling':'',plan=item.productionPlan,production=plan?.available&&!plan.currentPlanAdequate?(plan.incrementalIC>0?` · saved plan ${Math.round((plan.coverageRatio||0)*100)}% added-demand coverage`:' · saved target regression'):plan?.available&&plan.incrementalIC>0?' · saved plan covered':'';return `<article><div><b>#${index+1} ${esc(item.label)}</b><small>${item.changeCount||1} change${(item.changeCount||1)===1?'':'s'}${retool}${production} · ${esc(why.summary)}</small></div><span>${fmt(search.baseline.winRate,1)}% → ${fmt(item.winRate,1)}%${outcomeNote(item,search)} · ${signed(item.gain,1)} pp · ${cost.delta>=0?'+':''}${fmt(cost.delta,0)} modeled IC/div · ${costText}</span></article>`;}).join('');
}
function noCounterPanel(search,snap,config,side){
  const threshold=search.meaningfulThreshold??2,best=search.bestTested,base=search.baseline.winRate,bestWin=best?.winRate,attempt=best&&best.gain>0?`The strongest tested local change reached ${fmt(bestWin,1)}% (${signed(best.gain,1)} pp), below the +${fmt(threshold,0)} pp meaningful-improvement threshold.`:`None of the ${search.testedCount} tested one- or two-change candidates improved the baseline matchup.`;
  let diagnosis='The bounded local search did not find a template, support-company, or active tank-design adjustment large enough to count as a practical improvement.';
  if(base<35)diagnosis='This matchup is heavily unfavorable. The browser-safe one/two-change search did not find a meaningful local improvement; force ratio, battlefield conditions, or a larger redesign may be the limiting factor.';
  else if(base>65)diagnosis='The selected side is already strongly favored, so the bounded search did not find a local edit that improves it enough to qualify as a new recommendation.';
  const effort=best&&best.gain>0?card('BEST TESTED ATTEMPT · BELOW THRESHOLD',best,snap,config,search,side,`This is the strongest attempt the search found, not a qualifying recommendation. The current threshold is +${fmt(threshold,0)} percentage points.`):'';
  return `<article class="counter-result empty"><span>LOCAL IMPROVEMENT NOT FOUND</span><h3>No practical one- or two-change improvement emerged</h3><p>Baseline modeled ${sideLabel(side)} win rate: ${fmt(base,1)}%. ${esc(attempt)}</p><p>${esc(diagnosis)}</p></article>${effort}`;
}

function renderResults(host,snap,requestedSide=lastSide){
  const target=host.querySelector('#counterSearchResults');if(!target)return;
  const side=normalizeSide(requestedSide),search=lastSearch[side]?.fingerprint===snap.fingerprint?lastSearch[side]:null;if(!search){target.innerHTML='';return;}
  const config=counterViewSettings(),hasMeaningful=search.ranked.length>0,recommendations=search.recommendations||[],headline=hasMeaningful?`Recommended ${sideLabel(side)} improvements`:`No practical local ${sideLabel(side)} improvement found`,cards=hasMeaningful?recommendations.map(group=>card(groupTitle(group),group.item,snap,config,search,side,groupNote(group))).join(''):noCounterPanel(search,snap,config,side),detailItems=hasMeaningful?search.ranked.slice(0,12):(search.bestEfforts||[]).slice(0,5),detailTitle=hasMeaningful?'Show ranked alternatives':'Show strongest tested attempts',emptyText=hasMeaningful?'No additional qualifying alternatives were found.':'No tested local change improved this matchup.';
  target.innerHTML=`<section class="counter-results"><div class="counter-results-head"><div><p class="eyebrow">${side.toUpperCase()} DIVISION + EQUIPMENT TWO-STEP SEARCH · ${search.testedCount} CANDIDATES · ${search.runs} SEEDED RUNS / CANDIDATE</p><h2>${headline}</h2></div><span>Baseline modeled ${sideLabel(side)} win ${fmt(search.baseline.winRate,1)}% · ${search.oneChangeCount} first-step + ${search.multiChangeCount} second-step tests · ${search.forceDesignCount} active tank-design tests</span></div><div class="counter-result-grid">${cards}</div><details class="counter-ranked"><summary>${detailTitle}</summary><div>${resultRows(detailItems,snap,config,search,side)||`<p>${emptyText}</p>`}</div></details><p class="notice">Recommendations are improvements, not promises of victory: a candidate can improve the matchup substantially and still remain below 50% modeled win rate. Search depth is capped at two changes and the browser-safe search intentionally tests a bounded candidate set. Combat width and organization are rebuilt and re-simulated for every candidate, including width/stacking effects in the selected terrain. Supply-use changes are reported as tradeoffs and penalize Best Value and search practicality, but they do not automatically change battlefield supply satisfaction because Counter Analysis does not infer province-level supply capacity. It mixes structurally valid battalion/support edits with retuning of tank variants already used by the selected division. Doctrine, MIOs, technologies and country-wide effects are treated as fixed context: they affect the modeled matchup but are not proposed as counters. Best Raw remains the strongest combat result. Best Value, Smallest Change, second-step exploration, and distinct alternatives also prefer changes the current saved production plan can supply after its existing stockpile targets over the configured production horizon. Tank retunes are compared against baseline line output so a costlier/resource-heavier design can be penalized even when tank quantity is unchanged. The feasibility check uses the audited production model and saved factory/resource settings without silently reallocating factories. Factory conversion/retooling efficiency loss, new trade acquisition, province-level supply capacity, and campaign fuel logistics remain outside this check. ${search.mixedForceCount?`${search.mixedForceCount} tested second-step candidates combined template and tank-design changes. `:''}${hasMeaningful?'Headline categories are deduplicated: when one candidate wins multiple objectives it appears once, with distinct qualifying alternatives filling the remaining recommendation space. ':'A failed local search is reported as a search limit rather than hidden as an empty recommendation. '}Results remain planner-analytical matchup comparisons, not universal-template claims.</p></section>`;
}

function setSearchButtons(host,runningSide=null,text=''){
  const attacker=host.querySelector('#runCounterSearch'),defender=host.querySelector('#runDefenderCounterSearch');
  for(const button of [attacker,defender])if(button)button.disabled=!!runningSide;
  if(attacker)attacker.textContent=runningSide==='attacker'?text:'IMPROVE ATTACKER';
  if(defender)defender.textContent=runningSide==='defender'?text:'IMPROVE DEFENDER';
}
function renderSearchError(host){
  const target=host.querySelector('#counterSearchResults');if(!target)return;
  target.innerHTML='<section class="counter-results"><article class="counter-result empty"><span>SEARCH STOPPED</span><h3>Counter Analysis could not complete safely</h3><p>The search was stopped instead of continuing to lock the page. Your division setup is unchanged; try the search again or adjust the matchup.</p></article></section>';
}

document.addEventListener('countersearch',async event=>{
  const host=event.target.closest?.('.counter-analysis-workspace');if(!host)return;
  const side=normalizeSide(event.detail?.side),request=++activeSearch;lastSide=side;setSearchButtons(host,side,'PREPARING SEARCH…');
  try{
    const snap=counterSnapshot();
    const result=await runCounterSearchResponsive(snap,{
      side,
      cancelled:()=>request!==activeSearch||!host.isConnected,
      onProgress:({completed,total})=>{if(request===activeSearch)setSearchButtons(host,side,`ANALYZING ${completed} / ${total}…`);}
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
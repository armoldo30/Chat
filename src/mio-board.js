import { displayLabel, iconSvg, visualKind } from './ui-labels.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';
import { currentMioCatalog, organizationChoices, familyTitleFor, orgIcon, orgIconKind, traitModel, traitIcon, traitKind, effectChips, effectSummary, toggleTheorycraft } from './mio-workflow-ui.js';

const PICK_ORG=new Set();
function familyTitle(select){return familyTitleFor(select,displayLabel(select?.dataset?.mioOrg||'MIO'));}
function familyKind(select){const kind=visualKind(`${select?.dataset?.mioOrg||''} ${familyTitle(select)}`);return kind==='generic'?'industry':kind;}
function esc(value){return String(value??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));}

function ensureActionBar(){
  const head=document.querySelector('.tech-doctrine-panel .tech-profile-head');if(!head)return null;
  let bar=head.querySelector('.visual-board-actions');if(!bar){bar=document.createElement('div');bar.className='visual-board-actions';head.append(bar);}return bar;
}
function closeBoard(){document.getElementById('mio-board-modal')?.remove();document.documentElement.classList.remove('picker-open');}

function effectMarkup(source){const chips=effectChips(source,5);return chips.length?`<div class="mio-effect-chips">${chips.map(x=>`<span><b>${esc(x.label)}</b>${esc(x.value)}</span>`).join('')}</div>`:'<small class="mio-no-bonus">No supported baseline bonus is exposed for this organization.</small>';}
function orgCards(select,catalog){
  const choices=organizationChoices(select,catalog),show=choices.visible;
  return `<div class="mio-org-choice-head"><div><b>${choices.country==='---'?'Compatible organizations':`${choices.country} organizations`}</b><small>${choices.national.length?`${choices.national.length} national/generic choice${choices.national.length===1?'':'s'} shown by default.`:'No country-specific choices were retained; showing all structurally compatible MIOs.'}</small></div>${choices.others.length?`<button type="button" class="btn mio-theorycraft-toggle" data-mio-theorycraft>${choices.expanded?'Hide theorycraft alternatives':`Show ${choices.others.length} theorycraft alternative${choices.others.length===1?'':'s'}`}</button>`:''}</div><div class="mio-org-cards guided">${show.map(({option,org,countryEligible,selected})=>{const kind=orgIconKind(org,familyTitle(select));return `<button type="button" class="mio-org-card ${selected?'selected':''} ${countryEligible?'':'theorycraft'}" data-workflow-org="${esc(option.value)}"><span class="visual-option-icon ${kind}">${orgIcon(org,familyTitle(select))}</span><span class="mio-org-copy"><b>${esc(displayLabel(option.value,option.textContent))}</b><small>${countryEligible?'COUNTRY / GENERIC':'THEORYCRAFT'}</small></span>${selected?'<span class="visual-option-check">✓</span>':''}</button>`;}).join('')}</div>`;
}
function pathMarkup(select,org,traits,model){
  const selectedNames=model.active.map(x=>x.name),next=model.available;
  return `<div class="mio-stepper"><span class="done"><i>1</i>Equipment</span><span class="done"><i>2</i>Organization</span><span class="current"><i>3</i>Trait path</span></div>
    <section class="mio-selected-org"><div class="mio-selected-org-icon ${orgIconKind(org,familyTitle(select))}">${orgIcon(org,familyTitle(select))}</div><div><span class="eyebrow">ACTIVE ORGANIZATION</span><h3>${esc(displayLabel(org?.id,org?.name||org?.id))}</h3><p>${model.active.length} trait${model.active.length===1?'':'s'} active · ${next.length} choice${next.length===1?'':'s'} available now.</p></div><div class="mio-selected-org-actions"><button type="button" class="btn" data-mio-change-org>Change organization</button><button type="button" class="btn" data-mio-clear-org>Remove</button></div></section>
    <section class="mio-base-bonuses"><div><span class="eyebrow">BASE EFFECTS</span><small>Applied before selected trait effects.</small></div>${effectMarkup(org?.initial||{})}</section>
    <section class="mio-next-step"><div class="mio-section-title"><div><span class="eyebrow">AVAILABLE NOW</span><h3>${next.length?'Choose your next trait':'No further trait is currently unlocked'}</h3><p>${next.length?'These are the only structurally valid next steps. Pick one and the downstream tree updates immediately.':'Your selected path is complete for the retained trait structure, or a mutually exclusive branch has closed the remaining nodes.'}</p></div>${model.active.length?`<button type="button" class="btn" data-mio-reset-path>Reset path</button>`:''}</div>${next.length?`<div class="mio-next-grid">${next.map(row=>`<button type="button" class="mio-next-card" data-workflow-trait="${esc(row.id)}"><span class="node-emblem ${traitKind(row)}">${traitIcon(row)}</span><span><b>${esc(row.name)}</b><small>${esc(effectSummary(row.trait))}</small></span><em>SELECT</em></button>`).join('')}</div>`:''}</section>
    <section class="mio-path-summary"><div class="mio-section-title"><div><span class="eyebrow">SELECTED PATH</span><h3>${selectedNames.length?`${selectedNames.length} active trait${selectedNames.length===1?'':'s'}`:'No traits selected yet'}</h3></div></div>${selectedNames.length?`<div class="mio-path-chips">${selectedNames.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:'<p class="muted">Start with one of the highlighted choices above.</p>'}</section>
    <section class="mio-full-tree"><div class="mio-section-title"><div><span class="eyebrow">FULL TRAIT TREE</span><h3>Path map</h3><p>Gold nodes are active, bright nodes are available now, and dim nodes show their prerequisite. Selected traits can be removed only when no active downstream trait depends on them.</p></div></div><div class="mio-board-traits" data-mio-org-id="${esc(org?.id||'')}">${model.rows.map(row=>`<button type="button" class="mio-board-trait ${row.active?'selected':''} ${row.available?'available':''} ${row.locked?'locked':''}" data-workflow-trait="${esc(row.id)}" ${row.locked||row.active&&!row.canRemove?'disabled':''}><span class="node-emblem ${traitKind(row)}">${traitIcon(row)}</span><span><b>${esc(row.name)}</b><small>${row.active?'ACTIVE':row.available?'AVAILABLE':esc(row.reason||'LOCKED')}</small>${effectSummary(row.trait)?`<em>${esc(effectSummary(row.trait))}</em>`:''}</span></button>`).join('')}</div></section>`;
}

function renderBoard(select,content){
  const catalog=currentMioCatalog(),family=select.dataset.mioOrg,article=select.closest('.mio-assignment'),traits=[...(article?.querySelectorAll(`[data-mio-trait="${family}"]`)||[])],org=catalog[select.value],model=org?traitModel(org,traits):null;
  const controls=[...document.querySelectorAll('[data-mio-org]')];
  content.innerHTML=`<aside class="mio-family-rail compact"><span class="eyebrow">EQUIPMENT</span>${controls.map(control=>{const kind=familyKind(control);return `<button type="button" class="mio-family-card ${control===select?'selected':''}" data-mio-family-board="${esc(control.dataset.mioOrg)}"><span class="visual-option-icon ${kind}">${iconSvg(kind)}</span><span><b>${esc(familyTitle(control))}</b><small>${esc(displayLabel(control.value,control.selectedOptions?.[0]?.textContent||'No MIO'))}</small></span></button>`;}).join('')}</aside><section class="mio-board-main guided">${!org||PICK_ORG.has(family)?`<div class="mio-stepper"><span class="done"><i>1</i>Equipment</span><span class="current"><i>2</i>Organization</span><span><i>3</i>Trait path</span></div><section class="mio-board-section mio-org-stage"><div class="mio-section-title"><div><span class="eyebrow">${esc(familyTitle(select).toUpperCase())}</span><h3>Choose one organization</h3><p>Country/generic choices are shown first. Global alternatives stay hidden unless you deliberately open theorycraft mode.</p></div>${org?`<button type="button" class="btn" data-mio-cancel-org-change>Back to ${esc(displayLabel(org.id,org.name||org.id))}</button>`:''}</div>${orgCards(select,catalog)}</section>`:pathMarkup(select,org,traits,model)}</section>`;

  content.querySelectorAll('[data-mio-family-board]').forEach(button=>button.onclick=()=>openBoard(button.dataset.mioFamilyBoard));
  content.querySelector('[data-mio-theorycraft]')?.addEventListener('click',()=>{toggleTheorycraft(select);renderBoard(select,content);});
  content.querySelector('[data-mio-change-org]')?.addEventListener('click',()=>{PICK_ORG.add(family);renderBoard(select,content);});
  content.querySelector('[data-mio-cancel-org-change]')?.addEventListener('click',()=>{PICK_ORG.delete(family);renderBoard(select,content);});
  content.querySelector('[data-mio-clear-org]')?.addEventListener('click',()=>{select.value='';select.dispatchEvent(new Event('change',{bubbles:true}));PICK_ORG.delete(family);queueMicrotask(()=>openBoard(family));});
  content.querySelector('[data-mio-reset-path]')?.addEventListener('click',()=>{select.dispatchEvent(new Event('change',{bubbles:true}));queueMicrotask(()=>openBoard(family));});
  content.querySelectorAll('[data-workflow-org]').forEach(button=>button.onclick=()=>{select.value=button.dataset.workflowOrg;select.dispatchEvent(new Event('change',{bubbles:true}));PICK_ORG.delete(family);queueMicrotask(()=>openBoard(family));});
  content.querySelectorAll('[data-workflow-trait]').forEach(button=>button.onclick=()=>{
    const freshArticle=document.querySelector(`[data-mio-org="${CSS.escape(family)}"]`)?.closest('.mio-assignment'),input=[...(freshArticle?.querySelectorAll(`[data-mio-trait="${CSS.escape(family)}"]`)||[])].find(x=>x.value===button.dataset.workflowTrait);if(!input||input.disabled)return;
    input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));queueMicrotask(()=>openBoard(family));
  });
}

function openBoard(preferredFamily=''){
  closeBoard();const controls=[...document.querySelectorAll('[data-mio-org]')];if(!controls.length)return;
  const select=controls.find(x=>x.dataset.mioOrg===preferredFamily)||controls[0];
  const shell=document.createElement('div');shell.id='mio-board-modal';shell.className='system-board-shell';shell.innerHTML='<div class="system-board-backdrop"></div><section class="system-board mio-system-board guided" role="dialog" aria-modal="true" aria-label="Military Industrial Organizations"><header><div><span class="eyebrow">MILITARY INDUSTRIAL ORGANIZATIONS</span><h2>MIO Workshop</h2><p>Three steps: choose the equipment family, pick one organization, then follow only the trait nodes that are available next.</p></div><button type="button" class="visual-picker-close" data-close-mio aria-label="Close MIO board">×</button></header><div class="mio-board-content guided"></div></section>';
  document.body.append(shell);document.documentElement.classList.add('picker-open');shell.querySelector('.system-board-backdrop').onclick=closeBoard;shell.querySelector('[data-close-mio]').onclick=closeBoard;renderBoard(select,shell.querySelector('.mio-board-content'));
}

function compactAssignments(){
  document.querySelectorAll('.mio-assignment').forEach(article=>{
    if(article.dataset.mioCompact==='1')return;const select=article.querySelector('[data-mio-org]');if(!select)return;article.dataset.mioCompact='1';article.classList.add('mio-assignment-compact-source');
    const family=select.dataset.mioOrg,title=familyTitle(select),kind=familyKind(select),traits=[...article.querySelectorAll(`[data-mio-trait="${family}"]`)],selected=traits.filter(x=>x.checked).length,button=document.createElement('button');button.type='button';button.className='mio-compact-card';button.innerHTML=`<span class="visual-option-icon ${kind}">${iconSvg(kind)}</span><span><small>${esc(title)}</small><b>${esc(displayLabel(select.value,select.selectedOptions?.[0]?.textContent||'No MIO assigned'))}</b><em>${select.value?`${selected} trait${selected===1?'':'s'} selected`:'Choose organization'}</em></span><span class="visual-trigger-chevron">›</span>`;button.onclick=()=>openBoard(family);article.append(button);
  });
}
function injectLauncher(){
  const bar=ensureActionBar();if(!bar||bar.querySelector('[data-open-mio-board]'))return;const button=document.createElement('button');button.type='button';button.className='btn visual-board-launch';button.dataset.openMioBoard='1';button.innerHTML=`<span class="board-button-icon">${iconSvg('industry')}</span><span><small>GUIDED</small><b>MIO Workshop</b></span>`;button.onclick=()=>openBoard();bar.append(button);
}
function inject(){injectLauncher();compactAssignments();}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('mio-board-modal'))closeBoard();});
registerUiEnhancer(inject);

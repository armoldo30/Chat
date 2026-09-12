import { displayLabel, iconSvg, visualKind } from './ui-labels.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function resolvedKind(value,base='industry'){const kind=visualKind(value);return kind==='generic'?base:kind;}
function optionLabel(option){return displayLabel(option?.value,option?.textContent);}
function closeBoard(){document.getElementById('inline-mio-board-modal')?.remove();document.documentElement.classList.remove('picker-open');}

function drawerForSelectId(id){const select=document.getElementById(id);return select?.closest('.mio-drawer')||null;}
function familyTitle(drawer){
  const summary=drawer?.querySelector('summary'),family=drawer?.querySelector('.inline-mio-head .eyebrow')?.textContent?.trim();
  return family||summary?.querySelector('span')?.textContent?.replace(/^MIO\s*·\s*/i,'').trim()||'Military Industrial Organization';
}

function openBoard(selectId){
  closeBoard();
  const drawer=drawerForSelectId(selectId),select=document.getElementById(selectId);if(!drawer||!select)return;
  const prefix=selectId.replace(/-mio-org$/,''),traits=[...drawer.querySelectorAll(`[data-inline-mio="${prefix}"]`)],title=familyTitle(drawer);
  const shell=document.createElement('div');shell.id='inline-mio-board-modal';shell.className='system-board-shell';
  shell.innerHTML=`<div class="system-board-backdrop"></div><section class="system-board mio-system-board" role="dialog" aria-modal="true" aria-label="${title}"><header><div><span class="eyebrow">MILITARY INDUSTRIAL ORGANIZATION</span><h2>${title}</h2><p>Choose the manufacturer and activate available trait nodes for this design.</p></div><button type="button" class="visual-picker-close" data-close-inline-mio aria-label="Close MIO board">×</button></header><div class="mio-board-content inline-mio-board-content"></div></section>`;
  document.body.append(shell);document.documentElement.classList.add('picker-open');shell.querySelector('.system-board-backdrop').onclick=closeBoard;shell.querySelector('[data-close-inline-mio]').onclick=closeBoard;
  const content=shell.querySelector('.inline-mio-board-content');
  content.innerHTML=`<section class="mio-board-main"><div class="mio-board-section"><span class="eyebrow">ORGANIZATION</span><div class="mio-org-cards">${[...select.options].map(option=>`<button type="button" class="mio-org-card ${option.selected?'selected':''}" data-inline-mio-org-board="${option.value}" ${option.disabled?'disabled':''}><span class="visual-option-icon industry">${iconSvg('industry')}</span><b>${optionLabel(option)}</b>${option.selected?'<span class="visual-option-check">✓</span>':''}</button>`).join('')}</div></div><div class="mio-board-section"><div class="mio-tree-heading"><span class="eyebrow">TRAIT TREE</span><small>${traits.filter(x=>x.checked).length} selected</small></div>${traits.length?`<div class="mio-board-traits">${traits.map(input=>{const label=input.closest('label'),name=displayLabel(input.value,label?.querySelector('span')?.textContent||input.value),kind=resolvedKind(input.value,'industry');return `<button type="button" class="mio-board-trait ${input.checked?'selected':''} ${input.disabled?'locked':''}" data-inline-mio-trait-board="${input.value}" ${input.disabled?'disabled':''}><span class="node-emblem ${kind}">${iconSvg(kind)}</span><span><b>${name}</b><small>${input.checked?'ACTIVE':input.disabled?'LOCKED':'AVAILABLE'}</small></span></button>`;}).join('')}</div>`:`<div class="mio-board-empty"><span class="visual-option-icon industry">${iconSvg('industry')}</span><b>No trait tree visible</b><p>Select an organization above. Its parsed traits will appear here.</p></div>`}</div></section>`;
  content.querySelectorAll('[data-inline-mio-org-board]').forEach(button=>button.onclick=()=>{
    if(select.value===button.dataset.inlineMioOrgBoard)return;
    select.value=button.dataset.inlineMioOrgBoard;select.dispatchEvent(new Event('change',{bubbles:true}));queueMicrotask(()=>openBoard(selectId));
  });
  content.querySelectorAll('[data-inline-mio-trait-board]').forEach(button=>button.onclick=()=>{
    const input=traits.find(x=>x.value===button.dataset.inlineMioTraitBoard);if(!input||input.disabled)return;
    input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));queueMicrotask(()=>openBoard(selectId));
  });
}

function injectDrawer(drawer){
  if(!drawer||drawer.dataset.directMioBoard==='1')return;const select=drawer.querySelector('select[id$="-mio-org"]');if(!select)return;
  drawer.dataset.directMioBoard='1';drawer.classList.add('inline-mio-source-drawer');
  const summary=drawer.querySelector('summary'),selected=select.selectedOptions?.[0],title=familyTitle(drawer),kind=resolvedKind(select.value,'industry');
  const button=document.createElement('button');button.type='button';button.className='inline-mio-board-launch';
  button.innerHTML=`<span class="visual-trigger-icon ${kind}">${iconSvg(kind)}</span><span><small>${title}</small><b>${optionLabel(selected)}</b></span><span class="visual-trigger-chevron">›</span>`;
  button.onclick=()=>openBoard(select.id);drawer.insertAdjacentElement('beforebegin',button);
  if(summary)summary.dataset.advancedMioSource='1';
}

function inject(){document.querySelectorAll('.mio-drawer').forEach(injectDrawer);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('inline-mio-board-modal'))closeBoard();});
registerUiEnhancer(inject);

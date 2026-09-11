import { displayLabel, iconSvg, visualKind } from './ui-labels.js';

function resolvedKind(value,base='industry'){
  const kind=visualKind(value);return kind==='generic'?base:kind;
}
function optionLabel(option){return displayLabel(option?.value,option?.textContent);}
function familyTitle(select){return select.closest('.mio-assignment')?.querySelector(':scope > div > span')?.textContent?.trim()||displayLabel(select.dataset.mioOrg||'MIO');}

function ensureActionBar(){
  const head=document.querySelector('.tech-doctrine-panel .tech-profile-head');if(!head)return null;
  let bar=head.querySelector('.visual-board-actions');
  if(!bar){bar=document.createElement('div');bar.className='visual-board-actions';head.append(bar);}
  return bar;
}
function closeBoard(){document.getElementById('mio-board-modal')?.remove();document.documentElement.classList.remove('picker-open');}

function openBoard(preferredFamily=''){
  closeBoard();
  const controls=[...document.querySelectorAll('[data-mio-org]')];if(!controls.length)return;
  const select=controls.find(x=>x.dataset.mioOrg===preferredFamily)||controls[0],family=select.dataset.mioOrg,article=select.closest('.mio-assignment'),traits=[...(article?.querySelectorAll('[data-mio-trait]')||[])];
  const shell=document.createElement('div');shell.id='mio-board-modal';shell.className='system-board-shell';
  shell.innerHTML='<div class="system-board-backdrop"></div><section class="system-board mio-system-board" role="dialog" aria-modal="true" aria-label="Military Industrial Organizations"><header><div><span class="eyebrow">INDUSTRIAL DESIGN BUREAUS</span><h2>Military Industrial Organizations</h2><p>Select a production family, organization, and its available trait nodes.</p></div><button type="button" class="visual-picker-close" data-close-mio aria-label="Close MIO board">×</button></header><div class="mio-board-content"></div></section>';
  document.body.append(shell);document.documentElement.classList.add('picker-open');shell.querySelector('.system-board-backdrop').onclick=closeBoard;shell.querySelector('[data-close-mio]').onclick=closeBoard;
  const content=shell.querySelector('.mio-board-content'),title=familyTitle(select);
  content.innerHTML=`<aside class="mio-family-rail"><span class="eyebrow">EQUIPMENT FAMILY</span>${controls.map(control=>{const kind=resolvedKind(control.dataset.mioOrg,'industry');return `<button type="button" class="mio-family-card ${control===select?'selected':''}" data-mio-family-board="${control.dataset.mioOrg}"><span class="visual-option-icon ${kind}">${iconSvg(kind)}</span><span><b>${familyTitle(control)}</b><small>${optionLabel(control.selectedOptions?.[0])}</small></span></button>`;}).join('')}</aside><section class="mio-board-main"><div class="mio-board-section"><span class="eyebrow">${title.toUpperCase()} · ORGANIZATION</span><div class="mio-org-cards">${[...select.options].map(option=>`<button type="button" class="mio-org-card ${option.selected?'selected':''}" data-mio-org-board="${option.value}" ${option.disabled?'disabled':''}><span class="visual-option-icon industry">${iconSvg('industry')}</span><b>${optionLabel(option)}</b>${option.selected?'<span class="visual-option-check">✓</span>':''}</button>`).join('')}</div></div><div class="mio-board-section"><div class="mio-tree-heading"><span class="eyebrow">TRAIT TREE</span><small>${traits.filter(x=>x.checked).length} selected</small></div>${traits.length?`<div class="mio-board-traits">${traits.map(input=>{const label=input.closest('label'),name=displayLabel(input.value,label?.querySelector('span')?.textContent||input.value),kind=resolvedKind(input.value,'industry');return `<button type="button" class="mio-board-trait ${input.checked?'selected':''} ${input.disabled?'locked':''}" data-mio-trait-board="${input.value}" ${input.disabled?'disabled':''}><span class="node-emblem ${kind}">${iconSvg(kind)}</span><span><b>${name}</b><small>${input.checked?'ACTIVE':input.disabled?'LOCKED':'AVAILABLE'}</small></span></button>`;}).join('')}</div>`:'<div class="mio-board-empty"><span class="visual-option-icon industry">'+iconSvg('industry')+'</span><b>No trait tree visible</b><p>Select an organization above. Its parsed traits will appear here.</p></div>'}</div></section>`;
  content.querySelectorAll('[data-mio-family-board]').forEach(button=>button.onclick=()=>openBoard(button.dataset.mioFamilyBoard));
  content.querySelectorAll('[data-mio-org-board]').forEach(button=>button.onclick=()=>{
    if(select.value===button.dataset.mioOrgBoard)return;
    select.value=button.dataset.mioOrgBoard;select.dispatchEvent(new Event('change',{bubbles:true}));queueMicrotask(()=>openBoard(family));
  });
  content.querySelectorAll('[data-mio-trait-board]').forEach(button=>button.onclick=()=>{
    const input=traits.find(x=>x.value===button.dataset.mioTraitBoard);if(!input||input.disabled)return;
    input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));queueMicrotask(()=>openBoard(family));
  });
}

function injectLauncher(){
  const bar=ensureActionBar();if(!bar||bar.querySelector('[data-open-mio-board]'))return;
  const button=document.createElement('button');button.type='button';button.className='btn visual-board-launch';button.dataset.openMioBoard='1';button.innerHTML=`<span class="board-button-icon">${iconSvg('industry')}</span><span><small>FULL VIEW</small><b>MIO Board</b></span>`;button.onclick=()=>openBoard();bar.append(button);
}

let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;injectLauncher();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('mio-board-modal'))closeBoard();});schedule();

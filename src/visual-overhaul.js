import { displayLabel, looksLikeIdentifier, visualKind, iconSvg } from './ui-labels.js';
import { itemIconKey, itemIconSvg } from './item-icons.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

const PICKER_TARGETS=[
  ['#land-grand','doctrine','Grand Doctrine'],
  ['[data-doctrine-choice]','doctrine','Doctrine'],
  ['[id$="-air-grand"]','doctrine','Air Doctrine'],
  ['[data-air-doctrine-choice]','doctrine','Air Doctrine'],
  ['[data-mio-org]','industry','Military Industrial Organization'],
  ['select[id$="-mio-org"]','industry','Military Industrial Organization'],
  ['.tank-module-grid select','armor','Tank Module'],
  ['.air-module-grid select','air','Aircraft Module'],
  ['.tech-equipment-grid select','generic','Equipment Tier']
];

function selectorTitle(select,fallback){
  const label=select.closest('label');
  const span=label?.querySelector(':scope > span');
  const text=(span?.textContent||label?.childNodes?.[0]?.textContent||'').trim();
  return text||fallback;
}

function optionLabel(option){return displayLabel(option?.value,option?.textContent);}
function resolvedKind(value,base='generic'){
  const detected=visualKind(value);
  return detected==='generic'?(base||'generic'):detected;
}

function relabelOptions(root=document){
  root.querySelectorAll('select option').forEach(option=>{
    const current=String(option.textContent||'').trim();
    if(current===option.value||looksLikeIdentifier(current))option.textContent=displayLabel(option.value,current);
  });
  root.querySelectorAll('.mio-trait input[type="checkbox"]').forEach(input=>{
    const span=input.closest('label')?.querySelector('span');
    if(span&&(String(span.textContent).trim()===input.value||looksLikeIdentifier(span.textContent)))span.textContent=displayLabel(input.value,span.textContent);
  });
}

function ensureModal(){
  let modal=document.getElementById('visual-picker-modal');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='visual-picker-modal';modal.className='visual-picker-shell';modal.hidden=true;
  modal.innerHTML=`<div class="visual-picker-backdrop" data-picker-close></div><section class="visual-picker" role="dialog" aria-modal="true" aria-labelledby="visual-picker-title"><header><div><span class="eyebrow">VISUAL SELECTOR</span><h2 id="visual-picker-title">Choose</h2><p id="visual-picker-help"></p></div><button type="button" class="visual-picker-close" data-picker-close aria-label="Close selector">×</button></header><div class="visual-picker-grid" id="visual-picker-grid"></div></section>`;
  document.body.append(modal);
  modal.querySelectorAll('[data-picker-close]').forEach(el=>el.addEventListener('click',()=>closeModal()));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeModal();});
  return modal;
}

let lastTrigger=null;
function closeModal(){
  const modal=document.getElementById('visual-picker-modal');if(!modal)return;
  modal.hidden=true;document.documentElement.classList.remove('picker-open');
  lastTrigger?.focus?.();lastTrigger=null;
}

function semanticIcon(option,baseKind,title=''){
  const label=optionLabel(option),value=option?.value||'',kind=resolvedKind(`${value} ${label}`,baseKind),specific=itemIconKey(value,label,baseKind);
  return {label,kind,specific,svg:itemIconSvg(value,label,baseKind,kind),title};
}

function openPicker(select,baseKind,title){
  const modal=ensureModal(),grid=modal.querySelector('#visual-picker-grid');lastTrigger=select.nextElementSibling;
  modal.querySelector('#visual-picker-title').textContent=title;
  modal.querySelector('#visual-picker-help').textContent='Choose visually. Each selectable item has its own pictogram; the underlying game-data value remains unchanged.';
  grid.innerHTML='';
  [...select.options].forEach(option=>{
    const visual=semanticIcon(option,baseKind,title);
    const card=document.createElement('button');card.type='button';card.className=`visual-option ${option.selected?'selected':''}`;card.disabled=option.disabled;
    card.innerHTML=`<span class="visual-option-icon ${visual.kind} semantic-${visual.specific}">${visual.svg}</span><span class="visual-option-copy"><b>${visual.label}</b>${option.value&&visual.label.toLowerCase()!==String(option.value).toLowerCase()?`<small>${displayLabel(option.value)}</small>`:''}</span>${option.selected?'<span class="visual-option-check">✓</span>':''}`;
    card.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));closeModal();});
    grid.append(card);
  });
  modal.hidden=false;document.documentElement.classList.add('picker-open');requestAnimationFrame(()=>grid.querySelector('.selected')?.focus());
}

function enhanceSelect(select,baseKind,title){
  if(!select||select.dataset.visualEnhanced==='1')return;
  select.dataset.visualEnhanced='1';select.classList.add('visual-source-select');
  const button=document.createElement('button');button.type='button';button.className='visual-picker-trigger';
  const refresh=()=>{
    const option=select.selectedOptions?.[0]||select.options?.[select.selectedIndex],visual=semanticIcon(option,baseKind,title);
    button.innerHTML=`<span class="visual-trigger-icon ${visual.kind} semantic-${visual.specific}">${visual.svg}</span><span><small>${selectorTitle(select,title)}</small><b>${visual.label}</b></span><span class="visual-trigger-chevron">›</span>`;
    button.title=`Choose ${selectorTitle(select,title)}`;
  };
  refresh();button.addEventListener('click',()=>openPicker(select,baseKind,selectorTitle(select,title)));select.addEventListener('change',refresh);select.insertAdjacentElement('afterend',button);
}

function enhanceMastery(range){
  if(!range||range.dataset.visualMastery==='1')return;
  range.dataset.visualMastery='1';range.classList.add('visual-source-range');
  const pips=document.createElement('div');pips.className='mastery-pips';pips.setAttribute('role','group');pips.setAttribute('aria-label','Doctrine mastery');
  const current=Number(range.value)||0;
  for(let i=0;i<=5;i++){
    const b=document.createElement('button');b.type='button';b.className=`mastery-pip ${i<=current?'filled':''} ${i===current?'current':''}`;b.dataset.value=String(i);b.setAttribute('aria-label',`Set mastery to ${i} of 5`);b.innerHTML=`<span>${i===0?'○':'◆'}</span><small>${i}</small>`;
    b.addEventListener('click',()=>{range.value=String(i);range.dispatchEvent(new Event('change',{bubbles:true}));});pips.append(b);
  }
  range.insertAdjacentElement('afterend',pips);
}

function enhanceMioTraits(root=document){
  root.querySelectorAll('.mio-trait').forEach(label=>{
    if(label.dataset.visualNode==='1')return;label.dataset.visualNode='1';label.classList.add('visual-mio-node');
    const input=label.querySelector('input'),span=label.querySelector('span');
    if(span){const kind=resolvedKind(input?.value,'industry');span.insertAdjacentHTML('afterbegin',`<i class="mio-node-icon ${kind}">${iconSvg(kind)}</i>`);}
  });
}

function enhanceVisualControls(root=document){
  relabelOptions(root);
  for(const [selector,kind,title] of PICKER_TARGETS)root.querySelectorAll(selector).forEach(select=>enhanceSelect(select,kind,title));
  root.querySelectorAll('[data-doctrine-mastery],[data-air-doctrine-mastery]').forEach(enhanceMastery);
  enhanceMioTraits(root);
}

registerUiEnhancer(()=>enhanceVisualControls(document));

import { displayLabel } from './ui-labels.js';

const TARGETS=[
  ['#b-terrain','terrain'],['#f-terrain','terrain'],['#b-river','river'],['#role','role'],['#air-mission','air']
];

const svg=body=>`<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${body}</svg>`;
function pictogram(value,kind){
  const key=String(value||'').toLowerCase();
  if(kind==='terrain'){
    if(key.includes('forest'))return svg('<path d="M9 38h30M15 36V20m-6 6 6-15 7 15zm18 10V18m-7 9 7-18 8 18z"/>');
    if(key.includes('mountain'))return svg('<path d="M5 38 19 12l7 13 5-8 12 21zM15 19l4 5 3-4"/>');
    if(key.includes('hill'))return svg('<path d="M4 37c8-16 18-18 27-5 4-6 8-7 13 5M8 41h35"/>');
    if(key.includes('desert'))return svg('<circle cx="35" cy="12" r="6"/><path d="M4 35c9-8 16-8 25 0 5-5 10-5 15 0M5 41h39"/>');
    if(key.includes('jungle'))return svg('<path d="M24 39V21M24 22c-11 1-14-5-14-11 8 0 13 3 14 11zm0 0c11 1 14-5 14-11-8 0-13 3-14 11zM18 39h12"/>');
    if(key.includes('marsh'))return svg('<path d="M5 35c6-4 11 4 17 0s11 4 21 0M5 41h38M14 32V14m0 7-5-5m5 8 6-7M34 32V18m0 7 5-5"/>');
    if(key.includes('urban'))return svg('<path d="M7 39V21h10v18m3 0V10h12v29m3 0V25h7v14M11 26h3m-3 6h3m13-16h3m-3 7h3m-3 7h3"/>');
    return svg('<path d="M5 36h38M8 31c9-8 18-8 27 0M14 22h20"/>');
  }
  if(kind==='river')return key==='0'?svg('<path d="M6 24h36M13 18l-7 6 7 6m22-12 7 6-7 6"/>'):svg('<path d="M5 14c7 6 12 6 19 0s12-6 19 0M5 24c7 6 12 6 19 0s12-6 19 0M5 34c7 6 12 6 19 0s12-6 19 0"/>');
  if(kind==='air'){
    if(key.includes('naval'))return svg('<path d="M24 5l4 14 13 5-2 5-12-2-2 14h-3l-2-14-12 2-2-5 13-5zM7 42c7-4 11 4 17 0s10 4 17 0"/>');
    if(key==='cas'||key.includes('support'))return svg('<path d="M24 5l4 14 13 5-2 5-12-2-2 14h-3l-2-14-12 2-2-5 13-5zM13 39h-6m3-3v6"/>');
    return svg('<path d="M24 5l5 15 13 5-2 5-12-2-2 14h-4l-2-14-12 2-2-5 13-5z"/>');
  }
  if(kind==='role'){
    if(/defen|hold|guard/.test(key))return svg('<path d="M24 5 39 11v11c0 10-6 17-15 21C15 39 9 32 9 22V11zM17 24l5 5 10-11"/>');
    if(/break|assault|attack|offen/.test(key))return svg('<path d="M8 39 36 11m-7-2 9 0 0 9M11 29l8 8M7 34l7 7"/>');
    return svg('<circle cx="24" cy="24" r="15"/><path d="M24 10v28M10 24h28"/>');
  }
  return svg('<circle cx="24" cy="24" r="15"/><path d="M16 24h16M24 16v16"/>');
}

function cleanOption(option){
  const raw=String(option.textContent||'').trim(),parts=raw.split('·').map(x=>x.trim());
  return {name:displayLabel(option.value,parts[0]||raw),detail:parts.slice(1).join(' · ')};
}
function enhance(select,kind){
  if(!select||select.dataset.quickVisual==='1'||select.dataset.visualEnhanced==='1')return;
  select.dataset.quickVisual='1';select.classList.add('visual-source-select');
  const strip=document.createElement('div');strip.className=`quick-visual-choices ${kind}-choices`;
  [...select.options].forEach(option=>{
    const text=cleanOption(option),button=document.createElement('button');button.type='button';button.className=`quick-visual-choice ${option.selected?'selected':''}`;button.disabled=option.disabled;button.dataset.value=option.value;
    button.innerHTML=`<span class="quick-choice-icon">${pictogram(option.value,kind)}</span><span class="quick-choice-copy"><b>${text.name}</b>${text.detail?`<small>${text.detail}</small>`:''}</span>`;
    button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));};strip.append(button);
  });
  select.insertAdjacentElement('afterend',strip);
}
function run(){for(const [selector,kind] of TARGETS)document.querySelectorAll(selector).forEach(select=>enhance(select,kind));}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;run();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

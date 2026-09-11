import { displayLabel, looksLikeIdentifier } from './ui-labels.js';

const TARGETS='option,td,th,span,b,strong,h3,small';
const blockedTags=new Set(['CODE','PRE','SCRIPT','STYLE','TEXTAREA']);

function isTechnicalToken(text){
  const value=String(text||'').trim();
  return /[\\/]/.test(value)||/\.(?:txt|lua|yml|yaml|gui|asset|json|md)$/i.test(value)||/^[a-f0-9]{16,}$/i.test(value)||/^https?:/i.test(value);
}
function cleanElement(element){
  if(!element||element.dataset?.rawGameId||blockedTags.has(element.tagName)||element.childElementCount)return;
  const raw=String(element.textContent||'').trim();if(!raw||raw.length>100||isTechnicalToken(raw)||!looksLikeIdentifier(raw))return;
  const label=displayLabel(raw,raw);if(!label||label===raw)return;
  element.dataset.rawGameId=raw;element.textContent=label;
  if(!element.title)element.title=`Game ID: ${raw}`;
}
function run(root=document){
  const scope=root.querySelector?.('#app')||root;if(!scope?.querySelectorAll)return;
  scope.querySelectorAll(TARGETS).forEach(cleanElement);
}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;run(document);});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

import { displayLabel, looksLikeIdentifier } from './ui-labels.js';
import { sourceLocalizedValue } from './source-display-label.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

const TARGETS='option,td,th,span,b,strong,h3,small';
const blockedTags=new Set(['CODE','PRE','SCRIPT','STYLE','TEXTAREA']);

function isTechnicalToken(text){
  const value=String(text||'').trim();
  return /[\\/]/.test(value)||/\.(?:txt|lua|yml|yaml|gui|asset|json|md)$/i.test(value)||/^[a-f0-9]{16,}$/i.test(value)||/^https?:/i.test(value);
}
function cleanOption(element){
  const id=String(element?.value||'').trim(),raw=String(element?.textContent||'').trim();
  if(!id||!raw||isTechnicalToken(id))return false;
  const exact=sourceLocalizedValue(id);if(!exact||exact===raw)return false;
  element.dataset.rawGameId=id;element.textContent=exact;
  if(!element.title)element.title=`Game ID: ${id}`;
  return true;
}
function cleanElement(element){
  if(!element||element.dataset?.rawGameId||blockedTags.has(element.tagName)||element.childElementCount)return;
  if(element.tagName==='OPTION'&&cleanOption(element))return;
  const raw=String(element.textContent||'').trim();if(!raw||raw.length>100||isTechnicalToken(raw)||!looksLikeIdentifier(raw))return;
  const label=displayLabel(raw,raw);if(!label||label===raw)return;
  element.dataset.rawGameId=raw;element.textContent=label;
  if(!element.title)element.title=`Game ID: ${raw}`;
}
function run(root=document){
  const scope=root.querySelector?.('#app')||root;if(!scope?.querySelectorAll)return;
  scope.querySelectorAll(TARGETS).forEach(cleanElement);
}
registerUiEnhancer(()=>run(document));

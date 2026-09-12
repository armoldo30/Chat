import { iconSvgFor, semanticIconKey, visualKind } from './ui-labels.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function resolvedKind(value,base='infantry'){const kind=visualKind(value);return kind==='generic'?base:kind;}
function iconMarkup(id,label='',base='infantry'){
  const broad=resolvedKind(`${id} ${label}`,base),specific=semanticIconKey(id,label);
  return `<span class="division-unit-icon ${broad} semantic-${specific}">${iconSvgFor(id,label,broad)}</span>`;
}

function enhancePickerChoice(button){
  if(button.dataset.pictureChoice==='1')return;const id=button.dataset.choice;if(!id)return;
  button.dataset.pictureChoice='1';button.classList.add('picture-picker-choice');const code=button.querySelector(':scope > b'),label=button.querySelector('small')?.textContent||button.title||'';
  if(code){code.classList.add('unit-code-hidden');code.insertAdjacentHTML('afterend',iconMarkup(id,label));}
}
function enhanceBattalionSlot(button){
  if(button.dataset.pictureSlot==='1')return;button.dataset.pictureSlot='1';const symbol=button.querySelector('.unit-symbol'),label=button.querySelector('small')?.textContent||button.title||'',raw=symbol?.textContent||label,broad=resolvedKind(`${raw} ${label}`),specific=semanticIconKey(raw,label);
  if(symbol){symbol.classList.add('picture-unit-symbol',broad,`semantic-${specific}`);symbol.innerHTML=iconSvgFor(raw,label,broad);}
}
function enhanceRegimentalSupport(button){
  if(button.dataset.pictureSupport==='1')return;button.dataset.pictureSupport='1';const symbol=button.querySelector(':scope > span'),label=button.querySelector('small')?.textContent||button.title||'',raw=symbol?.textContent||label,broad=resolvedKind(`${raw} ${label}`,'support'),specific=semanticIconKey(raw,label);
  if(symbol){symbol.classList.add('picture-unit-symbol',broad,`semantic-${specific}`);symbol.innerHTML=iconSvgFor(raw,label,broad);}
}
function run(){
  document.querySelectorAll('.picker-choice[data-choice]').forEach(enhancePickerChoice);
  document.querySelectorAll('.hoi-battalion-slot.filled').forEach(enhanceBattalionSlot);
  document.querySelectorAll('.regimental-support.filled').forEach(enhanceRegimentalSupport);
}
registerUiEnhancer(run);

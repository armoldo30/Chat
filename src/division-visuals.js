import { visualKind } from './ui-labels.js';
import { hoi4ModelIconKey, hoi4ModelIconSvg } from './hoi4-model-icons.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function resolvedKind(value,base='infantry'){const kind=visualKind(value);return kind==='generic'?base:kind;}
function iconMarkup(id,label='',base='infantry'){
  const broad=resolvedKind(`${id} ${label}`,base),specific=hoi4ModelIconKey(id,label,base);
  return `<span class="division-unit-icon ${broad} semantic-${specific} hoi4-${specific}">${hoi4ModelIconSvg(id,label,base,broad,'Division unit')}</span>`;
}

function enhancePickerChoice(button){
  if(button.dataset.pictureChoice==='1')return;const id=button.dataset.choice;if(!id)return;
  button.dataset.pictureChoice='1';button.classList.add('picture-picker-choice');const code=button.querySelector(':scope > b'),label=button.querySelector('small')?.textContent||button.title||'';
  if(code){code.classList.add('unit-code-hidden');code.insertAdjacentHTML('afterend',iconMarkup(id,label));}
}
function decorateSlot(button,marker,base='support'){
  if(button.dataset[marker]==='1')return;button.dataset[marker]='1';const symbol=button.querySelector('.unit-symbol,:scope > span'),label=button.querySelector('small')?.textContent||button.title||'',raw=button.dataset.iconValue||symbol?.textContent||label,broad=resolvedKind(`${raw} ${label}`,base),specific=hoi4ModelIconKey(raw,label,base);
  if(symbol){symbol.classList.add('picture-unit-symbol',broad,`semantic-${specific}`,`hoi4-${specific}`);symbol.innerHTML=hoi4ModelIconSvg(raw,label,base,broad,base==='support'?'Support company':'Division unit');}
}
function enhanceBattalionSlot(button){decorateSlot(button,'pictureSlot','infantry');}
function enhanceRegimentalSupport(button){decorateSlot(button,'pictureSupport','support');}
function enhanceDivisionalSupport(button){decorateSlot(button,'pictureDivisionSupport','support');}
function run(){
  document.querySelectorAll('.picker-choice[data-choice]').forEach(enhancePickerChoice);
  document.querySelectorAll('.hoi-battalion-slot.filled').forEach(enhanceBattalionSlot);
  document.querySelectorAll('.regimental-support.filled').forEach(enhanceRegimentalSupport);
  document.querySelectorAll('.hoi-support-slot.filled').forEach(enhanceDivisionalSupport);
}
registerUiEnhancer(run);

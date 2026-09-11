import { iconSvg, visualKind } from './ui-labels.js';

function resolvedKind(value,base='infantry'){const kind=visualKind(value);return kind==='generic'?base:kind;}
function iconMarkup(kind){return `<span class="division-unit-icon ${kind}">${iconSvg(kind)}</span>`;}

function enhancePickerChoice(button){
  if(button.dataset.pictureChoice==='1')return;const id=button.dataset.choice;if(!id)return;
  button.dataset.pictureChoice='1';button.classList.add('picture-picker-choice');const code=button.querySelector(':scope > b'),kind=resolvedKind(id);
  if(code){code.classList.add('unit-code-hidden');code.insertAdjacentHTML('afterend',iconMarkup(kind));}
}
function enhanceBattalionSlot(button){
  if(button.dataset.pictureSlot==='1')return;button.dataset.pictureSlot='1';const symbol=button.querySelector('.unit-symbol'),label=button.querySelector('small')?.textContent||button.title||'',kind=resolvedKind(label);
  if(symbol){symbol.classList.add('picture-unit-symbol',kind);symbol.innerHTML=iconSvg(kind);}
}
function enhanceRegimentalSupport(button){
  if(button.dataset.pictureSupport==='1')return;button.dataset.pictureSupport='1';const symbol=button.querySelector(':scope > span'),label=button.querySelector('small')?.textContent||button.title||'',kind=resolvedKind(label,'support');
  if(symbol){symbol.classList.add('picture-unit-symbol',kind);symbol.innerHTML=iconSvg(kind);}
}
function run(){
  document.querySelectorAll('.picker-choice[data-choice]').forEach(enhancePickerChoice);
  document.querySelectorAll('.hoi-battalion-slot.filled').forEach(enhanceBattalionSlot);
  document.querySelectorAll('.regimental-support.filled').forEach(enhanceRegimentalSupport);
}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;run();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

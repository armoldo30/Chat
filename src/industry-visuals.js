import { iconSvg, visualKind } from './ui-labels.js';

function resolvedKind(text){const kind=visualKind(text);return kind==='generic'?'industry':kind;}
function decorateBadge(badge){
  if(!badge||badge.dataset.pictureEquipment==='1')return;badge.dataset.pictureEquipment='1';
  const row=badge.closest('.advisor-line'),name=row?.querySelector('.advisor-eq b')?.textContent||badge.textContent||'',kind=resolvedKind(name);
  badge.classList.add('equipment-picture-badge',kind);badge.innerHTML=iconSvg(kind);badge.title=name;
}
function decorateStock(label){
  if(!label||label.dataset.pictureStock==='1')return;const name=label.querySelector(':scope > span');if(!name)return;
  label.dataset.pictureStock='1';const kind=resolvedKind(name.textContent);name.insertAdjacentHTML('afterbegin',`<i class="stock-equipment-icon ${kind}">${iconSvg(kind)}</i>`);
}
function decorateLoss(span){
  if(!span||span.dataset.pictureLoss==='1')return;const name=span.querySelector('b');if(!name)return;
  span.dataset.pictureLoss='1';const kind=resolvedKind(name.textContent);span.insertAdjacentHTML('afterbegin',`<i class="loss-equipment-icon ${kind}">${iconSvg(kind)}</i>`);
}
function run(){
  document.querySelectorAll('.advisor-eq .equipment-badge').forEach(decorateBadge);
  document.querySelectorAll('.stock-grid label').forEach(decorateStock);
  document.querySelectorAll('.loss-list > span').forEach(decorateLoss);
}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;run();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

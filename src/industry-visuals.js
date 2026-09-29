import { visualKind } from './ui-labels.js';
import { hoi4SourceFallbackSvg, hoi4SourceIconSvg } from './hoi4-source-icons.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function resolvedKind(text){const kind=visualKind(text);return kind==='generic'?'industry':kind;}
function equipmentIcon(text,kind){return hoi4SourceIconSvg(text,text,'generic','Equipment')||hoi4SourceFallbackSvg('generic',kind);}
function decorateBadge(badge){
  if(!badge||badge.dataset.pictureEquipment==='1')return;badge.dataset.pictureEquipment='1';
  const row=badge.closest('.advisor-line'),name=row?.querySelector('.advisor-eq b')?.textContent||badge.textContent||'',kind=resolvedKind(name);
  badge.classList.add('equipment-picture-badge',kind);badge.innerHTML=equipmentIcon(name,kind);badge.title=name;
}
function decorateStock(label){
  if(!label||label.dataset.pictureStock==='1')return;const name=label.querySelector(':scope > span');if(!name)return;
  label.dataset.pictureStock='1';const kind=resolvedKind(name.textContent);name.insertAdjacentHTML('afterbegin',`<i class="stock-equipment-icon ${kind}">${equipmentIcon(name.textContent,kind)}</i>`);
}
function decorateLoss(span){
  if(!span||span.dataset.pictureLoss==='1')return;const name=span.querySelector('b');if(!name)return;
  span.dataset.pictureLoss='1';const kind=resolvedKind(name.textContent);span.insertAdjacentHTML('afterbegin',`<i class="loss-equipment-icon ${kind}">${equipmentIcon(name.textContent,kind)}</i>`);
}
function run(){
  document.querySelectorAll('.advisor-eq .equipment-badge').forEach(decorateBadge);
  document.querySelectorAll('.stock-grid label').forEach(decorateStock);
  document.querySelectorAll('.loss-list > span').forEach(decorateLoss);
}
registerUiEnhancer(run);

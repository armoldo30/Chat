import { iconSvg } from './ui-labels.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function kindFor(label='',container){
  const s=String(label).toLowerCase();
  if(/soft attack|ground attack/.test(s))return 'artillery';
  if(/hard attack|pierc/.test(s))return 'antitank';
  if(/air attack|air defense|air defence/.test(s))return 'antiair';
  if(/armor|armour|hardness|breakthrough/.test(s))return 'armor';
  if(/manpower/.test(s))return 'infantry';
  if(/defense|defence|hp|reliability|supply/.test(s))return 'support';
  if(/ic cost|cost|fuel|resource/.test(s))return 'industry';
  if(/agility|range|thrust/.test(s))return 'air';
  if(/speed/.test(s))return container?.closest('.aircraft-designer')?'air':'armor';
  if(/org|width/.test(s))return 'doctrine';
  return 'generic';
}
function labelNode(card){return card.querySelector(':scope > small,:scope > span');}
function enhanceCard(card){
  if(!card||card.dataset.statVisual==='1')return;const label=labelNode(card);if(!label)return;
  const text=label.textContent.trim();if(!text||text.length>40)return;const kind=kindFor(text,card);card.dataset.statVisual='1';card.classList.add('stat-visual-card');
  const icon=document.createElement('i');icon.className=`stat-visual-icon ${kind}`;icon.innerHTML=iconSvg(kind);card.insertBefore(icon,card.firstChild);
}
function run(){
  for(const selector of ['.statgrid .stat','.tank-stat-grid > div','.air-stat-grid > div','.hq-stat-pair > div','.dossier-stats > div','.air-report-metrics > article','.industry-summary > article'])document.querySelectorAll(selector).forEach(enhanceCard);
}
registerUiEnhancer(run);

import { hoi4TextIconForLabel } from './hoi4-text-icons.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function labelNode(card){return card.querySelector(':scope > small,:scope > span');}
function enhanceCard(card){
  if(!card||card.dataset.statVisual==='1')return;const label=labelNode(card);if(!label)return;
  const text=label.textContent.trim();if(!text||text.length>40)return;card.dataset.statVisual='1';
  const markup=hoi4TextIconForLabel(text,'hoi4-texticon stat-source-icon');if(!markup)return;
  card.classList.add('stat-visual-card','stat-source-backed');
  const icon=document.createElement('i');icon.className='stat-visual-icon source-backed';icon.innerHTML=markup;card.insertBefore(icon,card.firstChild);
}
function run(){
  for(const selector of ['.statgrid .stat','.tank-stat-grid > div','.air-stat-grid > div','.hq-stat-pair > div','.dossier-stats > div','.air-report-metrics > article','.industry-summary > article'])document.querySelectorAll(selector).forEach(enhanceCard);
}
registerUiEnhancer(run);

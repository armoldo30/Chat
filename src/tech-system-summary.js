import { displayLabel, iconSvg } from './ui-labels.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function selectedText(select){const option=select?.selectedOptions?.[0];return displayLabel(option?.value,option?.textContent||option?.value||'—');}
function clickLauncher(selector){document.querySelector(selector)?.click();}

function enhance(panel){
  if(!panel||panel.dataset.systemSummary==='1')return;
  const grand=panel.querySelector('#land-grand'),tracks=[...panel.querySelectorAll('[data-doctrine-choice]')],mios=[...panel.querySelectorAll('[data-mio-org]')];
  if(!grand||!tracks.length)return;
  panel.dataset.systemSummary='1';
  const grandRow=panel.querySelector('.grand-doctrine-row'),trackGrid=panel.querySelector('.doctrine-track-grid'),mioGrid=panel.querySelector('.mio-assignment-grid');
  const landSubhead=grandRow?.previousElementSibling,mioSubhead=mioGrid?.previousElementSibling;
  const mastery=[...panel.querySelectorAll('[data-doctrine-mastery]')].reduce((sum,input)=>sum+(Number(input.value)||0),0);
  const assigned=mios.filter(select=>!!select.value),mioNames=assigned.map(selectedText).slice(0,2);
  const summary=document.createElement('div');summary.className='visual-system-summary-grid';
  summary.innerHTML=`<button type="button" class="visual-system-summary doctrine-summary-card" data-summary-doctrine><span class="summary-system-icon doctrine">${iconSvg('doctrine')}</span><span><small>LAND DOCTRINE</small><b>${selectedText(grand)}</b><em>${mastery}/20 mastery · ${tracks.length} tracks</em></span><i>OPEN BOARD ›</i></button><button type="button" class="visual-system-summary mio-summary-card" data-summary-mio><span class="summary-system-icon industry">${iconSvg('industry')}</span><span><small>MILITARY INDUSTRIAL ORGANIZATIONS</small><b>${assigned.length?mioNames.join(' · '):'No MIOs Assigned'}</b><em>${assigned.length}/${mios.length} equipment families assigned</em></span><i>OPEN BOARD ›</i></button>`;
  summary.querySelector('[data-summary-doctrine]').onclick=()=>clickLauncher('[data-open-doctrine-board]');
  summary.querySelector('[data-summary-mio]').onclick=()=>clickLauncher('[data-open-mio-board]');
  (landSubhead||grandRow)?.insertAdjacentElement('beforebegin',summary);

  const advanced=document.createElement('details');advanced.className='system-advanced-source';advanced.innerHTML='<summary>Advanced manual doctrine & MIO controls</summary><div class="system-advanced-source-body"></div>';
  const body=advanced.querySelector('.system-advanced-source-body');
  for(const node of [landSubhead,grandRow,trackGrid,mioSubhead,mioGrid])if(node)body.append(node);
  summary.insertAdjacentElement('afterend',advanced);
}

function run(){document.querySelectorAll('.tech-doctrine-panel').forEach(enhance);}
registerUiEnhancer(run);

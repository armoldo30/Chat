import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function labelDoctrineControls(details){
  const summaryText=details.querySelector(':scope > summary span')?.textContent?.trim()||'Air doctrine';
  const grand=details.querySelector('select[id$="-air-grand"]');
  if(grand&&!grand.getAttribute('aria-label')&&!grand.getAttribute('aria-labelledby'))grand.setAttribute('aria-label',`${summaryText} grand doctrine`);
  details.querySelectorAll('.air-doctrine-track').forEach(track=>{
    const name=track.querySelector(':scope > span')?.textContent?.trim()||'Air doctrine track',select=track.querySelector('select');
    if(select&&!select.getAttribute('aria-label')&&!select.getAttribute('aria-labelledby'))select.setAttribute('aria-label',`${name} doctrine choice`);
  });
}
function enhance(details){
  if(!details||details.dataset.airBoardPrimary==='1')return;details.dataset.airBoardPrimary='1';
  labelDoctrineControls(details);
  const summary=details.querySelector(':scope > summary');if(!summary)return;
  details.classList.add('air-doctrine-board-primary');
  summary.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const launch=details.querySelector('[data-open-air-doctrine-board]');
    if(launch)launch.click();else queueMicrotask(()=>details.querySelector('[data-open-air-doctrine-board]')?.click());
  });
}
function run(){document.querySelectorAll('details.air-doctrine').forEach(enhance);}
registerUiEnhancer(run);

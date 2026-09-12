import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function enhance(details){
  if(!details||details.dataset.airBoardPrimary==='1')return;details.dataset.airBoardPrimary='1';
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

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
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;run();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

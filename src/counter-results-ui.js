import { renderCounterBase } from './counter-base-view.js';
import { renderExistingCounterResults } from './counter-search-view.js';

document.addEventListener('counterrender',event=>{
  const host=event.target;
  if(!host?.classList?.contains('counter-analysis-workspace'))return;
  try{
    const view=renderCounterBase(host);
    renderExistingCounterResults(host,view.snapshot);
  }catch(error){
    console.error('Counter Analysis render failed',error);
    host.innerHTML='<section class="panel"><h2>Counter Analysis unavailable</h2><p>Reload the planner and try again.</p></section>';
  }
});

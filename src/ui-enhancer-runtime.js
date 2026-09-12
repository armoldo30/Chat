/* Shared scheduler for cosmetic DOM enhancers.
   The UI has many independent visual enhancement modules. Running one
   document-wide MutationObserver per module caused every view render to
   fan out into many repeated full-document scans. Registering each
   enhancer here keeps one observer and batches all enhancement work into
   a single animation frame. */

const enhancers=new Set();
let observer=null,frame=0;

function flush(){
  frame=0;
  for(const enhance of enhancers){
    try{enhance();}
    catch(error){console.error('UI enhancer failed',error);}
  }
}

function schedule(){
  if(frame)return;
  frame=requestAnimationFrame(flush);
}

function ensureObserver(){
  if(observer)return;
  observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',schedule);
  window.addEventListener('pageshow',schedule);
}

export function registerUiEnhancer(enhance){
  if(typeof enhance!=='function')throw new TypeError('registerUiEnhancer requires a function');
  enhancers.add(enhance);ensureObserver();schedule();
  return ()=>enhancers.delete(enhance);
}

export function scheduleUiEnhancers(){ensureObserver();schedule();}

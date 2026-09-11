// Lightweight launch-safety layer. No telemetry: failures stay in the browser.
const STORAGE_KEYS=['hoi4-war-planner-v7','hoi4-war-planner-v6'];
let shown=false;

function showRecovery(message){
  if(shown)return;shown=true;
  const app=document.getElementById('app');
  const partial=!!app?.querySelector('.app-shell');
  const box=document.createElement('section');
  box.className='runtime-recovery';
  box.dataset.runtimeError='1';
  box.setAttribute('role','alert');
  box.setAttribute('aria-live','assertive');
  box.innerHTML=`<div><span>PLANNER RECOVERY</span><h2>${partial?'Part of the interface hit an error.':'The planner did not start correctly.'}</h2><p>${message}</p></div><div class="runtime-recovery-actions"><button type="button" data-runtime-reload>Reload</button><button type="button" data-runtime-reset>Reset local planner data</button><a href="https://github.com/armoldo30/Chat/issues/new/choose" rel="noopener noreferrer">Report issue</a></div>`;
  const anchor=app||document.body.firstChild;
  if(anchor?.parentNode)anchor.parentNode.insertBefore(box,anchor);else document.body.prepend(box);
  box.querySelector('[data-runtime-reload]')?.addEventListener('click',()=>location.reload());
  box.querySelector('[data-runtime-reset]')?.addEventListener('click',()=>{
    if(!confirm('Clear locally saved HOI4 War Planner state and reload? Export your scenario first if the planner is still usable.'))return;
    for(const key of STORAGE_KEYS){try{localStorage.removeItem(key);}catch{}}
    location.reload();
  });
}

function runtimeMessage(){
  const app=document.getElementById('app');
  return app?.querySelector('.app-shell')?'The core planner may still be usable. Reload first; if the problem repeats, report it with the browser/device and what you were doing.':'Reload the page. If it repeats, reset local planner data or report the issue.';
}

window.addEventListener('error',event=>{
  console.error('HOI4 War Planner runtime error',event.error||event.message||event.target);
  queueMicrotask(()=>showRecovery(runtimeMessage()));
},true);
window.addEventListener('unhandledrejection',event=>{
  console.error('HOI4 War Planner unhandled rejection',event.reason);
  queueMicrotask(()=>showRecovery(runtimeMessage()));
});

setTimeout(()=>{
  const app=document.getElementById('app');
  if(app&&!app.querySelector('.app-shell'))showRecovery('The application is taking unusually long to initialize. Reload the page; if it repeats, report the issue.');
},12000);

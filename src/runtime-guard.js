// Lightweight launch-safety layer. No telemetry: failures stay in the browser.
const STORAGE_KEYS=['hoi4-war-planner-v7','hoi4-war-planner-v6'];
const RETIRED_PUBLIC_ROUTES=new Set(['dashboard','front','intel','production']);
const CRITICAL_SCRIPT_RE=/\/src\/(?:main|product-direction-runtime|counter-[^/?]+)\.js(?:$|[?#])/;
const initialRoute=location.hash.replace('#','');
if(RETIRED_PUBLIC_ROUTES.has(initialRoute))history.replaceState(null,'',`${location.pathname}${location.search}#battle`);
let shown=false;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function showRecovery(message,detail=''){
  if(shown)return;shown=true;
  const app=document.getElementById('app');
  const partial=!!app?.querySelector('.app-shell');
  const box=document.createElement('section');
  box.className='runtime-recovery';
  box.dataset.runtimeError='1';
  box.setAttribute('role','alert');
  box.setAttribute('aria-live','assertive');
  box.innerHTML=`<div><span>PLANNER RECOVERY</span><h2>${partial?'Part of the interface hit an error.':'The planner did not start correctly.'}</h2><p>${message}</p>${detail?`<details><summary>Technical details</summary><code>${esc(detail)}</code></details>`:''}</div><div class="runtime-recovery-actions"><button type="button" data-runtime-reload>Reload</button><button type="button" data-runtime-reset>Reset local planner data</button><a href="https://github.com/armoldo30/Chat/issues/new/choose" rel="noopener noreferrer">Report issue</a></div>`;
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
  return app?.querySelector('.app-shell')?'The core planner may still be usable. Reload first; if the problem repeats, expand Technical details and report what it shows.':'Reload the page. If it repeats, expand Technical details, reset local planner data, or report the issue.';
}

function eventSource(event){
  return String(event?.filename||event?.error?.fileName||event?.target?.src||'');
}
function criticalRuntimeError(event){
  const target=event?.target;
  if(target?.tagName==='SCRIPT')return CRITICAL_SCRIPT_RE.test(eventSource(event));
  if(event?.error||String(event?.message||'').trim()){
    const source=eventSource(event);
    return !source||CRITICAL_SCRIPT_RE.test(source);
  }
  return false;
}
function errorDetail(event){
  const source=eventSource(event).split('/').pop()||'unknown script';
  const message=event?.error?.message||event?.message||'Runtime error';
  const line=event?.lineno?`:${event.lineno}${event.colno?`:${event.colno}`:''}`:'';
  return `${message} · ${source}${line} · route ${location.hash||'#battle'}`;
}
function rejectionDetail(reason){
  const message=reason?.message||String(reason||'Unhandled promise rejection');
  return `${message} · unhandled promise · route ${location.hash||'#battle'}`;
}

window.addEventListener('error',event=>{
  if(!criticalRuntimeError(event)){
    console.warn('HOI4 War Planner non-critical runtime/resource error',event.error||event.message||event.target);
    return;
  }
  console.error('HOI4 War Planner runtime error',event.error||event.message||event.target);
  queueMicrotask(()=>showRecovery(runtimeMessage(),errorDetail(event)));
},true);
window.addEventListener('unhandledrejection',event=>{
  console.error('HOI4 War Planner unhandled rejection',event.reason);
  queueMicrotask(()=>showRecovery(runtimeMessage(),rejectionDetail(event.reason)));
});

setTimeout(()=>{
  const app=document.getElementById('app');
  if(app&&!app.querySelector('.app-shell'))showRecovery('The application is taking unusually long to initialize. Reload the page; if it repeats, report the issue.','Startup timeout after 12 seconds');
},12000);

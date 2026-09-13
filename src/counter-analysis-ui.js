let active=false;

function renderCounterMode(){
  if(location.hash&&location.hash!=='#battle')return;
  const tabs=document.querySelector('.lab-mode-tabs');
  const workspace=document.querySelector('.lab-workspace');
  if(!tabs||!workspace)return;
  tabs.querySelectorAll('[data-lab-panel]').forEach(button=>{
    if(button.dataset.counterBound)return;
    button.dataset.counterBound='1';
    button.addEventListener('click',()=>{active=false;});
  });
  let button=tabs.querySelector('[data-counter-analysis-tab]');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.dataset.counterAnalysisTab='1';
    button.textContent='COUNTER ANALYSIS';
    button.addEventListener('click',()=>{active=true;renderCounterMode();});
    tabs.append(button);
  }
  let host=document.querySelector('.counter-analysis-workspace');
  if(active){
    tabs.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));
    workspace.hidden=true;
    if(!host){
      host=document.createElement('div');
      host.className='counter-analysis-workspace';
      workspace.after(host);
    }
    host.dispatchEvent(new CustomEvent('counterrender',{bubbles:true}));
  }else{
    workspace.hidden=false;
    if(host)host.remove();
  }
}

window.addEventListener('hashchange',()=>{if(location.hash!=='#battle')active=false;renderCounterMode();});
new MutationObserver(renderCounterMode).observe(document.getElementById('app'),{childList:true,subtree:true});
renderCounterMode();

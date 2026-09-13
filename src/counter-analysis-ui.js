function openCombatTest(){
  if(location.hash!=='#battle')location.hash='battle';
  setTimeout(()=>document.querySelector('[data-lab-panel="combat"]')?.click(),0);
}

function syncCombatShortcut(tabs,workspace,counterRoute){
  let shortcut=document.querySelector('[data-combat-test-shortcut]');
  const templateActive=!!tabs.querySelector('[data-lab-panel="template"].active');
  const shouldShow=counterRoute||templateActive;
  if(!shouldShow){shortcut?.remove();return;}
  if(!shortcut){
    shortcut=document.createElement('button');
    shortcut.type='button';
    shortcut.className='btn lab-combat-shortcut';
    shortcut.dataset.combatTestShortcut='1';
    shortcut.addEventListener('click',openCombatTest);
    workspace.before(shortcut);
  }
  const label=counterRoute?'COMBAT TEST →':'TEST THIS DIVISION →';
  if(shortcut.textContent!==label)shortcut.textContent=label;
}

function renderCounterMode(){
  const counterRoute=location.hash==='#counter';
  if(location.hash&&location.hash!=='#battle'&&!counterRoute)return;
  const tabs=document.querySelector('.lab-mode-tabs');
  const workspace=document.querySelector('.lab-workspace');
  if(!tabs||!workspace)return;
  tabs.querySelectorAll('[data-lab-panel]').forEach(button=>{
    if(button.dataset.counterBound)return;
    button.dataset.counterBound='1';
    button.addEventListener('click',()=>{if(location.hash==='#counter')location.hash='battle';});
  });
  let button=tabs.querySelector('[data-counter-analysis-tab]');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.dataset.counterAnalysisTab='1';
    button.textContent='COUNTER ANALYSIS';
    button.addEventListener('click',()=>{if(location.hash!=='#counter')location.hash='counter';else renderCounterMode();});
    tabs.append(button);
  }
  let host=document.querySelector('.counter-analysis-workspace');
  if(counterRoute){
    tabs.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));
    workspace.hidden=true;
    if(!host){
      host=document.createElement('div');
      host.className='counter-analysis-workspace';
      workspace.after(host);
    }
    if(!host.dataset.counterReady){
      host.dataset.counterReady='1';
      host.dispatchEvent(new CustomEvent('counterrender',{bubbles:true}));
    }
  }else{
    workspace.hidden=false;
    if(host)host.remove();
  }
  syncCombatShortcut(tabs,workspace,counterRoute);
}

window.addEventListener('hashchange',renderCounterMode);
new MutationObserver(renderCounterMode).observe(document.getElementById('app'),{childList:true,subtree:true});
renderCounterMode();

const retired=new Set(['dashboard','front','intel','production']);
const retiredLinks='a[href="#dashboard"],a[href="#front"],a[href="#intel"],a[href="#production"]';

function refreshShell(){
  document.querySelectorAll(retiredLinks).forEach(link=>link.remove());
  const brand=document.querySelector('.brand');
  if(brand&&!brand.dataset.productDirection){
    const title=brand.querySelector('b'),subtitle=brand.querySelector('small');
    if(title)title.textContent='HOI4 WAR PLANNER';
    if(subtitle)subtitle.textContent='Theorycrafting Lab';
    brand.href='#battle';
    brand.dataset.productDirection='1';
  }
  const topbar=document.querySelector('.topbar'),context=topbar?.firstElementChild;
  if(context&&!context.dataset.productDirection){
    context.innerHTML='<span class="kicker">POST-GAME ANALYSIS</span><b>Build · Compare · Improve · Stress-test</b>';
    context.dataset.productDirection='1';
  }
}

function applyProductDirection(){
  const route=location.hash.replace('#','');
  if(retired.has(route)){
    location.hash='battle';
    return;
  }
  refreshShell();
}

window.addEventListener('hashchange',applyProductDirection);
new MutationObserver(applyProductDirection).observe(document.getElementById('app'),{childList:true,subtree:true});
applyProductDirection();

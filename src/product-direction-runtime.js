const retired=new Set(['front','intel','production']);

function applyProductDirection(){
  const route=location.hash.replace('#','');
  if(retired.has(route)){
    location.hash='battle';
    return;
  }
  document.querySelectorAll('a[href="#front"],a[href="#intel"],a[href="#production"]').forEach(link=>link.remove());
}

window.addEventListener('hashchange',applyProductDirection);
new MutationObserver(applyProductDirection).observe(document.getElementById('app'),{childList:true,subtree:true});
applyProductDirection();

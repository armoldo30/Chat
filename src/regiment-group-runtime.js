import { battalions } from './data.js';
import { normalizeBattalionRegimentGroups } from './regiment-groups.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

// main.js hydrates the bundled/imported game pack during module startup. Apply the
// source-aware regiment grouping immediately afterward so all later designer picks
// see the same structural groups as the 1.19.2 sub-unit records.
normalizeBattalionRegimentGroups(battalions);

function prettifyRegimentGroupLabels(){
  document.querySelectorAll('.regiment-title span,.hoi-picker .muted').forEach(node=>{
    const text=node.textContent||'',next=text.replaceAll('MOBILE_COMBAT_SUPPORT','MOBILE COMBAT SUPPORT').replaceAll('COMBAT_SUPPORT','COMBAT SUPPORT');
    if(next!==text)node.textContent=next;
  });
}
registerUiEnhancer(prettifyRegimentGroupLabels);

import { hoi4ModelIconSvg, hoi4ModelIconKey } from './hoi4-model-icons.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

const norm=s=>String(s||'').trim();
function contextFor(node){
  if(node?.closest?.('.tank-module-grid,[data-tank-class],[data-tank-role],.tank-silhouette'))return 'armor';
  if(node?.closest?.('.air-module-grid,.aircraft-designer,.aircraft-role'))return 'air';
  return 'infantry';
}
function slotTitle(node){return norm(node?.closest?.('label')?.querySelector(':scope > span')?.textContent)||'';}
function replace(node,value,label,context,fallback,slot=''){
  if(!node)return;
  const sig=`${context}|${value}|${label}|${slot}`;
  if(node.dataset.hoiModelSig===sig)return;
  node.dataset.hoiModelSig=sig;
  const key=hoi4ModelIconKey(value,label,context,slot);
  node.classList.add('hoi4-modeled-icon',`hoi4-${key}`);
  node.innerHTML=hoi4ModelIconSvg(value,label,context,fallback,slot);
}

function enhanceTriggers(){
  document.querySelectorAll('.visual-picker-trigger').forEach(trigger=>{
    const select=trigger.previousElementSibling?.matches?.('select')?trigger.previousElementSibling:null;
    const icon=trigger.querySelector('.visual-trigger-icon');if(!select||!icon)return;
    const option=select.selectedOptions?.[0]||select.options?.[select.selectedIndex],context=contextFor(select),label=norm(option?.textContent),value=option?.value||label,slot=slotTitle(select),fallback=context==='air'?'air':context==='armor'?'armor':'generic';
    replace(icon,value,label,context,fallback,slot);
  });
}
function enhanceModal(){
  const modal=document.getElementById('visual-picker-modal');if(!modal||modal.hidden)return;
  const title=norm(modal.querySelector('#visual-picker-title')?.textContent),context=/air|airframe|aircraft|weapon|bomb|torpedo/i.test(title)?'air':/tank|chassis|turret|suspension|armor|armour|engine|armament/i.test(title)?'armor':'infantry';
  modal.querySelectorAll('.visual-option').forEach((card,index)=>{
    const icon=card.querySelector('.visual-option-icon'),label=norm(card.querySelector('.visual-option-copy b')?.textContent),raw=norm(card.querySelector('.visual-option-copy small')?.textContent),value=raw||label||`option_${index}`,fallback=context==='air'?'air':context==='armor'?'armor':'generic';
    replace(icon,value,label,context,fallback,title);
  });
}
function enhanceTankTabs(){
  document.querySelectorAll('[data-tank-class]').forEach(button=>{
    const id=button.dataset.tankClass||'',icon=button.querySelector('.designer-tab-icon');if(!icon)return;
    const value=id==='super_heavy'?'super_heavy_tank':id==='land_cruiser'?'land_cruiser':id==='amphibious'?'amphibious_tank':`${id}_tank`;
    replace(icon,value,id,'armor','armor','Tank class');
  });
  document.querySelectorAll('[data-tank-role]').forEach(button=>{
    const id=button.dataset.tankRole||'',label=norm(button.querySelector('.designer-tab-copy')?.textContent)||id,icon=button.querySelector('.designer-tab-icon');if(!icon)return;
    const role={armor:'medium_tank',anti_tank:'tank_destroyer',artillery:'sp_artillery',anti_air:'sp_anti_air',flame:'flame_tank',amphibious:'amphibious_tank'}[id]||id;
    replace(icon,role,label,'armor','armor','Tank role');
  });
  document.querySelectorAll('.tank-silhouette-icon').forEach(icon=>{
    const family=document.querySelector('[data-tank-class].active')?.dataset.tankClass||'medium',role=document.querySelector('[data-tank-role].active')?.dataset.tankRole||'armor';
    const value=role==='armor'?(family==='super_heavy'?'super_heavy_tank':family==='land_cruiser'?'land_cruiser':family==='amphibious'?'amphibious_tank':`${family}_tank`):({anti_tank:'tank_destroyer',artillery:'sp_artillery',anti_air:'sp_anti_air',flame:'flame_tank',amphibious:'amphibious_tank'}[role]||`${family}_tank`);
    replace(icon,value,`${family} ${role}`,'armor','armor','Tank silhouette');
  });
}
function enhanceAirRoles(){
  document.querySelectorAll('.aircraft-role span').forEach(span=>{
    const label=norm(span.querySelector('b')?.textContent||span.textContent),icon=span.querySelector('i');if(!icon)return;
    replace(icon,label.toLowerCase().replace(/\s+/g,'_'),label,'air','air','Aircraft role');
  });
}
function enhanceDivision(){
  document.querySelectorAll('.picker-choice[data-choice]').forEach(button=>{
    const value=button.dataset.choice||'',label=norm(button.querySelector('small')?.textContent)||value,icon=button.querySelector('.division-unit-icon');
    replace(icon,value,label,'infantry','infantry','Division unit');
  });
  document.querySelectorAll('.hoi-battalion-slot.filled,.regimental-support.filled,.hoi-support-slot.filled').forEach(button=>{
    const label=norm(button.querySelector('small')?.textContent||button.title),icon=button.querySelector('.picture-unit-symbol');
    replace(icon,label,label,'infantry','support','Division unit');
  });
}
function enhance(){enhanceTriggers();enhanceModal();enhanceTankTabs();enhanceAirRoles();enhanceDivision();}
registerUiEnhancer(enhance);

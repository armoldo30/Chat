import { displayLabel } from './ui-labels.js';
import { itemIconKey, itemIconSvg } from './item-icons.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

const ROLE_VISUAL={
  armor:{key:'medium_tank',value:'medium_tank',label:'Tank'},
  anti_tank:{key:'tank_destroyer',value:'tank_destroyer',label:'Tank Destroyer'},
  tank_destroyer:{key:'tank_destroyer',value:'tank_destroyer',label:'Tank Destroyer'},
  td:{key:'tank_destroyer',value:'tank_destroyer',label:'Tank Destroyer'},
  artillery:{key:'spg',value:'sp_artillery',label:'SP Artillery'},
  spg:{key:'spg',value:'sp_artillery',label:'SP Artillery'},
  anti_air:{key:'spaa',value:'sp_anti_air',label:'SP Anti-Air'},
  spaa:{key:'spaa',value:'sp_anti_air',label:'SP Anti-Air'},
  flame:{key:'flame_tank',value:'flame_tank',label:'Flame Tank'},
  amphibious:{key:'amphibious_tank',value:'amphibious_tank',label:'Amphibious Tank'}
};
function familyIconValue(id=''){const s=String(id).toLowerCase();if(s.includes('super'))return 'super_heavy_tank';if(s.includes('modern'))return 'modern_tank';if(s.includes('amphib'))return 'amphibious_tank';if(s.includes('land_cruiser'))return 'land_cruiser';if(s.includes('heavy'))return 'heavy_tank';if(s.includes('medium'))return 'medium_tank';if(s.includes('light'))return 'light_tank';return `${s}_tank`;}
function classBadge(id=''){const s=String(id).toLowerCase();if(s.includes('land'))return 'LC';if(s.includes('super'))return 'SH';if(s.includes('modern'))return 'M';if(s.includes('amphib'))return 'A';if(s.includes('heavy'))return 'H';if(s.includes('medium'))return 'M';if(s.includes('light'))return 'L';return 'T';}

function enhanceTankClass(button){
  if(button.dataset.designerVisual==='1')return;button.dataset.designerVisual='1';
  const id=button.dataset.tankClass||'',value=familyIconValue(id),original=button.innerHTML,specific=itemIconKey(value,id,'armor');
  button.classList.add('designer-visual-tab','tank-family-visual-tab');
  button.innerHTML=`<span class="designer-tab-icon armor semantic-${specific}"><i>${classBadge(id)}</i>${itemIconSvg(value,id,'armor','armor')}</span><span class="designer-tab-copy">${original}</span>`;
}
function enhanceTankRole(button){
  if(button.dataset.designerVisual==='1')return;button.dataset.designerVisual='1';
  const id=button.dataset.tankRole||'',cfg=ROLE_VISUAL[id]||ROLE_VISUAL.armor,original=button.innerHTML,specific=itemIconKey(cfg.value,cfg.label,'armor');
  button.classList.add('designer-visual-tab','tank-role-visual-tab');
  button.innerHTML=`<span class="designer-tab-icon armor semantic-${specific}">${itemIconSvg(cfg.value,cfg.label,'armor','armor')}</span><span class="designer-tab-copy">${original}</span>`;
}
function enhanceTankSilhouette(node){
  if(!node||node.dataset.designerVisual==='1')return;node.dataset.designerVisual='1';
  const family=document.querySelector('[data-tank-class].active')?.dataset.tankClass||'medium',role=document.querySelector('[data-tank-role].active')?.dataset.tankRole||'armor',span=node.querySelector(':scope > span');
  if(span){const roleCfg=ROLE_VISUAL[role]||ROLE_VISUAL.armor,value=role==='armor'?familyIconValue(family):`${family}_${roleCfg.value}`,specific=itemIconKey(value,`${family} ${roleCfg.label}`,'armor');span.className=`tank-silhouette-icon semantic-${specific}`;span.innerHTML=itemIconSvg(value,`${family} ${roleCfg.label}`,'armor','armor');}
}
function enhanceAirRoles(){
  document.querySelectorAll('.aircraft-role span').forEach(span=>{
    if(span.dataset.designerVisual==='1')return;span.dataset.designerVisual='1';
    const text=span.textContent.trim(),id=text.toLowerCase().replaceAll(' ','_'),specific=itemIconKey(id,text,'air');
    span.classList.add('air-role-visual',`semantic-${specific}`);span.innerHTML=`<i>${itemIconSvg(id,text,'air','air')}</i><b>${displayLabel(id,text)}</b>`;
  });
}
function enhance(){
  document.querySelectorAll('[data-tank-class]').forEach(enhanceTankClass);
  document.querySelectorAll('[data-tank-role]').forEach(enhanceTankRole);
  document.querySelectorAll('.tank-silhouette').forEach(enhanceTankSilhouette);
  enhanceAirRoles();
}
registerUiEnhancer(enhance);

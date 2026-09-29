import { hoi4SourceIconSvg } from './hoi4-source-icons.js';
import { hoi4TextIconImg } from './hoi4-text-icons.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function routeIcon(route){
  if(route==='dashboard'||route==='front')return hoi4TextIconImg('doctrine_texticon','hoi4-texticon nav-source-icon');
  if(route==='intel')return hoi4SourceIconSvg('recon','Recon','infantry','Navigation');
  if(route==='battle'||route==='gauntlet')return hoi4SourceIconSvg('infantry','Infantry','infantry','Navigation');
  if(route==='tank')return hoi4SourceIconSvg('medium_tank','Medium Tank','armor','Navigation');
  if(route==='air')return hoi4SourceIconSvg('fighter','Fighter','air','Navigation');
  return hoi4SourceIconSvg('support_equipment','Support Equipment','generic','Navigation');
}

function enhance(){
  document.querySelectorAll('.sidebar nav a').forEach(link=>{
    const route=(link.getAttribute('href')||'').replace('#',''),code=link.querySelector('.nav-code');if(!code||code.dataset.visualNav==='1')return;
    code.dataset.visualNav='1';code.classList.add('nav-visual-icon','source-backed');code.innerHTML=routeIcon(route);
  });
}
registerUiEnhancer(enhance);

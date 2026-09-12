/* Cosmetic/UX enhancement layer. Keeps src/main.js simulation behavior untouched. */
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

const NAV_GROUPS=[
  ['Command',[
    ['dashboard','HQ','Command'],
    ['front','OPS','Front Planner'],
    ['intel','INT','Intel']
  ]],
  ['Design',[
    ['battle','DIV','Division Lab'],
    ['gauntlet','GNT','Division Gauntlet'],
    ['tank','TNK','Tank Designer'],
    ['air','AIR','Air Lab']
  ]],
  ['Support',[
    ['production','MIC','Industry'],
    ['data','DAT','Data Packs'],
    ['scenario','CFG','Scenario']
  ]]
];

function activeRoute(){
  const route=location.hash.replace('#','');
  return NAV_GROUPS.flatMap(([,items])=>items).some(([id])=>id===route)?route:'battle';
}

function navMarkup(active){
  return NAV_GROUPS.map(([label,items])=>`<div class="nav-group-label" aria-hidden="true">${label}</div>${items.map(([route,code,name])=>`<a href="#${route}" class="${active===route?'active':''}" ${active===route?'aria-current="page"':''} title="${name}"><span class="nav-code">${code}</span><span>${name}</span></a>`).join('')}`).join('');
}

function enhanceChrome(){
  const nav=document.querySelector('.sidebar nav');
  if(!nav)return;
  const active=activeRoute();
  if(nav.dataset.uiPolished!==active){
    nav.innerHTML=navMarkup(active);
    nav.dataset.uiPolished=active;
    nav.setAttribute('aria-label','Planner sections');
  }

  const brand=document.querySelector('.brand');
  if(brand){
    brand.href='#dashboard';
    brand.title='Open Command dashboard';
    brand.setAttribute('aria-label','HOI4 War Planner — Command dashboard');
  }

  const sidebar=document.querySelector('.sidebar');
  if(sidebar)sidebar.setAttribute('aria-label','Primary navigation');
  const main=document.querySelector('main');
  if(main)main.id='main-content';
  const topbar=document.querySelector('.topbar');
  if(topbar)topbar.setAttribute('role','banner');
}

registerUiEnhancer(enhanceChrome);

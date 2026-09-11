import { displayLabel, iconSvg } from './ui-labels.js';

const ROLE_KIND={armor:'armor',tank_destroyer:'antitank',td:'antitank',spg:'artillery',artillery:'artillery',spaa:'antiair',anti_air:'antiair',flame:'support',support:'support',recon:'support'};
function roleKind(value=''){const id=String(value).toLowerCase();for(const [needle,kind] of Object.entries(ROLE_KIND))if(id.includes(needle))return kind;return 'armor';}
function classBadge(id=''){const s=String(id).toLowerCase();if(s.includes('super'))return 'SH';if(s.includes('modern'))return 'M';if(s.includes('heavy'))return 'H';if(s.includes('medium'))return 'M';if(s.includes('light'))return 'L';return 'T';}

function enhanceTankClass(button){
  if(button.dataset.designerVisual==='1')return;button.dataset.designerVisual='1';
  const id=button.dataset.tankClass||'',original=button.innerHTML;
  button.classList.add('designer-visual-tab','tank-family-visual-tab');
  button.innerHTML=`<span class="designer-tab-icon armor"><i>${classBadge(id)}</i>${iconSvg('armor')}</span><span class="designer-tab-copy">${original}</span>`;
}
function enhanceTankRole(button){
  if(button.dataset.designerVisual==='1')return;button.dataset.designerVisual='1';
  const id=button.dataset.tankRole||'',kind=roleKind(id),original=button.innerHTML;
  button.classList.add('designer-visual-tab','tank-role-visual-tab');
  button.innerHTML=`<span class="designer-tab-icon ${kind}">${iconSvg(kind)}</span><span class="designer-tab-copy">${original}</span>`;
}
function enhanceTankSilhouette(node){
  if(!node||node.dataset.designerVisual==='1')return;node.dataset.designerVisual='1';
  const span=node.querySelector(':scope > span');if(span){span.className='tank-silhouette-icon';span.innerHTML=iconSvg('armor');}
}
function enhanceAirRoles(){
  document.querySelectorAll('.aircraft-role span').forEach(span=>{
    if(span.dataset.designerVisual==='1')return;span.dataset.designerVisual='1';
    const text=span.textContent.trim(),kind=/CAS|CLOSE AIR|GROUND/i.test(text)?'artillery':/NAVAL/i.test(text)?'antiair':'air';
    span.classList.add('air-role-visual');span.innerHTML=`<i>${iconSvg(kind)}</i><b>${displayLabel(text.toLowerCase().replaceAll(' ','_'),text)}</b>`;
  });
}
function enhance(){
  document.querySelectorAll('[data-tank-class]').forEach(enhanceTankClass);
  document.querySelectorAll('[data-tank-role]').forEach(enhanceTankRole);
  document.querySelectorAll('.tank-silhouette').forEach(enhanceTankSilhouette);
  enhanceAirRoles();
}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

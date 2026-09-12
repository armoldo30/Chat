import BUILTIN_1192 from './builtin1192.js';
import { mioCatalog } from './mio.js';
import { displayLabel } from './ui-labels.js';
import { registerUiEnhancer, scheduleUiEnhancers } from './ui-enhancer-runtime.js';

const STORAGE_KEYS=['hoi4-war-planner-v7','hoi4-war-planner-v6'];
function currentPack(){
  for(const key of STORAGE_KEYS){
    try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw?.dataPack)return raw.dataPack;}catch{}
  }
  return BUILTIN_1192;
}
function currentCatalog(){try{return mioCatalog(currentPack());}catch{return {};}}
function orgIdFor(root){
  const selected=root.closest('.mio-board-content')?.querySelector('.mio-org-card.selected');
  return selected?.dataset.mioOrgBoard??selected?.dataset.inlineMioOrgBoard??'';
}
function traitId(button){return button.dataset.mioTraitBoard??button.dataset.inlineMioTraitBoard??'';}
function dependencyGroups(trait={}){
  return {
    any:[...(trait.parents||[])],
    all:[...(trait.allParents||[])],
    counted:[...(trait.parentTraits||[])],
    count:Math.max(1,Number(trait.parentCount)||1),
    exclusive:[...(trait.mutuallyExclusive||[])]
  };
}
function allDependencies(trait){const g=dependencyGroups(trait);return [...new Set([...g.any,...g.all,...g.counted])];}
function levelsFor(org,visible){
  const memo=new Map(),visiting=new Set();
  const level=id=>{
    if(memo.has(id))return memo.get(id);if(visiting.has(id))return 0;visiting.add(id);
    const trait=org?.traits?.[id],parents=allDependencies(trait).filter(x=>visible.has(x));
    const out=parents.length?1+Math.max(...parents.map(level)):0;visiting.delete(id);memo.set(id,out);return out;
  };
  for(const id of visible)level(id);return memo;
}
function addDependencyNotes(button,trait,visible){
  if(button.querySelector('.mio-dependency-note'))return;
  const g=dependencyGroups(trait),parts=[];
  const names=ids=>ids.filter(x=>visible.has(x)).map(displayLabel);
  const any=names(g.any),all=names(g.all),counted=names(g.counted),exclusive=names(g.exclusive);
  if(any.length)parts.push(`Requires one: ${any.join(' / ')}`);
  if(all.length)parts.push(`Requires all: ${all.join(' + ')}`);
  if(counted.length)parts.push(`Requires ${Math.min(g.count,counted.length)} of: ${counted.join(' / ')}`);
  if(exclusive.length)parts.push(`Exclusive with: ${exclusive.join(' / ')}`);
  if(!parts.length)return;
  const note=document.createElement('small');note.className='mio-dependency-note';note.textContent=parts.join(' · ');button.append(note);
}
function drawConnections(root,org,buttons,visible){
  root.querySelector('.mio-tree-links')?.remove();
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('mio-tree-links');svg.setAttribute('aria-hidden','true');
  const width=Math.max(root.scrollWidth,root.clientWidth),height=Math.max(root.scrollHeight,root.clientHeight);svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('width',width);svg.setAttribute('height',height);
  const byId=new Map(buttons.map(button=>[traitId(button),button]));
  for(const child of buttons){
    const childId=traitId(child),trait=org?.traits?.[childId],groups=dependencyGroups(trait);
    for(const [mode,parents] of [['any',groups.any],['all',groups.all],['counted',groups.counted]])for(const parentId of parents){
      if(!visible.has(parentId))continue;const parent=byId.get(parentId);if(!parent)continue;
      const x1=parent.offsetLeft+parent.offsetWidth/2,y1=parent.offsetTop+parent.offsetHeight,x2=child.offsetLeft+child.offsetWidth/2,y2=child.offsetTop,mid=y1+(y2-y1)/2;
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`);path.classList.add(`dependency-${mode}`);svg.append(path);
    }
  }
  root.prepend(svg);
}
function enhance(root){
  if(!root||root.dataset.mioTreeVisual==='1')return;
  const id=orgIdFor(root),org=currentCatalog()?.[id],buttons=[...root.querySelectorAll('.mio-board-trait')];if(!org||!buttons.length)return;
  const visible=new Set(buttons.map(traitId).filter(Boolean)),levels=levelsFor(org,visible);root.dataset.mioTreeVisual='1';root.classList.add('mio-tree-layout');
  for(const button of buttons){const id=traitId(button),level=levels.get(id)||0;button.style.gridRow=String(level+1);button.dataset.treeLevel=String(level);addDependencyNotes(button,org.traits?.[id]||{},visible);}
  requestAnimationFrame(()=>drawConnections(root,org,buttons,visible));
}
function run(){document.querySelectorAll('.mio-board-traits').forEach(enhance);}
window.addEventListener('resize',()=>{document.querySelectorAll('.mio-board-traits.mio-tree-layout').forEach(root=>{root.dataset.mioTreeVisual='';});scheduleUiEnhancers();});
registerUiEnhancer(run);

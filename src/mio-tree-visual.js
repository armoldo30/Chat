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
  if(root?.dataset?.mioOrgId)return root.dataset.mioOrgId;
  const selected=root.closest('.mio-board-content')?.querySelector('.mio-org-card.selected');
  return selected?.dataset.mioOrgBoard??selected?.dataset.inlineMioOrgBoard??selected?.dataset.workflowOrg??selected?.dataset.inlineOrg??'';
}
function traitId(button){return button.dataset.workflowTrait??button.dataset.inlineTrait??button.dataset.mioTraitBoard??button.dataset.inlineMioTraitBoard??'';}
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
function dependencyNote(trait,visible){
  const g=dependencyGroups(trait),parts=[],names=ids=>ids.filter(x=>visible.has(x)).map(id=>displayLabel(id));
  const any=names(g.any),all=names(g.all),counted=names(g.counted),exclusive=names(g.exclusive);
  if(any.length)parts.push(`Requires one: ${any.join(' / ')}`);
  if(all.length)parts.push(`Requires all: ${all.join(' + ')}`);
  if(counted.length)parts.push(`Requires ${Math.min(g.count,counted.length)} of: ${counted.join(' / ')}`);
  if(exclusive.length)parts.push(`Exclusive with: ${exclusive.join(' / ')}`);
  return parts.join(' · ');
}
function rowsFor(buttons,levels){
  const rows=new Map();
  for(const button of buttons){const level=levels.get(traitId(button))||0;if(!rows.has(level))rows.set(level,[]);rows.get(level).push(button);}
  return rows;
}
function placeByLevel(root,buttons,levels){
  const rows=rowsFor(buttons,levels),maxCount=Math.max(1,...[...rows.values()].map(row=>row.length));
  // The previous fixed 18-column canvas could physically fit only nine 2-column
  // nodes on one level. Larger MIO tiers therefore landed on top of each other,
  // especially on phones. Grow the logical canvas with the widest tier so every
  // trait always owns at least three columns and a readable card width.
  const columns=Math.max(18,maxCount*3),cellWidth=64,minWidth=Math.max(980,columns*cellWidth);
  root.style.setProperty('--mio-tree-columns',String(columns));
  root.style.setProperty('--mio-tree-min-width',`${minWidth}px`);
  root.dataset.treeColumns=String(columns);
  for(const [level,row] of [...rows.entries()].sort((a,b)=>a[0]-b[0])){
    const count=row.length,span=Math.max(3,Math.floor(columns/Math.max(1,count))),used=span*count,offset=Math.max(1,Math.floor((columns-used)/2)+1);
    row.forEach((button,index)=>{
      const start=offset+index*span;
      button.style.gridRow=String(level+1);button.style.gridColumn=`${start} / span ${span}`;button.dataset.treeLevel=String(level);
    });
  }
}
function placeLegacy(buttons,levels){for(const button of buttons){const level=levels.get(traitId(button))||0;button.style.gridRow=String(level+1);button.dataset.treeLevel=String(level);}}
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
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`);path.classList.add(`dependency-${mode}`);
      if(child.classList.contains('selected'))path.classList.add('active-link');else if(child.classList.contains('available'))path.classList.add('available-link');
      svg.append(path);
    }
  }
  root.prepend(svg);
}
function focusCurrentBranch(root,buttons){
  if(!globalThis.matchMedia?.('(max-width:720px)')?.matches)return;
  const scroller=root.closest('.mio-full-tree');if(!scroller)return;
  const focus=buttons.find(button=>button.classList.contains('available'))||[...buttons].reverse().find(button=>button.classList.contains('selected'))||buttons[0];
  if(!focus)return;
  scroller.scrollLeft=Math.max(0,focus.offsetLeft-(scroller.clientWidth-focus.offsetWidth)/2);
}
function enhance(root){
  if(!root||root.dataset.mioTreeVisual==='1')return;
  const id=orgIdFor(root),org=currentCatalog()?.[id],buttons=[...root.querySelectorAll('.mio-board-trait')];if(!org||!buttons.length)return;
  const visible=new Set(buttons.map(traitId).filter(Boolean)),levels=levelsFor(org,visible);root.dataset.mioTreeVisual='1';root.classList.add('mio-tree-layout');
  root.closest('#mio-board-modal')?placeByLevel(root,buttons,levels):placeLegacy(buttons,levels);
  for(const button of buttons){const note=dependencyNote(org.traits?.[traitId(button)]||{},visible);if(note){button.dataset.dependencyNote=note;if(!button.title)button.title=note;}}
  requestAnimationFrame(()=>{drawConnections(root,org,buttons,visible);focusCurrentBranch(root,buttons);});
}
function run(){document.querySelectorAll('.mio-board-traits').forEach(enhance);}
window.addEventListener('resize',()=>{document.querySelectorAll('.mio-board-traits.mio-tree-layout').forEach(root=>{root.dataset.mioTreeVisual='';});scheduleUiEnhancers();});
registerUiEnhancer(run);

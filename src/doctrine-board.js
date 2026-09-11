import { displayLabel, iconSvg, visualKind } from './ui-labels.js';

function resolvedKind(value,base='doctrine'){
  const kind=visualKind(value);return kind==='generic'?base:kind;
}
function optionLabel(option){return displayLabel(option?.value,option?.textContent);}

function ensureActionBar(){
  const head=document.querySelector('.tech-doctrine-panel .tech-profile-head');if(!head)return null;
  let bar=head.querySelector('.visual-board-actions');
  if(!bar){bar=document.createElement('div');bar.className='visual-board-actions';head.append(bar);}
  return bar;
}
function closeBoard(){document.getElementById('doctrine-board-modal')?.remove();document.documentElement.classList.remove('picker-open');}

function openBoard(){
  closeBoard();
  const grand=document.querySelector('#land-grand'),trackSelects=[...document.querySelectorAll('[data-doctrine-choice]')];
  if(!grand||!trackSelects.length)return;
  const original={grand:grand.value,tracks:{}},draft={grand:grand.value,tracks:{}};
  for(const select of trackSelects){
    const track=select.dataset.doctrineChoice,range=document.querySelector(`[data-doctrine-mastery="${track}"]`),title=select.closest('.doctrine-track')?.querySelector('div > span')?.textContent?.trim()||displayLabel(track);
    original.tracks[track]={choice:select.value,mastery:Number(range?.value)||0};draft.tracks[track]={select,range,choice:select.value,mastery:Number(range?.value)||0,title};
  }
  const shell=document.createElement('div');shell.id='doctrine-board-modal';shell.className='system-board-shell';
  shell.innerHTML='<div class="system-board-backdrop"></div><section class="system-board doctrine-system-board" role="dialog" aria-modal="true" aria-label="Land Doctrine Board"><header><div><span class="eyebrow">ARMY DOCTRINE</span><h2>Land Doctrine Board</h2><p>Choose the grand doctrine, one subdoctrine in each track, and its current mastery stage.</p></div><button type="button" class="visual-picker-close" data-close-doctrine aria-label="Close doctrine board">×</button></header><div class="doctrine-board-content"></div></section>';
  document.body.append(shell);document.documentElement.classList.add('picker-open');shell.querySelector('.system-board-backdrop').onclick=closeBoard;shell.querySelector('[data-close-doctrine]').onclick=closeBoard;
  const content=shell.querySelector('.doctrine-board-content');
  const render=()=>{
    content.innerHTML=`<section class="doctrine-board-grand"><span class="eyebrow">GRAND DOCTRINE</span><div class="doctrine-grand-cards">${[...grand.options].map(o=>`<button type="button" class="doctrine-choice-card ${draft.grand===o.value?'selected':''}" data-board-grand="${o.value}"><span class="visual-option-icon doctrine">${iconSvg('doctrine')}</span><b>${optionLabel(o)}</b>${draft.grand===o.value?'<small>ACTIVE</small>':''}</button>`).join('')}</div></section><section class="doctrine-board-tracks">${Object.entries(draft.tracks).map(([track,t])=>`<article class="doctrine-board-track"><header><span>${t.title}</span><b>${t.mastery>=5?'MILESTONE ACTIVE':'MASTERY '+t.mastery+'/5'}</b></header><div class="doctrine-node-list">${[...t.select.options].map(o=>`<button type="button" class="doctrine-node ${t.choice===o.value?'selected':''}" data-board-track="${track}" data-board-choice="${o.value}"><span class="node-emblem ${resolvedKind(o.value)}">${iconSvg(resolvedKind(o.value))}</span><span>${optionLabel(o)}</span></button>`).join('')}</div><div class="board-mastery" aria-label="${t.title} mastery">${Array.from({length:6},(_,i)=>`<button type="button" class="mastery-pip ${i<=t.mastery?'filled':''} ${i===t.mastery?'current':''}" data-board-mastery="${track}" data-board-level="${i}"><span>${i===0?'○':'◆'}</span><small>${i}</small></button>`).join('')}</div></article>`).join('')}</section><footer class="visual-board-footer"><button type="button" class="btn" data-cancel-doctrine>Cancel</button><button type="button" class="btn primary" data-apply-doctrine>Apply Doctrine</button></footer>`;
    content.querySelectorAll('[data-board-grand]').forEach(button=>button.onclick=()=>{draft.grand=button.dataset.boardGrand;render();});
    content.querySelectorAll('[data-board-choice]').forEach(button=>button.onclick=()=>{draft.tracks[button.dataset.boardTrack].choice=button.dataset.boardChoice;render();});
    content.querySelectorAll('[data-board-mastery]').forEach(button=>button.onclick=()=>{draft.tracks[button.dataset.boardMastery].mastery=Number(button.dataset.boardLevel);render();});
    content.querySelector('[data-cancel-doctrine]').onclick=closeBoard;
    content.querySelector('[data-apply-doctrine]').onclick=()=>{
      if(draft.grand!==original.grand){grand.value=draft.grand;grand.dispatchEvent(new Event('change',{bubbles:true}));}
      for(const [track,t] of Object.entries(draft.tracks)){
        const before=original.tracks[track];
        if(t.choice!==before.choice){t.select.value=t.choice;t.select.dispatchEvent(new Event('change',{bubbles:true}));}
        if(t.range&&t.mastery!==before.mastery){t.range.value=String(t.mastery);t.range.dispatchEvent(new Event('change',{bubbles:true}));}
      }
      closeBoard();
    };
  };
  render();
}

function injectLauncher(){
  const bar=ensureActionBar();if(!bar||bar.querySelector('[data-open-doctrine-board]'))return;
  const button=document.createElement('button');button.type='button';button.className='btn visual-board-launch';button.dataset.openDoctrineBoard='1';button.innerHTML=`<span class="board-button-icon">${iconSvg('doctrine')}</span><span><small>FULL VIEW</small><b>Doctrine Board</b></span>`;button.onclick=openBoard;bar.append(button);
}

let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;injectLauncher();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('doctrine-board-modal'))closeBoard();});schedule();

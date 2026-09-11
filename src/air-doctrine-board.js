import { displayLabel, iconSvg, visualKind } from './ui-labels.js';

function resolvedKind(value,base='air'){const kind=visualKind(value);return kind==='generic'?base:kind;}
function optionLabel(option){return displayLabel(option?.value,option?.textContent);}
function closeBoard(){document.getElementById('air-doctrine-board-modal')?.remove();document.documentElement.classList.remove('picker-open');}

function controlsForPrefix(prefix){
  const grand=document.getElementById(`${prefix}-air-grand`);if(!grand)return null;
  const choices=[...document.querySelectorAll(`[data-air-doctrine-choice^="${prefix}:"]`)];
  const tracks={};
  for(const select of choices){
    const key=select.dataset.airDoctrineChoice.split(':')[1],range=document.querySelector(`[data-air-doctrine-mastery="${prefix}:${key}"]`),container=select.closest('.air-doctrine-track');
    tracks[key]={select,range,title:container?.querySelector(':scope > span')?.textContent?.trim()||displayLabel(key),choice:select.value,mastery:Number(range?.value)||0};
  }
  return {grand,tracks};
}

function openBoard(prefix){
  closeBoard();const controls=controlsForPrefix(prefix);if(!controls)return;
  const original={grand:controls.grand.value,tracks:{}},draft={grand:controls.grand.value,tracks:{}};
  for(const [key,t] of Object.entries(controls.tracks)){original.tracks[key]={choice:t.choice,mastery:t.mastery};draft.tracks[key]={...t};}
  const shell=document.createElement('div');shell.id='air-doctrine-board-modal';shell.className='system-board-shell';
  shell.innerHTML='<div class="system-board-backdrop"></div><section class="system-board air-doctrine-system-board" role="dialog" aria-modal="true" aria-label="Air Doctrine Board"><header><div><span class="eyebrow">AIR STAFF DOCTRINE</span><h2>Air Doctrine Board</h2><p>Choose the grand air doctrine, each specialization track, and current mastery stage from one operational view.</p></div><button type="button" class="visual-picker-close" data-close-air-doctrine aria-label="Close air doctrine board">×</button></header><div class="air-doctrine-board-content"></div></section>';
  document.body.append(shell);document.documentElement.classList.add('picker-open');shell.querySelector('.system-board-backdrop').onclick=closeBoard;shell.querySelector('[data-close-air-doctrine]').onclick=closeBoard;
  const content=shell.querySelector('.air-doctrine-board-content');
  const render=()=>{
    content.innerHTML=`<section class="doctrine-board-grand air-grand-board"><span class="eyebrow">GRAND AIR DOCTRINE</span><div class="doctrine-grand-cards air-grand-cards">${[...controls.grand.options].map(o=>`<button type="button" class="doctrine-choice-card ${draft.grand===o.value?'selected':''}" data-air-board-grand="${o.value}"><span class="visual-option-icon air">${iconSvg('air')}</span><b>${optionLabel(o)}</b>${draft.grand===o.value?'<small>ACTIVE</small>':''}</button>`).join('')}</div></section><section class="air-doctrine-board-tracks">${Object.entries(draft.tracks).map(([track,t])=>`<article class="doctrine-board-track air-board-track"><header><span>${t.title}</span><b>${t.mastery>=5?'MILESTONE ACTIVE':'MASTERY '+t.mastery+'/5'}</b></header><div class="doctrine-node-list air-doctrine-node-list">${[...t.select.options].map(o=>{const kind=resolvedKind(o.value,'air');return `<button type="button" class="doctrine-node ${t.choice===o.value?'selected':''}" data-air-board-track="${track}" data-air-board-choice="${o.value}"><span class="node-emblem ${kind}">${iconSvg(kind)}</span><span>${optionLabel(o)}</span></button>`;}).join('')}</div><div class="board-mastery">${Array.from({length:6},(_,i)=>`<button type="button" class="mastery-pip ${i<=t.mastery?'filled':''} ${i===t.mastery?'current':''}" data-air-board-mastery="${track}" data-air-board-level="${i}"><span>${i===0?'○':'◆'}</span><small>${i}</small></button>`).join('')}</div></article>`).join('')}</section><footer class="visual-board-footer"><button type="button" class="btn" data-cancel-air-doctrine>Cancel</button><button type="button" class="btn primary" data-apply-air-doctrine>Apply Air Doctrine</button></footer>`;
    content.querySelectorAll('[data-air-board-grand]').forEach(button=>button.onclick=()=>{draft.grand=button.dataset.airBoardGrand;render();});
    content.querySelectorAll('[data-air-board-choice]').forEach(button=>button.onclick=()=>{draft.tracks[button.dataset.airBoardTrack].choice=button.dataset.airBoardChoice;render();});
    content.querySelectorAll('[data-air-board-mastery]').forEach(button=>button.onclick=()=>{draft.tracks[button.dataset.airBoardMastery].mastery=Number(button.dataset.airBoardLevel);render();});
    content.querySelector('[data-cancel-air-doctrine]').onclick=closeBoard;
    content.querySelector('[data-apply-air-doctrine]').onclick=()=>{
      if(draft.grand!==original.grand){controls.grand.value=draft.grand;controls.grand.dispatchEvent(new Event('change',{bubbles:true}));}
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

function injectLaunchers(){
  document.querySelectorAll('details.air-doctrine').forEach(details=>{
    if(details.querySelector('[data-open-air-doctrine-board]'))return;
    const grand=details.querySelector('[id$="-air-grand"]');if(!grand)return;const prefix=grand.id.replace(/-air-grand$/,'');
    const button=document.createElement('button');button.type='button';button.className='btn air-doctrine-board-launch';button.dataset.openAirDoctrineBoard=prefix;button.innerHTML=`<span class="board-button-icon">${iconSvg('air')}</span><span><small>FULL VIEW</small><b>Air Doctrine Board</b></span>`;button.onclick=event=>{event.preventDefault();event.stopPropagation();openBoard(prefix);};
    const body=details.querySelector('.drawer-body');body?.insertAdjacentElement('afterbegin',button);
  });
}

let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;injectLaunchers();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('air-doctrine-board-modal'))closeBoard();});schedule();

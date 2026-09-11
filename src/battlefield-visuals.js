import { iconSvg } from './ui-labels.js';

const RANGE_CONTROLS={
  'b-asupply':{label:'Attacker Supply',kind:'support',min:0,max:1,step:.05,format:v=>`${Math.round(v*100)}%`},
  'b-dsupply':{label:'Defender Supply',kind:'support',min:0,max:1,step:.05,format:v=>`${Math.round(v*100)}%`},
  'b-air':{label:'Air Control',kind:'air',min:-1,max:1,step:.05,format:v=>v>0.01?`Friendly +${Math.round(v*100)}%`:v<-.01?`Enemy ${Math.round(v*100)}%`:'Contested'},
  'b-cas':{label:'CAS Support',kind:'air',min:0,max:1,step:.05,format:v=>`${Math.round(v*100)}%`},
  'b-planning':{label:'Planning',kind:'doctrine',min:0,max:1,step:.05,format:v=>`${Math.round(v*100)}%`},
  'b-night':{label:'Night Fighting',kind:'generic',min:0,max:1,step:.1,format:v=>`${Math.round(v*100)}%`},
  'f-asupply':{label:'Attacker Supply',kind:'support',min:0,max:1,step:.05,format:v=>`${Math.round(v*100)}%`},
  'f-air':{label:'Air Control',kind:'air',min:-1,max:1,step:.05,format:v=>v>0.01?`Friendly +${Math.round(v*100)}%`:v<-.01?`Enemy ${Math.round(v*100)}%`:'Contested'},
  'f-planning':{label:'Planning',kind:'doctrine',min:0,max:1,step:.05,format:v=>`${Math.round(v*100)}%`},
  'f-cas':{label:'CAS Support',kind:'air',min:0,max:1,step:.05,format:v=>`${Math.round(v*100)}%`}
};

const PIP_CONTROLS={
  'b-directions':{label:'Attack Axes',kind:'doctrine',min:0,max:5,unit:v=>v===0?'Single axis':`${v+1} axes`},
  'f-directions':{label:'Attack Axes',kind:'doctrine',min:0,max:5,unit:v=>v===0?'Single axis':`${v+1} axes`},
  'b-entrench':{label:'Entrenchment',kind:'support',min:0,max:100,marks:[0,20,40,60,80,100],unit:v=>`${v}%`},
  'b-fort':{label:'Fort Level',kind:'industry',min:0,max:10,marks:[0,1,2,3,4,5,6,7,8,9,10],unit:v=>v===0?'No fort':`Level ${v}`}
};

function syncSource(source,value){
  source.value=String(value);
  source.dispatchEvent(new Event('change',{bubbles:true}));
}

function enhanceRange(source,meta){
  if(!source||source.dataset.battlefieldVisual==='1')return;
  source.dataset.battlefieldVisual='1';source.classList.add('battlefield-source-input');
  const wrap=document.createElement('div');wrap.className=`battlefield-gauge ${meta.kind}`;
  const value=Number(source.value)||0;
  wrap.innerHTML=`<div class="battlefield-gauge-head"><span class="battlefield-gauge-icon ${meta.kind}">${iconSvg(meta.kind)}</span><span><small>${meta.label}</small><b data-battlefield-readout>${meta.format(value)}</b></span></div><div class="battlefield-range-wrap"><span>${meta.min<0?'ENEMY':'LOW'}</span><input type="range" min="${meta.min}" max="${meta.max}" step="${meta.step}" value="${value}" aria-label="${meta.label}"><span>${meta.min<0?'FRIENDLY':'HIGH'}</span></div>`;
  const range=wrap.querySelector('input[type="range"]'),readout=wrap.querySelector('[data-battlefield-readout]');
  range.oninput=()=>{readout.textContent=meta.format(Number(range.value));};
  range.onchange=()=>syncSource(source,Number(range.value));
  source.insertAdjacentElement('afterend',wrap);
}

function enhancePips(source,meta){
  if(!source||source.dataset.battlefieldVisual==='1')return;
  source.dataset.battlefieldVisual='1';source.classList.add('battlefield-source-input');
  const current=Number(source.value)||0,marks=meta.marks||Array.from({length:meta.max-meta.min+1},(_,i)=>i+meta.min);
  const wrap=document.createElement('div');wrap.className=`battlefield-pip-control ${meta.kind}`;
  wrap.innerHTML=`<div class="battlefield-gauge-head"><span class="battlefield-gauge-icon ${meta.kind}">${iconSvg(meta.kind)}</span><span><small>${meta.label}</small><b>${meta.unit(current)}</b></span></div><div class="battlefield-pips">${marks.map(mark=>`<button type="button" data-battlefield-pip="${mark}" class="${mark===current?'selected':''}" aria-label="${meta.label} ${meta.unit(mark)}"><span></span><small>${mark}</small></button>`).join('')}</div>`;
  wrap.querySelectorAll('[data-battlefield-pip]').forEach(button=>button.onclick=()=>syncSource(source,Number(button.dataset.battlefieldPip)));
  source.insertAdjacentElement('afterend',wrap);
}

function enhance(){
  for(const [id,meta] of Object.entries(RANGE_CONTROLS))enhanceRange(document.getElementById(id),meta);
  for(const [id,meta] of Object.entries(PIP_CONTROLS))enhancePips(document.getElementById(id),meta);
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

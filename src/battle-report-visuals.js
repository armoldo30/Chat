import { iconSvg } from './ui-labels.js';

function metricKind(label=''){
  const s=label.toLowerCase();
  if(/manpower|engaged|reserve/.test(s))return 'infantry';
  if(/hits/.test(s))return 'artillery';
  if(/width/.test(s))return 'doctrine';
  if(/duration|hour/.test(s))return 'generic';
  return 'generic';
}
function enhanceMetrics(report){
  report.querySelectorAll('.result-grid > div').forEach(card=>{
    if(card.dataset.battleVisual==='1')return;card.dataset.battleVisual='1';
    const label=card.querySelector('span')?.textContent||'',kind=metricKind(label),icon=document.createElement('i');icon.className=`battle-metric-icon ${kind}`;icon.innerHTML=iconSvg(kind);card.insertBefore(icon,card.firstChild);
  });
}
function enhanceReport(report){
  if(report.dataset.battleOutcomeVisual==='1')return;report.dataset.battleOutcomeVisual='1';
  const title=report.querySelector('.report-title h2')?.textContent||'',match=title.match(/([\d.]+)%\s+attacker win.*?([\d.]+)%\s+defender win/i);if(!match)return;
  const attacker=Number(match[1])||0,defender=Number(match[2])||0,drawText=report.querySelector('.report-title .badge')?.textContent||'',draw=Number(drawText.match(/([\d.]+)%/)?.[1])||Math.max(0,100-attacker-defender);
  const bar=document.createElement('div');bar.className='battle-outcome-visual';
  bar.innerHTML=`<div class="battle-outcome-legend"><span class="attacker"><b>${attacker.toFixed(1)}%</b><small>ATTACKER</small></span><span class="draw"><b>${draw.toFixed(1)}%</b><small>UNRESOLVED</small></span><span class="defender"><b>${defender.toFixed(1)}%</b><small>DEFENDER</small></span></div><div class="battle-outcome-track" aria-label="Battle outcome probabilities"><i class="attacker" style="width:${attacker}%"></i><i class="draw" style="width:${draw}%"></i><i class="defender" style="width:${defender}%"></i></div>`;
  report.querySelector('.report-title')?.insertAdjacentElement('afterend',bar);enhanceMetrics(report);
}
function enhanceSaved(saved){
  if(saved.dataset.battleOutcomeVisual==='1')return;saved.dataset.battleOutcomeVisual='1';
  const text=saved.querySelector('h3')?.textContent||'',win=Number(text.match(/([\d.]+)%/)?.[1]);if(!Number.isFinite(win))return;
  const meter=document.createElement('div');meter.className='saved-battle-meter';meter.style.setProperty('--win',`${Math.max(0,Math.min(100,win))}%`);meter.innerHTML=`<span><b>${win.toFixed(0)}%</b><small>WIN</small></span>`;saved.insertBefore(meter,saved.firstChild);
}
function run(){document.querySelectorAll('#battleResult .report').forEach(enhanceReport);document.querySelectorAll('#battleResult .saved-battle').forEach(enhanceSaved);}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;run();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

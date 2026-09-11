import { iconSvg } from './ui-labels.js';

const ROUTE_KIND={dashboard:'doctrine',front:'doctrine',intel:'generic',battle:'infantry',gauntlet:'doctrine',tank:'armor',air:'air',production:'industry',data:'support',scenario:'generic'};
const ROUTE_MARK={dashboard:'HQ',front:'OPS',intel:'?',battle:'',gauntlet:'G',tank:'',air:'',production:'',data:'',scenario:''};

function enhance(){
  document.querySelectorAll('.sidebar nav a').forEach(link=>{
    const route=(link.getAttribute('href')||'').replace('#',''),code=link.querySelector('.nav-code');if(!code||code.dataset.visualNav==='1')return;
    code.dataset.visualNav='1';const kind=ROUTE_KIND[route]||'generic',mark=ROUTE_MARK[route]||'';
    code.classList.add('nav-visual-icon',kind);code.innerHTML=`${iconSvg(kind)}${mark?`<i>${mark}</i>`:''}`;
  });
}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

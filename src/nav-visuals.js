import { iconSvg } from './ui-labels.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

const ROUTE_KIND={dashboard:'hq',front:'front',intel:'intel',battle:'infantry',gauntlet:'gauntlet',tank:'armor',air:'air',production:'industry',data:'data',scenario:'scenario'};
const ROUTE_MARK={dashboard:'',front:'',intel:'',battle:'',gauntlet:'',tank:'',air:'',production:'',data:'',scenario:''};

function enhance(){
  document.querySelectorAll('.sidebar nav a').forEach(link=>{
    const route=(link.getAttribute('href')||'').replace('#',''),code=link.querySelector('.nav-code');if(!code||code.dataset.visualNav==='1')return;
    code.dataset.visualNav='1';const kind=ROUTE_KIND[route]||'generic',mark=ROUTE_MARK[route]||'';
    code.classList.add('nav-visual-icon',kind);code.innerHTML=`${iconSvg(kind)}${mark?`<i>${mark}</i>`:''}`;
  });
}
registerUiEnhancer(enhance);

import { AD_CONFIG, adsReady, validAdSenseSlot } from './ad-config.js';

const SCRIPT_ID='hoi4-adsense-script';
const OWNED='data-hoi4-ad-owned';

function ensureAccountMeta(){
  if(!adsReady())return;
  let meta=document.querySelector('meta[name="google-adsense-account"]');
  if(!meta){meta=document.createElement('meta');meta.name='google-adsense-account';document.head.append(meta);}
  meta.content=AD_CONFIG.client;
}

function ensureScript(){
  if(!adsReady()||document.getElementById(SCRIPT_ID))return;
  const script=document.createElement('script');
  script.id=SCRIPT_ID;script.async=true;script.crossOrigin='anonymous';
  script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(AD_CONFIG.client)}`;
  document.head.append(script);
}

function adNode(key){
  const slot=AD_CONFIG.slots?.[key];if(!validAdSenseSlot(slot))return null;
  const wrap=document.createElement('aside');wrap.className=`ad-zone ad-zone-${key}`;wrap.setAttribute(OWNED,key);wrap.setAttribute('aria-label','Advertisement');
  wrap.innerHTML=`<span class="ad-zone-label">ADVERTISEMENT</span><ins class="adsbygoogle" style="display:block" data-ad-client="${AD_CONFIG.client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
  return wrap;
}

function requestAd(node){
  if(!node)return;queueMicrotask(()=>{try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch{}});
}

function clearOwned(){document.querySelectorAll(`[${OWNED}]`).forEach(node=>node.remove());}

function mount(){
  clearOwned();
  document.documentElement.classList.toggle('ads-enabled',adsReady());
  if(!adsReady())return;
  ensureAccountMeta();ensureScript();

  const report=document.querySelector('#battleResult .report:last-of-type');
  if(report){const node=adNode('result');if(node){report.insertAdjacentElement('afterend',node);requestAd(node);}}

  const view=document.querySelector('#view');
  if(view){const node=adNode('footer');if(node){view.append(node);requestAd(node);}}
}

function wirePrivacyChoices(){
  const button=document.querySelector('[data-privacy-choices]');if(!button)return;
  button.hidden=false;
  button.onclick=()=>{
    if(typeof window.HOI4_CMP_OPEN==='function')window.HOI4_CMP_OPEN();
    else location.href='./privacy.html#privacy-choices';
  };
}

let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;mount();wirePrivacyChoices();});}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();

from pathlib import Path

p=Path('src/main.js')
s=p.read_text()

old="import { renderGauntlet } from './gauntlet-ui.js';\n"
new=old+"import { buildScenarioShareUrl, decodeScenarioShare, encodeScenarioShare, materializeScenarioShare } from './scenario-share.js';\n"
if old not in s or "from './scenario-share.js'" in s:
    raise SystemExit('share import anchor missing or already applied')
s=s.replace(old,new,1)

start=s.index('function load(){')
end=s.index('\nlet state=load();',start)
load_block=r'''let sharedScenarioNotice='',sharedScenarioError='',sharedScenarioAttempted=false;
function scenarioTokenFromLocation(){
  try{return new URLSearchParams(globalThis.location?.search||'').get('scenario')||'';}catch{return '';}
}
function loadLocalState(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE)||localStorage.getItem(LEGACY_STORAGE)||'null'),next=deepMerge(defaults,raw);
    if(raw?.production?.energySatisfaction===undefined&&raw?.production?.baseFactoryOutput!==undefined){
      const span=PRODUCTION_CONSTANTS.poweredFactoryOutput-PRODUCTION_CONSTANTS.baseFactoryOutput,legacy=Number(raw.production.baseFactoryOutput);
      if(Number.isFinite(legacy)&&span>0)next.production.energySatisfaction=clamp((legacy-PRODUCTION_CONSTANTS.baseFactoryOutput)/span*100,0,100);
    }
    delete next.production.baseFactoryOutput;next.schema=7;return next;
  }catch{return structuredClone(defaults);}
}
function load(){
  const token=scenarioTokenFromLocation();
  if(token){
    sharedScenarioAttempted=true;
    try{
      const payload=decodeScenarioShare(token);
      if(payload.gameVersion!==MODEL_META.gameVersion)throw new Error(`This matchup targets HOI4 ${payload.gameVersion}, but this planner is locked to ${MODEL_META.gameVersion}.`);
      sharedScenarioNotice='Shared matchup loaded';
      return materializeScenarioShare(defaults,payload);
    }catch(error){
      sharedScenarioError=error?.message||String(error);
      console.warn('Ignoring invalid shared scenario.',error);
    }
  }
  return loadLocalState();
}'''
s=s[:start]+load_block+s[end:]

route_anchor="function route(){const r=location.hash.replace('#','');return ['dashboard','battle','gauntlet','tank','air','production','front','intel','data','scenario'].includes(r)?r:'battle';}"
if route_anchor not in s:
    raise SystemExit('route anchor missing')
share_helpers=r'''function clearScenarioShareParam(){
  try{
    if(!globalThis.location?.href||!globalThis.history?.replaceState)return;
    const url=new URL(globalThis.location.href);
    if(!url.searchParams.has('scenario'))return;
    url.searchParams.delete('scenario');
    globalThis.history.replaceState(null,'',`${url.pathname}${url.search}${url.hash}`);
  }catch(error){console.warn('Unable to clear scenario share parameter.',error);}
}
function scenarioShareUrl(){
  if(!state.dataPack?.meta?.bundled)throw new Error('Share links currently support the bundled vanilla 1.19.2 baseline only. Export JSON for custom data-pack scenarios.');
  const token=encodeScenarioShare(serializableState(),defaults,{gameVersion:MODEL_META.gameVersion});
  const href=globalThis.location?.href||'https://hoioracle.com/#battle';
  return buildScenarioShareUrl(href,token,'battle');
}
async function copyScenarioShareLink(){
  try{
    const url=scenarioShareUrl(),clipboard=globalThis.navigator?.clipboard;
    if(clipboard?.writeText){
      await clipboard.writeText(url);
      globalThis.alert?.('Matchup link copied. It includes the current inputs and designs on the bundled 1.19.2 baseline; cached battle results are not shared.');
    }else if(typeof globalThis.prompt==='function')globalThis.prompt('Copy this matchup link:',url);
    else globalThis.alert?.(url);
  }catch(error){globalThis.alert?.(error?.message||String(error));}
}
if(sharedScenarioAttempted){
  if(sharedScenarioNotice)save();
  clearScenarioShareParam();
}
'''
s=s.replace(route_anchor,share_helpers+route_anchor,1)

top_old="<div class=\"top-actions\">${badge(`Game ${MODEL_META.gameVersion}`,'good')}${badge('Public-data baseline')}</div>"
top_new="<div class=\"top-actions\">${badge(`Game ${MODEL_META.gameVersion}`,'good')}${badge(state.dataPack?.meta?.bundled?'Public-data baseline':'Custom data pack',state.dataPack?.meta?.bundled?'':'warn')}${sharedScenarioNotice?badge(sharedScenarioNotice,'good'):''}${sharedScenarioError?badge('Share link ignored','warn'):''}</div>"
if top_old not in s:
    raise SystemExit('topbar anchor missing')
s=s.replace(top_old,top_new,1)

scenario_actions_old='<div class="actions"><button class="primary" id="saveState">Save locally</button><button class="btn" id="exportState">Export JSON</button><label class="btn file">Import JSON<input id="importState" type="file" accept="application/json" hidden></label><button class="btn danger" id="resetState">Reset</button></div>'
scenario_actions_new='''<div class="actions"><button class="primary" id="saveState">Save locally</button><button class="btn" id="shareState" ${state.dataPack?.meta?.bundled?'':'disabled'}>Copy matchup link</button><button class="btn" id="exportState">Export JSON</button><label class="btn file">Import JSON<input id="importState" type="file" accept="application/json" hidden></label><button class="btn danger" id="resetState">Reset</button></div><p class="muted">${state.dataPack?.meta?.bundled?'Share links include current scenario inputs, templates, technology, MIO, tank and aircraft designs on the bundled 1.19.2 baseline. Cached battle results are excluded so the recipient reruns the analysis.':'Share links are disabled for custom imported data packs because the pack itself is not embedded. Use Export JSON instead.'}</p>${sharedScenarioError?`<p class="notice warn"><b>Share link ignored:</b> ${esc(sharedScenarioError)}</p>`:''}'''
if scenario_actions_old not in s:
    raise SystemExit('scenario actions anchor missing')
s=s.replace(scenario_actions_old,scenario_actions_new,1)

bind_old="$('saveState').onclick=()=>{if(save())alert('Scenario saved locally.');}; $('exportState').onclick=()=>downloadJSON('war-planner-scenario.json',serializableState());"
bind_new="$('saveState').onclick=()=>{if(save())alert('Scenario saved locally.');}; $('shareState').onclick=()=>copyScenarioShareLink(); $('exportState').onclick=()=>downloadJSON('war-planner-scenario.json',serializableState());"
if bind_old not in s:
    raise SystemExit('scenario binding anchor missing')
s=s.replace(bind_old,bind_new,1)

p.write_text(s)
print('scenario share integration applied')

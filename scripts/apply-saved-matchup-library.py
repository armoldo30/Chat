from pathlib import Path

main=Path('src/main.js')
s=main.read_text()

share_import="import { buildScenarioShareUrl, decodeScenarioShare, encodeScenarioShare, materializeScenarioShare } from './scenario-share.js';\n"
library_import="import { MAX_SAVED_MATCHUPS, MAX_SAVED_MATCHUP_NAME, normalizeSavedMatchups, removeSavedMatchup, savedMatchupById, upsertSavedMatchup } from './scenario-library.js';\n"
if library_import not in s:
    if share_import not in s: raise SystemExit('scenario share import anchor missing')
    s=s.replace(share_import,share_import+library_import,1)

helper=r'''const SAVED_MATCHUPS_STORAGE='hoi4-war-planner-saved-matchups-v1';
let savedMatchupLibraryError='';
function loadSavedMatchupLibrary(){
  try{
    const raw=JSON.parse(localStorage.getItem(SAVED_MATCHUPS_STORAGE)||'[]'),normalized=normalizeSavedMatchups(raw,{gameVersion:MODEL_META.gameVersion});
    if(JSON.stringify(raw)!==JSON.stringify(normalized))localStorage.setItem(SAVED_MATCHUPS_STORAGE,JSON.stringify(normalized));
    return normalized;
  }catch(error){
    console.warn('Unable to read saved matchup library.',error);savedMatchupLibraryError='Saved matchup library could not be read. Corrupt entries were ignored.';return [];
  }
}
let savedMatchups=loadSavedMatchupLibrary();
function persistSavedMatchupLibrary(next){
  try{
    const normalized=normalizeSavedMatchups(next,{gameVersion:MODEL_META.gameVersion});
    localStorage.setItem(SAVED_MATCHUPS_STORAGE,JSON.stringify(normalized));savedMatchups=normalized;savedMatchupLibraryError='';return true;
  }catch(error){
    console.error('Unable to save matchup library.',error);savedMatchupLibraryError='Saved matchup library could not be written. Your active planner state is unchanged.';alert(savedMatchupLibraryError);return false;
  }
}
function newSavedMatchupId(){
  const uuid=globalThis.crypto?.randomUUID?.();
  return uuid?uuid.replace(/-/g,'_'):`m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;
}
function currentSavedMatchupToken(){
  if(!state.dataPack?.meta?.bundled)throw new Error('Named saves currently support the bundled vanilla 1.19.2 baseline only. Export JSON to preserve a custom imported data pack.');
  return encodeScenarioShare(serializableState(),scenarioShareBaseline(),{gameVersion:MODEL_META.gameVersion});
}
function createNamedSavedMatchup(name){
  try{
    const next=upsertSavedMatchup(savedMatchups,{id:newSavedMatchupId(),name,token:currentSavedMatchupToken(),gameVersion:MODEL_META.gameVersion,now:new Date().toISOString()});
    if(persistSavedMatchupLibrary(next)){alert('Matchup saved to this browser.');shell();}
  }catch(error){alert(error?.message||String(error));}
}
function replaceNamedSavedMatchup(id){
  const entry=savedMatchupById(savedMatchups,id,{gameVersion:MODEL_META.gameVersion});if(!entry)return;
  if(!confirm(`Replace “${entry.name}” with the current matchup inputs?`))return;
  try{
    const next=upsertSavedMatchup(savedMatchups,{id:entry.id,name:entry.name,token:currentSavedMatchupToken(),gameVersion:MODEL_META.gameVersion,now:new Date().toISOString()});
    if(persistSavedMatchupLibrary(next))shell();
  }catch(error){alert(error?.message||String(error));}
}
function deleteNamedSavedMatchup(id){
  const entry=savedMatchupById(savedMatchups,id,{gameVersion:MODEL_META.gameVersion});if(!entry)return;
  if(!confirm(`Delete saved matchup “${entry.name}”?`))return;
  if(persistSavedMatchupLibrary(removeSavedMatchup(savedMatchups,id,{gameVersion:MODEL_META.gameVersion})))shell();
}
function loadNamedSavedMatchup(id){
  const entry=savedMatchupById(savedMatchups,id,{gameVersion:MODEL_META.gameVersion});if(!entry)return;
  if(!confirm(`Load “${entry.name}”? The active planner state will be replaced; other named saves are unaffected.`))return;
  try{
    const payload=decodeScenarioShare(entry.token);
    if(payload.gameVersion!==MODEL_META.gameVersion)throw new Error(`This saved matchup targets HOI4 ${payload.gameVersion}.`);
    state=materializeScenarioShare(scenarioShareBaseline(),payload);state.dataPack=BUILTIN_1192;state.schema=defaults.schema;
    ensureDesignerState('attacker');ensureDesignerState('defender');ensureTechState('attacker');ensureTechState('defender');ensureTankState();ensureAirState();ensureMioState();
    if(save()){location.hash='#battle';location.reload();}
  }catch(error){alert(error?.message||String(error));}
}
async function copyNamedSavedMatchupLink(id){
  const entry=savedMatchupById(savedMatchups,id,{gameVersion:MODEL_META.gameVersion});if(!entry)return;
  try{
    const href=globalThis.location?.href||'https://hoioracle.com/#battle',url=buildScenarioShareUrl(href,entry.token,'battle'),clipboard=globalThis.navigator?.clipboard;
    if(clipboard?.writeText){await clipboard.writeText(url);alert('Saved matchup link copied.');}
    else if(typeof globalThis.prompt==='function')globalThis.prompt('Copy this matchup link:',url);
    else alert(url);
  }catch(error){alert(error?.message||String(error));}
}
function savedMatchupPanel(){
  const bundled=!!state.dataPack?.meta?.bundled,rows=savedMatchups.map(entry=>{
    const updated=new Date(entry.updatedAt).toLocaleString();
    return `<article class="saved-matchup-row"><div class="saved-matchup-copy"><strong>${esc(entry.name)}</strong><small>Updated ${esc(updated)} · HOI4 ${esc(entry.gameVersion)}</small></div><div class="saved-matchup-actions"><button class="btn" data-saved-load="${entry.id}">Load</button><button class="btn" data-saved-copy="${entry.id}">Copy link</button><button class="btn" data-saved-update="${entry.id}" ${bundled?'':'disabled'}>Replace</button><button class="btn danger" data-saved-delete="${entry.id}">Delete</button></div></article>`;
  }).join('');
  const create=bundled?`<div class="saved-matchup-create"><label>Matchup name<input id="savedMatchupName" maxlength="${MAX_SAVED_MATCHUP_NAME}" value="${esc(state.operation||`${state.attackerName} vs ${state.defenderName}`)}"></label><button class="primary" id="saveNamedMatchup">Save current matchup</button></div>`:`<p class="notice warn"><b>Custom data pack active.</b> You can load, copy or delete existing vanilla saves, but saving/replacing is disabled because the imported pack is not embedded. Use Export JSON to preserve the custom ruleset.</p>`;
  return panel('Saved matchups',`${create}<div class="saved-matchup-count"><span>${savedMatchups.length}/${MAX_SAVED_MATCHUPS} stored in this browser</span><span>No account required</span></div>${savedMatchupLibraryError?`<p class="notice warn">${esc(savedMatchupLibraryError)}</p>`:''}<div class="saved-matchup-list">${rows||'<div class="saved-matchup-empty">No named matchups saved yet.</div>'}</div><p class="muted">Named saves use the same compact, version-locked inputs as share links. Cached battle results are excluded so a loaded matchup is recalculated under the bundled 1.19.2 baseline.</p>`,'saved-matchups-panel');
}
function bindSavedMatchupLibrary(){
  if($('saveNamedMatchup'))$('saveNamedMatchup').onclick=()=>createNamedSavedMatchup($('savedMatchupName').value);
  document.querySelectorAll('[data-saved-load]').forEach(el=>el.onclick=()=>loadNamedSavedMatchup(el.dataset.savedLoad));
  document.querySelectorAll('[data-saved-copy]').forEach(el=>el.onclick=()=>copyNamedSavedMatchupLink(el.dataset.savedCopy));
  document.querySelectorAll('[data-saved-update]').forEach(el=>el.onclick=()=>replaceNamedSavedMatchup(el.dataset.savedUpdate));
  document.querySelectorAll('[data-saved-delete]').forEach(el=>el.onclick=()=>deleteNamedSavedMatchup(el.dataset.savedDelete));
}

'''
scenario_anchor='function scenario(c){'
if 'const SAVED_MATCHUPS_STORAGE=' not in s:
    if scenario_anchor not in s: raise SystemExit('scenario function anchor missing')
    s=s.replace(scenario_anchor,helper+scenario_anchor,1)

insert_anchor="  ${panel('Implemented systems',"
if '${savedMatchupPanel()}' not in s:
    if insert_anchor not in s: raise SystemExit('implemented systems anchor missing')
    s=s.replace(insert_anchor,"  ${savedMatchupPanel()}\n"+insert_anchor,1)

bind_anchor="  $('resetState').onclick=()=>{if(confirm('Reset all planner data?')){state=structuredClone(defaults);state.schema=defaults.schema;if(save())location.reload();}};"
if '  bindSavedMatchupLibrary();\n' not in s:
    if bind_anchor not in s: raise SystemExit('scenario binding anchor missing')
    s=s.replace(bind_anchor,"  bindSavedMatchupLibrary();\n"+bind_anchor,1)

main.write_text(s)

index=Path('index.html')
h=index.read_text()
css_anchor='  <link rel="stylesheet" href="./src/counter-analysis.css" />\n'
css_line='  <link rel="stylesheet" href="./src/scenario-library.css" />\n'
if css_line not in h:
    if css_anchor not in h: raise SystemExit('index css anchor missing')
    h=h.replace(css_anchor,css_anchor+css_line,1)
index.write_text(h)
print('saved matchup library integration applied')

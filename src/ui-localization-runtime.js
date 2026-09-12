import { setDisplayLocalization } from './ui-labels.js';
import { parseEnglishLocalizationFiles, mergeLocalization } from './ui-localization.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

const STORAGE='hoi4-war-planner-localization-english-v1';

function load(){
  try{return JSON.parse(localStorage.getItem(STORAGE)||'{}');}catch{return {};}
}
let localization=load();
setDisplayLocalization(localization);

function injectImporter(){
  if(document.getElementById('visualLocalizationFolder'))return;
  const fileInput=document.getElementById('fileImport'),grid=fileInput?.closest('.grid.two');
  if(!grid)return;
  const panel=document.createElement('section');
  panel.className='panel localization-import-panel';
  panel.innerHTML=`<div class="panel-head"><h2>In-game English labels</h2></div><div class="localization-import-body"><div><p>Import HOI4's <b>localisation/english</b> folder to replace internal file IDs with the English labels shown by the game.</p><small>${Object.keys(localization).length.toLocaleString()} localization entries stored in this browser.</small></div><label class="drop-zone compact-localization-zone">Select localisation/english folder<input id="visualLocalizationFolder" type="file" multiple webkitdirectory directory></label><button type="button" class="btn" id="clearVisualLocalization" ${Object.keys(localization).length?'':'disabled'}>Clear labels</button></div>`;
  grid.insertAdjacentElement('afterend',panel);
  panel.querySelector('#visualLocalizationFolder').onchange=async event=>{
    const result=await parseEnglishLocalizationFiles(event.target.files);
    if(!result.count){alert('No English HOI4 localization entries were recognized in that folder.');return;}
    localization=mergeLocalization(localization,result.entries);
    localStorage.setItem(STORAGE,JSON.stringify(localization));
    setDisplayLocalization(localization);
    location.reload();
  };
  panel.querySelector('#clearVisualLocalization').onclick=()=>{
    localStorage.removeItem(STORAGE);localization={};setDisplayLocalization({});location.reload();
  };
}

registerUiEnhancer(injectImporter);

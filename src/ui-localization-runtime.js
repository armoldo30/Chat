import { setDisplayLocalization } from './ui-labels.js';
import { parseEnglishLocalizationFiles, mergeLocalization } from './ui-localization.js';
import { LOCALIZATION_STORAGE_KEY as STORAGE, combinedDisplayLocalization } from './ui-localization-bootstrap.js';
import { BUILTIN_ENGLISH_LOCALIZATION_1192_META } from './builtin1192/localization-english-1192.js';
import { registerUiEnhancer } from './ui-enhancer-runtime.js';

function load(){
  try{return JSON.parse(localStorage.getItem(STORAGE)||'{}');}catch{return {};}
}
let localization=load();
setDisplayLocalization(combinedDisplayLocalization(localization));

function injectImporter(){
  if(document.getElementById('visualLocalizationFolder'))return;
  const fileInput=document.getElementById('fileImport'),grid=fileInput?.closest('.grid.two');
  if(!grid)return;
  const panel=document.createElement('section');
  panel.className='panel localization-import-panel';
  const bundledCount=Number(BUILTIN_ENGLISH_LOCALIZATION_1192_META.resolvedCount)||0;
  const bundledReady=!!BUILTIN_ENGLISH_LOCALIZATION_1192_META.generated;
  const explanation=bundledReady
    ?`Vanilla HOI4 ${BUILTIN_ENGLISH_LOCALIZATION_1192_META.gameVersion} English labels are bundled. You can optionally import a localisation/english folder to override labels for a modded or custom installation.`
    :`Import HOI4's <b>localisation/english</b> folder to replace internal file IDs with the English labels shown by the game. The verified vanilla ${BUILTIN_ENGLISH_LOCALIZATION_1192_META.gameVersion} catalog has not been generated yet.`;
  panel.innerHTML=`<div class="panel-head"><h2>In-game English labels</h2></div><div class="localization-import-body"><div><p>${explanation}</p><small>${bundledCount.toLocaleString()} verified vanilla labels bundled · ${Object.keys(localization).length.toLocaleString()} browser override entries.</small></div><label class="drop-zone compact-localization-zone">Select localisation/english folder<input id="visualLocalizationFolder" type="file" multiple webkitdirectory directory></label><button type="button" class="btn" id="clearVisualLocalization" ${Object.keys(localization).length?'':'disabled'}>Clear browser overrides</button></div>`;
  grid.insertAdjacentElement('afterend',panel);
  panel.querySelector('#visualLocalizationFolder').onchange=async event=>{
    const result=await parseEnglishLocalizationFiles(event.target.files);
    if(!result.count){alert('No English HOI4 localization entries were recognized in that folder.');return;}
    localization=mergeLocalization(localization,result.entries);
    localStorage.setItem(STORAGE,JSON.stringify(localization));
    setDisplayLocalization(combinedDisplayLocalization(localization));
    location.reload();
  };
  panel.querySelector('#clearVisualLocalization').onclick=()=>{
    localStorage.removeItem(STORAGE);localization={};setDisplayLocalization(combinedDisplayLocalization());location.reload();
  };
}

registerUiEnhancer(injectImporter);

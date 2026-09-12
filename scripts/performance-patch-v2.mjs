import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function replaceOnce(source,needle,replacement,label){
  const first=source.indexOf(needle);
  if(first<0)throw new Error(`Performance patch could not find ${label}.`);
  if(source.indexOf(needle,first+needle.length)>=0)throw new Error(`Performance patch found ${label} more than once.`);
  return source.slice(0,first)+replacement+source.slice(first+needle.length);
}

export function applyPerformancePatch(source){
  let out=String(source);
  out=replaceOnce(out,"function currentMioCatalog(){return mioCatalog(state.dataPack);}",`let currentMioCatalogPack=null,currentMioCatalogValue=null;\nfunction currentMioCatalog(){\n  if(currentMioCatalogPack!==state.dataPack||!currentMioCatalogValue){currentMioCatalogPack=state.dataPack;currentMioCatalogValue=mioCatalog(state.dataPack);}\n  return currentMioCatalogValue;\n}`,'MIO catalog helper');
  out=replaceOnce(out,"function equipmentForSide(side='attacker'){","function equipmentForSideUncached(side='attacker'){",'equipmentForSide declaration');
  out=replaceOnce(out,"function validRegimentalSupports(side){",`function sideDerivedSignature(side){\n  ensureTankState();ensureMioState();const tech=ensureTechState(side);\n  return JSON.stringify([state.dataSnapshotYear,tech,state.tankVariants?.[side]||null,state.mioSelections?.[side]||null]);\n}\nconst equipmentSideCache=new Map();\nfunction equipmentForSide(side='attacker'){\n  const sig=sideDerivedSignature(side),cached=equipmentSideCache.get(side);\n  if(cached&&cached.pack===state.dataPack&&cached.sig===sig)return cached.value;\n  const value=equipmentForSideUncached(side);equipmentSideCache.set(side,{pack:state.dataPack,sig,value});return value;\n}\nfunction validRegimentalSupports(side){`,'equipment cache insertion point');
  out=replaceOnce(out,"function techData(side){","function techDataUncached(side){",'techData declaration');
  out=replaceOnce(out,"function techProblems(side){",`const techSideCache=new Map();\nfunction techData(side){\n  const sig=sideDerivedSignature(side),cached=techSideCache.get(side);\n  if(cached&&cached.pack===state.dataPack&&cached.sig===sig)return cached.value;\n  const value=techDataUncached(side);techSideCache.set(side,{pack:state.dataPack,sig,value});return value;\n}\nfunction techProblems(side){`,'tech cache insertion point');
  out=replaceOnce(out,"function division(side){ensureDesignerState(side);const data=techData(side),line=gridToCounts(state[side+'Grid'],Object.keys(battalions));return calcDivision(line,data.battalions,[...state[side+'Supports'],...validRegimentalSupports(side)],data.supports);}",`const divisionSideCache=new Map();\nfunction division(side){\n  ensureDesignerState(side);\n  const sig=sideDerivedSignature(side)+'|'+JSON.stringify([state[side+'Grid'],state[side+'Supports'],state[side+'RegimentalSupports']]),cached=divisionSideCache.get(side);\n  if(cached&&cached.pack===state.dataPack&&cached.sig===sig)return cached.value;\n  const data=techData(side),line=gridToCounts(state[side+'Grid'],Object.keys(battalions)),value=calcDivision(line,data.battalions,[...state[side+'Supports'],...validRegimentalSupports(side)],data.supports);\n  divisionSideCache.set(side,{pack:state.dataPack,sig,value});return value;\n}`,'division calculation');

  out=replaceOnce(out,"function combatBand(){return uncertaintyBand(aggregate('attacker'),aggregate('defender'),battleOpts(),state.intelUncertainty,Math.min(350,state.battlefield.runs));}",`const combatBandCache=new Map();\nfunction cachedCombatBand(maxRuns=350){\n  const runs=Math.min(maxRuns,state.battlefield.runs),key=battleFingerprint()+'|'+state.intelUncertainty+'|'+runs,cached=combatBandCache.get(key);\n  if(cached)return cached;\n  const value=uncertaintyBand(aggregate('attacker'),aggregate('defender'),battleOpts(),state.intelUncertainty,runs);\n  if(combatBandCache.size>8)combatBandCache.clear();combatBandCache.set(key,value);return value;\n}\nfunction combatBand(){return cachedCombatBand(350);}`,'combat band cache');
  out=replaceOnce(out,"function advisorCombatBand(){return uncertaintyBand(aggregate('attacker'),aggregate('defender'),battleOpts(),state.intelUncertainty,Math.min(180,state.battlefield.runs));}","function advisorCombatBand(){return cachedCombatBand(180);}",'advisor combat band cache');

  out=replaceOnce(out,"$('app').innerHTML=`<div class=\"app-shell\">","if(!$('app').querySelector('.app-shell'))$('app').innerHTML=`<div class=\"app-shell\">",'persistent application shell guard');
  out=replaceOnce(out,"  render(active);\n}\nfunction render(r){const v=$('view');({dashboard,battle,gauntlet,tank,air,production,front,intel,data,scenario}[r]||battle)(v);}",`  const shellRoot=$('app').querySelector('.app-shell');\n  if(shellRoot){\n    shellRoot.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===\`#\${active}\`));\n    const kicker=shellRoot.querySelector('.topbar .kicker'),operation=shellRoot.querySelector('.topbar b');\n    if(kicker)kicker.textContent=state.country;if(operation)operation.textContent=state.operation;\n  }\n  render(active);\n}\nfunction render(r){const v=$('view');({dashboard,battle,gauntlet,tank,air,production,front,intel,data,scenario}[r]||battle)(v);}`,'persistent shell synchronization');

  out=replaceOnce(out,"function render(r){const v=$('view');({dashboard,battle,gauntlet,tank,air,production,front,intel,data,scenario}[r]||battle)(v);}",`function render(r){const v=$('view');({dashboard,battle,gauntlet,tank,air,production,front,intel,data,scenario}[r]||battle)(v);}\nfunction refreshDivisionLab(){const v=$('view');if(v&&route()==='battle')battle(v);else shell();}`,'render helper');
  out=replaceOnce(out,"document.querySelectorAll('[data-bslot]').forEach(el=>el.onclick=ev=>{designerPick={kind:'battalion',side,c:+el.dataset.c,r:+el.dataset.r,fillRegiment:!!ev.shiftKey};shell();});","document.querySelectorAll('[data-bslot]').forEach(el=>el.onclick=ev=>{designerPick={kind:'battalion',side,c:+el.dataset.c,r:+el.dataset.r,fillRegiment:!!ev.shiftKey};refreshDivisionLab();});",'battalion picker open handler');
  out=replaceOnce(out,"document.querySelectorAll('[data-sslot]').forEach(el=>el.onclick=()=>{designerPick={kind:'support',side,i:+el.dataset.sslot};shell();});","document.querySelectorAll('[data-sslot]').forEach(el=>el.onclick=()=>{designerPick={kind:'support',side,i:+el.dataset.sslot};refreshDivisionLab();});",'support picker open handler');
  out=replaceOnce(out,"document.querySelectorAll('[data-rslot]').forEach(el=>el.onclick=()=>{designerPick={kind:'regimental',side,c:+el.dataset.rslot};shell();});","document.querySelectorAll('[data-rslot]').forEach(el=>el.onclick=()=>{designerPick={kind:'regimental',side,c:+el.dataset.rslot};refreshDivisionLab();});",'regimental picker open handler');
  out=replaceOnce(out,"document.querySelectorAll('[data-cancel-pick]').forEach(el=>el.onclick=()=>{designerPick=null;shell();});","document.querySelectorAll('[data-cancel-pick]').forEach(el=>el.onclick=()=>{designerPick=null;refreshDivisionLab();});",'picker cancel handler');
  out=replaceOnce(out,"const pickerOverlay=document.querySelectorAll('[data-picker-overlay]')[0];if(pickerOverlay)pickerOverlay.onclick=e=>{if(e.target===pickerOverlay){designerPick=null;shell();}};","const pickerOverlay=document.querySelectorAll('[data-picker-overlay]')[0];if(pickerOverlay)pickerOverlay.onclick=e=>{if(e.target===pickerOverlay){designerPick=null;refreshDivisionLab();}};",'picker overlay handler');
  out=replaceOnce(out,"if(designerPick?.kind==='regimental')state[side+'RegimentalSupports'][designerPick.c]=value;\n    syncDesignerSide(side);designerPick=null;save();shell();","if(designerPick?.kind==='regimental')state[side+'RegimentalSupports'][designerPick.c]=value;\n    syncDesignerSide(side);designerPick=null;save();refreshDivisionLab();",'picker selection handler');
  return out;
}

async function main(){
  const target=process.argv[2];
  if(!target)throw new Error('Usage: node scripts/performance-patch-v2.mjs <path-to-main.js>');
  const source=await readFile(target,'utf8');
  await writeFile(target,applyPerformancePatch(source));
  console.log(`Applied runtime performance patch to ${target}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main();

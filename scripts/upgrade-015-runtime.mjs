import fs from 'node:fs';

function edit(path, fn){
  const before=fs.readFileSync(path,'utf8');
  const after=fn(before);
  if(after!==before){fs.writeFileSync(path,after);console.log(`updated ${path}`);}else console.log(`unchanged ${path}`);
}
function once(s,from,to,label){
  if(s.includes(to))return s;
  if(!s.includes(from))throw new Error(`0.15 runtime pattern not found: ${label}`);
  return s.replace(from,to);
}

edit('src/gameData.js',s=>{
  s=once(s,
"const words=u=>[u?.id,u?.group,...(u?.types||[]),...(u?.categories||[])].filter(Boolean).join(' ').toLowerCase();",
"const words=u=>[u?.id,u?.group,...(u?.types||[]),...(u?.categories||[])].filter(Boolean).join(' ').toLowerCase();\nconst indexedRequirements=(pack,kind,id)=>[...new Set(pack?.requirements?.[kind]?.[id]||[])];",
'requirement index helper');
  s=once(s,
"regimentalSupport:kind.regimental,regimentGroup:kind.regimentGroup,prerequisite:raw.prerequisite||null};",
"regimentalSupport:kind.regimental,regimentGroup:kind.regimentGroup,requirements:indexedRequirements(pack,'subUnits',raw.id),prerequisite:raw.prerequisite||null};",
'subunit requirements');
  s=once(s,
"export function prerequisiteText(record){\n  const p=record?.prerequisite;\n  if(!p)return '';",
"export function prerequisiteText(record){\n  const indexed=record?.requirements;if(Array.isArray(indexed)&&indexed.length)return indexed.join(' · ');\n  const p=record?.prerequisite;\n  if(!p)return '';",
'prerequisite text');
  return s;
});

edit('src/designerData.js',s=>{
  s=once(s,
"const text=v=>String(v||'').toLowerCase();",
"const text=v=>String(v||'').toLowerCase();\nconst mergedRequirements=(pack,kind,id,raw)=>[...new Set([...(pack?.requirements?.[kind]?.[id]||[]),...requirementTokens(raw)])];",
'designer requirement helper');
  s=once(s,
"function moduleRecord(m){return {id:m.id,name:humanize(m.id),category:m.category,guiCategory:m.guiCategory,parent:m.parent,requirements:requirementTokens(m.raw),_module:m,source:'game-pack'};}",
"function moduleRecord(m,pack){return {id:m.id,name:humanize(m.id),category:m.category,guiCategory:m.guiCategory,parent:m.parent,requirements:mergedRequirements(pack,'modules',m.id,m.raw),_module:m,source:'game-pack'};}",
'module requirements');
  s=once(s,
"function chassisRecord(id,e,cls){const s=equipmentToState(e);return {id,name:humanize(id),class:cls,year:e.year,source:'game-pack',gameId:id,requirements:requirementTokens(e.raw),_equipment:e,...s};}",
"function chassisRecord(id,e,cls,pack){const s=equipmentToState(e);return {id,name:humanize(id),class:cls,year:e.year,source:'game-pack',gameId:id,requirements:mergedRequirements(pack,'equipment',id,e.raw),_equipment:e,...s};}",
'chassis requirements');
  s=once(s,
"function airframeRecord(id,e,size){const s=equipmentToState(e);return {id,name:humanize(id),size,year:e.year,source:'game-pack',gameId:id,requirements:requirementTokens(e.raw),_equipment:e,...s};}",
"function airframeRecord(id,e,size,pack){const s=equipmentToState(e);return {id,name:humanize(id),size,year:e.year,source:'game-pack',gameId:id,requirements:mergedRequirements(pack,'equipment',id,e.raw),_equipment:e,...s};}",
'airframe requirements');
  s=s.replace('out.chassis[id]=chassisRecord(id,e,cls);','out.chassis[id]=chassisRecord(id,e,cls,pack);');
  s=s.replace('out[bucket][m.id]=moduleRecord(m);','out[bucket][m.id]=moduleRecord(m,pack);');
  s=s.replace('out.airframes[id]=airframeRecord(id,e,size);','out.airframes[id]=airframeRecord(id,e,size,pack);');
  return s;
});

edit('src/tech.js',s=>once(s,
"const doctrine=applyLandDoctrineToData(b,s,profile.landDoctrine);",
"const doctrine=applyLandDoctrineToData(b,s,profile.landDoctrine,pack);",
'real doctrine pack'));

edit('src/mio.js',s=>{
  if(!s.startsWith("import { resolveMIOs } from './parser.js';"))s="import { resolveMIOs } from './parser.js';\n"+s;
  s=once(s,
"export function mioCatalog(pack){return {...BUILTIN_MIOS,...(pack?.mios||{})};}",
"const MIO_PACK_CACHE=new WeakMap();\nexport function mioCatalog(pack){\n  let imported=pack?.mios||{};\n  if(pack?.meta?.mioInheritance==='runtime'&&pack&&typeof pack==='object'){if(!MIO_PACK_CACHE.has(pack))MIO_PACK_CACHE.set(pack,resolveMIOs(imported));imported=MIO_PACK_CACHE.get(pack);}\n  return {...BUILTIN_MIOS,...imported};\n}",
'runtime MIO inheritance');
  return s;
});

edit('src/data.js',s=>{
  s=s.replace("appVersion: '0.14.2'","appVersion: '0.15.0'");
  s=s.replace("label: 'Vanilla 1.19.2 public-data baseline'","label: 'Vanilla 1.19.2 bundled game-data baseline'");
  s=s.replace("confidence: 'Analytical baseline — exact parity awaits imported game files'","confidence: 'Authoritative 1.19.2 game-file data with explicitly analytical executable-only behavior'");
  s=s.replace("updated: '2026-09-06'","updated: '2026-09-09'");
  return s;
});

edit('src/main.js',s=>{
  s=once(s,
"import { hydrateGameData, importedRegimentalSupportIds } from './gameData.js';",
"import { hydrateGameData, importedRegimentalSupportIds, prerequisiteText } from './gameData.js';",
'game-data requirement import');
  if(!s.includes("import BUILTIN_1192 from './builtin1192.js';")){
    const anchor="import { AIRFRAMES, AIR_ENGINES, AIR_WEAPONS, AIR_DEFENSE_MODULES, AIR_SPECIALS, defaultAirDesign, normalizeAirDesign, buildAirDesign, compareAirDesigns, compareBuiltAirDesigns, airMissionEfficiency, airMissionEfficiencyBuilt, configureAirDataPack, airDataStatus } from './air.js';";
    if(!s.includes(anchor))throw new Error('0.15 runtime pattern not found: builtin data import anchor');
    s=s.replace(anchor,anchor+"\nimport BUILTIN_1192 from './builtin1192.js';");
  }
  s=once(s,"let state=load();","let state=load();\nif(!state.dataPack)state.dataPack=BUILTIN_1192;",'bundled data default');
  s=once(s,
"function adjustedAirDesign(side,raw){const base=buildAirDesign(raw),family=base.size==='large'?'large_airframe':base.size==='medium'?'medium_airframe':'small_airframe',withMio=applyMioToVariant(base,mioEffectFor(side,family));return applyAirDoctrineToVariant(withMio,ensureTechState(side).airDoctrine);}",
"function adjustedAirDesign(side,raw){const base=buildAirDesign(raw),family=base.size==='large'?'large_airframe':base.size==='medium'?'medium_airframe':'small_airframe',withMio=applyMioToVariant(base,mioEffectFor(side,family));return applyAirDoctrineToVariant(withMio,ensureTechState(side).airDoctrine,state.dataPack);}",
'air doctrine pack');
  s=once(s,
"function save(){localStorage.setItem(STORAGE,JSON.stringify(state));}",
"function save(){const stored={...state,dataPack:state.dataPack?.meta?.bundled?null:state.dataPack};localStorage.setItem(STORAGE,JSON.stringify(stored));}",
'do not persist bundled pack');
  s=s.replace("afx=airDoctrineEffects(ensureTechState('attacker').airDoctrine,aBuilt),bfx=airDoctrineEffects(ensureTechState('defender').airDoctrine,bBuilt)","afx=airDoctrineEffects(ensureTechState('attacker').airDoctrine,aBuilt,state.dataPack),bfx=airDoctrineEffects(ensureTechState('defender').airDoctrine,bBuilt,state.dataPack)");
  if(!s.includes('function requirementBadge(record)')){
    const anchor="function pickerBattalionMeta(side,key){";
    if(!s.includes(anchor))throw new Error('0.15 runtime pattern not found: requirement badge anchor');
    s=s.replace(anchor,"function requirementBadge(record){const req=prerequisiteText(record);return req?`<em class=\"req-info\" title=\"${esc('Requirements (informational only): '+req)}\">ⓘ req</em>`:'';}\n"+anchor);
  }
  s=s.replace("<em>${fmt(ic,0)} IC</em></span>`;","<em>${fmt(ic,0)} IC</em>${requirementBadge(u)}</span>`;");
  s=s.replaceAll('tech-locked','tech-prereq');
  s=s.replaceAll(' · not researched',' · prerequisite (informational)');
  s=s.replaceAll(' · LOCKED',' · REQ');
  s=s.replace("  if(group!=='infantry')return `<button class=\"regimental-support locked\" disabled title=\"Built-in baseline only models leg weapon support for infantry-group regiments. Import 1.19 game data for additional compatibility rules.\"><span>◆</span><small>${group||'Unknown'} support locked</small></button>`;\n",'');
  s=s.replace("${BASE_REGIMENTAL_SUPPORTS.map(k=>{const unmet=!techAvailable('support',k,state[side+'Tech']);return", "${BASE_REGIMENTAL_SUPPORTS.filter(k=>regimentalBaselineCompatible(side,designerPick.c,k)).map(k=>{const unmet=!techAvailable('support',k,state[side+'Tech']);return");
  s=s.replace("${state.dataPack?'Imported game data active':'Built-in 1.19.2 baseline'}","${state.dataPack?.meta?.bundled?'Bundled vanilla 1.19.2 data active':'Custom imported game data active'}");
  s=s.replace("${MODEL_META.confidence}. ${state.dataPack?'Imported chassis, equipment and module records are active in the designers; executable-only aggregation/combat behavior remains explicitly analytical.':'Built-in tank/air module values are a fallback analytical baseline until a game-data pack is imported.'}","${MODEL_META.confidence}. ${state.dataPack?.meta?.bundled?'Bundled 1.19.2 units, equipment, modules, doctrines and defines are active.':'Custom imported game data is active.'} Research, DLC and special-project prerequisites are informational only; executable-only behavior remains explicitly analytical.");
  s=s.replace("production:{days:180,factories:30,efficiency:50,efficiencyGain:100,maxEfficiency:100,outputBonus:0,baseFactoryOutput:4.5,resources:","production:{days:180,factories:30,efficiency:10,efficiencyGain:100,maxEfficiency:50,outputBonus:0,baseFactoryOutput:3.5,resources:");
  return s;
});

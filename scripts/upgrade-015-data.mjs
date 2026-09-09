import fs from 'node:fs';
const path='src/main.js';
let s=fs.readFileSync(path,'utf8'),changes=0;
const replace=(from,to,label)=>{if(s.includes(to))return;if(!s.includes(from))throw new Error(`0.15 data migration pattern not found: ${label}`);s=s.replace(from,to);changes++;};

replace(
"import { buildDataPack, safeStructuralOverrides, defineOverrides, equipmentSnapshot } from './parser.js';",
"import { safeStructuralOverrides, defineOverrides, equipmentSnapshot } from './parser.js';\nimport { buildExtendedDataPack } from './gameDataParser.js';\nimport { hydrateGameData, importedRegimentalSupportIds } from './gameData.js';",
'extended parser imports');

replace(
"let state=load();\nconst BASE_REGIMENTAL_SUPPORTS=['regimental_infantry_guns','regimental_at','regimental_aa'];\nconst BASE_DIVISIONAL_SUPPORTS=Object.keys(supports).filter(k=>!BASE_REGIMENTAL_SUPPORTS.includes(k));\nconst LEGACY_REGIMENTAL_MAP={support_artillery:'regimental_infantry_guns',support_at:'regimental_at',support_aa:'regimental_aa'};",
"let state=load();\nconst LEGACY_REGIMENTAL_SUPPORTS=['regimental_infantry_guns','regimental_at','regimental_aa'];\nconst runtimeGameDataStatus=state.dataPack?hydrateGameData(state.dataPack,{battalions,supports,equipment,terrain},{year:state.dataSnapshotYear}):{equipment:0,battalions:0,supports:0,regimentalSupports:0,terrain:0};\nconst importedRegimentalSupports=state.dataPack?importedRegimentalSupportIds(supports):[];\nconst BASE_REGIMENTAL_SUPPORTS=importedRegimentalSupports.length?importedRegimentalSupports:LEGACY_REGIMENTAL_SUPPORTS;\nconst BASE_DIVISIONAL_SUPPORTS=Object.keys(supports).filter(k=>!BASE_REGIMENTAL_SUPPORTS.includes(k)&&!(state.dataPack&&LEGACY_REGIMENTAL_SUPPORTS.includes(k)));\nconst LEGACY_REGIMENTAL_MAP={support_artillery:'regimental_infantry_guns',support_at:'regimental_at',support_aa:'regimental_aa'};",
'game-data hydration before designer catalogs');

replace(
"function techData(side){const data=buildTechAdjustedData(battalions,supports,ensureTechState(side));ensureTankState();ensureMioState();for(const cls of ['light','medium','heavy']){const ids=tankClassIds(cls);data.battalions[ids.battalion]=applyTankDesignToBattalion(data.battalions[ids.battalion],state.tankDesigns[side][cls]);}return applyFamilyMioToData(data,side);}",
"function techData(side){const data=buildTechAdjustedData(battalions,supports,ensureTechState(side),{pack:state.dataPack,year:state.dataSnapshotYear});ensureTankState();ensureMioState();for(const cls of ['light','medium','heavy']){const ids=tankClassIds(cls);if(data.battalions[ids.battalion])data.battalions[ids.battalion]=applyTankDesignToBattalion(data.battalions[ids.battalion],state.tankDesigns[side][cls]);}return applyFamilyMioToData(data,side);}",
'imported equipment tier resolution');

replace(
"function validRegimentalSupports(side){ensureDesignerState(side);return state[side+'RegimentalSupports'].filter((key,c)=>key&&filledInRegiment(state[side+'Grid'],c)>=3&&regimentalBaselineCompatible(side,c));}",
"function validRegimentalSupports(side){ensureDesignerState(side);return state[side+'RegimentalSupports'].filter((key,c)=>key&&filledInRegiment(state[side+'Grid'],c)>=3&&regimentalBaselineCompatible(side,c,key));}",
'imported regimental compatibility');

replace(
"function regimentalBaselineCompatible(side,c){return regimentGroup(side,c)==='infantry';}",
"function regimentalBaselineCompatible(side,c,key=null){const group=regimentGroup(side,c);if(!key)return !!group;const required=supports[key]?.regimentGroup;if(required)return required==='any'||required===group;if(LEGACY_REGIMENTAL_SUPPORTS.includes(key))return group==='infantry';return true;}",
'regimental group rules');

replace(
"let dataPackStatus={battalionOverrides:0,supportOverrides:0,terrainOverrides:0,combatCount:0,productionCount:0};",
"let dataPackStatus={...runtimeGameDataStatus,battalionOverrides:0,supportOverrides:0,terrainOverrides:0,combatCount:0,productionCount:0};",
'runtime data status');

replace(
"dataPackStatus={...safeStructuralOverrides(state.dataPack,battalions,supports,terrain),...defineOverrides(state.dataPack,COMBAT_CONSTANTS,PRODUCTION_CONSTANTS)};",
"dataPackStatus={...runtimeGameDataStatus,...safeStructuralOverrides(state.dataPack,battalions,supports,terrain),...defineOverrides(state.dataPack,COMBAT_CONSTANTS,PRODUCTION_CONSTANTS)};",
'merged data status');

replace("const next=await buildDataPack(files);","const next=await buildExtendedDataPack(files);",'extended importer use');
replace(
"if($('dataSnapshotYear'))$('dataSnapshotYear').onchange=()=>{state.dataSnapshotYear=Math.max(1910,Math.floor(+$('dataSnapshotYear').value||1940));save();shell();};",
"if($('dataSnapshotYear'))$('dataSnapshotYear').onchange=()=>{state.dataSnapshotYear=Math.max(1910,Math.floor(+$('dataSnapshotYear').value||1940));save();location.reload();};",
'rehydrate on snapshot year change');

if(changes){fs.writeFileSync(path,s);console.log(`Applied ${changes} imported-data 0.15.0 migrations.`);}else console.log('0.15.0 imported-data migration already applied.');

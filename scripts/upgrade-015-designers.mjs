import fs from 'node:fs';
const path='src/main.js';let s=fs.readFileSync(path,'utf8'),changes=0;
const replace=(from,to,label)=>{if(s.includes(to))return;if(!s.includes(from))throw new Error(`0.15 designer migration pattern not found: ${label}`);s=s.replace(from,to);changes++;};
replace(
"import { TANK_CHASSIS, TANK_GUNS, TANK_TURRETS, TANK_SUSPENSIONS, TANK_ARMOR_TYPES, TANK_ENGINES, TANK_SPECIALS, defaultTankDesign, normalizeTankDesign, buildTankDesign, applyTankDesignToBattalion, tankEquipmentRecord, tankClassIds } from './tank.js';",
"import { TANK_CHASSIS, TANK_GUNS, TANK_TURRETS, TANK_SUSPENSIONS, TANK_ARMOR_TYPES, TANK_ENGINES, TANK_SPECIALS, defaultTankDesign, normalizeTankDesign, buildTankDesign, applyTankDesignToBattalion, tankEquipmentRecord, tankClassIds, configureTankDataPack, tankDataStatus } from './tank.js';",
'tank pack imports');
replace(
"import { AIRFRAMES, AIR_ENGINES, AIR_WEAPONS, AIR_DEFENSE_MODULES, AIR_SPECIALS, defaultAirDesign, normalizeAirDesign, buildAirDesign, compareAirDesigns, compareBuiltAirDesigns, airMissionEfficiency, airMissionEfficiencyBuilt } from './air.js';",
"import { AIRFRAMES, AIR_ENGINES, AIR_WEAPONS, AIR_DEFENSE_MODULES, AIR_SPECIALS, defaultAirDesign, normalizeAirDesign, buildAirDesign, compareAirDesigns, compareBuiltAirDesigns, airMissionEfficiency, airMissionEfficiencyBuilt, configureAirDataPack, airDataStatus } from './air.js';",
'air pack imports');
replace(
"const runtimeGameDataStatus=state.dataPack?hydrateGameData(state.dataPack,{battalions,supports,equipment,terrain},{year:state.dataSnapshotYear}):{equipment:0,battalions:0,supports:0,regimentalSupports:0,terrain:0};\nconst importedRegimentalSupports=state.dataPack?importedRegimentalSupportIds(supports):[];",
"const runtimeGameDataStatus=state.dataPack?hydrateGameData(state.dataPack,{battalions,supports,equipment,terrain},{year:state.dataSnapshotYear}):{equipment:0,battalions:0,supports:0,regimentalSupports:0,terrain:0};\nconst runtimeTankDataStatus=state.dataPack?configureTankDataPack(state.dataPack,state.dataSnapshotYear):{active:false};\nconst runtimeAirDataStatus=state.dataPack?configureAirDataPack(state.dataPack,state.dataSnapshotYear):{active:false};\nconst importedRegimentalSupports=state.dataPack?importedRegimentalSupportIds(supports):[];",
'configure designers from pack');
replace(
"const MIO_FAMILIES={infantry_equipment:'Infantry Equipment',artillery:'Artillery',anti_tank:'Anti-Tank',anti_air:'Anti-Air',light_tank:'Light Tanks',medium_tank:'Medium Tanks',heavy_tank:'Heavy Tanks',small_airframe:'Small Aircraft',medium_airframe:'Medium Aircraft'};",
"const MIO_FAMILIES={infantry_equipment:'Infantry Equipment',artillery:'Artillery',anti_tank:'Anti-Tank',anti_air:'Anti-Air',light_tank:'Light Tanks',medium_tank:'Medium Tanks',heavy_tank:'Heavy Tanks',small_airframe:'Small Aircraft',medium_airframe:'Medium Aircraft',large_airframe:'Large Aircraft'};",
'large airframe MIO family');
replace(
"function adjustedAirDesign(side,raw){const base=buildAirDesign(raw),family=base.size==='medium'?'medium_airframe':'small_airframe',withMio=applyMioToVariant(base,mioEffectFor(side,family));return applyAirDoctrineToVariant(withMio,ensureTechState(side).airDoctrine);}",
"function adjustedAirDesign(side,raw){const base=buildAirDesign(raw),family=base.size==='large'?'large_airframe':base.size==='medium'?'medium_airframe':'small_airframe',withMio=applyMioToVariant(base,mioEffectFor(side,family));return applyAirDoctrineToVariant(withMio,ensureTechState(side).airDoctrine);}",
'large airframe MIO routing');
replace(
"let dataPackStatus={...runtimeGameDataStatus,battalionOverrides:0,supportOverrides:0,terrainOverrides:0,combatCount:0,productionCount:0};",
"let dataPackStatus={...runtimeGameDataStatus,tank:runtimeTankDataStatus,air:runtimeAirDataStatus,battalionOverrides:0,supportOverrides:0,terrainOverrides:0,combatCount:0,productionCount:0};",
'designer data status');
replace(
"dataPackStatus={...runtimeGameDataStatus,...safeStructuralOverrides(state.dataPack,battalions,supports,terrain),...defineOverrides(state.dataPack,COMBAT_CONSTANTS,PRODUCTION_CONSTANTS)};",
"dataPackStatus={...runtimeGameDataStatus,tank:tankDataStatus(),air:airDataStatus(),...safeStructuralOverrides(state.dataPack,battalions,supports,terrain),...defineOverrides(state.dataPack,COMBAT_CONSTANTS,PRODUCTION_CONSTANTS)};",
'designer status after pack');
replace(
"function optionList(map,current,filter=()=>true){return Object.entries(map).filter(([,v])=>filter(v)).map(([k,v])=>`<option value=\"${k}\" ${k===current?'selected':''}>${esc(v.name)}</option>`).join('');}",
"function optionList(map,current,filter=()=>true){return Object.entries(map).filter(([,v])=>filter(v)).map(([k,v])=>{const req=Array.isArray(v.requirements)?v.requirements:[];return `<option value=\"${k}\" ${k===current?'selected':''} title=\"${esc(req.length?'Prerequisite: '+req.join(', '):'')}\">${esc(v.name)}${req.length?' ⓘ':''}</option>`;}).join('');}",
'module prerequisite tooltips');
replace(
"const side=key==='a'?'attacker':'defender',built=adjustedAirDesign(side,state.airLab[key]);bindInlineMio(side,built.size==='medium'?'medium_airframe':'small_airframe',`${prefix}-active`);bindAirDoctrine(side,prefix);",
"const side=key==='a'?'attacker':'defender',built=adjustedAirDesign(side,state.airLab[key]);bindInlineMio(side,built.size==='large'?'large_airframe':built.size==='medium'?'medium_airframe':'small_airframe',`${prefix}-active`);bindAirDoctrine(side,prefix);",
'air MIO binding');
replace(
"${d.overweight?`<p class=\"notice stop\"><b>Insufficient thrust.</b> ${fmt(d.thrust,1)} available / ${fmt(d.requiredThrust,1)} required. Agility, speed and reliability are penalized.</p>`:`<p class=\"notice good\"><b>Thrust margin:</b> ${fmt(d.thrust-d.requiredThrust,1)}.</p>`}",
"${d.overweight?`<p class=\"notice stop\"><b>Insufficient thrust.</b> ${fmt(d.thrust,1)} available / ${fmt(d.requiredThrust,1)} required.${d.source==='game-pack'?' The parsed design remains selectable for theorycrafting; no invented performance penalty is applied.':' Agility, speed and reliability are penalized by the fallback analytical model.'}</p>`:`<p class=\"notice good\"><b>Thrust margin:</b> ${fmt(d.thrust-d.requiredThrust,1)}.</p>`}",
'thrust messaging');
replace(
"${inlineMioPicker(side,d.size==='medium'?'medium_airframe':'small_airframe',`${prefix}-active`)}${renderAirDoctrine(side,prefix)}</section>`;",
"${inlineMioPicker(side,d.size==='large'?'large_airframe':d.size==='medium'?'medium_airframe':'small_airframe',`${prefix}-active`)}${renderAirDoctrine(side,prefix)}</section>`;",
'air MIO panel family');
replace(
"<p class=\"model-footnote\">${MODEL_META.confidence}. Tank and aircraft designers now feed explicit variants into the model; built-in module values remain an analytical baseline until exact game files are imported.</p>",
"<p class=\"model-footnote\">${MODEL_META.confidence}. ${state.dataPack?'Imported chassis, equipment and module records are active in the designers; executable-only aggregation/combat behavior remains explicitly analytical.':'Built-in tank/air module values are a fallback analytical baseline until a game-data pack is imported.'}</p>",
'designer source footnote');
if(changes){fs.writeFileSync(path,s);console.log(`Applied ${changes} designer 0.15.0 migrations.`);}else console.log('0.15.0 designer migration already applied.');

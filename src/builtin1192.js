import r01 from './builtin1192raw/r01.js';
import r02 from './builtin1192raw/r02.js';
import r03 from './builtin1192raw/r03.js';
import r04 from './builtin1192raw/r04.js';
import r05 from './builtin1192raw/r05.js';
import r06 from './builtin1192raw/r06.js';
import r07 from './builtin1192raw/r07.js';
import r08 from './builtin1192raw/r08.js';
import r09 from './builtin1192raw/r09.js';
import r10 from './builtin1192raw/r10.js';
import r11 from './builtin1192raw/r11.js';
import r12 from './builtin1192raw/r12.js';
import r13 from './builtin1192raw/r13.js';
import r14 from './builtin1192raw/r14.js';
import r15 from './builtin1192raw/r15.js';
import r16 from './builtin1192raw/r16.js';
import r17 from './builtin1192raw/r17.js';
import r18 from './builtin1192raw/r18.js';
import r19 from './builtin1192raw/r19.js';
import r20 from './builtin1192raw/r20.js';
import r21 from './builtin1192raw/r21.js';
import r22 from './builtin1192raw/r22.js';
import tankModulesA from './builtin1192/tank-modules-a.js';
import tankModulesB from './builtin1192/tank-modules-b.js';
import tankModuleRequirements from './builtin1192/tank-module-requirements.js';
import tankModuleCompatibility1192 from './builtin1192/tank-module-compatibility-1192.js';
import moduleSlotCategories1192 from './builtin1192/module-slot-categories-1192.js';
import duplicateArchetypes1192 from './builtin1192/duplicate-archetypes-tank-1192.js';
import airMissionTypeStats1192, { AIR_MISSION_SOURCE_1192 } from './builtin1192/air-mission-type-stats-1192.js';
import airDuplicateArchetypes1192, { AIR_DUPLICATE_SOURCE_1192 } from './builtin1192/duplicate-archetypes-air-1192.js';
import technologySource1192 from './builtin1192/technology-source-manifest-1192.js';
import doctrineSource1192 from './builtin1192/doctrine-source-manifest-1192.js';
import doctrineSourceSupplement1192 from './builtin1192/doctrine-source-supplement-1192.js';
import terrainTacticsModifiersCertification1192 from './builtin1192/terrain-tactics-modifiers-certification-1192.js';
import { SUBUNIT_TERRAIN_1192, SUBUNIT_TERRAIN_SOURCE_1192 } from './builtin1192/subunit-terrain-1192.js';
import { DEFINE_VALUES_1192 } from './builtin1192/defines-certification-1192.js';
import technologyGraphIndustry1192 from './builtin1192/technology-graph-industry-1192.js';
import technologyGraphSupport1192 from './builtin1192/technology-graph-support-1192.js';
import technologyGraphInfantry1192 from './builtin1192/technology-graph-infantry-1192.js';
import technologyGraphBbaAir1192 from './builtin1192/technology-graph-bba-air-1192.js';
import technologyGraphSpecialProjects1192 from './builtin1192/technology-graph-special-projects-1192.js';
import technologyEffects1192, { TECHNOLOGY_EFFECT_SOURCE_COUNTS_1192 } from './builtin1192/technology-effects-index-1192.js';
import landEquipment1192 from './builtin1192/land-equipment-1192.js';
import landCruiserCountLimits1192 from './builtin1192/land-cruiser-count-limits-1192.js';
import { materializeDuplicateArchetypes } from './parser.js';
import { extractTechnologies, normalizeTechnologyGraph, normalizeCombatTacticRecord, normalizeModifierDefinitionRecord } from './gameDataParser.js';

const text=[r01,r02,r03,r04,r05,r06,r07,r08,r09,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22].join('');
export const BUILTIN_1192_LOADER_MODE='plain-json-modules';
export const BUILTIN_1192=JSON.parse(text);
for(const [id,mods] of Object.entries(SUBUNIT_TERRAIN_1192))if(BUILTIN_1192.subUnits?.[id])BUILTIN_1192.subUnits[id].terrainModifiers=JSON.parse(JSON.stringify(mods));
BUILTIN_1192.defines=BUILTIN_1192.defines||{};
for(const [group,values] of Object.entries(DEFINE_VALUES_1192)){
  const target=BUILTIN_1192.defines[group]||(BUILTIN_1192.defines[group]={});
  // Overlay every planner-consumed game-file-exact value from the retained 1.19.2
  // common/defines source so stale compact values cannot survive.
  for(const [key,value] of Object.entries(values))target[key]=value;
}
BUILTIN_1192.meta={...(BUILTIN_1192.meta||{}),definesCertification:'game-file-exact-consumed-defines',plannerConsumedDefineCount:36,plannerAnalyticalDefineCount:0,definesSourceSha256:'405a24ce579815443cafe052cff1361e20c712ca8182e3f10ccbf45330dd4be4',subUnitTerrainCertification:'game-file-exact',subUnitTerrainRecordCount:SUBUNIT_TERRAIN_SOURCE_1192.recordCount,subUnitTerrainBlockCount:SUBUNIT_TERRAIN_SOURCE_1192.terrainBlockCount,subUnitTerrainSha256:SUBUNIT_TERRAIN_SOURCE_1192.canonicalSha256};
for(const [id,record] of Object.entries(BUILTIN_1192.combatTactics||{}))BUILTIN_1192.combatTactics[id]=normalizeCombatTacticRecord(id,record?.raw||{});
for(const [id,record] of Object.entries(BUILTIN_1192.modifiers||{}))BUILTIN_1192.modifiers[id]=normalizeModifierDefinitionRecord(id,record?.raw||{});
const bundledDoctrineMetadata={};
for(const [id,record] of Object.entries(BUILTIN_1192.doctrines||{}))if(record?.kind==='legacy'){bundledDoctrineMetadata[id]={...record,kind:'metadata'};delete BUILTIN_1192.doctrines[id];}
BUILTIN_1192.doctrineMetadata={...(BUILTIN_1192.doctrineMetadata||{}),...bundledDoctrineMetadata};
BUILTIN_1192.doctrines={...(BUILTIN_1192.doctrines||{}),...doctrineSourceSupplement1192};
const expectedDoctrineIds=Object.values(doctrineSource1192.files||{}).flatMap(source=>source.ids||[]).sort();
const actualDoctrineIds=Object.keys(BUILTIN_1192.doctrines||{}).sort();
if(expectedDoctrineIds.length!==doctrineSource1192.recordCount||actualDoctrineIds.length!==expectedDoctrineIds.length||actualDoctrineIds.some((id,i)=>id!==expectedDoctrineIds[i]))throw new Error(`HOI4 1.19.2 doctrine inventory mismatch: expected ${expectedDoctrineIds.length}, got ${actualDoctrineIds.length}`);

// The original bundled extended pack was generated before the technology census was audited. Re-normalize what survived compaction, then overlay exact source-derived graph/unlock slices and direct effects for planner-relevant technology files.
const bundledTechnologyRecordCount=Object.keys(BUILTIN_1192.technologies||{}).length;
const technologySourceFileById={};
for(const [sourceFile,source] of Object.entries(technologySource1192.files||{}))for(const id of source.ids||[])technologySourceFileById[id]=sourceFile;
const normalizedTechnologies={};
for(const [id,record] of Object.entries(BUILTIN_1192.technologies||{})){
  if(String(id).startsWith('@'))continue;
  const parsed=extractTechnologies({technologies:{[id]:record?.raw||{}}},technologySourceFileById[id]||'');
  if(parsed[id])normalizedTechnologies[id]=parsed[id];
}
normalizeTechnologyGraph(normalizedTechnologies);
const technologyGraph1192={...technologyGraphIndustry1192,...technologyGraphSupport1192,...technologyGraphInfantry1192,...technologyGraphBbaAir1192,...technologyGraphSpecialProjects1192};
for(const [id,sourceGraph] of Object.entries(technologyGraph1192)){
  const technology=normalizedTechnologies[id];
  if(!technology)throw new Error(`Missing bundled 1.19.2 technology ${id}`);
  for(const [key,value] of Object.entries(sourceGraph))technology[key]=structuredClone(value);
  technology.requirements={...(technology.requirements||{}),dependencies:Object.keys(technology.dependencies||{}),path:[...(technology.pathPrerequisites||[])],xor:[...(technology.xor||[])]};
}
for(const [id,effects] of Object.entries(technologyEffects1192)){
  const technology=normalizedTechnologies[id];
  if(!technology)throw new Error(`Technology effect source references missing 1.19.2 technology ${id}`);
  technology.directEffects=structuredClone(effects);
}
const expectedTechnologyIds=Object.values(technologySource1192.files||{}).flatMap(source=>source.ids||[]).sort();
const actualTechnologyIds=Object.keys(normalizedTechnologies).sort();
if(expectedTechnologyIds.length!==technologySource1192.recordCount||actualTechnologyIds.length!==expectedTechnologyIds.length||actualTechnologyIds.some((id,i)=>id!==expectedTechnologyIds[i]))throw new Error(`HOI4 1.19.2 technology inventory mismatch: expected ${expectedTechnologyIds.length}, got ${actualTechnologyIds.length}`);
BUILTIN_1192.technologies=normalizedTechnologies;

BUILTIN_1192.modules={...(BUILTIN_1192.modules||{}),...tankModulesA,...tankModulesB};
for(const [id,rule] of Object.entries(tankModuleCompatibility1192)){
  const module=BUILTIN_1192.modules?.[id];if(!module)continue;
  Object.assign(module,rule);
  module.raw={...(module.raw||{}),
    ...(rule.allowedModuleCategories?{allowed_module_categories:rule.allowedModuleCategories}:{}),
    ...(rule.forbidEquipmentTypeExactMatch?{forbid_equipment_type_exact_match:rule.forbidEquipmentTypeExactMatch}:{}),
    ...(rule.forbidEquipmentTypeExactMatchForCategory?{forbid_equipment_type_exact_match_for_category:rule.forbidEquipmentTypeExactMatchForCategory}:{}),
    ...(rule.forbidEquipmentType?{forbid_equipment_type:rule.forbidEquipmentType}:{})};
}
const reconCamera1192=BUILTIN_1192.modules?.recon_camera;
if(!reconCamera1192)throw new Error('Missing 1.19.2 Air module recon_camera');
reconCamera1192.forbidEquipmentTypeExactMatchForCategory={fighter_weapon:'scout_plane',cas_weapon:'scout_plane',nav_bomber_weapon:'scout_plane',tac_weapon:'scout_plane',mine_warfare_offense:'scout_plane'};
reconCamera1192.raw={...(reconCamera1192.raw||{}),forbid_equipment_type_exact_match_for_category:{...reconCamera1192.forbidEquipmentTypeExactMatchForCategory}};
BUILTIN_1192.equipment={...(BUILTIN_1192.equipment||{}),...landEquipment1192};
for(const id of ['small_plane_airframe_0','cv_small_plane_airframe_0','medium_plane_airframe_0','large_plane_airframe_0']){
  const equipment=BUILTIN_1192.equipment?.[id];
  if(!equipment)throw new Error(`Missing 1.19.2 Airframe ${id}`);
  equipment.moduleSlotsInherit=true;
  equipment.raw={...(equipment.raw||{}),module_slots:'inherit'};
}
BUILTIN_1192.duplicateArchetypes={...(BUILTIN_1192.duplicateArchetypes||{}),...duplicateArchetypes1192,...airDuplicateArchetypes1192};
materializeDuplicateArchetypes(BUILTIN_1192.equipment,BUILTIN_1192.duplicateArchetypes);
for(const id of ['land_cruiser_chassis','land_cruiser_chassis_1'])if(BUILTIN_1192.equipment?.[id])BUILTIN_1192.equipment[id].moduleCountLimits=landCruiserCountLimits1192.map(x=>({...x}));
for(const [id,slots] of Object.entries(moduleSlotCategories1192)){
  const equipment=BUILTIN_1192.equipment?.[id];
  if(!equipment)continue;
  for(const [slotId,categories] of Object.entries(slots)){
    const current=equipment.moduleSlots?.[slotId]||{};
    equipment.moduleSlots={...(equipment.moduleSlots||{}),[slotId]:{...current,allowed_module_categories:categories}};
    const rawSlots=equipment.raw?.module_slots||{};
    const rawCurrent=rawSlots?.[slotId]||{};
    equipment.raw={...(equipment.raw||{}),module_slots:{...rawSlots,[slotId]:{...rawCurrent,allowed_module_categories:categories}}};
  }
}
for(const [id,blocks] of Object.entries(airMissionTypeStats1192)){
  const module=BUILTIN_1192.modules?.[id];
  if(!module)throw new Error(`Missing Air source module ${id}`);
  module.missionTypeStats=blocks.map(block=>JSON.parse(JSON.stringify(block)));
}
for(const module of Object.values(BUILTIN_1192.modules||{}))if(!Array.isArray(module.missionTypeStats)&&module.raw?.mission_type_stats)module.missionTypeStats=[module.raw.mission_type_stats];
BUILTIN_1192.requirements=BUILTIN_1192.requirements||{};
BUILTIN_1192.requirements.modules={...(BUILTIN_1192.requirements.modules||{}),...tankModuleRequirements};
const requirementRelationships=Object.values(BUILTIN_1192.requirements).reduce((total,group)=>total+Object.values(group||{}).reduce((n,list)=>n+(Array.isArray(list)?list.length:0),0),0);
const materializedDuplicateEquipmentCount=Object.values(BUILTIN_1192.equipment||{}).filter(item=>item?.duplicateOf).length;
const equipmentCount=Object.keys(BUILTIN_1192.equipment||{}).length;
const staticEquipmentCount=equipmentCount-materializedDuplicateEquipmentCount;
BUILTIN_1192.meta={...(BUILTIN_1192.meta||{}),moduleCount:Object.keys(BUILTIN_1192.modules).length,equipmentCount,staticEquipmentCount,materializedDuplicateEquipmentCount,requirementIndex:true,requirementRecords:requirementRelationships,repeatedBlockParserFix:true,moduleSlotListsCertified:true,tankModuleCompatibilityCertified:true,duplicateArchetypeCount:Object.keys(BUILTIN_1192.duplicateArchetypes).length,landEquipmentSupplementCount:Object.keys(landEquipment1192).length,landCruiserCountLimitsCertified:true,airMissionStatBlocksCertified:true,airMissionStatModuleCount:AIR_MISSION_SOURCE_1192.missionModuleCount,airMissionStatBlockCount:AIR_MISSION_SOURCE_1192.missionBlockCount,airMissionSourceSha256:AIR_MISSION_SOURCE_1192.sha256,airDuplicateArchetypesCertified:true,airDuplicateArchetypeCount:AIR_DUPLICATE_SOURCE_1192.duplicateArchetypeCount,airDuplicateSourceSha256:AIR_DUPLICATE_SOURCE_1192.sha256,airFrameInheritanceCertified:true,technologyCount:actualTechnologyIds.length,technologySourceFileCount:technologySource1192.fileCount,technologySourceRecordCount:technologySource1192.recordCount,technologyScriptVariableRecordsRemoved:bundledTechnologyRecordCount-actualTechnologyIds.length,technologySourceInventoryCertified:true,technologyGraphNormalized:true,technologyGraphSourceRestoredCount:Object.keys(technologyGraph1192).length,technologyEffectSourceRestoredCount:Object.keys(technologyEffects1192).length,technologyEffectSourceCounts:{...TECHNOLOGY_EFFECT_SOURCE_COUNTS_1192}};
BUILTIN_1192.meta={...(BUILTIN_1192.meta||{}),doctrineCount:actualDoctrineIds.length,doctrineMetadataCount:Object.keys(BUILTIN_1192.doctrineMetadata||{}).length,doctrineNodeCatalogSeparated:true,doctrineSourceFileCount:doctrineSource1192.fileCount,doctrineSourceRecordCount:doctrineSource1192.recordCount,doctrineSourceInventoryCertified:true};
BUILTIN_1192.meta={...(BUILTIN_1192.meta||{}),terrainTacticsModifiersAudit:'bounded-source-certified',terrainSourceFileCount:terrainTacticsModifiersCertification1192.terrain.sourceFiles,terrainSourceRecordCount:terrainTacticsModifiersCertification1192.terrain.recordCount,terrainConsumedFieldSha256:terrainTacticsModifiersCertification1192.terrain.consumedFieldSha256,terrainFullRawSourceRetained:false,tacticSourceRecordCount:terrainTacticsModifiersCertification1192.tactics.recordCount,tacticRawSourceRecordCount:terrainTacticsModifiersCertification1192.tactics.rawRecordCount,tacticRawSha256:terrainTacticsModifiersCertification1192.tactics.rawSha256,tacticRuntimeClassification:'deferred-combat-formula',modifierDefinitionSourceRecordCount:terrainTacticsModifiersCertification1192.modifierDefinitions.recordCount,modifierDefinitionRawSha256:terrainTacticsModifiersCertification1192.modifierDefinitions.rawSha256,modifierDefinitionRuntimeClassification:'not-applicable-to-current-land-combat',subUnitTerrainRuntimeClassification:'source-preserved-formula-deferred'};
export default BUILTIN_1192;
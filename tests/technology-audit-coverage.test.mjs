import assert from 'node:assert/strict';
import builtin1192 from '../src/builtin1192.js';
import source1192 from '../src/builtin1192/technology-source-manifest-1192.js';
import { TECHNOLOGY_EFFECT_SOURCES_1192 } from '../src/builtin1192/technology-effects-index-1192.js';
import graphIndustry from '../src/builtin1192/technology-graph-industry-1192.js';
import graphSupport from '../src/builtin1192/technology-graph-support-1192.js';
import graphInfantry from '../src/builtin1192/technology-graph-infantry-1192.js';
import graphBbaAir from '../src/builtin1192/technology-graph-bba-air-1192.js';
import graphSpecialProjects from '../src/builtin1192/technology-graph-special-projects-1192.js';
import { battalions as baseBattalions, supports as baseSupports, equipment as baseEquipment, terrain as baseTerrain } from '../src/data.js';
import { hydrateGameData } from '../src/gameData.js';
import { DEFAULT_TECH_PROFILE, buildTechAdjustedData } from '../src/tech.js';

const DIRECT_UNIT_FACTOR_FIELDS=new Set(['soft_attack','hard_attack','defence','defense','breakthrough','air_attack','ap_attack','armor_value','hardness','supply_consumption_factor']);
const DIRECT_UNIT_ADDITIVE_FIELDS=new Set(['combat_width','max_strength','max_organisation','supply_consumption']);
const TERRAIN_KEYS=new Set(Object.keys(builtin1192.terrain||{}));
const counts=()=>({});
const inc=(obj,key,n=1)=>{obj[key]=(obj[key]||0)+n;};
const fieldCounts=counts(),targetKinds=counts(),deferredUnitFields=counts(),terrainFields=counts(),globalFields=counts();
let targetEntries=0,directFieldOccurrences=0,supportedCoreFieldOccurrences=0,terrainBlocks=0,battalionMultBlocks=0;
const byGroup={};

for(const [group,records] of Object.entries(TECHNOLOGY_EFFECT_SOURCES_1192)){
  const g=byGroup[group]={records:Object.keys(records).length,targetEntries:0,supportedCoreFields:0,deferredUnitFields:0,terrainBlocks:0,battalionMultBlocks:0,globalFields:0};
  for(const effects of Object.values(records))for(const [target,value] of Object.entries(effects||{})){
    targetEntries++;g.targetEntries++;
    if(value===null||typeof value!=='object'||Array.isArray(value)){
      inc(targetKinds,'global-scalar');inc(globalFields,target);g.globalFields++;continue;
    }
    let kind='other-object';
    if(target==='enable_building')kind='global-structure';
    else if(builtin1192.subUnits?.[target])kind='subunit';
    else if(String(target).startsWith('category_'))kind='category';
    else if(builtin1192.equipment?.[target])kind='equipment';
    inc(targetKinds,kind);
    if(kind==='global-structure'){
      inc(globalFields,target);g.globalFields++;continue;
    }
    if(kind==='equipment'){
      for(const [field,v] of Object.entries(value)){
        if(v!==null&&typeof v==='object'&&!Array.isArray(v)){inc(deferredUnitFields,`equipment.${field}`);g.deferredUnitFields++;}
        else {inc(deferredUnitFields,`equipment.${field}`);g.deferredUnitFields++;directFieldOccurrences++;}
      }
      continue;
    }
    if(kind==='other-object'){
      for(const [field,v] of Object.entries(value)){
        if(v!==null&&typeof v==='object'&&!Array.isArray(v)){inc(deferredUnitFields,`other.${field}`);g.deferredUnitFields++;}
        else {inc(deferredUnitFields,`other.${field}`);g.deferredUnitFields++;directFieldOccurrences++;}
      }
      continue;
    }
    for(const [field,v] of Object.entries(value)){
      if(field==='battalion_mult'&&v&&typeof v==='object'){
        battalionMultBlocks++;g.battalionMultBlocks++;inc(deferredUnitFields,'battalion_mult');continue;
      }
      if((TERRAIN_KEYS.has(field)||['fort','river'].includes(field))&&v&&typeof v==='object'){
        terrainBlocks++;g.terrainBlocks++;
        for(const terrainField of Object.keys(v))inc(terrainFields,terrainField);
        continue;
      }
      if(v!==null&&typeof v==='object'&&!Array.isArray(v)){
        inc(deferredUnitFields,`nested.${field}`);g.deferredUnitFields++;continue;
      }
      directFieldOccurrences++;inc(fieldCounts,field);
      if(DIRECT_UNIT_FACTOR_FIELDS.has(field)||DIRECT_UNIT_ADDITIVE_FIELDS.has(field)){supportedCoreFieldOccurrences++;g.supportedCoreFields++;}
      else {inc(deferredUnitFields,field);g.deferredUnitFields++;}
    }
  }
}

const graphGroups={industry:graphIndustry,support:graphSupport,infantry:graphInfantry,bbaAir:graphBbaAir,specialProjects:graphSpecialProjects};
const graphOverlayCounts=Object.fromEntries(Object.entries(graphGroups).map(([k,v])=>[k,Object.keys(v).length]));
const graphOverlayTotal=Object.values(graphOverlayCounts).reduce((a,b)=>a+b,0);

const battalions=structuredClone(baseBattalions),supports=structuredClone(baseSupports),equipment=structuredClone(baseEquipment),terrain=structuredClone(baseTerrain);
hydrateGameData(builtin1192,{battalions,supports,equipment,terrain},{year:1940});
const allEffectTechIds=Object.keys(Object.assign({},...Object.values(TECHNOLOGY_EFFECT_SOURCES_1192)));
const runtime=buildTechAdjustedData(battalions,supports,{...DEFAULT_TECH_PROFILE,technologies:allEffectTechIds},{pack:builtin1192,year:1940}).technologyEffects;

const summary={
  sourceFiles:source1192.fileCount,
  sourceRecords:source1192.recordCount,
  exactGraphOverlayRecords:graphOverlayTotal,
  graphOverlayCounts,
  exactDirectEffectRecords:allEffectTechIds.length,
  effectSourceCounts:builtin1192.meta.technologyEffectSourceCounts,
  targetEntries,
  targetKinds,
  directFieldOccurrences,
  supportedCoreFieldOccurrences,
  terrainBlocks,
  terrainFields,
  battalionMultBlocks,
  directFields:fieldCounts,
  deferredUnitFields,
  globalFields,
  runtimeAppliedTechnologies:runtime.appliedTechnologies.length,
  runtimeAppliedModifierCount:runtime.appliedModifierCount,
  runtimeUnknownTechnologies:runtime.unknownTechnologies.length,
  byGroup
};

assert.equal(source1192.fileCount,13);
assert.equal(source1192.recordCount,552);
assert.equal(graphOverlayTotal,226);
assert.deepEqual(graphOverlayCounts,{industry:43,support:45,infantry:89,bbaAir:43,specialProjects:6});
assert.equal(allEffectTechIds.length,208);
assert.deepEqual(builtin1192.meta.technologyEffectSourceCounts,{armor:3,artillery:32,bbaAir:4,electronics:33,industry:39,infantry:61,nsbArmor:5,specialProjects:5,support:26});
assert.equal(targetEntries,505);
assert.equal(directFieldOccurrences,345);
assert.equal(supportedCoreFieldOccurrences,257,'all source-derived direct fields that map to current planner core land stats must be classified as supported');
assert.equal(terrainBlocks,161,'terrain-specific technology effects remain assigned to the terrain/combat formula audit');
assert.equal(battalionMultBlocks,12,'battalion_mult technology effects remain assigned to aggregation formula audit');
assert.equal(graphOverlayTotal,builtin1192.meta.technologyGraphSourceRestoredCount);
assert.equal(runtime.unknownTechnologies.length,0);
assert.ok(runtime.appliedTechnologies.length>=60,'expanded core mappings must not reduce executable technology coverage');
assert.ok(runtime.appliedModifierCount>=183,'expanded core mappings must not reduce applied core modifiers');
console.log('TECHNOLOGY_AUDIT_COVERAGE',JSON.stringify(summary));
console.log('Technology audit bounded coverage certification passed.');

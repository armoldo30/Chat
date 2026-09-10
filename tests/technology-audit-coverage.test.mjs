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

const DIRECT_UNIT_FACTOR_FIELDS=new Set(['soft_attack','hard_attack','defence','defense','breakthrough','air_attack','supply_consumption_factor']);
const TERRAIN_KEYS=new Set(Object.keys(builtin1192.terrain||{}));
const counts=()=>({});
const inc=(obj,key,n=1)=>{obj[key]=(obj[key]||0)+n;};
const fieldCounts=counts(),targetKinds=counts(),deferredUnitFields=counts(),terrainFields=counts(),globalFields=counts();
let targetEntries=0,directFieldOccurrences=0,supportedUnitFieldOccurrences=0,terrainBlocks=0,battalionMultBlocks=0;
const byGroup={};

for(const [group,records] of Object.entries(TECHNOLOGY_EFFECT_SOURCES_1192)){
  const g=byGroup[group]={records:Object.keys(records).length,targetEntries:0,supportedUnitFields:0,deferredUnitFields:0,terrainBlocks:0,battalionMultBlocks:0,globalFields:0};
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
      if(DIRECT_UNIT_FACTOR_FIELDS.has(field)){supportedUnitFieldOccurrences++;g.supportedUnitFields++;}
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
  supportedUnitFieldOccurrences,
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
assert.equal(allEffectTechIds.length,208);
assert.equal(graphOverlayTotal,builtin1192.meta.technologyGraphSourceRestoredCount);
assert.equal(runtime.unknownTechnologies.length,0);
assert.ok(runtime.appliedTechnologies.length>0);
assert.ok(targetEntries>0&&directFieldOccurrences>0);
console.log('TECHNOLOGY_AUDIT_COVERAGE',JSON.stringify(summary));
console.log('Technology audit coverage measurement passed.');

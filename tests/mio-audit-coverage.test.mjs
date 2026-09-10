import assert from 'node:assert/strict';
import pack from '../src/builtin1192.js';
import { mioCatalog } from '../src/mio.js';
import { MIO_SOURCE_1192 } from '../src/builtin1192/mio-source-manifest-1192.js';
import corrections, { MIO_SOURCE_CORRECTION_STATS_1192 } from '../src/builtin1192/mio-source-corrections-1192.js';
import groups, { MIO_EQUIPMENT_GROUPS_SOURCE_1192 } from '../src/builtin1192/mio-equipment-groups-1192.js';
import policies, { MIO_POLICY_SOURCE_1192 } from '../src/builtin1192/mio-policy-source-1192.js';

const bundledOrgs=Object.values(pack.mios||{}),bundledTraits=bundledOrgs.flatMap(org=>Object.values(org?.traits||{}));
const catalog=mioCatalog(pack);
const correctedTraitCount=MIO_SOURCE_CORRECTION_STATS_1192.traitCount;
const removedTraitCount=MIO_SOURCE_CORRECTION_STATS_1192.removeTraitCount;
console.log('MIO bundled diagnostic',JSON.stringify({bundledOrganizations:bundledOrgs.length,runtimeOrganizations:Object.keys(catalog).length,mioInheritance:pack.meta?.mioInheritance,orgsWithRaw:bundledOrgs.filter(x=>x?.raw).length,traits:bundledTraits.length,traitsWithRaw:bundledTraits.filter(x=>x?.raw).length,includeCount:bundledOrgs.filter(x=>x?.include).length}));

assert.equal(MIO_SOURCE_1192.gameVersion,'1.19.2');
assert.equal(MIO_SOURCE_1192.fileCount,55,'organization source file census');
assert.equal(MIO_SOURCE_1192.recordCount,552,'organization source record census');
assert.equal(MIO_SOURCE_1192.sourceVariableCount,51,'file-local MIO constants');
assert.equal(MIO_EQUIPMENT_GROUPS_SOURCE_1192.groupCount,24,'MIO equipment groups');
assert.equal(Object.keys(groups).length,24,'bundled MIO equipment-group corpus');
assert.equal(Object.keys(MIO_POLICY_SOURCE_1192).length,22,'MIO policy source census');
assert.equal(Object.keys(policies).length,22,'bundled MIO policy corpus');
assert.equal(MIO_SOURCE_CORRECTION_STATS_1192.chunkCount,5,'all source correction chunks must be merged');
assert.equal(correctedTraitCount,235,'all source-corrected trait definitions must survive chunk merging');
assert.equal(removedTraitCount,9,'all source remove_trait relationships must survive chunk merging');

let verifiedTraits=0,verifiedRemovals=0,missingOrganizations=0;
for(const [id,patch] of Object.entries(corrections)){
  const org=catalog[id];
  if(!org){missingOrganizations++;continue;}
  if(Object.prototype.hasOwnProperty.call(patch,'staticDisabled'))assert.equal(org.staticDisabled,patch.staticDisabled,`${id} static-disabled source flag`);
  if(Object.prototype.hasOwnProperty.call(patch,'countries'))assert.deepEqual(org.countries,patch.countries,`${id} source countries`);
  for(const [traitId,sourceTrait] of Object.entries(patch.traits||{})){
    const trait=org.traits?.[traitId];assert.ok(trait,`${id}.${traitId} source-corrected trait must exist`);
    for(const key of ['equipmentBonus','productionBonus','organizationModifier','parents','allParents','parentTraits','mutuallyExclusive','equipmentTypes','parentCount'])if(Object.prototype.hasOwnProperty.call(sourceTrait,key))assert.deepEqual(trait[key],sourceTrait[key],`${id}.${traitId}.${key}`);
    verifiedTraits++;
  }
  for(const traitId of patch.removeTraits||[]){assert.equal(org.traits?.[traitId],undefined,`${id}.${traitId} source remove_trait must be applied`);verifiedRemovals++;}
}
assert.equal(missingOrganizations,0,'every source correction must target a runtime MIO record');
assert.equal(verifiedTraits,235,'runtime must retain every source-corrected trait');
assert.equal(verifiedRemovals,9,'runtime must apply every source remove_trait');

console.log('MIO correction coverage',JSON.stringify({...MIO_SOURCE_CORRECTION_STATS_1192,verifiedTraits,verifiedRemovals,missingOrganizations}));
console.log('MIO audit source/runtime correction certification passed');

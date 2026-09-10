import assert from 'node:assert/strict';
import { MIO_SOURCE_1192 } from '../src/builtin1192/mio-source-manifest-1192.js';
import c1 from '../src/builtin1192/mio-corrections-1192-01.js';
import c2 from '../src/builtin1192/mio-corrections-1192-02.js';
import c3 from '../src/builtin1192/mio-corrections-1192-03.js';
import c4 from '../src/builtin1192/mio-corrections-1192-04.js';
import c5 from '../src/builtin1192/mio-corrections-1192-05.js';
import groups, { MIO_EQUIPMENT_GROUPS_SOURCE_1192 } from '../src/builtin1192/mio-equipment-groups-1192.js';
import policies, { MIO_POLICY_SOURCE_1192 } from '../src/builtin1192/mio-policy-source-1192.js';

const corrections={...c1,...c2,...c3,...c4,...c5};
const correctedTraitCount=Object.values(corrections).reduce((n,org)=>n+Object.keys(org?.traits||{}).length,0);
const removedTraitCount=Object.values(corrections).reduce((n,org)=>n+(org?.removeTraits||[]).length,0);
const staticDisabledCount=Object.values(corrections).filter(org=>org?.staticDisabled).length;
const initialRestrictionCount=Object.values(corrections).filter(org=>org?.initial?.equipmentTypes?.length).length;
const traitRestrictionCount=Object.values(corrections).reduce((n,org)=>n+Object.values(org?.traits||{}).filter(t=>t?.equipmentTypes?.length).length,0);

assert.equal(MIO_SOURCE_1192.gameVersion,'1.19.2');
assert.equal(MIO_SOURCE_1192.fileCount,55,'organization source file census');
assert.equal(MIO_SOURCE_1192.recordCount,552,'organization source record census');
assert.equal(MIO_SOURCE_1192.sourceVariableCount,51,'file-local MIO constants');
assert.equal(MIO_EQUIPMENT_GROUPS_SOURCE_1192.groupCount,24,'MIO equipment groups');
assert.equal(Object.keys(groups).length,24,'bundled MIO equipment-group corpus');
assert.equal(MIO_POLICY_SOURCE_1192.policyCount,22,'MIO policy source census');
assert.equal(Object.keys(policies).length,22,'bundled MIO policy corpus');

console.log('MIO correction coverage',JSON.stringify({
  correctedOrganizations:Object.keys(corrections).length,
  correctedTraitCount,
  removedTraitCount,
  staticDisabledCount,
  initialRestrictionCount,
  traitRestrictionCount
}));
assert.equal(correctedTraitCount,235,'all source-corrected trait definitions must be present');
assert.equal(removedTraitCount,9,'all source remove_trait relationships must be present');
console.log('MIO audit coverage tests passed');

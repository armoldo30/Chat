import BUILTIN_1192 from './builtin1192.js';
import landSubUnitsA from './builtin1193/land-subunits-a.js';
import landSubUnitsB from './builtin1193/land-subunits-b.js';
import landSubUnitsC from './builtin1193/land-subunits-c.js';
import landSubUnitsD from './builtin1193/land-subunits-d.js';
import landEquipment1193 from './builtin1193/land-equipment.js';
import tankModules1193 from './builtin1193/tank-modules.js';
import doctrines01 from './builtin1193/doctrines-changed-1193-01.js';
import doctrines02 from './builtin1193/doctrines-changed-1193-02.js';
import doctrines03 from './builtin1193/doctrines-changed-1193-03.js';
import doctrines04 from './builtin1193/doctrines-changed-1193-04.js';
import doctrines05 from './builtin1193/doctrines-changed-1193-05.js';
import doctrines06 from './builtin1193/doctrines-changed-1193-06.js';
import doctrines07 from './builtin1193/doctrines-changed-1193-07.js';
import doctrines08 from './builtin1193/doctrines-changed-1193-08.js';
import mios01 from './builtin1193/mio-source-1193-01.js';
import mios02 from './builtin1193/mio-source-1193-02.js';
import mios03 from './builtin1193/mio-source-1193-03.js';
import mios04 from './builtin1193/mio-source-1193-04.js';
import mios05 from './builtin1193/mio-source-1193-05.js';
import mios06 from './builtin1193/mio-source-1193-06.js';
import technologyEffects01 from './builtin1193/technology-effects-exact-1193-01.js';
import technologyEffects02 from './builtin1193/technology-effects-exact-1193-02.js';
import technologyEffects03 from './builtin1193/technology-effects-exact-1193-03.js';
import SOURCE_CERTIFICATION_1193 from './builtin1193/source-certification-1193.js';
import { resolveMIOs } from './parser.js';

const clone=value=>structuredClone(value);
const overlay=(target,...sources)=>{for(const source of sources)for(const [id,record] of Object.entries(source||{}))target[id]=clone(record);return target;};

export const BUILTIN_1193=clone(BUILTIN_1192);

// Only source domains changed by the supplied 1.19.3 install are replaced here.
// Unchanged 1.19.2 records are retained because their normalized source content was
// audited as identical; executable-only behavior remains separately classified.
BUILTIN_1193.subUnits=overlay(BUILTIN_1193.subUnits||{},landSubUnitsA,landSubUnitsB,landSubUnitsC,landSubUnitsD);
BUILTIN_1193.equipment=overlay(BUILTIN_1193.equipment||{},landEquipment1193);
BUILTIN_1193.modules=overlay(BUILTIN_1193.modules||{},tankModules1193);
BUILTIN_1193.doctrines=overlay(BUILTIN_1193.doctrines||{},doctrines01,doctrines02,doctrines03,doctrines04,doctrines05,doctrines06,doctrines07,doctrines08);

// Changed organization source records are intentionally kept unresolved in the
// overlay files. Resolve inheritance after merging them with the unchanged generic
// organizations so includes, overrides, and remove_trait semantics are preserved.
const changedMios={...mios01,...mios02,...mios03,...mios04,...mios05,...mios06};
BUILTIN_1193.mios=resolveMIOs({...BUILTIN_1193.mios,...clone(changedMios)});

// The four changed technology files are replaced at the direct-effect boundary.
// Technology inventory/graph metadata remains sourced from the certified base where
// structure is unchanged; effects below come directly from the supplied 1.19.3 files.
const technologyEffects1193={...technologyEffects01,...technologyEffects02,...technologyEffects03};
for(const [id,effects] of Object.entries(technologyEffects1193)){
  const technology=BUILTIN_1193.technologies?.[id];
  if(!technology)throw new Error(`HOI4 1.19.3 technology effect references missing technology ${id}`);
  technology.directEffects=clone(effects);
}

const expected=SOURCE_CERTIFICATION_1193.counts;
const actual={
  subUnits:Object.keys(BUILTIN_1193.subUnits||{}).length,
  equipment:Object.keys(BUILTIN_1193.equipment||{}).length,
  modules:Object.keys(BUILTIN_1193.modules||{}).length,
  technologies:Object.keys(BUILTIN_1193.technologies||{}).length,
  doctrines:Object.keys(BUILTIN_1193.doctrines||{}).length,
  mios:Object.keys(BUILTIN_1193.mios||{}).length
};
// Source certification counts describe the complete game-file census. The bundled
// runtime intentionally keeps the planner-scope sub-unit/equipment subset plus
// materialized equipment variants, so only full-domain inventories are compared
// one-for-one here.
for(const key of ['modules','technologies','doctrines']){
  if(actual[key]!==expected[key])throw new Error(`HOI4 1.19.3 inventory mismatch for ${key}: expected ${expected[key]}, got ${actual[key]}`);
}
if(actual.mios<400)throw new Error(`HOI4 1.19.3 compact MIO inventory unexpectedly shrank: got ${actual.mios}`);
if(actual.subUnits<121)throw new Error(`HOI4 1.19.3 planner sub-unit inventory unexpectedly shrank: got ${actual.subUnits}`);
if(actual.equipment<305)throw new Error(`HOI4 1.19.3 runtime equipment inventory unexpectedly shrank: got ${actual.equipment}`);
const staticEquipmentCount=Number(BUILTIN_1193.meta?.staticEquipmentCount)||actual.equipment-Number(BUILTIN_1193.meta?.materializedDuplicateEquipmentCount||0);

BUILTIN_1193.meta={
  ...(BUILTIN_1193.meta||{}),
  gameVersion:'1.19.3',
  gameBuild:SOURCE_CERTIFICATION_1193.gameBuild,
  checksum:SOURCE_CERTIFICATION_1193.checksum,
  sourceCertification:'game-file-exact-1.19.3',
  definesCertification:'game-file-exact-consumed-defines-1.19.3',
  definesSourceSha256:'881b4076a41355fd67771064770338791fc7076bff1038c6271bb0dd0b717ac6',
  sourceCertification1193:clone(SOURCE_CERTIFICATION_1193),
  sourceArchiveCommonSha256:SOURCE_CERTIFICATION_1193.sourceArchives.commonZipSha256,
  sourceArchiveLocalizationSha256:SOURCE_CERTIFICATION_1193.sourceArchives.localizationZipSha256,
  subUnitCount:actual.subUnits,
  rawSourceSubUnitCount:expected.subUnits,
  equipmentCount:actual.equipment,
  staticEquipmentCount,
  rawSourceEquipmentCount:expected.equipment,
  moduleCount:actual.modules,
  technologyCount:actual.technologies,
  doctrineCount:actual.doctrines,
  mioCount:actual.mios,
  rawSourceMioDeclarationCount:expected.mios,
  changedTechnologyDirectEffectCount:Object.keys(technologyEffects1193).length,
  changedDoctrineRecordCount:Object.keys({...doctrines01,...doctrines02,...doctrines03,...doctrines04,...doctrines05,...doctrines06,...doctrines07,...doctrines08}).length,
  changedMioRecordCount:Object.keys(changedMios).length,
  executableValidation:'pending-1.19.3-oracle',
  executableEvidenceBase:'1.19.2-executable-inferred'
};

export default BUILTIN_1193;

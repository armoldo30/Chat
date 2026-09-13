import assert from 'node:assert/strict';
import BUILTIN_1192 from '../src/builtin1192.js';
import {
  BUILTIN_ENGLISH_LOCALIZATION_1192,
  BUILTIN_ENGLISH_LOCALIZATION_1192_META,
  BUILTIN_ENGLISH_LOCALIZATION_1192_SOURCE_KEYS
} from '../src/builtin1192/localization-english-1192.js';
import {
  LOCALIZATION_STORAGE_KEY,
  bootstrapDisplayLocalization,
  combinedDisplayLocalization
} from '../src/ui-localization-bootstrap.js';
import { getDisplayLocalization, setDisplayLocalization } from '../src/ui-labels.js';
import { sourceDisplayLabel, sourceLocalizedValue } from '../src/source-display-label.js';
import { tankCatalogFromPack, airCatalogFromPack } from '../src/designerData.js';
import { mioCatalog } from '../src/mio.js';

assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192_META.gameVersion,'1.19.2');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192_META.language,'english');
assert.equal(Object.keys(BUILTIN_ENGLISH_LOCALIZATION_1192).length,BUILTIN_ENGLISH_LOCALIZATION_1192_META.resolvedCount);
assert.equal(Object.keys(BUILTIN_ENGLISH_LOCALIZATION_1192_SOURCE_KEYS).length,BUILTIN_ENGLISH_LOCALIZATION_1192_META.resolvedCount);
if(BUILTIN_ENGLISH_LOCALIZATION_1192_META.generated){
  assert.ok(BUILTIN_ENGLISH_LOCALIZATION_1192_META.sourceFileCount>0,'generated catalog must retain source-file provenance');
  assert.match(BUILTIN_ENGLISH_LOCALIZATION_1192_META.sourceDigestSha256,/^[a-f0-9]{64}$/,'generated catalog must retain a corpus SHA-256');
}

const custom={__localization_bootstrap_probe__:'Custom Browser Label'};
assert.equal(combinedDisplayLocalization(custom).__localization_bootstrap_probe__,'Custom Browser Label');

const fakeStorage={
  getItem(key){return key===LOCALIZATION_STORAGE_KEY?JSON.stringify(custom):null;}
};
setDisplayLocalization({});
const bootstrapped=bootstrapDisplayLocalization(fakeStorage);
assert.equal(bootstrapped.__localization_bootstrap_probe__,'Custom Browser Label');
assert.equal(getDisplayLocalization().__localization_bootstrap_probe__,'Custom Browser Label');

setDisplayLocalization({source_unit_key:'Exact In-Game Unit Name'});
assert.equal(sourceLocalizedValue('source_unit_key'),'Exact In-Game Unit Name');
assert.equal(sourceDisplayLabel('source_unit_key','', 'Old Planner Name'),'Exact In-Game Unit Name','verified localization must beat readable planner fallback text');
assert.equal(sourceDisplayLabel('missing_source_key','', 'Existing Planner Fallback'),'Existing Planner Fallback','missing localization must preserve the existing readable fallback');

setDisplayLocalization({GER_porsche_tank:'Exact Porsche Organization',reinforced_suspension:'Exact Reinforced Suspension'});
const mios=mioCatalog(null);
assert.equal(mios.GER_porsche_tank.name,'Exact Porsche Organization','MIO organization localization must beat the built-in readable fallback');
assert.equal(mios.GER_porsche_tank.traits.reinforced_suspension.name,'Exact Reinforced Suspension','MIO trait localization must beat the built-in readable fallback');

const chassisId=Object.keys(BUILTIN_1192.equipment||{}).find(id=>/^light_tank_chassis_\d+$/.test(id));
assert.ok(chassisId,'test fixture requires a bundled light tank chassis');
setDisplayLocalization({[chassisId]:'Exact Light Tank Chassis'});
const tankCatalog=tankCatalogFromPack(BUILTIN_1192);
assert.equal(tankCatalog.chassis[chassisId]?.name,'Exact Light Tank Chassis','tank designer chassis must use exact localization when available');

const airframeId=Object.keys(BUILTIN_1192.equipment||{}).find(id=>/^small_plane_airframe_\d+$/.test(id));
assert.ok(airframeId,'test fixture requires a bundled small airframe');
setDisplayLocalization({[airframeId]:'Exact Small Airframe'});
const airCatalog=airCatalogFromPack(BUILTIN_1192);
assert.equal(airCatalog.airframes[airframeId]?.name,'Exact Small Airframe','air designer airframe must use exact localization when available');

bootstrapDisplayLocalization({getItem(){return null;}});
console.log('Localization bootstrap/source-label tests passed.');

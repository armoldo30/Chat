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
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192_META.sourceKeyMode,'identity-object-keys','compact catalog keys must be the exact source localization keys');
assert.equal(Object.keys(BUILTIN_ENGLISH_LOCALIZATION_1192_SOURCE_KEYS).length,0,'identity-key catalogs should not duplicate a per-entry source-key table');
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

// source-display-label snapshots the already-bootstrapped catalog once per page
// to keep thousands of source labels off the clone-per-label hot path. Browser
// localization imports persist and reload before being consumed by this layer.
assert.equal(sourceLocalizedValue('engineer'),'Engineer Company');
assert.equal(sourceDisplayLabel('engineer','', 'Old Planner Name'),'Engineer Company','verified bundled localization must beat readable planner fallback text');
assert.equal(sourceDisplayLabel('missing_source_key','', 'Existing Planner Fallback'),'Existing Planner Fallback','missing localization must preserve the existing readable fallback');

// MIO localization is display-only. This branch currently contains only the
// authoritative equipment-category labels and organization labels A-M already
// preserved from the user's HOI4 1.19.2 English corpus.
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.mio_cat_eq_all_medium_plane,'All Medium Planes','preserved MIO equipment-category label must remain source-backed');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.GER_porsche_organization,'Porsche','preserved MIO organization label must remain source-backed');
const localizedMios=mioCatalog({mios:{
  GER_porsche_organization:{id:'GER_porsche_organization',name:'Planner Porsche Fallback',countries:['GER'],equipmentTypes:['medium_tank'],traits:{}}
}});
assert.equal(localizedMios.GER_porsche_organization.name,'Porsche','MIO catalog must consume the bundled exact organization label');
assert.equal(localizedMios.GER_porsche_organization.id,'GER_porsche_organization','MIO localization must not alter source IDs');
assert.deepEqual(localizedMios.GER_porsche_organization.equipmentTypes,['medium_tank'],'MIO localization must not alter mechanics');

const mios=mioCatalog(null);
assert.ok(mios.GER_porsche_tank?.name,'MIO catalog must retain a readable organization name');
assert.ok(mios.GER_porsche_tank?.traits?.reinforced_suspension?.name,'MIO catalog must retain readable trait names while MIO localization expansion is handled separately');

const chassisId=Object.keys(BUILTIN_1192.equipment||{}).find(id=>/^light_tank_chassis_\d+$/.test(id));
assert.ok(chassisId,'test fixture requires a bundled light tank chassis');
const tankCatalog=tankCatalogFromPack(BUILTIN_1192);
assert.equal(tankCatalog.chassis[chassisId]?.name,BUILTIN_ENGLISH_LOCALIZATION_1192[chassisId]||tankCatalog.chassis[chassisId]?.name,'tank designer chassis should consume bundled exact localization when available');

const airframeId=Object.keys(BUILTIN_1192.equipment||{}).find(id=>/^small_plane_airframe_\d+$/.test(id));
assert.ok(airframeId,'test fixture requires a bundled small airframe');
const airCatalog=airCatalogFromPack(BUILTIN_1192);
assert.equal(airCatalog.airframes[airframeId]?.name,BUILTIN_ENGLISH_LOCALIZATION_1192[airframeId]||airCatalog.airframes[airframeId]?.name,'air designer airframe should consume bundled exact localization when available');

bootstrapDisplayLocalization({getItem(){return null;}});
console.log('Localization bootstrap/source-label tests passed.');

import assert from 'node:assert/strict';
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

bootstrapDisplayLocalization({getItem(){return null;}});
console.log('Localization bootstrap/source-label tests passed.');

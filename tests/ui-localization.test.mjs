import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHoi4Localization, mergeLocalization, localizationValue } from '../src/ui-localization.js';
import { displayLabel, setDisplayLocalization } from '../src/ui-labels.js';
import { sourceLocalizedValue } from '../src/source-display-label.js';
import BUILTIN_ENGLISH_LOCALIZATION_1192, { BUILTIN_ENGLISH_LOCALIZATION_1192_META } from '../src/builtin1192/localization-english-1192.js';

const parsed=parseHoi4Localization('\uFEFF l_english:\n mobile_warfare:0 "Mobile Warfare Exact"\n GER_porsche_tank:0 "Dr. Ing. h.c. F. Porsche KG"\n quote_test:0 "Heavy \\\"Assault\\\" Gun"\n\n l_german:\n mobile_warfare:0 "Bewegungskrieg"\n');
assert.equal(parsed.language,'german','parser should record the last encountered language header');
assert.equal(parsed.entries.mobile_warfare,'Mobile Warfare Exact');
assert.equal(parsed.entries.GER_porsche_tank,'Dr. Ing. h.c. F. Porsche KG');
assert.equal(parsed.entries.quote_test,'Heavy "Assault" Gun');
assert.equal(parsed.entries.missing,undefined);

const merged=mergeLocalization({a:'One',b:'Old'},{b:'New',c:'Three'});
assert.deepEqual(merged,{a:'One',b:'New',c:'Three'});
assert.equal(localizationValue(merged,'missing','b'),'New');

assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192_META.generated,true,'bundled English labels must come from the authoritative localization corpus');
assert.ok(BUILTIN_ENGLISH_LOCALIZATION_1192_META.resolvedCount>1000,'bundled localization must contain a substantial planner-facing catalog');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192_META.sourceDigestSha256,'01e79c3cc4e8c764c2fa22cd7ef2d0aefd081724ed169473072e192919b86133');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.infantry,'Infantry');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.artillery_brigade,'Artillery');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.engineer,'Engineer Company');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.medium_armor,'Medium Tank');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.medium_tank_chassis_1,'Basic Medium Tank');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.tank_medium_cannon,'Medium Cannon');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.mobile_warfare,'Mobile Warfare');
assert.equal(BUILTIN_ENGLISH_LOCALIZATION_1192.plains,'Plains');
assert.equal(sourceLocalizedValue('engineer'),'Engineer Company','source label hot path should resolve from the bootstrapped built-in catalog');

const sourceLabelCode=await readFile(new URL('../src/source-display-label.js',import.meta.url),'utf8');
assert.match(sourceLabelCode,/const SOURCE_LOCALIZATION=getDisplayLocalization\(\)/,'source labels should snapshot the bootstrapped catalog once per page');
assert.doesNotMatch(sourceLabelCode,/localizationValue\(\s*getDisplayLocalization\(\)/,'source label lookup must not clone the full localization catalog per label');

setDisplayLocalization(BUILTIN_ENGLISH_LOCALIZATION_1192);
assert.equal(displayLabel('medium_armor'),'Medium Tank','bundled source localization should replace identifier humanization');
assert.equal(displayLabel('engineer'),'Engineer Company','bundled source localization should beat curated/fallback labels');
setDisplayLocalization(parsed.entries);
assert.equal(displayLabel('mobile_warfare'),'Mobile Warfare Exact','browser/imported source localization should still be able to override bundled labels');
assert.equal(displayLabel('GER_porsche_tank'),'Dr. Ing. h.c. F. Porsche KG');
assert.equal(displayLabel('support_artillery'),'Support Artillery','fallback display names remain available when no localization is imported');
setDisplayLocalization({});

console.log('HOI4 UI localization tests passed.');

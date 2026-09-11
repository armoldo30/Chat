import assert from 'node:assert/strict';
import { parseHoi4Localization, mergeLocalization, localizationValue } from '../src/ui-localization.js';
import { displayLabel, setDisplayLocalization } from '../src/ui-labels.js';

const parsed=parseHoi4Localization('\uFEFF l_english:\n mobile_warfare:0 "Mobile Warfare Exact"\n GER_porsche_tank:0 "Dr. Ing. h.c. F. Porsche KG"\n quote_test:0 "Heavy \\\"Assault\\\" Gun"\n\n l_german:\n mobile_warfare:0 "Bewegungskrieg"\n');
assert.equal(parsed.language,'german','parser should record the last encountered language header');
assert.equal(parsed.entries.mobile_warfare,'Mobile Warfare Exact');
assert.equal(parsed.entries.GER_porsche_tank,'Dr. Ing. h.c. F. Porsche KG');
assert.equal(parsed.entries.quote_test,'Heavy "Assault" Gun');
assert.equal(parsed.entries.missing,undefined);

const merged=mergeLocalization({a:'One',b:'Old'},{b:'New',c:'Three'});
assert.deepEqual(merged,{a:'One',b:'New',c:'Three'});
assert.equal(localizationValue(merged,'missing','b'),'New');

setDisplayLocalization(parsed.entries);
assert.equal(displayLabel('mobile_warfare'),'Mobile Warfare Exact','source localization should beat curated fallback labels');
assert.equal(displayLabel('GER_porsche_tank'),'Dr. Ing. h.c. F. Porsche KG');
assert.equal(displayLabel('support_artillery'),'Support Artillery','fallback display names remain available when no localization is imported');
setDisplayLocalization({});

console.log('HOI4 UI localization tests passed.');

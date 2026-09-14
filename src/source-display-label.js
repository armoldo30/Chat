import './ui-localization-bootstrap.js';
import { displayLabel, getDisplayLocalization } from './ui-labels.js';
import { localizationValue } from './ui-localization.js';

// Source-backed labels are immutable for the lifetime of a rendered page. Browser
// localization imports persist their override and reload immediately, so snapshot
// the already-bootstrapped map once instead of cloning thousands of entries for
// every individual label lookup.
const SOURCE_LOCALIZATION=getDisplayLocalization();

export function sourceLocalizedValue(id='',localizationKey=''){
  const key=String(id??'').trim();
  return localizationValue(
    SOURCE_LOCALIZATION,
    localizationKey,
    key,
    key&&`${key}_name`,
    key&&`${key}_NAME`,
    key&&`${key}_title`,
    key&&`${key}_TITLE`
  );
}

export function sourceDisplayLabel(id='',localizationKey='',fallback=''){
  const exact=sourceLocalizedValue(id,localizationKey);
  if(exact)return exact;
  const shown=String(fallback??'').trim();
  return shown||displayLabel(id,localizationKey);
}

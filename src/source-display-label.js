import { displayLabel, getDisplayLocalization } from './ui-labels.js';
import { localizationValue } from './ui-localization.js';

export function sourceLocalizedValue(id='',localizationKey=''){
  const key=String(id??'').trim();
  return localizationValue(
    getDisplayLocalization(),
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

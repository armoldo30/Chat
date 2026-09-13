import { setDisplayLocalization } from './ui-labels.js';
import { mergeLocalization } from './ui-localization.js';
import BUILTIN_ENGLISH_LOCALIZATION_1192 from './builtin1192/localization-english-1192.js';

export const LOCALIZATION_STORAGE_KEY='hoi4-war-planner-localization-english-v1';

export function loadBrowserLocalization(storage=globalThis?.localStorage){
  if(!storage)return {};
  try{return JSON.parse(storage.getItem(LOCALIZATION_STORAGE_KEY)||'{}');}catch{return {};}
}

export function combinedDisplayLocalization(custom={}){
  return mergeLocalization(BUILTIN_ENGLISH_LOCALIZATION_1192,custom);
}

export function bootstrapDisplayLocalization(storage=globalThis?.localStorage){
  const combined=combinedDisplayLocalization(loadBrowserLocalization(storage));
  setDisplayLocalization(combined);
  return combined;
}

bootstrapDisplayLocalization();

// HOI4 1.19.3 support-company catalog boundaries.
//
// The game files distinguish ordinary divisional support from regimental
// support with explicit categories. Army-HQ staff also carry the divisional
// support category because HQ templates use the same support-slot machinery,
// so they must be excluded from the normal Division Designer surface.

export const DIVISIONAL_SUPPORT_CATEGORY_1193='category_divisional_support_battalions';
export const REGIMENTAL_SUPPORT_CATEGORY_1193='category_regimental_support_battalions';

export const HQ_SUPPORT_IDS_1193=Object.freeze([
  'hq_air_liaison',
  'hq_engineer',
  'hq_field_hospital',
  'hq_logistics',
  'hq_maintenance',
  'hq_military_police',
  'hq_naval_liaison',
  'hq_recon',
  'hq_signal',
  'hq_specops',
  'hq_support_company'
]);

const HQ_SET=new Set(HQ_SUPPORT_IDS_1193);
const categoriesOf=record=>Array.isArray(record?.categories)?record.categories.map(String):[];

export function isHeadquartersSupport1193(id,record={}){
  const key=String(id||record?.gameId||record?.id||'');
  return HQ_SET.has(key)||key.startsWith('hq_');
}

export function isRegimentalSupport1193(id,record={}){
  if(record?.regimental===true||record?.regimentalSupport===true)return true;
  if(record?.regimental===false||record?.regimentalSupport===false)return false;
  return categoriesOf(record).includes(REGIMENTAL_SUPPORT_CATEGORY_1193);
}

export function isDivisionDesignerSupport1193(id,record={}){
  if(isHeadquartersSupport1193(id,record)||isRegimentalSupport1193(id,record))return false;
  if(record?.divisional===false)return false;
  if(record?.divisional===true)return true;
  return categoriesOf(record).includes(DIVISIONAL_SUPPORT_CATEGORY_1193);
}

export function supportCatalog1193(records={}){
  const divisional=[],regimental=[],headquarters=[];
  for(const [id,record] of Object.entries(records||{})){
    if(isHeadquartersSupport1193(id,record)){headquarters.push(id);continue;}
    if(isRegimentalSupport1193(id,record)){regimental.push(id);continue;}
    if(isDivisionDesignerSupport1193(id,record))divisional.push(id);
  }
  const sort=(a,b)=>a.localeCompare(b);
  return {divisional:divisional.sort(sort),regimental:regimental.sort(sort),headquarters:headquarters.sort(sort)};
}

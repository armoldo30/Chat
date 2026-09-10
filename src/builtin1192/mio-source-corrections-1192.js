import c1 from './mio-corrections-1192-01.js';
import c2 from './mio-corrections-1192-02.js';
import c3 from './mio-corrections-1192-03.js';
import c4 from './mio-corrections-1192-04.js';
import c5 from './mio-corrections-1192-05.js';

const chunks=[c1,c2,c3,c4,c5];
const clone=value=>value==null?value:structuredClone(value);
const maps=['equipmentBonus','productionBonus','organizationModifier'];

function mergeTrait(base={},patch={}){
  const out={...clone(base),...clone(patch)};
  for(const key of maps)if(base?.[key]||patch?.[key])out[key]={...(clone(base?.[key])||{}),...(clone(patch?.[key])||{})};
  for(const key of ['parents','allParents','parentTraits','mutuallyExclusive','equipmentTypes']){
    if(Object.prototype.hasOwnProperty.call(patch,key))out[key]=[...(patch[key]||[])];
    else if(Object.prototype.hasOwnProperty.call(base,key))out[key]=[...(base[key]||[])];
  }
  return out;
}

export function mergeMioSourceRecord1192(base={},patch={}){
  const out={...clone(base),...clone(patch)};
  if(base?.initial||patch?.initial){
    out.initial={...(clone(base?.initial)||{}),...(clone(patch?.initial)||{})};
    for(const key of maps)if(base?.initial?.[key]||patch?.initial?.[key])out.initial[key]={...(clone(base?.initial?.[key])||{}),...(clone(patch?.initial?.[key])||{})};
    if(Object.prototype.hasOwnProperty.call(patch?.initial||{},'equipmentTypes'))out.initial.equipmentTypes=[...(patch.initial.equipmentTypes||[])];
    else if(Object.prototype.hasOwnProperty.call(base?.initial||{},'equipmentTypes'))out.initial.equipmentTypes=[...(base.initial.equipmentTypes||[])];
  }
  if(base?.traits||patch?.traits){
    out.traits={};
    for(const [id,trait] of Object.entries(base?.traits||{}))out.traits[id]=clone(trait);
    for(const [id,trait] of Object.entries(patch?.traits||{}))out.traits[id]=mergeTrait(out.traits[id]||{},trait);
  }
  if(Object.prototype.hasOwnProperty.call(patch,'countries'))out.countries=[...(patch.countries||[])];
  else if(Object.prototype.hasOwnProperty.call(base,'countries'))out.countries=[...(base.countries||[])];
  if(Object.prototype.hasOwnProperty.call(patch,'equipmentTypes'))out.equipmentTypes=[...(patch.equipmentTypes||[])];
  else if(Object.prototype.hasOwnProperty.call(base,'equipmentTypes'))out.equipmentTypes=[...(base.equipmentTypes||[])];
  const removals=[...(base?.removeTraits||[]),...(patch?.removeTraits||[])];
  if(removals.length)out.removeTraits=[...new Set(removals)];
  return out;
}

const corrections={};
for(const chunk of chunks)for(const [id,record] of Object.entries(chunk||{}))corrections[id]=mergeMioSourceRecord1192(corrections[id]||{},record);

export const MIO_SOURCE_CORRECTION_STATS_1192={
  chunkCount:chunks.length,
  organizationCount:Object.keys(corrections).length,
  traitCount:Object.values(corrections).reduce((n,org)=>n+Object.keys(org?.traits||{}).length,0),
  removeTraitCount:Object.values(corrections).reduce((n,org)=>n+(org?.removeTraits||[]).length,0),
  staticDisabledCount:Object.values(corrections).filter(org=>org?.staticDisabled).length,
  initialRestrictionCount:Object.values(corrections).filter(org=>org?.initial?.equipmentTypes?.length).length,
  traitRestrictionCount:Object.values(corrections).reduce((n,org)=>n+Object.values(org?.traits||{}).filter(trait=>trait?.equipmentTypes?.length).length,0)
};

export default corrections;

import BUILTIN_1192 from './builtin1192.js';
import { mioCatalog, mioEligibility, traitSelectable } from './mio.js';
import { displayLabel, iconSvg, visualKind } from './ui-labels.js';

const STORAGE_KEYS=['hoi4-war-planner-v7','hoi4-war-planner-v6'];
const SHOW_THEORYCRAFT=new Set();

export function currentMioCatalog(){
  let pack=BUILTIN_1192;
  for(const key of STORAGE_KEYS){
    try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw?.dataPack){pack=raw.dataPack;break;}}catch{}
  }
  try{return mioCatalog(pack);}catch{return {};}
}

export function countryTagFor(select){
  const tech=document.getElementById('tech-countryTag')?.value?.trim().toUpperCase();
  if(tech&&/^[A-Z-]{3}$/.test(tech))return tech;
  const summary=select?.closest('.mio-drawer')?.querySelector('summary span')?.textContent||'';
  const match=summary.toUpperCase().match(/\b[A-Z]{3}\b/);return match?.[0]||'---';
}

export function familyTitleFor(select,fallback='Military Industrial Organization'){
  return select?.closest('.mio-assignment')?.querySelector(':scope > div > span')?.textContent?.trim()
    ||select?.closest('.mio-drawer')?.querySelector('.inline-mio-head .eyebrow')?.textContent?.trim()
    ||fallback;
}

export function optionLabel(option){return displayLabel(option?.value,option?.textContent);}

function orgKind(org,title=''){
  const text=[title,...(org?.equipmentTypes||[])].join(' '),kind=visualKind(text);return kind==='generic'?'industry':kind;
}
export function orgIcon(org,title=''){return iconSvg(orgKind(org,title));}
export function orgIconKind(org,title=''){return orgKind(org,title);}

export function theorycraftExpanded(select){return SHOW_THEORYCRAFT.has(select?.id||select?.dataset?.mioOrg||'');}
export function toggleTheorycraft(select){const key=select?.id||select?.dataset?.mioOrg||'';if(!key)return false;SHOW_THEORYCRAFT.has(key)?SHOW_THEORYCRAFT.delete(key):SHOW_THEORYCRAFT.add(key);return SHOW_THEORYCRAFT.has(key);}

export function organizationChoices(select,catalog=currentMioCatalog()){
  const country=countryTagFor(select),expanded=theorycraftExpanded(select),selected=select?.value||'';
  const choices=[...(select?.options||[])].filter(x=>x.value).map(option=>{
    const org=catalog[option.value],elig=mioEligibility(org,country,null);return {option,org,id:option.value,label:optionLabel(option),countryEligible:elig.countryEligible,selected:option.value===selected};
  });
  const national=choices.filter(x=>x.countryEligible),others=choices.filter(x=>!x.countryEligible);
  const visible=expanded||!national.length?choices:choices.filter(x=>x.countryEligible||x.selected);
  return {country,expanded,selected,national,others,visible,total:choices.length};
}

const EFFECT_NAMES={
  reliability:'Reliability',maximum_speed:'Speed',soft_attack:'Soft attack',hard_attack:'Hard attack',defense:'Defense',breakthrough:'Breakthrough',armor_value:'Armor',ap_attack:'Piercing',air_attack:'Air attack',air_defence:'Air defense',air_agility:'Agility',ground_attack:'Ground attack',naval_attack:'Naval attack',range:'Range',build_cost_ic:'Build cost',
  production_cost_factor:'Production cost',production_capacity_factor:'Factory output',production_efficiency_cap_factor:'Efficiency cap',production_efficiency_gain_factor:'Efficiency growth',production_resource_need_factor:'Resource use'
};
function effectValue(value){const n=Number(value);if(!Number.isFinite(n))return '';const p=Math.abs(n)<=2?n*100:n;return `${p>0?'+':''}${Math.round(p*10)/10}%`;}
function collectEffects(trait={}){
  const entries=[];for(const block of [trait.equipmentBonus,trait.productionBonus,trait.organizationModifier])for(const [key,value] of Object.entries(block||{})){if(!Number.isFinite(Number(value))||Number(value)===0)continue;entries.push({key,label:EFFECT_NAMES[key]||displayLabel(key),value:effectValue(value)});}return entries;
}
export function effectSummary(trait={},limit=3){const effects=collectEffects(trait);return effects.slice(0,limit).map(x=>`${x.label} ${x.value}`).join(' · ')||(trait?.name?'Trait effect retained':'');}
export function effectChips(trait={},limit=4){return collectEffects(trait).slice(0,limit);}

export function dependencyGroups(trait={}){return {any:[...(trait.parents||[])],all:[...(trait.allParents||[])],counted:[...(trait.parentTraits||[])],count:Math.max(1,Number(trait.parentCount)||1),exclusive:[...(trait.mutuallyExclusive||[])]};}
export function dependencyIds(trait={}){const g=dependencyGroups(trait);return [...new Set([...g.any,...g.all,...g.counted])];}

export function dependencyText(trait={},selected=[]){
  const set=new Set(selected),g=dependencyGroups(trait),parts=[];
  const names=ids=>ids.map(displayLabel);
  if(g.any.length&&!g.any.some(x=>set.has(x)))parts.push(`One of: ${names(g.any).join(' / ')}`);
  const missingAll=g.all.filter(x=>!set.has(x));if(missingAll.length)parts.push(`Requires: ${names(missingAll).join(' + ')}`);
  if(g.counted.length){const have=g.counted.filter(x=>set.has(x)).length;if(have<g.count)parts.push(`Requires ${g.count-have} more from: ${names(g.counted.filter(x=>!set.has(x))).join(' / ')}`);}
  const conflict=g.exclusive.find(x=>set.has(x));if(conflict)parts.push(`Exclusive with ${displayLabel(conflict)}`);
  return parts.join(' · ');
}

export function selectedDependents(org,traitId,selected=[]){
  const set=new Set(selected);return [...set].filter(id=>id!==traitId&&dependencyIds(org?.traits?.[id]||{}).includes(traitId));
}

export function traitModel(org,inputs=[]){
  const selected=inputs.filter(x=>x.checked).map(x=>x.value),selectedSet=new Set(selected),byId=new Map(inputs.map(x=>[x.value,x]));
  const rows=inputs.map(input=>{
    const id=input.value,trait=org?.traits?.[id]||{id,name:id},active=selectedSet.has(id),available=!active&&traitSelectable(org,id,selected),dependents=selectedDependents(org,id,selected),canRemove=active&&!dependents.length;
    return {id,input,trait,name:displayLabel(id,trait.name||id),active,available,locked:!active&&!available,canRemove,dependents,reason:active&&!canRemove?`Used by ${dependents.map(displayLabel).join(', ')}`:dependencyText(trait,selected)};
  });
  return {selected,rows,active:rows.filter(x=>x.active),available:rows.filter(x=>x.available),locked:rows.filter(x=>x.locked),byId};
}

export function traitKind(row){
  const keys=[...Object.keys(row?.trait?.equipmentBonus||{}),...Object.keys(row?.trait?.productionBonus||{}),row?.id,row?.name].join(' '),kind=visualKind(keys);return kind==='generic'?'industry':kind;
}

export function traitIcon(row){return iconSvg(traitKind(row));}

import fs from 'node:fs';
const path='src/parser.js';
let s=fs.readFileSync(path,'utf8');
function replaceOnce(oldText,newText,label){
  if(!s.includes(oldText))throw new Error(`missing parser patch target: ${label}`);
  s=s.replace(oldText,newText);
}
replaceOnce(
"    return {id:token,name:String(last(raw.name)||token),equipmentBonus:plainNeed(raw.equipment_bonus),productionBonus:plainNeed(raw.production_bonus),organizationModifier:plainNeed(raw.organization_modifier),parents:items(raw.any_parent),allParents:items(raw.all_parents),mutuallyExclusive:items(raw.mutually_exclusive),equipmentTypes:items(raw.limit_to_equipment_type)};",
"    const parent=obj(last(raw.parent));\n    return {id:token,name:String(last(raw.name)||token),equipmentBonus:plainNeed(raw.equipment_bonus),productionBonus:plainNeed(raw.production_bonus),organizationModifier:plainNeed(raw.organization_modifier),parents:items(raw.any_parent),allParents:items(raw.all_parents),parentTraits:items(parent.traits),parentCount:num(last(parent.num_parents_needed)),mutuallyExclusive:items(raw.mutually_exclusive),equipmentTypes:items(raw.limit_to_equipment_type)};",
'plain parent threshold');
replaceOnce(
"    if(!(raw.include||raw.equipment_type||raw.equipment_types||raw.initial_trait||raw.trait||raw.add_trait||raw.override_trait||raw.allowed))continue;",
"    if(!(raw.include||raw.equipment_type||raw.equipment_types||raw.initial_trait||raw.trait||raw.add_trait||raw.override_trait||raw.remove_trait||raw.allowed))continue;",
'remove_trait record guard');
replaceOnce(
"    out[id]={id,name:String(last(raw.name)||id),include:String(last(raw.include)||''),countries,equipmentTypes:[...new Set([...items(raw.equipment_type),...items(raw.equipment_types)])],initial,traits};",
"    const removeTraits=[...new Set(arrify(raw.remove_trait).flatMap(value=>{const item=last(value);if(typeof item==='string'||typeof item==='number')return [String(item)];const removal=obj(item);return [...items(removal.token),...items(removal.trait),...items(removal.traits)];}))];\n    out[id]={id,name:String(last(raw.name)||id),include:String(last(raw.include)||''),countries,equipmentTypes:[...new Set([...items(raw.equipment_type),...items(raw.equipment_types)])],initial,traits,removeTraits};",
'remove_trait extraction');
replaceOnce(
"      traits:{...(base.traits||{}),...(raw.traits||{})}\n    };\n    if(raw.include&&!parent)result.inheritanceWarning=`missing-include:${raw.include}`;",
"      traits:{...(base.traits||{}),...(raw.traits||{})}\n    };\n    if(raw.removeTraits?.length){result.traits={...(result.traits||{})};for(const traitId of raw.removeTraits)delete result.traits[traitId];}\n    delete result.removeTraits;\n    if(raw.include&&!parent)result.inheritanceWarning=`missing-include:${raw.include}`;",
'post-inheritance remove_trait');
fs.writeFileSync(path,s);
console.log('MIO parser patch applied');

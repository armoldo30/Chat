import { regimentGroupForUnit } from './regiment-groups.js';

const PICKER_SECTIONS=Object.freeze([
  ['infantry','Infantry Battalions'],
  ['mobile','Mobile Battalions'],
  ['combat_support','Combat Support Battalions'],
  ['mobile_combat_support','Mobile Combat Support'],
  ['armor','Armored Battalions'],
  ['armor_combat_support','Armored Combat Support']
]);

export function battalionPickerGroups(battalionMap={}){
  const buckets=Object.fromEntries(PICKER_SECTIONS.map(([group,label])=>[label,[]]));
  const labelByGroup=Object.fromEntries(PICKER_SECTIONS);
  for(const [id,unit] of Object.entries(battalionMap||{})){
    if(!unit||typeof unit!=='object')continue;
    const group=regimentGroupForUnit(id,unit),label=labelByGroup[group];
    if(!label)continue;
    buckets[label].push(id);
  }
  for(const ids of Object.values(buckets)){
    ids.sort((a,b)=>String(battalionMap[a]?.name||a).localeCompare(String(battalionMap[b]?.name||b)));
  }
  return Object.fromEntries(Object.entries(buckets).filter(([,ids])=>ids.length));
}

export function assignRegimentalSupport(state,side,column,value,isCompatible=()=>true){
  if(!state||!['attacker','defender'].includes(side))return null;
  const c=Math.max(0,Math.min(4,Math.floor(Number(column)||0))),key=side+'RegimentalSupports';
  if(!Array.isArray(state[key]))state[key]=Array(5).fill(null);
  if(state[key].length<5)state[key]=Array.from({length:5},(_,i)=>state[key][i]??null);
  const next=value&&isCompatible(value,c)?String(value):null;
  state[key][c]=next;
  return next;
}


const SUPPORT_SECTION_ORDER=Object.freeze([
  'Engineering & Recon',
  'Fire Support',
  'Anti-Tank & Anti-Air',
  'Logistics & Maintenance',
  'Command, Medical & Security',
  'Specialist Support',
  'Other Support'
]);

function supportSearchText(id,record={}){
  return [id,record.id,record.gameId,record.name,...(record.categories||[]),...(record.types||[])].filter(Boolean).join(' ').toLowerCase();
}

export function supportCompanySection(id,record={}){
  const text=supportSearchText(id,record);
  if(/engineer|pioneer|recon|scout|airborne_light_armor|long_range_patrol|northern_territory/.test(text))return 'Engineering & Recon';
  if(/artillery|rocket|mortar|heavy weapon|fire support/.test(text))return 'Fire Support';
  if(/anti[_ -]?tank|tank destroyer|anti[_ -]?air|sp[_ -]?anti[_ -]?air/.test(text))return 'Anti-Tank & Anti-Air';
  if(/logistic|maintenance|repair|supply|helicopter_transport|winter_logistics/.test(text))return 'Logistics & Maintenance';
  if(/signal|field hospital|medical|military police|security|helicopter_field_hospital/.test(text))return 'Command, Medical & Security';
  if(/flame|land cruiser|super[_ -]?heavy|blackshirt|sturmtruppe|helicopter_brigade/.test(text))return 'Specialist Support';
  return 'Other Support';
}

export function supportCompanyPickerGroups(supportMap={},ids=[]){
  const groups=Object.fromEntries(SUPPORT_SECTION_ORDER.map(label=>[label,[]]));
  for(const id of ids||[]){
    const record=supportMap?.[id];if(!record)continue;
    groups[supportCompanySection(id,record)].push(id);
  }
  for(const values of Object.values(groups)){
    values.sort((a,b)=>String(supportMap[a]?.name||a).localeCompare(String(supportMap[b]?.name||b)));
  }
  return Object.fromEntries(SUPPORT_SECTION_ORDER.filter(label=>groups[label].length).map(label=>[label,groups[label]]));
}


export function supportTypeTokens(record={}){
  return [...new Set((record?.sameSupportType||[]).map(x=>String(x||'').trim()).filter(Boolean))];
}
function supportIdentityTokens(id,record={}){
  return new Set([id,record?.id,record?.gameId].filter(Boolean).map(x=>String(x)));
}

export function supportCompaniesConflict(aId,aRecord={},bId,bRecord={}){
  if(!aId||!bId)return false;
  if(String(aId)===String(bId))return true;
  const aTypes=new Set(supportTypeTokens(aRecord)),bTypes=new Set(supportTypeTokens(bRecord));
  const aIds=supportIdentityTokens(aId,aRecord),bIds=supportIdentityTokens(bId,bRecord);
  for(const token of aTypes)if(bTypes.has(token)||bIds.has(token))return true;
  for(const token of bTypes)if(aIds.has(token))return true;
  return false;
}

export function supportCompanyAllowedWithSelection(candidateId,supportMap={},selectedIds=[],replaceIndex=-1){
  const candidate=supportMap?.[candidateId];if(!candidate)return false;
  return (selectedIds||[]).every((id,index)=>{
    if(index===replaceIndex||!id)return true;
    return !supportCompaniesConflict(candidateId,candidate,id,supportMap?.[id]);
  });
}


export function normalizeSupportCompanySelection(selectedIds=[],supportMap={},allowedIds=null,max=5){
  const allowed=allowedIds?new Set(allowedIds):null,out=[];
  for(const raw of selectedIds||[]){
    const id=String(raw||'');if(!id||!supportMap?.[id]||(allowed&&!allowed.has(id)))continue;
    if(!supportCompanyAllowedWithSelection(id,supportMap,out,-1))continue;
    out.push(id);if(out.length>=Math.max(0,Math.floor(Number(max)||0)))break;
  }
  return out;
}

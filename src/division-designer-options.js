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

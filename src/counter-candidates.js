import { battalions, supports } from './data.js';
import { gridToCounts, canPlaceBattalion, DESIGNER_COLS, DESIGNER_ROWS, filledInRegiment, regimentGroup as gridRegimentGroup } from './designer.js';
import { ordinaryDivisionBattalionIds, supportCompanyAllowedWithSelection } from './division-designer-options.js';
import { importedDivisionalSupportIds } from './gameData.js';
import { regimentGroupForUnit } from './regiment-groups.js';
import { REGIMENTAL_SUPPORT_IDS_1193, regimentalSupportAllowed } from './regimental-support-1193.js';

const LEGACY_REGIMENTAL_SUPPORT_IDS=new Set(['regimental_infantry_guns','regimental_at','regimental_aa']);
const BATTALION_TYPES_PER_GROUP=8;
const SUPPORT_TYPE_LIMIT=18;
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const otherSide=side=>side==='defender'?'attacker':'defender';
const changeLabel=changes=>changes.join(' + ');
const unitName=(map,id)=>String(map?.[id]?.name||id||'unit');

export const counterTemplateKey=(grid,supportKeys,regimentalSupportKeys=[])=>JSON.stringify([
  gridToCounts(grid,Object.keys(battalions)).sort((a,b)=>a.type.localeCompare(b.type)),
  [...(supportKeys||[])].sort(),
  Array.from({length:DESIGNER_COLS},(_,i)=>regimentalSupportKeys?.[i]||null)
]);

export function counterBattalionCandidateIds(battalionMap=battalions){
  return ordinaryDivisionBattalionIds(battalionMap).sort((a,b)=>unitName(battalionMap,a).localeCompare(unitName(battalionMap,b)));
}

export function counterDivisionalSupportIds(supportMap=supports){
  const exactRegimental=new Set([...REGIMENTAL_SUPPORT_IDS_1193,...LEGACY_REGIMENTAL_SUPPORT_IDS]);
  return importedDivisionalSupportIds(supportMap)
    .filter(id=>!exactRegimental.has(id)&&supportMap?.[id]?.allowInNonArmyHq!==false&&supportMap?.[id]?.divisional!==false)
    .sort((a,b)=>unitName(supportMap,a).localeCompare(unitName(supportMap,b)));
}

export function counterRegimentalSupportIds(supportMap=supports){
  return REGIMENTAL_SUPPORT_IDS_1193.filter(id=>supportMap?.[id]);
}

export function counterUnitPreviewScore(record={},snapshot,side='attacker'){
  const target=snapshot?.[otherSide(side)]||{},base=snapshot?.[side]||{},hardness=Math.max(0,Math.min(1,num(target.hardness))),battlefield=snapshot?.state?.battlefield||{};
  const attack=num(record.soft)*(1-hardness)+num(record.hard)*hardness,survival=side==='defender'?num(record.def):num(record.breakthrough);
  let score=attack+survival*.28+num(record.org)*.08+num(record.hp)*.12+num(record.piercing)*.06+num(record.armor)*.04;
  if(num(base.piercing)<num(target.armor))score+=num(record.piercing)>=num(target.armor)?85:Math.min(num(record.piercing),num(target.armor))*.15;
  if(num(base.armor)<=num(target.piercing))score+=num(record.armor)>num(target.piercing)?65:Math.min(num(record.armor),num(target.piercing))*.08;
  const air=num(battlefield.air),enemyAirSuperiority=side==='attacker'?air< -1e-9:air>1e-9;
  score+=num(record.airAttack)*(enemyAirSuperiority?.7:.04);
  score-=Math.max(0,num(record.supply))*2.5;
  return score;
}

function battalionShortlist(snapshot,side,battalionMap,grid){
  const buckets=new Map();
  for(const id of counterBattalionCandidateIds(battalionMap)){
    const group=regimentGroupForUnit(id,battalionMap[id]);if(!group)continue;
    if(!buckets.has(group))buckets.set(group,[]);
    buckets.get(group).push({id,score:counterUnitPreviewScore(battalionMap[id],snapshot,side)});
  }
  const selected=new Set((grid||[]).flat().filter(Boolean));
  for(const rows of buckets.values())for(const row of rows.sort((a,b)=>b.score-a.score||unitName(battalionMap,a.id).localeCompare(unitName(battalionMap,b.id))).slice(0,BATTALION_TYPES_PER_GROUP))selected.add(row.id);
  return [...selected].filter(id=>battalionMap?.[id]&&battalionMap[id].allowInNonArmyHq!==false);
}

function supportShortlist(snapshot,side,supportMap,selectedSupports){
  const current=new Set(selectedSupports||[]),ranked=counterDivisionalSupportIds(supportMap).map(id=>({id,score:counterUnitPreviewScore(supportMap[id],snapshot,side)})).sort((a,b)=>b.score-a.score||unitName(supportMap,a.id).localeCompare(unitName(supportMap,b.id)));
  const out=new Set([...current,...ranked.slice(0,SUPPORT_TYPE_LIMIT).map(x=>x.id)]);
  return [...out].filter(id=>supportMap?.[id]&&!supportMap[id].regimentalSupport);
}

function diverseSlice(candidates,limit){
  const max=Math.max(1,Math.floor(Number(limit)||1)),ranked=[...candidates].sort((a,b)=>(b.previewScore||0)-(a.previewScore||0)||a.label.localeCompare(b.label));
  if(ranked.length<=max)return ranked;
  const roles=['line','support','regimental'],reserve=Math.max(1,Math.min(6,Math.floor(max/6))),out=[],used=new Set();
  for(const role of roles){
    let taken=0;
    for(const item of ranked){if(taken>=reserve)break;if(item.counterRole!==role||used.has(item.key))continue;out.push(item);used.add(item.key);taken++;}
  }
  for(const item of ranked){if(out.length>=max)break;if(used.has(item.key))continue;out.push(item);used.add(item.key);}
  return out;
}

export function buildCounterCandidates(snapshot,{side='attacker',state=snapshot.state,grid=null,supportKeys=null,priorChanges=[],priorKinds=[],limit=120,battalionMap=battalions,supportMap=supports}={}){
  const baseGrid=grid||state[side+'Grid'],baseSupports=supportKeys||state[side+'Supports'],regKey=side+'RegimentalSupports',baseRegimental=Array.from({length:DESIGNER_COLS},(_,i)=>state?.[regKey]?.[i]||null),candidates=[],seen=new Set([counterTemplateKey(baseGrid,baseSupports,baseRegimental)]);
  const add=(nextGrid,nextSupports,description,kind,previewScore=0,counterRole='line',nextState=null)=>{
    const regimental=nextState?.[regKey]||baseRegimental,key=counterTemplateKey(nextGrid,nextSupports,regimental);if(seen.has(key))return;seen.add(key);
    const changes=[...priorChanges,description],changeKinds=[...priorKinds,kind];
    candidates.push({side,grid:nextGrid,supportKeys:nextSupports,state:nextState||undefined,changes,changeKinds,label:changeLabel(changes),kind,changeCount:changes.length,key,previewScore,counterRole});
  };

  const lineTypes=battalionShortlist(snapshot,side,battalionMap,baseGrid);
  for(const type of lineTypes)for(let column=0;column<DESIGNER_COLS;column++){
    const row=baseGrid[column].findIndex(value=>!value);if(row<0||!canPlaceBattalion(baseGrid,column,row,type,battalionMap))continue;
    const next=structuredClone(baseGrid);next[column][row]=type;add(next,baseSupports,`Add ${unitName(battalionMap,type)}`,'add-line',counterUnitPreviewScore(battalionMap[type],snapshot,side),'line');
  }
  for(let column=0;column<DESIGNER_COLS;column++)for(let row=0;row<DESIGNER_ROWS;row++){
    const current=baseGrid[column][row];if(!current)continue;
    const currentScore=counterUnitPreviewScore(battalionMap[current],snapshot,side);
    for(const type of lineTypes){
      if(type===current||!canPlaceBattalion(baseGrid,column,row,type,battalionMap))continue;
      const next=structuredClone(baseGrid);next[column][row]=type;
      add(next,baseSupports,`Replace ${unitName(battalionMap,current)} with ${unitName(battalionMap,type)}`,'replace-line',counterUnitPreviewScore(battalionMap[type],snapshot,side)-currentScore*.65,'line');
    }
  }

  const supportTypes=supportShortlist(snapshot,side,supportMap,baseSupports);
  for(const type of supportTypes){
    if(baseSupports.includes(type))continue;
    const nextScore=counterUnitPreviewScore(supportMap[type],snapshot,side);
    if(baseSupports.length<5&&supportCompanyAllowedWithSelection(type,supportMap,baseSupports,-1))add(baseGrid,[...baseSupports,type],`Add ${unitName(supportMap,type)}`,'add-support',nextScore,'support');
    for(let index=0;index<baseSupports.length;index++){
      const current=baseSupports[index];if(!current||!supportCompanyAllowedWithSelection(type,supportMap,baseSupports,index))continue;
      const next=[...baseSupports];next[index]=type;
      add(baseGrid,next,`Replace ${unitName(supportMap,current)} with ${unitName(supportMap,type)}`,'replace-support',nextScore-counterUnitPreviewScore(supportMap[current],snapshot,side)*.65,'support');
    }
  }

  for(let column=0;column<DESIGNER_COLS;column++){
    if(filledInRegiment(baseGrid,column)<3)continue;
    const group=gridRegimentGroup(baseGrid,column,battalionMap);if(!group)continue;
    const current=baseRegimental[column];
    for(const type of counterRegimentalSupportIds(supportMap)){
      if(type===current||!regimentalSupportAllowed(type,supportMap[type],group))continue;
      const nextRegimental=[...baseRegimental];nextRegimental[column]=type;
      const nextState={...state,[regKey]:nextRegimental},verb=current?'Replace':'Add',description=current?`${verb} ${unitName(supportMap,current)} with ${unitName(supportMap,type)} in regiment ${column+1}`:`${verb} ${unitName(supportMap,type)} to regiment ${column+1}`;
      add(baseGrid,baseSupports,description,current?'replace-regimental-support':'add-regimental-support',counterUnitPreviewScore(supportMap[type],snapshot,side)-counterUnitPreviewScore(supportMap[current],snapshot,side)*.65,'regimental',nextState);
    }
  }

  return diverseSlice(candidates,limit);
}

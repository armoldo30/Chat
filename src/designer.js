import { battalions as runtimeBattalions } from './data.js';

export const DESIGNER_COLS=5;
export const DESIGNER_ROWS=5;
export const blankGrid=()=>Array.from({length:DESIGNER_COLS},()=>Array(DESIGNER_ROWS).fill(null));

const validSet=validTypes=>validTypes instanceof Set?validTypes:new Set(validTypes||[]);
const groupOf=(type,battalionMap=runtimeBattalions)=>String(battalionMap?.[type]?.group||type||'').toLowerCase();
const firstEmptyRow=column=>Array.isArray(column)?column.findIndex(x=>!x):-1;

export function regimentGroup(grid,column,battalionMap=runtimeBattalions,ignoreRow=null){
  const c=Math.max(0,Math.min(DESIGNER_COLS-1,Math.floor(+column||0)));
  for(let r=0;r<DESIGNER_ROWS;r++){
    if(r===ignoreRow)continue;
    const type=grid?.[c]?.[r],group=groupOf(type,battalionMap);
    if(type&&group)return group;
  }
  return null;
}

function repairMixedRegiments(grid,battalionMap=runtimeBattalions){
  const next=grid.map(column=>[...column]),overflow=[];
  for(let c=0;c<DESIGNER_COLS;c++){
    let locked=null;
    for(let r=0;r<DESIGNER_ROWS;r++){
      const type=next[c][r];if(!type)continue;
      const group=groupOf(type,battalionMap);
      if(!locked){locked=group;continue;}
      if(group!==locked){overflow.push(type);next[c][r]=null;}
    }
  }
  for(const type of overflow){
    const group=groupOf(type,battalionMap);let target=-1;
    for(let c=0;c<DESIGNER_COLS;c++)if(regimentGroup(next,c,battalionMap)===group&&firstEmptyRow(next[c])>=0){target=c;break;}
    if(target<0)for(let c=0;c<DESIGNER_COLS;c++)if(!regimentGroup(next,c,battalionMap)){target=c;break;}
    if(target<0)continue;
    const row=firstEmptyRow(next[target]);if(row>=0)next[target][row]=type;
  }
  return next;
}

export function normalizeGrid(raw,validTypes,battalionMap=runtimeBattalions){
  const grid=blankGrid(),valid=validSet(validTypes);
  if(!Array.isArray(raw))return grid;
  for(let c=0;c<DESIGNER_COLS;c++)for(let r=0;r<DESIGNER_ROWS;r++){
    const value=raw?.[c]?.[r];if(value&&(!valid.size||valid.has(value)))grid[c][r]=value;
  }
  return repairMixedRegiments(grid,battalionMap);
}
export function countsToGrid(list,validTypes,battalionMap=runtimeBattalions){
  const grid=blankGrid(),valid=validSet(validTypes);
  for(const entry of list||[]){
    const type=entry?.type;if(!type||(valid.size&&!valid.has(type)))continue;
    let count=Math.max(0,Math.floor(+entry.count||0));
    while(count>0){
      const group=groupOf(type,battalionMap);let target=-1;
      for(let c=0;c<DESIGNER_COLS;c++)if(regimentGroup(grid,c,battalionMap)===group&&firstEmptyRow(grid[c])>=0){target=c;break;}
      if(target<0)for(let c=0;c<DESIGNER_COLS;c++)if(!regimentGroup(grid,c,battalionMap)){target=c;break;}
      if(target<0)break;
      const row=firstEmptyRow(grid[target]);if(row<0)break;
      grid[target][row]=type;count--;
    }
  }
  return grid;
}
export function gridToCounts(grid,validTypes){
  const valid=validSet(validTypes),order=[],counts=new Map();
  for(let c=0;c<DESIGNER_COLS;c++)for(let r=0;r<DESIGNER_ROWS;r++){
    const type=grid?.[c]?.[r];if(!type||(valid.size&&!valid.has(type)))continue;
    if(!counts.has(type))order.push(type);counts.set(type,(counts.get(type)||0)+1);
  }
  return order.map(type=>({type,count:counts.get(type)}));
}
export function filledInRegiment(grid,column){return Array.isArray(grid?.[column])?grid[column].filter(Boolean).length:0;}

export function fillRegiment(grid,column,type,validTypes,battalionMap=runtimeBattalions){
  const valid=validSet(validTypes),next=normalizeGrid(grid,valid,battalionMap);
  const c=Math.max(0,Math.min(DESIGNER_COLS-1,Math.floor(+column||0)));
  if(type&&(valid.size&&!valid.has(type)))return next;
  next[c]=Array(DESIGNER_ROWS).fill(type||null);
  return next;
}

export function canPlaceBattalion(grid,column,row,type,battalionMap=runtimeBattalions,{replaceRegiment=false}={}){
  if(!type)return true;
  const unit=battalionMap?.[type];if(!unit)return false;
  if(replaceRegiment)return true;
  const locked=regimentGroup(grid,column,battalionMap,row),group=groupOf(type,battalionMap);
  return !locked||group===locked;
}

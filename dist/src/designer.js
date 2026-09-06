export const DESIGNER_COLS=5;
export const DESIGNER_ROWS=5;
export const blankGrid=()=>Array.from({length:DESIGNER_COLS},()=>Array(DESIGNER_ROWS).fill(null));
export function normalizeGrid(raw,validTypes){
  const grid=blankGrid(),valid=validTypes instanceof Set?validTypes:new Set(validTypes||[]);
  if(!Array.isArray(raw))return grid;
  for(let c=0;c<DESIGNER_COLS;c++)for(let r=0;r<DESIGNER_ROWS;r++){
    const value=raw?.[c]?.[r];if(value&&(!valid.size||valid.has(value)))grid[c][r]=value;
  }
  return grid;
}
export function countsToGrid(list,validTypes){
  const grid=blankGrid(),valid=validTypes instanceof Set?validTypes:new Set(validTypes||[]);let col=0,row=0;
  for(const entry of list||[]){
    const type=entry?.type;if(!type||(valid.size&&!valid.has(type)))continue;
    let count=Math.max(0,Math.floor(+entry.count||0));
    while(count>0&&col<DESIGNER_COLS){grid[col][row]=type;count--;row++;if(row>=DESIGNER_ROWS){row=0;col++;}}
  }
  return grid;
}
export function gridToCounts(grid,validTypes){
  const valid=validTypes instanceof Set?validTypes:new Set(validTypes||[]),order=[],counts=new Map();
  for(let c=0;c<DESIGNER_COLS;c++)for(let r=0;r<DESIGNER_ROWS;r++){
    const type=grid?.[c]?.[r];if(!type||(valid.size&&!valid.has(type)))continue;
    if(!counts.has(type))order.push(type);counts.set(type,(counts.get(type)||0)+1);
  }
  return order.map(type=>({type,count:counts.get(type)}));
}
export function filledInRegiment(grid,column){return Array.isArray(grid?.[column])?grid[column].filter(Boolean).length:0;}

export function fillRegiment(grid,column,type,validTypes){
  const valid=validTypes instanceof Set?validTypes:new Set(validTypes||[]),next=normalizeGrid(grid,valid);
  const c=Math.max(0,Math.min(DESIGNER_COLS-1,Math.floor(+column||0)));
  if(type&&(valid.size&&!valid.has(type)))return next;
  next[c]=Array(DESIGNER_ROWS).fill(type||null);
  return next;
}

export function regimentGroup(grid,column,battalionMap,ignoreRow=null){
  const c=Math.max(0,Math.min(DESIGNER_COLS-1,Math.floor(+column||0)));
  for(let r=0;r<DESIGNER_ROWS;r++){
    if(r===ignoreRow)continue;
    const type=grid?.[c]?.[r],group=battalionMap?.[type]?.group;
    if(type&&group)return group;
  }
  return null;
}
export function canPlaceBattalion(grid,column,row,type,battalionMap,{replaceRegiment=false}={}){
  if(!type)return true;
  const unit=battalionMap?.[type];if(!unit)return false;
  if(replaceRegiment)return true;
  const locked=regimentGroup(grid,column,battalionMap,row);
  return !locked||!unit.group||unit.group===locked;
}

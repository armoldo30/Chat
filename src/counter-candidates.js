import { battalions, supports } from './data.js';
import { gridToCounts, canPlaceBattalion, DESIGNER_COLS, DESIGNER_ROWS } from './designer.js';

const LINE_TYPES=['infantry','motorized','mechanized','artillery','anti_tank','anti_air','light_armor','medium_armor','heavy_armor'];
const SUPPORT_TYPES=['engineer','support_artillery','support_at','support_aa','recon','logistics','signal'];

const keyFor=(grid,supportKeys)=>JSON.stringify([gridToCounts(grid,Object.keys(battalions)).sort((a,b)=>a.type.localeCompare(b.type)),[...supportKeys].sort()]);

export function buildCounterCandidates(snapshot){
  const {state}=snapshot,baseGrid=state.attackerGrid,baseSupports=state.attackerSupports,candidates=[],seen=new Set([keyFor(baseGrid,baseSupports)]);
  const add=(grid,supportKeys,label,kind)=>{const key=keyFor(grid,supportKeys);if(seen.has(key))return;seen.add(key);candidates.push({grid,supportKeys,label,kind});};
  for(const type of LINE_TYPES.filter(id=>battalions[id]))for(let column=0;column<DESIGNER_COLS;column++){
    const row=baseGrid[column].findIndex(value=>!value);
    if(row<0||!canPlaceBattalion(baseGrid,column,row,type,battalions))continue;
    const grid=structuredClone(baseGrid);grid[column][row]=type;add(grid,baseSupports,`Add ${battalions[type].name||type}`,'add-line');
  }
  for(let column=0;column<DESIGNER_COLS;column++)for(let row=0;row<DESIGNER_ROWS;row++){
    const current=baseGrid[column][row];if(!current)continue;
    for(const type of LINE_TYPES.filter(id=>battalions[id])){
      if(type===current||!canPlaceBattalion(baseGrid,column,row,type,battalions))continue;
      const grid=structuredClone(baseGrid);grid[column][row]=type;add(grid,baseSupports,`Replace ${battalions[current]?.name||current} with ${battalions[type]?.name||type}`,'replace-line');
    }
  }
  if(baseSupports.length<5)for(const type of SUPPORT_TYPES.filter(id=>supports[id]))if(!baseSupports.includes(type))add(baseGrid,[...baseSupports,type],`Add ${supports[type].name||type}`,'add-support');
  return candidates.slice(0,80);
}

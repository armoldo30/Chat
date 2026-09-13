import { battalions, supports } from './data.js';
import { gridToCounts, canPlaceBattalion, DESIGNER_COLS, DESIGNER_ROWS } from './designer.js';

const LINE_TYPES=['infantry','motorized','mechanized','artillery','anti_tank','anti_air','light_armor','medium_armor','heavy_armor'];
const SUPPORT_TYPES=['engineer','support_artillery','support_at','support_aa','recon','logistics','signal'];

export const counterTemplateKey=(grid,supportKeys)=>JSON.stringify([gridToCounts(grid,Object.keys(battalions)).sort((a,b)=>a.type.localeCompare(b.type)),[...supportKeys].sort()]);
const changeLabel=changes=>changes.join(' + ');

export function buildCounterCandidates(snapshot,{grid=null,supportKeys=null,priorChanges=[],priorKinds=[],limit=80}={}){
  const {state}=snapshot,baseGrid=grid||state.attackerGrid,baseSupports=supportKeys||state.attackerSupports,candidates=[],seen=new Set([counterTemplateKey(baseGrid,baseSupports)]);
  const add=(nextGrid,nextSupports,description,kind)=>{
    const key=counterTemplateKey(nextGrid,nextSupports);if(seen.has(key))return;seen.add(key);
    const changes=[...priorChanges,description],changeKinds=[...priorKinds,kind];candidates.push({grid:nextGrid,supportKeys:nextSupports,changes,changeKinds,label:changeLabel(changes),kind,changeCount:changes.length,key});
  };
  for(const type of LINE_TYPES.filter(id=>battalions[id]))for(let column=0;column<DESIGNER_COLS;column++){
    const row=baseGrid[column].findIndex(value=>!value);
    if(row<0||!canPlaceBattalion(baseGrid,column,row,type,battalions))continue;
    const next=structuredClone(baseGrid);next[column][row]=type;add(next,baseSupports,`Add ${battalions[type].name||type}`,'add-line');
  }
  for(let column=0;column<DESIGNER_COLS;column++)for(let row=0;row<DESIGNER_ROWS;row++){
    const current=baseGrid[column][row];if(!current)continue;
    for(const type of LINE_TYPES.filter(id=>battalions[id])){
      if(type===current||!canPlaceBattalion(baseGrid,column,row,type,battalions))continue;
      const next=structuredClone(baseGrid);next[column][row]=type;add(next,baseSupports,`Replace ${battalions[current]?.name||current} with ${battalions[type]?.name||type}`,'replace-line');
    }
  }
  for(const type of SUPPORT_TYPES.filter(id=>supports[id])){
    if(baseSupports.includes(type))continue;
    if(baseSupports.length<5)add(baseGrid,[...baseSupports,type],`Add ${supports[type].name||type}`,'add-support');
    for(let index=0;index<baseSupports.length;index++){
      const current=baseSupports[index];if(!current)continue;
      const next=[...baseSupports];next[index]=type;add(baseGrid,next,`Replace ${supports[current]?.name||current} with ${supports[type].name||type}`,'replace-support');
    }
  }
  return candidates.slice(0,Math.max(1,limit));
}

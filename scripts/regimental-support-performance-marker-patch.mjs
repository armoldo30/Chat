import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const file=resolve(import.meta.dirname,'performance-patch-v2.mjs');
let text=await readFile(file,'utf8');
const old=`out=replaceOnce(out,"if(designerPick?.kind==='regimental')state[side+'RegimentalSupports'][designerPick.c]=value;\\n    syncDesignerSide(side);designerPick=null;save();shell();","if(designerPick?.kind==='regimental')state[side+'RegimentalSupports'][designerPick.c]=value;\\n    syncDesignerSide(side);designerPick=null;save();refreshDivisionLab();",'picker selection handler');`;
const next=`out=replaceOnce(out,"if(designerPick?.kind==='regimental')state[side+'RegimentalSupports'][designerPick.c]=value&&regimentalBaselineCompatible(side,designerPick.c,value)?value:null;\\n    syncDesignerSide(side);designerPick=null;save();shell();","if(designerPick?.kind==='regimental')state[side+'RegimentalSupports'][designerPick.c]=value&&regimentalBaselineCompatible(side,designerPick.c,value)?value:null;\\n    syncDesignerSide(side);designerPick=null;save();refreshDivisionLab();",'picker selection handler');`;
if(!text.includes(old))throw new Error('Could not find the performance picker-selection marker to update.');
text=text.replace(old,next);
await writeFile(file,text);
console.log('Aligned performance picker marker with regimental compatibility guard.');

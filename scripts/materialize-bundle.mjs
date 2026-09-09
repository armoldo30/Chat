import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const sourceFiles=[
  'q1_01.js','q1_bridge.js','q1b_01.js','q1b_02.js','q1b_03.js','q1b_04.js','q1b_05.js','q1b_06.js',
  'q2_01.js','q2_02.js','q2_03.js','q2_04.js','q2_05.js','q2_06.js','q2_07.js',
  'q3_01.js','q3_02.js','q3_03.js','q3_04.js','q3_05.js','q3_06.js'
];
const sourceDir=new URL('../src/builtin1192/',import.meta.url);
const outDir=new URL('../src/builtin1192raw/',import.meta.url);
const pieces=sourceFiles.map(name=>{
  const text=fs.readFileSync(new URL(name,sourceDir),'utf8');
  const match=text.match(/export default '([A-Za-z0-9+/=]+)'/s);
  if(!match)throw new Error(`Cannot read ${name}`);
  return match[1];
});
const compressed=Buffer.from(pieces.join(''),'base64');
const raw=zlib.gunzipSync(compressed).toString('utf8');
const hash=crypto.createHash('sha256').update(Buffer.from(raw,'utf8')).digest('hex');
if(Buffer.byteLength(raw,'utf8')!==1096485||hash!=='75f24d5adea04be19f3ac8ed7d321435b5b69b48cbd57f550953390e13f78c52'){
  throw new Error('Refusing to materialize non-authoritative data');
}
const pack=JSON.parse(raw);
const requirementRelationships=Object.values(pack.requirements||{}).reduce((total,group)=>total+Object.values(group||{}).reduce((n,list)=>n+(Array.isArray(list)?list.length:0),0),0);
if(requirementRelationships!==679)throw new Error(`Unexpected embedded prerequisite relationship count ${requirementRelationships}`);
const size=50000;
const chunks=[];
for(let i=0;i<raw.length;i+=size)chunks.push(raw.slice(i,i+size));
if(chunks.length!==22)throw new Error(`Expected 22 raw chunks, got ${chunks.length}`);
fs.rmSync(outDir,{recursive:true,force:true});
fs.mkdirSync(outDir,{recursive:true});
chunks.forEach((chunk,i)=>fs.writeFileSync(new URL(`r${String(i+1).padStart(2,'0')}.js`,outDir),`export default ${JSON.stringify(chunk)};\n`));
console.log(`materialized ${chunks.length} authoritative runtime chunks (${raw.length} chars) with ${requirementRelationships} embedded prerequisite relationships`);

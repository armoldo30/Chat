import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const files=[
  'q1_01.js','q1_bridge.js','q1b_01.js','q1b_02.js','q1b_03.js','q1b_04.js','q1b_05.js','q1b_06.js',
  'q2_01.js','q2_02.js','q2_03.js','q2_04.js','q2_05.js','q2_06.js','q2_07.js',
  'q3_01.js','q3_02.js','q3_03.js','q3_04.js','q3_05.js','q3_06.js'
];
const base=new URL('../src/builtin1192/',import.meta.url);
const pieces=files.map(name=>{
  const text=fs.readFileSync(new URL(name,base),'utf8');
  const m=text.match(/export default '([A-Za-z0-9+/=]+)'/s);
  if(!m)throw new Error(`Cannot extract base64 from ${name}`);
  return m[1];
});
const data=pieces.join('');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
console.log('bundle pieces',files.length,'base64 length',data.length,'sha256',sha(data));
if(data.length!==135544)throw new Error(`Unexpected base64 length ${data.length}; expected 135544`);
if(sha(data)!=='89a1a8b06abfa5771569eae611749a654be8ce5a5cb16b84f409e5d4da0206bb')throw new Error('Repository base64 stream differs from authoritative local source');
const raw=Buffer.from(data,'base64');
console.log('gzip bytes',raw.length,'sha256',sha(raw));
if(raw.length!==101658)throw new Error(`Unexpected gzip byte length ${raw.length}; expected 101658`);
if(sha(raw)!=='85ce01ed8c092b3d3e377bc78bc0fca54ec04393ea6b03868b452c36a6782d18')throw new Error('Repository gzip bytes differ from authoritative local source');
const decoded=zlib.gunzipSync(raw);
console.log('decoded bytes',decoded.length,'sha256',sha(decoded));
if(decoded.length!==1096485)throw new Error(`Unexpected decoded length ${decoded.length}; expected 1096485`);
if(sha(decoded)!=='75f24d5adea04be19f3ac8ed7d321435b5b69b48cbd57f550953390e13f78c52')throw new Error('Decoded JSON differs from authoritative local source');
const pack=JSON.parse(decoded.toString('utf8'));
if(pack?.meta?.gameVersion!=='1.19.2'||pack?.meta?.requirementRecords!==679)throw new Error('Unexpected bundled metadata');
console.log('bundle integrity verified',pack.meta.gameVersion,pack.meta.requirementRecords);

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pruneUnreachableRuntimeJs } from '../scripts/prune-runtime-dist.mjs';

const root=await mkdtemp(resolve(tmpdir(),'hoi4-runtime-prune-'));
try{
  await mkdir(resolve(root,'src','builtin1192raw'),{recursive:true});
  await writeFile(resolve(root,'index.html'),'<script type="module" src="./src/main.js?v=test"></script>');
  await writeFile(resolve(root,'src','main.js'),"import './engine.js?v=test'; import './builtin1193-runtime.js?v=test';");
  await writeFile(resolve(root,'src','engine.js'),"import './nested.js?v=test';");
  await writeFile(resolve(root,'src','nested.js'),'export const ok=true;');
  await writeFile(resolve(root,'src','builtin1193-runtime.js'),'export default {};');
  await writeFile(resolve(root,'src','unused-certification.js'),'export const sourceOnly=true;');
  await writeFile(resolve(root,'src','builtin1192raw','r01.js'),'export default "raw";');

  const result=await pruneUnreachableRuntimeJs(root);
  assert.equal(result.before,6);
  assert.equal(result.after,4);
  for(const file of ['src/main.js','src/engine.js','src/nested.js','src/builtin1193-runtime.js']){
    await access(resolve(root,file));
  }
  for(const file of ['src/unused-certification.js','src/builtin1192raw/r01.js']){
    await assert.rejects(access(resolve(root,file)));
  }
  assert.ok(result.removed.includes('src/builtin1192raw/r01.js'));
}finally{
  await rm(root,{recursive:true,force:true});
}

console.log('Public runtime dependency pruning passed.');

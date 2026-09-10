import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const chunks=[];
for(let i=1;i<=22;i++){
  const id=String(i).padStart(2,'0');
  const {default:chunk}=await import(`../src/builtin1192raw/r${id}.js`);
  chunks.push(chunk);
}
const text=chunks.join('');
const sha=value=>createHash('sha256').update(value).digest('hex');

assert.equal(text.length,1096485,'authoritative plain JSON payload length');
assert.equal(sha(text),'75f24d5adea04be19f3ac8ed7d321435b5b69b48cbd57f550953390e13f78c52','authoritative plain JSON payload hash');
const pack=JSON.parse(text);
assert.equal(pack.meta.gameVersion,'1.19.2');
assert.equal(pack.meta.requirementRecords,679,'base authoritative prerequisite relationships');
console.log('bundled 1.19.2 plain-data integrity passed');

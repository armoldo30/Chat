import assert from 'node:assert/strict';
import { counterSnapshot } from '../src/counter-state-model.js';
import { runCounterSearch } from '../src/counter-search.js';
const s=counterSnapshot();
const r=runCounterSearch(s,{runs:50,firstStepLimit:8,beamWidth:2,secondPerSeedLimit:6,secondStepLimit:5});
assert.equal(r.maxDepth,2);
assert.ok(r.oneChangeCount>0);
assert.ok(r.multiChangeCount>0);
assert.equal(r.testedCount,r.oneChangeCount+r.multiChangeCount);
assert.ok(Number.isFinite(r.baseline.winRate));
assert.equal('unpricedCount' in r,false);
for(const item of r.ranked){
  assert.ok(item.changeCount===1||item.changeCount===2);
  assert.ok(Number.isFinite(item.winRate)&&Number.isFinite(item.ic));
  assert.equal(item.changeKinds?.length,item.changeCount);
  assert.ok(!(item.changeKinds||[]).includes('equipment-tech'));
}
console.log('Counter search runtime smoke passed.');

import assert from 'node:assert/strict';
import { counterSnapshot } from '../src/counter-state-model.js';
import { runCounterSearch, COUNTER_SEARCH_DEFAULTS } from '../src/counter-search.js';
const s=counterSnapshot();
const started=Date.now();
const r=runCounterSearch(s);
const elapsed=Date.now()-started;
assert.deepEqual(COUNTER_SEARCH_DEFAULTS,{runs:50,firstStepLimit:18,beamWidth:3,secondPerSeedLimit:10,secondStepLimit:8});
assert.equal(r.maxDepth,2);
assert.ok(r.oneChangeCount>0);
assert.ok(r.multiChangeCount>0);
assert.equal(r.testedCount,r.oneChangeCount+r.multiChangeCount);
assert.ok(r.testedCount<=COUNTER_SEARCH_DEFAULTS.firstStepLimit+COUNTER_SEARCH_DEFAULTS.secondStepLimit,'default search must stay inside the browser-safe candidate budget');
assert.ok(Number.isFinite(r.baseline.winRate));
assert.ok(r.bestTested&&Number.isFinite(r.bestTested.winRate)&&Number.isFinite(r.bestTested.gain),'search must preserve the strongest tested attempt even when nothing clears the recommendation threshold');
assert.ok(Array.isArray(r.bestEfforts)&&r.bestEfforts.length>0&&r.bestEfforts.length<=5,'search must retain a small near-miss set for no-counter diagnostics');
assert.equal(r.meaningfulThreshold,2);
assert.equal('unpricedCount' in r,false);
for(const item of r.ranked){
  assert.ok(item.changeCount===1||item.changeCount===2);
  assert.ok(Number.isFinite(item.winRate)&&Number.isFinite(item.ic));
  assert.equal(item.changeKinds?.length,item.changeCount);
  assert.ok(!(item.changeKinds||[]).includes('equipment-tech'));
}
const recommendationKeys=(r.recommendations||[]).map(group=>group.item.key);
assert.equal(new Set(recommendationKeys).size,recommendationKeys.length,'headline recommendations must never repeat the same candidate');
assert.ok((r.recommendations||[]).length<=3);
console.log(`Counter search runtime smoke passed: ${r.testedCount} candidates in ${elapsed} ms.`);

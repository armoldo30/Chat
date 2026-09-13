import assert from 'node:assert/strict';
import { counterSnapshot } from '../src/counter-state-model.js';
import { runCounterSearch } from '../src/counter-search.js';

const snapshot=counterSnapshot();
assert.ok(snapshot.attacker?.battalions>0,'default Counter Analysis attacker must be usable without saved browser state');
assert.ok(snapshot.defender?.battalions>0,'default Counter Analysis defender must be usable without saved browser state');

const result=runCounterSearch(snapshot,{runs:50,firstStepLimit:8,beamWidth:2,secondPerSeedLimit:6,secondStepLimit:5});
assert.equal(result.maxDepth,2,'counter search must report two-step depth');
assert.ok(result.oneChangeCount>0,'counter search must evaluate first-step candidates');
assert.ok(result.multiChangeCount>0,'counter search must evaluate second-step candidates');
assert.equal(result.testedCount,result.oneChangeCount+result.multiChangeCount,'counter search candidate accounting must balance');
assert.ok(Number.isFinite(result.baseline.winRate),'counter search must produce a finite baseline win rate');
for(const item of result.ranked){
  assert.ok(item.changeCount===1||item.changeCount===2,'ranked counters must stay within the declared search depth');
  assert.ok(Number.isFinite(item.winRate)&&Number.isFinite(item.ic),'ranked counters must include modeled combat and cost results');
}

console.log('Counter search runtime smoke passed.');

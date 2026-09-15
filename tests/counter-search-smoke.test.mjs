import assert from 'node:assert/strict';
import { counterSnapshot } from '../src/counter-state-model.js';
import { runCounterSearch, COUNTER_SEARCH_DEFAULTS, counterProductionPracticality, chooseCounterHighlights, buildCounterRecommendationGroups } from '../src/counter-search.js';
const s=counterSnapshot();
const started=Date.now();
const r=runCounterSearch(s);
const elapsed=Date.now()-started;
assert.deepEqual(COUNTER_SEARCH_DEFAULTS,{runs:50,firstStepLimit:18,beamWidth:3,secondPerSeedLimit:10,secondStepLimit:8});
assert.equal(r.side,'attacker');
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
  assert.ok(item.practicality&&typeof item.practicality.majorRetooling==='boolean','ranked counters must carry production-practicality metadata');
  assert.ok(item.operationalBurden&&Number.isFinite(item.operationalBurden.supplyPct),'ranked counters must carry explicit supply-use practicality metadata');
}
const recommendationKeys=(r.recommendations||[]).map(group=>group.item.key);
assert.equal(new Set(recommendationKeys).size,recommendationKeys.length,'headline recommendations must never repeat the same candidate');
assert.ok((r.recommendations||[]).length<=3);

const defenderRun=runCounterSearch(s,{side:'defender',runs:50,firstStepLimit:6,beamWidth:1,secondPerSeedLimit:1,secondStepLimit:0});
assert.equal(defenderRun.side,'defender','the same search engine must optimize the defending division when requested');
assert.equal(defenderRun.multiChangeCount,0);
assert.ok(defenderRun.oneChangeCount>0&&Number.isFinite(defenderRun.baseline.winRate));
assert.ok(defenderRun.bestTested&&defenderRun.bestTested.side==='defender','defender candidate identity must survive full battle simulation and ranking');

const heavyGrid=structuredClone(s.state.attackerGrid);
let inserted=false;
for(const column of heavyGrid){for(let row=0;row<column.length;row++){if(!column[row]){column[row]='heavy_armor';inserted=true;break;}}if(inserted)break;}
assert.ok(inserted,'fixture must have room to introduce heavy armor');
const heavyPracticality=counterProductionPracticality(s,{grid:heavyGrid});
assert.equal(heavyPracticality.majorRetooling,true,'introducing a new heavy-armor family must be treated as major production retooling');
assert.deepEqual(heavyPracticality.introducedArmorFamilies,['heavy']);
assert.ok(heavyPracticality.resourceKeys.includes('chromium'),'heavy-armor retooling should surface the current chromium input baseline');
assert.ok(heavyPracticality.searchPenalty>0&&heavyPracticality.valuePenalty>0,'new armor families must carry search and value practicality penalties');

const heavy={key:'heavy',label:'Add Heavy Armor',gain:20,value:.5,changeCount:1,deltaIC:500,practicality:{majorRetooling:true}},at={key:'at',label:'Add Support Anti-Tank',gain:9,value:.2,changeCount:1,deltaIC:50,practicality:{majorRetooling:false}},support={key:'support',label:'Swap Support Company',gain:6,value:.15,changeCount:1,deltaIC:20,practicality:{majorRetooling:false}};
const picks=chooseCounterHighlights([heavy,at,support]);
assert.equal(picks.best.key,'heavy','Best Raw may still expose the strongest theoretical armored answer');
assert.equal(picks.value.key,'at','Best Value must prefer a meaningful local counter over a new armor production chain');
assert.equal(picks.minimal.key,'support','Smallest Change must prefer a meaningful local edit over major retooling');
const practicalGroups=buildCounterRecommendationGroups(picks,[heavy,at,support]);
assert.deepEqual(practicalGroups.map(group=>group.item.key),['heavy','at','support'],'headline cards should retain raw strength while filling practical categories with local counters');

console.log(`Counter search runtime smoke passed: ${r.testedCount} attacker candidates + ${defenderRun.testedCount} defender candidates in ${Date.now()-started} ms.`);

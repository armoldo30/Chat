import assert from 'node:assert/strict';
import { counterSnapshot } from '../src/counter-state-model.js';
import BUILTIN_1193 from '../src/builtin1193.js';
import { battalions, supports, equipment, terrain } from '../src/data.js';
import { hydrateGameData } from '../src/gameData.js';
import { applyRegimentalSupportCompatibilityFallback } from '../src/regimental-support-1193.js';
import { runCounterSearch, COUNTER_SEARCH_DEFAULTS, COUNTER_DEEP_SEARCH_DEFAULTS, counterProductionPracticality, chooseCounterHighlights, buildCounterRecommendationGroups, selectDiverseCounterCandidates } from '../src/counter-search.js';
hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});
applyRegimentalSupportCompatibilityFallback(supports);
const s=counterSnapshot();
const started=Date.now();
const r=runCounterSearch(s);
const elapsed=Date.now()-started;
assert.deepEqual(COUNTER_SEARCH_DEFAULTS,{runs:50,firstStepLimit:20,beamWidth:4,secondPerSeedLimit:12,secondStepLimit:10,previewMultiplier:4});
assert.deepEqual(COUNTER_DEEP_SEARCH_DEFAULTS,{deep:false,thirdBeamWidth:3,thirdPerSeedLimit:8,thirdStepLimit:6});
const tinyDiverse=selectDiverseCounterCandidates([
  {key:'line',kind:'add-line',label:'Line',previewScore:4},
  {key:'support',kind:'add-support',label:'Support',previewScore:3},
  {key:'regimental',kind:'add-regimental-support',label:'Regimental',previewScore:2},
  {key:'tank',kind:'tank-design',label:'Tank',previewScore:1}
],2);
assert.equal(tinyDiverse.length,2,'diversity reservations must never exceed an explicit candidate limit');
assert.equal(r.side,'attacker');
assert.equal(r.maxDepth,2);
assert.ok(r.oneChangeCount>0);
assert.ok(r.multiChangeCount>0);
assert.equal(r.twoChangeCount,r.multiChangeCount,'normal search multi-change accounting should still be entirely second-step');
assert.equal(r.threeChangeCount,0,'normal search must never pay the deep-redesign cost');
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
  assert.ok(item.battleQuality&&Number.isFinite(item.battleQuality.casualtyExchange),'ranked counters must retain battle-derived strength-loss exchange for saturated win-rate ties');
}
const recommendationKeys=(r.recommendations||[]).map(group=>group.item.key);
assert.equal(new Set(recommendationKeys).size,recommendationKeys.length,'headline recommendations must never repeat the same candidate');
assert.ok((r.recommendations||[]).length<=3);
assert.ok(r.coverage&&r.coverage.line>0&&r.coverage.support>0,'search result must expose structural candidate coverage');
assert.ok(r.coverage.softAttackImprovement>0&&r.coverage.survivalImprovement>0,'search result must expose matchup-stat coverage');

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
assert.equal(picks.value.key,'heavy','Best Efficient must not hard-exclude the strongest value result merely because it opens an armor production chain');
assert.equal(picks.minimal.key,'support','Smallest Change must prefer a meaningful local edit over major retooling');
const practicalGroups=buildCounterRecommendationGroups(picks,[heavy,at,support]);
assert.deepEqual(practicalGroups.map(group=>group.item.key),['heavy','support','at'],'headline cards should deduplicate a dominant raw/value winner and still surface distinct alternatives');

console.log(`Counter search runtime smoke passed: ${r.testedCount} attacker candidates + ${defenderRun.testedCount} defender candidates in ${Date.now()-started} ms.`);

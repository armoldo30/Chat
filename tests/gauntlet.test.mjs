import assert from 'node:assert/strict';
import { battalions, supports, equipment, terrain } from '../src/data.js';
import { calcDivision } from '../src/engine.js';
import { GAUNTLET_ARCHETYPES, GAUNTLET_TERRAINS, generateOpponentPool, screenBattle, runGauntlet, gauntletGrade } from '../src/gauntlet.js';

const pool=generateOpponentPool(500,{battalions,supports,equipment});
assert.equal(pool.length,500,'Quick Gauntlet must generate 500 designs');
assert.equal(new Set(pool.map(x=>x.archetype)).size,GAUNTLET_ARCHETYPES.length,'all archetypes must appear in Quick pool');
assert.ok(pool.every(x=>x.stats.width>0&&x.stats.org>0&&x.stats.hp>0),'every generated opponent must be combat-capable');
assert.ok(pool.every(x=>x.lines.length>0&&x.lines.reduce((s,r)=>s+r.count,0)<=25),'generated templates must contain 1-25 line battalions');
assert.ok(pool.every(x=>x.supports.length<=5),'generated templates must not exceed five divisional supports');
assert.deepEqual(generateOpponentPool(12,{battalions,supports,equipment}).map(x=>[x.archetype,x.targetWidth,x.quality,x.doctrine]),generateOpponentPool(12,{battalions,supports,equipment}).map(x=>[x.archetype,x.targetWidth,x.quality,x.doctrine]),'opponent generation must be deterministic');

const full=generateOpponentPool(10000,{battalions,supports,equipment});
assert.equal(full.length,10000,'Full Gauntlet must generate 10,000 designs');
assert.ok(GAUNTLET_TERRAINS.every(k=>terrain[k]),'all eight required Gauntlet terrains must exist in active terrain data');

const candidate=calcDivision([{type:'infantry',count:9},{type:'artillery',count:1}],battalions,['engineer','support_artillery'].filter(k=>supports[k]),supports);
const opts={terrain:'plains',terrainData:terrain,planning:.3,asupply:1,dsupply:1,air:0,cas:0,night:0,fort:0,river:0,directions:0,entrench:10};
const screen=screenBattle(candidate,pool[0].stats,opts);
assert.ok(screen.attackerScore>=0&&screen.attackerScore<=100,'screened attack score must be bounded');
assert.ok(Math.abs(screen.attackerScore+screen.defenderScore-100)<1e-9,'screened sides must be complementary');

const result=await runGauntlet({candidate,data:{battalions,supports},equipment,baseOpts:opts,count:32,terrainKeys:['plains','forest'],stochasticRuns:0});
for(const key of ['rawScore','practicalScore','offense','defense','icEfficiency','supplyEfficiency','terrainVersatility','consistency','counterResilience','percentile'])assert.ok(Number.isFinite(result[key]),`${key} must be finite`);
assert.equal(result.matchups,32*2*2,'matchup census must be opponents × terrains × attack/defense');
assert.equal(Object.keys(result.terrainScores).length,2,'requested terrain subset must be honored');
assert.equal(result.bestMatchups.length,5);assert.equal(result.worstMatchups.length,5);
assert.equal(result.stress.length,4,'stress-test suite must include four launch scenarios');
assert.equal(result.validation.samples,0,'stochastic validation must be suppressible for deterministic tests');
assert.ok(['S','A+','A','A-','B+','B','B-','C+','C','C-','D','F'].includes(gauntletGrade(result.practicalScore)),'grade must use published scale');
assert.equal(result.evidence,'planner-analytical-opponent-generation + certified-bounded-combat-engine');

console.log('Division Gauntlet generator/scoring invariants passed.');

import assert from 'node:assert/strict';
import { battalions, supports, equipment, terrain } from '../src/data.js';
import { calcDivision } from '../src/engine.js';
import { runGauntlet, GAUNTLET_TERRAINS } from '../src/gauntlet.js';

const candidate=calcDivision(
  [{type:'infantry',count:9},{type:'artillery',count:1}],
  battalions,
  ['engineer','support_artillery'],
  supports
);
const baseOpts={terrain:'plains',terrainData:terrain,planning:.3,asupply:1,dsupply:1,air:0,cas:0,night:0,fort:0,river:0,directions:0,entrench:10};
const start=Date.now();
const result=await runGauntlet({
  candidate,
  data:{battalions,supports},
  equipment,
  opponentData:{battalions,supports},
  opponentEquipment:equipment,
  candidateEquipment:equipment,
  baseOpts,
  count:10000,
  terrainKeys:GAUNTLET_TERRAINS,
  stochasticRuns:0
});
const elapsedMs=Date.now()-start;
assert.equal(result.opponents,10000);
assert.equal(result.terrainCount,8);
assert.equal(result.matchups,160000,'Full Gauntlet must execute the advertised 160,000 screened matchup matrix');
assert.equal(Object.keys(result.terrainScores).length,8);
assert.ok(Number.isFinite(result.rawScore)&&Number.isFinite(result.practicalScore));
assert.ok(result.bestMatchups.length===5&&result.worstMatchups.length===5);
assert.ok(result.percentile>=0&&result.percentile<=100);
assert.equal(result.validation.samples,0,'full smoke intentionally excludes second-stage Monte Carlo cost');
console.log(`Full Division Gauntlet smoke passed: ${result.matchups.toLocaleString()} matchups in ${elapsedMs} ms.`);

import assert from 'node:assert/strict';
import BUILTIN_1193 from '../src/builtin1193.js';
import { battalions, supports, equipment, terrain } from '../src/data.js';
import { hydrateGameData } from '../src/gameData.js';
import { countsToGrid } from '../src/designer.js';
import { ordinaryDivisionBattalionIds } from '../src/division-designer-options.js';
import { applyRegimentalSupportCompatibilityFallback, REGIMENTAL_SUPPORT_IDS_1193 } from '../src/regimental-support-1193.js';
import { counterBattalionCandidateIds, counterDivisionalSupportIds, counterRegimentalSupportIds, counterTemplateKey, buildCounterCandidates } from '../src/counter-candidates.js';

hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});
applyRegimentalSupportCompatibilityFallback(supports);

const lineIds=counterBattalionCandidateIds(battalions);
for(const id of ['medium_tank_destroyer_brigade','medium_sp_artillery_brigade','medium_sp_anti_air_brigade']){
  assert.ok(lineIds.includes(id),`Counter catalog should consider ${id}`);
}
for(const id of ['hq_infantry','hq_motorized','hq_light_armor','hq_medium_armor','hq_heavy_armor']){
  if(battalions[id])assert.ok(!lineIds.includes(id),`Counter catalog must exclude HQ-only ${id}`);
}

const divisionalSupportIds=counterDivisionalSupportIds(supports);
assert.ok(divisionalSupportIds.length>7,'Counter must no longer use the old seven-company support whitelist');
for(const id of ['maintenance','field_hospital']){
  if(supports[id])assert.ok(divisionalSupportIds.includes(id),`Counter should consider divisional support ${id}`);
}
for(const id of REGIMENTAL_SUPPORT_IDS_1193)assert.ok(!divisionalSupportIds.includes(id),`Regimental Support ${id} must stay out of divisional-support candidates`);

const regimentalIds=counterRegimentalSupportIds(supports);
assert.equal(regimentalIds.length,REGIMENTAL_SUPPORT_IDS_1193.length,'Counter should see the complete 1.19.3 Regimental Support catalog');

const valid=ordinaryDivisionBattalionIds(battalions);
const grid=countsToGrid([{type:'infantry',count:3},{type:'medium_armor',count:3}],valid,battalions);
const state={
  attackerGrid:grid,
  attackerSupports:['engineer'],
  attackerRegimentalSupports:[null,null,null,null,null],
  attackerDivisions:3,
  battlefield:{terrain:'plains',air:0,cas:0}
};
const snapshot={
  state,
  attacker:{soft:40,hard:10,def:80,breakthrough:30,org:45,hp:100,supply:1,piercing:20,armor:0,airAttack:0,hardness:.1},
  defender:{soft:70,hard:60,def:180,breakthrough:80,org:45,hp:100,supply:1.5,piercing:70,armor:65,airAttack:0,hardness:.9}
};
const candidates=buildCounterCandidates(snapshot,{side:'attacker',state,grid,supportKeys:state.attackerSupports,limit:300,battalionMap:battalions,supportMap:supports});
assert.ok(candidates.some(item=>item.kind==='add-regimental-support'),'Counter search should generate Regimental Support edits for eligible regiments');
assert.ok(candidates.some(item=>item.counterRole==='line'),'Counter search should retain line-battalion candidates');
assert.ok(candidates.some(item=>item.counterRole==='support'),'Counter search should retain divisional-support candidates');
assert.ok(candidates.some(item=>item.counterRole==='regimental'),'Counter search should retain Regimental Support candidates');

const noReg=counterTemplateKey(grid,['engineer'],[null,null,null,null,null]);
const withReg=counterTemplateKey(grid,['engineer'],['anti_tank_battery',null,null,null,null]);
assert.notEqual(noReg,withReg,'Regimental Support layout must be part of Counter candidate identity');

console.log('Counter 1.19.3 candidate-universe checks passed.');

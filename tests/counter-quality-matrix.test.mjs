import assert from 'node:assert/strict';
import { battalions } from '../src/data.js';
import { countsToGrid } from '../src/designer.js';
import { ordinaryDivisionBattalionIds } from '../src/division-designer-options.js';
import { divisionEquipmentIC } from '../src/engine.js';
import { counterSnapshot, counterDivision, counterEquipment } from '../src/counter-state-model.js';
import { diagnoseMatchup } from '../src/counter-diagnosis.js';
import { runCounterSearch } from '../src/counter-search.js';

const base=counterSnapshot();
const valid=ordinaryDivisionBattalionIds(battalions);

function makeSnapshot({
  attacker=[{type:'infantry',count:9},{type:'artillery',count:1}],
  defender=[{type:'infantry',count:10}],
  attackerSupports=['engineer','support_artillery'],
  defenderSupports=['engineer','support_artillery'],
  attackerRegimental=[null,null,null,null,null],
  defenderRegimental=[null,null,null,null,null],
  battlefield={}
}={}){
  const state=structuredClone(base.state);
  state.attackerGrid=countsToGrid(attacker,valid,battalions);
  state.defenderGrid=countsToGrid(defender,valid,battalions);
  state.attackerSupports=[...attackerSupports];state.defenderSupports=[...defenderSupports];
  state.attackerRegimentalSupports=[...attackerRegimental];state.defenderRegimentalSupports=[...defenderRegimental];
  state.attackerDivisions=3;state.defenderDivisions=3;
  state.battlefield={...state.battlefield,terrain:'plains',directions:0,entrench:0,fort:0,river:0,asupply:1,dsupply:1,air:0,cas:0,planning:0,night:0,runs:60,seed:7719,...battlefield};
  const attackerStats=counterDivision(state,'attacker'),defenderStats=counterDivision(state,'defender');
  return {
    state,
    attacker:attackerStats,
    defender:defenderStats,
    attackerIC:divisionEquipmentIC(attackerStats.need,counterEquipment(state,'attacker')),
    defenderIC:divisionEquipmentIC(defenderStats.need,counterEquipment(state,'defender')),
    fingerprint:JSON.stringify({a:state.attackerGrid,d:state.defenderGrid,as:state.attackerSupports,ds:state.defenderSupports,ar:state.attackerRegimentalSupports,dr:state.defenderRegimentalSupports,b:state.battlefield})
  };
}
function inspect(name,snapshot,{side='attacker'}={}){
  const targetSide=side==='attacker'?'defender':'attacker';
  const diagnosis=diagnoseMatchup(snapshot[side],snapshot[targetSide],{side,battlefield:snapshot.state.battlefield});
  const result=runCounterSearch(snapshot,{side,runs:60,firstStepLimit:20,beamWidth:4,secondPerSeedLimit:12,secondStepLimit:10,previewMultiplier:4});
  const top=(result.ranked.length?result.ranked:result.bestEfforts).slice(0,5).map(item=>({
    label:item.label,gain:+item.gain.toFixed(2),win:+item.winRate.toFixed(2),piercing:+item.stats.piercing.toFixed(1),armor:+item.stats.armor.toFixed(1),soft:+item.stats.soft.toFixed(1),hard:+item.stats.hard.toFixed(1),def:+item.stats.def.toFixed(1),breakthrough:+item.stats.breakthrough.toFixed(1),airAttack:+item.stats.airAttack.toFixed(1),kind:item.kind,kinds:item.changeKinds
  }));
  const recommendations=(result.recommendations||[]).map(group=>({roles:group.roles,label:group.item.label,gain:+group.item.gain.toFixed(2),kind:group.item.kind,kinds:group.item.changeKinds,pierces:group.item.pierces,airAttack:+group.item.stats.airAttack.toFixed(1)}));
  console.log('COUNTER_QUALITY',JSON.stringify({name,side,priorities:diagnosis.priorities,baseline:+result.baseline.winRate.toFixed(2),source:{armor:+snapshot[side].armor.toFixed(1),piercing:+snapshot[side].piercing.toFixed(1),hardness:+snapshot[side].hardness.toFixed(3)},target:{armor:+snapshot[targetSide].armor.toFixed(1),piercing:+snapshot[targetSide].piercing.toFixed(1),hardness:+snapshot[targetSide].hardness.toFixed(3)},recommendations,top}));
  assert.equal(result.testedCount,30,name+': quality audit should exercise the normal 20+10 battle-test budget');
  assert.ok(result.bestTested&&Number.isFinite(result.bestTested.gain),name+': search must return a strongest tested result');
  assert.ok(top.length>0,name+': audit must retain observable top candidates');
  return {diagnosis,result,top,snapshot};
}

const soft=inspect('soft-infantry',makeSnapshot({
  attacker:[{type:'infantry',count:9}],
  defender:[{type:'infantry',count:10}],
  attackerSupports:['engineer'],
  defenderSupports:['engineer']
}));
assert.ok(soft.diagnosis.priorities.includes('soft-attack'),'soft infantry target should prioritize soft attack');

const armor=inspect('infantry-vs-medium-armor',makeSnapshot({
  attacker:[{type:'infantry',count:9},{type:'artillery',count:1}],
  defender:[{type:'medium_armor',count:2},{type:'motorized',count:10}],
  attackerSupports:['engineer','support_artillery'],
  defenderSupports:['engineer','maintenance']
}));
assert.ok(armor.diagnosis.priorities.includes('piercing'),'an unpierced armor target should prioritize piercing');
assert.ok([...armor.result.ranked,...armor.result.bestEfforts].some(item=>item.pierces),'a reachable armor threshold should cause Counter to battle-test at least one candidate that actually pierces');

const hardArmor=inspect('armor-vs-hard-armor',makeSnapshot({
  attacker:[{type:'medium_armor',count:5},{type:'mechanized',count:7}],
  defender:[{type:'heavy_armor',count:8},{type:'mechanized',count:4}],
  attackerSupports:['engineer','maintenance'],
  defenderSupports:['engineer','maintenance']
}));
assert.ok(hardArmor.diagnosis.hardness>=.6,'hard-armor fixture must actually be at least 60% hard');
assert.ok(hardArmor.diagnosis.priorities.includes('hard-attack'),'hard armor target should prioritize hard attack');
assert.ok([...hardArmor.result.ranked,...hardArmor.result.bestEfforts].some(item=>item.stats.hard>hardArmor.snapshot.attacker.hard),'hard-armor search should battle-test at least one answer that raises hard attack');

const air=inspect('cas-pressure',makeSnapshot({
  attacker:[{type:'infantry',count:9},{type:'artillery',count:1}],
  defender:[{type:'infantry',count:10}],
  attackerSupports:['engineer','support_artillery'],
  defenderSupports:['engineer','support_artillery'],
  battlefield:{air:-60,cas:40}
}));
assert.ok(air.diagnosis.priorities.includes('air-attack'),'enemy air/CAS pressure should prioritize air attack');

const defense=inspect('defender-staying-power',makeSnapshot({
  attacker:[{type:'infantry',count:7},{type:'artillery',count:3}],
  defender:[{type:'infantry',count:8}],
  attackerSupports:['engineer','support_artillery'],
  defenderSupports:['engineer']
}),{side:'defender'});
assert.ok(defense.diagnosis.priorities.includes('defense')||defense.result.baseline.winRate>=65,'defender search should flag defense when incoming pressure exceeds current staying power');

const regimental=inspect('regimental-small-change',makeSnapshot({
  attacker:[{type:'infantry',count:3}],
  defender:[{type:'infantry',count:4}],
  attackerSupports:['engineer','recon','logistics','signal','support_artillery'],
  defenderSupports:['engineer']
}));
assert.ok(regimental.result.bestEfforts.some(item=>(item.changeKinds||[]).some(kind=>kind.includes('regimental-support')))||regimental.result.ranked.some(item=>(item.changeKinds||[]).some(kind=>kind.includes('regimental-support'))),'eligible full-support template should battle-test at least one Regimental Support answer');

console.log('Counter recommendation-quality matrix audit completed.');

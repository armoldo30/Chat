import assert from 'node:assert/strict';
import { battalions, supports, equipment, terrain } from '../src/data.js';
import BUILTIN_1193 from '../src/builtin1193.js';
import { hydrateGameData } from '../src/gameData.js';
import { applyRegimentalSupportCompatibilityFallback } from '../src/regimental-support-1193.js';
import { countsToGrid } from '../src/designer.js';
import { ordinaryDivisionBattalionIds } from '../src/division-designer-options.js';
import { divisionEquipmentIC } from '../src/engine.js';
import { counterSnapshot, counterDivision, counterEquipment } from '../src/counter-state-model.js';
import { diagnoseMatchup } from '../src/counter-diagnosis.js';
import { runCounterSearch } from '../src/counter-search.js';

hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});
applyRegimentalSupportCompatibilityFallback(supports);
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
  const result=runCounterSearch(snapshot,{side,runs:50,firstStepLimit:10,beamWidth:3,secondPerSeedLimit:6,secondStepLimit:4,previewMultiplier:2});
  const top=(result.ranked.length?result.ranked:result.bestEfforts).slice(0,5).map(item=>({
    label:item.label,gain:+item.gain.toFixed(2),win:+item.winRate.toFixed(2),piercing:+item.stats.piercing.toFixed(1),armor:+item.stats.armor.toFixed(1),soft:+item.stats.soft.toFixed(1),hard:+item.stats.hard.toFixed(1),def:+item.stats.def.toFixed(1),breakthrough:+item.stats.breakthrough.toFixed(1),airAttack:+item.stats.airAttack.toFixed(1),kind:item.kind,kinds:item.changeKinds
  }));
  const recommendations=(result.recommendations||[]).map(group=>({roles:group.roles,label:group.item.label,gain:+group.item.gain.toFixed(2),kind:group.item.kind,kinds:group.item.changeKinds,pierces:group.item.pierces,airAttack:+group.item.stats.airAttack.toFixed(1)}));
  console.log('COUNTER_QUALITY',JSON.stringify({name,side,priorities:diagnosis.priorities,baseline:+result.baseline.winRate.toFixed(2),coverage:result.coverage,source:{armor:+snapshot[side].armor.toFixed(1),piercing:+snapshot[side].piercing.toFixed(1),hardness:+snapshot[side].hardness.toFixed(3)},target:{armor:+snapshot[targetSide].armor.toFixed(1),piercing:+snapshot[targetSide].piercing.toFixed(1),hardness:+snapshot[targetSide].hardness.toFixed(3)},recommendations,top}));
  assert.ok(result.testedCount>0&&result.testedCount<=14,name+': quality certification should stay inside the compact 10+4 battle-test budget');
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
assert.ok(soft.result.coverage.softAttackImprovement>0,'soft-target search must battle-test at least one soft-attack improvement');

const armor=inspect('infantry-vs-medium-armor',makeSnapshot({
  attacker:[{type:'infantry',count:9},{type:'artillery',count:1}],
  defender:[{type:'medium_armor',count:2},{type:'motorized',count:10}],
  attackerSupports:['engineer','support_artillery'],
  defenderSupports:['engineer','maintenance']
}));
assert.ok(armor.diagnosis.priorities.includes('piercing'),'an unpierced armor target should prioritize piercing');
assert.ok(armor.result.coverage.piercingThreshold>0,'a reachable armor threshold should cause Counter to battle-test at least one candidate that actually pierces');

const hardArmor=inspect('armor-vs-hard-armor',makeSnapshot({
  attacker:[{type:'medium_armor',count:5},{type:'mechanized',count:7}],
  defender:[{type:'heavy_armor',count:8},{type:'mechanized',count:4}],
  attackerSupports:['engineer','maintenance'],
  defenderSupports:['engineer','maintenance']
}));
assert.ok(hardArmor.diagnosis.hardness>=.6,'hard-armor fixture must actually be at least 60% hard');
assert.ok(hardArmor.diagnosis.priorities.includes('hard-attack'),'hard armor target should prioritize hard attack');
assert.ok(hardArmor.result.coverage.hardAttackImprovement>0,'hard-armor search should battle-test at least one answer that raises hard attack');
assert.ok(hardArmor.result.bestEfforts.some(item=>item.stats.hard>hardArmor.snapshot.attacker.hard),'when no local counter wins, the retained best-effort set should still include a hard-attack improvement');

const air=inspect('enemy-air-superiority',makeSnapshot({
  attacker:[{type:'infantry',count:9},{type:'artillery',count:1}],
  defender:[{type:'infantry',count:10}],
  attackerSupports:['engineer','support_artillery'],
  defenderSupports:['engineer','support_artillery'],
  battlefield:{air:-1,cas:0}
}));
assert.ok(air.diagnosis.priorities.includes('air-attack'),'enemy air superiority should prioritize air attack');
assert.ok(air.result.coverage.airAttackImprovement>0,'enemy-air-superiority search must battle-test at least one AA improvement');
const friendlyAir=diagnoseMatchup(air.snapshot.attacker,air.snapshot.defender,{side:'attacker',battlefield:{...air.snapshot.state.battlefield,air:1,cas:0}});
assert.ok(!friendlyAir.priorities.includes('air-attack'),'friendly air superiority must not create a false AA priority');
const casOnly=diagnoseMatchup(air.snapshot.defender,air.snapshot.attacker,{side:'defender',battlefield:{...air.snapshot.state.battlefield,air:0,cas:.5}});
assert.ok(!casOnly.priorities.includes('air-attack'),'CAS alone must not claim direct AA mitigation that the resolver does not execute');
assert.ok(casOnly.notes.some(note=>/AA-versus-CAS/i.test(note.detail)),'CAS-only diagnosis must disclose the current AA/CAS evidence boundary');

const defense=inspect('defender-counter-search',makeSnapshot({
  attacker:[{type:'infantry',count:7},{type:'artillery',count:3}],
  defender:[{type:'infantry',count:8}],
  attackerSupports:['engineer','support_artillery'],
  defenderSupports:['engineer']
}),{side:'defender'});
assert.equal(defense.result.bestTested.side,'defender','defender quality search must preserve defender-side identity');
assert.ok(defense.result.coverage.survivalImprovement>0,'defender search must battle-test at least one defense improvement');
const defensePressure=diagnoseMatchup({soft:20,hard:5,hardness:0,def:40,breakthrough:10,org:40,armor:0,piercing:5},{soft:120,hard:20,hardness:0,def:100,breakthrough:80,org:50,armor:0,piercing:10},{side:'defender',battlefield:{air:0,cas:0}});
assert.ok(defensePressure.priorities.includes('defense'),'defender diagnosis must prioritize defense when incoming effective attack exceeds defense');

const regimental=inspect('regimental-small-change',makeSnapshot({
  attacker:[{type:'infantry',count:3}],
  defender:[{type:'infantry',count:4}],
  attackerSupports:['engineer','recon','logistics','signal','support_artillery'],
  defenderSupports:['engineer']
}));
assert.ok(regimental.result.coverage.regimental>0,'eligible full-support template should battle-test at least one Regimental Support answer');

console.log('Counter recommendation-quality matrix audit completed.');

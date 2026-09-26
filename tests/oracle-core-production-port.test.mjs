import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMBAT_CONSTANTS,MODEL_META} from '../src/data.js';
import ORACLE_COMBAT_1193 from '../src/builtin1193/oracle-combat-certification-1193.js';
import {sampleAttackPoints} from '../src/engine.js';

assert.equal(MODEL_META.appVersion,'0.17.17');
assert.equal(ORACLE_COMBAT_1193.gameVersion,'1.19.3.0.c01a');
assert.equal(ORACLE_COMBAT_1193.baseChecksum,'5632');
assert.equal(COMBAT_CONSTANTS.initialFireDelayHours,1,'O1 must keep the one-hour combat-entry delay');
assert.equal(COMBAT_CONSTANTS.strengthDamageExecutableScale,0.9,'O17v2 must keep the validated 0.9 strength-damage scalar');

assert.equal(sampleAttackPoints(20,()=>0),1);
assert.equal(sampleAttackPoints(20,()=>0.249999),1);
assert.equal(sampleAttackPoints(20,()=>0.25),2);
assert.equal(sampleAttackPoints(20,()=>0.749999),2);
assert.equal(sampleAttackPoints(20,()=>0.75),3);
assert.equal(sampleAttackPoints(20,()=>0.999999),3);

const engine=readFileSync(new URL('../src/engine.js',import.meta.url),'utf8');
assert.match(engine,/const attackPoints=sampleAttackPoints\(total,rng\)/,'live hit profile must consume the O7 attack-point sampler');
assert.match(engine,/defensePoints=stochasticRound\(/,'defense must retain the O11-O13 stochastic-rounding mechanism');
assert.match(engine,/if\(hours>=initialFireDelayHours\)/,'live simulation must suppress fire during the O1 delay');
assert.match(engine,/strengthDamageModifier\*COMBAT_CONSTANTS\.strengthDamageExecutableScale/,'live strength damage must apply the O17v2 executable scalar');
assert.doesNotMatch(engine,/stochasticRound\(total\*COMBAT_CONSTANTS\.combatPointScale,rng\)/,'the Oracle-divergent old attack sampler must not return');

assert.equal(ORACLE_COMBAT_1193.evidence.attackPoints.classification,'oracle-validated');
assert.equal(ORACLE_COMBAT_1193.evidence.attackPoints.implementationEvidence,'executable inferred');
assert.equal(ORACLE_COMBAT_1193.evidence.combinedTransport.o20GroupedCounts.twoPlus,3);
assert.ok(ORACLE_COMBAT_1193.limitations.some(x=>/armor, piercing/i.test(x)));
assert.ok(ORACLE_COMBAT_1193.limitations.some(x=>/bit-for-bit/i.test(x)));

console.log('Oracle core production-port regression passed.');

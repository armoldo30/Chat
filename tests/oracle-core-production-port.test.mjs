import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMBAT_CONSTANTS,MODEL_META} from '../src/data.js';
import ORACLE_COMBAT_1193 from '../src/builtin1193/oracle-combat-certification-1193.js';
import {sampleAttackPoints,piercingDamageFactor,damageDiceProfile} from '../src/engine.js';

assert.equal(MODEL_META.appVersion,'0.17.22');
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
assert.equal(ORACLE_COMBAT_1193.evidence.piercingDamageTiers.classification,'oracle-validated');
assert.deepEqual(ORACLE_COMBAT_1193.evidence.piercingDamageTiers.thresholds,[1,0.75,0.5,0]);
assert.deepEqual(ORACLE_COMBAT_1193.evidence.piercingDamageTiers.damageFactors,[1,0.8,0.65,0.5]);
assert.equal(ORACLE_COMBAT_1193.evidence.armoredOrgDie.support,'UniformInteger(1,6)');
assert.deepEqual(ORACLE_COMBAT_1193.evidence.combinedArmoredComposition.intervalCounts,{miss:138,hit:22,mixedChannel:0,supportViolation:0});

assert.equal(piercingDamageFactor(20,20),1);
assert.equal(piercingDamageFactor(15,20),0.8);
assert.equal(piercingDamageFactor(14,20),0.65);
assert.equal(piercingDamageFactor(10,20),0.65);
assert.equal(piercingDamageFactor(9,20),0.5);
assert.equal(damageDiceProfile(20,4).softOrgDice,6);
assert.equal(damageDiceProfile(20,20).softOrgDice,4);

assert.match(engine,/aDamageTaken=piercingDamageFactor\(c\.de\.side\.piercing,c\.ae\.side\.armor\)/,'attacker damage taken must use defender piercing against attacker armor');
assert.match(engine,/dDamageTaken=piercingDamageFactor\(c\.ae\.side\.piercing,c\.de\.side\.armor\)/,'defender damage taken must use attacker piercing against defender armor');
assert.match(engine,/aDice=damageDiceProfile\(c\.ae\.side\.armor,c\.de\.side\.piercing\)/,'attacker armored die must use attacker armor against defender piercing');
assert.match(engine,/dDice=damageDiceProfile\(c\.de\.side\.armor,c\.ae\.side\.piercing\)/,'defender armored die must use defender armor against attacker piercing');
assert.ok(ORACLE_COMBAT_1193.limitations.some(x=>/armor\/piercing validation is narrow/i.test(x)));
assert.ok(ORACLE_COMBAT_1193.limitations.some(x=>/bit-for-bit/i.test(x)));

console.log('Oracle core production-port regression passed.');

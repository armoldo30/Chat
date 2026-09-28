import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMBAT_CONSTANTS,MODEL_META} from '../src/data.js';
import ORACLE_COMBAT_1193 from '../src/builtin1193/oracle-combat-certification-1193.js';
import {damageDiceProfile,piercingDamageFactor} from '../src/engine.js';

assert.equal(MODEL_META.appVersion,'0.17.23');
assert.match(MODEL_META.confidence,/armor\/piercing.*Oracle-validated through O25/);

assert.deepEqual(COMBAT_CONSTANTS.piercingThresholds,[1,0.75,0.5,0]);
assert.deepEqual(COMBAT_CONSTANTS.piercingDamageValues,[1,0.8,0.65,0.5]);

assert.equal(piercingDamageFactor(20,20),1);
assert.equal(piercingDamageFactor(15,20),0.8);
assert.equal(piercingDamageFactor(14,20),0.65);
assert.equal(piercingDamageFactor(10,20),0.65);
assert.equal(piercingDamageFactor(9,20),0.5);

assert.equal(damageDiceProfile(20,4).softOrgDice,6);
assert.equal(damageDiceProfile(20,20).softOrgDice,4);
assert.equal(damageDiceProfile(20,4).softStrengthDice,2);

assert.equal(ORACLE_COMBAT_1193.evidence.piercingDamageTiers.classification,'oracle-validated');
assert.equal(ORACLE_COMBAT_1193.evidence.armoredOrgDie.classification,'oracle-validated');
assert.equal(ORACLE_COMBAT_1193.evidence.armoredOrgDie.support,'UniformInteger(1,6)');
assert.equal(ORACLE_COMBAT_1193.evidence.combinedArmoredComposition.classification,'oracle-validated');
assert.deepEqual(ORACLE_COMBAT_1193.evidence.combinedArmoredComposition.intervalCounts,{miss:138,hit:22,mixedChannel:0,supportViolation:0});
assert.match(ORACLE_COMBAT_1193.evidence.combinedArmoredComposition.o24Resolution,/observation-resolution artifact/);

const engine=readFileSync(new URL('../src/engine.js',import.meta.url),'utf8');
assert.match(engine,/dDamageTaken=piercingDamageFactor\(c\.ae\.side\.piercing,c\.de\.side\.armor\)/,'attacker piercing must be compared against defender armor for outgoing damage');
assert.match(engine,/aDice=damageDiceProfile\(c\.ae\.side\.armor,c\.de\.side\.piercing\)/,'attacker armor must be compared against defender piercing for the armored damage die');
assert.match(engine,/\*dDamageTaken/,'attacker damage must apply the defender-side piercing damage factor');

console.log('Oracle armor/piercing production-port regression passed.');

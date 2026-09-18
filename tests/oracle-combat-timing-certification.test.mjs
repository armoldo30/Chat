import assert from 'node:assert/strict';
import ORACLE_COMBAT_1193 from '../src/builtin1193/oracle-combat-certification-1193.js';
import {COMBAT_CONSTANTS} from '../src/data.js';

assert.equal(ORACLE_COMBAT_1193.gameVersion,'1.19.3.0.c01a');
assert.equal(ORACLE_COMBAT_1193.baseChecksum,'5632');
assert.equal(ORACLE_COMBAT_1193.classification,'oracle-validated');
assert.equal(ORACLE_COMBAT_1193.validationBoundary,'controlled O1 combat-entry timing only');
assert.equal(ORACLE_COMBAT_1193.initialFireDelayHours,1);
assert.equal(ORACLE_COMBAT_1193.evidence.totalControlledRuns,35);
assert.equal(ORACLE_COMBAT_1193.evidence.h0ToH1NoDamageRuns,35);
assert.equal(ORACLE_COMBAT_1193.evidence.vanillaTacticRuns,25);
assert.equal(ORACLE_COMBAT_1193.evidence.neutralTacticRuns,10);
assert.equal(COMBAT_CONSTANTS.initialFireDelayHours,ORACLE_COMBAT_1193.initialFireDelayHours);

console.log('Oracle 1.19.3 controlled combat-entry timing certification passed.');

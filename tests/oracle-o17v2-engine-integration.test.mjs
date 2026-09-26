import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMBAT_CONSTANTS} from '../src/data.js';
import ORACLE_COMBAT_1193 from '../src/builtin1193/oracle-combat-certification-1193.js';

assert.equal(ORACLE_COMBAT_1193.strengthDamageExecutableScale,0.9);
assert.equal(COMBAT_CONSTANTS.strengthDamageExecutableScale,0.9);
assert.ok(Math.abs(COMBAT_CONSTANTS.strengthDamageModifier*COMBAT_CONSTANTS.strengthDamageExecutableScale-0.054)<1e-12);

const engine=readFileSync(new URL('../src/engine.js',import.meta.url),'utf8');
const needle='COMBAT_CONSTANTS.strengthDamageModifier*COMBAT_CONSTANTS.strengthDamageExecutableScale';
assert.equal(engine.split(needle).length-1,4);

console.log('Oracle O17v2 strength-scale engine integration regression passed.');

import assert from 'node:assert/strict';
import { economicBurden } from '../src/counter-analysis.js';
import { diagnoseMatchup } from '../src/counter-diagnosis.js';

const yours={soft:300,hard:80,breakthrough:180,armor:55,piercing:50,hardness:.25};
const target={soft:240,hard:120,def:350,armor:70,piercing:60,hardness:.7};
const diagnosis=diagnoseMatchup(yours,target);
assert.equal(diagnosis.yourPierces,false);
assert.equal(diagnosis.targetPierces,true);
assert.ok(diagnosis.notes.some(note=>/armor threshold/i.test(note.title)));
assert.ok(diagnosis.notes.some(note=>/hard attack/i.test(note.title)));

const burden=economicBurden(1000,1200,30,24);
assert.equal(burden.delta,200);
assert.equal(Math.round(burden.pct),20);
assert.equal(burden.extraFactories,6);
assert.equal(burden.totalDelta,4800);

console.log('Counter Analysis regression checks passed.');

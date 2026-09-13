import assert from 'node:assert/strict';
import { economicBurden } from '../src/counter-analysis.js';
import { diagnoseMatchup } from '../src/counter-diagnosis.js';
import { explainCounter } from '../src/counter-explanations.js';
import { buildCounterCandidates } from '../src/counter-candidates.js';
import { blankGrid } from '../src/designer.js';

const yours={soft:300,hard:80,breakthrough:180,armor:55,piercing:50,hardness:.25,org:50,width:20,supply:1.2};
const target={soft:240,hard:120,def:350,armor:70,piercing:60,hardness:.7,org:55,width:24,supply:1.4};
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

const explanation=explainCounter({gain:12,ic:1200,changeCount:2,changes:['Add Anti-Tank','Add Engineers'],stats:{...yours,piercing:75,hard:110,breakthrough:200,org:52,width:22,supply:1.3}}, {attacker:yours,defender:target,attackerIC:1000});
assert.ok(explanation.reasons.some(reason=>/Crosses the target armor threshold/i.test(reason)));
assert.ok(explanation.reasons.some(reason=>/hard attack/i.test(reason)));
assert.ok(explanation.tradeoffs.some(reason=>/Equipment cost rises/i.test(reason)));
assert.equal(explanation.changeCount,2);

const grid=blankGrid();grid[0][0]='infantry';grid[0][1]='infantry';grid[0][2]='infantry';
const snapshot={state:{attackerGrid:grid,attackerSupports:['engineer','recon','logistics','signal','support_artillery']}};
const first=buildCounterCandidates(snapshot,{limit:80});
assert.ok(first.some(item=>item.kind==='replace-support'),'full support templates must still generate support-company counter swaps');
const seed=first.find(item=>item.kind==='replace-support')||first[0];
const second=buildCounterCandidates(snapshot,{grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,limit:80});
assert.ok(second.some(item=>item.changeCount===2),'second-step candidate generation must preserve change depth');
assert.ok(second.some(item=>item.label.includes(' + ')),'multi-change labels must explain both structural changes');

console.log('Counter Analysis regression checks passed.');

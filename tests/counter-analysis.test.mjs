import assert from 'node:assert/strict';
import { economicBurden } from '../src/counter-analysis.js';
import { diagnoseMatchup } from '../src/counter-diagnosis.js';
import { explainCounter } from '../src/counter-explanations.js';
import { buildCounterCandidates } from '../src/counter-candidates.js';
import { buildForceDesignCandidates } from '../src/counter-force-candidates.js';
import { counterSnapshot, counterDivision } from '../src/counter-state-model.js';
import { blankGrid } from '../src/designer.js';

const yours={soft:300,hard:80,breakthrough:180,armor:55,piercing:50,hardness:.25,org:50,width:20,supply:1.2,def:220};
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

const designExplanation=explainCounter({gain:8,ic:1180,changeCount:1,changes:['Medium Tank: gun A → B'],designChange:{variant:'Medium Tank',component:'gun',before:{piercing:40,hardAttack:18,softAttack:20,armor:50,breakthrough:25,buildCost:12,reliability:.85,fuelConsumption:2},after:{piercing:58,hardAttack:28,softAttack:19,armor:50,breakthrough:25,buildCost:14,reliability:.82,fuelConsumption:2.1}},stats:{...yours,piercing:68,hard:105}}, {attacker:yours,defender:target,attackerIC:1000});
assert.ok(designExplanation.reasons.some(reason=>/underlying variant/i.test(reason)),'tank-design explanations must describe the equipment-level mechanism');
assert.ok(designExplanation.tradeoffs.some(reason=>/build cost rises/i.test(reason)),'tank-design explanations must report per-vehicle cost tradeoffs');

const grid=blankGrid();grid[0][0]='infantry';grid[0][1]='infantry';grid[0][2]='infantry';
const snapshot={state:{attackerGrid:grid,attackerSupports:['engineer','recon','logistics','signal','support_artillery']}};
const first=buildCounterCandidates(snapshot,{limit:80});
assert.ok(first.some(item=>item.kind==='replace-support'),'full support templates must still generate support-company counter swaps');
const seed=first.find(item=>item.kind==='replace-support')||first[0];
const second=buildCounterCandidates(snapshot,{grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds,limit:80});
assert.ok(second.some(item=>item.changeCount===2),'second-step candidate generation must preserve change depth');
assert.ok(second.some(item=>item.label.includes(' + ')),'multi-change labels must explain both structural changes');
assert.ok(second.every(item=>item.changeKinds?.length===2),'multi-step template candidates must preserve change categories');

const baseSnapshot=counterSnapshot();
const fixedContextCandidates=buildForceDesignCandidates(baseSnapshot,{limit:18});
assert.equal(fixedContextCandidates.length,0,'an infantry/artillery force must not invent technology-upgrade counter candidates');
assert.ok(!fixedContextCandidates.some(item=>item.kind==='equipment-tech'),'technology tiers must remain fixed matchup context rather than counter recommendations');

const tankGrid=blankGrid();tankGrid[0][0]='medium_armor';
const tankState={...baseSnapshot.state,attackerGrid:tankGrid,attackerSupports:[]};
const tankSnapshot={...baseSnapshot,state:tankState,attacker:counterDivision(tankState,'attacker',tankGrid,[])};
const tankCandidates=buildForceDesignCandidates(tankSnapshot,{state:tankState,grid:tankGrid,supportKeys:[],limit:24});
assert.ok(tankCandidates.some(item=>item.kind==='tank-design'),'a division using medium tanks must generate tank-variant counter candidates');
assert.ok(tankCandidates.filter(item=>item.kind==='tank-design').every(item=>item.designChange.family==='medium'),'tank search must not retune unused light/heavy families');
assert.ok(tankCandidates.every(item=>item.key),'force-design candidates must receive state-aware deduplication keys');

console.log('Counter Analysis regression checks passed.');

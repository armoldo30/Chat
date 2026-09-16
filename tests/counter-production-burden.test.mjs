import assert from 'node:assert/strict';
import { counterProductionBurden } from '../src/counter-production-burden.js';
import { counterSnapshot } from '../src/counter-state-model.js';
import { explainCounter } from '../src/counter-explanations.js';

const snapshot=counterSnapshot();
snapshot.state.production={days:180,factories:12,efficiency:20,efficiencyGain:100,maxEfficiency:50,outputBonus:0,energySatisfaction:100,resources:{steel:20,tungsten:4,chromium:0,rubber:4,aluminum:4}};
snapshot.state.productionGoals=[{type:'infantry_equipment',stock:0,target:10000,factories:10,priority:5}];
const baseArtillery=Number(snapshot.attacker.need.artillery)||0;
const candidate={state:snapshot.state,stats:{...snapshot.attacker,need:{...snapshot.attacker.need,artillery:baseArtillery+36}}};
const burden=counterProductionBurden(snapshot,candidate,'attacker');
assert.equal(burden.evidenceClass,'source-backed-production-projection');
assert.equal(burden.horizonDays,180);
assert.equal(burden.divisions,snapshot.state.attackerDivisions);
assert.ok(burden.addedIC>0,'extra equipment must create incremental production IC');
assert.ok(burden.factoryDays>0,'incremental IC must translate into factory-days');
assert.ok(burden.factoriesForHorizon>0,'incremental production must expose average factory demand over the selected horizon');
assert.equal(burden.unusedFactories,2,'existing production lines must consume factory capacity before Counter uses spare capacity');
assert.ok((burden.resourceDraw.steel||0)>0&&(burden.resourceDraw.tungsten||0)>0,'artillery production must expose its marginal strategic-resource draw');

const constrainedState=structuredClone(snapshot.state);
constrainedState.production={...constrainedState.production,factories:10,resources:{steel:0,tungsten:0,chromium:0,rubber:0,aluminum:0}};
const constrainedSnapshot={...snapshot,state:constrainedState};
const constrainedCandidate={...candidate,state:constrainedState};
const constrained=counterProductionBurden(constrainedSnapshot,constrainedCandidate,'attacker');
assert.ok(constrained.factoryShortfall>0,'no spare factories must create a capacity shortfall');
assert.ok(constrained.constrainedResources.includes('steel')&&constrained.constrainedResources.includes('tungsten'),'zero spare resources must be identified as production constraints');
assert.ok(constrained.capacityPenalty>0,'factory/resource constraints must feed Best Value burden');

const explained=explainCounter({gain:8,ic:snapshot.attackerIC+126,changeCount:1,changes:['Add Artillery'],stats:candidate.stats,productionBurden:burden},snapshot,'attacker');
assert.ok(explained.tradeoffs.some(text=>/factory-days/i.test(text)),'Counter explanation must show production-time burden');
assert.ok(explained.tradeoffs.some(text=>/resource draw/i.test(text)),'Counter explanation must show marginal resource burden when capacity is available');

console.log('Counter production-capacity burden checks passed.');

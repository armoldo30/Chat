import assert from 'node:assert/strict';
import { counterProductionPlanBurden } from '../src/counter-production.js';

const equipment={
  infantry_equipment:{name:'Infantry Equipment',cost:1,resources:{steel:1}},
  anti_tank:{name:'Towed Anti-Tank',cost:4,resources:{steel:2,tungsten:1}}
};
const production={days:30,factories:2,efficiency:50,efficiencyGain:100,maxEfficiency:50,outputBonus:0,energySatisfaction:100,resources:{steel:10,tungsten:10}};
const goal={type:'infantry_equipment',stock:0,target:0,factories:2,priority:5};
const snapshot=(overrides={})=>({
  state:{attackerDivisions:3,production:{...production,...(overrides.production||{})},productionGoals:overrides.productionGoals||[{...goal}]},
  attacker:{need:{infantry_equipment:100}}
});

const covered=counterProductionPlanBurden(snapshot(),{stats:{need:{infantry_equipment:110}}},'attacker',equipment);
assert.equal(covered.available,true);
assert.equal(covered.incrementalEquipment.infantry_equipment,30,'demand delta must scale across the selected force');
assert.ok(covered.incrementalIC>0);
assert.equal(covered.currentPlanAdequate,true,'projected surplus beyond the saved target should cover a small incremental demand');
assert.equal(covered.coverageRatio,1);
assert.deepEqual(covered.newProductionLines,[]);
assert.equal(covered.valuePenalty,0,'fully covered current-plan demand should not carry a production shortfall penalty');

const committed=counterProductionPlanBurden(snapshot({productionGoals:[{...goal,target:10000}]}),{stats:{need:{infantry_equipment:110}}},'attacker',equipment);
assert.equal(committed.currentPlanAdequate,false,'production already committed to a saved target is not free counter capacity');
assert.equal(committed.coverageRatio,0);
assert.ok(committed.shortfallIC>0&&committed.valuePenalty>0&&committed.searchPenalty>0);
assert.ok(Number.isFinite(committed.additionalDays)&&committed.additionalDays>0,'an active line should expose additional time at its current modeled rate');

const newLine=counterProductionPlanBurden(snapshot(),{stats:{need:{infantry_equipment:100,anti_tank:5}}},'attacker',equipment);
assert.equal(newLine.incrementalEquipment.anti_tank,15);
assert.deepEqual(newLine.newProductionLines,['anti_tank'],'equipment absent from the saved plan must be identified as a new production line');
assert.equal(newLine.currentPlanAdequate,false);
assert.equal(newLine.additionalDays,Infinity,'a missing line must not receive an invented production rate');
assert.ok(newLine.valuePenalty>=120,'opening an unsaved line must carry a practical-value penalty');

const inactive=counterProductionPlanBurden(snapshot({production:{factories:0},productionGoals:[{...goal,factories:2}]}),{stats:{need:{infantry_equipment:110}}},'attacker',equipment);
assert.deepEqual(inactive.inactiveProductionLines,['infantry_equipment']);
assert.equal(inactive.currentPlanAdequate,false);
assert.equal(inactive.additionalDays,Infinity);

const resourceBound=counterProductionPlanBurden(snapshot({production:{resources:{steel:0,tungsten:0}}}),{stats:{need:{infantry_equipment:500}}},'attacker',equipment);
assert.ok(resourceBound.resourceConstrainedTypes.includes('infantry_equipment'),'saved-line resource shortages must flow through the audited production engine');
assert.ok(resourceBound.rows[0].resourceFactor<1);

const noChange=counterProductionPlanBurden(snapshot(),{stats:{need:{infantry_equipment:90}}},'attacker',equipment);
assert.equal(noChange.available,true);
assert.equal(noChange.currentPlanAdequate,true);
assert.equal(noChange.incrementalIC,0,'equipment reductions must not be treated as negative production demand');
assert.equal(noChange.searchPenalty,0);

const unavailable=counterProductionPlanBurden({state:{attackerDivisions:3},attacker:{need:{infantry_equipment:100}}},{stats:{need:{infantry_equipment:110}}},'attacker',equipment);
assert.equal(unavailable.available,false,'missing saved production context must remain unknown rather than inventing feasibility');
assert.equal(unavailable.searchPenalty,0);
assert.equal(unavailable.valuePenalty,0);

console.log('Counter saved-production feasibility checks passed.');

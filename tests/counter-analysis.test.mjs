import assert from 'node:assert/strict';
import { economicBurden } from '../src/counter-analysis.js';
import { diagnoseMatchup } from '../src/counter-diagnosis.js';
import { explainCounter } from '../src/counter-explanations.js';
import { buildCounterCandidates } from '../src/counter-candidates.js';
import { buildForceDesignCandidates } from '../src/counter-force-candidates.js';
import { buildCounterRecommendationGroups, counterOperationalBurden, isMeaningfulCounterImprovement } from '../src/counter-search.js';
import { counterSnapshot, counterDivision, counterTechData } from '../src/counter-state-model.js';
import { blankGrid } from '../src/designer.js';
import { techAvailable } from '../src/tech.js';
import { battalions, supports, equipment, terrain } from '../src/data.js';
import { hydrateGameData } from '../src/gameData.js';

const yours={soft:300,hard:80,breakthrough:180,armor:55,piercing:50,hardness:.25,org:50,width:20,supply:1.2,def:220};
const target={soft:240,hard:120,def:350,breakthrough:130,armor:70,piercing:60,hardness:.7,org:55,width:24,supply:1.4};
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

assert.equal(isMeaningfulCounterImprovement({gain:15,winRate:45}),true,'a large improvement must qualify even when the modeled win rate remains below 50%');
assert.equal(isMeaningfulCounterImprovement({gain:1.9,winRate:90}),false,'qualification is based on improvement over the baseline, not whether the candidate happens to win most runs');
const supplyBurden=counterOperationalBurden(yours,{stats:{...yours,supply:1.5}});
assert.ok(supplyBurden.supplyDelta>0&&supplyBurden.supplyPct>0&&supplyBurden.supplyValuePenalty>0,'higher supply use must carry an explicit practical-value burden');

const explanation=explainCounter({gain:12,ic:1200,changeCount:2,changes:['Add Anti-Tank','Add Engineers'],stats:{...yours,piercing:75,hard:110,breakthrough:200,org:52,width:22,supply:1.3}}, {attacker:yours,defender:target,attackerIC:1000,defenderIC:1100});
assert.ok(explanation.reasons.some(reason=>/Crosses the target armor threshold/i.test(reason)));
assert.ok(explanation.reasons.some(reason=>/hard attack/i.test(reason)));
assert.ok(explanation.tradeoffs.some(reason=>/Equipment cost rises/i.test(reason)));
assert.equal(explanation.changeCount,2);

const defenderExplanation=explainCounter({gain:11,ic:1250,changeCount:1,changes:['Add Infantry'],stats:{...target,def:385,org:57,width:26,supply:1.55}}, {attacker:yours,defender:target,attackerIC:1000,defenderIC:1100},'defender');
assert.ok(defenderExplanation.reasons.some(reason=>/Defense increases/i.test(reason)),'defender recommendations must explain defense gains rather than attacker breakthrough');
assert.ok(defenderExplanation.tradeoffs.some(reason=>/Supply use rises/i.test(reason)),'defender recommendations must expose their supply tradeoffs');
assert.ok(defenderExplanation.tradeoffs.some(reason=>/Combat width increases/i.test(reason)),'defender recommendations must expose their width tradeoffs');

const designExplanation=explainCounter({gain:8,ic:1180,changeCount:1,changes:['Medium Tank: gun A → B'],designChange:{variant:'Medium Tank',component:'gun',before:{piercing:40,hardAttack:18,softAttack:20,armor:50,breakthrough:25,defense:18,buildCost:12,reliability:.85,fuelConsumption:2},after:{piercing:58,hardAttack:28,softAttack:19,armor:50,breakthrough:25,defense:18,buildCost:14,reliability:.82,fuelConsumption:2.1}},stats:{...yours,piercing:68,hard:105}}, {attacker:yours,defender:target,attackerIC:1000,defenderIC:1100});
assert.ok(designExplanation.reasons.some(reason=>/underlying variant/i.test(reason)),'tank-design explanations must describe the equipment-level mechanism');
assert.ok(designExplanation.tradeoffs.some(reason=>/build cost rises/i.test(reason)),'tank-design explanations must report per-vehicle cost tradeoffs');

const retoolExplanation=explainCounter({gain:14,ic:1550,changeCount:1,changes:['Add Heavy Armor'],practicality:{majorRetooling:true,introducedArmorFamilies:['heavy'],resourceKeys:['steel','chromium']},stats:{...yours,armor:76,piercing:72,hard:120,breakthrough:230,supply:1.5}}, {attacker:yours,defender:target,attackerIC:1000,defenderIC:1100});
assert.ok(retoolExplanation.tradeoffs.some(reason=>/Major production retooling/i.test(reason)),'new armor families must be called out as major production retooling');
assert.ok(retoolExplanation.tradeoffs.some(reason=>/Chromium/i.test(reason)),'retooling explanation should expose strategic-resource inputs from the current data baseline');
assert.ok(retoolExplanation.tradeoffs.some(reason=>/campaign fuel/i.test(reason)),'retooling explanation must disclose that campaign fuel is not fully priced');

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

hydrateGameData(baseSnapshot.state.dataPack,{battalions,supports,equipment,terrain},{year:baseSnapshot.state.dataSnapshotYear});
const mioBaseState=structuredClone(baseSnapshot.state);
const baseTechData=counterTechData(mioBaseState,'attacker');
const mioState=structuredClone(mioBaseState);
mioState.dataPack=structuredClone(baseSnapshot.state.dataPack);
mioState.dataPack.meta={...(mioState.dataPack.meta||{}),mioInheritance:'materialized'};
mioState.dataPack.mios={...(mioState.dataPack.mios||{}),
  TEST_COUNTER_ARTILLERY:{id:'TEST_COUNTER_ARTILLERY',name:'Counter Artillery Test',equipmentTypes:['artillery'],initial:{equipmentBonus:{soft_attack:.10},productionBonus:{}},traits:{}},
  TEST_COUNTER_AT:{id:'TEST_COUNTER_AT',name:'Counter AT Test',equipmentTypes:['anti_tank'],initial:{equipmentBonus:{hard_attack:.10},productionBonus:{}},traits:{}},
  TEST_COUNTER_AA:{id:'TEST_COUNTER_AA',name:'Counter AA Test',equipmentTypes:['anti_air'],initial:{equipmentBonus:{air_attack:.10},productionBonus:{}},traits:{}}
};
mioState.mioSelections=structuredClone(baseSnapshot.state.mioSelections);
mioState.mioSelections.attacker={...mioState.mioSelections.attacker,
  artillery:{organization:'TEST_COUNTER_ARTILLERY',traits:[]},
  anti_tank:{organization:'TEST_COUNTER_AT',traits:[]},
  anti_air:{organization:'TEST_COUNTER_AA',traits:[]}
};
const mioTechData=counterTechData(mioState,'attacker');
const sameTenPercent=(next,base,label)=>{
  assert.ok(Number(base)>0,`${label} baseline must be positive for the MIO propagation fixture`);
  assert.ok(Math.abs(Number(next)/Number(base)-1.10)<1e-9,`${label} must receive the selected family MIO's 10% equipment bonus`);
};
sameTenPercent(mioTechData.supports.support_artillery.soft,baseTechData.supports.support_artillery.soft,'divisional support artillery');
sameTenPercent(mioTechData.supports.field_guns.soft,baseTechData.supports.field_guns.soft,'1.19.3 field guns');
sameTenPercent(mioTechData.supports.support_at.hard,baseTechData.supports.support_at.hard,'divisional support anti-tank');
sameTenPercent(mioTechData.supports.anti_tank_battery.hard,baseTechData.supports.anti_tank_battery.hard,'1.19.3 anti-tank battery');
sameTenPercent(mioTechData.supports.support_aa.airAttack,baseTechData.supports.support_aa.airAttack,'divisional support anti-air');
sameTenPercent(mioTechData.supports.anti_air_battery.airAttack,baseTechData.supports.anti_air_battery.airAttack,'1.19.3 anti-air battery');

assert.equal(techAvailable('support','field_guns',{artillery:0}),false,'current field guns must follow the artillery coarse availability alias');
assert.equal(techAvailable('support','anti_tank_battery',{antiTank:0}),false,'current anti-tank battery must follow the AT coarse availability alias');
assert.equal(techAvailable('support','anti_air_battery',{antiAir:0}),false,'current anti-air battery must follow the AA coarse availability alias');
assert.equal(techAvailable('support','regimental_infantry_guns',{artillery:0}),false,'legacy regimental artillery alias must remain supported');
assert.equal(techAvailable('support','regimental_at',{antiTank:0}),false,'legacy regimental AT alias must remain supported');
assert.equal(techAvailable('support','regimental_aa',{antiAir:0}),false,'legacy regimental AA alias must remain supported');
const defenderCandidates=buildCounterCandidates(baseSnapshot,{side:'defender',limit:8});
assert.ok(defenderCandidates.length>0&&defenderCandidates.every(item=>item.side==='defender'),'template search must be able to mutate the defender independently');
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

const defenderTankState={...baseSnapshot.state,defenderGrid:tankGrid,defenderSupports:[]};
const defenderTankSnapshot={...baseSnapshot,state:defenderTankState,defender:counterDivision(defenderTankState,'defender',tankGrid,[])};
const defenderTankCandidates=buildForceDesignCandidates(defenderTankSnapshot,{side:'defender',state:defenderTankState,grid:tankGrid,supportKeys:[],limit:24});
assert.ok(defenderTankCandidates.some(item=>item.kind==='tank-design'),'defender search must retune tank variants used by the defending division');
assert.ok(defenderTankCandidates.every(item=>item.side==='defender'),'defender tank candidates must preserve side identity through the search');

const dominant={key:'dominant',label:'Dominant pick'},alternateA={key:'alternate-a',label:'Alternate A'},alternateB={key:'alternate-b',label:'Alternate B'};
const grouped=buildCounterRecommendationGroups({best:dominant,value:dominant,minimal:dominant},[dominant,alternateA,alternateB]);
assert.equal(grouped.length,3,'duplicate category winners should be collapsed and replaced with distinct alternatives when available');
assert.deepEqual(grouped[0].roles,['BEST RAW','BEST VALUE','SMALLEST CHANGE']);
assert.equal(grouped[0].alternative,false);
assert.equal(grouped[1].item,alternateA);
assert.equal(grouped[1].alternative,true);
assert.equal(new Set(grouped.map(group=>group.item.key)).size,grouped.length,'headline recommendation cards must be distinct by candidate');

console.log('Counter Analysis regression checks passed.');

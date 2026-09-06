import assert from 'node:assert/strict';
import { battalions, supports, terrain, equipment } from '../src/data.js';
import { calcDivision, aggregateDivision, battleContext, evaluateProduction, efficiencyProjection, piercingDamageFactor, simulateOnce, simulateBattle } from '../src/engine.js';

const opts={terrain:'plains',terrainData:terrain,directions:0,entrench:0,fort:0,river:0,asupply:1,dsupply:1,air:0,cas:0,planning:0,night:0};
const softAttacker=aggregateDivision(calcDivision([{type:'artillery',count:4}],battalions,[],supports),1);
const softTarget=aggregateDivision(calcDivision([{type:'infantry',count:4}],battalions,[],supports),1);
const hardTarget={...softTarget,hardness:1};
assert.ok(battleContext(softAttacker,softTarget,opts).aAttack > battleContext(softAttacker,hardTarget,opts).aAttack,'attack mix must use target hardness');

assert.equal(terrain.plains.width,70);
assert.equal(terrain.forest.reinforceWidth,30);
const mountainCtx=battleContext(softAttacker,softTarget,{...opts,terrain:'mountain',directions:1});
assert.equal(mountainCtx.available,75,'extra direction must use terrain reinforce width');


const plainInf=calcDivision([{type:'infantry',count:10}],battalions,[],supports);
const supportedInf=calcDivision([{type:'infantry',count:10}],battalions,['support_artillery'],supports);
assert.equal(supportedInf.manpower,plainInf.manpower+300,'support company manpower must count toward division manpower');
assert.ok(supportedInf.hp>plainInf.hp,'support company HP must count toward division HP');
assert.ok(supportedInf.org<plainInf.org,'zero-org support artillery must lower average division organization');
const dualSupport=calcDivision([{type:'infantry',count:10}],battalions,['support_artillery','regimental_infantry_guns'],supports);
assert.ok(dualSupport.soft>supportedInf.soft,'divisional and regimental artillery support must coexist as distinct support records');
assert.equal(dualSupport.need.artillery,supportedInf.need.artillery+4,'regimental infantry guns must add their own equipment requirement instead of replacing divisional support artillery');

const spaceMarine=calcDivision([{type:'medium_armor',count:1},{type:'infantry',count:9}],battalions,[],supports);
assert.ok(Math.abs(spaceMarine.armor-27.6)<1e-9,'armor should be weighted max + average, not max-only');

const base=battleContext(softAttacker,softTarget,opts);
const entrenched=battleContext(softAttacker,softTarget,{...opts,entrench:20});
assert.ok(entrenched.dDefense>base.dDefense && entrenched.dAttack>base.dAttack,'entrenchment must improve defender attack and defense');
const greenAir=battleContext(softAttacker,softTarget,{...opts,air:1});
assert.ok(greenAir.dDefense<base.dDefense,'attacker air superiority should reduce defender defense');

const prod=evaluateProduction([{type:'infantry_equipment',stock:0,target:1000,factories:5,priority:1}],{days:30,efficiency:100,efficiencyGain:0,maxEfficiency:100,outputBonus:0,baseFactoryOutput:4.5,resources:{steel:6}},equipment);
assert.equal(prod.lines[0].resourceRequired.steel,10,'resources must scale with assigned factories');
assert.ok(Math.abs(prod.lines[0].resourceFactor-.94)<1e-9,'resource shortage should degrade later factories progressively');


const capacityProd=evaluateProduction([
  {type:'infantry_equipment',stock:0,target:5000,factories:8,priority:5},
  {type:'artillery',stock:0,target:5000,factories:8,priority:1}
],{days:30,factories:10,efficiency:100,efficiencyGain:0,maxEfficiency:100,outputBonus:0,baseFactoryOutput:4.5,resources:{steel:100,tungsten:100}},equipment);
assert.equal(capacityProd.lines[0].effectiveFactories,8,'high-priority line should receive requested active factories first');
assert.equal(capacityProd.lines[1].effectiveFactories,2,'excess factory assignments must queue instead of creating phantom output');
assert.equal(capacityProd.queuedFactories,6,'planner should expose queued/inactive factory assignments');

const priorityProd=evaluateProduction([
  {type:'infantry_equipment',stock:0,target:1000,factories:5,priority:5},
  {type:'infantry_equipment',stock:0,target:1000,factories:5,priority:1}
],{days:30,efficiency:100,efficiencyGain:0,maxEfficiency:100,outputBonus:0,baseFactoryOutput:4.5,resources:{steel:10}},equipment);
assert.equal(priorityProd.lines[0].resourceFactor,1,'higher-priority production line should receive scarce resources first');
assert.ok(priorityProd.lines[1].resourceFactor<priorityProd.lines[0].resourceFactor,'lower-priority line should absorb the shortage');
const starved=evaluateProduction([{type:'infantry_equipment',stock:0,target:1000,factories:12,priority:1}],{days:30,efficiency:100,efficiencyGain:0,maxEfficiency:100,outputBonus:0,baseFactoryOutput:4.5,resources:{steel:0}},equipment);
assert.ok(Math.abs(starved.lines[0].resourceFactoryFactors.at(-1)-.10)<1e-9,'per-factory resource penalty must cap at 90%');

const eff=efficiencyProjection(50,100,180,100);
assert.ok(eff.end>eff.start && eff.end<=1,'production efficiency must rise toward its cap');
assert.ok(eff.average>eff.start && eff.average<eff.end,'projection should expose an average efficiency between start and end');

assert.equal(piercingDamageFactor(49,100),.5);
assert.equal(piercingDamageFactor(50,100),.65);
assert.equal(piercingDamageFactor(75,100),.8);
assert.equal(piercingDamageFactor(100,100),1);


const wideDefender=calcDivision([{type:'infantry',count:20}],battalions,['engineer'],supports);
const reserveAttacker=aggregateDivision(calcDivision([{type:'medium_armor',count:10},{type:'motorized',count:5}],battalions,['engineer'],supports),2);
const reserveThin=simulateBattle(reserveAttacker,aggregateDivision(wideDefender,2),{...opts,planning:.5,seed:77},180);
const reserveDeep=simulateBattle(reserveAttacker,aggregateDivision(wideDefender,3),{...opts,planning:.5,seed:77},180);
assert.ok(reserveDeep.avgHours>reserveThin.avgHours,'a committed division held in reserve should add combat depth instead of being ignored');

const seededA=simulateBattle(softAttacker,softTarget,{...opts,seed:1944},120);
const seededB=simulateBattle(softAttacker,softTarget,{...opts,seed:1944},120);
assert.deepEqual(
  [seededA.winRate,seededA.avgHours,seededA.attackerCasualtyRate],
  [seededB.winRate,seededB.avgHours,seededB.attackerCasualtyRate],
  'same simulation seed should reproduce the same result'
);
assert.ok(seededA.winRateLow<=seededA.winRate && seededA.winRateHigh>=seededA.winRate,'simulation should report a confidence interval around win rate');

const one=simulateOnce(softAttacker,softTarget,opts);
assert.ok(one.hours>=4,'land combat should respect the minimum combat duration baseline');
assert.ok(Object.keys(one.attackerEquipmentLosses).length>0,'battle results should estimate equipment replacement losses');

const traced=simulateBattle(softAttacker,softTarget,{...opts,seed:777},120);assert.ok(Array.isArray(traced.representative.timeline)&&traced.representative.timeline.length>=2,'seeded battle should include a representative AAR timeline');const traced2=simulateBattle(softAttacker,softTarget,{...opts,seed:777},120);assert.deepEqual(traced.representative.timeline,traced2.representative.timeline,'representative timeline should be reproducible with the same seed');
console.log('All engine invariants passed.');

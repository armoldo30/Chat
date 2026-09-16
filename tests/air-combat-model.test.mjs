import assert from 'node:assert/strict';
import builtin1192 from '../src/builtin1192.js';
import { applyAirDoctrineToVariant } from '../src/doctrine.js';
import { AIR_COMBAT_MODEL_1192, compareBuiltAirDesigns, configureAirDataPack } from '../src/air.js';

const close=(a,b,msg,eps=1e-12)=>assert.ok(Math.abs(a-b)<=eps,`${msg}: ${a} != ${b}`);
const base={name:'Fixture Fighter',airAttack:30,airDefense:20,agility:60,maxSpeed:500,reliability:.80,missionEfficiency:1,buildCost:30,carrier:false,source:'fixture',weight:10,thrust:10};
const run=(a=base,b=base,opts={})=>compareBuiltAirDesigns(a,b,{countA:100,countB:100,sorties:1000,mission:'air_superiority',missionEfficiencyA:1,missionEfficiencyB:1,detectionA:1,detectionB:1,...opts});

assert.equal(AIR_COMBAT_MODEL_1192.evidenceClass,'executable-inferred');
assert.equal(AIR_COMBAT_MODEL_1192.multiPlaneCap,3);
assert.equal(AIR_COMBAT_MODEL_1192.agilityDamageReduction,.45);

const symmetric=run();
close(symmetric.lossA,symmetric.lossB,'identical designs must trade symmetrically');
close(symmetric.exchangeA,1,'equal cost/stats must have IC parity');
close(symmetric.airPowerShareA,50,'equal designs must have equal analytical power share');
assert.equal(symmetric.engagementA.engagedAttackers,100);
assert.equal(symmetric.engagementB.engagedAttackers,100);

const attack=run({...base,airAttack:60});
assert.ok(attack.lossB>symmetric.lossB,'more air attack must increase inflicted losses');
close(attack.lossB,symmetric.lossB*2,'air attack enters base damage linearly');

const defended=run(base,{...base,airDefense:40});
assert.ok(defended.lossB<symmetric.lossB,'more defender air defense must reduce losses');
close(defended.lossB,symmetric.lossB/2,'doubling air defense halves otherwise-equal expected kills');

const agileDefender=run(base,{...base,agility:120});
assert.ok(agileDefender.lossB<symmetric.lossB,'defender agility advantage must mitigate incoming damage');
assert.ok(agileDefender.damageA.agilityMitigation>0,'agility mitigation must be explicit');
const agileAttacker=run({...base,agility:120},base);
close(agileAttacker.damageA.agilityMitigation,0,'attacker agility advantage must not create a fake positive damage bonus');

const fast=run({...base,maxSpeed:700},base);
assert.ok(fast.lossB>symmetric.lossB,'attacker speed advantage must increase damage');
assert.ok(fast.damageA.relativeSpeedBonus>0&&fast.damageA.absoluteSpeedBonus>0,'speed bonuses must be explicit');
const slow=run({...base,maxSpeed:400},base);
close(slow.damageA.relativeSpeedBonus,0,'slower attacker gets no relative-speed bonus');
close(slow.damageA.absoluteSpeedBonus,0,'slower attacker gets no absolute-speed bonus');

const unreliable=run({...base,reliability:.20},base);
close(unreliable.lossB,symmetric.lossB,'reliability must not directly change dogfight lethality');
close(unreliable.lossA,symmetric.lossA,'reliability must not directly change incoming dogfight damage');

const outnumber=run(base,base,{countA:1000,countB:100});
close(outnumber.engagementA.engagedAttackers,300,'3:1 multipane cap limits firing attackers');
assert.ok(outnumber.engagementA.availableAttackers>outnumber.engagementA.engagedAttackers);
const limitedDetection=run(base,base,{countA:1000,countB:100,detectionA:.25});
close(limitedDetection.engagementA.detectedTargets,25,'detection constrains visible targets');
close(limitedDetection.engagementA.engagedAttackers,75,'detection and 3:1 cap constrain engaged attackers');
assert.ok(limitedDetection.lossB<outnumber.lossB,'worse detection reduces expected kills');

// Source Air doctrine detection factors modify the explicit Air Lab baseline; they do not construct regional detection.
configureAirDataPack(builtin1192,1940);
assert.equal(builtin1192.doctrines.new_battlefield_support.raw.air_superiority_detect_factor,.15,'Battlefield Support source grand doctrine carries +15% Air Superiority detection');
const doctrineState={grand:'battlefield_support',tracks:{fighter_aircraft:{choice:'tactical_flexibility',mastery:0},strike_aircraft:{choice:'flying_artillery',mastery:0},medium_aircraft:{choice:'bomber_interception',mastery:0},heavy_aircraft:{choice:'flying_fortresses',mastery:0}}};
const doctrineFighter=applyAirDoctrineToVariant({...base,roles:['fighter'],equipmentTypes:['fighter']},doctrineState,builtin1192);
const doctrineDetected=run(doctrineFighter,base,{countA:1000,countB:100,detectionA:.25});
close(doctrineDetected.doctrineDetectionFactorA,.15,'source Air Superiority detection factor is exposed explicitly');
close(doctrineDetected.engagementA.detectionFraction,.2875,'+15% doctrine factor scales a 25% explicit detection baseline to 28.75%');
close(doctrineDetected.engagementA.detectedTargets,28.75,'scaled detection changes visible targets before the 3:1 engagement cap');
const doctrineCas=compareBuiltAirDesigns(doctrineFighter,base,{countA:1000,countB:100,sorties:1000,mission:'cas',missionEfficiencyA:1,missionEfficiencyB:1,detectionA:.25,detectionB:1});
close(doctrineCas.doctrineDetectionFactorA,0,'Air Superiority detection modifier does not leak into CAS');
close(doctrineCas.engagementA.detectionFraction,.25,'CAS retains the explicit detection baseline');
const interceptionOnlyState={...doctrineState,grand:'operational_integrity'};
const interceptionOnly=applyAirDoctrineToVariant({...base,roles:['fighter'],equipmentTypes:['fighter']},interceptionOnlyState,builtin1192);
assert.equal(builtin1192.doctrines.new_operational_integrity.raw.air_interception_detect_factor,.2,'Operational Integrity source grand doctrine retains its separate interception detection field');
const noInterceptionLeak=run(interceptionOnly,base,{countA:1000,countB:100,detectionA:.25});
close(noInterceptionLeak.doctrineDetectionFactorA,0,'interception detection does not leak into Air Superiority');
close(noInterceptionLeak.engagementA.detectionFraction,.25,'Air Superiority baseline is unchanged by interception-only detection');

const lowMission=run(base,base,{countA:300,countB:100,missionEfficiencyA:.5});
close(lowMission.engagementA.availableAttackers,150,'sub-100% mission efficiency reduces participating aircraft');
assert.ok(lowMission.lossB<run(base,base,{countA:300,countB:100}).lossB,'lower mission efficiency reduces expected kills');
const highMission=run(base,base,{countA:100,countB:100,missionEfficiencyA:1.25});
close(highMission.engagementA.engagedAttackers,100,'mission efficiency above 100% cannot invent aircraft');
close(highMission.engagementA.operationalTempo,1.25,'above-100% mission efficiency is treated as operational tempo');
assert.ok(highMission.lossB>symmetric.lossB,'above-100% mission efficiency can increase exposure tempo');

const carrier=run({...base,carrier:true},{...base,carrier:true});
close(carrier.damageA.carrierFactor,5,'carrier-vs-carrier combat uses documented carrier damage factor');
close(carrier.lossB,symmetric.lossB*5,'carrier factor scales dogfight expected losses');

const swapped=compareBuiltAirDesigns({...base,airAttack:42,buildCost:35},{...base,airDefense:27,agility:75,maxSpeed:530,buildCost:32},{countA:130,countB:85,sorties:1400,mission:'air_superiority',missionEfficiencyA:.8,missionEfficiencyB:.95,detectionA:.7,detectionB:.9});
const reverse=compareBuiltAirDesigns({...base,airDefense:27,agility:75,maxSpeed:530,buildCost:32},{...base,airAttack:42,buildCost:35},{countA:85,countB:130,sorties:1400,mission:'air_superiority',missionEfficiencyA:.95,missionEfficiencyB:.8,detectionA:.9,detectionB:.7});
close(swapped.lossA,reverse.lossB,'swap symmetry: A losses become B losses');
close(swapped.lossB,reverse.lossA,'swap symmetry: B losses become A losses');
assert.ok(Number.isFinite(swapped.lossA)&&Number.isFinite(swapped.lossB));
assert.ok(swapped.lossA>=0&&swapped.lossA<=130&&swapped.lossB>=0&&swapped.lossB<=85);

console.log('Air combat executable-inferred model invariants passed.');
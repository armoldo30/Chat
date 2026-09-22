import assert from 'node:assert/strict';
import supportA from '../src/builtin1193/support-subunits-complete-a.js';
import supportB from '../src/builtin1193/support-subunits-complete-b.js';
import BUILTIN_1193 from '../src/builtin1193.js';
import { battalions, supports, equipment, terrain } from '../src/data.js';
import { hydrateGameData } from '../src/gameData.js';
import { calcDivision } from '../src/engine.js';
import { SUPPORT_EFFECT_RUNTIME_1193, SUPPORT_EFFECT_RUNTIME_1193_META } from '../src/builtin1193/support-effects-certification-1193.js';

const CANONICAL=new Set(['game-file exact','executable inferred','planner analytical','oracle-validated','oracle-divergent','unvalidated']);
function rows(node,prefix=''){
  const out=[];
  for(const [key,value] of Object.entries(node||{})){
    const path=prefix?prefix+'.'+key:key;
    if(value&&typeof value==='object'&&!Array.isArray(value)&&'runtimeEvidence' in value)out.push([path,value]);
    else if(value&&typeof value==='object'&&!Array.isArray(value))out.push(...rows(value,path));
  }
  return out;
}

const coverage=rows(SUPPORT_EFFECT_RUNTIME_1193);
assert.ok(coverage.length>=20,'support runtime ledger should explicitly cover the retained specialist mechanics');
for(const [path,row] of coverage)assert.ok(CANONICAL.has(row.runtimeEvidence),`${path} must use a canonical evidence label`);

assert.equal(SUPPORT_EFFECT_RUNTIME_1193.structural.allowedBattalionGroups.runtimeEvidence,'game-file exact');
assert.equal(SUPPORT_EFFECT_RUNTIME_1193.structural.sameSupportType.runtimeEvidence,'game-file exact');
assert.equal(SUPPORT_EFFECT_RUNTIME_1193.structural.hqEligibility.runtimeEvidence,'game-file exact');
assert.equal(SUPPORT_EFFECT_RUNTIME_1193.combat.initiative.state,'aggregated-not-used-downstream');
assert.equal(SUPPORT_EFFECT_RUNTIME_1193.combat.battalionMult.runtimeEvidence,'executable inferred');
assert.equal(SUPPORT_EFFECT_RUNTIME_1193.combat.battalionMult.state,'consumed-bounded-core-stats');
assert.equal(SUPPORT_EFFECT_RUNTIME_1193.logisticsAndLosses.supplyConsumptionFactor.runtimeEvidence,'executable inferred');
assert.equal(SUPPORT_EFFECT_RUNTIME_1193.logisticsAndLosses.casualtyTrickleback.runtimeEvidence,'executable inferred');
assert.equal(SUPPORT_EFFECT_RUNTIME_1193.specialist.enableAbility.runtimeEvidence,'unvalidated');

const source={...supportA,...supportB},values=Object.values(source);
const present={
  battalionMult:values.some(x=>x.battalionMult?.length),
  recon:values.some(x=>Number(x.recon)!==0&&x.recon!==undefined),
  entrenchment:values.some(x=>Number(x.entrenchment)!==0&&x.entrenchment!==undefined),
  initiative:values.some(x=>Number(x.initiative)!==0&&x.initiative!==undefined),
  reliabilityFactor:values.some(x=>Number(x.reliabilityFactor)!==0&&x.reliabilityFactor!==undefined),
  equipmentCaptureFactor:values.some(x=>Number(x.equipmentCaptureFactor)!==0&&x.equipmentCaptureFactor!==undefined),
  supplyConsumptionFactor:values.some(x=>Number(x.supplyConsumptionFactor)!==0&&x.supplyConsumptionFactor!==undefined),
  fuelConsumptionFactor:values.some(x=>Number(x.fuelConsumptionFactor)!==0&&x.fuelConsumptionFactor!==undefined),
  casualtyTrickleback:values.some(x=>Number(x.casualtyTrickleback)!==0&&x.casualtyTrickleback!==undefined),
  experienceLossFactor:values.some(x=>Number(x.experienceLossFactor)!==0&&x.experienceLossFactor!==undefined),
  suppressionFactor:values.some(x=>Number(x.suppressionFactor)!==0&&x.suppressionFactor!==undefined),
  deployedLeaderModifiers:values.some(x=>x.deployedLeaderModifiers&&Object.keys(x.deployedLeaderModifiers).length),
  enableAbility:values.some(x=>x.enableAbility?.length)
};
for(const [field,isPresent] of Object.entries(present))assert.equal(isPresent,true,`audited support catalog should exercise retained field ${field}`);

assert.equal(SUPPORT_EFFECT_RUNTIME_1193_META.gameVersion,'1.19.3');
assert.equal(SUPPORT_EFFECT_RUNTIME_1193_META.broadResolverPromotion,false);
assert.equal(SUPPORT_EFFECT_RUNTIME_1193_META.followupIssue,46);

hydrateGameData(BUILTIN_1193,{battalions,supports,equipment,terrain},{year:1940});
const artilleryBase=calcDivision([{type:'artillery',count:1}],battalions,[],supports);
const artilleryRecon=calcDivision([{type:'artillery',count:1}],battalions,['recon'],supports);
assert.ok(Math.abs((artilleryRecon.soft-(Number(supports.recon.soft)||0))/artilleryBase.soft-1.10)<1e-9,'1.19.3 recon battalion_mult must give matching artillery +10% soft attack in addition to Recon\'s own direct support stats');
const infantryBase=calcDivision([{type:'infantry',count:1}],battalions,[],supports);
const infantryHospital=calcDivision([{type:'infantry',count:1}],battalions,['field_hospital'],supports);
assert.ok(infantryHospital.hp>infantryBase.hp,'1.19.3 field hospital battalion_mult must increase matching infantry HP');
assert.equal(infantryHospital.casualtyTrickleback,.2,'1.19.3 field hospital must expose its 20% casualty trickleback to combat-loss reporting');
const logistics=calcDivision([{type:'infantry',count:1}],battalions,['logistics'],supports);
assert.ok(logistics.supply<infantryBase.supply+supports.logistics.supply,'1.19.3 logistics supply factor must reduce the combined division supply-use total');

console.log('Support-effect runtime evidence-boundary audit passed.');

import { averageEfficiency, evaluateProduction, militaryFactoryOutputProfile } from './engine.js';
import { counterEquipment } from './counter-state-model.js';

const n=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const normalizeSide=side=>side==='defender'?'defender':'attacker';
const positive=x=>Math.max(0,n(x));

function scenarioFor(state){
  const p=state?.production||{};
  return {
    days:Math.max(1,n(p.days,180)),
    factories:Math.max(0,Math.floor(n(p.factories,0))),
    efficiency:n(p.efficiency,10),
    efficiencyGain:n(p.efficiencyGain,100),
    maxEfficiency:n(p.maxEfficiency,50),
    outputBonus:n(p.outputBonus,0),
    energySatisfaction:n(p.energySatisfaction,100),
    resources:{...(p.resources||{})}
  };
}

function productionBaseline(state,equipmentData,scenario){
  const lines=Array.isArray(state?.productionGoals)?state.productionGoals:[];
  return evaluateProduction(lines,scenario,equipmentData);
}

export function counterProductionBurden(snapshot,item,side='attacker'){
  side=normalizeSide(side);
  const state=snapshot?.state||{},candidateState=item?.state||state,divisions=Math.max(1,Math.floor(n(state[side+'Divisions'],1)));
  const baseNeed=snapshot?.[side]?.need||{},nextNeed=item?.stats?.need||baseNeed;
  const baseEquipment=counterEquipment(state,side),nextEquipment=counterEquipment(candidateState,side),types=new Set([...Object.keys(baseNeed),...Object.keys(nextNeed)]);
  const scenario=scenarioFor(state),baseline=productionBaseline(state,baseEquipment,scenario),factoryProfile=militaryFactoryOutputProfile(scenario.energySatisfaction,scenario.outputBonus),efficiency=averageEfficiency(scenario.efficiency,scenario.efficiencyGain,scenario.days,scenario.maxEfficiency);
  const baseFactoryIC=Math.max(.000001,factoryProfile.factoryICPerDay*Math.max(.000001,efficiency));
  const rows=[];let addedIC=0,factoryDays=0;
  for(const type of types){
    const baseQty=positive(baseNeed[type]),nextQty=positive(nextNeed[type]),baseEq=baseEquipment[type],nextEq=nextEquipment[type]||baseEq;
    if(!baseEq&&!nextEq)continue;
    const baseCost=positive(baseEq?.cost),nextCost=positive(nextEq?.cost),deltaICPerDivision=nextQty*nextCost-baseQty*baseCost,positiveIC=Math.max(0,deltaICPerDivision*divisions);
    if(positiveIC<=1e-9)continue;
    const outputFactor=Math.max(.000001,n(nextEq?.mioProduction?.outputFactor,1)),typeFactoryDays=positiveIC/(baseFactoryIC*outputFactor),averageFactories=typeFactoryDays/scenario.days;
    rows.push({type,baseQty,nextQty,deltaUnitsPerDivision:nextQty-baseQty,deltaICPerDivision,addedIC:positiveIC,factoryDays:typeFactoryDays,averageFactories,resources:{...(nextEq?.resources||{})}});
    addedIC+=positiveIC;factoryDays+=typeFactoryDays;
  }
  const factoriesForHorizon=factoryDays/scenario.days,unusedFactories=Math.max(0,n(baseline.unusedFactories)),factoryShortfall=Math.max(0,factoriesForHorizon-unusedFactories),resourceDraw={},resourceShortfall={};
  for(const row of rows)for(const [resource,qty] of Object.entries(row.resources||{}))resourceDraw[resource]=(resourceDraw[resource]||0)+positive(qty)*row.averageFactories;
  const remaining=baseline.resources?.remaining||{};
  for(const [resource,qty] of Object.entries(resourceDraw))resourceShortfall[resource]=Math.max(0,qty-positive(remaining[resource]));
  const constrainedResources=Object.entries(resourceShortfall).filter(([,qty])=>qty>.01).map(([resource])=>resource);
  const capacityPenalty=factoryShortfall*24+constrainedResources.reduce((sum,key)=>sum+resourceShortfall[key]*18,0);
  return {
    evidenceClass:'source-backed-production-projection',
    horizonDays:scenario.days,divisions,rows,addedIC,factoryDays,factoriesForHorizon,unusedFactories,factoryShortfall,
    resourceDraw,resourceRemaining:remaining,resourceShortfall,constrainedResources,capacityPenalty,
    baselineUsedFactories:n(baseline.usedFactories),baselineQueuedFactories:n(baseline.queuedFactories),
    assumptions:['Uses current production horizon, efficiency/output settings and existing production-plan resource allocation.','Does not price factory conversion/retooling efficiency loss, stockpile substitution, trade changes, or campaign fuel logistics.']
  };
}

export default counterProductionBurden;

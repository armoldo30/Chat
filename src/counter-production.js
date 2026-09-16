import { evaluateProduction } from './engine.js';

const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const normalizeSide=side=>side==='defender'?'defender':'attacker';
const labelFor=(type,equipment)=>String(equipment?.[type]?.name||type||'equipment').replaceAll('_',' ');

const unavailable=reason=>({
  available:false,reason,horizonDays:0,divisionCount:0,incrementalEquipment:{},rows:[],
  incrementalIC:0,coveredIC:0,shortfallIC:0,shortfallICPerDivision:0,coverageRatio:1,
  newProductionLines:[],inactiveProductionLines:[],resourceConstrainedTypes:[],currentPlanAdequate:true,
  additionalDays:0,searchPenalty:0,valuePenalty:0
});

// This is a planner-analytical interpretation of the user's saved production plan.
// The production output itself is evaluated by the audited production engine; Counter
// Analysis does not silently reassign factories, acquire resources, or invent stockpiles.
export function counterProductionPlanBurden(snapshot,item,side='attacker',equipmentData={}){
  side=normalizeSide(side);
  const state=snapshot?.state||{},scenario=state.production,goals=state.productionGoals;
  if(!scenario||typeof scenario!=='object')return unavailable('no-production-scenario');
  if(!Array.isArray(goals)||!goals.length)return unavailable('no-production-lines');
  if(!item?.stats?.need||typeof item.stats.need!=='object')return unavailable('no-candidate-demand');

  const divisionCount=Math.max(1,Math.floor(finite(state[side+'Divisions'],1))),baseNeed=snapshot?.[side]?.need||{},nextNeed=item.stats.need||{};
  const incrementalEquipment={};
  for(const type of new Set([...Object.keys(baseNeed),...Object.keys(nextNeed)])){
    const delta=Math.max(0,(finite(nextNeed[type])-finite(baseNeed[type]))*divisionCount);
    if(delta>1e-9)incrementalEquipment[type]=delta;
  }
  const horizonDays=Math.max(0,finite(scenario.days));
  if(!Object.keys(incrementalEquipment).length)return {
    ...unavailable('no-incremental-equipment'),available:true,reason:'no-incremental-equipment',horizonDays,divisionCount,currentPlanAdequate:true
  };

  const lines=goals.map(goal=>({...goal})),evaluated=evaluateProduction(lines,scenario,equipmentData),byType=new Map((evaluated.lines||[]).map(line=>[line.type,line]));
  const rows=[];let incrementalIC=0,coveredIC=0,shortfallIC=0,totalUnits=0,coveredUnits=0,hasInfiniteDelay=false,maxAdditionalDays=0;
  const newProductionLines=[],inactiveProductionLines=[],resourceConstrainedTypes=[];

  for(const [type,required] of Object.entries(incrementalEquipment)){
    const eq=equipmentData?.[type]||{},unitCost=Math.max(0,finite(eq.cost)),line=byType.get(type),assigned=Math.max(0,Math.floor(finite(line?.requestedFactories))),active=Math.max(0,Math.floor(finite(line?.effectiveFactories))),daily=Math.max(0,finite(line?.daily));
    const target=Math.max(0,finite(line?.target)),ending=Math.max(0,finite(line?.ending)),freeSurplus=line?Math.max(0,ending-target):0,covered=Math.min(required,freeSurplus),shortfall=Math.max(0,required-covered);
    const newLine=!line, inactiveLine=!!line&&active<=0,resourceFactor=line?Math.max(0,Math.min(1,finite(line.resourceFactor,1))):1,resourceConstrained=!!line&&active>0&&resourceFactor<.999999;
    const additionalDays=shortfall<=1e-9?0:daily>0?shortfall/daily:Infinity;
    if(newLine)newProductionLines.push(type);else if(inactiveLine)inactiveProductionLines.push(type);
    if(resourceConstrained)resourceConstrainedTypes.push(type);
    if(!Number.isFinite(additionalDays))hasInfiniteDelay=true;else maxAdditionalDays=Math.max(maxAdditionalDays,additionalDays);
    totalUnits+=required;coveredUnits+=covered;incrementalIC+=required*unitCost;coveredIC+=covered*unitCost;shortfallIC+=shortfall*unitCost;
    rows.push({type,label:labelFor(type,equipmentData),required,covered,shortfall,unitCost,incrementalIC:required*unitCost,shortfallIC:shortfall*unitCost,assignedFactories:assigned,activeFactories:active,daily,freeSurplus,target,ending,resourceFactor,resourceConstrained,newLine,inactiveLine,additionalDays,resources:{...(eq.resources||{})}});
  }

  const weightedTotal=incrementalIC>1e-9?incrementalIC:totalUnits,weightedCovered=incrementalIC>1e-9?coveredIC:coveredUnits,coverageRatio=weightedTotal>0?Math.max(0,Math.min(1,weightedCovered/weightedTotal)):1,shortfallRatio=1-coverageRatio;
  const shortfallICPerDivision=shortfallIC/divisionCount,currentPlanAdequate=shortfallRatio<=1e-6;
  const searchPenalty=Math.min(100,shortfallRatio*35+newProductionLines.length*28+inactiveProductionLines.length*18+resourceConstrainedTypes.length*10);
  const valuePenalty=shortfallICPerDivision*.5+newProductionLines.length*120+inactiveProductionLines.length*75+resourceConstrainedTypes.length*30;

  return {available:true,reason:'saved-production-plan',evidenceClass:'planner-analytical',horizonDays,divisionCount,incrementalEquipment,rows,incrementalIC,coveredIC,shortfallIC,shortfallICPerDivision,coverageRatio,shortfallRatio,newProductionLines,inactiveProductionLines,resourceConstrainedTypes,currentPlanAdequate,additionalDays:hasInfiniteDelay?Infinity:maxAdditionalDays,searchPenalty,valuePenalty,usedFactories:evaluated.usedFactories,requestedFactories:evaluated.requestedFactories,unusedFactories:evaluated.unusedFactories};
}

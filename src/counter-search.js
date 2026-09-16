import { aggregateDivision, simulateBattle, divisionEquipmentIC, calcDivision } from './engine.js';
import { counterEquipment, counterBattleOptions, counterTechData } from './counter-state-model.js';
import { buildCounterCandidates } from './counter-candidates.js';
import { buildForceDesignCandidates, counterForceKey } from './counter-force-candidates.js';
import { counterProductionPlanBurden } from './counter-production.js';
import { effectiveAttack } from './counter-diagnosis.js';
import { battalions, supports, equipment } from './data.js';
import { gridToCounts, filledInRegiment } from './designer.js';

const isForceKind=kind=>kind==='tank-design';
const isTemplateKind=kind=>['add-line','replace-line','add-support','replace-support'].includes(kind);
const BATTALION_IDS=Object.keys(battalions);
const SAFE_DEFAULTS={runs:50,firstStepLimit:18,beamWidth:3,secondPerSeedLimit:10,secondStepLimit:8};
const MIN_MEANINGFUL_GAIN=2;
const ARMOR_FAMILIES={light_armor:'light',medium_armor:'medium',heavy_armor:'heavy'};
const ARMOR_EQUIPMENT={light:'light_tank',medium:'medium_tank',heavy:'heavy_tank'};
const RETOOLING_WEIGHT={light:1,medium:2,heavy:3};
const SEARCH_RETOOLING_PENALTY={light:24,medium:48,heavy:86};
const VALUE_RETOOLING_PENALTY={light:180,medium:360,heavy:720};
const derivedCache=new WeakMap();
const normalizeSide=side=>side==='defender'?'defender':'attacker';
const otherSide=side=>side==='defender'?'attacker':'defender';

function armorFamiliesIn(grid){
  const counts=new Map(gridToCounts(grid,BATTALION_IDS).map(row=>[row.type,row.count]));
  return new Set(Object.entries(ARMOR_FAMILIES).filter(([type])=>(counts.get(type)||0)>0).map(([,family])=>family));
}
export function counterProductionPracticality(snapshot,item,side='attacker'){
  side=normalizeSide(side);
  const baseGrid=snapshot.state[side+'Grid'],baseFamilies=armorFamiliesIn(baseGrid),nextFamilies=armorFamiliesIn(item.grid||baseGrid),introduced=[...nextFamilies].filter(family=>!baseFamilies.has(family));
  if(!introduced.length)return {majorRetooling:false,introducedArmorFamilies:[],severity:0,searchPenalty:0,valuePenalty:0,resourceKeys:[]};
  const severity=Math.max(...introduced.map(family=>RETOOLING_WEIGHT[family]||1)),resourceKeys=[...new Set(introduced.flatMap(family=>Object.keys(equipment[ARMOR_EQUIPMENT[family]]?.resources||{})))];
  return {majorRetooling:true,introducedArmorFamilies:introduced,severity,searchPenalty:introduced.reduce((sum,family)=>sum+(SEARCH_RETOOLING_PENALTY[family]||20),0),valuePenalty:introduced.reduce((sum,family)=>sum+(VALUE_RETOOLING_PENALTY[family]||150),0),resourceKeys};
}
export function counterOperationalBurden(base,item){
  const baseSupply=Math.max(0,Number(base?.supply)||0),nextSupply=Math.max(0,Number(item?.stats?.supply)||0),supplyDelta=nextSupply-baseSupply,supplyPct=baseSupply>0?supplyDelta/baseSupply*100:0;
  return {supplyDelta,supplyPct,supplyValuePenalty:Math.max(0,supplyPct)*1.5};
}
export const isMeaningfulCounterImprovement=item=>(Number(item?.gain)||0)>=MIN_MEANINGFUL_GAIN;
function score(items,baseWin,baseIC,snapshot,side){
  const base=snapshot[side];
  return items.map(item=>{
    const gain=item.winRate-baseWin,deltaIC=item.ic-baseIC,complexity=Math.max(1,item.changeCount||1),practicality=item.practicality||counterProductionPracticality(snapshot,item,side),operationalBurden=counterOperationalBurden(base,item),productionPlan=item.productionPlan||{};
    return {...item,practicality,operationalBurden,gain,deltaIC,deltaPct:baseIC>0?deltaIC/baseIC*100:0,value:gain/(Math.max(0,deltaIC)+Math.max(5,baseIC*.01)+complexity*2+(practicality.valuePenalty||0)+(operationalBurden.supplyValuePenalty||0)+(productionPlan.valuePenalty||0))};
  });
}
function rank(scored){
  return scored.filter(isMeaningfulCounterImprovement).sort((a,b)=>b.gain-a.gain||a.changeCount-b.changeCount||a.deltaIC-b.deltaIC);
}
export function chooseCounterHighlights(ranked){
  if(!ranked.length)return {best:null,value:null,minimal:null};
  const best=ranked[0],local=ranked.filter(item=>!item.practicality?.majorRetooling),productionReady=local.filter(item=>!item.productionPlan?.available||item.productionPlan?.currentPlanAdequate),practical=productionReady.length?productionReady:local.length?local:ranked;
  const value=[...practical].sort((a,b)=>b.value-a.value||b.gain-a.gain)[0],practicalBest=Math.max(...practical.map(item=>item.gain)),meaningful=practical.filter(item=>item.gain>=Math.max(5,practicalBest*.35)),minimalSource=meaningful.length?meaningful:practical;
  return {best,value,minimal:[...minimalSource].sort((a,b)=>a.changeCount-b.changeCount||a.deltaIC-b.deltaIC||b.gain-a.gain)[0]};
}
function recommendationKey(item){return item?.key||`${item?.label||''}|${(item?.changes||[]).join('|')}`;}
export function buildCounterRecommendationGroups(highlights,ranked,maxCards=3){
  const roles=[['BEST RAW',highlights?.best],['BEST VALUE',highlights?.value],['SMALLEST CHANGE',highlights?.minimal]],groups=[],byKey=new Map();
  for(const [role,item] of roles){
    if(!item)continue;
    const key=recommendationKey(item),existing=byKey.get(key);
    if(existing)existing.roles.push(role);
    else{const group={item,roles:[role],alternative:false};groups.push(group);byKey.set(key,group);}
  }
  const used=new Set(groups.map(group=>recommendationKey(group.item))),fillOrder=[...(ranked||[]).filter(item=>!item.practicality?.majorRetooling&&(!item.productionPlan?.available||item.productionPlan?.currentPlanAdequate)),...(ranked||[]).filter(item=>!item.practicality?.majorRetooling),...(ranked||[]).filter(item=>item.practicality?.majorRetooling)];
  for(const item of fillOrder){
    if(groups.length>=maxCards)break;
    const key=recommendationKey(item);if(used.has(key))continue;
    groups.push({item,roles:['DISTINCT ALTERNATIVE'],alternative:true});used.add(key);
  }
  return groups.slice(0,Math.max(0,maxCards));
}
function candidatePool(snapshot,{side='attacker',state=snapshot.state,grid=state[side+'Grid'],supportKeys=state[side+'Supports'],priorChanges=[],priorKinds=[],limit=SAFE_DEFAULTS.firstStepLimit}={}){
  side=normalizeSide(side);
  const forceBudget=Math.min(5,Math.max(1,Math.round(limit*.2))),force=buildForceDesignCandidates(snapshot,{side,state,grid,supportKeys,priorChanges,priorKinds,limit:forceBudget}).filter(candidate=>candidate.kind==='tank-design');
  const templateBudget=Math.max(1,limit-force.length),templates=buildCounterCandidates(snapshot,{side,grid,supportKeys,priorChanges,priorKinds,limit:templateBudget});
  return [...force,...templates].slice(0,Math.max(1,limit));
}
function derivedFor(state,side){
  let cached=derivedCache.get(state);if(!cached){cached={};derivedCache.set(state,cached);}
  if(!cached[side])cached[side]={tech:counterTechData(state,side),equipment:counterEquipment(state,side)};
  return cached[side];
}
function divisionFor(state,side,grid,supportKeys){
  const data=derivedFor(state,side).tech,line=gridToCounts(grid,BATTALION_IDS),regimental=(state[side+'RegimentalSupports']||[]).filter((key,column)=>key&&supports[key]&&filledInRegiment(grid,column)>=3);
  return calcDivision(line,data.battalions,[...(supportKeys||[]),...regimental],data.supports);
}
function enrichCandidate(snapshot,candidate,side,contextState=snapshot.state){
  const state=candidate.state||contextState,target=snapshot[otherSide(side)],division=divisionFor(state,side,candidate.grid,candidate.supportKeys),equipmentData=derivedFor(state,side).equipment,baselineEquipmentData=derivedFor(snapshot.state,side).equipment,ic=divisionEquipmentIC(division.need,equipmentData),changeKinds=candidate.changeKinds||[candidate.kind],practicality=counterProductionPracticality(snapshot,candidate,side),productionPlan=counterProductionPlanBurden(snapshot,{...candidate,stats:division},side,equipmentData,baselineEquipmentData);
  return {...candidate,side,state,changeKinds,practicality,productionPlan,key:counterForceKey(candidate.grid,candidate.supportKeys,state,side),stats:division,ic,pierces:division.piercing>=target.armor,holdsArmor:division.armor>target.piercing};
}
function heuristic(snapshot,item,side){
  const base=snapshot[side],target=snapshot[otherSide(side)],basePressure=effectiveAttack(base,target),pressureGain=effectiveAttack(item.stats,target)-basePressure,survivalGain=side==='defender'?item.stats.def-base.def:item.stats.breakthrough-base.breakthrough,burden=counterOperationalBurden(base,item);
  let score=pressureGain*.12+survivalGain*.035+(item.stats.org-base.org)*.08;
  if(base.piercing<target.armor&&item.pierces)score+=120;
  else if(base.piercing<target.armor)score+=(item.stats.piercing-base.piercing)*.8;
  if(base.armor<=target.piercing&&item.holdsArmor)score+=90;
  if(base.armor>target.piercing&&!item.holdsArmor)score-=75;
  score-=Math.max(0,item.ic-snapshot[side+'IC'])*.003;
  score-=Math.max(0,burden.supplyPct)*.08;
  score-=Math.max(0,(item.changeCount||1)-1)*2;
  score-=item.practicality?.searchPenalty||0;
  score-=item.productionPlan?.searchPenalty||0;
  return score;
}
function simulateCandidate(snapshot,opponent,baseOptions,runs,item,side){
  const state=item.state||snapshot.state,candidate=aggregateDivision(item.stats,state[side+'Divisions']);
  const result=side==='attacker'?simulateBattle(candidate,opponent,baseOptions,runs):simulateBattle(opponent,candidate,baseOptions,runs);
  return {...item,winRate:side==='attacker'?result.attackerWinRate:result.defenderWinRate};
}
function finish(snapshot,side,runs,baselineWin,firstTested,secondTested){
  const baseIC=snapshot[side+'IC'],tested=[...firstTested,...secondTested],scored=score(tested,baselineWin,baseIC,snapshot,side).sort((a,b)=>b.gain-a.gain||a.changeCount-b.changeCount||a.deltaIC-b.deltaIC),ranked=rank([...scored]),highlights=chooseCounterHighlights(ranked),forceDesignCount=tested.filter(item=>(item.changeKinds||[item.kind]).some(isForceKind)).length;
  const mixedForceCount=secondTested.filter(item=>{const kinds=item.changeKinds||[];return kinds.some(isForceKind)&&kinds.some(isTemplateKind);}).length;
  return {fingerprint:snapshot.fingerprint,side,runs,baseline:{winRate:baselineWin,ic:baseIC},ranked,highlights,recommendations:buildCounterRecommendationGroups(highlights,ranked),bestTested:scored[0]||null,bestEfforts:scored.slice(0,5),meaningfulThreshold:MIN_MEANINGFUL_GAIN,testedCount:tested.length,oneChangeCount:firstTested.length,multiChangeCount:secondTested.length,forceDesignCount,mixedForceCount,maxDepth:2};
}
function normalizedOptions(options={}){return {...SAFE_DEFAULTS,...options,side:normalizeSide(options.side)};}
function yieldControl(){return new Promise(resolve=>setTimeout(resolve,0));}
function abortIfNeeded(cancelled){if(cancelled?.()){const error=new Error('Counter search cancelled');error.name='AbortError';throw error;}}

export function runCounterSearch(snapshot,options={}){
  const {side,runs,firstStepLimit,beamWidth,secondPerSeedLimit,secondStepLimit}=normalizedOptions(options),{state,attacker,defender}=snapshot;
  const battleOptions={...counterBattleOptions(state),seed:`${state.battlefield.seed??1944}:counter-v8:${side}`},attackerForce=aggregateDivision(attacker,state.attackerDivisions),defenderForce=aggregateDivision(defender,state.defenderDivisions),baseline=simulateBattle(attackerForce,defenderForce,battleOptions,runs),baselineWin=side==='attacker'?baseline.attackerWinRate:baseline.defenderWinRate,opponent=side==='attacker'?defenderForce:attackerForce;
  const firstRaw=candidatePool(snapshot,{side,limit:firstStepLimit}),firstEnriched=firstRaw.map(candidate=>enrichCandidate(snapshot,candidate,side,state));
  const firstTested=firstEnriched.map(item=>simulateCandidate(snapshot,opponent,battleOptions,runs,item,side));
  const beam=[...firstTested].sort((a,b)=>(b.winRate+heuristic(snapshot,b,side)*.08)-(a.winRate+heuristic(snapshot,a,side)*.08)||a.ic-b.ic).slice(0,Math.max(1,beamWidth));
  const seen=new Set([counterForceKey(state[side+'Grid'],state[side+'Supports'],state,side),...firstEnriched.map(item=>item.key)]),secondPool=[];
  for(const seed of beam){
    const seedState=seed.state||state;
    for(const candidate of candidatePool(snapshot,{side,state:seedState,grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds||[seed.kind],limit:secondPerSeedLimit})){
      const enriched=enrichCandidate(snapshot,candidate,side,seedState);if(seen.has(enriched.key))continue;seen.add(enriched.key);secondPool.push(enriched);
    }
  }
  const secondSelected=[...secondPool].sort((a,b)=>heuristic(snapshot,b,side)-heuristic(snapshot,a,side)||a.ic-b.ic).slice(0,Math.max(0,secondStepLimit));
  const secondTested=secondSelected.map(item=>simulateCandidate(snapshot,opponent,battleOptions,runs,item,side));
  return finish(snapshot,side,runs,baselineWin,firstTested,secondTested);
}

export async function runCounterSearchResponsive(snapshot,options={}){
  const {side,runs,firstStepLimit,beamWidth,secondPerSeedLimit,secondStepLimit,onProgress,cancelled}=normalizedOptions(options),{state,attacker,defender}=snapshot;
  const battleOptions={...counterBattleOptions(state),seed:`${state.battlefield.seed??1944}:counter-v8:${side}`},attackerForce=aggregateDivision(attacker,state.attackerDivisions),defenderForce=aggregateDivision(defender,state.defenderDivisions),opponent=side==='attacker'?defenderForce:attackerForce;
  abortIfNeeded(cancelled);onProgress?.({phase:'baseline',completed:0,total:firstStepLimit+secondStepLimit});
  const baseline=simulateBattle(attackerForce,defenderForce,battleOptions,runs),baselineWin=side==='attacker'?baseline.attackerWinRate:baseline.defenderWinRate;await yieldControl();abortIfNeeded(cancelled);
  const firstRaw=candidatePool(snapshot,{side,limit:firstStepLimit}),firstEnriched=[];
  for(let i=0;i<firstRaw.length;i++){firstEnriched.push(enrichCandidate(snapshot,firstRaw[i],side,state));if(i%3===2){await yieldControl();abortIfNeeded(cancelled);}}
  const firstTested=[];
  for(let i=0;i<firstEnriched.length;i++){
    firstTested.push(simulateCandidate(snapshot,opponent,battleOptions,runs,firstEnriched[i],side));onProgress?.({phase:'first',completed:i+1,total:firstEnriched.length+secondStepLimit});await yieldControl();abortIfNeeded(cancelled);
  }
  const beam=[...firstTested].sort((a,b)=>(b.winRate+heuristic(snapshot,b,side)*.08)-(a.winRate+heuristic(snapshot,a,side)*.08)||a.ic-b.ic).slice(0,Math.max(1,beamWidth));
  const seen=new Set([counterForceKey(state[side+'Grid'],state[side+'Supports'],state,side),...firstEnriched.map(item=>item.key)]),secondPool=[];
  for(const seed of beam){
    const seedState=seed.state||state;
    for(const candidate of candidatePool(snapshot,{side,state:seedState,grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds||[seed.kind],limit:secondPerSeedLimit})){
      const enriched=enrichCandidate(snapshot,candidate,side,seedState);if(seen.has(enriched.key))continue;seen.add(enriched.key);secondPool.push(enriched);
    }
    await yieldControl();abortIfNeeded(cancelled);
  }
  const secondSelected=[...secondPool].sort((a,b)=>heuristic(snapshot,b,side)-heuristic(snapshot,a,side)||a.ic-b.ic).slice(0,Math.max(0,secondStepLimit)),secondTested=[];
  for(let i=0;i<secondSelected.length;i++){
    secondTested.push(simulateCandidate(snapshot,opponent,battleOptions,runs,secondSelected[i],side));onProgress?.({phase:'second',completed:firstTested.length+i+1,total:firstTested.length+secondSelected.length});await yieldControl();abortIfNeeded(cancelled);
  }
  return finish(snapshot,side,runs,baselineWin,firstTested,secondTested);
}

export const COUNTER_SEARCH_DEFAULTS={...SAFE_DEFAULTS};
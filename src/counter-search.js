import { aggregateDivision, simulateBattle, divisionEquipmentIC, calcDivision } from './engine.js';
import { counterEquipment, counterBattleOptions, counterTechData } from './counter-state-model.js';
import { buildCounterCandidates } from './counter-candidates.js';
import { buildForceDesignCandidates, counterForceKey } from './counter-force-candidates.js';
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

function armorFamiliesIn(grid){
  const counts=new Map(gridToCounts(grid,BATTALION_IDS).map(row=>[row.type,row.count]));
  return new Set(Object.entries(ARMOR_FAMILIES).filter(([type])=>(counts.get(type)||0)>0).map(([,family])=>family));
}
export function counterProductionPracticality(snapshot,item){
  const baseFamilies=armorFamiliesIn(snapshot.state.attackerGrid),nextFamilies=armorFamiliesIn(item.grid||snapshot.state.attackerGrid),introduced=[...nextFamilies].filter(family=>!baseFamilies.has(family));
  if(!introduced.length)return {majorRetooling:false,introducedArmorFamilies:[],severity:0,searchPenalty:0,valuePenalty:0,resourceKeys:[]};
  const severity=Math.max(...introduced.map(family=>RETOOLING_WEIGHT[family]||1)),resourceKeys=[...new Set(introduced.flatMap(family=>Object.keys(equipment[ARMOR_EQUIPMENT[family]]?.resources||{})))];
  return {majorRetooling:true,introducedArmorFamilies:introduced,severity,searchPenalty:introduced.reduce((sum,family)=>sum+(SEARCH_RETOOLING_PENALTY[family]||20),0),valuePenalty:introduced.reduce((sum,family)=>sum+(VALUE_RETOOLING_PENALTY[family]||150),0),resourceKeys};
}
function score(items,baseWin,baseIC,snapshot){
  return items.map(item=>{
    const gain=item.winRate-baseWin,deltaIC=item.ic-baseIC,complexity=Math.max(1,item.changeCount||1),practicality=item.practicality||counterProductionPracticality(snapshot,item);
    return {...item,practicality,gain,deltaIC,deltaPct:baseIC>0?deltaIC/baseIC*100:0,value:gain/(Math.max(0,deltaIC)+Math.max(5,baseIC*.01)+complexity*2+(practicality.valuePenalty||0))};
  });
}
function rank(scored){
  return scored.filter(item=>item.gain>=MIN_MEANINGFUL_GAIN).sort((a,b)=>b.gain-a.gain||a.changeCount-b.changeCount||a.deltaIC-b.deltaIC);
}
export function chooseCounterHighlights(ranked){
  if(!ranked.length)return {best:null,value:null,minimal:null};
  const best=ranked[0],local=ranked.filter(item=>!item.practicality?.majorRetooling),practical=local.length?local:ranked;
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
  const used=new Set(groups.map(group=>recommendationKey(group.item))),fillOrder=[...(ranked||[]).filter(item=>!item.practicality?.majorRetooling),...(ranked||[]).filter(item=>item.practicality?.majorRetooling)];
  for(const item of fillOrder){
    if(groups.length>=maxCards)break;
    const key=recommendationKey(item);if(used.has(key))continue;
    groups.push({item,roles:['DISTINCT ALTERNATIVE'],alternative:true});used.add(key);
  }
  return groups.slice(0,Math.max(0,maxCards));
}
function candidatePool(snapshot,{state=snapshot.state,grid=state.attackerGrid,supportKeys=state.attackerSupports,priorChanges=[],priorKinds=[],limit=SAFE_DEFAULTS.firstStepLimit}={}){
  const forceBudget=Math.min(5,Math.max(1,Math.round(limit*.2))),force=buildForceDesignCandidates(snapshot,{state,grid,supportKeys,priorChanges,priorKinds,limit:forceBudget}).filter(candidate=>candidate.kind==='tank-design');
  const templateBudget=Math.max(1,limit-force.length),templates=buildCounterCandidates(snapshot,{grid,supportKeys,priorChanges,priorKinds,limit:templateBudget});
  return [...force,...templates].slice(0,Math.max(1,limit));
}
function derivedFor(state){
  let cached=derivedCache.get(state);if(cached)return cached;
  cached={tech:counterTechData(state,'attacker'),equipment:counterEquipment(state,'attacker')};derivedCache.set(state,cached);return cached;
}
function divisionFor(state,grid,supportKeys){
  const data=derivedFor(state).tech,line=gridToCounts(grid,BATTALION_IDS),regimental=(state.attackerRegimentalSupports||[]).filter((key,column)=>key&&supports[key]&&filledInRegiment(grid,column)>=3);
  return calcDivision(line,data.battalions,[...(supportKeys||[]),...regimental],data.supports);
}
function enrichCandidate(snapshot,candidate,contextState=snapshot.state){
  const state=candidate.state||contextState,division=divisionFor(state,candidate.grid,candidate.supportKeys),equipmentData=derivedFor(state).equipment,ic=divisionEquipmentIC(division.need,equipmentData),changeKinds=candidate.changeKinds||[candidate.kind],practicality=counterProductionPracticality(snapshot,candidate);
  return {...candidate,state,changeKinds,practicality,key:counterForceKey(candidate.grid,candidate.supportKeys,state),stats:division,ic,pierces:division.piercing>=snapshot.defender.armor,holdsArmor:division.armor>snapshot.defender.piercing};
}
function heuristic(snapshot,item){
  const base=snapshot.attacker,target=snapshot.defender,basePressure=effectiveAttack(base,target),pressureGain=effectiveAttack(item.stats,target)-basePressure;
  let score=pressureGain*.12+(item.stats.breakthrough-base.breakthrough)*.035+(item.stats.org-base.org)*.08;
  if(base.piercing<target.armor&&item.pierces)score+=120;
  else if(base.piercing<target.armor)score+=(item.stats.piercing-base.piercing)*.8;
  if(base.armor<=target.piercing&&item.holdsArmor)score+=90;
  if(base.armor>target.piercing&&!item.holdsArmor)score-=75;
  score-=Math.max(0,item.ic-snapshot.attackerIC)*.003;
  score-=Math.max(0,(item.changeCount||1)-1)*2;
  score-=item.practicality?.searchPenalty||0;
  return score;
}
function simulateCandidate(snapshot,target,baseOptions,runs,item){
  const state=item.state||snapshot.state,result=simulateBattle(aggregateDivision(item.stats,state.attackerDivisions),target,baseOptions,runs);
  return {...item,winRate:result.winRate};
}
function finish(snapshot,runs,baseline,firstTested,secondTested){
  const tested=[...firstTested,...secondTested],scored=score(tested,baseline.winRate,snapshot.attackerIC,snapshot).sort((a,b)=>b.gain-a.gain||a.changeCount-b.changeCount||a.deltaIC-b.deltaIC),ranked=rank([...scored]),highlights=chooseCounterHighlights(ranked),forceDesignCount=tested.filter(item=>(item.changeKinds||[item.kind]).some(isForceKind)).length;
  const mixedForceCount=secondTested.filter(item=>{const kinds=item.changeKinds||[];return kinds.some(isForceKind)&&kinds.some(isTemplateKind);}).length;
  return {fingerprint:snapshot.fingerprint,runs,baseline:{winRate:baseline.winRate,ic:snapshot.attackerIC},ranked,highlights,recommendations:buildCounterRecommendationGroups(highlights,ranked),bestTested:scored[0]||null,bestEfforts:scored.slice(0,5),meaningfulThreshold:MIN_MEANINGFUL_GAIN,testedCount:tested.length,oneChangeCount:firstTested.length,multiChangeCount:secondTested.length,forceDesignCount,mixedForceCount,maxDepth:2};
}
function normalizedOptions(options={}){return {...SAFE_DEFAULTS,...options};}
function yieldControl(){return new Promise(resolve=>setTimeout(resolve,0));}
function abortIfNeeded(cancelled){if(cancelled?.()){const error=new Error('Counter search cancelled');error.name='AbortError';throw error;}}

export function runCounterSearch(snapshot,options={}){
  const {runs,firstStepLimit,beamWidth,secondPerSeedLimit,secondStepLimit}=normalizedOptions(options),{state,attacker,defender}=snapshot;
  const battleOptions={...counterBattleOptions(state),seed:`${state.battlefield.seed??1944}:counter-v6`},target=aggregateDivision(defender,state.defenderDivisions);
  const baseline=simulateBattle(aggregateDivision(attacker,state.attackerDivisions),target,battleOptions,runs);
  const firstRaw=candidatePool(snapshot,{limit:firstStepLimit}),firstEnriched=firstRaw.map(candidate=>enrichCandidate(snapshot,candidate,state));
  const firstTested=firstEnriched.map(item=>simulateCandidate(snapshot,target,battleOptions,runs,item));
  const beam=[...firstTested].sort((a,b)=>(b.winRate+heuristic(snapshot,b)*.08)-(a.winRate+heuristic(snapshot,a)*.08)||a.ic-b.ic).slice(0,Math.max(1,beamWidth));
  const seen=new Set([counterForceKey(state.attackerGrid,state.attackerSupports,state),...firstEnriched.map(item=>item.key)]),secondPool=[];
  for(const seed of beam){
    const seedState=seed.state||state;
    for(const candidate of candidatePool(snapshot,{state:seedState,grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds||[seed.kind],limit:secondPerSeedLimit})){
      const enriched=enrichCandidate(snapshot,candidate,seedState);if(seen.has(enriched.key))continue;seen.add(enriched.key);secondPool.push(enriched);
    }
  }
  const secondSelected=[...secondPool].sort((a,b)=>heuristic(snapshot,b)-heuristic(snapshot,a)||a.ic-b.ic).slice(0,Math.max(0,secondStepLimit));
  const secondTested=secondSelected.map(item=>simulateCandidate(snapshot,target,battleOptions,runs,item));
  return finish(snapshot,runs,baseline,firstTested,secondTested);
}

export async function runCounterSearchResponsive(snapshot,options={}){
  const {runs,firstStepLimit,beamWidth,secondPerSeedLimit,secondStepLimit,onProgress,cancelled}=normalizedOptions(options),{state,attacker,defender}=snapshot;
  const battleOptions={...counterBattleOptions(state),seed:`${state.battlefield.seed??1944}:counter-v6`},target=aggregateDivision(defender,state.defenderDivisions);
  abortIfNeeded(cancelled);onProgress?.({phase:'baseline',completed:0,total:firstStepLimit+secondStepLimit});
  const baseline=simulateBattle(aggregateDivision(attacker,state.attackerDivisions),target,battleOptions,runs);await yieldControl();abortIfNeeded(cancelled);
  const firstRaw=candidatePool(snapshot,{limit:firstStepLimit}),firstEnriched=[];
  for(let i=0;i<firstRaw.length;i++){firstEnriched.push(enrichCandidate(snapshot,firstRaw[i],state));if(i%3===2){await yieldControl();abortIfNeeded(cancelled);}}
  const firstTested=[];
  for(let i=0;i<firstEnriched.length;i++){
    firstTested.push(simulateCandidate(snapshot,target,battleOptions,runs,firstEnriched[i]));onProgress?.({phase:'first',completed:i+1,total:firstEnriched.length+secondStepLimit});await yieldControl();abortIfNeeded(cancelled);
  }
  const beam=[...firstTested].sort((a,b)=>(b.winRate+heuristic(snapshot,b)*.08)-(a.winRate+heuristic(snapshot,a)*.08)||a.ic-b.ic).slice(0,Math.max(1,beamWidth));
  const seen=new Set([counterForceKey(state.attackerGrid,state.attackerSupports,state),...firstEnriched.map(item=>item.key)]),secondPool=[];
  for(const seed of beam){
    const seedState=seed.state||state;
    for(const candidate of candidatePool(snapshot,{state:seedState,grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds||[seed.kind],limit:secondPerSeedLimit})){
      const enriched=enrichCandidate(snapshot,candidate,seedState);if(seen.has(enriched.key))continue;seen.add(enriched.key);secondPool.push(enriched);
    }
    await yieldControl();abortIfNeeded(cancelled);
  }
  const secondSelected=[...secondPool].sort((a,b)=>heuristic(snapshot,b)-heuristic(snapshot,a)||a.ic-b.ic).slice(0,Math.max(0,secondStepLimit)),secondTested=[];
  for(let i=0;i<secondSelected.length;i++){
    secondTested.push(simulateCandidate(snapshot,target,battleOptions,runs,secondSelected[i]));onProgress?.({phase:'second',completed:firstTested.length+i+1,total:firstTested.length+secondSelected.length});await yieldControl();abortIfNeeded(cancelled);
  }
  return finish(snapshot,runs,baseline,firstTested,secondTested);
}

export const COUNTER_SEARCH_DEFAULTS={...SAFE_DEFAULTS};

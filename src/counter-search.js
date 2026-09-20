import { aggregateDivision, simulateBattle, divisionEquipmentIC, calcDivision } from './engine.js';
import { counterEquipment, counterBattleOptions, counterTechData } from './counter-state-model.js';
import { buildCounterCandidates } from './counter-candidates.js';
import { buildForceDesignCandidates, counterForceKey } from './counter-force-candidates.js';
import { matchupPriorityScore } from './counter-diagnosis.js';
import { counterProductionBurden } from './counter-production-burden.js';
import { battalions, supports, equipment } from './data.js';
import { gridToCounts, filledInRegiment, regimentGroup as gridRegimentGroup } from './designer.js';
import { ordinaryDivisionBattalionIds } from './division-designer-options.js';
import { regimentalSupportAllowed } from './regimental-support-1193.js';

const isForceKind=kind=>kind==='tank-design';
const isTemplateKind=kind=>['add-line','replace-line','add-support','replace-support','add-regimental-support','replace-regimental-support'].includes(kind);
const SAFE_DEFAULTS={runs:50,firstStepLimit:20,beamWidth:4,secondPerSeedLimit:12,secondStepLimit:10,previewMultiplier:4};
const DEEP_DEFAULTS={deep:false,thirdBeamWidth:3,thirdPerSeedLimit:8,thirdStepLimit:6};
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
  const counts=new Map(gridToCounts(grid,ordinaryDivisionBattalionIds(battalions)).map(row=>[row.type,row.count]));
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
    const gain=item.winRate-baseWin,deltaIC=item.ic-baseIC,complexity=Math.max(1,item.changeCount||1),practicality=item.practicality||counterProductionPracticality(snapshot,item,side),operationalBurden=counterOperationalBurden(base,item),productionBurden=counterProductionBurden(snapshot,item,side);
    const denominator=Math.max(0,deltaIC)+Math.max(5,baseIC*.01)+complexity*2+(practicality.valuePenalty||0)+(operationalBurden.supplyValuePenalty||0)+(productionBurden.capacityPenalty||0)*.15;
    return {...item,practicality,operationalBurden,productionBurden,gain,deltaIC,deltaPct:baseIC>0?deltaIC/baseIC*100:0,value:gain/Math.max(1,denominator)};
  });
}
function combatTieMargin(item){return Number(item?.battleQuality?.casualtyExchange)||0;}
function compareCounterCombat(a,b){
  return (Number(b?.gain)||0)-(Number(a?.gain)||0)
    ||combatTieMargin(b)-combatTieMargin(a)
    ||(Number(b?.battleQuality?.enemyCasualtyRate)||0)-(Number(a?.battleQuality?.enemyCasualtyRate)||0)
    ||(Number(a?.battleQuality?.ownCasualtyRate)||0)-(Number(b?.battleQuality?.ownCasualtyRate)||0)
    ||Math.max(1,Number(a?.changeCount)||1)-Math.max(1,Number(b?.changeCount)||1)
    ||(Number(a?.deltaIC)||0)-(Number(b?.deltaIC)||0);
}
function rank(scored){
  return scored.filter(isMeaningfulCounterImprovement).sort(compareCounterCombat);
}
export function chooseCounterHighlights(ranked){
  if(!ranked.length)return {best:null,value:null,minimal:null};
  const best=ranked[0],value=[...ranked].sort((a,b)=>b.value-a.value||b.gain-a.gain||combatTieMargin(b)-combatTieMargin(a)||a.changeCount-b.changeCount)[0],local=ranked.filter(item=>!item.practicality?.majorRetooling),minimalPool=local.length?local:ranked,practicalBest=Math.max(...minimalPool.map(item=>item.gain)),meaningful=minimalPool.filter(item=>item.gain>=Math.max(5,practicalBest*.35)),minimalSource=meaningful.length?meaningful:minimalPool;
  return {best,value,minimal:[...minimalSource].sort((a,b)=>a.changeCount-b.changeCount||a.deltaIC-b.deltaIC||b.gain-a.gain||combatTieMargin(b)-combatTieMargin(a))[0]};
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
  const used=new Set(groups.map(group=>recommendationKey(group.item)));
  for(const item of ranked||[]){
    if(groups.length>=maxCards)break;
    const key=recommendationKey(item);if(used.has(key))continue;
    groups.push({item,roles:['DISTINCT ALTERNATIVE'],alternative:true});used.add(key);
  }
  return groups.slice(0,Math.max(0,maxCards));
}
function candidateBucket(item){
  const kind=item?.kind||item?.changeKinds?.at?.(-1)||'';
  if(kind==='tank-design')return 'tank';
  if(kind.includes('regimental-support'))return 'regimental';
  if(kind.includes('support'))return 'support';
  if(kind.includes('line'))return 'line';
  return 'other';
}
export function selectDiverseCounterCandidates(items,limit,scoreFn=item=>Number(item?.previewScore)||0){
  const max=Math.max(0,Math.floor(Number(limit)||0));if(!max)return [];
  const ranked=[...(items||[])].sort((a,b)=>scoreFn(b)-scoreFn(a)||String(a.label||'').localeCompare(String(b.label||'')));if(ranked.length<=max)return ranked;
  const buckets=['line','support','regimental','tank'],reserve=max>=16?2:1,out=[],used=new Set();
  for(const bucket of buckets){
    let taken=0;
    for(const item of ranked){const key=recommendationKey(item);if(taken>=reserve)break;if(candidateBucket(item)!==bucket||used.has(key))continue;out.push(item);used.add(key);taken++;}
  }
  for(const item of ranked){if(out.length>=max)break;const key=recommendationKey(item);if(used.has(key))continue;out.push(item);used.add(key);}
  return out;
}
function candidatePool(snapshot,{side='attacker',state=snapshot.state,grid=state[side+'Grid'],supportKeys=state[side+'Supports'],priorChanges=[],priorKinds=[],limit=SAFE_DEFAULTS.firstStepLimit*SAFE_DEFAULTS.previewMultiplier}={}){
  side=normalizeSide(side);
  const previewLimit=Math.max(20,Math.floor(Number(limit)||20)),data=derivedFor(state,side).tech;
  const templates=buildCounterCandidates(snapshot,{side,state,grid,supportKeys,priorChanges,priorKinds,limit:Math.max(20,Math.ceil(previewLimit*.85)),battalionMap:data.battalions,supportMap:data.supports});
  const force=buildForceDesignCandidates(snapshot,{side,state,grid,supportKeys,priorChanges,priorKinds,limit:Math.max(8,Math.ceil(previewLimit*.35))}).filter(candidate=>candidate.kind==='tank-design');
  const seen=new Set(),combined=[];for(const item of [...templates,...force]){if(seen.has(item.key))continue;seen.add(item.key);combined.push(item);}
  return selectDiverseCounterCandidates(combined,previewLimit,item=>Number(item.previewScore)||0);
}
function derivedFor(state,side){
  let cached=derivedCache.get(state);if(!cached){cached={};derivedCache.set(state,cached);}
  if(!cached[side])cached[side]={tech:counterTechData(state,side),equipment:counterEquipment(state,side)};
  return cached[side];
}
function divisionFor(state,side,grid,supportKeys){
  const data=derivedFor(state,side).tech,line=gridToCounts(grid,ordinaryDivisionBattalionIds(data.battalions)),regimental=(state[side+'RegimentalSupports']||[]).filter((key,column)=>key&&data.supports[key]&&filledInRegiment(grid,column)>=3&&regimentalSupportAllowed(key,data.supports[key],gridRegimentGroup(grid,column,data.battalions)));
  return calcDivision(line,data.battalions,[...(supportKeys||[]),...regimental],data.supports);
}
function enrichCandidate(snapshot,candidate,side,contextState=snapshot.state){
  const state=candidate.state||contextState,target=snapshot[otherSide(side)],division=divisionFor(state,side,candidate.grid,candidate.supportKeys),equipmentData=derivedFor(state,side).equipment,ic=divisionEquipmentIC(division.need,equipmentData),changeKinds=candidate.changeKinds||[candidate.kind],practicality=counterProductionPracticality(snapshot,candidate,side);
  return {...candidate,side,state,changeKinds,practicality,key:counterForceKey(candidate.grid,candidate.supportKeys,state,side),stats:division,ic,pierces:division.piercing>=target.armor,holdsArmor:division.armor>target.piercing};
}
function heuristic(snapshot,item,side){
  const base=snapshot[side],burden=counterOperationalBurden(base,item),productionBurden=counterProductionBurden(snapshot,item,side);
  let score=matchupPriorityScore(base,item.stats,snapshot[otherSide(side)],{side,battlefield:snapshot.state.battlefield});
  score-=Math.max(0,item.ic-snapshot[side+'IC'])*.003;
  score-=Math.max(0,burden.supplyPct)*.08;
  score-=Math.max(0,productionBurden.factoryShortfall)*.5;
  score-=Math.max(0,productionBurden.constrainedResources?.length||0);
  score-=Math.max(0,(item.changeCount||1)-1)*2;
  score-=(item.practicality?.searchPenalty||0)*.65;
  return score;
}
function simulateCandidate(snapshot,opponent,baseOptions,runs,item,side){
  const state=item.state||snapshot.state,candidate=aggregateDivision(item.stats,state[side+'Divisions']);
  const result=side==='attacker'?simulateBattle(candidate,opponent,baseOptions,runs):simulateBattle(opponent,candidate,baseOptions,runs);
  const ownCasualtyRate=side==='attacker'?result.attackerCasualtyRate:result.defenderCasualtyRate,enemyCasualtyRate=side==='attacker'?result.defenderCasualtyRate:result.attackerCasualtyRate,ownHitsPerHour=side==='attacker'?result.attackerHitsPerHour:result.defenderHitsPerHour,enemyHitsPerHour=side==='attacker'?result.defenderHitsPerHour:result.attackerHitsPerHour;
  const battleQuality={ownCasualtyRate,enemyCasualtyRate,casualtyExchange:enemyCasualtyRate-ownCasualtyRate,ownHitsPerHour,enemyHitsPerHour,hitExchange:ownHitsPerHour-enemyHitsPerHour,avgHours:result.avgHours};
  return {...item,winRate:side==='attacker'?result.attackerWinRate:result.defenderWinRate,battleQuality};
}
function finish(snapshot,side,runs,baselineWin,firstTested,secondTested,thirdTested=[]){
  const baseIC=snapshot[side+'IC'],base=snapshot[side],target=snapshot[otherSide(side)],tested=[...firstTested,...secondTested,...thirdTested],scored=score(tested,baselineWin,baseIC,snapshot,side).sort(compareCounterCombat),ranked=rank([...scored]),highlights=chooseCounterHighlights(ranked),forceDesignCount=tested.filter(item=>(item.changeKinds||[item.kind]).some(isForceKind)).length,multiTested=[...secondTested,...thirdTested];
  const mixedForceCount=multiTested.filter(item=>{const kinds=item.changeKinds||[];return kinds.some(isForceKind)&&kinds.some(isTemplateKind);}).length;
  const coverage={
    line:tested.filter(item=>(item.changeKinds||[item.kind]).some(kind=>kind.includes('line'))).length,
    support:tested.filter(item=>(item.changeKinds||[item.kind]).some(kind=>kind.includes('support')&&!kind.includes('regimental'))).length,
    regimental:tested.filter(item=>(item.changeKinds||[item.kind]).some(kind=>kind.includes('regimental-support'))).length,
    tankDesign:forceDesignCount,
    piercingImprovement:tested.filter(item=>(Number(item.stats?.piercing)||0)>(Number(base.piercing)||0)+1e-9).length,
    piercingThreshold:tested.filter(item=>(Number(base.piercing)||0)<(Number(target.armor)||0)&&item.pierces).length,
    hardAttackImprovement:tested.filter(item=>(Number(item.stats?.hard)||0)>(Number(base.hard)||0)+1e-9).length,
    softAttackImprovement:tested.filter(item=>(Number(item.stats?.soft)||0)>(Number(base.soft)||0)+1e-9).length,
    airAttackImprovement:tested.filter(item=>(Number(item.stats?.airAttack)||0)>(Number(base.airAttack)||0)+1e-9).length,
    survivalImprovement:tested.filter(item=>(Number(item.stats?.[side==='defender'?'def':'breakthrough'])||0)>(Number(base[side==='defender'?'def':'breakthrough'])||0)+1e-9).length
  };
  return {fingerprint:snapshot.fingerprint,side,runs,baseline:{winRate:baselineWin,ic:baseIC},ranked,highlights,recommendations:buildCounterRecommendationGroups(highlights,ranked),bestTested:scored[0]||null,bestEfforts:scored.slice(0,5),coverage,meaningfulThreshold:MIN_MEANINGFUL_GAIN,testedCount:tested.length,oneChangeCount:firstTested.length,twoChangeCount:secondTested.length,threeChangeCount:thirdTested.length,multiChangeCount:secondTested.length+thirdTested.length,forceDesignCount,mixedForceCount,maxDepth:thirdTested.length?3:2};
}
function normalizedOptions(options={}){return {...SAFE_DEFAULTS,...DEEP_DEFAULTS,...options,side:normalizeSide(options.side)};}
function beamScore(snapshot,item,side){return item.winRate+combatTieMargin(item)*.05+heuristic(snapshot,item,side)*.08;}
function hasMeaningfulTested(snapshot,side,baselineWin,items){return score(items,baselineWin,snapshot[side+'IC'],snapshot,side).some(isMeaningfulCounterImprovement);}
function yieldControl(){return new Promise(resolve=>setTimeout(resolve,0));}
function abortIfNeeded(cancelled){if(cancelled?.()){const error=new Error('Counter search cancelled');error.name='AbortError';throw error;}}

export function runCounterSearch(snapshot,options={}){
  const {side,runs,firstStepLimit,beamWidth,secondPerSeedLimit,secondStepLimit,previewMultiplier,deep,thirdBeamWidth,thirdPerSeedLimit,thirdStepLimit}=normalizedOptions(options),{state,attacker,defender}=snapshot;
  const battleOptions={...counterBattleOptions(state),seed:`${state.battlefield.seed??1944}:counter-v9:${side}`},attackerForce=aggregateDivision(attacker,state.attackerDivisions),defenderForce=aggregateDivision(defender,state.defenderDivisions),baseline=simulateBattle(attackerForce,defenderForce,battleOptions,runs),baselineWin=side==='attacker'?baseline.attackerWinRate:baseline.defenderWinRate,opponent=side==='attacker'?defenderForce:attackerForce;
  const firstRaw=candidatePool(snapshot,{side,limit:firstStepLimit*previewMultiplier}),firstPreview=firstRaw.map(candidate=>enrichCandidate(snapshot,candidate,side,state)),firstEnriched=selectDiverseCounterCandidates(firstPreview,firstStepLimit,item=>heuristic(snapshot,item,side)),firstTested=firstEnriched.map(item=>simulateCandidate(snapshot,opponent,battleOptions,runs,item,side));
  const beam=selectDiverseCounterCandidates(firstTested,Math.max(1,beamWidth),item=>beamScore(snapshot,item,side)),seen=new Set([counterForceKey(state[side+'Grid'],state[side+'Supports'],state,side),...firstPreview.map(item=>item.key)]),secondPool=[];
  for(const seed of beam){
    const seedState=seed.state||state;
    for(const candidate of candidatePool(snapshot,{side,state:seedState,grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds||[seed.kind],limit:secondPerSeedLimit*previewMultiplier})){
      const enriched=enrichCandidate(snapshot,candidate,side,seedState);if(seen.has(enriched.key))continue;seen.add(enriched.key);secondPool.push(enriched);
    }
  }
  const secondSelected=selectDiverseCounterCandidates(secondPool,Math.max(0,secondStepLimit),item=>heuristic(snapshot,item,side)),secondTested=secondSelected.map(item=>simulateCandidate(snapshot,opponent,battleOptions,runs,item,side)),thirdPool=[];
  if(deep&&thirdStepLimit>0&&!hasMeaningfulTested(snapshot,side,baselineWin,[...firstTested,...secondTested])){
    const thirdSeeds=selectDiverseCounterCandidates(secondTested,Math.max(1,thirdBeamWidth),item=>beamScore(snapshot,item,side));
    for(const seed of thirdSeeds){
      const seedState=seed.state||state;
      for(const candidate of candidatePool(snapshot,{side,state:seedState,grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds||[seed.kind],limit:thirdPerSeedLimit*previewMultiplier})){
        const enriched=enrichCandidate(snapshot,candidate,side,seedState);if(seen.has(enriched.key))continue;seen.add(enriched.key);thirdPool.push(enriched);
      }
    }
  }
  const thirdSelected=selectDiverseCounterCandidates(thirdPool,Math.max(0,thirdStepLimit),item=>heuristic(snapshot,item,side)),thirdTested=thirdSelected.map(item=>simulateCandidate(snapshot,opponent,battleOptions,runs,item,side));
  return finish(snapshot,side,runs,baselineWin,firstTested,secondTested,thirdTested);
}

export async function runCounterSearchResponsive(snapshot,options={}){
  const {side,runs,firstStepLimit,beamWidth,secondPerSeedLimit,secondStepLimit,previewMultiplier,deep,thirdBeamWidth,thirdPerSeedLimit,thirdStepLimit,onProgress,cancelled}=normalizedOptions(options),{state,attacker,defender}=snapshot;
  const battleOptions={...counterBattleOptions(state),seed:`${state.battlefield.seed??1944}:counter-v9:${side}`},attackerForce=aggregateDivision(attacker,state.attackerDivisions),defenderForce=aggregateDivision(defender,state.defenderDivisions),opponent=side==='attacker'?defenderForce:attackerForce;
  const requestedTotal=firstStepLimit+secondStepLimit+(deep?thirdStepLimit:0);abortIfNeeded(cancelled);onProgress?.({phase:'screening',completed:0,total:requestedTotal});
  const baseline=simulateBattle(attackerForce,defenderForce,battleOptions,runs),baselineWin=side==='attacker'?baseline.attackerWinRate:baseline.defenderWinRate;await yieldControl();abortIfNeeded(cancelled);
  const firstRaw=candidatePool(snapshot,{side,limit:firstStepLimit*previewMultiplier}),firstPreview=[];
  for(let i=0;i<firstRaw.length;i++){firstPreview.push(enrichCandidate(snapshot,firstRaw[i],side,state));if(i%8===7){await yieldControl();abortIfNeeded(cancelled);}}
  const firstEnriched=selectDiverseCounterCandidates(firstPreview,firstStepLimit,item=>heuristic(snapshot,item,side)),firstTested=[];
  for(let i=0;i<firstEnriched.length;i++){
    firstTested.push(simulateCandidate(snapshot,opponent,battleOptions,runs,firstEnriched[i],side));onProgress?.({phase:'first',completed:i+1,total:requestedTotal});await yieldControl();abortIfNeeded(cancelled);
  }
  const beam=selectDiverseCounterCandidates(firstTested,Math.max(1,beamWidth),item=>beamScore(snapshot,item,side)),seen=new Set([counterForceKey(state[side+'Grid'],state[side+'Supports'],state,side),...firstPreview.map(item=>item.key)]),secondPool=[];
  for(const seed of beam){
    const seedState=seed.state||state,raw=candidatePool(snapshot,{side,state:seedState,grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds||[seed.kind],limit:secondPerSeedLimit*previewMultiplier});
    for(let i=0;i<raw.length;i++){
      const enriched=enrichCandidate(snapshot,raw[i],side,seedState);if(!seen.has(enriched.key)){seen.add(enriched.key);secondPool.push(enriched);}
      if(i%10===9){await yieldControl();abortIfNeeded(cancelled);}
    }
  }
  const secondSelected=selectDiverseCounterCandidates(secondPool,Math.max(0,secondStepLimit),item=>heuristic(snapshot,item,side)),secondTested=[];
  for(let i=0;i<secondSelected.length;i++){
    secondTested.push(simulateCandidate(snapshot,opponent,battleOptions,runs,secondSelected[i],side));onProgress?.({phase:'second',completed:firstTested.length+i+1,total:requestedTotal});await yieldControl();abortIfNeeded(cancelled);
  }
  const thirdPool=[];
  if(deep&&thirdStepLimit>0&&!hasMeaningfulTested(snapshot,side,baselineWin,[...firstTested,...secondTested])){
    const thirdSeeds=selectDiverseCounterCandidates(secondTested,Math.max(1,thirdBeamWidth),item=>beamScore(snapshot,item,side));
    for(const seed of thirdSeeds){
      const seedState=seed.state||state,raw=candidatePool(snapshot,{side,state:seedState,grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds||[seed.kind],limit:thirdPerSeedLimit*previewMultiplier});
      for(let i=0;i<raw.length;i++){
        const enriched=enrichCandidate(snapshot,raw[i],side,seedState);if(!seen.has(enriched.key)){seen.add(enriched.key);thirdPool.push(enriched);}
        if(i%10===9){await yieldControl();abortIfNeeded(cancelled);}
      }
    }
  }
  const thirdSelected=selectDiverseCounterCandidates(thirdPool,Math.max(0,thirdStepLimit),item=>heuristic(snapshot,item,side)),thirdTested=[];
  for(let i=0;i<thirdSelected.length;i++){
    thirdTested.push(simulateCandidate(snapshot,opponent,battleOptions,runs,thirdSelected[i],side));onProgress?.({phase:'third',completed:firstTested.length+secondTested.length+i+1,total:firstTested.length+secondTested.length+thirdSelected.length});await yieldControl();abortIfNeeded(cancelled);
  }
  return finish(snapshot,side,runs,baselineWin,firstTested,secondTested,thirdTested);
}

export const COUNTER_SEARCH_DEFAULTS={...SAFE_DEFAULTS};
export const COUNTER_DEEP_SEARCH_DEFAULTS={...DEEP_DEFAULTS};

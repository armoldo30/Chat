import { aggregateDivision, simulateBattle, divisionEquipmentIC } from './engine.js';
import { counterDivision, counterEquipment, counterBattleOptions } from './counter-state-model.js';
import { buildCounterCandidates } from './counter-candidates.js';
import { buildForceDesignCandidates, counterForceKey } from './counter-force-candidates.js';
import { effectiveAttack } from './counter-diagnosis.js';

const isForceKind=kind=>kind==='tank-design'||kind==='equipment-tech';
const isTemplateKind=kind=>['add-line','replace-line','add-support','replace-support'].includes(kind);

function rank(items,baseWin,baseIC){
  return items.map(item=>{const gain=item.winRate-baseWin,deltaIC=item.ic-baseIC,complexity=Math.max(1,item.changeCount||1),value=item.costUnpriced?Number.NEGATIVE_INFINITY:gain/(Math.max(0,deltaIC)+Math.max(5,baseIC*.01)+complexity*2);return {...item,gain,deltaIC,deltaPct:baseIC>0?deltaIC/baseIC*100:0,value};}).filter(item=>item.gain>=2).sort((a,b)=>b.gain-a.gain||a.changeCount-b.changeCount||a.deltaIC-b.deltaIC);
}
function pick(ranked){
  if(!ranked.length)return {best:null,value:null,minimal:null};
  const best=ranked[0],priced=ranked.filter(item=>!item.costUnpriced),value=priced.length?[...priced].sort((a,b)=>b.value-a.value||b.gain-a.gain)[0]:null,meaningful=ranked.filter(item=>item.gain>=Math.max(5,best.gain*.35)),pricedMeaningful=meaningful.filter(item=>!item.costUnpriced),minimalSource=pricedMeaningful.length?pricedMeaningful:priced;
  return {best,value,minimal:minimalSource.length?[...minimalSource].sort((a,b)=>a.changeCount-b.changeCount||a.deltaIC-b.deltaIC||b.gain-a.gain)[0]:null};
}
function candidatePool(snapshot,{state=snapshot.state,grid=state.attackerGrid,supportKeys=state.attackerSupports,priorChanges=[],priorKinds=[],limit=60}={}){
  const forceBudget=Math.min(18,Math.max(2,Math.round(limit*.3))),force=buildForceDesignCandidates(snapshot,{state,grid,supportKeys,priorChanges,priorKinds,limit:forceBudget});
  const templateBudget=Math.max(1,limit-force.length),templates=buildCounterCandidates(snapshot,{grid,supportKeys,priorChanges,priorKinds,limit:templateBudget});
  return [...force,...templates].slice(0,Math.max(1,limit));
}
function enrichCandidate(snapshot,candidate,contextState=snapshot.state){
  const state=candidate.state||contextState,division=counterDivision(state,'attacker',candidate.grid,candidate.supportKeys),equipment=counterEquipment(state,'attacker'),ic=divisionEquipmentIC(division.need,equipment),changeKinds=candidate.changeKinds||[candidate.kind],costUnpriced=changeKinds.includes('equipment-tech');
  return {...candidate,state,changeKinds,costUnpriced,key:counterForceKey(candidate.grid,candidate.supportKeys,state),stats:division,ic,pierces:division.piercing>=snapshot.defender.armor,holdsArmor:division.armor>snapshot.defender.piercing};
}
function heuristic(snapshot,item){
  const base=snapshot.attacker,target=snapshot.defender,basePressure=effectiveAttack(base,target),pressureGain=effectiveAttack(item.stats,target)-basePressure;
  let score=pressureGain*.12+(item.stats.breakthrough-base.breakthrough)*.035+(item.stats.org-base.org)*.08;
  if(base.piercing<target.armor&&item.pierces)score+=120;
  else if(base.piercing<target.armor)score+=(item.stats.piercing-base.piercing)*.8;
  if(base.armor<=target.piercing&&item.holdsArmor)score+=90;
  if(base.armor>target.piercing&&!item.holdsArmor)score-=75;
  score-=Math.max(0,item.ic-snapshot.attackerIC)*.003;
  if(item.costUnpriced)score-=6;
  score-=Math.max(0,(item.changeCount||1)-1)*2;
  return score;
}
function simulateCandidate(snapshot,target,baseOptions,runs,item){
  const state=item.state||snapshot.state,options={...counterBattleOptions(state),seed:baseOptions.seed},result=simulateBattle(aggregateDivision(item.stats,state.attackerDivisions),target,options,runs);
  return {...item,winRate:result.winRate};
}

export function runCounterSearch(snapshot,{runs=60,firstStepLimit=60,beamWidth=6,secondPerSeedLimit=36,secondStepLimit=42}={}){
  const {state,attacker,defender,attackerIC}=snapshot;
  const options={...counterBattleOptions(state),seed:`${state.battlefield.seed??1944}:counter-v3`},target=aggregateDivision(defender,state.defenderDivisions);
  const baseline=simulateBattle(aggregateDivision(attacker,state.attackerDivisions),target,options,runs);
  const firstRaw=candidatePool(snapshot,{limit:firstStepLimit}),firstEnriched=firstRaw.map(candidate=>enrichCandidate(snapshot,candidate,state));
  const firstTested=firstEnriched.map(item=>simulateCandidate(snapshot,target,options,runs,item));
  const beam=[...firstTested].sort((a,b)=>(b.winRate+heuristic(snapshot,b)*.08)-(a.winRate+heuristic(snapshot,a)*.08)||a.ic-b.ic).slice(0,Math.max(1,beamWidth));
  const seen=new Set([counterForceKey(state.attackerGrid,state.attackerSupports,state),...firstEnriched.map(item=>item.key)]),secondPool=[];
  for(const seed of beam){
    const seedState=seed.state||state;
    for(const candidate of candidatePool(snapshot,{state:seedState,grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,priorKinds:seed.changeKinds||[seed.kind],limit:secondPerSeedLimit})){
      const enriched=enrichCandidate(snapshot,candidate,seedState);if(seen.has(enriched.key))continue;seen.add(enriched.key);secondPool.push(enriched);
    }
  }
  const secondSelected=[...secondPool].sort((a,b)=>heuristic(snapshot,b)-heuristic(snapshot,a)||a.ic-b.ic).slice(0,Math.max(0,secondStepLimit));
  const secondTested=secondSelected.map(item=>simulateCandidate(snapshot,target,options,runs,item));
  const tested=[...firstTested,...secondTested],ranked=rank(tested,baseline.winRate,attackerIC),forceDesignCount=tested.filter(item=>(item.changeKinds||[item.kind]).some(isForceKind)).length;
  const mixedForceCount=secondTested.filter(item=>{const kinds=item.changeKinds||[];return kinds.some(isForceKind)&&kinds.some(isTemplateKind);}).length,unpricedCount=tested.filter(item=>item.costUnpriced).length;
  return {fingerprint:snapshot.fingerprint,runs,baseline:{winRate:baseline.winRate,ic:attackerIC},ranked,highlights:pick(ranked),testedCount:tested.length,oneChangeCount:firstTested.length,multiChangeCount:secondTested.length,forceDesignCount,mixedForceCount,unpricedCount,maxDepth:2};
}

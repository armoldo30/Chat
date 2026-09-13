import { aggregateDivision, simulateBattle, divisionEquipmentIC } from './engine.js';
import { counterDivision, counterEquipment, counterBattleOptions } from './counter-state-model.js';
import { buildCounterCandidates, counterTemplateKey } from './counter-candidates.js';
import { effectiveAttack } from './counter-diagnosis.js';

function rank(items,baseWin,baseIC){
  return items.map(item=>{const gain=item.winRate-baseWin,deltaIC=item.ic-baseIC,complexity=Math.max(1,item.changeCount||1);return {...item,gain,deltaIC,deltaPct:baseIC>0?deltaIC/baseIC*100:0,value:gain/(Math.max(0,deltaIC)+Math.max(5,baseIC*.01)+complexity*2)};}).filter(item=>item.gain>=2).sort((a,b)=>b.gain-a.gain||a.changeCount-b.changeCount||a.deltaIC-b.deltaIC);
}
function pick(ranked){
  if(!ranked.length)return {best:null,value:null,minimal:null};
  const best=ranked[0],value=[...ranked].sort((a,b)=>b.value-a.value||b.gain-a.gain)[0],pool=ranked.filter(item=>item.gain>=Math.max(5,best.gain*.35));
  return {best,value,minimal:[...(pool.length?pool:ranked)].sort((a,b)=>a.changeCount-b.changeCount||a.deltaIC-b.deltaIC||b.gain-a.gain)[0]};
}
function enrichCandidate(snapshot,equipment,candidate){
  const division=counterDivision(snapshot.state,'attacker',candidate.grid,candidate.supportKeys),ic=divisionEquipmentIC(division.need,equipment);
  return {...candidate,stats:division,ic,pierces:division.piercing>=snapshot.defender.armor,holdsArmor:division.armor>snapshot.defender.piercing};
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
  return score;
}
function simulateCandidate(snapshot,target,options,runs,item){
  const result=simulateBattle(aggregateDivision(item.stats,snapshot.state.attackerDivisions),target,options,runs);
  return {...item,winRate:result.winRate};
}

export function runCounterSearch(snapshot,{runs=60,beamWidth=6,secondStepLimit=48}={}){
  const {state,attacker,defender,attackerIC}=snapshot;
  const options={...counterBattleOptions(state),seed:`${state.battlefield.seed??1944}:counter-v2`},target=aggregateDivision(defender,state.defenderDivisions),equipment=counterEquipment(state,'attacker');
  const baseline=simulateBattle(aggregateDivision(attacker,state.attackerDivisions),target,options,runs);
  const firstRaw=buildCounterCandidates(snapshot,{limit:80}),firstEnriched=firstRaw.map(candidate=>enrichCandidate(snapshot,equipment,candidate));
  const firstTested=firstEnriched.map(item=>simulateCandidate(snapshot,target,options,runs,item));
  const beam=[...firstTested].sort((a,b)=>(b.winRate+heuristic(snapshot,b)*.08)-(a.winRate+heuristic(snapshot,a)*.08)||a.ic-b.ic).slice(0,Math.max(1,beamWidth));
  const seen=new Set([counterTemplateKey(state.attackerGrid,state.attackerSupports),...firstRaw.map(item=>item.key)]),secondPool=[];
  for(const seed of beam){
    for(const candidate of buildCounterCandidates(snapshot,{grid:seed.grid,supportKeys:seed.supportKeys,priorChanges:seed.changes,limit:48})){
      if(seen.has(candidate.key))continue;seen.add(candidate.key);secondPool.push(enrichCandidate(snapshot,equipment,candidate));
    }
  }
  const secondSelected=[...secondPool].sort((a,b)=>heuristic(snapshot,b)-heuristic(snapshot,a)||a.ic-b.ic).slice(0,Math.max(0,secondStepLimit));
  const secondTested=secondSelected.map(item=>simulateCandidate(snapshot,target,options,runs,item));
  const tested=[...firstTested,...secondTested],ranked=rank(tested,baseline.winRate,attackerIC);
  return {fingerprint:snapshot.fingerprint,runs,baseline:{winRate:baseline.winRate,ic:attackerIC},ranked,highlights:pick(ranked),testedCount:tested.length,oneChangeCount:firstTested.length,multiChangeCount:secondTested.length,maxDepth:2};
}

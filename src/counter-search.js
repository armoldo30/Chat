import { aggregateDivision, simulateBattle, divisionEquipmentIC } from './engine.js';
import { counterDivision, counterEquipment, counterBattleOptions } from './counter-state-model.js';
import { buildCounterCandidates } from './counter-candidates.js';

function rank(items,baseWin,baseIC){
  return items.map(item=>{const gain=item.winRate-baseWin,deltaIC=item.ic-baseIC;return {...item,gain,deltaIC,deltaPct:baseIC>0?deltaIC/baseIC*100:0,value:gain/(Math.max(0,deltaIC)+Math.max(5,baseIC*.01))};}).filter(item=>item.gain>=2).sort((a,b)=>b.gain-a.gain||a.deltaIC-b.deltaIC);
}
function pick(ranked){
  if(!ranked.length)return {best:null,value:null,minimal:null};
  const best=ranked[0],value=[...ranked].sort((a,b)=>b.value-a.value||b.gain-a.gain)[0],pool=ranked.filter(item=>item.gain>=Math.max(5,best.gain*.35));
  return {best,value,minimal:[...(pool.length?pool:ranked)].sort((a,b)=>a.deltaIC-b.deltaIC||b.gain-a.gain)[0]};
}

export function runCounterSearch(snapshot,{runs=60}={}){
  const {state,attacker,defender,attackerIC}=snapshot;
  const options={...counterBattleOptions(state),seed:`${state.battlefield.seed??1944}:counter-v1`};
  const target=aggregateDivision(defender,state.defenderDivisions),equipment=counterEquipment(state,'attacker');
  const baseline=simulateBattle(aggregateDivision(attacker,state.attackerDivisions),target,options,runs);
  const tested=buildCounterCandidates(snapshot).map(candidate=>{
    const division=counterDivision(state,'attacker',candidate.grid,candidate.supportKeys),result=simulateBattle(aggregateDivision(division,state.attackerDivisions),target,options,runs);
    return {...candidate,stats:division,winRate:result.winRate,ic:divisionEquipmentIC(division.need,equipment),pierces:division.piercing>=defender.armor,holdsArmor:division.armor>defender.piercing};
  });
  const ranked=rank(tested,baseline.winRate,attackerIC);
  return {fingerprint:snapshot.fingerprint,runs,baseline:{winRate:baseline.winRate,ic:attackerIC},ranked,highlights:pick(ranked)};
}

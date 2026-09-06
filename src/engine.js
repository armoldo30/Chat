import { COMBAT_CONSTANTS, PRODUCTION_CONSTANTS } from './data.js';

export function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }
export function fmt(n,d=1){ return Number.isFinite(n)?Number(n).toLocaleString(undefined,{maximumFractionDigits:d}):'—'; }

export function efficiencyProjection(start,growthModifier,days,max=100){
  let current=clamp((Number(start)||0)/100,0,1);
  const cap=clamp((Number(max)||100)/100,Math.max(.01,current),2);
  const mult=Math.max(0,(Number(growthModifier)||0)/100);
  const n=Math.max(0,Math.floor(Number(days)||0));
  let sum=0;
  for(let day=0;day<n;day++){
    sum+=current;
    if(current<cap){
      const gain=PRODUCTION_CONSTANTS.efficiencyBaseGain*mult*(cap*cap/Math.max(.01,current));
      current=Math.min(cap,current+gain);
    }
  }
  return {start:clamp((Number(start)||0)/100,0,1),end:current,average:n?sum/n:current,cap};
}

export function averageEfficiency(start,growthModifier,days,max=100){
  return efficiencyProjection(start,growthModifier,days,max).average;
}


function activeFactoryCounts(lines,totalFactories){
  const requested=lines.map(x=>clamp(Math.floor(Number(x.factories)||0),0,PRODUCTION_CONSTANTS.maxMilitaryFactoriesPerLine));
  const rawTotal=Number(totalFactories); let remaining=Number.isFinite(rawTotal)?Math.max(0,Math.floor(rawTotal)):requested.reduce((a,b)=>a+b,0);
  const active=Array(lines.length).fill(0);
  const ordered=lines.map((l,i)=>({i,priority:Number(l.priority)||1})).sort((a,b)=>b.priority-a.priority||a.i-b.i);
  for(const x of ordered){const take=Math.min(requested[x.i],remaining);active[x.i]=take;remaining-=take;if(remaining<=0)break;}
  return {requested,active,unused:remaining};
}

function allocateResources(lines,scenario,equipment){
  const remaining={};
  for(const r of Object.keys(scenario.resources||{})) remaining[r]=Math.max(0,Number(scenario.resources[r])||0);
  const allocations=new Map();
  const ordered=[...lines].map((l,i)=>({...l,__i:i})).sort((a,b)=>(b.priority||1)-(a.priority||1)||a.__i-b.__i);
  for(const line of ordered){
    const eq=equipment[line.type],factories=clamp(Math.floor(Number(line.factories)||0),0,PRODUCTION_CONSTANTS.maxMilitaryFactoriesPerLine);
    if(!eq||factories<=0){ allocations.set(line.__i,{factor:factories?0:1,required:{},used:{},factoryFactors:[]}); continue; }
    const perFactory=eq.resources||{},pool={...remaining},required={},used={};
    for(const [r,q] of Object.entries(perFactory)) required[r]=factories*Math.max(0,Number(q)||0);
    const factoryFactors=[];
    for(let slot=1;slot<=factories;slot++){
      let penalty=0;
      for(const [r,q0] of Object.entries(perFactory)){
        const q=Math.max(0,Number(q0)||0);
        const cumulativeNeed=q*slot;
        const missing=Math.max(0,cumulativeNeed-(pool[r]??0));
        penalty=Math.max(penalty,missing*PRODUCTION_CONSTANTS.resourceLackPenaltyPerUnit);
      }
      factoryFactors.push(1-Math.min(PRODUCTION_CONSTANTS.maxLineResourcePenalty,penalty));
    }
    for(const [r,q0] of Object.entries(perFactory)){
      const q=factories*Math.max(0,Number(q0)||0);
      used[r]=Math.min(remaining[r]??0,q);
      remaining[r]=Math.max(0,(remaining[r]??0)-used[r]);
    }
    const factor=factoryFactors.length?factoryFactors.reduce((a,b)=>a+b,0)/factoryFactors.length:1;
    allocations.set(line.__i,{factor,required,used,factoryFactors});
  }
  return {allocations,remaining};
}

export function evaluateProduction(lines,scenario,equipment){
  const capacity=activeFactoryCounts(lines,scenario.factories);
  const effectiveLines=lines.map((line,i)=>({...line,factories:capacity.active[i]}));
  const {allocations,remaining}=allocateResources(effectiveLines,scenario,equipment);
  const effProjection=efficiencyProjection(scenario.efficiency,scenario.efficiencyGain,scenario.days,scenario.maxEfficiency);
  const eff=effProjection.average;
  const outputBonus=1+(Number(scenario.outputBonus)||0)/100;
  const baseIC=Number(scenario.baseFactoryOutput)||4.5;
  const projected=lines.map((line,i)=>{
    const eq=equipment[line.type],effectiveFactories=capacity.active[i],requestedFactories=capacity.requested[i];
    const alloc=allocations.get(i)||{factor:0,required:{},used:{}};
    const need=Math.max(0,(Number(line.target)||0)-(Number(line.stock)||0));
    const mio=eq?.mioProduction||{};
    const lineEffProjection=efficiencyProjection(scenario.efficiency,(Number(scenario.efficiencyGain)||0)*(Number(mio.efficiencyGainFactor)||1),scenario.days,(Number(scenario.maxEfficiency)||100)*(Number(mio.efficiencyCapFactor)||1));
    const lineEff=lineEffProjection.average;
    const icPerDay=effectiveFactories*baseIC*lineEff*outputBonus*(Number(mio.outputFactor)||1)*alloc.factor;
    const daily=eq?.cost>0?icPerDay/eq.cost:0;
    const produced=daily*Math.max(0,Number(scenario.days)||0);
    return {...line,requestedFactories,effectiveFactories,daily,produced,need,ending:(Number(line.stock)||0)+produced,shortage:Math.max(0,need-produced),resourceFactor:alloc.factor,resourceFactoryFactors:alloc.factoryFactors||[],resourceRequired:alloc.required,resourceUsed:alloc.used,lineEfficiency:lineEffProjection};
  });
  const shortage=projected.reduce((a,x)=>a+x.shortage*(Number(x.priority)||1),0);
  const required={},used={};
  for(const p of projected){
    for(const [r,q] of Object.entries(p.resourceRequired||{})) required[r]=(required[r]||0)+q;
    for(const [r,q] of Object.entries(p.resourceUsed||{})) used[r]=(used[r]||0)+q;
  }
  return {lines:projected,shortage,usedFactories:capacity.active.reduce((a,b)=>a+b,0),requestedFactories:capacity.requested.reduce((a,b)=>a+b,0),queuedFactories:capacity.requested.reduce((a,b)=>a+b,0)-capacity.active.reduce((a,b)=>a+b,0),unusedFactories:capacity.unused,efficiency:effProjection,resources:{required,used,remaining}};
}

export function optimizeProduction(lines,scenario,equipment){
  const total=Math.max(0,Math.floor(Number(scenario.factories)||0));
  const work=lines.map(x=>({...x,factories:0}));
  for(let step=0;step<total;step++){
    let best=-1,bestGain=0;
    const before=evaluateProduction(work,scenario,equipment).shortage;
    for(let i=0;i<work.length;i++){
      work[i].factories++;
      const after=evaluateProduction(work,scenario,equipment).shortage;
      work[i].factories--;
      const gain=before-after;
      if(gain>bestGain+1e-9){bestGain=gain;best=i;}
    }
    if(best<0) break;
    work[best].factories++;
  }
  return evaluateProduction(work,scenario,equipment);
}


export function divisionEquipmentIC(need,equipment){
  return Object.entries(need||{}).reduce((sum,[type,q])=>sum+Math.max(0,Number(q)||0)*Math.max(0,Number(equipment[type]?.cost)||0),0);
}

function forceProjectionScore(need,stocks,result){
  const ratios=[];
  const rows=[];
  for(const line of result.lines||[]){
    const perDivision=Math.max(0,Number(need[line.type])||0);
    if(perDivision<=0) continue;
    const available=Math.max(0,Number(stocks[line.type])||0)+Math.max(0,Number(line.produced)||0);
    const ratio=available/perDivision;
    ratios.push(ratio);
    rows.push({...line,perDivision,available,divisionEquivalents:ratio});
  }
  const fieldable=ratios.length?Math.min(...ratios):0;
  const soft=ratios.length?ratios.length/ratios.reduce((sum,r)=>sum+1/(r+.05),0)-.05:0;
  const average=ratios.length?ratios.reduce((a,b)=>a+b,0)/ratios.length:0;
  return {fieldable:Math.max(0,fieldable),softFieldable:Math.max(0,soft),averageCoverage:Math.max(0,average),rows};
}

export function optimizeForceProduction(need,stocks,scenario,equipment){
  const types=Object.keys(need||{}).filter(type=>(Number(need[type])||0)>0&&equipment[type]);
  const total=Math.max(0,Math.floor(Number(scenario.factories)||0));
  if(!types.length) return {lines:[],fieldable:0,softFieldable:0,averageCoverage:0,usedFactories:0,unusedFactories:total,nextFactory:null,icPerDivision:0};
  const work=types.map(type=>{
    const perDivision=Math.max(0,Number(need[type])||0);
    const stock=Math.max(0,Number(stocks?.[type])||0);
    const stockCoverage=stock/Math.max(1,perDivision);
    return {type,stock,target:1e12,factories:0,priority:Math.max(1,100-Math.min(90,stockCoverage*10))};
  });
  const utility=(candidate)=>{
    const evaluated=evaluateProduction(candidate,scenario,equipment);
    const projection=forceProjectionScore(need,stocks,evaluated);
    // Smooth bottleneck objective: heavily favors the least-equipped equipment family,
    // while average coverage breaks ties when several equipment types start at zero.
    return {score:projection.fieldable*1e6+projection.softFieldable*1e3+projection.averageCoverage,projection,evaluated};
  };
  for(let step=0;step<total;step++){
    let best=-1,bestScore=-Infinity;
    for(let i=0;i<work.length;i++){
      work[i].factories++;
      const u=utility(work).score;
      work[i].factories--;
      if(u>bestScore+1e-9){bestScore=u;best=i;}
    }
    if(best<0) break;
    work[best].factories++;
  }
  const finalEval=evaluateProduction(work,scenario,equipment);
  const projection=forceProjectionScore(need,stocks,finalEval);
  let nextFactory=null,bestGain=-Infinity;
  const extraScenario={...scenario,factories:total+1};
  for(let i=0;i<work.length;i++){
    work[i].factories++;
    const extraEval=evaluateProduction(work,extraScenario,equipment);
    const extra=forceProjectionScore(need,stocks,extraEval);
    work[i].factories--;
    const gain=extra.fieldable-projection.fieldable;
    const softGain=extra.softFieldable-projection.softFieldable;
    const rank=gain*1e6+softGain;
    if(rank>bestGain+1e-12){bestGain=rank;nextFactory={type:work[i].type,gain,projectedFieldable:extra.fieldable};}
  }
  return {...finalEval,...projection,nextFactory,icPerDivision:divisionEquipmentIC(need,equipment)};
}

export function buildDemand(templates,selected){
  const demand={};
  for(const s of selected||[]){
    const t=templates[s.template]; if(!t) continue;
    for(const [e,q] of Object.entries(t.equipment||{})) demand[e]=(demand[e]||0)+q*Math.max(0,Number(s.count)||0);
  }
  return demand;
}
export function mergeGoals(goals,demand){
  const map=new Map((goals||[]).map(g=>[g.type,{...g}]));
  for(const [type,q] of Object.entries(demand||{})){
    const g=map.get(type)||{type,stock:0,target:0,factories:0,priority:1};
    g.target=Math.max(Number(g.target)||0,(Number(g.stock)||0)+q); map.set(type,g);
  }
  return [...map.values()];
}

function weightedMaxAverage(values,maxWeight=.4){
  if(!values.length) return 0;
  const max=Math.max(...values), avg=values.reduce((a,b)=>a+b,0)/values.length;
  return max*maxWeight+avg*(1-maxWeight);
}

export function calcDivision(side,battalions,supportKeys,supports){
  const r={width:0,manpower:0,org:0,hp:0,supply:0,soft:0,hard:0,def:0,breakthrough:0,hardness:0,armor:0,piercing:0,airAttack:0,initiative:0,need:{},battalions:0,supportCount:0,terrainAttack:{}};
  let orgSum=0,hardnessSum=0,lineCount=0;
  const armorVals=[],piercingVals=[],supportTerrain={};
  for(const x of side||[]){
    const u=battalions[x.type],n=Math.max(0,Math.floor(Number(x.count)||0)); if(!u||!n) continue;
    lineCount+=n; r.battalions+=n; r.width+=u.width*n; r.manpower+=u.manpower*n; r.hp+=u.hp*n; r.supply+=u.supply*n;
    r.soft+=u.soft*n; r.hard+=u.hard*n; r.def+=u.def*n; r.breakthrough+=u.breakthrough*n; r.airAttack+=(u.airAttack||0)*n;
    orgSum+=u.org*n; hardnessSum+=u.hardness*n;
    for(let i=0;i<n;i++){armorVals.push(u.armor||0);piercingVals.push(u.piercing||0);}
    for(const [k,v] of Object.entries(u.need||{})) r.need[k]=(r.need[k]||0)+v*n;
    for(const [k,v] of Object.entries(u.terrain||{})) r.terrainAttack[k]=(r.terrainAttack[k]||0)+v*n;
  }
  for(const key of supportKeys||[]){
    const u=supports[key]; if(!u) continue; r.supportCount++;
    r.manpower+=u.manpower||0; r.hp+=u.hp||0; orgSum+=u.org||0;
    r.supply+=u.supply||0; r.soft+=u.soft||0; r.hard+=u.hard||0; r.def+=u.def||0; r.breakthrough+=u.breakthrough||0; r.airAttack+=u.airAttack||0; r.initiative+=u.initiative||0;
    armorVals.push(u.armor||0); piercingVals.push(u.piercing||0);
    for(const [q,v] of Object.entries(u.need||{})) r.need[q]=(r.need[q]||0)+v;
    for(const [k,v] of Object.entries(u.terrain||{})) supportTerrain[k]=(supportTerrain[k]||0)+v;
  }
  const orgSlots=lineCount+r.supportCount;
  r.org=orgSlots?orgSum/orgSlots:0; r.hardness=lineCount?hardnessSum/lineCount:0;
  for(const k of Object.keys(r.terrainAttack)) r.terrainAttack[k]/=Math.max(1,lineCount);
  for(const [k,v] of Object.entries(supportTerrain)) r.terrainAttack[k]=(r.terrainAttack[k]||0)+v;
  r.armor=weightedMaxAverage(armorVals,COMBAT_CONSTANTS.armorWeights.max);
  r.piercing=weightedMaxAverage(piercingVals,COMBAT_CONSTANTS.piercingWeights.max);
  return r;
}

export function aggregateDivision(single,count){
  const n=Math.max(1,Math.floor(Number(count)||1));
  const need={}; for(const [k,v] of Object.entries(single.need||{})) need[k]=v*n;
  return {...single,divisionCount:n,singleWidth:single.width,width:single.width*n,manpower:single.manpower*n,hp:single.hp*n,soft:single.soft*n,hard:single.hard*n,def:single.def*n,breakthrough:single.breakthrough*n,supply:single.supply*n,org:single.org*n,need};
}

function scaleAggregate(s,f){
  const need={}; for(const [k,v] of Object.entries(s.need||{})) need[k]=v*f;
  return {...s,width:s.width*f,manpower:s.manpower*f,hp:s.hp*f,soft:s.soft*f,hard:s.hard*f,def:s.def*f,breakthrough:s.breakthrough*f,supply:s.supply*f,org:s.org*f,need,divisionCount:Math.max(1,Math.round((s.divisionCount||1)*f))};
}

function engageSide(side,available,directions){
  const count=side.divisionCount||1, w=Math.max(.1,side.singleWidth||side.width/count||1);
  const maxWidth=available*(1+COMBAT_CONSTANTS.overWidthPenaltyCap);
  const engaged=Math.min(count,Math.max(1,Math.floor(maxWidth/w)));
  const s=scaleAggregate(side,engaged/count);
  const excess=Math.max(0,(s.width-available)/available);
  const widthPenalty=Math.min(COMBAT_CONSTANTS.overWidthPenaltyCap,excess*COMBAT_CONSTANTS.overWidthPenaltyMultiplier);
  const stackLimit=COMBAT_CONSTANTS.stackingLimitBase+COMBAT_CONSTANTS.stackingLimitPerDirection*Math.max(0,directions);
  const stackPenalty=Math.min(.8,Math.max(0,engaged-stackLimit)*COMBAT_CONSTANTS.stackingPenaltyPerDivision);
  return {side:s,engaged,reserve:count-engaged,widthPenalty,stackPenalty,effectiveFactor:(1-widthPenalty)*(1-stackPenalty)};
}

function effectiveAttack(attacker,target){ return attacker.soft*(1-clamp(target.hardness||0,0,1))+attacker.hard*clamp(target.hardness||0,0,1); }
function expectedHits(attack,defense){
  const a=Math.max(0,attack),d=Math.max(0,defense),blocked=Math.min(a,d),unblocked=Math.max(0,a-d);
  return blocked*COMBAT_CONSTANTS.defendedHitChance+unblocked*COMBAT_CONSTANTS.undefendedHitChance;
}
export function piercingDamageFactor(piercing,armor){
  if(armor<=0||piercing>=armor) return 1;
  const ratio=clamp(piercing/armor,0,1);
  if(ratio>=.75) return .80;
  if(ratio>=.50) return .65;
  return .50;
}
function armorOffenseDice(attackerArmor,defenderPiercing){ return attackerArmor>defenderPiercing?COMBAT_CONSTANTS.armoredOrgDice:COMBAT_CONSTANTS.orgDice; }
function supplyModifier(v){ return .25+.75*clamp(Number(v??1),0,1); }
function airPenalty(airForSide){ return 1-COMBAT_CONSTANTS.maxAirSuperiorityPenalty*clamp(airForSide,0,1); }

function hashSeed(value){
  const text=String(value??''); let h=2166136261>>>0;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function seededRng(seed){
  let a=hashSeed(seed)||0x6d2b79f5;
  return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
}
function stochasticRound(v,rng=Math.random){const x=Math.max(0,Number(v)||0),lo=Math.floor(x);return lo+(rng()<x-lo?1:0);}
function randNormal(rng=Math.random){let u=0,v=0;while(u===0)u=rng();while(v===0)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function sampleBinomial(n,p,rng=Math.random){
  n=Math.max(0,Math.floor(n)); p=clamp(p,0,1); if(!n||!p)return 0;if(p===1)return n;
  if(n<=80){let x=0;for(let i=0;i<n;i++)if(rng()<p)x++;return x;}
  const mean=n*p,sd=Math.sqrt(n*p*(1-p));return clamp(Math.round(mean+randNormal(rng)*sd),0,n);
}
function sampleHits(attack,defense,rng=Math.random){
  const a=stochasticRound(attack,rng),d=Math.max(0,Number(defense)||0),blocked=Math.min(a,stochasticRound(d,rng)),unblocked=Math.max(0,a-blocked);
  return sampleBinomial(blocked,COMBAT_CONSTANTS.defendedHitChance,rng)+sampleBinomial(unblocked,COMBAT_CONSTANTS.undefendedHitChance,rng);
}
function rollDamage(hits,diceSize,modifier,rng=Math.random){
  hits=Math.max(0,Math.floor(hits)); if(!hits)return 0; diceSize=Math.max(1,Math.floor(diceSize));
  if(hits<=80){let sum=0;for(let i=0;i<hits;i++)sum+=1+Math.floor(rng()*diceSize);return sum*modifier;}
  const mean=hits*(diceSize+1)/2,variance=hits*((diceSize*diceSize)-1)/12;
  return Math.max(0,mean+randNormal(rng)*Math.sqrt(Math.max(0,variance)))*modifier;
}
function equipmentLosses(side,strengthLoss){
  const out={},f=clamp(strengthLoss,0,1)*COMBAT_CONSTANTS.equipmentCombatLossFactor;
  for(const [k,v] of Object.entries(side.need||{})) out[k]=Math.max(0,v*f);
  return out;
}
function addMap(target,src){for(const [k,v] of Object.entries(src||{}))target[k]=(target[k]||0)+v;return target;}

export function battleContext(a,d,opts){
  const t=opts.terrainData[opts.terrain]||{}; const directions=Math.max(0,Math.floor(Number(opts.directions)||0));
  const available=Math.max(1,(t.width||70)+directions*(t.reinforceWidth||35));
  const ae=engageSide(a,available,directions),de=engageSide(d,available,directions);
  const as=supplyModifier(opts.asupply),ds=supplyModifier(opts.dsup),air=clamp(Number(opts.air)||0,-1,1);
  const entrench=1+Math.max(0,Number(opts.entrench)||0)*COMBAT_CONSTANTS.entrenchmentPerPoint;
  const effectiveFort=Number(opts.fort)>0?Math.max(1,Number(opts.fort)-directions):0;
  const fortFactor=clamp(1-effectiveFort*COMBAT_CONSTANTS.fortPenaltyPerLevel,.10,1);
  const riverFactor=clamp(1-Math.max(0,Number(opts.river)||0),.2,1);
  const planning=1+clamp(Number(opts.planning)||0,0,1);
  const nightShare=clamp(Number(opts.night)||0,0,1);
  const aNightFactor=1-COMBAT_CONSTANTS.nightAttackPenalty*Math.max(0,nightShare*(1-clamp(Number(opts.attackerNightAttackBonus)||0,0,1)));
  const dNightFactor=1-COMBAT_CONSTANTS.nightAttackPenalty*Math.max(0,nightShare*(1-clamp(Number(opts.defenderNightAttackBonus)||0,0,1)));
  const cas=1+.35*clamp(Number(opts.cas)||0,0,1);
  const aTerrain=clamp(1+(t.attack||0)+(a.terrainAttack?.[opts.terrain]||0),.1,1.5);
  const dTerrain=clamp(1+(d.terrainAttack?.[opts.terrain]||0),.1,1.5);

  let aAttack=effectiveAttack(ae.side,de.side)*ae.effectiveFactor*aTerrain*as*fortFactor*riverFactor*planning*aNightFactor*cas;
  let dAttack=effectiveAttack(de.side,ae.side)*de.effectiveFactor*dTerrain*ds*entrench*dNightFactor;
  let aBreak=ae.side.breakthrough*ae.effectiveFactor*as*fortFactor*riverFactor*airPenalty(-air);
  let dDefense=de.side.def*de.effectiveFactor*ds*entrench*airPenalty(air);
  const aHits=expectedHits(aAttack,dDefense),dHits=expectedHits(dAttack,aBreak);
  return {available,ae,de,aAttack,dAttack,aBreak,dDefense,aHits,dHits,effectiveFort,fortFactor,riverFactor,aTerrain,dTerrain,as,ds,air,entrench,planning,aNightFactor,dNightFactor,cas};
}

export function simulateOnce(a,d,opts,rngOverride){
  const c=battleContext(a,d,opts),rng=rngOverride||opts?.rng||Math.random;
  // Attack/defense come from the divisions that fit on the line, while organization/HP use the full committed pool.
  // This is a deliberate aggregate approximation of reserve rotation until per-division reinforce timing is implemented.
  let ao=Math.max(1,a.org),do_=Math.max(1,d.org),ahp=Math.max(1,a.hp),dhp=Math.max(1,d.hp);
  const aOrg0=ao,dOrg0=do_,aHp0=ahp,dHp0=dhp; let hours=0,aHitsTotal=0,dHitsTotal=0;
  const timeline=opts?.trace?[{hour:0,aOrg:100,dOrg:100,aStrength:100,dStrength:100}]:null;
  const aDamageTaken=piercingDamageFactor(c.de.side.piercing,c.ae.side.armor),dDamageTaken=piercingDamageFactor(c.ae.side.piercing,c.de.side.armor);
  const aOrgDice=armorOffenseDice(c.ae.side.armor,c.de.side.piercing),dOrgDice=armorOffenseDice(c.de.side.armor,c.ae.side.piercing);
  while(ao>0&&do_>0&&ahp>0&&dhp>0&&hours<168){
    const aStrength=clamp(ahp/aHp0,.1,1),dStrength=clamp(dhp/dHp0,.1,1);
    const aHits=sampleHits(c.aAttack*aStrength,c.dDefense*dStrength,rng),dHits=sampleHits(c.dAttack*dStrength,c.aBreak*aStrength,rng);
    aHitsTotal+=aHits; dHitsTotal+=dHits;
    do_-=rollDamage(aHits,aOrgDice,COMBAT_CONSTANTS.orgDamageModifier,rng)*dDamageTaken;
    ao-=rollDamage(dHits,dOrgDice,COMBAT_CONSTANTS.orgDamageModifier,rng)*aDamageTaken;
    dhp-=rollDamage(aHits,COMBAT_CONSTANTS.strengthDice,COMBAT_CONSTANTS.strengthDamageModifier,rng)*dDamageTaken;
    ahp-=rollDamage(dHits,COMBAT_CONSTANTS.strengthDice,COMBAT_CONSTANTS.strengthDamageModifier,rng)*aDamageTaken;
    hours++;
    if(timeline&&(hours%6===0||ao<=0||do_<=0||ahp<=0||dhp<=0||hours===168))timeline.push({hour:hours,aOrg:clamp(ao/aOrg0,0,1)*100,dOrg:clamp(do_/dOrg0,0,1)*100,aStrength:clamp(ahp/aHp0,0,1)*100,dStrength:clamp(dhp/dHp0,0,1)*100});
  }
  hours=Math.max(hours,COMBAT_CONSTANTS.combatMinimumHours);
  const attackerWin=do_<=0&&ao>0,defenderWin=ao<=0&&do_>0,draw=!attackerWin&&!defenderWin;
  const aCas=clamp((aHp0-Math.max(0,ahp))/aHp0,0,1),dCas=clamp((dHp0-Math.max(0,dhp))/dHp0,0,1);
  return {attackerWin,defenderWin,draw,hours,aOrg:Math.max(0,ao),dOrg:Math.max(0,do_),aOrgLoss:clamp((aOrg0-Math.max(0,ao))/aOrg0,0,1),dOrgLoss:clamp((dOrg0-Math.max(0,do_))/dOrg0,0,1),attackerCasualtyRate:aCas,defenderCasualtyRate:dCas,attackerManpowerLoss:aCas*a.manpower,defenderManpowerLoss:dCas*d.manpower,attackerEquipmentLosses:equipmentLosses(a,aCas),defenderEquipmentLosses:equipmentLosses(d,dCas),attackerPiercesDefender:c.ae.side.piercing>=c.de.side.armor,defenderPiercesAttacker:c.de.side.piercing>=c.ae.side.armor,attackerHitsPerHour:aHitsTotal/Math.max(1,hours),defenderHitsPerHour:dHitsTotal/Math.max(1,hours),context:c,timeline};
}

function wilsonInterval(successes,n,z=1.96){
  if(!n)return [0,0]; const p=successes/n,z2=z*z,den=1+z2/n;
  const center=(p+z2/(2*n))/den,margin=z*Math.sqrt((p*(1-p)+z2/(4*n))/n)/den;
  return [clamp(center-margin,0,1)*100,clamp(center+margin,0,1)*100];
}

export function simulateBattle(a,d,opts,runs=500){
  const n=clamp(Math.floor(Number(runs)||500),50,5000); let aw=0,dw=0,dr=0,h=0,ac=0,dc=0,aml=0,dml=0,ah=0,dh=0; let last=null; const aeq={},deq={};
  const rng=opts?.seed===undefined||opts?.seed===null||opts?.seed===''?Math.random:seededRng(opts.seed);
  for(let i=0;i<n;i++){
    const r=simulateOnce(a,d,opts,rng);last=r;aw+=r.attackerWin?1:0;dw+=r.defenderWin?1:0;dr+=r.draw?1:0;h+=r.hours;ac+=r.attackerCasualtyRate;dc+=r.defenderCasualtyRate;aml+=r.attackerManpowerLoss;dml+=r.defenderManpowerLoss;ah+=r.attackerHitsPerHour;dh+=r.defenderHitsPerHour;addMap(aeq,r.attackerEquipmentLosses);addMap(deq,r.defenderEquipmentLosses);
  }
  for(const k of Object.keys(aeq))aeq[k]/=n;for(const k of Object.keys(deq))deq[k]/=n;
  const [winRateLow,winRateHigh]=wilsonInterval(aw,n);
  const traceRng=opts?.seed===undefined||opts?.seed===null||opts?.seed===''?Math.random:seededRng(`${opts.seed}:representative`);
  const representative=simulateOnce(a,d,{...opts,trace:true},traceRng);
  return {winRate:aw/n*100,winRateLow,winRateHigh,attackerWinRate:aw/n*100,defenderWinRate:dw/n*100,drawRate:dr/n*100,avgHours:h/n,attackerCasualtyRate:ac/n*100,defenderCasualtyRate:dc/n*100,attackerManpowerLoss:aml/n,defenderManpowerLoss:dml/n,attackerEquipmentLosses:aeq,defenderEquipmentLosses:deq,attackerPiercingRate:last?.attackerPiercesDefender?100:0,defenderPiercingRate:last?.defenderPiercesAttacker?100:0,attackerHitsPerHour:ah/n,defenderHitsPerHour:dh/n,context:last?.context,representative,runs:n,seed:opts?.seed??null};
}

export function compareTerrains(a,d,opts,runs=250){ return Object.keys(opts.terrainData).map(key=>({terrain:key,results:simulateBattle(a,d,{...opts,terrain:key},runs)})); }

export function uncertaintyBand(a,d,opts,uncertainty=.20,runs=250){
  const u=clamp(Number(uncertainty)||0,0,.75);
  const scale=(x,m)=>({...x,soft:x.soft*m,hard:x.hard*m,def:x.def*m,breakthrough:x.breakthrough*m,org:x.org*m,hp:x.hp*m,armor:x.armor*m,piercing:x.piercing*m});
  const favorable=simulateBattle(a,scale(d,1-u),opts,runs),base=simulateBattle(a,d,opts,runs),adverse=simulateBattle(a,scale(d,1+u),opts,runs);
  return {favorable,base,adverse,uncertainty:u};
}

export function readinessScore(goals,production,battleLow=0){
  const total=(goals||[]).reduce((s,g)=>s+Math.max(0,(Number(g.target)||0)-(Number(g.stock)||0))*(Number(g.priority)||1),0);
  const shortage=production?.shortage||0; const equipmentReady=total<=0?100:clamp((1-shortage/Math.max(1,total))*100,0,100);
  return Math.round(equipmentReady*.65+clamp(battleLow,0,100)*.35);
}

export function scoreDivision(stats,preset){
  const w=preset.weights||{}; let score=0;
  for(const [k,m] of Object.entries(w)) score+=(Number(stats[k])||0)*m;
  const widthFit=1-Math.min(1,Math.abs((stats.width||0)-(preset.targetWidth||stats.width||1))/Math.max(1,preset.targetWidth||1));
  return {score:score*(.65+.35*widthFit),widthFit};
}

export function researchEstimate({baseDays=200,speedBonus=0,aheadPenalty=0}){
  const speed=1+Math.max(-.9,Number(speedBonus)||0); const ahead=Math.max(1,Number(aheadPenalty)||1);
  return Math.max(1,(Number(baseDays)||1)*ahead/speed);
}

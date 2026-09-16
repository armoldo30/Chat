import { effectiveAttack } from './counter-diagnosis.js';
const n=value=>Number.isFinite(Number(value))?Number(value):0;
const pct=(next,base)=>base?((next-base)/Math.abs(base))*100:0;
const signed=(value,digits=1)=>`${value>=0?'+':''}${Number(value).toFixed(digits)}`;
const normalizeSide=side=>side==='defender'?'defender':'attacker';
const otherSide=side=>side==='defender'?'attacker':'defender';
function forceDesignContext(item,target,reasons,tradeoffs,side){
  if(!item.designChange)return;
  const {variant,component,before,after}=item.designChange,piercing=n(after.piercing)-n(before.piercing),soft=n(after.softAttack)-n(before.softAttack),hard=n(after.hardAttack)-n(before.hardAttack),armor=n(after.armor)-n(before.armor),survival=side==='defender'?n(after.defense)-n(before.defense):n(after.breakthrough)-n(before.breakthrough),cost=n(after.buildCost)-n(before.buildCost),reliability=(n(after.reliability)-n(before.reliability))*100,fuel=n(after.fuelConsumption)-n(before.fuelConsumption);
  const effects=[];
  if(Math.abs(piercing)>=2)effects.push(`${signed(piercing)} piercing`);
  if(target.hardness>=.5&&Math.abs(hard)>=3)effects.push(`${signed(hard)} hard attack`);
  if(target.hardness<.5&&Math.abs(soft)>=3)effects.push(`${signed(soft)} soft attack`);
  if(Math.abs(armor)>=3)effects.push(`${signed(armor)} armor`);
  if(Math.abs(survival)>=3)effects.push(`${signed(survival)} ${side==='defender'?'defense':'breakthrough'}`);
  reasons.unshift(`${variant} ${component} retune${effects.length?` changes the underlying variant by ${effects.slice(0,3).join(', ')}`:''}; the division matchup is recalculated from that new equipment design.`);
  if(cost>0.05)tradeoffs.unshift(`${variant} build cost rises by ${cost.toFixed(1)} IC per vehicle.`);
  else if(cost<-0.05)tradeoffs.unshift(`${variant} build cost falls by ${Math.abs(cost).toFixed(1)} IC per vehicle.`);
  if(reliability<=-1)tradeoffs.push(`${variant} reliability falls by ${Math.abs(reliability).toFixed(1)} percentage points.`);
  if(fuel>=.05)tradeoffs.push(`${variant} fuel consumption rises by ${fuel.toFixed(2)} per vehicle; campaign fuel availability is not inferred.`);
}
function productionContext(item,tradeoffs){
  const practicality=item.practicality,burden=item.productionBurden;
  if(practicality?.majorRetooling){
    const families=(practicality.introducedArmorFamilies||[]).map(family=>`${family[0].toUpperCase()}${family.slice(1)} Armor`),resources=(practicality.resourceKeys||[]).map(key=>key[0].toUpperCase()+key.slice(1));
    tradeoffs.unshift(`Major production retooling: this change introduces ${families.join(' + ')||'a new armored equipment family'}${resources.length?` with ${resources.join(' / ')} inputs`:''}. Conversion/retooling efficiency loss is not source-priced here, so this remains an additional commitment beyond the projection below.`);
  }
  if(!burden||burden.addedIC<=.5)return;
  const factoryText=`Production projection: +${burden.addedIC.toFixed(0)} IC across ${burden.divisions} selected division${burden.divisions===1?'':'s'} ≈ ${burden.factoryDays.toFixed(1)} factory-days, or ${burden.factoriesForHorizon.toFixed(1)} average factories over the current ${burden.horizonDays}-day horizon.`;
  tradeoffs.push(factoryText);
  if(burden.factoryShortfall>.05)tradeoffs.push(`Current production plan has ${burden.unusedFactories.toFixed(1)} unused military factories; this recommendation needs about ${burden.factoryShortfall.toFixed(1)} more average factories than that spare capacity, so existing lines would need to be displaced or capacity increased.`);
  const constrained=burden.constrainedResources||[];
  if(constrained.length){
    const detail=constrained.slice(0,3).map(key=>`${key} +${n(burden.resourceShortfall?.[key]).toFixed(1)}`).join(', ');
    tradeoffs.push(`Marginal production would exceed currently unallocated strategic-resource capacity: ${detail}. Trade changes are not automatically assumed.`);
  }else{
    const draws=Object.entries(burden.resourceDraw||{}).filter(([,qty])=>n(qty)>.05).sort((a,b)=>n(b[1])-n(a[1])).slice(0,3);
    if(draws.length)tradeoffs.push(`Estimated marginal resource draw fits the current unallocated baseline: ${draws.map(([key,qty])=>`${key} +${n(qty).toFixed(1)}`).join(', ')} average units across the horizon.`);
  }
}
export function explainCounter(item,snapshot,side='attacker'){
  if(!item?.stats)return {reasons:[],tradeoffs:[],summary:'No modeled explanation available.'};
  side=normalizeSide(side);
  const base=snapshot[side],target=snapshot[otherSide(side)],baseIC=snapshot[side+'IC'],next=item.stats,reasons=[],tradeoffs=[];
  const basePressure=effectiveAttack(base,target),nextPressure=effectiveAttack(next,target),pressureDelta=nextPressure-basePressure;
  const piercingDelta=n(next.piercing)-n(base.piercing),armorDelta=n(next.armor)-n(base.armor),breakthroughDelta=n(next.breakthrough)-n(base.breakthrough),defenseDelta=n(next.def)-n(base.def),orgDelta=n(next.org)-n(base.org),widthDelta=n(next.width)-n(base.width),supplyDelta=n(next.supply)-n(base.supply),softDelta=n(next.soft)-n(base.soft),hardDelta=n(next.hard)-n(base.hard),icDelta=n(item.ic)-n(baseIC);
  if(base.piercing<target.armor&&next.piercing>=target.armor)reasons.push(`Crosses the target armor threshold: piercing rises from ${base.piercing.toFixed(1)} to ${next.piercing.toFixed(1)} against ${target.armor.toFixed(1)} armor.`);
  else if(base.piercing<target.armor&&piercingDelta>=3)reasons.push(`Closes the piercing gap by ${piercingDelta.toFixed(1)}; the target still retains its armor threshold, but the matchup is less one-sided.`);
  if(base.armor<=target.piercing&&next.armor>target.piercing)reasons.push(`Creates an armor advantage: ${next.armor.toFixed(1)} armor now exceeds ${target.piercing.toFixed(1)} enemy piercing.`);
  else if(base.armor>target.piercing&&next.armor>target.piercing&&armorDelta<0)reasons.push(`Keeps the existing armor advantage while giving up ${Math.abs(armorDelta).toFixed(1)} excess armor for value elsewhere.`);
  if(target.hardness>=.55&&hardDelta>=5)reasons.push(`Adds ${hardDelta.toFixed(1)} hard attack against a ${Math.round(target.hardness*100)}% hard target, so most of the added firepower applies efficiently.`);
  if(target.hardness<=.45&&softDelta>=8)reasons.push(`Adds ${softDelta.toFixed(1)} soft attack against a ${Math.round(target.hardness*100)}% hard target, matching the target's softer composition.`);
  if(pressureDelta>0&&pct(nextPressure,basePressure)>=4)reasons.push(`Effective attack against this exact hardness profile improves by ${pct(nextPressure,basePressure).toFixed(1)}%.`);
  if(side==='attacker'&&breakthroughDelta>=10)reasons.push(`Breakthrough increases by ${breakthroughDelta.toFixed(1)}, improving how much return fire the attacking division can absorb before attacks become undefended.`);
  if(side==='defender'&&defenseDelta>=10)reasons.push(`Defense increases by ${defenseDelta.toFixed(1)}, reducing the share of incoming attacks that exceed the defending division's defense.`);
  if(orgDelta>=3)reasons.push(`Organization rises by ${orgDelta.toFixed(1)}, increasing staying power in the modeled battle.`);
  if(icDelta>0)tradeoffs.push(`Equipment cost rises by ${icDelta.toFixed(0)} IC per division (${pct(item.ic,baseIC).toFixed(1)}%).`);
  else if(icDelta<0)tradeoffs.push(`Equipment cost falls by ${Math.abs(icDelta).toFixed(0)} IC per division.`);
  if(orgDelta<=-2)tradeoffs.push(`Organization falls by ${Math.abs(orgDelta).toFixed(1)}.`);
  if(supplyDelta>=.08)tradeoffs.push(`Supply use rises by ${supplyDelta.toFixed(2)} per division per day.`);
  if(widthDelta>=2)tradeoffs.push(`Combat width increases by ${widthDelta.toFixed(1)}, which can change packing efficiency in other terrain.`);
  if(widthDelta<=-2)tradeoffs.push(`Combat width drops by ${Math.abs(widthDelta).toFixed(1)}, which may improve packing but changes total line weight.`);
  if(base.armor>target.piercing&&next.armor<=target.piercing)tradeoffs.push('This change gives up the armor advantage against the selected target.');
  forceDesignContext(item,target,reasons,tradeoffs,side);productionContext(item,tradeoffs);
  if(!reasons.length&&item.gain>=2)reasons.push(`The combined stat changes improve modeled ${side} win rate by ${item.gain.toFixed(1)} percentage points even though no single threshold dominates the result.`);
  if(!tradeoffs.length)tradeoffs.push('No major modeled cost, supply, organization, width, reliability, fuel, armor-threshold, or production-capacity tradeoff was detected relative to the current force design.');
  return {reasons:reasons.slice(0,5),tradeoffs:tradeoffs.slice(0,6),summary:reasons[0],deltas:{pressure:pressureDelta,piercing:piercingDelta,armor:armorDelta,breakthrough:breakthroughDelta,defense:defenseDelta,organization:orgDelta,width:widthDelta,supply:supplyDelta,soft:softDelta,hard:hardDelta,ic:icDelta},changeCount:item.changeCount||1,changeLabel:(item.changes||[]).join(' + '),compact:`${signed(item.gain)} pp ${side} win · ${signed(icDelta,0)} IC/div`};
}

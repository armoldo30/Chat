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
  if(fuel>=.05)tradeoffs.push(`${variant} fuel consumption rises by ${fuel.toFixed(2)} per vehicle.`);
}
function productionContext(item,tradeoffs){
  const practicality=item.practicality,plan=item.productionPlan;
  if(plan?.available){
    if(plan.targetRegressionIC>0){
      const affected=(plan.rows||[]).filter(row=>row.targetRegression>1e-9).sort((a,b)=>b.targetRegressionIC-a.targetRegressionIC).map(row=>row.label).slice(0,3).join(' / ');
      tradeoffs.unshift(`The candidate equipment design makes the existing saved production targets fall about ${Math.round(plan.targetRegressionIC)} equipment IC further behind over the ${Math.round(plan.horizonDays)}-day horizon${affected?` (${affected})`:''}. This compares the candidate line output with the baseline design at the same saved factories/resources.`);
    }
    if(plan.incrementalIC>0&&!plan.currentPlanAdequate){
      const pctCovered=Math.round((plan.coverageRatio||0)*100),missing=(plan.rows||[]).filter(row=>row.incrementalShortfall>1e-9).sort((a,b)=>b.incrementalShortfallIC-a.incrementalShortfallIC),missingLabels=missing.slice(0,3).map(row=>row.label).join(' / ');
      let detail=`Current saved production plan covers about ${pctCovered}% of the added equipment IC within its ${Math.round(plan.horizonDays)}-day horizon; about ${Math.round(plan.incrementalShortfallIC)} added-equipment IC remains uncovered`;
      if(missingLabels)detail+=` (${missingLabels})`;
      if(plan.newProductionLines?.length)detail+=`. ${plan.newProductionLines.length} required equipment type${plan.newProductionLines.length===1?' has':'s have'} no saved production line`;
      else if(plan.inactiveProductionLines?.length)detail+=`. ${plan.inactiveProductionLines.length} required saved line${plan.inactiveProductionLines.length===1?' receives':'s receive'} no active factories under the current factory cap`;
      else if(Number.isFinite(plan.additionalDays)&&plan.additionalDays>0)detail+=`; at current modeled line rates the slowest combined shortfall needs roughly ${Math.ceil(plan.additionalDays)} additional days after that horizon`;
      tradeoffs.unshift(`${detail}. Counter Analysis does not auto-reallocate factories.`);
    }
    if(plan.resourceConstrainedTypes?.length){
      const constrained=(plan.rows||[]).filter(row=>row.resourceConstrained).map(row=>row.label).slice(0,3).join(' / ');
      tradeoffs.unshift(`Current saved production is resource-constrained for ${constrained||'required equipment'}; the production engine applies that shortage to projected output.`);
    }
  }
  if(practicality?.majorRetooling){
    const families=(practicality.introducedArmorFamilies||[]).map(family=>`${family[0].toUpperCase()}${family.slice(1)} Armor`),resources=(practicality.resourceKeys||[]).map(key=>key[0].toUpperCase()+key.slice(1));
    tradeoffs.unshift(`Major production retooling: this change introduces ${families.join(' + ')||'a new armored equipment family'}${resources.length?` with ${resources.join(' / ')} inputs in the current data baseline`:''}. Saved-plan coverage is checked separately, but factory conversion/retooling efficiency loss, new trade acquisition, and campaign fuel logistics are not automatically modeled.`);
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
  if(!tradeoffs.length)tradeoffs.push('No major modeled cost, supply, organization, width, reliability, fuel, armor-threshold, production-plan, or retooling tradeoff was detected relative to the current force design.');
  return {reasons:reasons.slice(0,5),tradeoffs:tradeoffs.slice(0,5),summary:reasons[0],deltas:{pressure:pressureDelta,piercing:piercingDelta,armor:armorDelta,breakthrough:breakthroughDelta,defense:defenseDelta,organization:orgDelta,width:widthDelta,supply:supplyDelta,soft:softDelta,hard:hardDelta,ic:icDelta},changeCount:item.changeCount||1,changeLabel:(item.changes||[]).join(' + '),compact:`${signed(item.gain)} pp ${side} win · ${signed(icDelta,0)} IC/div`};
}
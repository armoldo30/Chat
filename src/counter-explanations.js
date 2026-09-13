import { effectiveAttack } from './counter-diagnosis.js';

const n=value=>Number.isFinite(Number(value))?Number(value):0;
const pct=(next,base)=>base?((next-base)/Math.abs(base))*100:0;
const signed=(value,digits=1)=>`${value>=0?'+':''}${Number(value).toFixed(digits)}`;

export function explainCounter(item,snapshot){
  if(!item?.stats)return {reasons:[],tradeoffs:[],summary:'No modeled explanation available.'};
  const base=snapshot.attacker,target=snapshot.defender,next=item.stats,reasons=[],tradeoffs=[];
  const basePressure=effectiveAttack(base,target),nextPressure=effectiveAttack(next,target),pressureDelta=nextPressure-basePressure;
  const piercingDelta=n(next.piercing)-n(base.piercing),armorDelta=n(next.armor)-n(base.armor),breakthroughDelta=n(next.breakthrough)-n(base.breakthrough),orgDelta=n(next.org)-n(base.org),widthDelta=n(next.width)-n(base.width),supplyDelta=n(next.supply)-n(base.supply),softDelta=n(next.soft)-n(base.soft),hardDelta=n(next.hard)-n(base.hard),icDelta=n(item.ic)-n(snapshot.attackerIC);
  if(base.piercing<target.armor&&next.piercing>=target.armor)reasons.push(`Crosses the target armor threshold: piercing rises from ${base.piercing.toFixed(1)} to ${next.piercing.toFixed(1)} against ${target.armor.toFixed(1)} armor.`);
  else if(base.piercing<target.armor&&piercingDelta>=3)reasons.push(`Closes the piercing gap by ${piercingDelta.toFixed(1)}; the target still retains its armor threshold, but the matchup is less one-sided.`);
  if(base.armor<=target.piercing&&next.armor>target.piercing)reasons.push(`Creates an armor advantage: ${next.armor.toFixed(1)} armor now exceeds ${target.piercing.toFixed(1)} enemy piercing.`);
  else if(base.armor>target.piercing&&next.armor>target.piercing&&armorDelta<0)reasons.push(`Keeps the existing armor advantage while giving up ${Math.abs(armorDelta).toFixed(1)} excess armor for value elsewhere.`);
  if(target.hardness>=.55&&hardDelta>=5)reasons.push(`Adds ${hardDelta.toFixed(1)} hard attack against a ${Math.round(target.hardness*100)}% hard target, so most of the added firepower applies efficiently.`);
  if(target.hardness<=.45&&softDelta>=8)reasons.push(`Adds ${softDelta.toFixed(1)} soft attack against a ${Math.round(target.hardness*100)}% hard target, matching the target's softer composition.`);
  if(pressureDelta>0&&pct(nextPressure,basePressure)>=4)reasons.push(`Effective attack against this exact hardness profile improves by ${pct(nextPressure,basePressure).toFixed(1)}%.`);
  if(breakthroughDelta>=10)reasons.push(`Breakthrough increases by ${breakthroughDelta.toFixed(1)}, improving how much return fire the attacking division can absorb before attacks become undefended.`);
  if(orgDelta>=3)reasons.push(`Organization rises by ${orgDelta.toFixed(1)}, increasing staying power in the modeled battle.`);
  if(!reasons.length&&item.gain>=2)reasons.push(`The combined stat changes improve modeled win rate by ${item.gain.toFixed(1)} percentage points even though no single threshold dominates the result.`);
  if(icDelta>0)tradeoffs.push(`Equipment cost rises by ${icDelta.toFixed(0)} IC per division (${pct(item.ic,snapshot.attackerIC).toFixed(1)}%).`);
  else if(icDelta<0)tradeoffs.push(`Equipment cost falls by ${Math.abs(icDelta).toFixed(0)} IC per division.`);
  if(orgDelta<=-2)tradeoffs.push(`Organization falls by ${Math.abs(orgDelta).toFixed(1)}.`);
  if(supplyDelta>=.08)tradeoffs.push(`Supply use rises by ${supplyDelta.toFixed(2)} per division per day.`);
  if(widthDelta>=2)tradeoffs.push(`Combat width increases by ${widthDelta.toFixed(1)}, which can change packing efficiency in other terrain.`);
  if(widthDelta<=-2)tradeoffs.push(`Combat width drops by ${Math.abs(widthDelta).toFixed(1)}, which may improve packing but changes total line weight.`);
  if(base.armor>target.piercing&&next.armor<=target.piercing)tradeoffs.push('This change gives up the armor advantage against the selected target.');
  if(!tradeoffs.length)tradeoffs.push('No major modeled cost, supply, organization, width, or armor-threshold tradeoff was detected relative to the current template.');
  return {reasons:reasons.slice(0,4),tradeoffs:tradeoffs.slice(0,4),summary:reasons[0],deltas:{pressure:pressureDelta,piercing:piercingDelta,armor:armorDelta,breakthrough:breakthroughDelta,organization:orgDelta,width:widthDelta,supply:supplyDelta,soft:softDelta,hard:hardDelta,ic:icDelta},changeCount:item.changeCount||1,changeLabel:(item.changes||[]).join(' + '),compact:`${signed(item.gain)} pp win · ${signed(icDelta,0)} IC/div`};
}

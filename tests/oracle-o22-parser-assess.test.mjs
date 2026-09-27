import assert from 'node:assert/strict';
import {parseO22Batch} from '../scripts/oracle-o22-trial21.mjs';
import {assessO22} from '../scripts/oracle-o22-assess.mjs';

const cfg={
 p20:{piercing:20,factor:1.00},
 p15:{piercing:15,factor:0.80},
 p14:{piercing:14,factor:0.65},
 p10:{piercing:10,factor:0.65},
 p9:{piercing:9,factor:0.50}
};
function b(v){return {low:Math.max(0,v-.00001).toFixed(5),high:Math.min(1,v+.00001).toFixed(5)};}
function one(mode,factor){
 const lines=[`WPO22 BEGIN schema=1 scenario=o22-piercing-damage-tier-v1 mode=${mode} targetPiercing=${cfg[mode].piercing} targetArmor=20 expectedFactor=${factor.toFixed(2)} gameVersion=1.19.3.0.c01a checksum=5632 checksumScope=base-game-reference method=bisection14 runMode=trial21 tacticMode=neutral-basic-only defineOverrides=DEFENDED_HIT:100,UNDEFENDED_HIT:0,ORG_MOD:0.053,ORG_DICE:1,ORG_ARMOR_DICE:1,STR_DAMAGE:0,NIGHT:0 attackModifier=-0.721 defenseModifier=-0.9923784016 prepared=yes`];
 let org=1;
 for(let h=0;h<=21;h++){
   if(h>=2)org-=.00088*factor;
   const a=b(1),o=b(org),s=b(1);
   lines.push('WPO22 SAMPLE hour='+h);
   lines.push(`WPO22 ATTACKER orgLow=${a.low} orgHigh=${a.high} strengthLow=${s.low} strengthHigh=${s.high}`);
   lines.push(`WPO22 DEFENDER orgLow=${o.low} orgHigh=${o.high} strengthLow=${s.low} strengthHigh=${s.high}`);
 }
 lines.push('WPO22 END hour=21 reason=trial21-complete modifiersRemoved=yes cleanupFailure=no');
 return lines.join('\n');
}
function batch(factors=Object.fromEntries(Object.entries(cfg).map(([k,v])=>[k,v.factor]))){
 return Object.keys(cfg).map(k=>one(k,factors[k])).join('\n');
}
const panels=Object.fromEntries(Object.entries(cfg).map(([mode,v])=>[mode,{
 displayedSoft:20,tooltipSoft:20,displayedDefense:10,tooltipDefense:10,
 displayedPiercing:v.piercing,tooltipPiercing:v.piercing,displayedArmor:20,tooltipArmor:20
}]));

const ok=assessO22({batch:parseO22Batch(batch()),panels});
assert.equal(ok.action,'piercing-damage-tiers-supported');
assert.ok(Math.abs(ok.ratios.p15-.8)<.01);
assert.ok(Math.abs(ok.ratios.p9-.5)<.01);

const badFactors={p20:1,p15:.95,p14:.65,p10:.65,p9:.5};
const bad=assessO22({batch:parseO22Batch(batch(badFactors)),panels});
assert.equal(bad.action,'piercing-damage-tiers-mismatch');
console.log('Oracle O22 parser/assessment regression passed.');

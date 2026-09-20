import assert from 'node:assert/strict';
import { battalions, supports } from '../src/data.js';
import { DEFAULT_TECH_PROFILE, normalizeTechProfile, buildTechAdjustedData, techAvailable, techIssues } from '../src/tech.js';

const base=normalizeTechProfile(DEFAULT_TECH_PROFILE);
assert.equal(base.infantryEquipment,1);

const basic=buildTechAdjustedData(battalions,supports,{...base,infantryEquipment:0});
const advanced=buildTechAdjustedData(battalions,supports,{...base,infantryEquipment:3});
assert.ok(advanced.battalions.infantry.soft>basic.battalions.infantry.soft,'advanced infantry equipment should raise infantry soft attack');
assert.ok(advanced.battalions.infantry.def>basic.battalions.infantry.def,'advanced infantry equipment should raise infantry defense');
assert.equal(advanced.battalions.mechanized.hard-basic.battalions.mechanized.hard,1.5,'infantry equipment delta should preserve mechanized-specific hard attack while adding weapon improvement');

const doctrine=buildTechAdjustedData(battalions,supports,{...base,doctrine:{...base.doctrine,org:10,soft:20,breakthrough:15}});
assert.ok(Math.abs(doctrine.battalions.infantry.org-battalions.infantry.org*1.10)<1e-9);
assert.ok(Math.abs(doctrine.battalions.artillery.soft-battalions.artillery.soft*1.20)<1e-9);
assert.ok(Math.abs(doctrine.battalions.medium_armor.breakthrough-battalions.medium_armor.breakthrough*1.15)<1e-9);

const fallbackLow=buildTechAdjustedData(battalions,supports,{...base,artillery:1,antiTank:1,antiAir:1});
const fallbackHigh=buildTechAdjustedData(battalions,supports,{...base,artillery:3,antiTank:3,antiAir:3});
assert.ok(fallbackHigh.supports.field_guns.soft>fallbackLow.supports.field_guns.soft,'packless fallback artillery tiers must include current Infantry Guns');
assert.ok(fallbackHigh.supports.anti_tank_battery.hard>fallbackLow.supports.anti_tank_battery.hard,'packless fallback anti-tank tiers must include current Anti-Tank Battery');
assert.ok(fallbackHigh.supports.anti_air_battery.airAttack>fallbackLow.supports.anti_air_battery.airAttack,'packless fallback anti-air tiers must include current Anti-Air Battery');

const locked={...base,artillery:0,antiTank:0,unlocks:{...base.unlocks,mechanized:false,signal:false}};
assert.equal(techAvailable('battalion','artillery',locked),false);
assert.equal(techAvailable('battalion','mechanized',locked),false);
assert.equal(techAvailable('support','support_at',locked),false);
assert.equal(techAvailable('support','field_guns',locked),false,'current Infantry Guns must share the artillery coarse availability gate');
assert.equal(techAvailable('support','anti_tank_battery',locked),false,'current Anti-Tank Battery must share the anti-tank coarse availability gate');
assert.equal(techAvailable('support','anti_air_battery',{...locked,antiAir:0}),false,'current Anti-Air Battery must share the anti-air coarse availability gate');
assert.equal(techAvailable('support','signal',locked),false);
assert.equal(techAvailable('battalion','infantry',locked),true);
const grid=[[ 'infantry','artillery',null,null,null ],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]];
const issues=techIssues(grid,['signal'],['field_guns','anti_tank_battery','anti_air_battery','regimental_at',null],{...locked,antiAir:0});
assert.deepEqual(new Set(issues),new Set(['artillery','signal','field_guns','anti_tank_battery','anti_air_battery','regimental_at']),'current and legacy regimental IDs must share the same coarse availability reporting');

console.log('Tech-profile regression tests passed.');

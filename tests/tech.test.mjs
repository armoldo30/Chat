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

const locked={...base,artillery:0,antiTank:0,unlocks:{...base.unlocks,mechanized:false,signal:false}};
assert.equal(techAvailable('battalion','artillery',locked),false);
assert.equal(techAvailable('battalion','mechanized',locked),false);
assert.equal(techAvailable('support','support_at',locked),false);
assert.equal(techAvailable('support','signal',locked),false);
assert.equal(techAvailable('battalion','infantry',locked),true);
const grid=[[ 'infantry','artillery',null,null,null ],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]];
const issues=techIssues(grid,['signal'],[null,'regimental_at',null,null,null],locked);
assert.deepEqual(new Set(issues),new Set(['artillery','signal','regimental_at']));

console.log('Tech-profile regression tests passed.');

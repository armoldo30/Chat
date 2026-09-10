import assert from 'node:assert/strict';
import { battalions as baseBattalions, supports as baseSupports, equipment as baseEquipment, terrain as baseTerrain } from '../src/data.js';
import builtin1192 from '../src/builtin1192.js';
import { hydrateGameData } from '../src/gameData.js';
import { DEFAULT_TECH_PROFILE, normalizeTechProfile, buildTechAdjustedData } from '../src/tech.js';

const battalions=structuredClone(baseBattalions),supports=structuredClone(baseSupports),equipment=structuredClone(baseEquipment),terrain=structuredClone(baseTerrain);
hydrateGameData(builtin1192,{battalions,supports,equipment,terrain},{year:1940});
const profile=normalizeTechProfile({...DEFAULT_TECH_PROFILE,technologies:[]});
const baseline=buildTechAdjustedData(battalions,supports,profile,{pack:builtin1192,year:1940});

const artillery=buildTechAdjustedData(battalions,supports,{...profile,technologies:['interwar_artillery']},{pack:builtin1192,year:1940});
assert.ok(Math.abs(artillery.battalions.artillery.soft-baseline.battalions.artillery.soft*1.10)<1e-9,'line artillery source modifier applies as an additive percentage factor');
assert.ok(Math.abs(artillery.supports.support_artillery.soft-baseline.supports.support_artillery.soft*1.05)<1e-9,'support artillery receives its distinct source modifier');
assert.deepEqual(artillery.technologyEffects.appliedTechnologies,['interwar_artillery']);
assert.equal(artillery.technologyEffects.classification,'executable-inferred');

const stacked=buildTechAdjustedData(battalions,supports,{...profile,technologies:['interwar_artillery','artillery2']},{pack:builtin1192,year:1940});
assert.ok(Math.abs(stacked.battalions.artillery.soft-baseline.battalions.artillery.soft*1.20)<1e-9,'same-stat technology modifiers add before multiplication rather than compounding');

const logistics=buildTechAdjustedData(battalions,supports,{...profile,technologies:['tech_logistics_company2']},{pack:builtin1192,year:1940});
assert.ok(Math.abs(logistics.supports.logistics.supply-baseline.supports.logistics.supply*0.90)<1e-9,'logistics supply-consumption factor applies to the matching support company');

const countryOnly=buildTechAdjustedData(battalions,supports,{...profile,technologies:['radio']},{pack:builtin1192,year:1940});
assert.equal(countryOnly.technologyEffects.appliedModifierCount,0,'country-level effects must not be guessed into unit stats');
assert.deepEqual(countryOnly.technologyEffects.appliedTechnologies,[]);

const unknown=buildTechAdjustedData(battalions,supports,{...profile,technologies:['definitely_not_a_real_tech']},{pack:builtin1192,year:1940});
assert.deepEqual(unknown.technologyEffects.unknownTechnologies,['definitely_not_a_real_tech']);
assert.equal(unknown.battalions.infantry.soft,baseline.battalions.infantry.soft,'unknown technology IDs are informational and never block theorycrafting');

console.log('Explicit technology effect application certification passed.');

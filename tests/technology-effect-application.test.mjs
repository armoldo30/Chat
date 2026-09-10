import assert from 'node:assert/strict';
import { battalions as baseBattalions, supports as baseSupports, equipment as baseEquipment, terrain as baseTerrain } from '../src/data.js';
import builtin1192 from '../src/builtin1192.js';
import { hydrateGameData } from '../src/gameData.js';
import { DEFAULT_TECH_PROFILE, normalizeTechProfile, buildTechAdjustedData, applySelectedTechnologyEffects } from '../src/tech.js';

const battalions=structuredClone(baseBattalions),supports=structuredClone(baseSupports),equipment=structuredClone(baseEquipment),terrain=structuredClone(baseTerrain);
hydrateGameData(builtin1192,{battalions,supports,equipment,terrain},{year:1940});
const profile=normalizeTechProfile({...DEFAULT_TECH_PROFILE,technologies:[]});

// Certify the technology layer before doctrine/MIO/designer transformations are applied.
const directB=structuredClone(battalions),directS=structuredClone(supports);
const lineSoft=directB.artillery.soft,supportSoft=directS.support_artillery.soft;
const artilleryMeta=applySelectedTechnologyEffects(directB,directS,builtin1192,['interwar_artillery']);
assert.ok(Math.abs(directB.artillery.soft-lineSoft*1.10)<1e-9,'line artillery source modifier applies as an additive percentage factor');
assert.ok(Math.abs(directS.support_artillery.soft-supportSoft*1.05)<1e-9,'support artillery receives its distinct source modifier');
assert.deepEqual(artilleryMeta.appliedTechnologies,['interwar_artillery']);
assert.equal(artilleryMeta.classification,'executable-inferred');

const stackedB=structuredClone(battalions),stackedS=structuredClone(supports);
applySelectedTechnologyEffects(stackedB,stackedS,builtin1192,['interwar_artillery','artillery2']);
assert.ok(Math.abs(stackedB.artillery.soft-lineSoft*1.20)<1e-9,'same-stat technology modifiers add before multiplication rather than compounding');

const logisticsB=structuredClone(battalions),logisticsS=structuredClone(supports),logisticsSupply=logisticsS.logistics.supply;
applySelectedTechnologyEffects(logisticsB,logisticsS,builtin1192,['tech_logistics_company2']);
assert.ok(Math.abs(logisticsS.logistics.supply-logisticsSupply*0.90)<1e-9,'logistics supply-consumption factor applies to the matching support company');

const countryB=structuredClone(battalions),countryS=structuredClone(supports);
const countryOnly=applySelectedTechnologyEffects(countryB,countryS,builtin1192,['radio']);
assert.equal(countryOnly.appliedModifierCount,0,'country-level effects must not be guessed into unit stats');
assert.deepEqual(countryOnly.appliedTechnologies,[]);

const unknownB=structuredClone(battalions),unknownS=structuredClone(supports),unknownSoft=unknownB.infantry.soft;
const unknown=applySelectedTechnologyEffects(unknownB,unknownS,builtin1192,['definitely_not_a_real_tech']);
assert.deepEqual(unknown.unknownTechnologies,['definitely_not_a_real_tech']);
assert.equal(unknownB.infantry.soft,unknownSoft,'unknown technology IDs are informational and never block theorycrafting');

// Integration check: explicit selected tech IDs flow through the normal tech-data builder.
const baseline=buildTechAdjustedData(battalions,supports,profile,{pack:builtin1192,year:1940});
const integrated=buildTechAdjustedData(battalions,supports,{...profile,technologies:['interwar_artillery']},{pack:builtin1192,year:1940});
assert.deepEqual(integrated.technologyEffects.appliedTechnologies,['interwar_artillery']);
assert.ok(integrated.battalions.artillery.soft>baseline.battalions.artillery.soft,'technology effect survives the downstream doctrine transformation');

console.log('Explicit technology effect application certification passed.');

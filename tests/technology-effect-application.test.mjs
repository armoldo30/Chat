import assert from 'node:assert/strict';
import { battalions as baseBattalions, supports as baseSupports, equipment as baseEquipment, terrain as baseTerrain } from '../src/data.js';
import builtin1192 from '../src/builtin1192.js';
import { hydrateGameData } from '../src/gameData.js';
import { DEFAULT_TECH_PROFILE, normalizeTechProfile, buildTechAdjustedData, applySelectedTechnologyEffects } from '../src/tech.js';

const battalions=structuredClone(baseBattalions),supports=structuredClone(baseSupports),equipment=structuredClone(baseEquipment),terrain=structuredClone(baseTerrain);
hydrateGameData(builtin1192,{battalions,supports,equipment,terrain},{year:1940});
const profile=normalizeTechProfile({...DEFAULT_TECH_PROFILE,technologies:[]});
const findUnit=(collection,gameId)=>Object.values(collection).find(unit=>unit?.gameId===gameId);
const close=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-9,`${message}: expected ${expected}, got ${actual}`);

// Certify the technology layer before doctrine/MIO/designer transformations are applied.
const directB=structuredClone(battalions),directS=structuredClone(supports);
const lineSoft=directB.artillery.soft,supportSoft=directS.support_artillery.soft;
const artilleryMeta=applySelectedTechnologyEffects(directB,directS,builtin1192,['interwar_artillery']);
close(directB.artillery.soft,lineSoft*1.10,'line artillery source modifier applies as an additive percentage factor');
close(directS.support_artillery.soft,supportSoft*1.05,'support artillery receives its distinct source modifier');
assert.deepEqual(artilleryMeta.appliedTechnologies,['interwar_artillery']);
assert.equal(artilleryMeta.classification,'executable-inferred');
assert.equal(artilleryMeta.applicationOrder,'additive-then-factor');

const stackedB=structuredClone(battalions),stackedS=structuredClone(supports);
applySelectedTechnologyEffects(stackedB,stackedS,builtin1192,['interwar_artillery','artillery2']);
close(stackedB.artillery.soft,lineSoft*1.20,'same-stat technology modifiers add before multiplication rather than compounding');

const logisticsB=structuredClone(battalions),logisticsS=structuredClone(supports),logisticsSupply=logisticsS.logistics.supply;
applySelectedTechnologyEffects(logisticsB,logisticsS,builtin1192,['tech_logistics_company2']);
close(logisticsS.logistics.supply,logisticsSupply*0.90,'logistics supply-consumption factor applies to the matching support company');

// Core planner stat mappings that were previously preserved but not applied.
const piercingB=structuredClone(battalions),piercingS=structuredClone(supports),at=findUnit(piercingB,'anti_tank_brigade');
assert.ok(at,'anti_tank_brigade must be hydrated for piercing certification');
const atPiercing=at.piercing;
applySelectedTechnologyEffects(piercingB,piercingS,builtin1192,['SWE_bofors_antitank_gun']);
close(findUnit(piercingB,'anti_tank_brigade').piercing,atPiercing*1.10,'ap_attack maps to planner piercing as a source unit factor');

const hardnessB=structuredClone(battalions),hardnessS=structuredClone(supports),motArt=findUnit(hardnessB,'mot_artillery_brigade');
assert.ok(motArt,'mot_artillery_brigade must be hydrated for hardness certification');
const motArtHardness=motArt.hardness;
applySelectedTechnologyEffects(hardnessB,hardnessS,builtin1192,['mechanised_infantry']);
close(findUnit(hardnessB,'mot_artillery_brigade').hardness,motArtHardness*2,'hardness technology modifier maps to planner hardness as a factor');

const armorB=structuredClone(battalions),armorS=structuredClone(supports),armoredRecon=findUnit(armorS,'armored_car_recon');
assert.ok(armoredRecon,'armored_car_recon must be hydrated for armor certification');
const armoredReconArmor=armoredRecon.armor;
applySelectedTechnologyEffects(armorB,armorS,builtin1192,['GER_heavy_armored_car']);
close(findUnit(armorS,'armored_car_recon').armor,armoredReconArmor*1.5,'armor_value technology modifier maps to planner armor as a factor');

const orgB=structuredClone(battalions),orgS=structuredClone(supports),paratrooper=findUnit(orgB,'paratrooper');
assert.ok(paratrooper,'paratrooper must be hydrated for organization certification');
const paraOrg=paratrooper.org;
applySelectedTechnologyEffects(orgB,orgS,builtin1192,['paratroopers2']);
close(findUnit(orgB,'paratrooper').org,paraOrg+5,'max_organisation is a flat sub-unit organization change');

const hpB=structuredClone(battalions),hpS=structuredClone(supports),engineer=findUnit(hpS,'engineer');
assert.ok(engineer,'engineer must be hydrated for strength certification');
const engineerHp=engineer.hp;
applySelectedTechnologyEffects(hpB,hpS,builtin1192,['lotta_svard_tech']);
close(findUnit(hpS,'engineer').hp,engineerHp+5,'max_strength is a flat sub-unit HP change');

const widthB=structuredClone(battalions),widthS=structuredClone(supports),infantry=findUnit(widthB,'infantry');
assert.ok(infantry,'infantry must be hydrated for combat-width certification');
const infantryWidth=infantry.width;
applySelectedTechnologyEffects(widthB,widthS,builtin1192,['revolutionary_mass_assault']);
close(findUnit(widthB,'infantry').width,Math.max(0,infantryWidth-0.2),'combat_width is a flat sub-unit width change');

// `land_cruiser` is outside the current Division Lab hydration set, but its exact source effect is useful to certify
// the generic flat supply mapping without pretending the excluded unit is selectable in the planner.
const supplyB={landCruiserFixture:{id:'landCruiserFixture',gameId:'land_cruiser',supply:1}},supplyS={};
const supplyMeta=applySelectedTechnologyEffects(supplyB,supplyS,builtin1192,['sp_armored_lc_naval_engine_conversion_tech']);
close(supplyB.landCruiserFixture.supply,0.98,'supply_consumption is a flat sub-unit supply-use change');
assert.deepEqual(supplyMeta.appliedTechnologies,['sp_armored_lc_naval_engine_conversion_tech']);

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

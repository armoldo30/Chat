import assert from 'node:assert/strict';
import fs from 'node:fs';
import pack from '../src/builtin1192.js';
import { battalions as baseBattalions, supports as baseSupports, equipment as baseEquipment, terrain as baseTerrain } from '../src/data.js';
import { hydrateGameData, prerequisiteText } from '../src/gameData.js';
import { buildTechAdjustedData, DEFAULT_TECH_PROFILE } from '../src/tech.js';
import { airCatalogFromPack, tankCatalogFromPack } from '../src/designerData.js';

const battalions=structuredClone(baseBattalions),supports=structuredClone(baseSupports),equipment=structuredClone(baseEquipment),terrain=structuredClone(baseTerrain);
hydrateGameData(pack,{battalions,supports,equipment,terrain},{year:1940});

const heli=supports.helicopter_recon;
assert.ok(heli,'helicopter recon remains present without selecting its prerequisites');
const heliReq=prerequisiteText(heli);
assert.match(heliReq,/Technology:/);
assert.match(heliReq,/Special Project:/);
assert.match(heliReq,/DLC:/);

const flame=supports.light_flame_tank;
assert.ok(flame,'flame-tank support remains present without selecting its prerequisites');
assert.match(prerequisiteText(flame),/Special Project:/);
assert.match(prerequisiteText(flame),/DLC:/);

const profile=structuredClone(DEFAULT_TECH_PROFILE);
const adjusted=buildTechAdjustedData(battalions,supports,profile,{pack,year:1940});
assert.ok(adjusted.supports.helicopter_recon,'tech profile must not filter helicopter recon');
assert.ok(adjusted.supports.light_flame_tank,'tech profile must not filter flame-tank support');

const air=airCatalogFromPack(pack);
const jet=[...Object.values(air.engines),...Object.values(air.weapons),...Object.values(air.defense),...Object.values(air.specials)].find(x=>x?.id==='jet_engine_1x');
assert.ok(jet,'jet engine module is available in the air designer catalog');
assert.ok(jet.requirements.some(x=>x.startsWith('Technology:')));
assert.ok(jet.requirements.some(x=>x.startsWith('Special Project:')));
assert.ok(jet.requirements.some(x=>x.startsWith('DLC:')));

const tank=tankCatalogFromPack(pack);
const allTank=[...Object.values(tank.guns),...Object.values(tank.turrets),...Object.values(tank.suspensions),...Object.values(tank.armorTypes),...Object.values(tank.engines),...Object.values(tank.specials)];
assert.ok(allTank.some(x=>Array.isArray(x?.requirements)&&x.requirements.length),'tank designer preserves prerequisite metadata without using it as a lock');

const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
assert.ok(main.includes('Requirements (informational only):'),'UI exposes requirements as informational metadata');
assert.ok(!main.includes('Prerequisite not selected; available for theorycrafting'),'generic selected-research warning has been replaced by real requirement text');
assert.ok(!main.includes(' · LOCKED'),'research prerequisites must not be described as locked');
assert.ok(!/techAvailable\([^\n]+\)[^\n]+disabled/.test(main),'tech availability must not disable picker choices');
console.log('theorycraft-first prerequisite tests passed');

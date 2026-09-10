import assert from 'node:assert/strict';
import builtin1192 from '../src/builtin1192.js';
import { applyLandDoctrineToData, LAND_DOCTRINE_TRACKS, GRAND_DOCTRINES, AIR_DOCTRINE_TRACKS, AIR_GRAND_DOCTRINES, airDoctrineEffects, applyAirDoctrineToVariant } from '../src/doctrine.js';

const close=(actual,expected,message)=>assert.ok(Math.abs((Number(actual)||0)-expected)<1e-9,`${message}: expected ${expected}, got ${actual}`);
const actionable=Object.values(builtin1192.doctrines||{}).filter(d=>['grand','track','subdoctrine'].includes(d?.kind));
const metadata=Object.values(builtin1192.doctrines||{}).filter(d=>d?.kind==='legacy');
assert.equal(actionable.length,112,'1.19.2 bundled doctrine node catalog is 9 grand + 14 tracks + 89 subdoctrines');
assert.equal(metadata.length,36,'36 generic doctrine-labelled records are AI/folder metadata, not selectable doctrine nodes');
assert.equal(actionable.filter(d=>d.kind==='grand').length,9);
assert.equal(actionable.filter(d=>d.kind==='track').length,14);
assert.equal(actionable.filter(d=>d.kind==='subdoctrine').length,89);
for(const d of actionable.filter(d=>d.kind==='grand'))assert.ok(Array.isArray(d.raw?.milestones),`${d.id} must preserve source milestone order as an array`);
for(const d of actionable.filter(d=>d.kind==='subdoctrine'))assert.ok(d.raw?.rewards&&typeof d.raw.rewards==='object',`${d.id} must preserve source reward order`);

for(const id of Object.keys(GRAND_DOCTRINES))assert.ok(builtin1192.doctrines[id]||builtin1192.doctrines[`new_${id}`],`land grand doctrine ${id} must resolve to source pack`);
for(const meta of Object.values(LAND_DOCTRINE_TRACKS))for(const [id] of meta.choices)assert.ok(builtin1192.doctrines[id],`land choice ${id} must resolve to source pack`);
for(const id of Object.keys(AIR_GRAND_DOCTRINES))assert.ok(builtin1192.doctrines[`new_${id}`]||builtin1192.doctrines[id],`air grand doctrine ${id} must resolve to source pack`);
for(const meta of Object.values(AIR_DOCTRINE_TRACKS))for(const [id] of meta.choices)assert.ok(builtin1192.doctrines[`air_subdoctrine_${id}`]||builtin1192.doctrines[id],`air choice ${id} must resolve to source pack`);

// Real 1.19.2 grand-doctrine base effects, using source categories rather than planner aliases.
const line={line:{id:'line',gameId:'artillery_brigade',categories:['category_line_artillery'],types:[],soft:100,hard:0,def:0,breakthrough:0,piercing:0,airAttack:0,org:20,hp:10,width:3,supply:0.2}};
const support={support:{id:'support',gameId:'artillery',categories:['category_support_artillery'],types:[],soft:20,hard:0,def:0,breakthrough:0,piercing:0,airAttack:0,org:10,hp:2,width:0,supply:0.1}};
const sf=applyLandDoctrineToData(line,support,{grand:'superior_firepower',tracks:{infantry:{choice:'mobile_infantry',mastery:0},combat_support:{choice:'fire_concentration',mastery:0},armor:{choice:'armored_spearhead',mastery:0},operations:{choice:'mission_type_tactics',mastery:0}}},builtin1192);
assert.equal(sf.source,'game-pack');
assert.ok(sf.used.includes('superior_firepower'));
close(sf.battalions.line.soft,110,'Superior Firepower source grand bonus applies +10% to line artillery');
close(sf.supports.support.soft,21,'Superior Firepower source grand bonus applies +5% to support artillery');

// Source reward insertion order determines mastery 1..5. Armored Spearhead reward 1 is force_concentration (+2 tank org).
const armored=builtin1192.doctrines.armored_spearhead;
assert.equal(Object.keys(armored.raw.rewards)[0],'force_concentration','source reward order must remain stable');
assert.ok(builtin1192.doctrines.armored_spearhead_no_lar,'non-La-Resistance source variant must remain represented separately');
const tank={tank:{id:'tank',gameId:'medium_armor',categories:['category_tanks','category_all_armor'],types:['armor'],soft:0,hard:0,def:0,breakthrough:100,piercing:0,airAttack:0,org:30,hp:10,width:2,supply:0.3}};
const mw=applyLandDoctrineToData(tank,{}, {grand:'mobile_warfare',tracks:{infantry:{choice:'mobile_infantry',mastery:0},combat_support:{choice:'fire_concentration',mastery:0},armor:{choice:'armored_spearhead',mastery:1},operations:{choice:'mission_type_tactics',mastery:0}}},builtin1192);
close(mw.battalions.tank.org,32,'Armored Spearhead mastery 1 applies source +2 organization reward');
assert.ok(mw.used.includes('armored_spearhead')&&!mw.used.includes('armored_spearhead_no_lar'),'canonical theorycraft choice resolves deterministically without DLC locking');
close(mw.global.planningSpeed,0.2,'Mobile Warfare source planning-speed grand effect applies');
close(mw.global.armySpeed,0.1,'Mobile Warfare source army-speed grand effect applies');

// A real mastery-5 milestone must come from the matching source grand-doctrine track index.
const sf4=applyLandDoctrineToData(line,support,{grand:'superior_firepower',tracks:{infantry:{choice:'mobile_infantry',mastery:4},combat_support:{choice:'fire_concentration',mastery:0},armor:{choice:'armored_spearhead',mastery:0},operations:{choice:'mission_type_tactics',mastery:0}}},builtin1192);
const sf5=applyLandDoctrineToData(line,support,{grand:'superior_firepower',tracks:{infantry:{choice:'mobile_infantry',mastery:5},combat_support:{choice:'fire_concentration',mastery:0},armor:{choice:'armored_spearhead',mastery:0},operations:{choice:'mission_type_tactics',mastery:0}}},builtin1192);
close(sf4.global.supply||0,0,'Superior Firepower infantry milestone is not active before mastery 5');
close(sf5.global.supply,-0.1,'Superior Firepower infantry mastery-5 milestone applies source -10% supply factor');

// Source supply_consumption is a flat sub-unit value, not a percentage factor.
const regSupport={reg:{id:'reg',gameId:'fixture_reg_support',categories:['category_regimental_support_battalions'],types:[],soft:0,hard:0,def:0,breakthrough:0,piercing:0,airAttack:0,org:10,hp:2,width:0,supply:0.3}};
const ma=applyLandDoctrineToData({},regSupport,{grand:'mass_assault',tracks:{infantry:{choice:'mobile_infantry',mastery:5},combat_support:{choice:'fire_concentration',mastery:0},armor:{choice:'armored_spearhead',mastery:0},operations:{choice:'mission_type_tactics',mastery:0}}},builtin1192);
close(ma.supports.reg.supply,0.28,'Mass Assault infantry milestone supply_consumption = -0.02 applies as a flat supply change');

// Real Air source path: base Flying Artillery gives CAS +15% air defence; mastery 1 adds +10% CAS mission efficiency.
const airState={grand:'operational_integrity',tracks:{fighter_aircraft:{choice:'tactical_flexibility',mastery:0},strike_aircraft:{choice:'flying_artillery',mastery:1},medium_aircraft:{choice:'bomber_interception',mastery:0},heavy_aircraft:{choice:'flying_fortresses',mastery:0}}};
const design={size:'small',roles:['cas']},variant={airDefense:20,agility:50,airAttack:10,maxSpeed:500,range:800,groundAttack:15,navalAttack:0,reliability:0.8};
const airApplied=applyAirDoctrineToVariant(variant,airState,builtin1192,design);
close(airApplied.airDefense,23,'Flying Artillery source base effect applies +15% CAS air defence');
const airEffects=airDoctrineEffects(airState,builtin1192,design);
close(airEffects.mission.cas,0.1,'Flying Artillery mastery 1 applies source +10% CAS mission efficiency');

console.log('Doctrine real-pack runtime certification passed.');

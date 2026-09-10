import assert from 'node:assert/strict';
import builtin1192 from '../src/builtin1192.js';
import { applyLandDoctrineToData, LAND_DOCTRINE_TRACKS, GRAND_DOCTRINES, AIR_DOCTRINE_TRACKS, AIR_GRAND_DOCTRINES, airDoctrineEffects, applyAirDoctrineToVariant } from '../src/doctrine.js';

const close=(actual,expected,message)=>assert.ok(Math.abs((Number(actual)||0)-expected)<1e-9,`${message}: expected ${expected}, got ${actual}`);
const actionable=Object.values(builtin1192.doctrines||{});
const metadata=Object.values(builtin1192.doctrineMetadata||{});
assert.equal(actionable.length,121,'1.19.2 bundled doctrine node catalog is 12 grand + 14 tracks + 95 subdoctrines');
assert.equal(metadata.length,36,'36 generic doctrine-labelled records are preserved separately as AI/folder metadata');
assert.equal(actionable.filter(d=>d.kind==='grand').length,12);
assert.equal(actionable.filter(d=>d.kind==='track').length,14);
assert.equal(actionable.filter(d=>d.kind==='subdoctrine').length,95);
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
assert.equal(mw.global.planningSpeed,undefined,'planning-speed source data is preserved but not misrepresented as a battle-runtime modifier');
assert.equal(mw.global.armySpeed,undefined,'army movement speed is deferred until the movement-formula audit');

// A real mastery-5 milestone must come from the matching source grand-doctrine track index.
const sf4=applyLandDoctrineToData(line,support,{grand:'superior_firepower',tracks:{infantry:{choice:'mobile_infantry',mastery:4},combat_support:{choice:'fire_concentration',mastery:0},armor:{choice:'armored_spearhead',mastery:0},operations:{choice:'mission_type_tactics',mastery:0}}},builtin1192);
const sf5=applyLandDoctrineToData(line,support,{grand:'superior_firepower',tracks:{infantry:{choice:'mobile_infantry',mastery:5},combat_support:{choice:'fire_concentration',mastery:0},armor:{choice:'armored_spearhead',mastery:0},operations:{choice:'mission_type_tactics',mastery:0}}},builtin1192);
close(sf4.global.supply||0,0,'Superior Firepower infantry milestone is not active before mastery 5');
close(sf5.global.supply,-0.1,'Superior Firepower infantry mastery-5 milestone applies source -10% supply factor');
close(sf5.battalions.line.supply,0.18,'global supply factor propagates into line-unit supply consumption');
close(sf5.supports.support.supply,0.09,'global supply factor propagates into support-unit supply consumption');

// Source supply_consumption is a flat sub-unit value, not a percentage factor.
const regSupport={reg:{id:'reg',gameId:'fixture_reg_support',categories:['category_regimental_support_battalions'],types:[],soft:0,hard:0,def:0,breakthrough:0,piercing:0,airAttack:0,org:10,hp:2,width:0,supply:0.3}};
const ma=applyLandDoctrineToData({},regSupport,{grand:'mass_assault',tracks:{infantry:{choice:'mobile_infantry',mastery:5},combat_support:{choice:'fire_concentration',mastery:0},armor:{choice:'armored_spearhead',mastery:0},operations:{choice:'mission_type_tactics',mastery:0}}},builtin1192);
close(ma.supports.reg.supply,0.28,'Mass Assault infantry milestone supply_consumption = -0.02 applies as a flat supply change');

// Real Air source path: base Flying Artillery gives CAS +15% air defence; mastery 1 adds +10% CAS mission efficiency.
const airState={grand:'operational_integrity',tracks:{fighter_aircraft:{choice:'tactical_flexibility',mastery:0},strike_aircraft:{choice:'flying_artillery',mastery:1},medium_aircraft:{choice:'bomber_interception',mastery:0},heavy_aircraft:{choice:'flying_fortresses',mastery:0}}};
const design={size:'small',roles:['cas'],airDefense:20,agility:50,airAttack:10,maxSpeed:500,range:800,groundAttack:15,navalAttack:0,reliability:0.8};
const airApplied=applyAirDoctrineToVariant(design,airState,builtin1192);
close(airApplied.airDefense,23,'Flying Artillery source base effect applies +15% CAS air defence');
const airEffects=airDoctrineEffects(airState,design,builtin1192);
close(airEffects.mission.cas,0.1,'Flying Artillery mastery 1 applies source +10% CAS mission efficiency');
assert.equal(airEffects.source,'game-pack');
assert.ok(airEffects.used.includes('air_subdoctrine_flying_artillery'));

// air_cas_present_factor belongs to land-combat CAS resolution and must not be misapplied as Air Lab mission efficiency.
const airStateM2=structuredClone(airState);airStateM2.tracks.strike_aircraft.mastery=2;
const airEffectsM2=airDoctrineEffects(airStateM2,design,builtin1192);
close(airEffectsM2.mission.cas,0.1,'CAS-presence modifier does not leak into CAS mission efficiency');

// A general mission-efficiency modifier from another selected track applies globally, independent of aircraft category.
const crossTrack=structuredClone(airState);crossTrack.tracks.strike_aircraft.mastery=0;crossTrack.tracks.medium_aircraft.choice='operational_air_support';
const crossTrackFx=airDoctrineEffects(crossTrack,{...design,roles:['fighter'],equipmentTypes:['fighter']},builtin1192);
close(crossTrackFx.mission.air_superiority,0.25,'grand + fighter-choice + global mission-efficiency bonuses accumulate from all selected tracks');
close(crossTrackFx.mission.cas,0.05,'general air_mission_efficiency applies to CAS');
close(crossTrackFx.mission.naval_strike,0.05,'general air_mission_efficiency applies to naval strike');

// Exact 1.19 category IDs must resolve through equipment types.
const tacState=structuredClone(airState);tacState.tracks.strike_aircraft.mastery=0;tacState.tracks.medium_aircraft.choice='tactical_battlefield_support';
const tac={size:'medium',roles:['tactical_bomber'],equipmentTypes:['tactical_bomber'],airDefense:20,agility:30,airAttack:5,maxSpeed:450,range:1000,groundAttack:20,navalAttack:5,reliability:0.8,fuelConsumption:1};
const tacApplied=applyAirDoctrineToVariant(tac,tacState,builtin1192);
close(tacApplied.groundAttack,22,'category_tac_bomber source block applies +10% ground attack');

// Detection is source-exact but deliberately deferred instead of leaking interception/superiority detection into unrelated missions.
const bsState=structuredClone(airState);bsState.grand='battlefield_support';bsState.tracks.strike_aircraft.mastery=0;
const bsFx=airDoctrineEffects(bsState,design,builtin1192);
close(bsFx.detection,0,'mission-specific detection remains deferred until the Air detection formula path is modeled');

console.log('Doctrine real-pack runtime certification passed.');

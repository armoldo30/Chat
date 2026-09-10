import assert from 'node:assert/strict';
import { applyLandDoctrineToData, airDoctrineEffects, applyAirDoctrineToVariant, DEFAULT_LAND_DOCTRINE, DEFAULT_AIR_DOCTRINE } from '../src/doctrine.js';

const pack={doctrines:{
  new_mobile_warfare:{kind:'grand',tracks:['infantry','combat_support','armor','operations'],raw:{planning_speed:.2,army_speed_factor:.1,milestones:[{}, {planning_speed:.1}, {}, {}]}},
  mobile_infantry:{kind:'subdoctrine',track:'infantry',raw:{category_all_infantry:{breakthrough:.1},rewards:{r1:{category_cavalry:{breakthrough:.2}},r2:{category_all_infantry:{max_organisation:10,maximum_speed:.05}}}}},
  fire_concentration:{kind:'subdoctrine',track:'combat_support',raw:{category_line_artillery:{defense:.05,max_organisation:5},rewards:{r1:{category_line_artillery:{defense:.05}},r2:{},r3:{},r4:{},r5:{}}}},
  armored_spearhead:{kind:'subdoctrine',track:'armor',raw:{}},
  mission_type_tactics:{kind:'subdoctrine',track:'operations',raw:{}},
  new_operational_integrity:{kind:'grand',tracks:['fighter_aircraft','strike_aircraft','medium_aircraft','heavy_aircraft'],raw:{air_superiority_detect_factor:.2,milestones:[{category_fighter:{air_agility:.1}},{},{},{}]}},
  air_subdoctrine_tactical_flexibility:{kind:'subdoctrine',track:'fighter_aircraft',raw:{air_superiority_efficiency:.1,rewards:{r1:{category_fighter:{air_agility:.05,air_attack:.05}},r2:{},r3:{},r4:{},r5:{}}}},
  air_subdoctrine_flying_artillery:{kind:'subdoctrine',track:'strike_aircraft',raw:{}},
  air_subdoctrine_bomber_interception:{kind:'subdoctrine',track:'medium_aircraft',raw:{}},
  air_subdoctrine_flying_fortresses:{kind:'subdoctrine',track:'heavy_aircraft',raw:{}}
}};

const land=structuredClone(DEFAULT_LAND_DOCTRINE);
land.tracks.infantry.mastery=2;
land.tracks.combat_support.mastery=1;
const applied=applyLandDoctrineToData({
  infantry:{gameId:'infantry',categories:['category_all_infantry'],types:[],breakthrough:10,org:60,speed:4,def:20},
  artillery:{gameId:'artillery_brigade',categories:['category_line_artillery'],types:['artillery'],breakthrough:5,org:20,speed:4,def:10}
},{},land,pack);
assert.equal(applied.source,'game-pack');
assert.equal(applied.battalions.infantry.breakthrough,11);
assert.equal(applied.battalions.infantry.org,70);
assert.equal(applied.battalions.infantry.speed,4,'maximum_speed remains source metadata until the land movement runtime is modeled');
assert.equal(pack.doctrines.mobile_infantry.raw.rewards.r2.category_all_infantry.maximum_speed,.05,'deferred movement modifier is still preserved exactly');
assert.equal(applied.battalions.artillery.def,11,'base and reward percentage modifiers accumulate additively');
assert.equal(applied.battalions.artillery.org,25);
assert.equal(applied.global.planningSpeed,undefined,'planning accumulation is deferred rather than exposed as a fake battle modifier');
assert.equal(applied.global.armySpeed,undefined,'land movement-speed global is deferred');
assert.equal(pack.doctrines.new_mobile_warfare.raw.planning_speed,.2);
assert.equal(pack.doctrines.new_mobile_warfare.raw.army_speed_factor,.1);

const landMilestone=structuredClone(DEFAULT_LAND_DOCTRINE);
landMilestone.tracks.combat_support.mastery=5;
const milestone=applyLandDoctrineToData({}, {}, landMilestone, pack);
assert.equal(milestone.global.planningSpeed,undefined,'planning-speed milestone stays source metadata until planning formulas are audited');
assert.equal(pack.doctrines.new_mobile_warfare.raw.milestones[1].planning_speed,.1);

const air=structuredClone(DEFAULT_AIR_DOCTRINE);air.tracks.fighter_aircraft.mastery=1;
const design={size:'small',roles:['fighter'],equipmentTypes:['fighter'],agility:60,airAttack:20,airDefense:5,maxSpeed:400,range:700,reliability:.8,groundAttack:0,navalAttack:0};
const fx=airDoctrineEffects(air,design,pack);
assert.equal(fx.source,'game-pack');
assert.equal(fx.mission.air_superiority,.1);
assert.equal(fx.detection,0,'detection source modifiers are deferred until mission-specific detection runtime is certified');
assert.equal(pack.doctrines.new_operational_integrity.raw.air_superiority_detect_factor,.2);
assert.equal(fx.variant.agility,.05);
assert.equal(fx.variant.airAttack,.05);
const built=applyAirDoctrineToVariant(design,air,pack);
assert.equal(built.agility,63);
assert.equal(built.airAttack,21);
console.log('imported doctrine data tests passed');

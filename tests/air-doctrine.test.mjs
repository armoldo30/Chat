import assert from 'node:assert/strict';
import {DEFAULT_AIR_DOCTRINE,normalizeAirDoctrine,applyAirDoctrineToVariant,airDoctrineEffects} from '../src/doctrine.js';
const fighter={size:'small',roles:['fighter'],airAttack:20,airDefense:10,agility:60,maxSpeed:400,range:600,reliability:.8,buildCost:20};
const d=structuredClone(DEFAULT_AIR_DOCTRINE);d.tracks.fighter_aircraft.mastery=5;const out=applyAirDoctrineToVariant(fighter,d);assert.ok(out.agility>fighter.agility);const fx=airDoctrineEffects(d,out);assert.ok((fx.mission.air_superiority||0)>0);
const b=structuredClone(DEFAULT_AIR_DOCTRINE);b.grand='battlefield_support';const bfx=airDoctrineEffects(b,{...fighter,roles:['fighter','cas']});assert.ok((bfx.mission.cas||0)>=.2);assert.equal(normalizeAirDoctrine({grand:'bad'}).grand,'operational_integrity');
console.log('air doctrine tests passed');

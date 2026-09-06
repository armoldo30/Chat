import assert from 'node:assert/strict';
import {DEFAULT_LAND_DOCTRINE,normalizeLandDoctrine,applyLandDoctrineToData,landDoctrineEffects} from '../src/doctrine.js';
const b={infantry:{group:'infantry',org:60,soft:6,hard:1,def:22,breakthrough:3,supply:.07,hp:25},medium_armor:{group:'armor',org:20,soft:20,hard:15,def:10,breakthrough:40,supply:.2,hp:3},artillery:{group:'infantry',org:20,soft:30,hard:2,def:10,breakthrough:4,supply:.1,hp:5}};
const s={support_artillery:{org:0,soft:15,hard:0,def:0,breakthrough:0,supply:.04,hp:1}};
const d=structuredClone(DEFAULT_LAND_DOCTRINE);d.tracks.infantry.mastery=2;
const out=applyLandDoctrineToData(b,s,d);assert.ok(out.battalions.infantry.org>60);assert.equal(normalizeLandDoctrine({grand:'bad'}).grand,'mobile_warfare');
const sf=structuredClone(DEFAULT_LAND_DOCTRINE);sf.grand='superior_firepower';const sfOut=applyLandDoctrineToData(b,s,sf);assert.ok(sfOut.battalions.artillery.soft>30);assert.ok(sfOut.supports.support_artillery.soft>15);
const m=structuredClone(DEFAULT_LAND_DOCTRINE);m.tracks.armor.mastery=5;assert.ok((landDoctrineEffects(m).effects.armor?.orgFlat||0)>=2);
console.log('doctrine tests passed');

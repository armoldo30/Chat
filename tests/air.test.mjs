import assert from 'node:assert/strict';
import { defaultAirDesign, buildAirDesign, compareAirDesigns, airMissionEfficiency } from '../src/air.js';

const fighter=buildAirDesign(defaultAirDesign('small'));
assert.ok(fighter.airAttack>0&&fighter.agility>0&&fighter.buildCost>0);
const cannon=buildAirDesign({...defaultAirDesign('small'),weapons:['cannon_2','cannon_2','none']});
assert.ok(cannon.airAttack>fighter.airAttack);
assert.ok(cannon.buildCost>fighter.buildCost);
const cas=buildAirDesign({...defaultAirDesign('small'),weapons:['bomb_locks','small_bomb_bay','heavy_mg']});
assert.ok(airMissionEfficiency(cas,'cas').score>0);
const fight=compareAirDesigns(defaultAirDesign('small'),cannon,{countA:100,countB:100,sorties:1000});
assert.ok(Number.isFinite(fight.lossA)&&Number.isFinite(fight.lossB));
assert.ok(fight.lossA>=0&&fight.lossB>=0);
console.log('air tests passed');

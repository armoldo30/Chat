import assert from 'node:assert/strict';
import { defaultTankDesign, buildTankDesign, normalizeTankDesign, applyTankDesignToBattalion, tankEquipmentRecord } from '../src/tank.js';

const medium=buildTankDesign(defaultTankDesign('medium'));
assert.equal(medium.class,'medium');
assert.ok(medium.buildCost>5);
assert.ok(medium.armor>30);
assert.ok(medium.reliability>0&&medium.reliability<=1);

const gun=buildTankDesign({...defaultTankDesign('medium'),gun:'medium_howitzer'});
assert.ok(gun.softAttack>medium.softAttack,'howitzer should improve soft attack');

const armor=buildTankDesign({...defaultTankDesign('medium'),armorUpgrades:10});
assert.ok(armor.armor>medium.armor,'armor upgrades should increase armor');
assert.ok(armor.buildCost>medium.buildCost,'armor upgrades should increase IC');

const base={soft:1,hard:1,def:1,breakthrough:1,hardness:.1,armor:1,piercing:1};
const applied=applyTankDesignToBattalion(base,defaultTankDesign('light'));
assert.ok(applied.soft>1&&applied.armor>1);
const eq=tankEquipmentRecord({name:'Tank',cost:1,resources:{}},defaultTankDesign('heavy'));
assert.ok(eq.cost>1&&eq.designStats.class==='heavy');
assert.equal(normalizeTankDesign({chassis:'nope'},'light').class,'light');
console.log('tank tests passed');

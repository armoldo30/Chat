import assert from 'node:assert/strict';
import {BUILTIN_MIOS,mioEffects,mioAvailable,traitSelectable,applyMioEquipmentBonus,mioProductionAdjustments,applyMioToVariant} from '../src/mio.js';
const org=BUILTIN_MIOS.GER_porsche_tank;assert.equal(mioAvailable(org,'GER','medium_tank'),true);assert.equal(mioAvailable(org,'USA','medium_tank'),false);assert.equal(traitSelectable(org,'high_output_engines',[]),true);
const e=mioEffects(BUILTIN_MIOS,{organization:'GER_porsche_tank',traits:['high_output_engines','simplified_components']});assert.ok(e.equipmentBonus.maximum_speed>.02);assert.ok(mioProductionAdjustments(e).costFactor<1);
const tank=applyMioEquipmentBonus({armor:60,speed:8,reliability:.8},{armor_value:.1,maximum_speed:.05});assert.ok(tank.armor>60&&tank.speed>8);

// Structural MIO tree semantics: plain parent requires N selected parents and static-disabled source helpers are not selectable.
const parentOrg={id:'parent_test',traits:{a:{id:'a'},b:{id:'b'},c:{id:'c'},threshold:{id:'threshold',parentTraits:['a','b','c'],parentCount:2}}};
assert.equal(traitSelectable(parentOrg,'threshold',['a']),false);
assert.equal(traitSelectable(parentOrg,'threshold',['a','c']),true);
assert.equal(mioAvailable({id:'debug',staticDisabled:true},'GER','medium_tank'),false);

// Air MIO regression: imported/synthetic aircraft organizations must affect both combat stats and manufacturing economics.
const airCatalog={...BUILTIN_MIOS,USA_air_test:{id:'USA_air_test',name:'Air Test Works',countries:['USA'],equipmentTypes:['small_airframe'],initial:{equipmentBonus:{air_attack:.05,air_agility:.04},productionBonus:{production_cost_factor:-.08}},traits:{streamlined_airframe:{id:'streamlined_airframe',name:'Streamlined Airframe',equipmentBonus:{maximum_speed:.03},productionBonus:{production_efficiency_gain_factor:.10},parents:[]}}}};
assert.equal(mioAvailable(airCatalog.USA_air_test,'USA','small_airframe'),true);
assert.equal(mioAvailable(airCatalog.USA_air_test,'GER','small_airframe'),false);
const airFx=mioEffects(airCatalog,{organization:'USA_air_test',traits:['streamlined_airframe']});
const airVariant=applyMioToVariant({airAttack:20,agility:60,maxSpeed:400,buildCost:30,resources:{aluminum:3}},airFx);
assert.ok(airVariant.airAttack>20&&airVariant.agility>60&&airVariant.maxSpeed>400,'air MIO should improve aircraft combat stats');
assert.ok(airVariant.buildCost<30,'air MIO production-cost bonus should reduce aircraft IC cost');
assert.ok(mioProductionAdjustments(airFx).efficiencyGainFactor>1,'air MIO should expose production-efficiency bonus');

console.log('mio tests passed');

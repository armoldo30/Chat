import assert from 'node:assert/strict';
import BUILTIN from '../src/builtin1192.js';
import { hydrateGameData, selectEquipment } from '../src/gameData.js';
import {
  configureTankDataPack, TANK_FAMILIES, tankRolesForFamily, tankVariantTargets,
  defaultTankDesign, buildTankDesign, tankDesignOptions, applyTankDesignToBattalion,
  tankEquipmentRecord
} from '../src/tank.js';

configureTankDataPack(BUILTIN,1950);
const battalions={},supports={},equipment={},terrain={};
hydrateGameData(BUILTIN,{battalions,supports,equipment,terrain},{year:1950});
const finite=(value,label)=>assert.ok(Number.isFinite(Number(value)),`${label} must be finite, got ${value}`);
let variants=0,targets=0;

for(const family of TANK_FAMILIES){
  for(const role of tankRolesForFamily(family)){
    variants++;
    const design=defaultTankDesign(family,role),built=buildTankDesign(design),options=tankDesignOptions(design),target=tankVariantTargets(family,role);
    assert.equal(design.class,family);assert.equal(design.role,role);assert.equal(built.class,family);assert.equal(built.role,role);
    for(const [key,value] of Object.entries({buildCost:built.buildCost,armor:built.armor,hardness:built.hardness,maxSpeed:built.maxSpeed,reliability:built.reliability,softAttack:built.softAttack,hardAttack:built.hardAttack,piercing:built.piercing,breakthrough:built.breakthrough,defense:built.defense,airAttack:built.airAttack}))finite(value,`${family}/${role} ${key}`);
    assert.ok(built.buildCost>=0,`${family}/${role} cost cannot be negative`);assert.ok(built.reliability>0&&built.reliability<=1,`${family}/${role} reliability must be normalized`);
    assert.ok(target?.equipmentKey,`${family}/${role} requires a production equipment family`);
    assert.ok(selectEquipment(BUILTIN,target.equipmentKey,{year:1950}),`${family}/${role} equipment family ${target.equipmentKey} must resolve from bundled data`);
    assert.ok(equipment[target.equipmentKey],`${family}/${role} production alias ${target.equipmentKey} must be hydrated`);
    const production=tankEquipmentRecord(equipment[target.equipmentKey],design);assert.equal(production.cost,built.buildCost);assert.deepEqual(production.resources,built.resources);

    if(family==='land_cruiser'){
      assert.equal(Object.keys(design.slotModules||{}).length,9,'Land Cruiser must retain all nine source slots');
      assert.equal(Object.keys(options.genericSlots||{}).length,9,'Land Cruiser option graph must expose all nine source slots');
      assert.notEqual(design.slotModules.lc_main_armament_slot,'none','Land Cruiser main armament is required');
    }else{
      assert.ok(design.gun&&design.turret&&design.suspension&&design.armorType&&design.engine,`${family}/${role} must fill all required standard slots`);
      assert.ok(options.guns.has(design.gun),`${family}/${role} selected gun must be structurally valid`);
      assert.ok(options.turrets.has(design.turret),`${family}/${role} selected turret must be structurally valid`);
      assert.ok(options.suspensions.has(design.suspension),`${family}/${role} selected suspension must be structurally valid`);
      assert.ok(options.armorTypes.has(design.armorType),`${family}/${role} selected armor type must be structurally valid`);
      assert.ok(options.engines.has(design.engine),`${family}/${role} selected engine must be structurally valid`);
    }

    for(const unit of target.units){
      targets++;
      const map=unit.kind==='support'?supports:battalions,base=map[unit.id];
      assert.ok(base,`${family}/${role} target ${unit.kind}:${unit.id} must exist in hydrated 1.19.2 data`);
      const applied=applyTankDesignToBattalion(base,design);
      assert.equal(applied.designStats.class,family);assert.equal(applied.designStats.role,role);
      for(const key of ['soft','hard','def','breakthrough','hardness','armor','piercing','airAttack'])finite(applied[key],`${family}/${role} ${unit.id}.${key}`);
    }
  }
}

assert.equal(variants,28,'all 28 supported family/role variants must be certified');
assert.ok(targets>=34,'all line and support integration targets must be traversed');
console.log(`Tank Designer integration certification passed: ${variants} variants, ${targets} linked unit targets.`);

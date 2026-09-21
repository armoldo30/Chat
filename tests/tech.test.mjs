import assert from 'node:assert/strict';
import { battalions, supports } from '../src/data.js';
import { DEFAULT_TECH_PROFILE, normalizeTechProfile, buildTechAdjustedData, techAvailable, techIssues } from '../src/tech.js';
import { LAND_MIO_FAMILY_MAP, landMioSupportFamily, landMioTargetsForUnit, landMioTargetForEquipment } from '../src/land-mio-family-map.js';

const base=normalizeTechProfile(DEFAULT_TECH_PROFILE);
assert.equal(base.infantryEquipment,1);
assert.deepEqual([...LAND_MIO_FAMILY_MAP.artillery.supports],['support_artillery','field_guns','regimental_infantry_guns']);
assert.deepEqual([...LAND_MIO_FAMILY_MAP.anti_tank.supports],['support_at','anti_tank_battery','regimental_at']);
assert.deepEqual([...LAND_MIO_FAMILY_MAP.anti_air.supports],['support_aa','anti_air_battery','regimental_aa']);
assert.equal(landMioSupportFamily('field_guns'),'artillery');
assert.equal(landMioSupportFamily('anti_tank_battery'),'anti_tank');
assert.equal(landMioSupportFamily('anti_air_battery'),'anti_air');
assert.deepEqual(landMioTargetsForUnit({need:{artillery:24,motorized_equipment:36}}),[{family:'artillery',equipmentFamily:'artillery_equipment'}],'motorized artillery must derive its MIO target from artillery equipment need');
assert.deepEqual(landMioTargetsForUnit({need:{anti_tank:36,motorized_equipment:36}}),[{family:'anti_tank',equipmentFamily:'anti_tank_equipment'}],'motorized AT must derive its MIO target from anti-tank equipment need');
assert.deepEqual(landMioTargetsForUnit({need:{anti_air:36,motorized_equipment:36}}),[{family:'anti_air',equipmentFamily:'anti_air_equipment'}],'motorized AA must derive its MIO target from anti-air equipment need');
assert.deepEqual(landMioTargetsForUnit({need:{rocket_artillery_equipment:24,motorized_equipment:36}}),[{family:'artillery',equipmentFamily:'rocket_artillery_equipment'}],'rocket artillery must retain a rocket-specific MIO context');
assert.deepEqual(landMioTargetsForUnit({need:{motorized_rocket_equipment:16,motorized_equipment:16}}),[{family:'artillery',equipmentFamily:'motorized_rocket_equipment'}],'motorized rocket equipment must retain its distinct MIO context');
assert.deepEqual(landMioTargetsForUnit({need:{infantry_equipment:40,support_equipment:10}}),[{family:'infantry_equipment',equipmentFamily:'infantry_equipment'}],'infantry-equipment support units must participate in infantry-equipment MIO propagation');
assert.deepEqual(landMioTargetForEquipment('rocket_artillery_equipment',{family:'rocket_artillery_equipment'}),{family:'artillery',equipmentFamily:'rocket_artillery_equipment'});

const basic=buildTechAdjustedData(battalions,supports,{...base,infantryEquipment:0});
const advanced=buildTechAdjustedData(battalions,supports,{...base,infantryEquipment:3});
assert.ok(advanced.battalions.infantry.soft>basic.battalions.infantry.soft,'advanced infantry equipment should raise infantry soft attack');
assert.ok(advanced.battalions.infantry.def>basic.battalions.infantry.def,'advanced infantry equipment should raise infantry defense');
assert.equal(advanced.battalions.mechanized.hard-basic.battalions.mechanized.hard,1.5,'infantry equipment delta should preserve mechanized-specific hard attack while adding weapon improvement');

const doctrine=buildTechAdjustedData(battalions,supports,{...base,doctrine:{...base.doctrine,org:10,soft:20,breakthrough:15}});
assert.ok(Math.abs(doctrine.battalions.infantry.org-battalions.infantry.org*1.10)<1e-9);
assert.ok(Math.abs(doctrine.battalions.artillery.soft-battalions.artillery.soft*1.20)<1e-9);
assert.ok(Math.abs(doctrine.battalions.medium_armor.breakthrough-battalions.medium_armor.breakthrough*1.15)<1e-9);

const fallbackSupports=structuredClone(supports);
fallbackSupports.field_guns={...structuredClone(supports.support_artillery),id:'field_guns',gameId:'field_guns'};
fallbackSupports.anti_tank_battery={...structuredClone(supports.support_at),id:'anti_tank_battery',gameId:'anti_tank_battery'};
fallbackSupports.anti_air_battery={...structuredClone(supports.support_aa),id:'anti_air_battery',gameId:'anti_air_battery'};
const fallbackLow=buildTechAdjustedData(battalions,fallbackSupports,{...base,artillery:1,antiTank:1,antiAir:1});
const fallbackHigh=buildTechAdjustedData(battalions,fallbackSupports,{...base,artillery:3,antiTank:3,antiAir:3});
assert.ok(fallbackHigh.supports.field_guns.soft>fallbackLow.supports.field_guns.soft,'shared fallback artillery family must include current Infantry Guns');
assert.ok(fallbackHigh.supports.anti_tank_battery.hard>fallbackLow.supports.anti_tank_battery.hard,'shared fallback anti-tank family must include current Anti-Tank Battery');
assert.ok(fallbackHigh.supports.anti_air_battery.airAttack>fallbackLow.supports.anti_air_battery.airAttack,'shared fallback anti-air family must include current Anti-Air Battery');

const locked={...base,artillery:0,antiTank:0,antiAir:0,unlocks:{...base.unlocks,mechanized:false,signal:false}};
assert.equal(techAvailable('battalion','artillery',locked),false);
assert.equal(techAvailable('battalion','mechanized',locked),false);
assert.equal(techAvailable('support','support_at',locked),false);
assert.equal(techAvailable('support','field_guns',locked),false);
assert.equal(techAvailable('support','anti_tank_battery',locked),false);
assert.equal(techAvailable('support','anti_air_battery',locked),false);
assert.equal(techAvailable('support','regimental_infantry_guns',locked),false);
assert.equal(techAvailable('support','regimental_aa',locked),false);
assert.equal(techAvailable('support','signal',locked),false);
assert.equal(techAvailable('battalion','infantry',locked),true);
const grid=[[ 'infantry','artillery',null,null,null ],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]];
const issues=techIssues(grid,['signal'],['field_guns','anti_tank_battery','anti_air_battery','regimental_at',null],locked);
assert.deepEqual(new Set(issues),new Set(['artillery','signal','field_guns','anti_tank_battery','anti_air_battery','regimental_at']));

console.log('Tech-profile regression tests passed.');

import assert from 'node:assert/strict';
import builtin1192 from '../src/builtin1192.js';
import technologyEffects1192, { TECHNOLOGY_EFFECT_SOURCES_1192, TECHNOLOGY_EFFECT_SOURCE_COUNTS_1192 } from '../src/builtin1192/technology-effects-index-1192.js';

const sourceNames=Object.keys(TECHNOLOGY_EFFECT_SOURCES_1192).sort();
assert.deepEqual(sourceNames,['armor','artillery','bbaAir','electronics','industry','infantry','nsbArmor','specialProjects','support']);
const sourceRecordTotal=Object.values(TECHNOLOGY_EFFECT_SOURCE_COUNTS_1192).reduce((sum,n)=>sum+n,0);
assert.equal(sourceRecordTotal,Object.keys(technologyEffects1192).length,'effect supplement files must not collide on technology IDs');
assert.equal(builtin1192.meta.technologyEffectSourceRestoredCount,sourceRecordTotal);
assert.deepEqual(builtin1192.meta.technologyEffectSourceCounts,TECHNOLOGY_EFFECT_SOURCE_COUNTS_1192);

for(const [id,effects] of Object.entries(technologyEffects1192)){
  assert.ok(builtin1192.technologies[id],`effect source must resolve technology ${id}`);
  assert.deepEqual(builtin1192.technologies[id].directEffects,effects,`${id} bundled direct effects must match certified supplement`);
}

// Golden source cases across the planner-relevant technology domains.
assert.deepEqual(builtin1192.technologies.basic_machine_tools.directEffects,{production_factory_max_efficiency_factor:0.1,equipment_conversion_speed:0.2});
assert.equal(builtin1192.technologies.concentrated_industry.directEffects.industrial_capacity_factory,0.15);
assert.equal(builtin1192.technologies.dispersed_industry.directEffects.production_factory_start_efficiency_factor,0.05);
assert.equal(builtin1192.technologies.electronic_mechanical_engineering.directEffects.research_speed_factor,0.03);
assert.deepEqual(builtin1192.technologies.radio.directEffects,{land_reinforce_rate:0.02,coordination_bonus:0.02});
assert.equal(builtin1192.technologies.tech_engineers2.directEffects.engineer.entrenchment,0.5);
assert.equal(builtin1192.technologies.tech_logistics_company2.directEffects.logistics_company.supply_consumption_factor,-0.1);
assert.equal(builtin1192.technologies.interwar_artillery.directEffects.artillery_brigade.soft_attack,0.1);
assert.equal(builtin1192.technologies.mountain_tanks.directEffects.light_armor.mountain.attack,0.15);
assert.equal(builtin1192.technologies.aerial_hangars.directEffects.mothership.air_range,0.2);

console.log(`Technology effect runtime certification passed: ${sourceRecordTotal} source-derived effect records across ${sourceNames.length} source groups.`);

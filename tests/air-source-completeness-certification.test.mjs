import assert from 'node:assert/strict';
import BUILTIN from '../src/builtin1192.js';
import airMissionStats,{AIR_MISSION_SOURCE_1192} from '../src/builtin1192/air-mission-type-stats-1192.js';
import airDuplicates,{AIR_DUPLICATE_SOURCE_1192} from '../src/builtin1192/duplicate-archetypes-air-1192.js';
assert.equal(AIR_MISSION_SOURCE_1192.sha256,'b077c40bd386b53ea3b6af97acee44247c07056c9476a143de48e7130c74b692');
assert.equal(AIR_MISSION_SOURCE_1192.moduleCount,94);assert.equal(AIR_MISSION_SOURCE_1192.missionModuleCount,33);assert.equal(AIR_MISSION_SOURCE_1192.missionBlockCount,43);
assert.equal(Object.keys(airMissionStats).length,33);assert.equal(Object.values(airMissionStats).reduce((n,x)=>n+x.length,0),43);
for(const [id,blocks] of Object.entries(airMissionStats)){const module=BUILTIN.modules[id];assert.ok(module,`missing Air module ${id}`);assert.deepEqual(module.missionTypeStats,blocks,`${id} mission block mismatch`);for(const block of blocks)assert.ok(Array.isArray(block.limit)&&block.limit.length>0,`${id} mission limit must preserve all source tokens`);}
assert.deepEqual(airMissionStats.bomb_locks[0].limit,['cas','attack_logistics']);assert.equal(airMissionStats.bomb_locks[0].add_stats.air_ground_attack,6);assert.deepEqual(airMissionStats.torpedo_mounting[0].limit,['naval_bomber','port_strike']);assert.equal(airMissionStats.medium_bomb_bay.length,3);
assert.equal(AIR_DUPLICATE_SOURCE_1192.sha256,'0747e1a834d4c44eeee593bc0d5cbd7f636be6f34be89be53b19f83afcd08f8a');assert.equal(AIR_DUPLICATE_SOURCE_1192.duplicateArchetypeCount,13);assert.equal(Object.keys(airDuplicates).length,13);
const expected=['small_plane_cas_airframe','cv_small_plane_cas_airframe','small_plane_naval_bomber_airframe','cv_small_plane_naval_bomber_airframe','small_plane_suicide_airframe','cv_small_plane_suicide_airframe','medium_plane_fighter_airframe','medium_plane_scout_plane_airframe','large_plane_maritime_patrol_plane_airframe','jet_fighter_equipment','rocket_interceptor_equipment','jet_tac_bomber_equipment','jet_strat_bomber_equipment'];
assert.deepEqual(Object.keys(airDuplicates),expected);for(const id of expected)assert.deepEqual(BUILTIN.duplicateArchetypes[id],airDuplicates[id],`${id} duplicate archetype mismatch`);
assert.deepEqual(airDuplicates.medium_plane_fighter_airframe.types,['heavy_fighter']);assert.equal(airDuplicates.medium_plane_fighter_airframe.raw.for_each.air_superiority.set,1.25);assert.equal(airDuplicates.rocket_interceptor_equipment.onlyDuplicateArchetype,true);assert.equal(airDuplicates.cv_small_plane_naval_bomber_airframe.raw.default_carrier_composition_weight,1);
assert.equal(BUILTIN.meta.airMissionStatBlocksCertified,true);assert.equal(BUILTIN.meta.airDuplicateArchetypesCertified,true);assert.equal(BUILTIN.meta.duplicateArchetypeCount,34);
console.log('1.19.2 Air source completeness invariants passed.');

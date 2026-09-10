import assert from 'node:assert/strict';
import { parseClausewitz, extractEquipmentModules } from '../src/parser.js';
const parsed=parseClausewitz(`equipment_modules={ bomb={ category=cas_weapon mission_type_stats={ limit=close_air_support add_stats={ air_ground_attack=6 } } mission_type_stats={ limit=naval_bomber add_stats={ naval_strike_attack=2 } } } }`);
const m=extractEquipmentModules(parsed).bomb;assert.equal(m.missionTypeStats.length,2);assert.equal(m.missionTypeStats[0].limit,'close_air_support');assert.equal(m.missionTypeStats[0].add_stats.air_ground_attack,6);assert.equal(m.missionTypeStats[1].limit,'naval_bomber');assert.equal(m.missionTypeStats[1].add_stats.naval_strike_attack,2);console.log('Air repeated mission-stat parser invariants passed.');

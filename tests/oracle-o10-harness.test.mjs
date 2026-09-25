import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const defines=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o10_defines.lua',import.meta.url),'utf8');
const mods=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o10_dynamic_modifiers.txt',import.meta.url),'utf8');
const effects=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o10_zero_defense_control.txt',import.meta.url),'utf8');

assert.match(defines,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*100/);
assert.match(defines,/CHANCE_TO_AVOID_HIT_AT_NO_DEF\s*=\s*0/);
assert.match(defines,/LAND_COMBAT_ORG_DICE_SIZE\s*=\s*1/);
assert.match(defines,/LAND_COMBAT_STR_DAMAGE_MODIFIER\s*=\s*0/);
assert.match(mods,/army_infantry_attack_factor\s*=\s*-0\.721/);
assert.match(mods,/army_infantry_defence_factor\s*=\s*-1\.0328836429/);
const queued=[...effects.matchAll(/country_event = \{ id = oracle_o10\.1 hours = (\d+) \}/g)].map(m=>Number(m[1]));
assert.equal(queued.length,61);
assert.deepEqual(queued,Array.from({length:61},(_,i)=>i+1));

console.log('Oracle O10 harness regression passed.');

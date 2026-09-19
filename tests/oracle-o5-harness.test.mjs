import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const defines=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o5_defines.lua',import.meta.url),'utf8');
const modifier=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o5_dynamic_modifiers.txt',import.meta.url),'utf8');
const effects=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o5_trial.txt',import.meta.url),'utf8');

assert.match(defines,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*0/);
assert.match(defines,/LAND_COMBAT_ORG_DICE_SIZE\s*=\s*1/);
assert.match(defines,/LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE\s*=\s*1/);
assert.match(defines,/LAND_COMBAT_STR_DAMAGE_MODIFIER\s*=\s*0/);
assert.match(defines,/BASE_NIGHT_ATTACK_PENALTY\s*=\s*0/);
assert.match(modifier,/army_infantry_attack_factor\s*=\s*-0\.79/);
assert.match(effects,/d_oracle_o5_trial11\s*=\s*\{/);
const queued=[...effects.matchAll(/country_event = \{ id = oracle_o5\.1 hours = (\d+) \}/g)].map(m=>Number(m[1]));
assert.deepEqual(queued,[1,2,3,4,5,6,7,8,9,10,11]);
console.log('Oracle O5 harness regression passed.');

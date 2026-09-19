import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const defines=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o7_defines.lua',import.meta.url),'utf8');
const mods=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o7_dynamic_modifiers.txt',import.meta.url),'utf8');
const effects=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o7_wide_rounding_trial.txt',import.meta.url),'utf8');

assert.match(defines,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*0/);
assert.match(defines,/LAND_COMBAT_ORG_DICE_SIZE\s*=\s*1/);
assert.match(defines,/LAND_COMBAT_STR_DAMAGE_MODIFIER\s*=\s*0/);
assert.match(defines,/BASE_NIGHT_ATTACK_PENALTY\s*=\s*0/);
assert.match(mods,/army_infantry_attack_factor\s*=\s*-0\.721/);
assert.match(effects,/d_oracle_o7_trial61\s*=\s*\{/);
const queued=[...effects.matchAll(/country_event = \{ id = oracle_o7\.1 hours = (\d+) \}/g)].map(m=>Number(m[1]));
assert.equal(queued.length,61);
assert.deepEqual(queued,Array.from({length:61},(_,i)=>i+1));
console.log('Oracle O7 harness regression passed.');

import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const d=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o20_defines.lua',import.meta.url),'utf8');
const m=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o20_dynamic_modifiers.txt',import.meta.url),'utf8');
const e=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o20_normal_hit_transport_trial.txt',import.meta.url),'utf8');
assert.match(d,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*90/);assert.match(d,/CHANCE_TO_AVOID_HIT_AT_NO_DEF\s*=\s*60/);assert.match(d,/LAND_COMBAT_ORG_DICE_SIZE\s*=\s*1/);assert.match(d,/LAND_COMBAT_STR_DAMAGE_MODIFIER\s*=\s*0/);
assert.match(m,/army_infantry_defence_factor\s*=\s*-0\.9599742088/);assert.match(m,/army_infantry_attack_factor\s*=\s*-0\.99/);
const q=[...e.matchAll(/country_event = \{ id = oracle_o20\.1 hours = (\d+) \}/g)].map(x=>Number(x[1]));assert.equal(q.length,161);assert.deepEqual(q,Array.from({length:161},(_,i)=>i+1));console.log('Oracle O20 harness regression passed.');

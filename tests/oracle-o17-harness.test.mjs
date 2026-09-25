import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const d=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o17_defines.lua',import.meta.url),'utf8');
const m=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o17_dynamic_modifiers.txt',import.meta.url),'utf8');
const e=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o17_strength_unit_trial.txt',import.meta.url),'utf8');
assert.match(d,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*0/);assert.match(d,/CHANCE_TO_AVOID_HIT_AT_NO_DEF\s*=\s*100/);assert.match(d,/LAND_COMBAT_ORG_DAMAGE_MODIFIER\s*=\s*0/);assert.match(d,/LAND_COMBAT_STR_DAMAGE_MODIFIER\s*=\s*0\.060/);assert.match(d,/LAND_COMBAT_STR_DICE_SIZE\s*=\s*1/);assert.match(d,/LAND_COMBAT_STR_ARMOR_ON_SOFT_DICE_SIZE\s*=\s*1/);assert.match(m,/-0\.721/);assert.match(m,/-0\.9923784016/);
const q=[...e.matchAll(/country_event = \{ id = oracle_o17\.1 hours = (\d+) \}/g)].map(x=>Number(x[1]));assert.equal(q.length,21);assert.deepEqual(q,Array.from({length:21},(_,i)=>i+1));console.log('Oracle O17 harness regression passed.');

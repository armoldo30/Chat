import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const d=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o16_defines.lua',import.meta.url),'utf8');
const m=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o16_dynamic_modifiers.txt',import.meta.url),'utf8');
const e=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o16_org_die_trial.txt',import.meta.url),'utf8');
assert.match(d,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*0/);assert.match(d,/CHANCE_TO_AVOID_HIT_AT_NO_DEF\s*=\s*100/);assert.match(d,/LAND_COMBAT_ORG_DAMAGE_MODIFIER\s*=\s*0\.053/);assert.match(d,/LAND_COMBAT_ORG_DICE_SIZE\s*=\s*4/);assert.match(d,/LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE\s*=\s*6/);assert.match(d,/LAND_COMBAT_STR_DAMAGE_MODIFIER\s*=\s*0/);assert.match(m,/-0\.721/);assert.match(m,/-0\.9923784016/);
const q=[...e.matchAll(/country_event = \{ id = oracle_o16\.1 hours = (\d+) \}/g)].map(x=>Number(x[1]));assert.equal(q.length,81);assert.deepEqual(q,Array.from({length:81},(_,i)=>i+1));console.log('Oracle O16 harness regression passed.');

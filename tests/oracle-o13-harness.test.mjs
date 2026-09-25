import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const d=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o13_defines.lua',import.meta.url),'utf8');
const m=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o13_dynamic_modifiers.txt',import.meta.url),'utf8');
const e=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o13_defended_fractional_trial.txt',import.meta.url),'utf8');
assert.match(d,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*0/);assert.match(d,/CHANCE_TO_AVOID_HIT_AT_NO_DEF\s*=\s*100/);assert.match(m,/army_infantry_attack_factor\s*=\s*-0\.721/);assert.match(m,/army_infantry_defence_factor\s*=\s*-0\.9599742088/);
const q=[...e.matchAll(/country_event = \{ id = oracle_o13\.1 hours = (\d+) \}/g)].map(x=>Number(x[1]));assert.equal(q.length,81);assert.deepEqual(q,Array.from({length:81},(_,i)=>i+1));console.log('Oracle O13 harness regression passed.');

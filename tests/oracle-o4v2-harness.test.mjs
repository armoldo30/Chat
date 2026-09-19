import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const defines=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o4v2_defines.lua',import.meta.url),'utf8');
const mods=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o4v2_dynamic_modifiers.txt',import.meta.url),'utf8');
const effects=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o4v2_guaranteed_hit_trial.txt',import.meta.url),'utf8');

assert.match(defines,/NDefines\.NMilitary\.BASE_CHANCE_TO_AVOID_HIT\s*=\s*0/);
assert.doesNotMatch(defines,/CHANCE_TO_AVOID_HIT_AT_NO_DEF\s*=/);
assert.match(mods,/oracle_o4v2_control_attack\s*=\s*\{/);
assert.match(mods,/army_infantry_attack_factor\s*=\s*-0\.84/);
assert.match(mods,/oracle_o4v2_probe_attack\s*=\s*\{/);
assert.match(mods,/army_infantry_attack_factor\s*=\s*-0\.97/);
assert.match(effects,/d_oracle_o4v2_control_prepare\s*=\s*\{/);
assert.match(effects,/d_oracle_o4v2_probe_prepare\s*=\s*\{/);
assert.match(effects,/d_oracle_o4v2_control_trial6\s*=\s*\{/);
assert.match(effects,/d_oracle_o4v2_probe_trial6\s*=\s*\{/);
assert.match(effects,/defineOverride=BASE_CHANCE_TO_AVOID_HIT:0/);
console.log('Oracle O4 v2 harness regression passed.');

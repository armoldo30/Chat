import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const modifier=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o4_dynamic_modifiers.txt',import.meta.url),'utf8');
const effects=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o4_undefended_trial.txt',import.meta.url),'utf8');
const events=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/events/oracle_o4_events.txt',import.meta.url),'utf8');

assert.match(modifier,/oracle_o4_low_attack_attenuator\s*=\s*\{/);
assert.match(modifier,/army_infantry_attack_factor\s*=\s*-0\.97/);
assert.match(modifier,/oracle_o4_zero_defense_suppressor\s*=\s*\{/);
assert.match(modifier,/army_infantry_defence_factor\s*=\s*-1\.0/);

assert.match(effects,/d_oracle_o4_prepare\s*=\s*\{/);
assert.match(effects,/d_oracle_o4_trial6\s*=\s*\{/);
assert.match(effects,/d_oracle_o4_clear\s*=\s*\{/);
assert.match(effects,/scenario=o4-sub10-undefended-incidence-v1/);
assert.match(effects,/attackAttenuatorPresent=yes/);
assert.match(effects,/defenseSuppressorPresent=yes/);
assert.match(effects,/expectedPanel=GER-soft-2-POL-defense-0/);

const queued=[...effects.matchAll(/country_event = \{ id = oracle_o4\.1 hours = (\d+) \}/g)].map(m=>Number(m[1]));
assert.deepEqual(queued,[1,2,3,4,5,6]);

assert.match(events,/add_namespace = oracle_o4/);
assert.match(events,/id = oracle_o4\.1/);
assert.match(events,/modifiersRemoved=yes/);
assert.match(events,/cleanupFailure=no/);
assert.doesNotMatch(events,/country_event\s*=\s*\{\s*id\s*=\s*oracle_o4\.1\s+hours\s*=\s*\d+/s);

console.log('Oracle O4 harness regression passed.');

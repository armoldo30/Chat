import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const modifier=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o3_dynamic_modifiers.txt',import.meta.url),'utf8');
const effects=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o3_sub10_trial.txt',import.meta.url),'utf8');
const events=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/events/oracle_o3_events.txt',import.meta.url),'utf8');

assert.match(modifier,/oracle_o3_sub10_attack_attenuator\s*=\s*\{/);
assert.match(modifier,/army_infantry_attack_factor\s*=\s*-0\.89/);
for(const forbidden of [
  'army_infantry_defence_factor','breakthrough','army_org_factor','max_organisation',
  'max_strength','supply_consumption','planning','dig_in','damage'
]){
  assert.doesNotMatch(modifier,new RegExp(`^\\s*${forbidden}\\s*=`,'m'),`O3 attenuator must not set ${forbidden}`);
}

assert.match(effects,/d_oracle_o3_prepare\s*=\s*\{/);
assert.match(effects,/d_oracle_o3_trial6\s*=\s*\{/);
assert.match(effects,/d_oracle_o3_clear\s*=\s*\{/);
assert.match(effects,/scenario=o3-sub10-defended-incidence-v1/);
assert.match(effects,/tacticMode=neutral-basic-only/);
assert.match(effects,/attenuator=army_infantry_attack_factor:-0\.89/);
assert.match(effects,/expectedRegime=GER-soft-attack-display-7-or-8-sub10/);
assert.match(effects,/has_dynamic_modifier\s*=\s*\{[\s\S]*?modifier\s*=\s*oracle_o3_sub10_attack_attenuator[\s\S]*?\}/);
assert.match(effects,/remove_dynamic_modifier\s*=\s*\{[\s\S]*?modifier\s*=\s*oracle_o3_sub10_attack_attenuator[\s\S]*?\}/);

const queued=[...effects.matchAll(/country_event = \{ id = oracle_o3\.1 hours = (\d+) \}/g)].map(m=>Number(m[1]));
assert.deepEqual(queued,[1,2,3,4,5,6]);
assert.equal(new Set(queued).size,6);

assert.match(events,/add_namespace = oracle_o3/);
assert.match(events,/id = oracle_o3\.1/);
assert.match(events,/oracle_o3_capture_sample = yes/);
assert.match(events,/value = 6/);
assert.match(events,/reason=trial6-complete/);
assert.match(events,/attenuatorRemoved=yes/);
assert.match(events,/attenuatorRemoved=no/);
assert.match(events,/cleanupFailure=yes/);
assert.match(events,/cleanupFailure=no/);
assert.doesNotMatch(events,/country_event\s*=\s*\{\s*id\s*=\s*oracle_o3\.1\s+hours\s*=\s*\d+/s);

console.log('Oracle O3 sub-10 static regression passed.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const modifier=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o2_dynamic_modifiers.txt',import.meta.url),'utf8');
const effects=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o2_defended_trial.txt',import.meta.url),'utf8');
const events=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/events/oracle_o2_events.txt',import.meta.url),'utf8');
const tactics=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/combat_tactics.txt',import.meta.url),'utf8');

assert.match(modifier,/oracle_o2_defended_attack_amplifier\s*=\s*\{/);
assert.match(modifier,/army_infantry_attack_factor\s*=\s*2\.0/);
for(const forbidden of [
  'army_infantry_defence_factor','breakthrough','army_org_factor','max_organisation',
  'max_strength','supply_consumption','planning','dig_in','damage'
]){
  assert.doesNotMatch(modifier,new RegExp(`^\\s*${forbidden}\\s*=`,'m'),`O2 amplifier must not set ${forbidden}`);
}

assert.match(effects,/d_oracle_o2_prepare\s*=\s*\{/);
assert.match(effects,/add_dynamic_modifier\s*=\s*\{[\s\S]*?modifier\s*=\s*oracle_o2_defended_attack_amplifier[\s\S]*?\}/);
assert.match(effects,/force_update_dynamic_modifier\s*=\s*yes/);
assert.match(effects,/d_oracle_o2_clear\s*=\s*\{/);
assert.match(effects,/has_dynamic_modifier\s*=\s*\{[\s\S]*?modifier\s*=\s*oracle_o2_defended_attack_amplifier[\s\S]*?\}/);
assert.match(effects,/remove_dynamic_modifier\s*=\s*\{[\s\S]*?modifier\s*=\s*oracle_o2_defended_attack_amplifier[\s\S]*?\}/);
assert.match(effects,/d_oracle_o2_trial6\s*=\s*\{/);
assert.match(effects,/scenario=o2-defended-amplified-v1/);
assert.match(effects,/runMode=trial6/);
assert.match(effects,/tacticMode=neutral-basic-only/);
assert.match(effects,/amplifier=army_infantry_attack_factor:\+2\.0/);
assert.match(effects,/expectedRegime=GER-attack-below-POL-defense/);

const queued=[...effects.matchAll(/country_event = \{ id = oracle_o2\.1 hours = (\d+) \}/g)].map(m=>Number(m[1]));
assert.deepEqual(queued,[1,2,3,4,5,6]);
assert.equal(new Set(queued).size,6);

assert.match(events,/add_namespace = oracle_o2/);
assert.match(events,/id = oracle_o2\.1/);
assert.match(events,/oracle_o2_capture_sample = yes/);
assert.match(events,/value = 6/);
assert.match(events,/reason=trial6-complete/);
assert.match(events,/amplifierRemoved=yes/);
assert.match(events,/amplifierRemoved=no/);
assert.match(events,/cleanupFailure=yes/);
assert.match(events,/cleanupFailure=no/);
assert.match(events,/has_dynamic_modifier\s*=\s*\{[\s\S]*?modifier\s*=\s*oracle_o2_defended_attack_amplifier[\s\S]*?\}/);
assert.match(events,/remove_dynamic_modifier\s*=\s*\{[\s\S]*?modifier\s*=\s*oracle_o2_defended_attack_amplifier[\s\S]*?\}/);
assert.doesNotMatch(events,/country_event\s*=\s*\{\s*id\s*=\s*oracle_o2\.1\s+hours\s*=\s*\d+/s);

const basicAttack=tactics.slice(tactics.indexOf('tactic_basic_attack = {'),tactics.indexOf('tactic_basic_defend = {'));
assert.doesNotMatch(basicAttack,/\n\s*attacker\s*=/,'O2 must continue using neutral Basic Attack');
assert.doesNotMatch(basicAttack,/countered_by\s*=/,'O2 must continue using neutral Basic Attack');

console.log('Oracle O2 amplified fully-defended probe static regression passed.');

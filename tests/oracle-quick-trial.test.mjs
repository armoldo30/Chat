import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const effects=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o1_quick_trial.txt',import.meta.url),'utf8');
const events=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/events/oracle_o1_quick_trial_events.txt',import.meta.url),'utf8');

assert.match(effects,/d_oracle_o1_trial6\s*=\s*\{/);
assert.match(effects,/gameVersion=1\.19\.3\.0\.c01a checksum=5632/);
for(let hour=1;hour<=6;hour++){
  assert.match(effects,new RegExp(`country_event = \\{ id = oracle_o1\\.2 hours = ${hour} \\}`));
}
const queued=[...effects.matchAll(/country_event = \{ id = oracle_o1\.2 hours = (\d+) \}/g)].map(m=>Number(m[1]));
assert.deepEqual(queued,[1,2,3,4,5,6]);
assert.match(effects,/runMode=trial6/);
assert.match(effects,/preBurn=\[\?oracle_o1_preburn_count\]/);
for(const count of [64,128,256]){
  assert.match(effects,new RegExp(`d_oracle_o1_preburn${count}\\s*=\\s*\\{`));
  assert.match(effects,new RegExp(`set_variable = \\{ oracle_o1_preburn_count = ${count} \\}`));
  assert.match(effects,new RegExp(`end = ${count}`));
}
assert.match(events,/oracle_o1_capture_sample = yes/);
assert.match(events,/value = 6/);
assert.match(events,/reason=trial6-complete/);
assert.doesNotMatch(events,/country_event\s*=\s*\{\s*id\s*=\s*oracle_o1\.2\s+hours\s*=\s*\d+\s*\}/s);

console.log('Oracle O1 six-hour quick-trial regression passed.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const effects=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o1_effects.txt',import.meta.url),'utf8');
const events=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/events/oracle_o1_events.txt',import.meta.url),'utf8');

for(let hour=1;hour<=96;hour++){
  assert.match(effects,new RegExp(`country_event = \\{ id = oracle_o1\\.1 hours = ${hour} \\}`));
}
const queued=[...effects.matchAll(/country_event = \{ id = oracle_o1\.1 hours = (\d+) \}/g)].map(m=>Number(m[1]));
assert.equal(queued.length,96);
assert.deepEqual(queued,Array.from({length:96},(_,i)=>i+1));
assert.doesNotMatch(events,/country_event\s*=\s*\{\s*id\s*=\s*oracle_o1\.1\s+hours\s*=\s*1\s*\}/s);
assert.match(events,/oracle_o1_capture_sample = yes/);
assert.match(events,/reason=horizon/);

console.log('Oracle O1 mod scheduler regression passed.');

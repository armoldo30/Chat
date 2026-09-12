import assert from 'node:assert/strict';
import fs from 'node:fs';

const root='oracle-lab/hoi4-mod';
const external=fs.readFileSync(`${root}/hoi4_war_planner_oracle.mod`,'utf8');
const descriptor=fs.readFileSync(`${root}/hoi4_war_planner_oracle/descriptor.mod`,'utf8');
const effects=fs.readFileSync(`${root}/hoi4_war_planner_oracle/common/scripted_effects/oracle_o1_effects.txt`,'utf8');
const events=fs.readFileSync(`${root}/hoi4_war_planner_oracle/events/oracle_o1_events.txt`,'utf8');

assert.match(external,/name="HOI4 War Planner Oracle 1\.19\.2"/);
assert.match(external,/path="mod\/hoi4_war_planner_oracle"/);
assert.match(external,/supported_version="1\.19\.2\.\*"/);
assert.match(descriptor,/supported_version="1\.19\.2\.\*"/);
assert.doesNotMatch(descriptor,/\bpath\s*=/,'internal descriptor must not pin the user mod path');

assert.match(effects,/d_oracle_o1_probe\s*=/);
assert.match(effects,/d_oracle_o1_arm\s*=/);
assert.match(effects,/d_oracle_o1_stop\s*=/);
assert.match(effects,/unit_organization\s*>\s*var:oracle_mid/);
assert.match(effects,/unit_strength\s*>\s*var:oracle_mid/);
assert.equal((effects.match(/end\s*=\s*14/g)||[]).length,2,'organization and strength must each use fourteen bisections');
assert.match(effects,/\[WPO1\] BEGIN schema=1/);
assert.match(effects,/scenario=o1-land-baseline-v1/);
assert.match(effects,/gameVersion=1\.19\.2\.0\.a729/);
assert.match(effects,/checksum=d245/);

// O1 instrumentation must remain observational until the executable probe is accepted.
for(const destructive of ['destroy_unit','delete_unit','create_unit','declare_war_on','teleport_armies','set_unit_organization','set_equipment_fraction']){
  assert.equal(effects.includes(destructive),false,`capture-first O1 sampler must not use ${destructive}`);
  assert.equal(events.includes(destructive),false,`capture-first O1 event loop must not use ${destructive}`);
}

assert.match(events,/add_namespace\s*=\s*oracle_o1/);
assert.match(events,/id\s*=\s*oracle_o1\.1/);
assert.match(events,/hidden\s*=\s*yes/);
assert.match(events,/hours\s*=\s*1/);
assert.match(events,/value\s*=\s*96/);
assert.match(events,/reason=horizon/);

console.log('HOI4 Oracle O1 mod package static certification passed.');

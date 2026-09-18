import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const tactics=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/combat_tactics.txt',import.meta.url),'utf8');
const quick=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o1_quick_trial.txt',import.meta.url),'utf8');

const ids=[...tactics.matchAll(/^\s*(tactic_[A-Za-z0-9_]+)\s*=\s*\{/gm)].map(m=>m[1]);
assert.equal(ids.length,55,'controlled tactic file must retain all 55 tactic IDs');
assert.equal(new Set(ids).size,55,'controlled tactic IDs must remain unique');

function block(id){
  const start=tactics.indexOf(id+' = {');
  assert.ok(start>=0,`missing ${id}`);
  let i=tactics.indexOf('{',start),depth=0;
  for(;i<tactics.length;i++){
    if(tactics[i]==='{')depth++;
    else if(tactics[i]==='}'){depth--;if(depth===0)return tactics.slice(start,i+1);}
  }
  throw new Error(`unterminated ${id}`);
}

const attack=block('tactic_basic_attack');
const defend=block('tactic_basic_defend');
assert.match(attack,/active = yes/);
assert.match(defend,/active = yes/);
assert.match(attack,/base = \{ factor = 100 \}/);
assert.match(defend,/base = \{ factor = 100 \}/);
assert.doesNotMatch(attack,/\n\s*attacker\s*=/);
assert.doesNotMatch(attack,/\n\s*defender\s*=/);
assert.doesNotMatch(attack,/countered_by\s*=/);
assert.doesNotMatch(defend,/\n\s*attacker\s*=/);
assert.doesNotMatch(defend,/\n\s*defender\s*=/);

for(const id of ids.filter(id=>!['tactic_basic_attack','tactic_basic_defend'].includes(id))){
  const b=block(id);
  assert.match(b,/trigger = \{ always = no \}/,`${id} must be ineligible`);
  assert.match(b,/active = no/,`${id} must be inactive`);
  assert.match(b,/base = \{ factor = 0 \}/,`${id} must have zero weight`);
}

assert.match(quick,/scenario=o1-base-neutral-tactics-v1/);
assert.match(quick,/tacticMode=neutral-basic-only/);

console.log('Oracle O1 neutral-tactic override regression passed.');

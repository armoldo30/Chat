import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const t=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/technologies/oracle_o23_armored_org_die.txt',import.meta.url),'utf8');
const d=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o23_defines.lua',import.meta.url),'utf8');
const m=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o23_dynamic_modifiers.txt',import.meta.url),'utf8');
const e=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o23_armored_org_die_trial.txt',import.meta.url),'utf8');

assert.match(t,/oracle_o23_p20[\s\S]*?ap_attack\s*=\s*4/);
assert.match(d,/LAND_COMBAT_ORG_DICE_SIZE\s*=\s*4/);
assert.match(d,/LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE\s*=\s*6/);
assert.match(d,/LAND_COMBAT_STR_DAMAGE_MODIFIER\s*=\s*0/);
assert.match(d,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*0/);
assert.match(d,/CHANCE_TO_AVOID_HIT_AT_NO_DEF\s*=\s*100/);
assert.match(m,/army_infantry_attack_factor\s*=\s*-0\.721/);
assert.match(m,/army_infantry_defence_factor\s*=\s*-0\.9923784016/);
assert.match(e,/defenderPiercing=4/);
assert.match(e,/attackerArmor=20/);
const q=[...e.matchAll(/country_event = \{ id = oracle_o23\.1 hours = (\d+) \}/g)].map(x=>Number(x[1]));
assert.equal(q.length,121);
assert.deepEqual(q,Array.from({length:121},(_,i)=>i+1));
console.log('Oracle O23 harness regression passed.');

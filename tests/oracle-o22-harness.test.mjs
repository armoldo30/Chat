import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const t=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/technologies/oracle_o22_piercing_tiers.txt',import.meta.url),'utf8');
const d=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o22_defines.lua',import.meta.url),'utf8');
const m=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o22_dynamic_modifiers.txt',import.meta.url),'utf8');
const e=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o22_piercing_tier_trial.txt',import.meta.url),'utf8');

for(const [id,factor] of [['p20','4'],['p15','2.75'],['p14','2.5'],['p10','1.5'],['p9','1.25']]){
  assert.match(t,new RegExp(`oracle_o22_${id}[\\s\\S]*?ap_attack\\s*=\\s*${factor.replace('.','\\.')}`));
  assert.match(e,new RegExp(`d_oracle_o22_prepare_${id}\\s*=\\s*\\{`));
}
assert.match(d,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*0/);
assert.match(d,/CHANCE_TO_AVOID_HIT_AT_NO_DEF\s*=\s*100/);
assert.match(d,/LAND_COMBAT_ORG_DAMAGE_MODIFIER\s*=\s*0\.053/);
assert.match(d,/LAND_COMBAT_ORG_DICE_SIZE\s*=\s*1/);
assert.match(d,/LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE\s*=\s*1/);
assert.match(d,/LAND_COMBAT_STR_DAMAGE_MODIFIER\s*=\s*0/);
assert.doesNotMatch(d,/PIERCING_THRESHOLDS|PIERCING_THRESHOLD_DAMAGE_VALUES/);
assert.match(m,/army_infantry_attack_factor\s*=\s*-0\.721/);
assert.match(m,/army_infantry_defence_factor\s*=\s*-0\.9923784016/);
const q=[...e.matchAll(/country_event = \{ id = oracle_o22\.1 hours = (\d+) \}/g)].map(x=>Number(x[1]));
assert.deepEqual(q,Array.from({length:21},(_,i)=>i+1));
console.log('Oracle O22 harness regression passed.');

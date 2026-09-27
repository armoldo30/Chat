import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const t=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/technologies/oracle_o25_combined_armored_hires.txt',import.meta.url),'utf8');
const d=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/defines/zz_oracle_o25_defines.lua',import.meta.url),'utf8');
const m=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/dynamic_modifiers/oracle_o25_dynamic_modifiers.txt',import.meta.url),'utf8');
const e=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o25_combined_armored_hires_trial.txt',import.meta.url),'utf8');

assert.match(t,/oracle_o25_p9[\s\S]*?ap_attack\s*=\s*1\.25/);
assert.match(d,/BASE_CHANCE_TO_AVOID_HIT\s*=\s*90/);
assert.match(d,/CHANCE_TO_AVOID_HIT_AT_NO_DEF\s*=\s*100/);
assert.match(d,/LAND_COMBAT_ORG_DICE_SIZE\s*=\s*4/);
assert.match(d,/LAND_COMBAT_ORG_ARMOR_ON_SOFT_DICE_SIZE\s*=\s*6/);
assert.match(d,/LAND_COMBAT_STR_DAMAGE_MODIFIER\s*=\s*0\.060/);
assert.match(d,/LAND_COMBAT_STR_DICE_SIZE\s*=\s*2/);
assert.doesNotMatch(d,/PIERCING_THRESHOLDS|PIERCING_THRESHOLD_DAMAGE_VALUES/);
assert.match(m,/army_infantry_attack_factor\s*=\s*-0\.721/);
assert.match(m,/army_infantry_defence_factor\s*=\s*-0\.9923784016/);
assert.match(e,/attackerPiercing=9/);
assert.match(e,/defenderPiercing=4/);
assert.match(e,/expectedPiercingDamageFactor=0\.50/);
assert.match(e,/oracle_o25_measure_division\s*=\s*\{/);
assert.match(e,/end\s*=\s*18/g);
assert.match(e,/method=bisection18/);
const q=[...e.matchAll(/country_event = \{ id = oracle_o25\.1 hours = (\d+) \}/g)].map(x=>Number(x[1]));
assert.equal(q.length,161);
assert.deepEqual(q,Array.from({length:161},(_,i)=>i+1));
console.log('Oracle O25 harness regression passed.');

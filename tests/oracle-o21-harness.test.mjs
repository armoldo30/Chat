import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const t=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/technologies/oracle_o21_armor_piercing.txt',import.meta.url),'utf8');
const e=readFileSync(new URL('../oracle-lab/hoi4-mod/hoi4_war_planner_oracle/common/scripted_effects/oracle_o21_armor_piercing_calibration.txt',import.meta.url),'utf8');

assert.match(t,/oracle_o21_armor20[\s\S]*?category_all_infantry[\s\S]*?armor_value\s*=\s*20/);
assert.match(t,/oracle_o21_piercing20[\s\S]*?category_all_infantry[\s\S]*?ap_attack\s*=\s*16/);
assert.match(t,/ai_will_do\s*=\s*\{\s*factor\s*=\s*0\s*\}/);
assert.match(e,/d_oracle_o21_prepare\s*=\s*\{/);
assert.match(e,/oracle_o21_piercing20\s*=\s*1/);
assert.match(e,/oracle_o21_armor20\s*=\s*1/);
assert.match(e,/expectedGERPiercing=20\.0/);
assert.match(e,/expectedPOLArmor=20\.0/);
assert.doesNotMatch(e,/declare_war_on|create_unit|division_template/);

console.log('Oracle O21 calibration harness regression passed.');

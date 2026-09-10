import assert from 'node:assert/strict';
import builtin1192 from '../src/builtin1192.js';
import { technologyRequirementReport, technologySelectionRequirementReport } from '../src/technologyRequirements.js';

const flexibleMissing=technologyRequirementReport(builtin1192,'flexible_line',[]);
assert.equal(flexibleMissing.known,true);
assert.equal(flexibleMissing.selectable,true,'unmet technology prerequisites must never become a theorycraft lock');
assert.equal(flexibleMissing.classification,'informational-only');
assert.ok(flexibleMissing.requiredTechnologies.includes('assembly_line_production'));
assert.ok(flexibleMissing.missingTechnologies.includes('assembly_line_production'));
assert.ok(flexibleMissing.xor.includes('streamlined_line'));

const flexibleSatisfied=technologyRequirementReport(builtin1192,'flexible_line',['assembly_line_production','streamlined_line']);
assert.ok(!flexibleSatisfied.missingTechnologies.includes('assembly_line_production'));
assert.deepEqual(flexibleSatisfied.xorConflicts,['streamlined_line'],'XOR relationships are reported without disabling either theorycrafted selection');
assert.equal(flexibleSatisfied.selectable,true);

const signal=technologyRequirementReport(builtin1192,'tech_signal_company',['tech_support']);
assert.ok(signal.requiredTechnologies.includes('radio'));
assert.ok(signal.requiredTechnologies.includes('motorised_infantry'));
assert.ok(!signal.missingTechnologies.includes('tech_support'));
assert.ok(signal.missingTechnologies.includes('radio'));
assert.ok(signal.missingTechnologies.includes('motorised_infantry'));

const aiClean=technologyRequirementReport(builtin1192,'aa_cannon_1',[]);
assert.ok(!aiClean.requiredTechnologies.includes('iw_small_airframe'),'AI-only has_tech conditions must not appear as requirements');

const special=technologyRequirementReport(builtin1192,'advanced_modern_tank_turret_tech',[]);
assert.equal(special.allow.always,false,'source gate is retained for display');
assert.equal(special.selectable,true,'source allow gate is informational only');

const unknown=technologyRequirementReport(builtin1192,'definitely_not_a_real_tech',[]);
assert.equal(unknown.known,false);
assert.equal(unknown.selectable,true,'unknown requirement metadata must not become a content lock');

const selection=technologySelectionRequirementReport(builtin1192,['flexible_line','streamlined_line','flexible_line']);
assert.deepEqual(selection.selected,['flexible_line','streamlined_line']);
assert.equal(selection.selectable,true);
assert.equal(selection.classification,'informational-only');
assert.equal(selection.reports.length,2);

console.log('Informational technology requirement runtime certification passed.');

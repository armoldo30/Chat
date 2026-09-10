import assert from 'node:assert/strict';
import { parseClausewitz } from '../src/parser.js';
import { extractTechnologies, buildExtendedDataPack } from '../src/gameDataParser.js';
import source1192 from '../src/builtin1192/technology-source-manifest-1192.js';
import builtin1192 from '../src/builtin1192.js';

const fixture=`
technologies = {
  @year = 1936
  root_tech = {
    start_year = 1936
    research_cost = 2
    categories = { infantry equipment }
    path = { leads_to_tech = child_tech research_cost_coeff = 1 }
    path = { leads_to_tech = side_tech research_cost_coeff = 0.5 }
    dependencies = { radio = 1 motorised_infantry = 1 }
    XOR = { branch_a branch_b }
    xor = { branch_c }
    enable_equipments = { infantry_equipment_1 infantry_equipment_2 }
    enable_equipment_modules = { module_a module_b }
    enable_subunits = { infantry engineer }
    sub_technologies = { sub_a sub_b }
    special_project_specialization = land
    is_special_project_tech = yes
    allow = { has_dlc = "No Step Back" has_tech = prerequisite_tech }
    ai_will_do = { modifier = { factor = 5 has_tech = ai_weight_only_tech } }
  }
  fleet_submarines = { }
}
`;

const tech=extractTechnologies(parseClausewitz(fixture),'common/technologies/fixture.txt');
assert.deepEqual(Object.keys(tech).sort(),['fleet_submarines','root_tech'],'script variables must not be counted as technologies while empty technology blocks remain valid');
assert.equal(tech.root_tech.sourceFile,'common/technologies/fixture.txt');
assert.equal(tech.root_tech.startYear,1936);
assert.equal(tech.root_tech.researchCost,2);
assert.deepEqual(tech.root_tech.categories,['infantry','equipment']);
assert.deepEqual(tech.root_tech.paths,[{leadsToTech:'child_tech',researchCostCoeff:1},{leadsToTech:'side_tech',researchCostCoeff:0.5}]);
assert.deepEqual(tech.root_tech.dependencies,{radio:1,motorised_infantry:1});
assert.deepEqual(tech.root_tech.xor,['branch_a','branch_b','branch_c']);
assert.deepEqual(tech.root_tech.enableEquipment,['infantry_equipment_1','infantry_equipment_2']);
assert.deepEqual(tech.root_tech.enableModules,['module_a','module_b']);
assert.deepEqual(tech.root_tech.enableSubUnits,['infantry','engineer']);
assert.deepEqual(tech.root_tech.subTechnologies,['sub_a','sub_b']);
assert.deepEqual(tech.root_tech.specialProjectSpecializations,['land']);
assert.equal(tech.root_tech.isSpecialProjectTech,true);
assert.ok(tech.root_tech.prerequisites.includes('No Step Back'));
assert.ok(tech.root_tech.prerequisites.includes('prerequisite_tech'));
assert.ok(tech.root_tech.prerequisites.includes('radio'));
assert.ok(!tech.root_tech.prerequisites.includes('ai_weight_only_tech'),'AI research weighting must never be presented as a player prerequisite');
assert.equal(tech.root_tech.requirements.allow.has_dlc,'No Step Back');
assert.equal(tech.root_tech.raw.allow.has_dlc,'No Step Back','allow requirements must be preserved as source metadata rather than selection locks');
assert.deepEqual(tech.fleet_submarines.raw,{});

const fakeFile={name:'fixture.txt',webkitRelativePath:'common/technologies/fixture.txt',text:async()=>fixture};
const pack=await buildExtendedDataPack([fakeFile]);
assert.equal(pack.meta.technologyFiles,1);
assert.equal(pack.meta.technologyCount,2);
assert.equal(pack.technologies.root_tech.sourceFile,'common/technologies/fixture.txt');

assert.equal(source1192.version,'1.19.2');
assert.equal(source1192.fileCount,13);
assert.equal(source1192.recordCount,552);
const entries=Object.entries(source1192.files);
assert.equal(entries.length,13);
const ids=entries.flatMap(([,file])=>file.ids);
assert.equal(ids.length,552);
assert.equal(new Set(ids).size,552,'technology IDs must be unique across the supplied 1.19.2 corpus');
assert.ok(ids.every(id=>!id.startsWith('@')),'script variables must be excluded from the technology census');
for(const [name,file] of entries){
  assert.equal(file.ids.length,file.count,`${name} count must match its certified ID inventory`);
  assert.match(file.sha256,/^[0-9a-f]{64}$/,`${name} must retain its authoritative source SHA-256`);
}
assert.equal(source1192.files['infantry.txt'].count,89);
assert.equal(source1192.files['naval.txt'].count,33,'the valid empty fleet_submarines technology must be included');
for(const id of ['infantry_weapons','basic_machine_tools','electronic_mechanical_engineering','basic_light_tank_chassis','iw_small_airframe','sp_helicopter_med_evac_tech','thermonuclear_bombs'])assert.ok(ids.includes(id),`certified technology inventory must include ${id}`);

const builtinIds=Object.keys(builtin1192.technologies).sort();
assert.deepEqual(builtinIds,[...ids].sort(),'bundled runtime technology IDs must exactly match the certified 1.19.2 source inventory');
assert.equal(builtin1192.meta.technologyCount,552);
assert.equal(builtin1192.meta.technologySourceFileCount,13);
assert.equal(builtin1192.meta.technologySourceRecordCount,552);
assert.ok(builtin1192.meta.technologyScriptVariableRecordsRemoved>0,'legacy fake @variable records must be removed from the bundled runtime corpus');
assert.equal(builtin1192.meta.technologySourceInventoryCertified,true);
assert.equal(builtin1192.meta.technologyGraphNormalized,true);
assert.deepEqual(builtin1192.technologies.basic_machine_tools.paths,[{leadsToTech:'improved_machine_tools',researchCostCoeff:1},{leadsToTech:'concentrated_industry',researchCostCoeff:1},{leadsToTech:'dispersed_industry',researchCostCoeff:1}]);
assert.deepEqual(builtin1192.technologies.flexible_line.pathPrerequisites,['assembly_line_production']);
assert.deepEqual(builtin1192.technologies.flexible_line.xor,['streamlined_line']);
assert.deepEqual(builtin1192.technologies.tech_signal_company.dependencies,{radio:1,motorised_infantry:1});
assert.deepEqual(builtin1192.technologies.tech_signal_company.pathPrerequisites,['tech_support']);
assert.ok(builtin1192.technologies.tech_signal_company.enableSubUnits.includes('signal_company'));
assert.ok(builtin1192.technologies.tech_signal_company.enableSubUnits.includes('hq_signal'));
assert.deepEqual(builtin1192.technologies.aa_cannon_1.pathPrerequisites,['aa_lmg']);
assert.ok(!builtin1192.technologies.aa_cannon_1.prerequisites.includes('iw_small_airframe'),'AI-only has_tech conditions must not contaminate bundled prerequisites');
assert.deepEqual(builtin1192.technologies.infantry_weapons.enableEquipment,['infantry_equipment_0']);
assert.ok(builtin1192.technologies.infantry_weapons.enableModules.includes('tank_heavy_machine_gun'));
assert.equal(builtin1192.technologies.advanced_modern_tank_turret_tech.requirements.allow.always,false,'source availability gates remain metadata only for theorycraft-first behavior');

console.log('Technology parser/source/runtime certification tests passed (13 files / 552 technologies).');

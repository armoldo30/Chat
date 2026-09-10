import assert from 'node:assert/strict';
import { parseClausewitz } from '../src/parser.js';
import { extractTechnologies, buildExtendedDataPack } from '../src/gameDataParser.js';
import source1192 from '../src/builtin1192/technology-source-manifest-1192.js';

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

console.log('Technology parser/source-inventory certification tests passed (13 files / 552 technologies).');

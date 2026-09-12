import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { organizationChoices, toggleTheorycraft, traitModel, dependencyText } from '../src/mio-workflow-ui.js';

// Country filtering is a visual/default-navigation choice only: alternatives remain available
// behind an explicit theorycraft toggle, preserving the project's theorycraft-first policy.
globalThis.document={getElementById:id=>id==='tech-countryTag'?{value:'GER'}:null};
const select={
  value:'ger_org',dataset:{mioOrg:'medium_tank'},
  options:[
    {value:'',textContent:'No MIO assigned'},
    {value:'ger_org',textContent:'German Works'},
    {value:'usa_org',textContent:'US Arsenal'},
    {value:'generic_org',textContent:'Generic Industry'}
  ]
};
const catalog={
  ger_org:{id:'ger_org',countries:['GER'],traits:{}},
  usa_org:{id:'usa_org',countries:['USA'],traits:{}},
  generic_org:{id:'generic_org',countries:[],traits:{}}
};
let choices=organizationChoices(select,catalog);
assert.deepEqual(choices.visible.map(x=>x.id),['ger_org','generic_org'],'default MIO navigation should show the selected country plus generic organizations');
assert.equal(choices.others.length,1,'foreign but structurally compatible MIOs must be retained as theorycraft alternatives');
toggleTheorycraft(select);
choices=organizationChoices(select,catalog);
assert.deepEqual(choices.visible.map(x=>x.id),['ger_org','usa_org','generic_org'],'theorycraft toggle should reveal all compatible organizations');
toggleTheorycraft(select);

const org={traits:{
  root:{id:'root',name:'Root',equipmentBonus:{reliability:.05}},
  left:{id:'left',name:'Left',parents:['root'],equipmentBonus:{maximum_speed:.05},mutuallyExclusive:['right']},
  right:{id:'right',name:'Right',parents:['root'],equipmentBonus:{armor_value:.05},mutuallyExclusive:['left']},
  finish:{id:'finish',name:'Finish',allParents:['root','left'],productionBonus:{production_cost_factor:-.03}}
}};
const inputs=[
  {value:'root',checked:false},{value:'left',checked:false},{value:'right',checked:false},{value:'finish',checked:false}
];
let model=traitModel(org,inputs);
assert.deepEqual(model.available.map(x=>x.id),['root'],'only root traits should be offered before prerequisites are selected');
assert.ok(model.locked.find(x=>x.id==='finish')?.reason.includes('Requires'),'locked traits should explain their missing prerequisite');
inputs[0].checked=true;model=traitModel(org,inputs);
assert.deepEqual(model.available.map(x=>x.id),['left','right'],'selecting the root should expose only valid next branches');
inputs[1].checked=true;model=traitModel(org,inputs);
assert.ok(model.locked.find(x=>x.id==='right')?.reason.includes('Exclusive'),'mutually exclusive branch should close after the competing trait is selected');
assert.ok(model.available.some(x=>x.id==='finish'),'all-parent child should become available after its parents are active');
inputs[3].checked=true;model=traitModel(org,inputs);
assert.equal(model.active.find(x=>x.id==='left')?.canRemove,false,'an active parent with an active dependent should not be removable');
assert.ok(model.active.find(x=>x.id==='left')?.reason.includes('Finish'),'blocked removal should name the selected dependent');
assert.equal(model.active.find(x=>x.id==='finish')?.canRemove,true,'a selected leaf trait should remain removable');
assert.match(dependencyText(org.traits.finish,['root']),/Requires: Left/);

const [html,board,inline,tree,css]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-board.js',import.meta.url),'utf8'),
  readFile(new URL('../src/inline-mio-guided.js',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-tree-visual.js',import.meta.url),'utf8'),
  readFile(new URL('../src/mio-workflow.css',import.meta.url),'utf8')
]);
assert.match(html,/mio-workflow\.css/);
assert.match(html,/inline-mio-guided\.js/);
assert.doesNotMatch(html,/src\/inline-mio-board\.js/,'legacy inline MIO board should not compete with the guided workflow');
for(const source of [board,inline]){
  assert.match(source,/AVAILABLE NOW/,'guided MIO UI should make the next valid traits explicit');
  assert.match(source,/theorycraft/i,'foreign MIO alternatives should be explicitly opt-in');
  assert.match(source,/dispatchEvent\(new Event\('change'/,'guided board must drive authoritative planner controls');
  assert.doesNotMatch(source,/simulateBattle|calcDivision|engine\.js/,'MIO visuals must remain UI-only');
}
assert.match(board,/mio-assignment-compact-source/,'tech MIO assignments should collapse into compact visual launch cards');
assert.match(tree,/dataset\.mioOrgId/,'tree renderer should accept explicit guided organization identity');
assert.match(tree,/dataset\.workflowTrait/,'tree renderer should recognize full guided-board trait nodes');
assert.match(tree,/dataset\.inlineTrait/,'tree renderer should recognize inline guided-board trait nodes');
assert.match(css,/mio-next-grid/);
assert.match(css,/mio-assignment-compact-source/);
assert.match(css,/inline-mio-guided-launch/);
assert.match(css,/@media\(max-width:430px\)/,'guided MIO visuals need phone-specific collapse rules');

console.log('Guided MIO workflow regression checks passed.');

import assert from 'node:assert/strict';
import {encodeScenarioShare,decodeScenarioShare} from '../src/scenario-share.js';

const store=new Map();
const makeEl=id=>({id,innerHTML:'',value:'',checked:false,dataset:{},style:{},files:[],disabled:false,title:'',onclick:null,onchange:null,classList:{add(){},remove(){},toggle(){}},insertAdjacentHTML(){},remove(){},click(){}});
const elements=new Map();
const get=id=>{if(!elements.has(id))elements.set(id,makeEl(id));return elements.get(id);};
const loadButton=makeEl('load-seeded');loadButton.dataset.savedLoad='seeded';
const copyButton=makeEl('copy-seeded');copyButton.dataset.savedCopy='seeded';
const updateButton=makeEl('update-seeded');updateButton.dataset.savedUpdate='seeded';
const deleteButton=makeEl('delete-seeded');deleteButton.dataset.savedDelete='seeded';
const selectorRows={
  '[data-saved-load]':[loadButton],
  '[data-saved-copy]':[copyButton],
  '[data-saved-update]':[updateButton],
  '[data-saved-delete]':[deleteButton]
};
globalThis.document={body:get('body'),title:'',getElementById:get,querySelectorAll:selector=>selectorRows[selector]||[],createElement:id=>makeEl(id)};
globalThis.window={addEventListener(){}};
const alerts=[];globalThis.alert=message=>alerts.push(String(message));globalThis.confirm=()=>true;globalThis.prompt=()=>{};
globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
let reloads=0;
globalThis.location={href:'https://hoioracle.com/#scenario',search:'',hash:'#scenario',reload(){reloads++;}};
globalThis.history={replaceState(){}};
Object.defineProperty(globalThis,'navigator',{value:{clipboard:{async writeText(){}}},configurable:true});

const tokenDefaults={schema:7,country:'Germany',operation:'Default',dataPack:null,lastBattle:null};
const seededToken=encodeScenarioShare({...tokenDefaults,country:'France',operation:'Stored Matchup'},tokenDefaults,{gameVersion:'1.19.2'});
store.set('hoi4-war-planner-saved-matchups-v1',JSON.stringify([{id:'seeded',name:'Seeded Matchup',token:seededToken,gameVersion:'1.19.2',createdAt:'2026-09-16T12:00:00.000Z',updatedAt:'2026-09-16T12:00:00.000Z'}]));
store.set('hoi4-war-planner-v7',JSON.stringify({operation:'Local Active',country:'Germany',lastBattle:{winRate:99},attackerDivisions:1,defenderDivisions:1,labDemandCount:1,production:{days:1,factories:1},battlefield:{runs:50,seed:1944}}));

await import('../src/main.js?scenario-library-bootstrap=1');
assert.ok(get('view').innerHTML.includes('Saved matchups'),'Scenario UI must render the named matchup library');
assert.ok(get('view').innerHTML.includes('Seeded Matchup'),'existing saved matchups must render');
assert.equal(typeof get('saveNamedMatchup').onclick,'function','save-current action must be wired');

get('savedMatchupName').value='  Fresh   Local Matchup  ';
get('saveNamedMatchup').onclick();
let library=JSON.parse(store.get('hoi4-war-planner-saved-matchups-v1'));
assert.equal(library.length,2,'saving current matchup should add a second named entry');
const fresh=library.find(x=>x.name==='Fresh Local Matchup');
assert.ok(fresh,'new saved matchup name should be normalized');
const freshPayload=decodeScenarioShare(fresh.token);
assert.equal(freshPayload.gameVersion,'1.19.2');
assert.equal(freshPayload.state.lastBattle,undefined,'saved matchup tokens must not contain cached battle results');
assert.equal(freshPayload.state.dataPack,undefined,'saved matchup tokens must not contain a data pack');

assert.equal(typeof loadButton.onclick,'function','load action must be wired for saved rows');
loadButton.onclick();
assert.equal(reloads,1,'loading a named matchup should reload to reset any runtime data overrides');
const active=JSON.parse(store.get('hoi4-war-planner-v7'));
assert.equal(active.operation,'Stored Matchup');
assert.equal(active.country,'France');
assert.equal(active.dataPack,null,'loaded named matchup must persist the bundled baseline marker');
assert.equal(active.lastBattle,null,'loaded named matchup must not restore cached battle output');
assert.equal(location.hash,'#battle','loaded matchups should return to Division Lab');

console.log('Saved matchup Scenario UI save/load integration passed.');

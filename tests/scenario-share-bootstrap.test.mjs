import assert from 'node:assert/strict';

const store=new Map();
const makeEl=id=>({id,innerHTML:'',value:'',checked:false,dataset:{},style:{},files:[],disabled:false,title:'',onclick:null,onchange:null,classList:{add(){},remove(){},toggle(){}},insertAdjacentHTML(){},remove(){},click(){}});
const elements=new Map();
const get=id=>{if(!elements.has(id))elements.set(id,makeEl(id));return elements.get(id);};
globalThis.document={body:get('body'),title:'',getElementById:get,querySelectorAll:()=>[],createElement:id=>makeEl(id)};
globalThis.window={addEventListener(){}};
globalThis.alert=()=>{};globalThis.confirm=()=>true;globalThis.prompt=()=>{};
globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
let copied='';
try{Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:async value=>{copied=String(value);}}},configurable:true});}
catch{globalThis.navigator.clipboard={writeText:async value=>{copied=String(value);}};}

const base64url=text=>{
  const bytes=new TextEncoder().encode(text);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const token=base64url(JSON.stringify({version:1,gameVersion:'1.19.2',schema:7,state:{country:'France',operation:'Shared Matchup',attackerDivisions:1,defenderDivisions:1,labDemandCount:1,production:{days:1,factories:1},battlefield:{runs:50,seed:1944},dataPack:{malicious:true},lastBattle:{winRate:100}}}));
const href=`https://hoioracle.com/?utm_source=share-test&scenario=${token}#scenario`;
globalThis.location={href,search:`?utm_source=share-test&scenario=${token}`,hash:'#scenario',reload(){}};
let replaced='';
globalThis.history={replaceState(_state,_title,next){replaced=String(next);const url=new URL(next,'https://hoioracle.com/');globalThis.location.href=url.toString();globalThis.location.search=url.search;globalThis.location.hash=url.hash;}};

store.set('hoi4-war-planner-v7',JSON.stringify({operation:'Local Scenario',country:'Germany',attackerDivisions:1,defenderDivisions:1,labDemandCount:1,production:{days:1,factories:1},battlefield:{runs:50,seed:1944}}));

await import('../src/main.js?scenario-share-bootstrap=1');

assert.ok(document.title.includes('Shared Matchup'),'shared URL state must take precedence over local storage for the initial load');
const saved=JSON.parse(store.get('hoi4-war-planner-v7'));
assert.equal(saved.operation,'Shared Matchup','loaded shared state should persist locally after bootstrap');
assert.equal(saved.country,'France');
assert.equal(saved.dataPack,null,'shared state must return to the bundled baseline rather than persist injected pack data');
assert.equal(saved.lastBattle,null,'shared cached battle results must be discarded');
assert.ok(replaced.includes('utm_source=share-test'),'unrelated query parameters should survive share-token cleanup');
assert.ok(!replaced.includes('scenario='),'share token should be removed after one-time load');
assert.ok(get('view').innerHTML.includes('Copy matchup link'),'Scenario UI should expose the share action');

await get('shareState').onclick();
assert.ok(copied.includes('scenario='),'share action should copy a matchup URL on the bundled baseline');
assert.ok(copied.endsWith('#battle'),'copied matchups should open directly in Division Lab');
assert.ok(copied.length<13000,'an initialized near-default planner should stay within the reliable share-link budget');

console.log('Scenario shared-link browser bootstrap test passed.');

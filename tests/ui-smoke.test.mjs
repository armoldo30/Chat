import assert from 'node:assert/strict';

const store=new Map();
const makeEl=id=>({id,innerHTML:'',value:'',checked:false,dataset:{},style:{},files:[],disabled:false,title:'',onclick:null,onchange:null,classList:{add(){},remove(){},toggle(){}},insertAdjacentHTML(){},remove(){},click(){}});
const elements=new Map();
const get=id=>{if(!elements.has(id))elements.set(id,makeEl(id));return elements.get(id);};
globalThis.document={body:get('body'),title:'',getElementById:get,querySelectorAll:()=>[],createElement:id=>makeEl(id)};
globalThis.window={addEventListener(){}};
globalThis.location={hash:'#battle',reload(){}};
globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
globalThis.alert=()=>{};globalThis.confirm=()=>true;

for(const route of ['dashboard','front','intel','battle','tank','air','production','data','scenario']){
  location.hash='#'+route;elements.clear();document.body=get('body');
  await import(`../src/main.js?smoke=${route}`);
  assert.ok(document.title.includes('HOI4 War Planner'),`title should render for ${route}`);
}
console.log('UI route smoke tests passed.');

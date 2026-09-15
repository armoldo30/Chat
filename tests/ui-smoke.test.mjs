import assert from 'node:assert/strict';

const mark=s=>process.stderr.write(`UI_DIAG: ${s}\n`);
mark('module body started');
const store=new Map();
const makeEl=id=>({id,innerHTML:'',value:'',checked:false,dataset:{},style:{},files:[],disabled:false,title:'',onclick:null,onchange:null,classList:{add(){},remove(){},toggle(){}},insertAdjacentHTML(){},remove(){},click(){}});
const elements=new Map();
const get=id=>{if(!elements.has(id))elements.set(id,makeEl(id));return elements.get(id);};
globalThis.document={body:get('body'),title:'',getElementById:get,querySelectorAll:()=>[],createElement:id=>makeEl(id)};
globalThis.window={addEventListener(){}};
globalThis.location={hash:'#battle',reload(){}};
globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
globalThis.alert=()=>{};globalThis.confirm=()=>true;
store.set('hoi4-war-planner-v7',JSON.stringify({attackerDivisions:1,defenderDivisions:1,labDemandCount:1,production:{days:1,factories:1},battlefield:{runs:50,maxHours:4,seed:1944},intelUncertainty:0}));

const data=await import('../src/data.js');mark('after data');
await import('../src/engine.js');mark('after engine');
await import('../src/parser.js');mark('after parser');
await import('../src/gameDataParser.js');mark('after gameDataParser');
const gameData=await import('../src/gameData.js');mark('after gameData');
await import('../src/doctrine.js');mark('after doctrine');
await import('../src/mio.js');mark('after mio');
await import('../src/designer.js');mark('after designer');
const regimental=await import('../src/regimental-support-1192.js');mark('after regimental-support-1192');
await import('../src/tech.js');mark('after tech');
const tank=await import('../src/tank.js');mark('after tank');
const air=await import('../src/air.js');mark('after air');
const builtinModule=await import('../src/builtin1192.js');const pack=builtinModule.default;mark('after builtin1192');
await import('../src/gauntlet-ui.js');mark('after gauntlet-ui');

mark('before hydrateGameData');
const hydration=gameData.hydrateGameData(pack,{battalions:data.battalions,supports:data.supports,equipment:data.equipment,terrain:data.terrain},{year:1940});
mark(`after hydrateGameData ${JSON.stringify(hydration)}`);
mark('before configureTankDataPack');
const tankStatus=tank.configureTankDataPack(pack,1940);mark(`after configureTankDataPack ${JSON.stringify(tankStatus)}`);
mark('before configureAirDataPack');
const airStatus=air.configureAirDataPack(pack,1940);mark(`after configureAirDataPack ${JSON.stringify(airStatus)}`);
mark('before regimental fallback');regimental.applyRegimentalSupportCompatibilityFallback(data.supports);mark('after regimental fallback');

location.hash='#battle';elements.clear();document.body=get('body');
mark('before main import');
await import('../src/main.js?smoke=diag');
mark('after main import');
assert.ok(document.title.includes('HOI4 War Planner'),'title should render for battle');
mark('assertion passed');

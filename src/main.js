import './style.css';
import {DATA_VERSION,RESOURCES,equipment,armyTemplates,terrain,battalions,supports} from './data.js';
import {optimize,projectLine,buildDemand,mergeGoals,calcDivision,setSupportsData,simulateBattle,compareTerrains} from './engine.js';

setSupportsData(supports);
const $=id=>document.getElementById(id);
const saved=JSON.parse(localStorage.getItem('hoi4-war-planner')||'null');
const state=saved||{
 view:'dashboard',country:'Germany',operation:'Operation Barbarossa',
 objectives:[
  {id:1,type:'National focus',name:'Secure the eastern border',due:'1939-09',done:true},
  {id:2,type:'Production',name:'Stockpile infantry equipment',due:'1940-03',done:false},
  {id:3,type:'Diplomacy',name:'Invite Romania to the faction',due:'1940-06',done:false},
  {id:4,type:'Military',name:'Assign three army groups',due:'1941-04',done:false}
 ],
 scenario:{days:180,factories:60,efficiency:35,efficiencyGain:.5,maxEfficiency:50,outputBonus:0,resourceFactor:1},
 goals:[
  {type:'infantry_equipment',stock:1000,target:10000,factories:0,priority:3},
  {type:'artillery',stock:200,target:2500,factories:0,priority:2},
  {type:'support_equipment',stock:100,target:1000,factories:0,priority:2},
  {type:'fighter',stock:500,target:2000,factories:0,priority:1}
 ],
 selected:[{template:'infantry',count:24}],
 attacker:[{type:'infantry',count:9},{type:'artillery',count:1}],defender:[{type:'infantry',count:10}],
 attackerSupports:['engineer','recon'],defenderSupports:['engineer','recon'],
 battlefield:{terrain:'plains',directions:0,entrench:20,fort:0,asupply:1,dsupply:1,air:0,runs:1000}
};
const save=()=>localStorage.setItem('hoi4-war-planner',JSON.stringify(state));

function shell(){
 const complete=state.objectives.filter(x=>x.done).length;
 const progress=Math.round(complete/state.objectives.length*100);
 document.querySelector('#app').innerHTML=`
 <aside class="sidebar"><a class="brand" href="#"><b>W</b><span>War Planner<small>HEARTS OF IRON IV</small></span></a>
 <nav aria-label="Primary navigation">
  ${[['dashboard','▣','Dashboard'],['battle','⚔','Division Lab'],['production','▤','Production'],['scenario','◇','Scenario']].map(([v,i,n])=>`<a href="#${v}" data-view="${v}" class="nav-link ${state.view===v?'active':''}">${i}<span>${n}</span>${v==='battle'?'<i>LAB</i>':''}</a>`).join('')}
  <a href="#research" data-view="research" class="nav-link ${state.view==='research'?'active':''}">◇<span>Research</span></a>
  <a href="#intel" data-view="intel" class="nav-link ${state.view==='intel'?'active':''}">◉<span>Intel</span></a>
 </nav>
 <section class="campaign"><p>CAMPAIGN</p><button id="country">⚑ <span>${state.country}<small>Ironman • 1939</small></span>⌄</button><button class="new" id="rename">＋ New battle plan</button></section></aside>
 <section class="workspace"><header><p>CAMPAIGN <span>/</span> <strong>${state.view.toUpperCase()}</strong></p><button class="profile">L <span>Lucas Meyer</span></button></header><div class="content" id="content"></div></section>`;
 document.querySelectorAll('.nav-link').forEach(a=>a.onclick=e=>{e.preventDefault();state.view=a.dataset.view;save();shell();renderView();});
 $('country').onclick=()=>{state.country=state.country==='Germany'?'Soviet Union':'Germany';save();shell();renderView();};
 $('rename').onclick=()=>{state.operation=prompt('Name your operation',state.operation)||state.operation;save();shell();renderView();};
}

function renderView(){
 const c=$('content');
 if(state.view==='dashboard')return dashboard(c);
 if(state.view==='battle')return battleLab(c);
 if(state.view==='production')return production(c);
 if(state.view==='scenario')return scenarioView(c);
 return roadmap(c,state.view);
}

function dashboard(c){
 const complete=state.objectives.filter(x=>x.done).length,progress=Math.round(complete/state.objectives.length*100);
 c.innerHTML=`<section class="intro"><div><p class="eyebrow">SATURDAY, 1 SEPTEMBER 1939</p><h1>Good morning, Commander.</h1><p>The next 90 days will shape the eastern front.</p></div><button class="primary" id="addObjective">＋ Add objective</button></section>
 <section class="stats"><article><b>♙</b><div><strong>168</strong><small>Divisions in field</small></div><em>+12 this year</em></article><article><b>▥</b><div><strong>${state.scenario.factories}</strong><small>Military factories</small></div><em>planner input</em></article><article><b>♟</b><div><strong>2.14M</strong><small>Available manpower</small></div><em class="loss">planning baseline</em></article></section>
 <section class="cards"><article class="card operation"><p class="eyebrow">ACTIVE OPERATION</p><h2>${state.operation}</h2><p>Coordinate the eastern campaign, then use the Division Lab and Production optimizer to test the force you can actually field.</p><div class="map"><span>BERLIN</span><span>WARSAW</span><span>MINSK</span><i></i><b>➜</b><b>➜</b><small>EASTERN FRONT</small></div><footer><span class="avatars">DATA ${DATA_VERSION}</span> Version-locked analytical baseline <button id="openBattle">Open Division Lab →</button></footer></article>
 <article class="card readiness"><div><p class="eyebrow">CAMPAIGN READINESS</p><h2>${progress}% complete</h2></div><output style="--progress:${progress}%">${progress}%</output><progress max="100" value="${progress}">${progress}%</progress><p>${complete} of ${state.objectives.length} strategic objectives complete</p><button id="viewObjectives">View all objectives</button></article></section>
 <section class="list-heading"><div><p class="eyebrow">UP NEXT</p><h2>Strategic objectives</h2></div><button id="viewObjectives2">View all →</button></section><section class="objectives">${state.objectives.map(o=>`<article class="objective ${o.done?'done':''}"><button class="check" data-id="${o.id}">${o.done?'✓':''}</button><span class="tag">${o.type}</span><strong>${o.name}</strong><span>Due <b>${o.due}</b></span></article>`).join('')}</section>`;
 document.querySelectorAll('.check').forEach(b=>b.onclick=()=>{const o=state.objectives.find(x=>x.id==b.dataset.id);o.done=!o.done;save();renderView();});
 $('addObjective').onclick=()=>{const name=prompt('Objective name');if(!name)return;state.objectives.push({id:Date.now(),type:'Military',name,due:'1940-01',done:false});save();renderView();};
 $('openBattle').onclick=()=>{state.view='battle';save();shell();renderView();};
 $('viewObjectives').onclick=$('viewObjectives2').onclick=()=>document.querySelector('.objectives').scrollIntoView({behavior:'smooth'});
}

function production(c){
 c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">INDUSTRIAL PLANNER</p><h1>Production optimizer</h1><p>Allocate integer factories against equipment targets, efficiency growth and resource availability.</p></div><div class="tool-actions"><button class="btn" id="preview">Preview</button><button class="primary" id="optimize">Optimize factories</button></div></section>
 <section class="panel"><div class="field-grid">${[['days','Days to target','number'],['factories','Military factories','number'],['efficiency','Starting efficiency %','number'],['efficiencyGain','Efficiency gain/day','number'],['maxEfficiency','Efficiency cap %','number'],['outputBonus','Output bonus %','number'],['resourceFactor','Resource availability','number']].map(([id,l,t])=>`<label>${l}<input id="p-${id}" type="${t}" value="${state.scenario[id]}" step="${id==='efficiencyGain'?'.1':id==='resourceFactor'?'.05':'1'}"></label>`).join('')}</div></section>
 <section class="panel"><div class="row"><div><p class="eyebrow">ARMY DEMAND</p><h2>Division requirements</h2></div><button class="btn" id="applyArmy">Apply equipment demand</button></div><div id="armyTable"></div></section>
 <section class="panel"><div class="row"><div><p class="eyebrow">PRODUCTION GOALS</p><h2>Equipment targets</h2></div><button class="btn" id="addGoal">＋ Equipment</button></div><div id="goalTable"></div></section>
 <section class="panel"><div class="row"><div><p class="eyebrow">OPTIMIZER OUTPUT</p><h2>Factory allocation</h2></div></div><div id="prodResult" class="result">Press Preview or Optimize.</div><div id="resourceResult" class="resource-grid"></div></section>`;
 ['days','factories','efficiency','efficiencyGain','maxEfficiency','outputBonus','resourceFactor'].forEach(id=>{const el=$('p-'+id);el.onchange=()=>{state.scenario[id]=+el.value;save();renderProductionTables();runProduction(false);};});
 $('addGoal').onclick=()=>{state.goals.push({type:'infantry_equipment',stock:0,target:1000,factories:0,priority:1});save();renderProductionTables();};
 $('applyArmy').onclick=()=>{state.goals=mergeGoals(state.goals,buildDemand(armyTemplates,state.selected));save();renderProductionTables();runProduction(true);};
 $('preview').onclick=()=>runProduction(false);$('optimize').onclick=()=>runProduction(true);
 renderProductionTables();runProduction(false);
}
function renderProductionTables(){
 $('armyTable').innerHTML=`<table><thead><tr><th>Template</th><th>Count</th><th>Equipment / division</th><th></th></tr></thead><tbody>${state.selected.map((s,i)=>`<tr><td><select data-army="${i}">${Object.entries(armyTemplates).map(([k,v])=>`<option value="${k}" ${k===s.template?'selected':''}>${v.name}</option>`).join('')}</select></td><td><input data-count="${i}" type="number" min="0" value="${s.count}"></td><td>${Object.entries(armyTemplates[s.template].equipment).map(([e,q])=>`${equipment[e]?.name||e}: ${q}`).join('<br>')}</td><td><button class="btn danger" data-delarmy="${i}">×</button></td></tr>`).join('')}</tbody></table><button class="btn" id="addArmy">＋ Template</button>`;
 $('goalTable').innerHTML=`<table><thead><tr><th>Equipment</th><th>Stock</th><th>Target</th><th>IC</th><th>Priority</th><th></th></tr></thead><tbody>${state.goals.map((g,i)=>{const d=equipment[g.type];return `<tr><td><select data-type="${i}">${Object.entries(equipment).map(([k,v])=>`<option value="${k}" ${k===g.type?'selected':''}>${v.name}</option>`).join('')}</select></td><td><input data-stock="${i}" type="number" min="0" value="${g.stock}"></td><td><input data-target="${i}" type="number" min="0" value="${g.target}"></td><td>${d.cost}</td><td><input data-priority="${i}" type="number" min="0" step=".5" value="${g.priority}"></td><td><button class="btn danger" data-delgoal="${i}">×</button></td></tr>`}).join('')}</tbody></table>`;
 $('addArmy').onclick=()=>{state.selected.push({template:'infantry',count:1});save();renderProductionTables();};
 document.querySelectorAll('[data-army]').forEach(e=>e.onchange=()=>{state.selected[+e.dataset.army].template=e.value;save();renderProductionTables();});
 document.querySelectorAll('[data-count]').forEach(e=>e.onchange=()=>{state.selected[+e.dataset.count].count=+e.value;save();});
 document.querySelectorAll('[data-delarmy]').forEach(e=>e.onclick=()=>{state.selected.splice(+e.dataset.delarmy,1);save();renderProductionTables();});
 document.querySelectorAll('[data-type]').forEach(e=>e.onchange=()=>{state.goals[+e.dataset.type].type=e.value;save();renderProductionTables();runProduction(false);});
 document.querySelectorAll('[data-stock]').forEach(e=>e.onchange=()=>{state.goals[+e.dataset.stock].stock=+e.value;save();runProduction(false);});
 document.querySelectorAll('[data-target]').forEach(e=>e.onchange=()=>{state.goals[+e.dataset.target].target=+e.value;save();runProduction(false);});
 document.querySelectorAll('[data-priority]').forEach(e=>e.onchange=()=>{state.goals[+e.dataset.priority].priority=+e.value;save();runProduction(false);});
 document.querySelectorAll('[data-delgoal]').forEach(e=>e.onclick=()=>{state.goals.splice(+e.dataset.delgoal,1);save();renderProductionTables();runProduction(false);});
}
function scenarioInput(){return state.scenario;}
function runProduction(apply){const lines=state.goals.map(g=>({...g,...equipment[g.type]}));const r=apply?optimize(lines,scenarioInput()):{lines:lines.map(x=>projectLine(x,scenarioInput())),used:lines.reduce((a,x)=>a+x.factories,0),shortage:0,resources:{}};if(apply){r.lines.forEach(x=>{const g=state.goals.find(g=>g.type===x.type);if(g)g.factories=x.factories;});save();} $('prodResult').innerHTML=`<p><b>${r.used}/${state.scenario.factories}</b> factories allocated · weighted shortage <b>${Math.round(r.shortage).toLocaleString()}</b></p>${r.lines.map(x=>`<article class="result-row"><b>${equipment[x.type].name}</b><span>${x.factories} factories</span><span>Need ${Math.round(x.need).toLocaleString()}</span><span>＋${Math.round(x.produced).toLocaleString()}</span><strong class="${x.shortage?'bad':'good'}">${x.shortage?'SHORT '+Math.round(x.shortage).toLocaleString():'ON TARGET'}</strong></article>`).join('')}`;const res={};r.lines.forEach(x=>Object.entries(equipment[x.type].resources).forEach(([k,q])=>res[k]=(res[k]||0)+x.produced*q));$('resourceResult').innerHTML=RESOURCES.map(k=>`<span><b>${k}</b> ${Math.round(res[k]||0).toLocaleString()}</span>`).join('');}

function battleLab(c){
 c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">COMBAT ANALYSIS</p><h1>Division Lab</h1><p>Build attacker and defender templates, then test them against terrain, supply, entrenchment, forts and air superiority.</p></div><div class="pill">${DATA_VERSION}</div></section>
 <div class="grid two"><section class="panel"><h2>Attacker</h2><input id="aname" value="${state.attackerName||'Custom Attacker'}"><div id="attUnits"></div><button class="btn" id="addAtt">＋ Line battalion</button><h3>Support companies</h3><div id="attSupports"></div><button class="btn" id="addAttSupport">＋ Support</button><div class="actions"><button class="btn" id="clearAtt">Clear</button><button class="btn" id="saveAtt">Save JSON</button><label class="btn file">Load JSON<input id="loadAtt" type="file" accept="application/json" hidden></label></div></section>
 <section class="panel"><h2>Defender</h2><input id="dname" value="${state.defenderName||'Custom Defender'}"><div id="defUnits"></div><button class="btn" id="addDef">＋ Line battalion</button><h3>Support companies</h3><div id="defSupports"></div><button class="btn" id="addDefSupport">＋ Support</button><div class="actions"><button class="btn" id="clearDef">Clear</button><button class="btn" id="saveDef">Save JSON</button><label class="btn file">Load JSON<input id="loadDef" type="file" accept="application/json" hidden></label></div></section></div>
 <section class="panel"><div class="field-grid">${[['terrain','Terrain'],['directions','Additional attacking directions'],['entrench','Defender entrenchment'],['fort','Fort level'],['asupply','Attacker supply'],['dsupply','Defender supply'],['air','Attacker air superiority'],['runs','Simulation battles']].map(([id,l])=>`<label>${l}${id==='terrain'?`<select id="b-${id}">${Object.entries(terrain).map(([k,v])=>`<option value="${k}" ${state.battlefield.terrain===k?'selected':''}>${v.name}</option>`).join('')}</select>`:id.includes('supply')?`<select id="b-${id}"><option value="1">Fully supplied</option><option value=".8">Moderate shortage</option><option value=".67">Severe shortage</option><option value=".5">Out of supply</option></select>`:`<input id="b-${id}" type="number" value="${state.battlefield[id]}" step="${id==='air'?'.05':'1'}" min="0">`}</label>`).join('')}</div><div class="actions"><button class="primary" id="simulate">⚔ Simulate battle</button><button class="btn" id="compare">Compare all terrain</button></div></section>
 <section class="panel"><h2>Division statistics</h2><div class="stat-columns"><div><h3 id="attTitle">Attacker</h3><div id="attStats" class="statgrid"></div></div><div><h3 id="defTitle">Defender</h3><div id="defStats" class="statgrid"></div></div></div></section>
 <section class="panel"><h2>Combat result</h2><div id="battleResult" class="result">Build divisions and run the simulation.</div></section>`;
 $('b-asupply').value=state.battlefield.asupply;$('b-dsupply').value=state.battlefield.dsupply;
 ['terrain','directions','entrench','fort','asupply','dsupply','air','runs'].forEach(id=>$( 'b-'+id).onchange=()=>{state.battlefield[id]=id==='terrain'?$( 'b-'+id).value:+$( 'b-'+id).value;save();renderBattleTables();});
 $('aname').oninput=e=>{state.attackerName=e.target.value;save();};$('dname').oninput=e=>{state.defenderName=e.target.value;save();};
 $('addAtt').onclick=()=>{state.attacker.push({type:'infantry',count:1});save();renderBattleTables();};$('addDef').onclick=()=>{state.defender.push({type:'infantry',count:1});save();renderBattleTables();};
 $('addAttSupport').onclick=()=>{state.attackerSupports.push('engineer');save();renderBattleTables();};$('addDefSupport').onclick=()=>{state.defenderSupports.push('engineer');save();renderBattleTables();};
 $('clearAtt').onclick=()=>{state.attacker=[];state.attackerSupports=[];save();renderBattleTables();};$('clearDef').onclick=()=>{state.defender=[];state.defenderSupports=[];save();renderBattleTables();};
 $('saveAtt').onclick=()=>download(JSON.stringify({version:DATA_VERSION,name:state.attackerName,units:state.attacker,supports:state.attackerSupports},null,2),'attacker-template.json');$('saveDef').onclick=()=>download(JSON.stringify({version:DATA_VERSION,name:state.defenderName,units:state.defender,supports:state.defenderSupports},null,2),'defender-template.json');
 $('loadAtt').onchange=e=>loadDivision(e,'attacker');$('loadDef').onchange=e=>loadDivision(e,'defender');$('simulate').onclick=()=>runBattle();$('compare').onclick=()=>runCompare();renderBattleTables();
}
function renderBattleTables(){renderSide('attacker','attUnits','attSupports');renderSide('defender','defUnits','defSupports');const a=calcDivision(state.attacker,battalions,state.attackerSupports),d=calcDivision(state.defender,battalions,state.defenderSupports);showDivisionStats('attStats',a);showDivisionStats('defStats',d);$('attTitle').textContent=state.attackerName||'Attacker';$('defTitle').textContent=state.defenderName||'Defender';}
function renderSide(side,unitId,supportId){$(unitId).innerHTML=state[side].map((u,i)=>`<div class="unit"><select data-unit="${side}:${i}">${Object.entries(battalions).map(([k,v])=>`<option value="${k}" ${k===u.type?'selected':''}>${v.name}</option>`).join('')}</select><input data-unitcount="${side}:${i}" type="number" min="0" max="50" value="${u.count}"><button class="btn danger" data-unitdel="${side}:${i}">×</button></div>`).join('');$(supportId).innerHTML=state[side+'Supports'].map((u,i)=>`<div class="unit support"><select data-support="${side}:${i}">${Object.entries(supports).map(([k,v])=>`<option value="${k}" ${k===u?'selected':''}>${v.name}</option>`).join('')}</select><button class="btn danger" data-supportdel="${side}:${i}">×</button></div>`).join('');
 document.querySelectorAll('[data-unit]').forEach(e=>e.onchange=()=>{const [s,i]=e.dataset.unit.split(':');state[s][+i].type=e.value;save();renderBattleTables();});document.querySelectorAll('[data-unitcount]').forEach(e=>e.onchange=()=>{const [s,i]=e.dataset.unitcount.split(':');state[s][+i].count=+e.value;save();renderBattleTables();});document.querySelectorAll('[data-unitdel]').forEach(e=>e.onclick=()=>{const [s,i]=e.dataset.unitdel.split(':');state[s].splice(+i,1);save();renderBattleTables();});document.querySelectorAll('[data-support]').forEach(e=>e.onchange=()=>{const [s,i]=e.dataset.support.split(':');state[s+'Supports'][+i]=e.value;save();renderBattleTables();});document.querySelectorAll('[data-supportdel]').forEach(e=>e.onclick=()=>{const [s,i]=e.dataset.supportdel.split(':');state[s+'Supports'].splice(+i,1);save();renderBattleTables();});}
function showDivisionStats(id,r){const vals=[['Width',r.width.toFixed(1)],['Manpower',r.manpower.toLocaleString()],['Organization',r.org.toFixed(1)],['HP',r.hp.toFixed(1)],['Soft attack',r.soft.toFixed(1)],['Hard attack',r.hard.toFixed(1)],['Defense',r.def.toFixed(1)],['Breakthrough',r.breakthrough.toFixed(1)],['Hardness',(r.hardness*100).toFixed(1)+'%'],['Supply/day',r.supply.toFixed(2)]];$(id).innerHTML=vals.map(([k,v])=>`<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');}
function battleOpts(){return {terrain:state.battlefield.terrain,directions:+state.battlefield.directions,entrench:+state.battlefield.entrench,fort:+state.battlefield.fort,asupply:+state.battlefield.asupply,dsup:+state.battlefield.dsupply,air:+state.battlefield.air,terrainData:terrain,battalions,attacker:state.attacker,defender:state.defender};}
function runBattle(){const a=calcDivision(state.attacker,battalions,state.attackerSupports),d=calcDivision(state.defender,battalions,state.defenderSupports);const r=simulateBattle(a,d,battleOpts(),+state.battlefield.runs);$('battleResult').innerHTML=`<h3>${r.winRate>=50?'Attacker advantage':'Defender advantage'}</h3><div class="bar"><div class="fill" style="width:${r.winRate}%"></div></div><p><b>${r.winRate.toFixed(1)}%</b> attacker wins over ${(+state.battlefield.runs).toLocaleString()} simulated engagements.</p><table><tr><th></th><th>Attacker</th><th>Defender</th></tr><tr><td>Average battle length</td><td colspan="2">${r.avgHours.toFixed(1)} hours</td></tr><tr><td>Ending organization</td><td>${r.attOrg.toFixed(1)}</td><td>${r.defOrg.toFixed(1)}</td></tr></table><p class="small">Terrain width ${terrain[state.battlefield.terrain].width}; directions +${state.battlefield.directions*40}; entrenchment ${state.battlefield.entrench}; forts ${state.battlefield.fort}. This remains an analytical model, not bit-for-bit executable parity.</p>`;}
function runCompare(){const a=calcDivision(state.attacker,battalions,state.attackerSupports),d=calcDivision(state.defender,battalions,state.defenderSupports);const rows=compareTerrains(a,d,battleOpts(),300);$('battleResult').innerHTML=`<h3>Terrain comparison</h3><table><tr><th>Terrain</th><th>Width</th><th>Attacker win %</th><th>Avg hours</th></tr>${rows.map(x=>`<tr><td>${terrain[x.terrain].name}</td><td>${terrain[x.terrain].width}</td><td>${x.results.winRate.toFixed(1)}%</td><td>${x.results.avgHours.toFixed(1)}</td></tr>`).join('')}</table>`;}
function loadDivision(e,side){const f=e.target.files[0];if(!f)return;f.text().then(text=>{try{const p=JSON.parse(text);state[side]=p.units||[];state[side+'Supports']=p.supports||[];state[side+'Name']=p.name||'Loaded Template';save();renderBattleTables();}catch{alert('Invalid template JSON');}});}

function scenarioView(c){c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">CAMPAIGN FILES</p><h1>Scenario management</h1><p>Save the complete planner state locally or export it as JSON.</p></div></section><section class="panel"><div class="actions"><button class="primary" id="saveScenario">Save locally</button><button class="btn" id="exportScenario">Export JSON</button><label class="btn file">Import JSON<input id="importScenario" type="file" accept="application/json" hidden></label><button class="btn danger" id="resetScenario">Reset planner</button></div><div class="notice" id="scenarioNotice">Current scenario is automatically persisted after changes.</div></section><section class="panel"><h2>Current state</h2><div class="statgrid"><div class="stat"><b>${state.objectives.length}</b><span>Objectives</span></div><div class="stat"><b>${state.goals.length}</b><span>Production goals</span></div><div class="stat"><b>${state.attacker.length}</b><span>Attacker battalion types</span></div><div class="stat"><b>${state.defender.length}</b><span>Defender battalion types</span></div></div></section>`;
 $('saveScenario').onclick=()=>{save();$('scenarioNotice').textContent='Scenario saved locally.';};$('exportScenario').onclick=()=>download(JSON.stringify(state,null,2),'hoi4-war-plan.json');$('importScenario').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{Object.assign(state,JSON.parse(t));save();shell();renderView();}catch{alert('Invalid scenario JSON');}})};$('resetScenario').onclick=()=>{if(confirm('Reset the planner to the default campaign?')){localStorage.removeItem('hoi4-war-planner');location.reload();}};
}
function roadmap(c,view){c.innerHTML=`<section class="tool-head"><div><p class="eyebrow">${view.toUpperCase()}</p><h1>${view==='research'?'Research planner':'Intel center'}</h1><p>The navigation is live. This module is reserved for the next data-backed layer rather than pretending to have mechanics that are not implemented yet.</p></div></section><section class="panel"><h2>Next integration</h2><p class="small">The current release already includes the production optimizer, army demand planner, scenario persistence and the Division Lab. Research and intelligence will be connected to the same versioned data layer as those systems.</p></section>`;}
function download(text,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

shell();renderView();
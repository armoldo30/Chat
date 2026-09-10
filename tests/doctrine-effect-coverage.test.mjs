import assert from 'node:assert/strict';
import builtin1192 from '../src/builtin1192.js';

const LAND_UNIT_FIELDS=new Set(['soft_attack','hard_attack','defense','breakthrough','ap_attack','air_attack','maximum_speed','max_organisation','max_strength','combat_width','supply_consumption']);
const LAND_GLOBAL_FIELDS=new Set(['land_night_attack','max_dig_in_factor','planning_speed','max_planning','army_speed_factor','supply_consumption_factor']);
const AIR_UNIT_FIELDS=new Set(['air_agility','air_attack','air_defence','maximum_speed','air_range','air_ground_attack','naval_strike_attack','reliability']);
const AIR_GLOBAL_FIELDS=new Set(['air_superiority_efficiency','air_cas_efficiency','air_cas_present_factor','air_nav_efficiency','air_superiority_detect_factor','air_interception_detect_factor']);
const META=new Set(['folder','name','description','icon','available','visible','ai_will_do','xp_cost','xp_type','track','tracks','mastery','xor','effect','rewards','milestones','enable_tactic']);
const inc=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const summary={land:{nodes:0,rewardNodes:0,milestoneNodes:0,unitFields:{},supportedUnitFields:0,deferredUnitFields:{},globalFields:{},supportedGlobalFields:0,deferredGlobalFields:{}},air:{nodes:0,rewardNodes:0,milestoneNodes:0,unitFields:{},supportedUnitFields:0,deferredUnitFields:{},globalFields:{},supportedGlobalFields:0,deferredGlobalFields:{}},specialForces:{nodes:0},naval:{nodes:0}};

function scanNode(node,domain){
  if(!node||typeof node!=='object'||Array.isArray(node))return;
  const dst=summary[domain];
  for(const [target,value] of Object.entries(node)){
    if(META.has(target))continue;
    if(value&&typeof value==='object'&&!Array.isArray(value)){
      const unitTarget=String(target).startsWith('category_')||!!builtin1192.subUnits?.[target]||(domain==='air'&&['tac_bomber','strat_bomber'].includes(target));
      if(!unitTarget){inc(dst.deferredGlobalFields,`object:${target}`);continue;}
      for(const [field,v] of Object.entries(value)){
        if(v&&typeof v==='object'){inc(dst.deferredUnitFields,`nested:${field}`);continue;}
        inc(dst.unitFields,field);
        const supported=domain==='land'?LAND_UNIT_FIELDS.has(field):AIR_UNIT_FIELDS.has(field);
        if(supported)dst.supportedUnitFields++;else inc(dst.deferredUnitFields,field);
      }
      continue;
    }
    if(typeof value==='number'){
      inc(dst.globalFields,target);
      const supported=domain==='land'?LAND_GLOBAL_FIELDS.has(target):AIR_GLOBAL_FIELDS.has(target);
      if(supported)dst.supportedGlobalFields++;else inc(dst.deferredGlobalFields,target);
    }
  }
}

for(const doc of Object.values(builtin1192.doctrines||{})){
  if(!['grand','subdoctrine'].includes(doc?.kind))continue;
  const folder=doc.kind==='grand'?doc.folder:(builtin1192.doctrines?.[doc.track]?.raw?.folder||null);
  let domain=folder;
  if(!domain&&['infantry','combat_support','armor','operations'].includes(doc.track))domain='land';
  if(!domain&&['fighter_aircraft','strike_aircraft','medium_aircraft','heavy_aircraft'].includes(doc.track))domain='air';
  if(!domain&&['carriers','screens','submarines','capital_ships'].includes(doc.track))domain='naval';
  if(!domain&&String(doc.track||'').startsWith('special_forces'))domain='specialForces';
  if(!summary[domain])continue;
  summary[domain].nodes++;
  if(domain==='land'||domain==='air'){
    scanNode(doc.raw,domain);
    for(const reward of Object.values(doc.raw?.rewards||{})){summary[domain].rewardNodes++;scanNode(reward,domain);}
    for(const milestone of (Array.isArray(doc.raw?.milestones)?doc.raw.milestones:[])){summary[domain].milestoneNodes++;scanNode(milestone,domain);}
  }
}

assert.ok(summary.land.nodes>0&&summary.air.nodes>0);
assert.equal(summary.land.unitFields.supply_consumption>0,true,'source land doctrine corpus contains flat supply_consumption effects');
assert.ok(summary.land.supportedUnitFields>0&&summary.air.supportedUnitFields>0);
console.log('DOCTRINE_EFFECT_COVERAGE',JSON.stringify(summary));
console.log('Doctrine effect coverage measurement passed.');

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import B from '../src/builtin1192.js';

const EXPECTED={
  framesAll:'254de810e30d48a2a555bd0e2b160b2fb95c4ed70dc4ac56640df3b9f977c2a0',
  frameScalars:'5a2ba5070a38cf66e233de48cb45b9fcd8fc3c60a460ce5fd554680548046c8d',
  frameSlots:'1429fdac666322ddf620c7be9bcae8b88494df9727c513a76af4080c84091987',
  modulesAll:'5f02f49541b8a35ff7c92184368892885461d6e8ea1e91f9e65dad3f349c2800',
  moduleStructural:'bf1903d940936b3367b9d45cf59b09d78e2934d2697fc660339e1e68de18f7bd',
  moduleEffects:'acff569c3fe684f076e3fbc21104b6c3816b2bc4b17ec53b845655114b74722b',
  missionEffects:'c3fbe494e2ec487f49f83c4fa9f79a888d50335d3c039db12b8935f50a9a2912'
};
const SOURCE={
  frame:'common/units/equipment/plane_airframes.txt',
  frameSha256:'6bf753c2bd7ac5a79520b43b12331e0e84cd122d997378676d3facf78fa9b05a',
  modules:'common/units/equipment/modules/00_plane_modules.txt',
  moduleSha256:'b077c40bd386b53ea3b6af97acee44247c07056c9476a143de48e7130c74b692'
};

function stable(v){
  if(Array.isArray(v))return v.map(stable);
  if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));
  return v;
}
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const add=(o,k,v)=>{if(v!==undefined)o[k]=v;};
const cleanSlots=slots=>Object.fromEntries(Object.entries(slots||{}).map(([id,s])=>[id,Object.fromEntries(Object.entries(s||{}).filter(([,v])=>v!==undefined))]));

const frameIds=Object.keys(B.equipment||{}).filter(id=>/^(?:cv_)?(?:small|medium|large)_plane_airframe_\d+$/.test(id)).sort();
assert.equal(frameIds.length,21,'all 21 concrete source airframes must remain present');
const frames={};
for(const id of frameIds){
  const e=B.equipment[id],x={id};
  for(const [src,dst] of [['year','year'],['archetype','archetype'],['parent','parent'],['cost','cost'],['reliability','reliability'],['def','def'],['breakthrough','breakthrough'],['hardness','hardness'],['armor','armor'],['soft','soft'],['hard','hard'],['piercing','piercing'],['airAttack','airAttack'],['speed','speed'],['fuel','fuel'],['weight','weight'],['thrust','thrust'],['airDefense','airDefense'],['airAgility','airAgility'],['airRange','airRange'],['groundAttack','groundAttack'],['navalAttack','navalAttack']])add(x,dst,e?.[src]);
  x.resources={...(e?.resources||{})};x.moduleSlots=cleanSlots(e?.moduleSlots);x.moduleSlotsInherit=!!e?.moduleSlotsInherit;
  if(e?.types!==undefined)x.types=[...(e.types||[])];if(e?.upgrades!==undefined)x.upgrades=[...(e.upgrades||[])];frames[id]=x;
}

const airCategories=new Set();
for(const e of Object.values(frames))for(const slot of Object.values(e.moduleSlots||{}))for(const cat of slot.allowed_module_categories||[])airCategories.add(cat);
const moduleIds=Object.keys(B.modules||{}).filter(id=>airCategories.has(B.modules[id]?.category)).sort();
assert.equal(moduleIds.length,94,'all 94 source slot-compatible Air modules must remain present');
const modules={};
for(const id of moduleIds){
  const m=B.modules[id],x={id};
  for(const key of ['category','guiCategory','parent'])add(x,key,m?.[key]);
  x.addStats={...(m?.addStats||{})};x.multiplyStats={...(m?.multiplyStats||{})};x.addAverageStats={...(m?.addAverageStats||{})};x.resources={...(m?.resources||{})};
  x.allowEquipmentType=[...(m?.allowEquipmentType||[])];x.forbidEquipmentType=[...(m?.forbidEquipmentType||[])];x.addEquipmentType=[...(m?.addEquipmentType||[])];
  x.allowedModuleCategories={...(m?.allowedModuleCategories||{})};x.forbidEquipmentTypeExactMatch=[...(m?.forbidEquipmentTypeExactMatch||[])];x.forbidEquipmentTypeExactMatchForCategory={...(m?.forbidEquipmentTypeExactMatchForCategory||{})};
  x.missionTypeStats=(m?.missionTypeStats||[]).map(block=>structuredClone(block));add(x,'xpCost',m?.xpCost);modules[id]=x;
}

const frameScalars={},frameSlots={};
for(const [id,x] of Object.entries(frames)){const {moduleSlots,...rest}=x;frameScalars[id]=rest;frameSlots[id]=moduleSlots;}
const moduleStructural={},moduleEffects={},missionEffects={};
for(const [id,x] of Object.entries(modules)){const {addStats,multiplyStats,addAverageStats,resources,missionTypeStats,...rest}=x;moduleStructural[id]=rest;moduleEffects[id]={addStats,multiplyStats,addAverageStats,resources};missionEffects[id]=missionTypeStats;}

assert.equal(digest(frames),EXPECTED.framesAll,'21/21 Airframe normalized values differ from authoritative 1.19.2 source');
assert.equal(digest(frameScalars),EXPECTED.frameScalars,'Airframe scalar/resource metadata differs from authoritative 1.19.2 source');
assert.equal(digest(frameSlots),EXPECTED.frameSlots,'Airframe slot topology/categories differ from authoritative 1.19.2 source');
assert.equal(digest(modules),EXPECTED.modulesAll,'94/94 Air module normalized values differ from authoritative 1.19.2 source');
assert.equal(digest(moduleStructural),EXPECTED.moduleStructural,'Air module structural metadata differs from authoritative 1.19.2 source');
assert.equal(digest(moduleEffects),EXPECTED.moduleEffects,'Air module base effects/resources differ from authoritative 1.19.2 source');
assert.equal(digest(missionEffects),EXPECTED.missionEffects,'Air module mission effects differ from authoritative 1.19.2 source');
assert.equal(B.meta.airMissionSourceSha256,SOURCE.moduleSha256);

console.log(`1.19.2 Air field-value certification passed: ${frameIds.length}/21 frames and ${moduleIds.length}/94 modules match source fingerprints.`);

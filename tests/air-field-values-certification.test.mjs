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
const EXPECTED_FRAME_RECORDS={
  cv_small_plane_airframe_0:'9750af44605eed414bf1c8cbb23541e52a0f754142676c6d8a89e71962acf8b4',cv_small_plane_airframe_1:'71b0e06829f5bdb3274018b61fc0458a558f25d604cc3c6370b8e7b5b5b52d04',cv_small_plane_airframe_2:'f20e1bcf4624f30a4ce1398c26eef8a0d98edcf7688b2bddc2b0de3ab00a5a67',cv_small_plane_airframe_3:'ef250bf5f05350c96f50fc9a9210bc3cec13758f95a1fd047bcb736db9f6f155',cv_small_plane_airframe_4:'46be62a2b2a355b79c8e53680ce840acb7850b765319228f66524cf37574c23d',
  large_plane_airframe_0:'6795b6cf5d9b585810c9d8cff2e026298adf8a535bed8b194b0cfc9a33c84142',large_plane_airframe_1:'0bd2996ecfd002e74253aaf334e2633636181610f8c92eb8185c612c3199f9bb',large_plane_airframe_2:'a82aaaec4b942eef64995cab0a4dda83566f89fcacefc297e556925b865b98eb',large_plane_airframe_3:'58e62f2632adf2e95bac2d88ea83cfd2c84c07bb1bc9cc74495ee819df8722f5',large_plane_airframe_4:'6dde8791d9df442d1c63872aaecb1b261be865a853fb7d40ac7d5a60665829c7',
  medium_plane_airframe_0:'80673f119839210894f3a25c27e2ffe043ac5e285e423fbfc572527d6b125bbd',medium_plane_airframe_1:'2675fbdfed2bcb05197d53340d68ce33c04b9649cfa9168b073a07d12e60d5cc',medium_plane_airframe_2:'91856d2d2f05d6929e40a9947fa92f96df0f9c7362654c4c2ec6a3fe891a28f2',medium_plane_airframe_3:'6842703cb5a5ac5fd19f4489ae2a3b3783c2a9ad1e43bd92faa3b0d45d2ab79e',medium_plane_airframe_4:'950ab6a9853d7b9978c8fe2de56003ccce3a23eb8e1217fb162d1ac90b24340b',
  small_plane_airframe_0:'f70ac0bc71f9afaafdaea221689787831c59813a28a945cf6e1c1cd8f93fec07',small_plane_airframe_1:'4c05f11035a60a0680e87c936d65efdf2235484b028bd9fde8fda9b8501cd90d',small_plane_airframe_2:'4a457a51c7a6b965490e713ee8c552064b6e6e514b84cd6b65903c29eea12008',small_plane_airframe_3:'4c4e904b3ccd9a9e4cc2aa98aeae61b869ca8d3f1cd9b04a96f723e572d0ac1d',small_plane_airframe_4:'4a67efdc58f2bb61806c108d108e693d973c2cedf52b288246c5e9bf90e591fb',small_plane_airframe_5:'d076b584ecf43712274f431ad08084a4a812c799f72a87a55a20db5084814f77'
};
const SOURCE={frame:'common/units/equipment/plane_airframes.txt',frameSha256:'6bf753c2bd7ac5a79520b43b12331e0e84cd122d997378676d3facf78fa9b05a',modules:'common/units/equipment/modules/00_plane_modules.txt',moduleSha256:'b077c40bd386b53ea3b6af97acee44247c07056c9476a143de48e7130c74b692'};

function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v;}
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
  assert.equal((e?.types||[]).length,0,`${id} must not invent aircraft equipment types on the concrete source frame`);assert.equal((e?.upgrades||[]).length,0,`${id} must not invent aircraft upgrades on the concrete source frame`);frames[id]=x;
}
const frameMismatches=frameIds.filter(id=>digest(frames[id])!==EXPECTED_FRAME_RECORDS[id]);
if(frameMismatches.length)console.error('AIRFRAME_FIELD_MISMATCHES',JSON.stringify(frameMismatches.map(id=>({id,actualHash:digest(frames[id]),expectedHash:EXPECTED_FRAME_RECORDS[id],actual:frames[id]}))));
assert.deepEqual(frameMismatches,[],'one or more concrete Airframe records differ from authoritative 1.19.2 source');

const airCategories=new Set();for(const e of Object.values(frames))for(const slot of Object.values(e.moduleSlots||{}))for(const cat of slot.allowed_module_categories||[])airCategories.add(cat);
const moduleIds=Object.keys(B.modules||{}).filter(id=>airCategories.has(B.modules[id]?.category)).sort();assert.equal(moduleIds.length,94,'all 94 source slot-compatible Air modules must remain present');
const modules={};
for(const id of moduleIds){
  const m=B.modules[id],x={id};for(const key of ['category','guiCategory','parent'])add(x,key,m?.[key]);
  x.addStats={...(m?.addStats||{})};x.multiplyStats={...(m?.multiplyStats||{})};x.addAverageStats={...(m?.addAverageStats||{})};x.resources={...(m?.resources||{})};x.allowEquipmentType=[...(m?.allowEquipmentType||[])];x.forbidEquipmentType=[...(m?.forbidEquipmentType||[])];x.addEquipmentType=[...(m?.addEquipmentType||[])];x.allowedModuleCategories={...(m?.allowedModuleCategories||{})};x.forbidEquipmentTypeExactMatch=[...(m?.forbidEquipmentTypeExactMatch||[])];x.forbidEquipmentTypeExactMatchForCategory={...(m?.forbidEquipmentTypeExactMatchForCategory||{})};x.missionTypeStats=(m?.missionTypeStats||[]).map(block=>structuredClone(block));add(x,'xpCost',m?.xpCost);modules[id]=x;
}

const frameScalars={},frameSlots={};for(const [id,x] of Object.entries(frames)){const {moduleSlots,...rest}=x;frameScalars[id]=rest;frameSlots[id]=moduleSlots;}
const moduleStructural={},moduleEffects={},missionEffects={};for(const [id,x] of Object.entries(modules)){const {addStats,multiplyStats,addAverageStats,resources,missionTypeStats,...rest}=x;moduleStructural[id]=rest;moduleEffects[id]={addStats,multiplyStats,addAverageStats,resources};missionEffects[id]=missionTypeStats;}
assert.equal(digest(frames),EXPECTED.framesAll,'21/21 Airframe normalized values differ from authoritative 1.19.2 source');assert.equal(digest(frameScalars),EXPECTED.frameScalars,'Airframe scalar/resource metadata differs from authoritative 1.19.2 source');assert.equal(digest(frameSlots),EXPECTED.frameSlots,'Airframe slot topology/categories differ from authoritative 1.19.2 source');assert.equal(digest(modules),EXPECTED.modulesAll,'94/94 Air module normalized values differ from authoritative 1.19.2 source');assert.equal(digest(moduleStructural),EXPECTED.moduleStructural,'Air module structural metadata differs from authoritative 1.19.2 source');assert.equal(digest(moduleEffects),EXPECTED.moduleEffects,'Air module base effects/resources differ from authoritative 1.19.2 source');assert.equal(digest(missionEffects),EXPECTED.missionEffects,'Air module mission effects differ from authoritative 1.19.2 source');assert.equal(B.meta.airMissionSourceSha256,SOURCE.moduleSha256);
console.log(`1.19.2 Air field-value certification passed: ${frameIds.length}/21 frames and ${moduleIds.length}/94 modules match source fingerprints.`);

import r01 from './builtin1192raw/r01.js';
import r02 from './builtin1192raw/r02.js';
import r03 from './builtin1192raw/r03.js';
import r04 from './builtin1192raw/r04.js';
import r05 from './builtin1192raw/r05.js';
import r06 from './builtin1192raw/r06.js';
import r07 from './builtin1192raw/r07.js';
import r08 from './builtin1192raw/r08.js';
import r09 from './builtin1192raw/r09.js';
import r10 from './builtin1192raw/r10.js';
import r11 from './builtin1192raw/r11.js';
import r12 from './builtin1192raw/r12.js';
import r13 from './builtin1192raw/r13.js';
import r14 from './builtin1192raw/r14.js';
import r15 from './builtin1192raw/r15.js';
import r16 from './builtin1192raw/r16.js';
import r17 from './builtin1192raw/r17.js';
import r18 from './builtin1192raw/r18.js';
import r19 from './builtin1192raw/r19.js';
import r20 from './builtin1192raw/r20.js';
import r21 from './builtin1192raw/r21.js';
import r22 from './builtin1192raw/r22.js';
import tankModulesA from './builtin1192/tank-modules-a.js';
import tankModulesB from './builtin1192/tank-modules-b.js';
import tankModuleRequirements from './builtin1192/tank-module-requirements.js';
import moduleSlotCategories1192 from './builtin1192/module-slot-categories-1192.js';

const text=[r01,r02,r03,r04,r05,r06,r07,r08,r09,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22].join('');
export const BUILTIN_1192_LOADER_MODE='plain-json-modules';
export const BUILTIN_1192=JSON.parse(text);
BUILTIN_1192.modules={...(BUILTIN_1192.modules||{}),...tankModulesA,...tankModulesB};
for(const [id,slots] of Object.entries(moduleSlotCategories1192)){
  const equipment=BUILTIN_1192.equipment?.[id];
  if(!equipment)continue;
  for(const [slotId,categories] of Object.entries(slots)){
    const current=equipment.moduleSlots?.[slotId]||{};
    equipment.moduleSlots={...(equipment.moduleSlots||{}),[slotId]:{...current,allowed_module_categories:categories}};
    const rawSlots=equipment.raw?.module_slots||{};
    const rawCurrent=rawSlots?.[slotId]||{};
    equipment.raw={...(equipment.raw||{}),module_slots:{...rawSlots,[slotId]:{...rawCurrent,allowed_module_categories:categories}}};
  }
}
BUILTIN_1192.requirements=BUILTIN_1192.requirements||{};
BUILTIN_1192.requirements.modules={...(BUILTIN_1192.requirements.modules||{}),...tankModuleRequirements};
const requirementRelationships=Object.values(BUILTIN_1192.requirements).reduce((total,group)=>total+Object.values(group||{}).reduce((n,list)=>n+(Array.isArray(list)?list.length:0),0),0);
BUILTIN_1192.meta={...(BUILTIN_1192.meta||{}),moduleCount:Object.keys(BUILTIN_1192.modules).length,requirementIndex:true,requirementRecords:requirementRelationships,repeatedBlockParserFix:true,moduleSlotListsCertified:true};
export default BUILTIN_1192;

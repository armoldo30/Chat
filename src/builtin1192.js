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
import tankModuleCompatibility1192 from './builtin1192/tank-module-compatibility-1192.js';
import moduleSlotCategories1192 from './builtin1192/module-slot-categories-1192.js';
import duplicateArchetypes1192 from './builtin1192/duplicate-archetypes-tank-1192.js';
import landEquipment1192 from './builtin1192/land-equipment-1192.js';
import landCruiserCountLimits1192 from './builtin1192/land-cruiser-count-limits-1192.js';
import { materializeDuplicateArchetypes } from './parser.js';

const text=[r01,r02,r03,r04,r05,r06,r07,r08,r09,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22].join('');
export const BUILTIN_1192_LOADER_MODE='plain-json-modules';
export const BUILTIN_1192=JSON.parse(text);
BUILTIN_1192.modules={...(BUILTIN_1192.modules||{}),...tankModulesA,...tankModulesB};
for(const [id,rule] of Object.entries(tankModuleCompatibility1192)){
  const module=BUILTIN_1192.modules?.[id];if(!module)continue;
  Object.assign(module,rule);
  module.raw={...(module.raw||{}),
    ...(rule.allowedModuleCategories?{allowed_module_categories:rule.allowedModuleCategories}:{}),
    ...(rule.forbidEquipmentTypeExactMatch?{forbid_equipment_type_exact_match:rule.forbidEquipmentTypeExactMatch}:{}),
    ...(rule.forbidEquipmentTypeExactMatchForCategory?{forbid_equipment_type_exact_match_for_category:rule.forbidEquipmentTypeExactMatchForCategory}:{}),
    ...(rule.forbidEquipmentType?{forbid_equipment_type:rule.forbidEquipmentType}:{})};
}
BUILTIN_1192.equipment={...(BUILTIN_1192.equipment||{}),...landEquipment1192};
BUILTIN_1192.duplicateArchetypes={...(BUILTIN_1192.duplicateArchetypes||{}),...duplicateArchetypes1192};
materializeDuplicateArchetypes(BUILTIN_1192.equipment,BUILTIN_1192.duplicateArchetypes);
for(const id of ['land_cruiser_chassis','land_cruiser_chassis_1'])if(BUILTIN_1192.equipment?.[id])BUILTIN_1192.equipment[id].moduleCountLimits=landCruiserCountLimits1192.map(x=>({...x}));
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
for(const module of Object.values(BUILTIN_1192.modules||{}))if(!Array.isArray(module.missionTypeStats)&&module.raw?.mission_type_stats)module.missionTypeStats=[module.raw.mission_type_stats];
BUILTIN_1192.requirements=BUILTIN_1192.requirements||{};
BUILTIN_1192.requirements.modules={...(BUILTIN_1192.requirements.modules||{}),...tankModuleRequirements};
const requirementRelationships=Object.values(BUILTIN_1192.requirements).reduce((total,group)=>total+Object.values(group||{}).reduce((n,list)=>n+(Array.isArray(list)?list.length:0),0),0);
const materializedDuplicateEquipmentCount=Object.values(BUILTIN_1192.equipment||{}).filter(item=>item?.duplicateOf).length;
const equipmentCount=Object.keys(BUILTIN_1192.equipment||{}).length;
const staticEquipmentCount=equipmentCount-materializedDuplicateEquipmentCount;
BUILTIN_1192.meta={...(BUILTIN_1192.meta||{}),moduleCount:Object.keys(BUILTIN_1192.modules).length,equipmentCount,staticEquipmentCount,materializedDuplicateEquipmentCount,requirementIndex:true,requirementRecords:requirementRelationships,repeatedBlockParserFix:true,moduleSlotListsCertified:true,tankModuleCompatibilityCertified:true,duplicateArchetypeCount:Object.keys(BUILTIN_1192.duplicateArchetypes).length,landEquipmentSupplementCount:Object.keys(landEquipment1192).length,landCruiserCountLimitsCertified:true,airMissionStatBlocksCertified:false,airDuplicateArchetypesCertified:false};
export default BUILTIN_1192;
